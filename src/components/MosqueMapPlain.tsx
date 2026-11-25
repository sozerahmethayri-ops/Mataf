// En yakın cami haritasının sade sürümü (Android: uygulama içi online harita; web önizlemesi: sade harita).
import { C } from '@/constants/theme';
import type { MosqueMapProps } from './MosqueMap.types';
import { OnlineMap } from './OnlineMap';

export function MosqueMapPlain({ user, mosques, selectedId, route, onSelect }: MosqueMapProps) {
  const sel = mosques.find((m) => m.id === selectedId) ?? mosques[0];
  // Kullanıcı ve seçili cami birlikte görünsün: uzaktaki camiler çerçeveyi büyütmesin
  const near = mosques.slice(0, 25).filter((m) => m.id === sel?.id || Math.hypot(m.lat - user.lat, (m.lng - user.lng) * Math.cos((user.lat * Math.PI) / 180)) * 111320 < 1500);
  return (
    <OnlineMap
      fitUser
      fitKey={`${sel?.id ?? ''}:${route?.length ?? 0}`}
      user={user}
      center={user}
      selectedId={sel?.id}
      pins={near.map((m) => ({ id: m.id, lat: m.lat, lng: m.lng, color: m.id === sel?.id ? C.accent : C.green, label: m.name || undefined }))}
      lines={route && route.length > 1 ? [{ coords: route.map((r) => ({ lat: r.latitude, lng: r.longitude })), color: C.route }] : []}
      onPin={onSelect}
    />
  );
}
