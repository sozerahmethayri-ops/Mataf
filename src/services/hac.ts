// Hac modu mantığı (saf işlevler, testli): hac günlerinin tarihleri, Arafat/Harem sınırı denetimi,
// şeytan taşlama sayacı ve atış vakitleri. Sınır verisi OpenStreetMap'ten (src/data/osm/hacSites.ts), yaklaşıktır.
import { ARAFAT_AREA, HARAM_BOUNDARY, MINA_AREA, type LL2 } from '@/data/osm/hacSites';
import { toHijri } from './hijri';

const DAY = 864e5;
const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n, 12);

// ── Hac günleri ──
export type HajjDay = { dh: number; date: Date };
export type HajjCal = { days: HajjDay[]; arefe: Date };

/** Bu yılın (Zilhicce 1–13 içindeysek) ya da sıradaki haccın 8–13 Zilhicce günleri (Ümmü'l-Kurâ takvimi). */
export function hajjCalendar(from: Date, scanDays = 400): HajjCal | null {
  const base = addDays(from, 0);
  const h = toHijri(base);
  let day8: Date | null = null;
  if (h.m === 12 && h.d >= 1 && h.d <= 13) day8 = addDays(base, 8 - h.d);
  else {
    for (let i = 1; i <= scanDays && !day8; i++) {
      const d = addDays(base, i);
      const x = toHijri(d);
      if (x.m === 12 && x.d === 8) day8 = d;
    }
  }
  if (!day8) return null;
  const days = [0, 1, 2, 3, 4, 5].map((k) => ({ dh: 8 + k, date: addDays(day8!, k) }));
  return { days, arefe: days[1].date };
}

/** Hac günlerine en çok `maxDays` gün kala ya da hac günlerindeyken takvim (ana sayfa için ucuz denetim). */
export function hajjSoon(now: Date, maxDays = 12): (HajjCal & { phase: HajjPhase }) | null {
  const h = toHijri(addDays(now, 0));
  if (!((h.m === 12 && h.d <= 13) || (h.m === 11 && h.d >= 30 - maxDays))) return null;
  const cal = hajjCalendar(now, 45);
  if (!cal) return null;
  const phase = hajjPhase(now, cal);
  if (phase.kind === 'after' || (phase.kind === 'before' && phase.days > maxDays)) return null;
  return { ...cal, phase };
}

const sameDay = (a: Date, b: Date) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

export type HajjPhase = { kind: 'before'; days: number } | { kind: 'during'; dh: number } | { kind: 'after' };
/** Bugün hac günlerinin neresindeyiz? "before" → Arefe'ye kalan gün. */
export function hajjPhase(now: Date, cal: HajjCal): HajjPhase {
  const d = cal.days.find((x) => sameDay(x.date, now));
  if (d) return { kind: 'during', dh: d.dh };
  if (now.getTime() < cal.days[0].date.getTime()) {
    return { kind: 'before', days: Math.round((addDays(cal.arefe, 0).getTime() - addDays(now, 0).getTime()) / DAY) };
  }
  return { kind: 'after' };
}

// ── Sınır denetimi ──
type LL = { lat: number; lng: number };

export function insidePoly(p: LL, poly: LL2[]) {
  let c = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [yi, xi] = poly[i];
    const [yj, xj] = poly[j];
    if (yi > p.lat !== yj > p.lat && p.lng < ((xj - xi) * (p.lat - yi)) / (yj - yi) + xi) c = !c;
  }
  return c;
}

/** Noktanın çokgen kenarına uzaklığı (m, yerel düzlem). */
export function edgeDistM(p: LL, poly: LL2[]) {
  const kx = 111320 * Math.cos((p.lat * Math.PI) / 180);
  const ky = 110540;
  const px = p.lng * kx;
  const py = p.lat * ky;
  let best = Infinity;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const ax = poly[j][1] * kx, ay = poly[j][0] * ky;
    const bx = poly[i][1] * kx, by = poly[i][0] * ky;
    const dx = bx - ax, dy = by - ay;
    const L2 = dx * dx + dy * dy || 1;
    const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / L2));
    best = Math.min(best, Math.hypot(px - ax - t * dx, py - ay - t * dy));
  }
  return best;
}

export type ZoneState = 'inside' | 'near' | 'outside';
export type ZoneCheck = { state: ZoneState; inside: boolean; edgeM: number };

/** İçeride/dışarıda; sınıra (pay ya da GPS hatası kadar) yakınsa "near" — o zaman tabelalara bakılmalı. */
export function zoneCheck(p: LL, poly: LL2[], accuracyM = 0, marginM = 100): ZoneCheck {
  const inside = insidePoly(p, poly);
  const edgeM = edgeDistM(p, poly);
  const pad = Math.max(marginM, accuracyM || 0);
  return { inside, edgeM, state: edgeM < pad ? 'near' : inside ? 'inside' : 'outside' };
}

export const arafatCheck = (p: LL, accuracyM = 0) => zoneCheck(p, ARAFAT_AREA, accuracyM, 100);
export const haramCheck = (p: LL, accuracyM = 0) => zoneCheck(p, HARAM_BOUNDARY, accuracyM, 75);
export const minaCheck = (p: LL, accuracyM = 0) => zoneCheck(p, MINA_AREA, accuracyM, 75);

// ── Şeytan taşlama ──
export type CemreId = 'kucuk' | 'orta' | 'akabe';
export const CEMRE_IDS: CemreId[] = ['kucuk', 'orta', 'akabe'];
export type EidDay = 1 | 2 | 3 | 4;
export type CemreCount = Record<CemreId, number>;
export const emptyCount = (): CemreCount => ({ kucuk: 0, orta: 0, akabe: 0 });

/** Bayramın 1. günü yalnız Akabe; 2.–4. günler üçü sırayla. */
export const cemrelerFor = (day: EidDay): CemreId[] => (day === 1 ? ['akabe'] : CEMRE_IDS);
export const dayDone = (c: CemreCount, day: EidDay) => cemrelerFor(day).every((id) => c[id] >= 7);
export const dayThrown = (c: CemreCount, day: EidDay) => cemrelerFor(day).reduce((s, id) => s + c[id], 0);

export type ThrowEvent = 'ok' | 'cemre-done' | 'day-done' | 'full' | 'not-today';
export type ThrowResult = { counts: CemreCount; event: ThrowEvent; orderWarn: boolean };

export function throwPebble(c: CemreCount, day: EidDay, id: CemreId): ThrowResult {
  const list = cemrelerFor(day);
  if (!list.includes(id)) return { counts: c, event: 'not-today', orderWarn: false };
  if (c[id] >= 7) return { counts: c, event: 'full', orderWarn: false };
  // Sıra (küçük → orta → büyük) Hanefîlere göre sünnet: engellemez, uyarır
  const orderWarn = list.slice(0, list.indexOf(id)).some((x) => c[x] < 7);
  const counts = { ...c, [id]: c[id] + 1 };
  const event: ThrowEvent = counts[id] === 7 ? (dayDone(counts, day) ? 'day-done' : 'cemre-done') : 'ok';
  return { counts, event, orderWarn };
}

export function undoPebble(c: CemreCount, id: CemreId): CemreCount {
  return c[id] > 0 ? { ...c, [id]: c[id] - 1 } : c;
}

/** Toplam taş: bayramın 4. günü Mina'da kalınırsa 70, kalınmazsa 49. */
export const pebblesTotal = (stay13: boolean) => (stay13 ? 70 : 49);

export type DayTimes = { fajr: Date; sunrise: Date; dhuhr: Date; maghrib: Date };
export type ThrowWindow = { from: Date; to: Date; earlyFrom?: Date };

/**
 * Hanefî atış vakti: 1. gün (Akabe) imsaktan ertesi imsaka; 2.–3. gün öğleden (zeval) ertesi imsaka;
 * 4. gün öğleden güneş batışına (Ebû Hanîfe'ye göre bu gün öğleden önce de caiz: earlyFrom).
 */
export function throwWindow(day: EidDay, today: DayTimes, tomorrow: DayTimes): ThrowWindow {
  if (day === 1) return { from: today.fajr, to: tomorrow.fajr };
  if (day === 4) return { from: today.dhuhr, to: today.maghrib, earlyFrom: today.fajr };
  return { from: today.dhuhr, to: tomorrow.fajr };
}

export type WindowState = 'before' | 'early' | 'open' | 'after';
export function windowState(now: Date, w: ThrowWindow): WindowState {
  const t = now.getTime();
  if (t >= w.to.getTime()) return 'after';
  if (t >= w.from.getTime()) return 'open';
  if (w.earlyFrom && t >= w.earlyFrom.getTime()) return 'early';
  return 'before';
}

/** Şu an hangi bayram gününün atışı? İmsaktan önceyse bir önceki günün vakti sürer. dh 10–13 → 1–4. */
export function eidDayAt(now: Date, cal: HajjCal, fajrToday: Date): EidDay | null {
  const ref = now.getTime() < fajrToday.getTime() ? addDays(now, -1) : now;
  const d = cal.days.find((x) => sameDay(x.date, ref));
  if (!d || d.dh < 10) return null;
  return (d.dh - 9) as EidDay;
}
