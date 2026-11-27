// Tecvidli metin: alquran.cloud "quran-tajweed" baskısındaki işaretlemeyi parçalara ayırır.
// Biçim: [kural[metin]  ya da  [kural:sayı[metin]  — kural tek harf (h, l, n, p, m, o, q, c, f, w, i, a, u, d, b, g, s).
// Tanınmayan ya da yarım kalan işaret metne karışmasın diye temizlenir (en kötü durumda renksiz metin).
// React'sız; testleri scripts/check-logic.ts'te.
import { startsWithBasmala } from './basmala';

export type RuleId = 'h' | 's' | 'l' | 'n' | 'p' | 'm' | 'q' | 'o' | 'c' | 'f' | 'w' | 'i' | 'a' | 'u' | 'd' | 'b' | 'g';
export type Seg = { t: string; r?: RuleId };
const RULES = new Set<string>(['h', 's', 'l', 'n', 'p', 'm', 'q', 'o', 'c', 'f', 'w', 'i', 'a', 'u', 'd', 'b', 'g']);

export function parseTajweed(text: string): Seg[] {
  const out: Seg[] = [];
  const re = /\[([a-z])(?::\d+)?\[([^\]]*)\]/g;
  let last = 0;
  let m: RegExpExecArray | null;
  const plain = (s: string) => {
    // Eşleşmeyen işaret kalıntılarını temizle
    const t = s.replace(/\[[a-z](?::\d+)?\[/g, '').replace(/[[\]]/g, '');
    if (t) out.push({ t });
  };
  while ((m = re.exec(text))) {
    if (m.index > last) plain(text.slice(last, m.index));
    if (m[2]) out.push(RULES.has(m[1]) ? { t: m[2], r: m[1] as RuleId } : { t: m[2] });
    last = re.lastIndex;
  }
  if (last < text.length) plain(text.slice(last));
  // Yan yana renksiz parçaları birleştir (daha az iç içe yazı)
  const merged: Seg[] = [];
  for (const s of out) {
    const prev = merged[merged.length - 1];
    if (prev && !prev.r && !s.r) prev.t += s.t;
    else merged.push({ ...s });
  }
  return merged;
}

export const plainOf = (segs: Seg[]) => segs.map((s) => s.t).join('');

/** Baştaki n kelimeyi atar (parça sınırlarını koruyarak) */
export function dropWords(segs: Seg[], n: number): Seg[] {
  let spaces = 0;
  const out: Seg[] = [];
  for (const s of segs) {
    if (spaces >= n) { out.push(s); continue; }
    let i = 0;
    while (i < s.t.length && spaces < n) {
      if (s.t[i] === ' ') spaces++;
      i++;
    }
    if (spaces >= n && i < s.t.length) out.push({ ...s, t: s.t.slice(i) });
  }
  return out;
}

/** 1. âyetin başındaki besmeleyi ayırır (Fâtiha ve Tevbe hariç); Uthmani metindeki stripBasmala ile aynı kural. */
export function stripTajweedBasmala(surah: number, ayah: number, segs: Seg[]): Seg[] {
  if (surah === 1 || surah === 9 || ayah !== 1) return segs;
  const words = plainOf(segs).split(' ').filter(Boolean);
  if (words.length > 4 && startsWithBasmala(words)) return dropWords(segs, 4);
  return segs;
}
