// Kur'an metni ve meal, çalışma anında alquran.cloud API'sinden indirilir ve cihazda saklanır.
// Arapça metin: Tanzil (quran-uthmani). Meal hakları sahiplerine aittir; yayın öncesi lisansı kontrol edin.
import type { Lang } from '@/i18n/strings';
import { cachedJson } from './cache';

const API = 'https://api.alquran.cloud/v1';
const DAY = 24 * 3600 * 1000;

export const TRANSLATIONS: Record<Lang, string | null> = { tr: 'tr.diyanet', en: 'en.sahih', ar: null };

export type SurahMeta = { number: number; name: string; englishName: string; numberOfAyahs: number; revelationType: string };
export type Ayah = { n: number; ar: string; tr?: string };

export const SURAH_TR = [
  'Fâtiha', 'Bakara', 'Âl-i İmrân', 'Nisâ', 'Mâide', "En'âm", "A'râf", 'Enfâl', 'Tevbe', 'Yûnus', 'Hûd', 'Yûsuf', "Ra'd", 'İbrâhîm',
  'Hicr', 'Nahl', 'İsrâ', 'Kehf', 'Meryem', 'Tâhâ', 'Enbiyâ', 'Hac', "Mü'minûn", 'Nûr', 'Furkân', 'Şuarâ', 'Neml', 'Kasas', 'Ankebût',
  'Rûm', 'Lokmân', 'Secde', 'Ahzâb', "Sebe'", 'Fâtır', 'Yâsîn', 'Sâffât', 'Sâd', 'Zümer', "Mü'min", 'Fussilet', 'Şûrâ', 'Zuhruf',
  'Duhân', 'Câsiye', 'Ahkâf', 'Muhammed', 'Fetih', 'Hucurât', 'Kâf', 'Zâriyât', 'Tûr', 'Necm', 'Kamer', 'Rahmân', 'Vâkıa', 'Hadîd',
  'Mücâdele', 'Haşr', 'Mümtehine', 'Saf', 'Cuma', 'Münâfikûn', 'Teğâbün', 'Talâk', 'Tahrîm', 'Mülk', 'Kalem', 'Hâkka', 'Meâric',
  'Nûh', 'Cin', 'Müzzemmil', 'Müddessir', 'Kıyâme', 'İnsân', 'Mürselât', "Nebe'", 'Nâziât', 'Abese', 'Tekvîr', 'İnfitâr',
  'Mutaffifîn', 'İnşikâk', 'Bürûc', 'Târık', "A'lâ", 'Ğâşiye', 'Fecr', 'Beled', 'Şems', 'Leyl', 'Duhâ', 'İnşirâh', 'Tîn', 'Alak',
  'Kadr', 'Beyyine', 'Zilzâl', 'Âdiyât', 'Kâria', 'Tekâsür', 'Asr', 'Hümeze', 'Fîl', 'Kureyş', 'Mâûn', 'Kevser', 'Kâfirûn', 'Nasr',
  'Tebbet', 'İhlâs', 'Felak', 'Nâs',
];

// Çevrimdışı ilk açılış için Fâtiha (Arapça metin + kısa meal).
export const FATIHA: Ayah[] = [
  { n: 1, ar: 'بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ', tr: 'Rahmân ve Rahîm olan Allah’ın adıyla.' },
  { n: 2, ar: 'ٱلْحَمْدُ لِلَّهِ رَبِّ ٱلْعَٰلَمِينَ', tr: 'Hamd, âlemlerin Rabbi Allah’a mahsustur.' },
  { n: 3, ar: 'ٱلرَّحْمَٰنِ ٱلرَّحِيمِ', tr: 'O, Rahmân’dır, Rahîm’dir.' },
  { n: 4, ar: 'مَٰلِكِ يَوْمِ ٱلدِّينِ', tr: 'Din gününün sahibidir.' },
  { n: 5, ar: 'إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ', tr: 'Yalnız sana kulluk eder, yalnız senden yardım dileriz.' },
  { n: 6, ar: 'ٱهْدِنَا ٱلصِّرَٰطَ ٱلْمُسْتَقِيمَ', tr: 'Bizi doğru yola ilet.' },
  { n: 7, ar: 'صِرَٰطَ ٱلَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ ٱلْمَغْضُوبِ عَلَيْهِمْ وَلَا ٱلضَّآلِّينَ', tr: 'Nimet verdiklerinin yoluna; gazaba uğrayanların ve sapmışların yoluna değil.' },
];

export function surahName(n: number, lang: Lang, meta?: SurahMeta) {
  if (lang === 'tr' && SURAH_TR.length === 114) return SURAH_TR[n - 1];
  if (lang === 'ar' && meta) return meta.name;
  return meta?.englishName ?? SURAH_TR[n - 1];
}

export async function listSurahs() {
  const r = await cachedJson<{ data: SurahMeta[] }>('quran:list', `${API}/surah`, 30 * DAY);
  return r.data.data;
}

export async function getSurah(n: number, lang: Lang): Promise<{ ayahs: Ayah[]; fromCache: boolean }> {
  const tr = TRANSLATIONS[lang];
  const editions = ['quran-uthmani', ...(tr ? [tr] : [])].join(',');
  try {
    const r = await cachedJson<{ data: { ayahs: { numberInSurah: number; text: string }[] }[] }>(
      `quran:${n}:${editions}`, `${API}/surah/${n}/editions/${editions}`, 90 * DAY,
    );
    const [arEd, trEd] = r.data.data;
    return {
      ayahs: arEd.ayahs.map((a, i) => ({ n: a.numberInSurah, ar: a.text, tr: trEd?.ayahs[i]?.text })),
      fromCache: r.fromCache,
    };
  } catch (e) {
    if (n === 1) return { ayahs: FATIHA, fromCache: true };
    throw e;
  }
}
