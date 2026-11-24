// Şehir haritasının sade sürümü (anahtarsız Android derlemesi ve web önizlemesi).
import { C } from '@/constants/theme';
import { POI_COLORS, type CityMapProps } from './CityMap.types';
import { PlainMap } from './PlainMap';

export function CityMapPlain({ center, pois, hotel, gates, route, onLongPress, onPoiPress, onGatePress }: CityMapProps) {
  const pins = [
    ...pois.map((p) => ({ id: `p:${p.id}`, lat: p.lat, lng: p.lng, color: POI_COLORS[p.cat], label: p.name || undefined })),
    ...gates.map((g) => ({ id: `g:${g.id}`, lat: g.lat, lng: g.lng, color: g.closed ? C.closed : C.open, label: `Kapı ${g.no}` })),
    ...(hotel ? [{ id: 'hotel', lat: hotel.lat, lng: hotel.lng, color: '#7C3AED', label: 'Otelim', big: true }] : []),
  ];
  return (
    <PlainMap
      pins={pins}
      center={center}
      lines={route && route.length > 1 ? [{ coords: route.map((r) => ({ lat: r.latitude, lng: r.longitude })), color: C.route }] : []}
      onLongPress={onLongPress}
      onPin={(id) => {
        if (id.startsWith('p:')) { const p = pois.find((q) => `p:${q.id}` === id); if (p) onPoiPress?.(p); }
        else if (id.startsWith('g:')) onGatePress?.(id.slice(2));
      }}
    />
  );
}
