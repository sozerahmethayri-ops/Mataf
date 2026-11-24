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

/** Kullanıcının mescide göre yerel konumu; 2 km'den uzaksa demo konum kullanılır. */
export function localPosition(city: City, fix: Fix | null): { pos: Pt; demo: boolean } {
  if (fix) {
    const p = toLocal(city, fix.lat, fix.lng);
    if (dist(p, [0, 0]) < 2000) return { pos: p, demo: false };
  }
  return { pos: DEMO_START[city], demo: true };
}

export function useHeading(enabled = true) {
  const [heading, setHeading] = useState<number | null>(null);
  useEffect(() => {
    if (!enabled) return;
    let sub: Location.LocationSubscription | undefined;
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      sub = await Location.watchHeadingAsync((h) => setHeading(h.trueHeading >= 0 ? h.trueHeading : h.magHeading));
    })().catch(() => undefined);
    return () => sub?.remove();
  }, [enabled]);
  return heading;
}
