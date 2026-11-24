// Tavaf asistanı için konum akışı: gerçek GPS (saniyede bir) ya da demo yürüyüş.
// Ölçümler doğrudan geri çağrıya verilir; ekran durumu orada günceller (efekt içinde senkron setState yok).
import * as Location from 'expo-location';
import { useEffect, useRef, useState } from 'react';

import { toLocal } from '@/data/sites';
import { pointAt, type Fix } from './tawaf';

export type FeedSource = 'gps' | 'demo';
export const DEMO_RADIUS = 24;

/** Mescid-i Haram'da mıyız? (Kâbe'ye 300 m'den yakın ve ölçüm makul) */
export const nearKaaba = (f: Fix | null) => !!f && Math.hypot(f.p[0], f.p[1]) < 300 && f.acc < 80;

/**
 * Mescid-i Haram'daysanız gerçek GPS ölçümleri, değilseniz demo yürüyüş geri çağrıya verilir.
 * `walking`: demo yürüyüşü ilerlesin mi (hazırlıkta yerinde durur).
 */
export function useTawafFeed(opts: { walking: boolean; speed: number; forceDemo?: boolean; onFix: (f: Fix) => void }) {
  const { walking, speed, forceDemo } = opts;
  const cb = useRef(opts.onFix);
  useEffect(() => { cb.current = opts.onFix; });
  const [denied, setDenied] = useState(false);
  const [lastGps, setLastGps] = useState<Fix | null>(null);
  const source: FeedSource = !forceDemo && nearKaaba(lastGps) ? 'gps' : 'demo';
  const useGps = useRef(false);
  useEffect(() => { useGps.current = source === 'gps'; });

  // Gerçek GPS: her zaman dinlenir (Mescid'de olup olmadığımızı anlamak için de gerekir)
  useEffect(() => {
    let sub: Location.LocationSubscription | undefined;
    let alive = true;
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') { if (alive) setDenied(true); return; }
      sub = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.BestForNavigation, timeInterval: 1000, distanceInterval: 0 },
        (l) => {
          if (!alive) return;
          const f: Fix = { p: toLocal('makkah', l.coords.latitude, l.coords.longitude), acc: l.coords.accuracy ?? 50, t: l.timestamp || Date.now() };
          setLastGps(f);
          if (useGps.current || (!forceDemo && nearKaaba(f))) cb.current(f);
        },
      );
    })().catch(() => alive && setDenied(true));
    return () => { alive = false; sub?.remove(); };
  }, [forceDemo]);

  // Demo: Kâbe çevresinde 24 m yarıçapta, saatin tersine 0,8 m/sn yürüyüş (hız çarpanıyla)
  const demoDeg = useRef(-38);
  useEffect(() => {
    if (source !== 'demo') return;
    const id = setInterval(() => {
      if (walking) demoDeg.current += ((0.8 * speed) / DEMO_RADIUS) * (180 / Math.PI);
      const jitter = () => (Math.random() - 0.5) * 2.4;
      const q = pointAt(demoDeg.current, DEMO_RADIUS);
      cb.current({ p: [q[0] + jitter(), q[1] + jitter()], acc: 6, t: Date.now() });
    }, 1000);
    return () => clearInterval(id);
  }, [source, walking, speed]);

  return { denied, source, lastGps };
}
