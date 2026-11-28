// Kur'an okuma biçimleri (0.25.0): sayfa sayfa (tecvid renkli, tecvidsiz) ve âyet âyet (mealli, tefsirli, yalnız
// Arapça, yalnız meal). React'sız (testli); pencere ve liste components/QuranModes.tsx'te.
import type { QuranView } from './quranEditions';
import type { ML } from './sites';

export const MODES: { v: QuranView; page: boolean; title: ML; sub: ML }[] = [
  { v: 'tecvid', page: true, title: { tr: 'Sayfa · tecvid renkli', en: 'Page · tajweed colours', ar: 'صفحة · ألوان التجويد' }, sub: { tr: 'Mushaf sayfası; tecvid kuralları renkli', en: 'Mushaf page with colour-coded tajweed', ar: 'صفحة المصحف مع ألوان التجويد' } },
  { v: 'mushaf', page: true, title: { tr: 'Sayfa · tecvidsiz', en: 'Page · plain', ar: 'صفحة · بدون ألوان' }, sub: { tr: 'Mushaf sayfası, sade', en: 'Plain mushaf page', ar: 'صفحة المصحف بلا ألوان' } },
  { v: 'ar+meal', page: false, title: { tr: 'Mealli', en: 'With translation', ar: 'مع الترجمة' }, sub: { tr: 'Âyet âyet: Arapça, okunuş ve meal', en: 'Verse by verse: Arabic, transliteration and translation', ar: 'آية آية: العربية والترجمة' } },
  { v: 'tefsir', page: false, title: { tr: 'Tefsirli', en: 'With tafsir', ar: 'مع التفسير' }, sub: { tr: 'Âyet âyet: Arapça, meal ve tefsir açıklaması', en: 'Verse by verse: Arabic, translation and tafsir', ar: 'آية آية: العربية والترجمة والتفسير' } },
  { v: 'ar', page: false, title: { tr: 'Yalnız Arapça', en: 'Arabic only', ar: 'العربية فقط' }, sub: { tr: 'Âyet âyet Arapça metin', en: 'Arabic text, verse by verse', ar: 'النص العربي آية آية' } },
  { v: 'meal', page: false, title: { tr: 'Yalnız meal', en: 'Translation only', ar: 'الترجمة فقط' }, sub: { tr: 'Âyet âyet meal', en: 'Translation, verse by verse', ar: 'الترجمة آية آية' } },
];

export const isPageMode = (v: QuranView) => v === 'mushaf' || v === 'tecvid';
