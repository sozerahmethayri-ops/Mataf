// Güneş ve ayın gökyüzündeki yeri (suncalc 2: açılar derece, yön kuzeyden saat yönünde). İnternet gerekmez.
// Çizim penceresi şu andan 8 saat önce başlar, 16 saat sonra biter: geçen kısım solda az, gelecek sağda çok;
// sıradaki vakit her zaman pencerenin içindedir.
import { getMoonIllumination, getMoonPosition, getMoonTimes, getPosition } from 'suncalc';

import { PRAYERS, times, type MethodId, type PrayerKey } from './prayer';

type Lang = 'tr' | 'en' | 'ar';
export type SkySample = { t: number; alt: number };
export type SkyNow = {
  sun: { alt: number; az: number };
  moon: { alt: number; az: number; fraction: number; phase: number; waxing: boolean };
  moonRise?: Date;
  moonSet?: Date;
};

const HOUR = 3600e3;

export type SkyMark = { key: PrayerKey; at: Date };
export type SkyDay = { start: number; end: number; marks: SkyMark[]; sun: SkySample[]; moon: SkySample[]; sunMax: number; moonMax: number };

/** Pencere: (şu an − 8 sa) … (şu an + 16 sa); 10 dakikaya yuvarlanır. Güneş 10, ay 15 dakikada bir örneklenir. */
export function skyDay(now: Date, lat: number, lng: number, method: MethodId): SkyDay {
  const step = 10 * 60e3;
  const start = Math.floor(now.getTime() / step) * step - 8 * HOUR;
  const end = start + 24 * HOUR;
  const sun: SkySample[] = [];
  const moon: SkySample[] = [];
  for (let t = start; t <= end; t += step) sun.push({ t, alt: getPosition(new Date(t), lat, lng).altitude });
  for (let t = start; t <= end; t += 15 * 60e3) moon.push({ t, alt: getMoonPosition(new Date(t), lat, lng).altitude });
  const marks: SkyMark[] = [];
  for (const d of [-1, 0, 1]) {
    const tt = times(lat, lng, method, new Date(now.getTime() + d * 24 * HOUR));
    for (const k of PRAYERS) {
      const at = tt[k];
      if (at.getTime() >= start && at.getTime() <= end && !marks.some((m) => m.key === k && Math.abs(m.at.getTime() - at.getTime()) < HOUR)) marks.push({ key: k, at });
    }
  }
  marks.sort((a, b) => a.at.getTime() - b.at.getTime());
  let sunMax = -90;
  for (const x of sun) if (x.alt > sunMax) sunMax = x.alt;
  let moonMax = -90;
  for (const x of moon) if (x.alt > moonMax) moonMax = x.alt;
  return { start, end, marks, sun, moon, sunMax, moonMax };
}

export function skyNow(now: Date, lat: number, lng: number): SkyNow {
  const s = getPosition(now, lat, lng);
  const m = getMoonPosition(now, lat, lng);
  const il = getMoonIllumination(now);
  const mt = getMoonTimes(now, lat, lng);
  return {
    sun: { alt: s.altitude, az: s.azimuth },
    moon: { alt: m.altitude, az: m.azimuth, fraction: il.fraction, phase: il.phase, waxing: il.waxing },
    moonRise: mt.rise,
    moonSet: mt.set,
  };
}

/** Ay evresinin adı (0 yeni ay, 0,25 ilk dördün, 0,5 dolunay, 0,75 son dördün). */
export function moonPhaseName(phase: number, lang: Lang) {
  const p = ((phase % 1) + 1) % 1;
  const i = p < 0.03 || p >= 0.97 ? 0 : p < 0.22 ? 1 : p < 0.28 ? 2 : p < 0.47 ? 3 : p < 0.53 ? 4 : p < 0.72 ? 5 : p < 0.78 ? 6 : 7;
  const N = {
    tr: ['Yeni ay', 'Hilal (büyüyen)', 'İlk dördün', 'Şişkin ay (büyüyen)', 'Dolunay', 'Şişkin ay (küçülen)', 'Son dördün', 'Hilal (küçülen)'],
    en: ['New moon', 'Waxing crescent', 'First quarter', 'Waxing gibbous', 'Full moon', 'Waning gibbous', 'Last quarter', 'Waning crescent'],
    ar: ['محاق', 'هلال متزايد', 'التربيع الأول', 'أحدب متزايد', 'بدر', 'أحدب متناقص', 'التربيع الأخير', 'هلال متناقص'],
  };
  return N[lang][i];
}

/** Sekiz yönden biri, cümle içinde ("güneybatıda"). */
export function directionText(az: number, lang: Lang) {
  const i = Math.round((((az % 360) + 360) % 360) / 45) % 8;
  const N = {
    tr: ['kuzeyde', 'kuzeydoğuda', 'doğuda', 'güneydoğuda', 'güneyde', 'güneybatıda', 'batıda', 'kuzeybatıda'],
    en: ['north', 'northeast', 'east', 'southeast', 'south', 'southwest', 'west', 'northwest'],
    ar: ['في الشمال', 'في الشمال الشرقي', 'في الشرق', 'في الجنوب الشرقي', 'في الجنوب', 'في الجنوب الغربي', 'في الغرب', 'في الشمال الغربي'],
  };
  return N[lang][i];
}

/** "ufkun 34° üstünde" / "ufkun 12° altında" */
export function altitudeText(alt: number, lang: Lang) {
  const d = Math.abs(Math.round(alt));
  if (lang === 'en') return alt >= 0 ? `${d}° above the horizon` : `${d}° below the horizon`;
  if (lang === 'ar') return alt >= 0 ? `${d}° فوق الأفق` : `${d}° تحت الأفق`;
  return alt >= 0 ? `ufkun ${d}° üstünde` : `ufkun ${d}° altında`;
}

/** Ayın aydınlık kısmını çizen SVG yolu (kuzey yarıkürede görüldüğü gibi; büyürken sağı aydınlık). */
export function moonLitPath(cx: number, cy: number, r: number, fraction: number, waxing: boolean, south = false) {
  const f = Math.min(1, Math.max(0, fraction));
  if (f < 0.01) return '';
  const rx = Math.max(0.001, r * Math.abs(1 - 2 * f));
  const right = waxing !== south; // güney yarıkürede görünüş aynalanır
  const T = `${cx} ${cy - r}`;
  const B = `${cx} ${cy + r}`;
  if (right) return `M ${T} A ${r} ${r} 0 0 1 ${B} A ${rx} ${r} 0 0 ${f < 0.5 ? 0 : 1} ${T} Z`;
  return `M ${T} A ${r} ${r} 0 0 0 ${B} A ${rx} ${r} 0 0 ${f < 0.5 ? 1 : 0} ${T} Z`;
}

/** Gökyüzü rengi için güneşin durumu: gündüz, alacakaranlık (−12°…6°), gece. */
export function skyPhase(sunAlt: number): 'day' | 'twilight' | 'night' {
  return sunAlt >= 6 ? 'day' : sunAlt >= -12 ? 'twilight' : 'night';
}
