// Hatim planı: bitiş gününe göre günlük bölüm. Konum, Mushaf baştan okunmuş âyet sayısıdır (0–6236); Hatim ayracı
// (okurken görünen ilk âyet) bunu verir. Bölümler cüz ve yaklaşık sayfa olarak gösterilir (1 cüz ≈ 20 sayfa).
// React'sız; testleri scripts/check-logic.ts'te.
import { pageOfGlobal } from '@/data/quranPages';
import { globalAyah, surahLength } from './quranIndex';

export const TOTAL_AYAH = 6236;
export const PLAN_KEY = 'quran:plan';
/** Seçilebilen süreler (gün): 30 gün ≈ günde bir cüz */
export const PLAN_DAYS = [30, 60, 90, 180] as const;

/** Cüz başları (sûre, âyet), standart Medine Mushafı */
export const JUZ_STARTS: [number, number][] = [
  [1, 1], [2, 142], [2, 253], [3, 93], [4, 24], [4, 148], [5, 82], [6, 111], [7, 88], [8, 41],
  [9, 93], [11, 6], [12, 53], [15, 1], [17, 1], [18, 75], [21, 1], [23, 1], [25, 21], [27, 56],
  [29, 46], [33, 31], [36, 28], [39, 32], [41, 47], [46, 1], [51, 31], [58, 1], [67, 1], [78, 1],
];
/** Her cüzden önce okunmuş âyet sayısı */
const JUZ_BEFORE = JUZ_STARTS.map(([s, a]) => globalAyah(s, a) - 1);

/** start: plan günü (YYYY-MM-DD), days: süre, from: plan başında okunmuş âyet */
export type HatimPlan = { start: string; days: number; from: number };

/** Hatim ayracının yerinden okunmuş âyet sayısı (ayraç o âyette duruyor: öncekiler okundu) */
export const readFromMark = (surah: number, ayah: number) => Math.max(0, Math.min(TOTAL_AYAH, globalAyah(surah, ayah) - 1));

/** Mushaf sırası (1–6236) → [sûre, âyet] */
export function fromGlobal(n: number): [number, number] {
  let k = Math.max(1, Math.min(TOTAL_AYAH, Math.round(n)));
  for (let s = 1; s <= 114; s++) {
    const len = surahLength(s);
    if (k <= len) return [s, k];
    k -= len;
  }
  return [114, 6];
}

/** Okunmuş âyet sayısından cüz cinsinden konum (0–30, kesirli) */
export function juzPos(read: number) {
  const r = Math.max(0, Math.min(TOTAL_AYAH, read));
  let k = 0;
  while (k < 29 && JUZ_BEFORE[k + 1] <= r) k++;
  const a = JUZ_BEFORE[k];
  const b = k < 29 ? JUZ_BEFORE[k + 1] : TOTAL_AYAH;
  return k + (r - a) / (b - a);
}

/** Âyetin cüzü (1–30) */
export const juzOf = (surah: number, ayah: number) => Math.min(30, Math.floor(juzPos(globalAyah(surah, ayah) - 1)) + 1);

/** Okunan kısım (0–1), sayfa esaslı: cüz konumu / 30. Âyet sayısıyla ölçmek Bakara'nın uzun âyetlerinde az gösteriyordu. */
export const readShare = (read: number) => juzPos(read) / 30;

/** Plan başından bugüne geçen gün (başlangıç günü 0) */
export function planDay(plan: HatimPlan, today: Date) {
  const [y, m, d] = plan.start.split('-').map(Number);
  return Math.floor((Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()) - Date.UTC(y, m - 1, d)) / 864e5);
}

/** Cüz konumundan (0–30) okunmuş âyet sayısı; juzPos'un tersi */
export function readAtJuz(pos: number) {
  if (pos >= 30) return TOTAL_AYAH;
  const k = Math.max(0, Math.floor(pos));
  const a = JUZ_BEFORE[k];
  const b = k < 29 ? JUZ_BEFORE[k + 1] : TOTAL_AYAH;
  return Math.round(a + (pos - k) * (b - a));
}

/** Bugünün sonunda okunmuş olması hedeflenen âyet sayısı. Bölüm cüze göre eşit dağılır (her gün ≈ aynı sayfa);
 *  âyet sayısına göre bölmek Bakara'nın uzun âyetlerinde ilk günleri ağırlaştırıyordu. */
export function targetRead(plan: HatimPlan, today: Date) {
  const done = Math.min(plan.days, Math.max(0, planDay(plan, today)) + 1);
  const p0 = juzPos(plan.from);
  return Math.min(TOTAL_AYAH, Math.max(plan.from, readAtJuz(p0 + ((30 - p0) * done) / plan.days)));
}

/** Bugünün durumu: kalan âyet, kalan cüz ve sayfa (yaklaşık), bölümün başı ve sonu, kaçıncı gün */
export function hatimToday(plan: HatimPlan, read: number, today: Date) {
  const target = targetRead(plan, today);
  const left = Math.max(0, target - read);
  const juzLeft = Math.max(0, juzPos(target) - juzPos(read));
  // Medine Mushafı sayfaları: bölümün ilk ve son sayfası (kesin)
  const pageFrom = pageOfGlobal(Math.min(TOTAL_AYAH, read + 1));
  const pageTo = pageOfGlobal(Math.max(1, target));
  return {
    target,
    left,
    juzLeft,
    pagesLeft: left > 0 ? pageTo - pageFrom + 1 : 0,
    pageFrom,
    pageTo,
    from: fromGlobal(read + 1),
    to: fromGlobal(target),
    day: Math.max(0, planDay(plan, today)) + 1,
    finished: read >= TOTAL_AYAH,
    overdue: planDay(plan, today) >= plan.days,
  };
}

/** Bozuk kaydı temizler; geçersizse plan yok sayılır */
export function cleanPlan(raw: unknown): HatimPlan | null {
  if (!raw || typeof raw !== 'object') return null;
  const p = raw as Record<string, unknown>;
  if (typeof p.start !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(p.start)) return null;
  if (typeof p.days !== 'number' || !Number.isInteger(p.days) || p.days < 1 || p.days > 3660) return null;
  if (typeof p.from !== 'number' || p.from < 0 || p.from >= TOTAL_AYAH) return null;
  return { start: p.start, days: p.days, from: Math.round(p.from) };
}
