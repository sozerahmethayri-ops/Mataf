// Sa'y için konum akışı: Mes'a'daysanız gerçek GPS (saniyede bir); değilseniz hiçbir şey kendiliğinden
// ilerlemez ('away'). Önizleme yürüyüşü yalnız kullanıcı açarsa ('demo'): Safâ ile Merve arasında gidip gelir.
import * as Location from 'expo-location';
import { useEffect, useRef, useState } from 'react';

import { toLocal } from '@/data/sites';
import { MASA_LENGTH, nearMasa, pointOnMasa, type SayFix } from './say';

export type SayFeedSource = 'gps' | 'away' | 'demo';
const nearOk = (f: SayFix | null) => !!f && nearMasa(f.p) && f.acc < 80;

export function useSayFeed(opts: { walking: boolean; speed: number; forceDemo?: boolean; onFix: (f: SayFix) => void }) {
  const { walking, speed, forceDemo } = opts;
  const cb = useRef(opts.onFix);
  useEffect(() => { cb.current = opts.onFix; });
  const [denied, setDenied] = useState(false);
  const [lastGps, setLastGps] = useState<SayFix | null>(null);
  const source: SayFeedSource = forceDemo ? 'demo' : nearOk(lastGps) ? 'gps' : 'away';

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
          const f: SayFix = { p: toLocal('makkah', l.coords.latitude, l.coords.longitude), acc: l.coords.accuracy ?? 50, t: l.timestamp || Date.now() };
          setLastGps(f);
          if (!forceDemo && nearOk(f)) cb.current(f);
        },
      );
    })().catch(() => alive && setDenied(true));
    return () => { alive = false; sub?.remove(); };
  }, [forceDemo]);

  // Önizleme: Safâ'da başlar, 1,2 m/sn × hız çarpanıyla gidip gelir, uçlarda 4 sn durur
  const demo = useRef({ s: 4, dir: 1, wait: 0, t: 0 });
  useEffect(() => {
    if (source !== 'demo') return;
    const id = setInterval(() => {
      const d = demo.current;
      d.t += 1000 * speed; // sayacın en kısa şavt süresi kuralı önizlemede de işlesin diye zaman da hızlanır
      if (walking) {
        if (d.wait > 0) d.wait -= 1;
        else {
          d.s += 1.2 * speed * d.dir;
          if (d.s >= MASA_LENGTH - 4) { d.s = MASA_LENGTH - 4; d.dir = -1; d.wait = 4; }
          if (d.s <= 4) { d.s = 4; d.dir = 1; d.wait = 4; }
        }
      }
      const q = pointOnMasa(d.s);
      const j = () => (Math.random() - 0.5) * 3;
      cb.current({ p: [q[0] + j(), q[1] + j()], acc: 6, t: d.t });
    }, 1000);
    return () => clearInterval(id);
  }, [source, walking, speed]);

  return { denied, source, lastGps };
}
