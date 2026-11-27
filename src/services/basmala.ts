// Besmeleyi tanıma (React'sız, testli): hareke sırası, tatvil (ـ), BOM ve elif çeşitlerinden bağımsız.
// alquran.cloud sûre ve sayfa uçlarında 1. âyetin başına besmele koyar (Fâtiha ve Tevbe hariç); çizimde ayrı satıra
// alınır. Eski denetim harekelerin sırasına bakıyordu: sayfa ucundan gelen metinde besmele iki kez görünüyordu.
const bare = (w: string) => w.replace(/[ؐ-ًؚ-ٰٟۖ-ۭـ﻿​-‏]/g, '').replace(/[ٱأإآ]/g, 'ا');
const BASMALA = ['بسم', 'الله', 'الرحمن', 'الرحيم'];

/** Kelimeler besmeleyle başlıyorsa true */
export function startsWithBasmala(words: string[]) {
  if (words.length < 4) return false;
  for (let i = 0; i < 4; i++) if (bare(words[i]) !== BASMALA[i]) return false;
  return true;
}

/** alquran.cloud'un Uthmani metninde 1. âyetin başına eklenen besmeleyi ayırır (Fâtiha ve Tevbe hariç). */
export function stripBasmala(surah: number, ayah: number, text: string) {
  if (surah === 1 || surah === 9 || ayah !== 1) return text;
  const words = text.trim().split(/\s+/);
  if (words.length > 4 && startsWithBasmala(words)) return words.slice(4).join(' ');
  return text;
}
