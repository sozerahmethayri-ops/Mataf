import type { Mosque } from '@/services/mosques';

export type MosqueMapProps = {
  user: { lat: number; lng: number };
  mosques: Mosque[];
  selectedId?: string;
  route?: { latitude: number; longitude: number }[];
  onSelect?: (id: string) => void;
};
