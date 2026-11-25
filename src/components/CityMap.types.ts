import type { Poi, PoiCat } from '@/services/osm';

export const POI_COLORS: Record<PoiCat, string> = {
  hotel: '#7C3AED', food: '#B45309', pharmacy: '#0F766E', bus: '#1D4ED8', taxi: '#A16207', hospital: '#B42318',
};

export type LatLngLite = { latitude: number; longitude: number };

export type CityMapProps = {
  center: { lat: number; lng: number };
  pois: Poi[];
  hotel?: { lat: number; lng: number } | null;
  gates: { id: string; no: string; lat: number; lng: number; closed: boolean }[];
  route?: LatLngLite[];
  onLongPress?: (p: { lat: number; lng: number }) => void;
  onPoiPress?: (p: Poi) => void;
  onGatePress?: (id: string) => void;
  /** Haritayı örten üst/alt paneller (px). */
  padding?: { top: number; bottom: number; left: number; right: number };
};
