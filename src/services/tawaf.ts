// Tavaf asistanının çekirdeği: Kâbe geometrisi, bölgeler ve şavt sayacı.
// Saf fonksiyonlar — React'e bağlı değil; scripts/check-logic.ts gürültülü GPS izleriyle test eder.
//
// Yerel koordinatlar: metre, x doğu, y güney, merkez Kâbe (sites.ts ile aynı).
// Kâbe ölçüleri: uzun duvarlar (kapı duvarı ve karşısı) 12,86 m, kısa duvarlar 11,03 m, yükseklik 13,1 m.
// Uzun eksen pusulada ~151° (Kanopus doğuşu / yaz gündönümü hizası; Hawkins & King 1982):
// Hacerü'l-Esved köşesi ~109° (doğu-güneydoğu), Rükn-i Irâkî ~11° (kuzey),
// Rükn-i Şâmî ~289° (batı-kuzeybatı), Rükn-i Yemânî ~191° (güney). Konumlar yaklaşıktır.
import type { Pt } from '@/data/sites';

export const KAABA = { long: 12.86, short: 11.03, height: 13.1, axis: 151 };

const RAD = Math.PI / 180;
/** Pusula açısı → yerel birim vektör (doğu, güney). */
export const dirOf = (bearing: number): Pt => [Math.sin(bearing * RAD), -Math.cos(bearing * RAD)];
const add = (...ps: Pt[]): Pt => ps.reduce<Pt>((a, p) => [a[0] + p[0], a[1] + p[1]], [0, 0]);
const mul = (p: Pt, s: number): Pt => [p[0] * s, p[1] * s];
export const mod360 = (a: number) => ((a % 360) + 360) % 360;
const wrap180 = (a: number) => mod360(a + 180) - 180;

/** Yerel noktanın Kâbe merkezine göre pusula açısı (0 = kuzey, saat yönünde). */
export const bearingOf = (p: Pt) => mod360(Math.atan2(p[0], -p[1]) / RAD);

const hl = KAABA.long / 2;
const hs = KAABA.short / 2;
const ax = KAABA.axis;
export const CORNERS = {
  aswad: add(mul(dirOf(ax), hl), mul(dirOf(ax - 90), hs)),
  iraqi: add(mul(dirOf(ax + 180), hl), mul(dirOf(ax - 90), hs)),
  shami: add(mul(dirOf(ax + 180), hl), mul(dirOf(ax + 90), hs)),
  yamani: add(mul(dirOf(ax), hl), mul(dirOf(ax + 90), hs)),
};
/** Kâbe tabanı, tavaf yönünde (yukarıdan bakınca saat yönünün tersi): Hacerü'l-Esved → Irâkî → Şâmî → Yemânî. */
export const KAABA_POLY: Pt[] = [CORNERS.aswad, CORNERS.iraqi, CORNERS.shami, CORNERS.yamani];

/** Tavaf ilerlemesi: Hacerü'l-Esved hizasından saat yönünün tersine derece [0, 360). */
export const progressOf = (p: Pt) => mod360(bearingOf(CORNERS.aswad) - bearingOf(p));
export const CORNER_PROGRESS = {
  aswad: 0,
  iraqi: progressOf(CORNERS.iraqi),
  shami: progressOf(CORNERS.shami),
  yamani: progressOf(CORNERS.yamani),
};

// Kapı (kuzeydoğu duvarı, Hacerü'l-Esved köşesine yakın) — yaklaşık
const doorWall = { from: CORNERS.aswad, to: CORNERS.iraqi };
const along = (a: Pt, b: Pt, m: number): Pt => {
  const L = Math.hypot(b[0] - a[0], b[1] - a[1]);
  return [a[0] + ((b[0] - a[0]) * m) / L, a[1] + ((b[1] - a[1]) * m) / L];
};
export const DOOR = { center: along(doorWall.from, doorWall.to, 3.4), width: 1.9, bottom: 2.2, top: 5.3 };
/** Makam-ı İbrâhîm: kapının karşısında, duvardan ~11 m (yaklaşık). */
export const MAQAM: Pt = add(along(doorWall.from, doorWall.to, 4.9), mul(dirOf(ax - 90), 11));

/** Hicr-i İsmâil (Hatîm) duvarı: kuzeybatı duvarının önünde yarım elips bant, ~1,3 m yüksek. */
export function hijrBand(): { outer: Pt[]; inner: Pt[]; mid: Pt[] } {
  const m: Pt = mul(add(CORNERS.iraqi, CORNERS.shami), 0.5);
  const n = dirOf(ax + 180); // duvarın dış normali (~331°)
  const t = dirOf(ax + 90); // Irâkî → Şâmî yönü
  const arc = (a: number, b: number) => {
    const out: Pt[] = [];
    const th0 = Math.asin(Math.min(1, 2.2 / a));
    for (let i = 0; i <= 24; i++) {
      const th = th0 + ((Math.PI - 2 * th0) * i) / 24;
      out.push(add(m, mul(n, a * Math.sin(th)), mul(t, -b * Math.cos(th))));
    }
    return out;
  };
  return { outer: arc(9.96, 6.9), inner: arc(8.44, 5.4), mid: arc(9.2, 6.15) };
}

// ── Bölgeler ───────────────────────────────────────────
export type ZoneId = 'start' | 'door' | 'iraqi' | 'hijr' | 'shami' | 'west' | 'yamani' | 'rabbana';
export const ZONE_ORDER: ZoneId[] = ['start', 'door', 'iraqi', 'hijr', 'shami', 'west', 'yamani', 'rabbana'];

const CW = 10; // köşe bölgesinin yarı genişliği (°)
export function zoneOf(progress: number): ZoneId {
  const p = mod360(progress);
  const { iraqi, shami, yamani } = CORNER_PROGRESS;
  if (p >= 354 || p < 8) return 'start';
  if (p < iraqi - CW) return 'door';
  if (p < iraqi + CW) return 'iraqi';
  if (p < shami - CW) return 'hijr';
  if (p < shami + CW) return 'shami';
  if (p < yamani - CW) return 'west';
  if (p < yamani + CW) return 'yamani';
  return 'rabbana';
}
/** Bölgenin ilerleme aralığı (harita üzerinde vurgulamak için). */
export function zoneRange(z: ZoneId): [number, number] {
  const { iraqi, shami, yamani } = CORNER_PROGRESS;
  switch (z) {
    case 'start': return [-6, 8];
    case 'door': return [8, iraqi - CW];
    case 'iraqi': return [iraqi - CW, iraqi + CW];
    case 'hijr': return [iraqi + CW, shami - CW];
    case 'shami': return [shami - CW, shami + CW];
    case 'west': return [shami + CW, yamani - CW];
    case 'yamani': return [yamani - CW, yamani + CW];
    case 'rabbana': return [yamani + CW, 354];
  }
}
/** Verilen yarıçapta, ilerleme açısındaki yerel nokta. */
export function pointAt(progress: number, radius: number): Pt {
  return mul(dirOf(bearingOf(CORNERS.aswad) - progress), radius);
}

// ── Şavt sayacı ─────────────────────────────────────────
export type Fix = { p: Pt; acc: number; t: number };
export type Quality = 'good' | 'weak' | 'none';
export type LapState = {
  started: boolean;
  laps: number; // tamamlanan şavt
  U: number; // başlangıçtan beri toplam ilerleme (°), geri gidişle azalabilir
  last?: number; // son kabul edilen (yumuşatılmış) ilerleme açısı
  lastT?: number;
  rejects: number;
  quality: Quality;
  radius?: number;
  noise?: number; // açısal gürültü tahmini (radyan): (doğruluk/1,5) / yarıçap
  win?: number[]; // son ölçümlerin ham ilerleme açıları (medyan için)
  n?: number; // kabul edilen ölçüm sayısı
};
export const LAPS_TOTAL = 7;
// Çizgide gidip gelmeye karşı pay: en az 15°, açısal gürültü büyüdükçe artar (sayım hiçbir zaman çizgiden önce yapılmasın).
const hysFor = (noise = 0) => Math.min(45, 15 + 1.2 * (noise / RAD));
/** Açının güvenilir sayılması için azami açısal gürültü (≈17°). */
const MAX_NOISE = 0.3;

export const initialLap = (): LapState => ({ started: false, laps: 0, U: 0, rejects: 0, quality: 'none' });

/** Bu ölçümün açısı güvenilir mi? Doğruluk, Kâbe'ye uzaklığa göre yeterli olmalı. */
export function fixUsable(f: Fix) {
  const r = Math.hypot(f.p[0], f.p[1]);
  return r >= 5 && r <= 250 && f.acc <= 45;
}

export type LapEvent = { type: 'start' } | { type: 'lap'; laps: number } | { type: 'done' };

/**
 * Yeni konum ölçümünü işler. Kurallar:
 * - Yalnız saat yönünün tersine (Kâbe solda) ilerleme sayılır; geri gidiş toplamı düşürür.
 * - Tek ölçümde 45°'den büyük sıçrama gürültü sayılır (uzun kesintiden sonra ileri yönde 150°'ye kadar kabul).
 * - Üst üste reddedilen 3 ölçümden sonra açı yeniden bağlanır ama ilerleme eklenmez:
 *   şüphede az olan esas alınır, sayaç asla fazla saymaz.
 * - Şavt, başlangıç çizgisi en az 15° (gürültüyle artan pay) geçildiğinde tamamlanır; otomatik olarak geri alınmaz.
 * - Açısal gürültü ~17°'yi aşarsa (Kâbe'ye çok yakın + zayıf GPS) ölçüm kullanılmaz; arayüz elle saymayı önerir.
 */
export function stepLap(st: LapState, f: Fix): { st: LapState; events: LapEvent[] } {
  const events: LapEvent[] = [];
  if (!fixUsable(f)) return { st: { ...st, quality: f.acc > 60 ? 'none' : 'weak' }, events };
  const r = Math.hypot(f.p[0], f.p[1]);
  // Sıçrayan ölçüm: Kâbe'ye uzaklık birden değişmez (insan şavt boyunca aşağı yukarı aynı halkada yürür).
  if (st.radius !== undefined && (st.n ?? 0) >= 5 && Math.abs(r - st.radius) > Math.max(12, 2.5 * f.acc)) {
    const rejects = st.rejects + 1;
    // Uzun süre tutarsızsa kullanıcı halka değiştirmiştir (ör. dışarı çıktı): yarıçapı yeniden öğren.
    return { st: { ...st, rejects, radius: rejects >= 8 ? r : st.radius, n: rejects >= 8 ? 0 : st.n, quality: 'weak' }, events };
  }
  // Yarıçap tüm ölçümlerden öğrenilir (yalnız iyi görünenlerden öğrenmek dışa doğru yanlılık yaratır).
  const radius = st.radius !== undefined ? st.radius * 0.85 + r * 0.15 : r;
  const n = (st.n ?? 0) + 1;
  const ratio = f.acc / 1.5 / radius;
  if (ratio > MAX_NOISE) return { st: { ...st, radius, n, quality: 'weak' }, events };
  const noise = st.noise !== undefined ? st.noise * 0.8 + ratio * 0.2 : ratio;
  const raw = progressOf(f.p);
  // Açı: son 5 ölçümün dairesel medyanı (tek tük sıçramalar elenir)
  const win = [...(st.win ?? []), raw].slice(-5);
  const ref = win[win.length - 1];
  const rel = win.map((w) => wrap180(w - ref)).sort((x, y) => x - y);
  const ang = mod360(ref + rel[Math.floor(rel.length / 2)]);
  const next: LapState = { ...st, win, noise, quality: 'good', n, radius };

  if (!st.started) {
    // Başlangıç: Rükn-i Yemânî tarafından gelip Hacerü'l-Esved hizasını geçmek
    if (st.last !== undefined && st.last > 300 && ang < 60 && wrap180(ang - st.last) > 0) {
      events.push({ type: 'start' });
      return { st: { ...next, started: true, U: ang, last: ang, lastT: f.t, rejects: 0 }, events };
    }
    return { st: { ...next, last: ang, lastT: f.t }, events };
  }

  const prev = st.last ?? ang;
  const d = wrap180(ang - prev);
  const dt = st.lastT !== undefined ? (f.t - st.lastT) / 1000 : 0;
  const ok = Math.abs(d) <= 45 || (dt > 20 && d > 0 && d <= 150);
  if (!ok) {
    const rejects = st.rejects + 1;
    if (rejects >= 3) return { st: { ...next, last: ang, lastT: f.t, rejects: 0 }, events };
    return { st: { ...next, rejects }, events };
  }
  next.U = st.U + d;
  next.last = ang;
  next.lastT = f.t;
  next.rejects = 0;
  const hys = hysFor(noise);
  while (next.laps < LAPS_TOTAL && next.U >= 360 * (next.laps + 1) + hys) {
    next.laps += 1;
    events.push(next.laps >= LAPS_TOTAL ? { type: 'done' } : { type: 'lap', laps: next.laps });
  }
  return { st: next, events };
}

/** Elle başlat: kullanıcı Hacerü'l-Esved hizasında olduğunu onaylar. */
export function startManual(st: LapState): LapState {
  return { ...st, started: true, laps: 0, U: 0, rejects: 0 };
}

/** Elle düzeltme: +1 (şavtı tamamladım) / -1. */
export function adjustLap(st: LapState, delta: 1 | -1): LapState {
  const laps = Math.max(0, Math.min(LAPS_TOTAL, st.laps + delta));
  const within = Math.max(0, Math.min(359, st.U - 360 * st.laps));
  const U = delta > 0 ? 360 * laps + Math.min(within, 20) : 360 * laps + within;
  return { ...st, started: true, laps, U };
}

/** Mevcut şavt içindeki ilerleme (0–360). */
export const lapProgress = (st: LapState) => (st.started ? Math.max(0, Math.min(360, st.U - 360 * st.laps)) : 0);

/** Bu yarıçapta bir şavtın uzunluğu (m). */
export const lapLength = (radius: number) => 2 * Math.PI * Math.max(radius, 9);
