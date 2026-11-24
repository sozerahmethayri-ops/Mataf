// Sahîh-i Buhârî: fawazahmed0/hadith-api (açık veri, jsDelivr CDN) üzerinden indirilir ve saklanır.
import type { Lang } from '@/i18n/strings';
import { cachedJson } from './cache';

const CDN = 'https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1';
const DAY = 24 * 3600 * 1000;
const EDITION: Record<Lang, string> = { tr: 'tur-bukhari', en: 'eng-bukhari', ar: 'ara-bukhari' };

export type Hadith = { number: number | string; text: string };

export async function bukhariBooks(): Promise<{ no: number; name: string }[]> {
  const r = await cachedJson<Record<string, { metadata: { sections: Record<string, string> } }>>('hadith:info', `${CDN}/info.min.json`, 30 * DAY);
  const sections = r.data.bukhari?.metadata?.sections ?? {};
  return Object.entries(sections)
    .map(([k, v]) => ({ no: Number(k), name: v }))
    .filter((s) => s.no > 0 && s.name);
}

export async function bukhariSection(no: number, lang: Lang): Promise<{ title: string; hadiths: Hadith[] }> {
  const ed = EDITION[lang];
  const r = await cachedJson<{ metadata?: { section?: Record<string, string> }; hadiths: { hadithnumber: number | string; text: string }[] }>(
    `hadith:${ed}:${no}`, `${CDN}/editions/${ed}/sections/${no}.min.json`, 90 * DAY,
  );
  const title = Object.values(r.data.metadata?.section ?? {})[0] ?? '';
  return { title, hadiths: r.data.hadiths.filter((h) => h.text?.trim()).map((h) => ({ number: h.hadithnumber, text: h.text })) };
}

// Günün hadisi için çevrimdışı seçki (Arapça kısa metin + Türkçe anlam). Kaynak numaraları Fethu'l-Bârî numaralamasıdır.
export const DAILY: { ar: string; tr: string; en: string; ref: string }[] = [
  { ar: 'إِنَّمَا الأَعْمَالُ بِالنِّيَّاتِ', tr: 'Ameller ancak niyetlere göredir. Herkese ancak niyet ettiği şey vardır.', en: 'Actions are judged only by intentions, and everyone gets what they intended.', ref: 'Buhârî, 1' },
  { ar: 'الْمُسْلِمُ مَنْ سَلِمَ الْمُسْلِمُونَ مِنْ لِسَانِهِ وَيَدِهِ', tr: 'Müslüman, dilinden ve elinden Müslümanların emin olduğu kimsedir.', en: 'A Muslim is one from whose tongue and hand the Muslims are safe.', ref: 'Buhârî, 10' },
  { ar: 'لاَ يُؤْمِنُ أَحَدُكُمْ حَتَّى يُحِبَّ لأَخِيهِ مَا يُحِبُّ لِنَفْسِهِ', tr: 'Sizden biriniz, kendisi için istediğini kardeşi için de istemedikçe (gerçek) iman etmiş olmaz.', en: 'None of you truly believes until he loves for his brother what he loves for himself.', ref: 'Buhârî, 13' },
  { ar: 'يَسِّرُوا وَلاَ تُعَسِّرُوا، وَبَشِّرُوا وَلاَ تُنَفِّرُوا', tr: 'Kolaylaştırın, zorlaştırmayın; müjdeleyin, nefret ettirmeyin.', en: 'Make things easy, not difficult; give good news, do not drive people away.', ref: 'Buhârî, 69' },
  { ar: 'مَا بَيْنَ بَيْتِي وَمِنْبَرِي رَوْضَةٌ مِنْ رِيَاضِ الْجَنَّةِ', tr: 'Evimle minberimin arası cennet bahçelerinden bir bahçedir.', en: 'Between my house and my pulpit is a garden of the gardens of Paradise.', ref: 'Buhârî, 1196' },
  { ar: 'أَحَبُّ الأَعْمَالِ إِلَى اللَّهِ أَدْوَمُهَا وَإِنْ قَلَّ', tr: 'Allah katında amellerin en sevimlisi, az da olsa devamlı olanıdır.', en: 'The most beloved deeds to Allah are the most constant, even if small.', ref: 'Buhârî, 6464' },
];

export function dailyHadith(d = new Date()) {
  const day = Math.floor(d.getTime() / DAY);
  return DAILY[day % DAILY.length];
}
