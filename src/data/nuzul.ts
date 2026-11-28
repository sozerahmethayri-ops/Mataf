// Nüzul (iniş) sırası ve vahiy dönemleri (0.25.0). Sıra: Kahire 1924 (Mısır) mushafının geleneksel sırası,
// quran-meta 7.0.0 (MIT) üzerinden; Tanzil ile aynı. İlk 86 sûre Mekke'de, son 28 sûre Medine'de inmiştir; birkaç
// sûrenin (ör. Ra'd, Rahmân, İnsân, Zilzâl) Mekkî mi Medenî mi olduğu tartışmalıdır. Dönemler ve "İlk vahiy" kartı
// proje sahibinin video belgesinden (claude.ai/artifact/UrmQU3DKSyjonQn8Y79roW). Henüz bir ilahiyatçı kontrolünden geçmedi.
import type { ML } from './sites';

/** Nüzul sırasıyla sûre numaraları (ilk: Alak 96, son: Nasr 110) */
export const NUZUL_ORDER: number[] = [
  96, 68, 73, 74, 1, 111, 81, 87, 92, 89, 93, 94, 103, 100, 108, 102, 107, 109, 105, 113, 114, 112, 53, 80, 97, 91, 85, 95, 106, 101,
  75, 104, 77, 50, 90, 86, 54, 38, 7, 72, 36, 25, 35, 19, 20, 56, 26, 27, 28, 17, 10, 11, 12, 15, 6, 37, 31, 34, 39, 40, 41, 42, 43,
  44, 45, 46, 51, 88, 18, 16, 71, 14, 21, 23, 32, 52, 67, 69, 70, 78, 79, 82, 84, 30, 29, 83, 2, 8, 3, 33, 60, 4, 99, 57, 47, 13, 55,
  76, 65, 98, 59, 24, 22, 63, 58, 49, 66, 64, 61, 62, 48, 5, 9, 110,
];
/** Mekke'de inen sûre sayısı (sıranın ilk 86'sı) */
export const MECCAN_COUNT = 86;

/** Sûrenin nüzul sırası (1–114) */
export const nuzulRank = (surah: number) => NUZUL_ORDER.indexOf(surah) + 1;

const t = (tr: string, en: string, ar: string): ML => ({ tr, en, ar });

/** Vahyin dönemleri: yıllar ve başlıca olaylar */
export const NUZUL_PERIODS: { title: ML; years: string; events: ML }[] = [
  { title: t('Mekke, ilk dönem', 'Makkah, early period', 'مكة، المرحلة الأولى'), years: '610–615',
    events: t('İlk vahiy (Hira, Ramazan 610); gizli davet; açık davet; Habeşistan\'a ilk hicret',
      'First revelation (Hira, Ramadan 610); private call; public call; first emigration to Abyssinia',
      'بدء الوحي في غار حراء (رمضان 610م)؛ الدعوة السرية ثم الجهرية؛ الهجرة الأولى إلى الحبشة') },
  { title: t('Mekke, orta dönem', 'Makkah, middle period', 'مكة، المرحلة الوسطى'), years: '615–619',
    events: t('Baskının artışı; Hz. Hamza ve Hz. Ömer\'in Müslüman oluşu; Şi\'b-i Ebî Tâlib boykotu (617–619)',
      'Growing persecution; Hamzah and Umar embrace Islam; the boycott in Shiʿb Abi Talib (617–619)',
      'اشتداد الأذى؛ إسلام حمزة وعمر؛ حصار الشِّعب (617–619)') },
  { title: t('Mekke, son dönem', 'Makkah, late period', 'مكة، المرحلة الأخيرة'), years: '619–622',
    events: t('Hüzün yılı (Ebû Tâlib ve Hz. Hatice\'nin vefatı); Tâif; Akabe biatleri',
      'Year of Sorrow (deaths of Abu Talib and Khadijah); Taif; the pledges of Aqabah',
      'عام الحزن (وفاة أبي طالب وخديجة)؛ الطائف؛ بيعتا العقبة') },
  { title: t('Medine, 1–5. yıllar', 'Madinah, years 1–5 AH', 'المدينة، السنوات 1–5هـ'), years: '622–627',
    events: t('Hicret ve Mescid-i Nebevî; kıblenin Kâbe\'ye dönmesi ve Ramazan orucu (2 H); Bedir, Uhud, Hendek',
      'Hijrah and the Prophet\'s Mosque; the qiblah turns to the Kaaba and Ramadan fasting (2 AH); Badr, Uhud, the Trench',
      'الهجرة والمسجد النبوي؛ تحويل القبلة وفرض الصيام (2هـ)؛ بدر وأحد والخندق') },
  { title: t('Medine, 6–8. yıllar', 'Madinah, years 6–8 AH', 'المدينة، السنوات 6–8هـ'), years: '627–630',
    events: t('Hudeybiye Antlaşması; Hayber; Mekke\'nin fethi', 'Treaty of Hudaybiyyah; Khaybar; the conquest of Makkah', 'صلح الحديبية؛ خيبر؛ فتح مكة') },
  { title: t('Medine, 9–11. yıllar', 'Madinah, years 9–11 AH', 'المدينة، السنوات 9–11هـ'), years: '630–632',
    events: t('Tebük; heyetler yılı; Vedâ haccı (Mâide 3); Peygamberimizin vefatı',
      'Tabuk; the year of delegations; the Farewell Hajj (al-Maʾidah 3); the Prophet\'s passing',
      'تبوك؛ عام الوفود؛ حجة الوداع (المائدة 3)؛ وفاة النبي ﷺ') },
];

/** Olay kartları: anahtar sûre:âyet aralığıdır; video bağlantısı yayınlanınca eklenir (belgedeki şablon). */
export type NuzulEpisode = { key: string; s: number; from: number; to: number; title: ML; when: ML; place: ML; story: ML; sources: string; video?: string };
export const NUZUL_EPISODES: NuzulEpisode[] = [
  {
    key: '96:1-5', s: 96, from: 1, to: 5,
    title: t('İlk vahiy: Alak 1–5', 'The first revelation: al-ʿAlaq 1–5', 'أول الوحي: العلق 1–5'),
    when: t('Ramazan, milâdî 610 dolayı · nübüvvetin 1. yılı', 'Ramadan, around 610 CE · first year of prophethood', 'رمضان، نحو 610م · السنة الأولى من البعثة'),
    place: t('Nur Dağı, Hira mağarası (Mekke)', 'Cave of Hira, Mount Nur (Makkah)', 'غار حراء، جبل النور (مكة)'),
    story: t(
      'Hz. Muhammed 40 yaşındayken Hira mağarasında ibadet ve tefekkür ederken melek geldi ve “Oku!” dedi. “Ben okuma bilmem” cevabını verdi. Melek onu üç kez sıkıp bıraktı, sonra Alak sûresinin ilk beş âyetini okudu. Peygamberimiz kalbi çarparak eve döndü ve “Beni örtün” dedi. Hz. Hatice onu teselli etti, amcasının oğlu Varaka b. Nevfel\'e götürdü; Varaka bunun Mûsâ\'ya gelen vahiy meleği olduğunu söyledi. Sonra vahiy bir süre kesildi (fetret) ve Müddessir sûresinin ilk âyetleriyle yeniden başladı.',
      'When the Prophet was forty, while worshipping and reflecting in the cave of Hira, the angel came and said, “Read!” He answered, “I cannot read.” The angel pressed him three times, then recited the first five verses of Surah al-ʿAlaq. He returned home with a pounding heart and said, “Cover me.” Khadijah comforted him and took him to her cousin Waraqah ibn Nawfal, who said this was the angel of revelation that had come to Moses. Revelation then paused for a while and resumed with the opening verses of al-Muddaththir.',
      'كان النبي ﷺ في الأربعين يتعبّد في غار حراء، فجاءه الملك فقال: «اقرأ»، قال: «ما أنا بقارئ»، فغطّه ثلاث مرات ثم قرأ الآيات الخمس الأولى من سورة العلق. فرجع يرجف فؤاده وقال: «زمّلوني». فطمأنته خديجة وذهبت به إلى ابن عمها ورقة بن نوفل فقال: هذا الناموس الذي نزّل الله على موسى. ثم فتر الوحي مدة وعاد بأوائل سورة المدثر.',
    ),
    sources: 'Buhârî, Bed\'ü\'l-vahy 3–4; Müslim, Îmân 252 (160)',
  },
];
