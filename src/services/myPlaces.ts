// Yerlerim: kullanıcının kaydettiği yerler (Mina'daki çadır, buluşma noktası, otopark…). Yalnız bu telefonda.
import { useCallback } from 'react';

import { usePersisted } from './usePersisted';

export type PlaceKind = 'tent' | 'meet' | 'car' | 'pin';
export type MyPlace = { id: string; name: string; note?: string; lat: number; lng: number; at: number; kind: PlaceKind };
export const PLACES_KEY = 'places:v1';
const MAX = 30;

/** "Çadırım" gibi hazır adlardan tür tahmini (simge ve renk için) */
export function guessKind(name: string): PlaceKind {
  const n = name.toLocaleLowerCase('tr');
  if (/çadır|cadir|tent|خيمة/.test(n)) return 'tent';
  if (/buluş|bulus|meet|toplan|لقاء/.test(n)) return 'meet';
  if (/otopark|araba|araç|arac|otobüs|otobus|park|car|bus|سيارة|حافلة/.test(n)) return 'car';
  return 'pin';
}

const newId = () => Math.random().toString(36).slice(2, 10);

export function useMyPlaces() {
  const [st, set, ready] = usePersisted<{ items: MyPlace[] }>(PLACES_KEY, { items: [] });
  const add = useCallback((p: Omit<MyPlace, 'id' | 'at' | 'kind'> & { kind?: PlaceKind }) => {
    const item: MyPlace = { ...p, name: p.name.trim().slice(0, 60), note: p.note?.trim().slice(0, 120) || undefined, id: newId(), at: Date.now(), kind: p.kind ?? guessKind(p.name) };
    set({ items: [item, ...st.items].slice(0, MAX) });
    return item;
  }, [set, st.items]);
  const remove = useCallback((id: string) => set({ items: st.items.filter((x) => x.id !== id) }), [set, st.items]);
  return { places: st.items, ready, add, remove };
}

/** Google Haritalar bağlantısı (WhatsApp'ta paylaşmak için; her telefonda açılır) */
export const shareLink = (p: { lat: number; lng: number }) => `https://maps.google.com/?q=${p.lat.toFixed(6)},${p.lng.toFixed(6)}`;
