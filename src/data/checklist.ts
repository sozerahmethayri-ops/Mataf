// Hac ve umre hazırlık listesi: yolculuktan önce işaretlenir. Pratik maddeler; dinî hüküm yok (ihram yasakları rehberde).
// to: maddeye dokununca açılacak ekran (isteğe bağlı).
type ML = { tr: string; en: string; ar: string };
export type CheckItem = { id: string; text: ML; to?: string };
export type CheckGroup = { id: string; title: ML; items: CheckItem[] };
const t = (tr: string, en: string, ar: string): ML => ({ tr, en, ar });

export const CHECKLIST: CheckGroup[] = [
  {
    id: 'belge', title: t('Belgeler', 'Documents', 'الوثائق'),
    items: [
      { id: 'pasaport', text: t('Pasaport (en az 6 ay geçerli)', 'Passport (valid for at least 6 months)', 'جواز السفر (صالح ستة أشهر على الأقل)') },
      { id: 'vize', text: t('Vize ve izinler (Nusuk), telefonda ve kâğıtta', 'Visa and permits (Nusuk), on the phone and on paper', 'التأشيرة والتصاريح (نسك) على الهاتف وورقيًا') },
      { id: 'asi', text: t('Menenjit aşı kartı', 'Meningitis vaccination card', 'شهادة لقاح الحمى الشوكية') },
      { id: 'kafile', text: t('Kafile kartı ve bileklik (otel ve rehber bilgisi)', 'Group card and wristband (hotel and guide details)', 'بطاقة المجموعة والسوار (بيانات الفندق والمرشد)') },
      { id: 'bilet', text: t('Uçak bileti ve otel bilgileri', 'Flight ticket and hotel details', 'تذكرة الطيران وبيانات الفندق') },
      { id: 'kopya', text: t('Belgelerin fotokopisi, ayrı bir çantada', 'Copies of documents, in a separate bag', 'نسخ من الوثائق في حقيبة منفصلة') },
    ],
  },
  {
    id: 'saglik', title: t('Sağlık', 'Health', 'الصحة'),
    items: [
      { id: 'ilac', text: t('Düzenli ilaçlar (birkaç gün fazlasıyla) ve raporu', 'Regular medicines (a few days extra) and the prescription', 'الأدوية المعتادة (مع أيام إضافية) والوصفة') },
      { id: 'olcum', text: t('Tansiyon ya da şeker ölçüm aleti', 'Blood pressure or sugar meter', 'جهاز قياس الضغط أو السكر') },
      { id: 'kokusuz', text: t('Kokusuz sabun, krem ve ıslak mendil', 'Unscented soap, cream and wet wipes', 'صابون وكريم ومناديل مبللة بلا رائحة') },
      { id: 'maske', text: t('Maske', 'Face masks', 'كمامات') },
      { id: 'semsiye', text: t('Şemsiye (güneş için) ve su matarası', 'Umbrella (for the sun) and a water bottle', 'مظلة (للشمس) وقارورة ماء') },
    ],
  },
  {
    id: 'giyim', title: t('İhram ve giyim', 'Ihram and clothing', 'الإحرام والملابس'),
    items: [
      { id: 'ihram', text: t('İhram (erkekler için iki parça) ve yedeği', 'Ihram (two pieces for men) and a spare', 'ملابس الإحرام (قطعتان للرجال) واحتياطية') },
      { id: 'kemer', text: t('Cepli ihram kemeri', 'Ihram belt with pockets', 'حزام الإحرام ذو الجيوب') },
      { id: 'terlik', text: t('Alışkın olduğunuz rahat terlik ya da sandalet', 'Comfortable slippers or sandals you are used to', 'نعال أو صندل مريح معتاد') },
      { id: 'torba', text: t('Ayakkabı torbası (mescitte yanınızda taşımak için)', 'Shoe bag (to carry them in the mosque)', 'كيس للأحذية (لحملها في المسجد)') },
      { id: 'canta', text: t('Küçük sırt ya da bel çantası', 'Small backpack or waist bag', 'حقيبة ظهر أو خصر صغيرة') },
    ],
  },
  {
    id: 'telefon', title: t('Telefon ve para', 'Phone and money', 'الهاتف والمال'),
    items: [
      { id: 'sarj', text: t('Şarj aleti ve taşınabilir şarj', 'Charger and power bank', 'الشاحن وبطارية متنقلة') },
      { id: 'priz', text: t('Priz dönüştürücü (çoğunlukla İngiliz tipi)', 'Plug adapter (mostly the British type)', 'محول قابس (غالبًا النوع البريطاني)') },
      { id: 'riyal', text: t('Bir miktar riyal, bozuk para dahil', 'Some riyals, including small change', 'بعض الريالات مع فكة') },
      { id: 'kart', text: t('Yurt dışında kullanıma açık banka kartı', 'Bank card enabled for use abroad', 'بطاقة مصرفية مفعّلة للاستخدام في الخارج') },
      { id: 'paket', text: t('MATAF: internetsiz paketi indirin', 'MATAF: download the offline pack', 'ماتاف: نزّل الحزمة دون اتصال'), to: '/cevrimdisi' },
      { id: 'grup', text: t('MATAF: aile ve grubunuzu kurun', 'MATAF: set up your family group', 'ماتاف: أنشئ مجموعة العائلة'), to: '/grup' },
    ],
  },
];

export const CHECK_TOTAL = CHECKLIST.reduce((n, g) => n + g.items.length, 0);
