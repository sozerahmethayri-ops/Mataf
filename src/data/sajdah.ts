// Secde âyetleri: Hanefî mezhebine göre 14 yer (Medine Mushafı numaralandırması). Hac 77 Şâfiîlere göre
// secde âyetidir, Hanefîlere göre değil; bu yüzden listede yok.
export const SAJDAH: [number, number][] = [
  [7, 206], [13, 15], [16, 50], [17, 109], [19, 58], [22, 18], [25, 60],
  [27, 26], [32, 15], [38, 24], [41, 38], [53, 62], [84, 21], [96, 19],
];

export const isSajdah = (surah: number, ayah: number) => SAJDAH.some(([s, a]) => s === surah && a === ayah);
export const surahHasSajdah = (surah: number) => SAJDAH.some(([s]) => s === surah);

/** Secde işareti (Arapça secde yeri işareti) */
export const SAJDAH_SIGN = '۩';

/** Kaynak metindeki (Tanzil) secde işaretini ayırır; işaret yalnız Hanefî 14 yerde, uygulamanın kendi biçimiyle konur.
 *  Tanzil Hac 77'yi de işaretler, Hanefîlere göre orası secde yeri değildir. */
export const stripSajdahSign = (text: string) => text.replace(/\s*\u06E9\s*$/, '');

export const SAJDAH_NOTE = {
  tr: 'Secde âyeti (۩): okuyan da dinleyen de tilâvet secdesi yapar; Hanefî mezhebinde vâciptir. Kaynak: Diyanet İlmihali, tilâvet secdesi.',
  en: 'Verse of prostration (۩): both the reciter and the listener make the prostration of recitation; it is wajib in the Hanafi school.',
  ar: 'آية سجدة (۩): يسجد القارئ والمستمع سجدة التلاوة، وهي واجبة عند الحنفية.',
};
