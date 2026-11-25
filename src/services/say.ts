// Sa'y sayacı: Safâ–Merve arası 7 şavt. Saf fonksiyonlar (React'e bağlı değil); scripts/check-logic.ts test eder.
//
// Yerel koordinatlar Mekke için sites.ts ile aynı (metre; x doğu, y güney; merkez Kâbe).
// Safâ ve Merve uçları Mes'a'nın OSM dış hattından (Mescid-i Haram'ın doğu kanadı) okundu; Safâ güneyde,
// Merve kuzeyde, aradaki eksen ≈390 m. Konum, eksen üzerindeki izdüşümle (0 = Safâ, L = Merve) izlenir.
//
// Kurallar (Hanefî): sa'y Safâ'dan başlar, Merve'de biter. Safâ → Merve bir şavt, Merve → Safâ bir şavt.
// Merve'den başlanırsa o ilk yol sayılmaz.
import type { Pt } from '@/data/sites';

export const SAFA: Pt = [118, 84];
export const MARWA: Pt = [88, -306];
export const SAY_TOTAL = 7;

const ax = [MARWA[0] - SAFA[0], MARWA[1] - SAFA[1]];
export const MASA_LENGTH = Math.hypot(ax[0], ax[1]);
const ux = ax[0] / MASA_LENGTH;
const uy = ax[1] / MASA_LENGTH;

/** Eksen üzerindeki konum (m, Safâ'dan) ve eksene uzaklık (m). */
export function project(p: Pt) {
  const dx = p[0] - SAFA[0];
  const dy = p[1] - SAFA[1];
  return { s: dx * ux + dy * uy, lat: Math.abs(dx * uy - dy * ux) };
}
/** Eksen üzerindeki s noktasının yerel koordinatı. */
export const pointOnMasa = (s: number): Pt => [SAFA[0] + ux * s, SAFA[1] + uy * s];

/** Mes'a'da mıyız? (eksenden en çok 80 m — Kâbe ≈110 m uzakta —, uçlardan en çok 120 m dışarıda) */
export function nearMasa(p: Pt) {
  const { s, lat } = project(p);
  return lat < 80 && s > -120 && s < MASA_LENGTH + 120;
}

export type SayFix = { p: Pt; acc: number; t: number };
export type SayQuality = 'good' | 'weak' | 'none';
export type SayState = {
  started: boolean;
  laps: number; // tamamlanan şavt
  /** Şu an gidilen uç (başladıktan sonra): tek şavtlarda Merve, çiftlerde Safâ */
  toward: 'marwa' | 'safa';
  s?: number; // yumuşatılmış konum (m)
  win: number[]; // son ölçümler (medyan için)
  lastLapT?: number;
  quality: SayQuality;
  /** Başlamadan önce görülen son uç */
  seenEnd?: 'safa' | 'marwa';
  wrongStart?: boolean;
};
export type SayEvent = { type: 'start' } | { type: 'lap'; laps: number } | { type: 'done' } | { type: 'wrongStart' };

export const initialSay = (): SayState => ({ started: false, laps: 0, toward: 'marwa', win: [], quality: 'none' });

/** Uç bölgesi: uca bu kadar yaklaşınca o uca varılmış sayılır (tepe ve dönüş alanı ≈25 m, GPS payıyla). */
const END = 35;
/** Başlamak için Safâ'dan bu kadar uzaklaşmak gerekir. */
const LEAVE = 70;
/** İki şavt arası en kısa süre (sn): 390 m'yi koşarak bile ~2 dakikadan kısa sürede yürümek olası değil. */
const MIN_LAP_S = 75;

export function stepSay(st: SayState, f: SayFix): { st: SayState; events: SayEvent[] } {
  const events: SayEvent[] = [];
  const { s: raw, lat } = project(f.p);
  if (f.acc > 45 || lat > 65 || raw < -90 || raw > MASA_LENGTH + 90) {
    return { st: { ...st, quality: f.acc > 60 ? 'none' : 'weak' }, events };
  }
  // Son 5 ölçümün medyanı: tek tük sıçramalar uç bölgesine yanlışlıkla "vardırmasın"
  const win = [...st.win, raw].slice(-5);
  const s = [...win].sort((a, b) => a - b)[Math.floor(win.length / 2)];
  const next: SayState = { ...st, win, s, quality: 'good' };
  const atSafa = s < END;
  const atMarwa = s > MASA_LENGTH - END;

  if (!st.started) {
    if (atSafa) return { st: { ...next, seenEnd: 'safa', wrongStart: false }, events };
    if (atMarwa) return { st: { ...next, seenEnd: 'marwa' }, events };
    // Safâ'dan ayrılıp Merve'ye doğru yürümeye başladı → sa'y başladı
    if (st.seenEnd === 'safa' && s > LEAVE && win.length >= 3) {
      events.push({ type: 'start' });
      return { st: { ...next, started: true, laps: 0, toward: 'marwa', lastLapT: f.t }, events };
    }
    // Merve'den Safâ'ya yürüyor: bu yol sayılmaz, bir kez uyar
    if (st.seenEnd === 'marwa' && s < MASA_LENGTH - LEAVE && !st.wrongStart) {
      events.push({ type: 'wrongStart' });
      return { st: { ...next, wrongStart: true }, events };
    }
    return { st: next, events };
  }

  const longEnough = st.lastLapT === undefined || (f.t - st.lastLapT) / 1000 >= MIN_LAP_S;
  const arrived = st.toward === 'marwa' ? atMarwa : atSafa;
  if (arrived && longEnough && win.length >= 3 && st.laps < SAY_TOTAL) {
    const laps = st.laps + 1;
    events.push(laps >= SAY_TOTAL ? { type: 'done' } : { type: 'lap', laps });
    return { st: { ...next, laps, toward: st.toward === 'marwa' ? 'safa' : 'marwa', lastLapT: f.t }, events };
  }
  return { st: next, events };
}

/** Elle başlat: kullanıcı Safâ'da olduğunu onaylar. */
export const startSayManual = (st: SayState, t = 0): SayState => ({ ...st, started: true, laps: 0, toward: 'marwa', lastLapT: t, wrongStart: false });

/** Elle düzeltme: +1 / -1 (yön şavt sayısından çıkar). */
export function adjustSay(st: SayState, d: 1 | -1, t = 0): SayState {
  const laps = Math.max(0, Math.min(SAY_TOTAL, st.laps + d));
  return { ...st, started: true, laps, toward: laps % 2 === 0 ? 'marwa' : 'safa', lastLapT: t };
}

/** Şu anki şavtın yönü: 1., 3., 5., 7. şavt Safâ → Merve. */
export const lapDirection = (lapIndex: number): 'toMarwa' | 'toSafa' => (lapIndex % 2 === 0 ? 'toMarwa' : 'toSafa');

/** Şavt içindeki ilerleme (0–1), harita çubuğu için. */
export function sayProgress(st: SayState) {
  if (st.s === undefined) return undefined;
  return Math.max(0, Math.min(1, st.s / MASA_LENGTH));
}
