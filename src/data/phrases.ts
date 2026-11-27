// Ziyaretçiye temel Arapça ifadeler (fasih, kısa). ar: ekranda ve seslendirmede; tr: Latin harfli okunuş; mean: anlam.
// Arapça arayüzde anlam gösterilmez (ifadenin kendisi yeterli).
export type Phrase = { id: string; ar: string; tr: string; mean: { tr: string; en: string; ar: string } };
type Group = { id: string; title: { tr: string; en: string; ar: string }; items: Phrase[] };
const m = (tr: string, en: string) => ({ tr, en, ar: '' });

export const PHRASES: Group[] = [
  {
    id: 'gunluk', title: { tr: 'Tanışma ve nezaket', en: 'Greetings and courtesy', ar: 'التحية والمجاملة' },
    items: [
      { id: 'selam', ar: 'السلام عليكم', tr: 'Es-selâmu aleyküm', mean: m('Selam size olsun (selamlaşma)', 'Peace be upon you (greeting)') },
      { id: 'tesekkur', ar: 'شكرًا جزيلًا', tr: 'Şükran cezîlen', mean: m('Çok teşekkür ederim', 'Thank you very much') },
      { id: 'evet-hayir', ar: 'نعم / لا', tr: 'Na‘am / Lâ', mean: m('Evet / Hayır', 'Yes / No') },
      { id: 'turk', ar: 'أنا من تركيا', tr: 'Ene min Turkiyâ', mean: m('Türkiye’denim', 'I am from Turkey') },
      { id: 'arapca', ar: 'لا أتكلم العربية', tr: 'Lâ etekellemu’l-‘arabiyye', mean: m('Arapça bilmiyorum', 'I don’t speak Arabic') },
      { id: 'yavas', ar: 'تكلم ببطء من فضلك', tr: 'Tekellem bi-but’in min fadlik', mean: m('Lütfen yavaş konuşun', 'Please speak slowly') },
    ],
  },
  {
    id: 'yol', title: { tr: 'Yol ve yön', en: 'Getting around', ar: 'الطريق' },
    items: [
      { id: 'kayip', ar: 'ضللتُ الطريق', tr: 'Dalaltu’t-tarîk', mean: m('Yolumu kaybettim', 'I am lost') },
      { id: 'yardim', ar: 'ساعدني من فضلك', tr: 'Sâ‘idnî min fadlik', mean: m('Lütfen bana yardım edin', 'Please help me') },
      { id: 'otel', ar: 'أريد الذهاب إلى الفندق', tr: 'Urîdu’z-zehâbe ile’l-funduk', mean: m('Otele gitmek istiyorum', 'I want to go to the hotel') },
      { id: 'harem', ar: 'إلى المسجد الحرام من فضلك', tr: 'İle’l-Mescidi’l-Harâm min fadlik', mean: m('Mescid-i Haram’a, lütfen', 'To al-Masjid al-Haram, please') },
      { id: 'nebevi', ar: 'إلى المسجد النبوي من فضلك', tr: 'İle’l-Mescidi’n-Nebevî min fadlik', mean: m('Mescid-i Nebevî’ye, lütfen', 'To the Prophet’s Mosque, please') },
      { id: 'kapi', ar: 'ما رقم هذا الباب؟', tr: 'Mâ rakmu hâze’l-bâb?', mean: m('Bu kapının numarası kaç?', 'What is this gate’s number?') },
    ],
  },
  {
    id: 'ihtiyac', title: { tr: 'İhtiyaçlar', en: 'Needs', ar: 'الحاجات' },
    items: [
      { id: 'tuvalet', ar: 'أين دورات المياه؟', tr: 'Eyne devrâtu’l-miyâh?', mean: m('Tuvaletler nerede?', 'Where are the toilets?') },
      { id: 'zemzem', ar: 'أين ماء زمزم؟', tr: 'Eyne mâu Zemzem?', mean: m('Zemzem suyu nerede?', 'Where is the Zamzam water?') },
      { id: 'su', ar: 'ماء من فضلك', tr: 'Mâ’ min fadlik', mean: m('Su, lütfen', 'Water, please') },
      { id: 'fiyat', ar: 'بكم هذا؟', tr: 'Bikem hâzâ?', mean: m('Bu ne kadar?', 'How much is this?') },
    ],
  },
  {
    id: 'saglik', title: { tr: 'Sağlık ve acil', en: 'Health and emergency', ar: 'الصحة والطوارئ' },
    items: [
      { id: 'doktor', ar: 'أحتاج إلى طبيب', tr: 'Ahtâcu ilâ tabîb', mean: m('Doktora ihtiyacım var', 'I need a doctor') },
      { id: 'hastane', ar: 'أين المستشفى؟', tr: 'Eyne’l-müsteşfâ?', mean: m('Hastane nerede?', 'Where is the hospital?') },
      { id: 'ambulans', ar: 'اتصلوا بالإسعاف', tr: 'İttasilû bi’l-is‘âf', mean: m('Ambulans çağırın', 'Call an ambulance') },
      { id: 'sandalye', ar: 'أحتاج إلى كرسي متحرك', tr: 'Ahtâcu ilâ kursiyyin muteharrik', mean: m('Tekerlekli sandalyeye ihtiyacım var', 'I need a wheelchair') },
    ],
  },
];
