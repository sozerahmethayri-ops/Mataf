// Otel kaydı (şehir başına bir tane): konum + ad, adres, oda, telefon, Arapça ad.
// Eski sürümlerin okuduğu anahtar (`mataf.hotel.<şehir>`, {lat,lng}) korunur; ek alanlar aynı nesnede durur.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import type { City } from '@/data/sites';

export type Hotel = { lat: number; lng: number; name?: string; nameAr?: string; address?: string; room?: string; phone?: string };
export const hotelKey = (c: City) => `mataf.hotel.${c}`;

export async function readHotel(c: City): Promise<Hotel | null> {
  try {
    const raw = await AsyncStorage.getItem(hotelKey(c));
    if (!raw) return null;
    const h = JSON.parse(raw) as Hotel;
    return typeof h.lat === 'number' && typeof h.lng === 'number' ? h : null;
  } catch {
    return null;
  }
}

/** Şehrin oteli; ekran her öne geldiğinde yeniden okunur (başka ekran değiştirmiş olabilir). */
export function useHotel(city: City) {
  const [hotel, setHotel] = useState<Hotel | null>(null);
  const [loaded, setLoaded] = useState(false);
  useFocusEffect(useCallback(() => {
    let alive = true;
    readHotel(city).then((h) => { if (alive) { setHotel(h); setLoaded(true); } });
    return () => { alive = false; };
  }, [city]));
  const save = useCallback((h: Hotel | null) => {
    setHotel(h);
    if (h) AsyncStorage.setItem(hotelKey(city), JSON.stringify(h)).catch(() => undefined);
    else AsyncStorage.removeItem(hotelKey(city)).catch(() => undefined);
  }, [city]);
  return { hotel, loaded, save };
}
