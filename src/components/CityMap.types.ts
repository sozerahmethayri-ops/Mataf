import type { Poi } from '@/services/osm';

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
};
