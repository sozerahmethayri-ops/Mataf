// Kur'an sesleri, sesli mealler ve tefsir kaynakları.
// Ses ve meal: alquran.cloud (edition listesi 24.11.2026'da kontrol edildi).
// Tefsir: spa5k/tafsir_api (MIT; metinlerin hakları yayıncılarına aittir — yayından önce lisansı kontrol edin).
import type { Lang } from '@/i18n/strings';

/** Ayet ayet Arapça tilavet (alquran.cloud "versebyverse"). */
export const RECITERS: { id: string; name: string }[] = [
  { id: 'ar.alafasy', name: 'Mişârî Râşid el-Afâsî' },
  { id: 'ar.abdulbasitmurattal', name: 'Abdülbâsıt Abdüssamed (Murattal)' },
  { id: 'ar.husary', name: 'Mahmûd Halîl el-Husarî' },
  { id: 'ar.husarymujawwad', name: 'el-Husarî (Mücevved)' },
  { id: 'ar.minshawi', name: 'Muhammed Sıddîk el-Minşâvî' },
  { id: 'ar.mahermuaiqly', name: 'Mâhir el-Muaykılî' },
  { id: 'ar.abdurrahmaansudais', name: 'Abdurrahman es-Südeys' },
  { id: 'ar.saoodshuraym', name: 'Suûd eş-Şüreym' },
  { id: 'ar.hudhaify', name: 'Ali el-Huzeyfî' },
  { id: 'ar.muhammadayyoub', name: 'Muhammed Eyyûb' },
  { id: 'ar.shaatree', name: 'Ebû Bekir eş-Şâtırî' },
  { id: 'ar.ahmedajamy', name: 'Ahmed el-Acemî' },
];

/** Sesli meal (ayet ayet). */
export const MEAL_AUDIO: { id: string; lang: string; name: string }[] = [
  { id: 'tr.vakfi-audio', lang: 'tr', name: 'Türkçe · Diyanet Vakfı' },
  { id: 'en.walk', lang: 'en', name: 'English · Ibrahim Walk (Sahih Intl.)' },
  { id: 'ur.khan', lang: 'ur', name: 'اردو · Shamshad Ali Khan' },
  { id: 'fr.leclerc', lang: 'fr', name: 'Français · Youssouf Leclerc' },
  { id: 'ru.kuliev-audio', lang: 'ru', name: 'Русский · Эльмир Кулиев' },
  { id: 'fa.hedayatfarfooladvand', lang: 'fa', name: 'فارسی · فولادوند' },
  { id: 'zh.chinese', lang: 'zh', name: '中文' },
  { id: 'kk.khalifahaltai-audio', lang: 'kk', name: 'Қазақша · Халифа Алтай' },
  { id: 'uz.sodik-audio', lang: 'uz', name: 'Oʻzbekcha · Muhammad Sodik' },
];

/** Okunuş (Latin harfli). */
export const TRANSLIT: Record<string, string> = { tr: 'tr.transliteration', en: 'en.transliteration' };

export type Tafsir = { id: string; lang: string; name: string };
export const TAFSIRS: Tafsir[] = [
  { id: 'turkish-mokhtasar', lang: 'tr', name: 'el-Muhtasar fi’t-Tefsîr (Türkçe)' },
  { id: 'turkish-tafsir-as-saadi-turkish', lang: 'tr', name: 'Sa’dî Tefsiri (Türkçe)' },
  { id: 'tr-tafsir-ibne-kathir', lang: 'tr', name: 'İbn Kesîr (Türkçe, özet)' },
  { id: 'en-tafisr-ibn-kathir', lang: 'en', name: 'Tafsir Ibn Kathir (abridged)' },
  { id: 'en-tafsir-al-mukhtasar', lang: 'en', name: 'Al-Mukhtasar' },
  { id: 'en-al-jalalayn', lang: 'en', name: 'Tafsir al-Jalalayn' },
  { id: 'en-tafsir-maarif-ul-quran', lang: 'en', name: 'Maarif-ul-Quran' },
  { id: 'en-asbab-al-nuzul-by-al-wahidi', lang: 'en', name: 'Asbab al-Nuzul (al-Wahidi)' },
  { id: 'ar-tafsir-muyassar', lang: 'ar', name: 'التفسير الميسر' },
  { id: 'ar-tafsir-al-mukhtasar', lang: 'ar', name: 'المختصر في التفسير' },
  { id: 'ar-tafseer-al-saddi', lang: 'ar', name: 'تفسير السعدي' },
  { id: 'ar-tafsir-ibn-kathir', lang: 'ar', name: 'تفسير ابن كثير' },
  { id: 'ar-tafsir-al-tabari', lang: 'ar', name: 'تفسير الطبري' },
  { id: 'ar-tafseer-al-qurtubi', lang: 'ar', name: 'تفسير القرطبي' },
  { id: 'ar-tafsir-al-jalalayn', lang: 'ar', name: 'تفسير الجلالين' },
  { id: 'russian-mokhtasar', lang: 'ru', name: 'Аль-Мухтасар' },
  { id: 'ru-tafseer-al-saddi', lang: 'ru', name: 'Тафсир ас-Саади' },
  { id: 'ur-tafseer-ibn-e-kaseer', lang: 'ur', name: 'تفسیر ابن کثیر' },
  { id: 'ur-tafsir-bayan-ul-quran', lang: 'ur', name: 'بیان القرآن' },
  { id: 'bengali-mokhtasar', lang: 'bn', name: 'আল-মুখতাসার' },
  { id: 'bn-tafseer-ibn-e-kaseer', lang: 'bn', name: 'তাফসীর ইবনে কাসীর' },
  { id: 'indonesian-mokhtasar', lang: 'id', name: 'Al-Mukhtasar' },
  { id: 'id-tafsir-as-saadi', lang: 'id', name: 'Tafsir As-Saadi' },
  { id: 'french-mokhtasar', lang: 'fr', name: 'Al-Moukhtasar' },
  { id: 'spanish-mokhtasar', lang: 'es', name: 'Al-Mukhtasar' },
  { id: 'italian-mokhtasar', lang: 'it', name: 'Al-Mukhtasar' },
  { id: 'persian-mokhtasar', lang: 'fa', name: 'المختصر (فارسی)' },
  { id: 'bosnian-mokhtasar', lang: 'bs', name: 'Al-Muhtesar' },
  { id: 'sq-saadi', lang: 'sq', name: 'Tefsiri As-Sa’di' },
  { id: 'azeri-mokhtasar', lang: 'az', name: 'Əl-Muxtəsər' },
  { id: 'uzbek-mokhtasar', lang: 'uz', name: 'Al-Muxtasar' },
  { id: 'kurdish-mokhtasar', lang: 'ku', name: 'Al-Mukhtasar (Kurdî)' },
  { id: 'chinese-mokhtasar', lang: 'zh', name: '古兰经简明注释' },
  { id: 'japanese-mokhtasar', lang: 'ja', name: 'クルアーン簡潔注釈' },
  { id: 'hindi-mokhtasar', lang: 'hi', name: 'अल-मुख़्तसर' },
  { id: 'malayalam-mokhtasar', lang: 'ml', name: 'അൽ-മുഖ്തസർ' },
  { id: 'tamil-mokhtasar', lang: 'ta', name: 'அல்-முக்தஸர்' },
  { id: 'vietnamese-mokhtasar', lang: 'vi', name: 'Al-Mukhtasar' },
  { id: 'tagalog-mokhtasar', lang: 'tl', name: 'Al-Mukhtasar' },
  { id: 'thai-mokhtasar', lang: 'th', name: 'อัล-มุคตะศ็อร' },
  { id: 'pashto-mokhtasar', lang: 'ps', name: 'المختصر (پښتو)' },
  { id: 'kyrgyz-mokhtasar', lang: 'ky', name: 'Аль-Мухтасар' },
  { id: 'serbian-mokhtasar', lang: 'sr', name: 'Al-Muhtesar' },
  { id: 'uyghur-mokhtasar', lang: 'ug', name: 'المختصر (ئۇيغۇرچە)' },
];

/** Dil kodu → kendi dilindeki adı (meal/tefsir dil seçici için). */
export const LANG_NAMES: Record<string, string> = {
  tr: 'Türkçe', en: 'English', ar: 'العربية', de: 'Deutsch', fr: 'Français', es: 'Español', it: 'Italiano', nl: 'Nederlands', pt: 'Português',
  ru: 'Русский', ur: 'اردو', fa: 'فارسی', bn: 'বাংলা', hi: 'हिन्दी', id: 'Indonesia', ms: 'Melayu', zh: '中文', ja: '日本語', ko: '한국어',
  az: 'Azərbaycan', uz: 'Oʻzbek', kk: 'Қазақ', ky: 'Кыргыз', tt: 'Татар', ba: 'Башҡорт', tg: 'Тоҷикӣ', ug: 'ئۇيغۇرچە', ku: 'Kurdî',
  bs: 'Bosanski', sq: 'Shqip', bg: 'Български', sr: 'Srpski', ro: 'Română', pl: 'Polski', cs: 'Čeština', sv: 'Svenska', no: 'Norsk',
  sw: 'Kiswahili', ha: 'Hausa', so: 'Soomaali', am: 'አማርኛ', ber: 'Tamazight', ta: 'தமிழ்', ml: 'മലയാളം', th: 'ไทย', vi: 'Tiếng Việt',
  tl: 'Tagalog', si: 'සිංහල', sd: 'سنڌي', ps: 'پښتو', dv: 'ދިވެހި', ce: 'Нохчийн', my: 'မြန်မာ',
};

export type QuranPrefs = {
  translation: string | null; // alquran.cloud meal kimliği
  translit: boolean;
  reciter: string;
  mealAudio: string | null;
  mode: 'ar' | 'ar+meal' | 'meal';
  tafsir: string;
  /** Okuma görünümü: Arapça + meal, yalnız Arapça, yalnız meal, mushaf (kesintisiz Arapça) */
  view?: QuranView;
};
export type QuranView = 'ar+meal' | 'ar' | 'meal' | 'mushaf';

/** Sûrelerin ayet sayıları (1–114). */
export const AYAH_COUNTS = [7, 286, 200, 176, 120, 165, 206, 75, 129, 109, 123, 111, 43, 52, 99, 128, 111, 110, 98, 135, 112, 78, 118, 64, 77, 227, 93, 88, 69, 60, 34, 30, 73, 54, 45, 83, 182, 88, 75, 85, 54, 53, 89, 59, 37, 35, 38, 29, 18, 45, 60, 49, 62, 55, 78, 96, 29, 22, 24, 13, 14, 11, 11, 18, 12, 12, 30, 52, 52, 44, 28, 28, 20, 56, 40, 31, 50, 40, 46, 42, 29, 19, 36, 25, 22, 17, 19, 26, 30, 20, 15, 21, 11, 8, 8, 19, 5, 8, 8, 11, 11, 8, 3, 9, 5, 4, 7, 3, 6, 3, 5, 4, 5, 6];
/** Kur'an'daki konum (0–1): hatim ilerlemesi için. */
export function quranProgress(surah: number, ayah: number) {
  const before = AYAH_COUNTS.slice(0, surah - 1).reduce((a, b) => a + b, 0);
  return (before + ayah) / 6236;
}

export function defaultQuranPrefs(lang: Lang): QuranPrefs {
  if (lang === 'en') return { translation: 'en.sahih', translit: true, reciter: 'ar.alafasy', mealAudio: 'en.walk', mode: 'ar', tafsir: 'en-tafisr-ibn-kathir' };
  if (lang === 'ar') return { translation: null, translit: false, reciter: 'ar.alafasy', mealAudio: null, mode: 'ar', tafsir: 'ar-tafsir-muyassar' };
  return { translation: 'tr.diyanet', translit: true, reciter: 'ar.alafasy', mealAudio: 'tr.vakfi-audio', mode: 'ar', tafsir: 'turkish-mokhtasar' };
}
