// Namaz vakti yeri: "Konumum" (varsayılan; konum yoksa Mekke), Mekke ya da Medine.
// Konumun adı (ilçe, şehir) cihazın adres çözücüsünden, olmazsa Photon'dan alınır ve saklanır.
// Hesaplama yöntemi seçilmemişse saat dilimine göre tahmin edilir (Türkiye → Diyanet).
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { useEffect, useState } from 'react';

import { uaHeaders } from './cache';
import { useCoarseLocation, type Fix } from './location';
import { PLACES, guessMethod, type MethodId } from './prayer';
import { usePersisted } from './usePersisted';

export type PlaceId = 'auto' | 'makkah' | 'madinah';
export type PrayerLoc = { lat: number; lng: number; tz?: string; here: boolean };

async function placeName(f: Fix, lang: string): Promise<string> {
  const key = `place:name:${f.lat.toFixed(2)},${f.lng.toFixed(2)}:${lang}`;
  const hit = await AsyncStorage.getItem(key);
  if (hit) return hit;
  let name = '';
  try {
    const [a] = await Location.reverseGeocodeAsync({ latitude: f.lat, longitude: f.lng });
    if (a) name = [a.district || a.subregion, a.city || a.region].filter(Boolean).filter((v, i, arr) => arr.indexOf(v) === i).join(', ');
  } catch { /* web ya da servis yok */ }
  if (!name) {
    try {
      const r = await fetch(`https://photon.komoot.io/reverse?lat=${f.lat}&lon=${f.lng}&lang=${lang === 'tr' ? 'default' : lang === 'ar' ? 'default' : 'en'}`, { headers: uaHeaders() });
      const j = (await r.json()) as { features?: { properties: Record<string, string | undefined> }[] };
      const p = j.features?.[0]?.properties;
      if (p) name = [p.district || p.locality, p.city || p.county || p.state].filter(Boolean).filter((v, i, arr) => arr.indexOf(v) === i).join(', ');
    } catch { /* çevrimdışı */ }
  }
  if (name) await AsyncStorage.setItem(key, name);
  return name;
}

export function usePrayerPlace(lang: string) {
  const [st, setSt] = usePersisted<{ place: PlaceId }>('prayer:place', { place: 'auto' });
  const { fix, denied } = useCoarseLocation(st.place === 'auto');
  const [method, setMethodState] = useState<MethodId>(guessMethod());
  const [name, setName] = useState('');
  useEffect(() => {
    AsyncStorage.getItem('mataf.method').then((m) => m && setMethodState(m as MethodId)).catch(() => undefined);
  }, []);
  const latKey = fix ? fix.lat.toFixed(2) : '';
  const lngKey = fix ? fix.lng.toFixed(2) : '';
  useEffect(() => {
    if (!fix) return;
    let alive = true;
    placeName(fix, lang).then((n) => alive && setName(n)).catch(() => undefined);
    return () => { alive = false; };
  }, [latKey, lngKey, lang]); // eslint-disable-line react-hooks/exhaustive-deps

  const here = st.place === 'auto' && !!fix;
  const loc: PrayerLoc = here ? { lat: fix!.lat, lng: fix!.lng, here: true }
    : st.place === 'madinah' ? { ...PLACES.madinah, here: false } : { ...PLACES.makkah, here: false };
  const m: MethodId = here ? method : 'UmmAlQura';
  const label = here ? name : st.place === 'madinah' ? 'madinah' : 'makkah';
  return { place: st.place, setPlace: (p: PlaceId) => setSt({ place: p }), loc, method: m, label, denied, waiting: st.place === 'auto' && !fix && !denied };
}
