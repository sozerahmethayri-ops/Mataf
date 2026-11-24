// Ulaşım haritasının sade sürümü (anahtarsız Android derlemesi ve web önizlemesi): rota bacakları renkleriyle.
import { C } from '@/constants/theme';
import type { TransportMapProps } from './TransportMap.types';
import { PlainMap } from './PlainMap';

export function TransportMapPlain({ user, dest, segments, onLongPress }: TransportMapProps) {
  return (
    <PlainMap
      user={user}
      center={user ?? dest ?? { lat: 21.4225, lng: 39.8262 }}
      selectedId={dest ? 'dest' : undefined}
      pins={dest ? [{ id: 'dest', lat: dest.lat, lng: dest.lng, color: C.accent, label: dest.name, big: true }] : []}
      lines={segments.map((s) => ({ coords: s.coords, color: s.color, dashed: s.dashed, width: s.dashed ? 4 : 6 }))}
      onLongPress={onLongPress}
    />
  );
}
