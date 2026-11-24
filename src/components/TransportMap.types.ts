import type { LatLng } from '@/services/transport';

export type MapSeg = { coords: LatLng[]; color: string; dashed?: boolean };
export type TransportMapProps = {
  user: LatLng | null;
  dest: (LatLng & { name?: string }) | null;
  segments: MapSeg[];
  /** Haritaya uzun basınca o noktayı hedef yap. */
  onLongPress?: (p: LatLng) => void;
  /** Değişince harita kullanıcı + hedef + rotayı kapsayacak şekilde yeniden çerçevelenir. */
  fitKey?: string;
};
