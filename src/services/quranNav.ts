// Kur'an'da gezinme: arama kutusundaki yazıdan hedef (âyet, sayfa, cüz) çıkarma ve cüz başlarının sayfaları.
// React'sız; scripts/check-logic.ts'te test edilir.
import { PAGE_COUNT, pageOf } from '@/data/quranPages';
import { JUZ_STARTS } from './hatim';
import { surahLength } from './quranIndex';

export type QuranTarget = { kind: 'ayah'; s: number; a: number } | { kind: 'page'; p: number } | { kind: 'juz'; j: number };

/** Karşılaştırma için sadeleştirme: küçük harf, şapkasız, kesme ve tire yok (İ/ı Türkçe kuralıyla) */
export function fold(s: string) {
  return s.toLocaleLowerCase('tr').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[’'`\-.]/g, '').replace(/ı/g, 'i').trim();
}

/** Cüzün başladığı sayfa (Medine Mushafı) */
export const juzStartPage = (j: number) => pageOf(JUZ_STARTS[j - 1][0], JUZ_STARTS[j - 1][1]);

const PAGE_RE = /^(?:s|sf|sayfa|p|page|ص|صفحة)\s*\.?\s*(\d{1,3})$/i;
const JUZ_RE = /^(?:c|cuz|cüz|juz|j|جزء|الجزء)\s*\.?\s*(\d{1,2})$/i;

/**
 * "2:255", "2 255", "bakara 255", "kehf" (1. âyet), "s 300" / "sayfa 300", "c 15" / "cüz 15".
 * `names`: dile göre sûre adları (1–114 sırasıyla; birden çok dil verilebilir). Bulunamazsa null.
 */
export function parseQuranQuery(q: string, names: string[][]): QuranTarget | null {
  const t = q.trim();
  if (!t) return null;
  const pg = t.match(PAGE_RE);
  if (pg) {
    const p = Number(pg[1]);
    return p >= 1 && p <= PAGE_COUNT ? { kind: 'page', p } : null;
  }
  const jz = t.match(JUZ_RE);
  if (jz) {
    const j = Number(jz[1]);
    return j >= 1 && j <= 30 ? { kind: 'juz', j } : null;
  }
  const num = t.match(/^(\d{1,3})\s*[:\s.]\s*(\d{1,3})$/);
  if (num) {
    const s = Number(num[1]);
    const a = Number(num[2]);
    return s >= 1 && s <= 114 && a >= 1 && a <= surahLength(s) ? { kind: 'ayah', s, a } : null;
  }
  // Ad (+ isteğe bağlı âyet): "bakara 255", "al-baqarah 255", "kehf"
  const m = t.match(/^(.+?)\s*(\d{1,3})?$/);
  if (!m) return null;
  const want = fold(m[1]);
  if (want.length < 2 || /^\d+$/.test(want)) return null;
  let best = 0;
  for (const list of names) {
    list.forEach((n, i) => {
      const f = fold(n).replace(/^(el|al|an|ar|as|at|az|ad|ash)\s*/, '');
      const w = want.replace(/^(el|al|an|ar|as|at|az|ad|ash)\s*/, '');
      if (!best && (f === w || (w.length >= 3 && f.startsWith(w)))) best = i + 1;
    });
  }
  if (!best) return null;
  const a = m[2] ? Number(m[2]) : 1;
  return a >= 1 && a <= surahLength(best) ? { kind: 'ayah', s: best, a } : null;
}
