import * as Location from 'expo-location';
import { useEffect, useState } from 'react';

import { DEMO_START, dist, toLocal, type City, type Pt } from '@/data/sites';

export type Fix = { lat: number; lng: number; accuracy?: number | null };

/** Ön plan konum izni + canlı konum. İzin yoksa `null` döner. */
export function useLocation(enabled = true) {
  const [fix, setFix] = useState<Fix | null>(null);
  const [denied, setDenied] = useState(false);
  useEffect(() => {
    if (!enabled) return;
    let sub: Location.LocationSubscription | undefined;
    let alive = true;
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') { setDenied(true); return; }
      sub = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.BestForNavigation, distanceInterval: 2, timeInterval: 2000 },
        (l) => alive && setFix({ lat: l.coords.latitude, lng: l.coords.longitude, accuracy: l.coords.accuracy }),
      );
    })().catch(() => setDenied(true));
    return () => { alive = false; sub?.remove(); };
  }, [enabled]);
  return { fix, denied };
}

/** Hafif konum: açılışta bir kez (son bilinen, sonra dengeli doğruluk) ve 10 dakikada bir. Ana sayfa ve vakitler için. */
export function useCoarseLocation(enabled = true) {
  const [fix, setFix] = useState<Fix | null>(null);
  const [denied, setDenied] = useState(false);
  useEffect(() => {
    if (!enabled) return;
    let alive = true;
    const read = async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') { if (alive) setDenied(true); return; }
      const last = await Location.getLastKnownPositionAsync().catch(() => null);
      if (last && alive) setFix({ lat: last.coords.latitude, lng: last.coords.longitude, accuracy: last.coords.accuracy });
      const cur = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      if (alive) setFix({ lat: cur.coords.latitude, lng: cur.coords.longitude, accuracy: cur.coords.accuracy });
    };
    read().catch(() => undefined);
    const id = setInterval(() => read().catch(() => undefined), 10 * 60e3);
    return () => { alive = false; clearInterval(id); };
  }, [enabled]);
  return { fix, denied };
}

/** Kâbe'ye / Mescid-i Nebevî'ye büyük daire uzaklığı (km). */
export function kmTo(city: City, fix: Fix) {
  const [lat2, lng2] = city === 'makkah' ? [21.4225, 39.8262] : [24.4672, 39.6111];
  const r = Math.PI / 180;
  const a = Math.sin(((lat2 - fix.lat) * r) / 2) ** 2 + Math.cos(fix.lat * r) * Math.cos(lat2 * r) * Math.sin(((lng2 - fix.lng) * r) / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(a));
}

/** Kullanıcının mescide göre yerel konumu; 2 km'den uzaksa demo konum kullanılır. */
export function localPosition(city: City, fix: Fix | null): { pos: Pt; demo: boolean } {
  if (fix) {
    const p = toLocal(city, fix.lat, fix.lng);
    if (dist(p, [0, 0]) < 2000) return { pos: p, demo: false };
  }
  return { pos: DEMO_START[city], demo: true };
}

/**
 * Pusula yönü (°): titremesin diye düşük geçirgen süzgeçle yumuşatılır (açı sarması dikkate alınır),
 * 0,8°'den küçük değişimler yok sayılır ve ekran en çok ~15 kez/sn güncellenir. Gerçek kuzey bir kez
 * geçerli gelirse hep o kullanılır (gerçek/manyetik arasında gidip gelmek sapma kadar sıçratıyordu).
 */
export function useHeading(enabled = true) {
  const [heading, setHeading] = useState<number | null>(null);
  useEffect(() => {
    if (!enabled) return;
    let sub: Location.LocationSubscription | undefined;
    let smooth: number | null = null;
    let shown: number | null = null;
    let useTrue = false;
    let lastEmit = 0;
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      sub = await Location.watchHeadingAsync((h) => {
        if (h.trueHeading >= 0) useTrue = true;
        const raw = useTrue ? (h.trueHeading >= 0 ? h.trueHeading : null) : h.magHeading;
        if (raw == null || Number.isNaN(raw)) return;
        if (smooth == null) smooth = raw;
        else {
          const d = ((raw - smooth + 540) % 360) - 180;
          smooth = (smooth + d * (Math.abs(d) > 30 ? 0.5 : 0.18) + 360) % 360;
        }
        const now = Date.now();
        const delta = shown == null ? 999 : Math.abs(((smooth - shown + 540) % 360) - 180);
        if (delta < 0.8 || now - lastEmit < 66) return;
        lastEmit = now;
        shown = smooth;
        setHeading(Math.round(smooth * 10) / 10);
      });
    })().catch(() => undefined);
    return () => sub?.remove();
  }, [enabled]);
  return heading;
}
