// Haremeyn Hızlı Treni: istasyonlar (OpenStreetMap, ODbL; 26 Kasım 2026) ve yolcu bilgisi.
// Süreler: Suudi Basın Ajansı / Hac ve Umre Bakanlığı haberleri (Mayıs 2026). Bilet ve sefer saatleri değişir;
// uygulama yalnız resmî siteye yönlendirir.
type T3 = { tr: string; en: string; ar: string };
export type Station = { id: string; lat: number; lng: number; name: T3; note?: T3 };

export const HHR_STATIONS: Station[] = [
  { id: 'makkah', lat: 21.41766, lng: 39.78853, name: { tr: 'Mekke', en: 'Makkah', ar: 'مكة المكرمة' }, note: { tr: 'Rusayfa', en: 'Al-Rusaifah', ar: 'الرصيفة' } },
  { id: 'jeddah', lat: 21.5166, lng: 39.24526, name: { tr: 'Cidde – Süleymaniye', en: 'Jeddah – Al-Sulaymaniyah', ar: 'جدة – السليمانية' } },
  { id: 'kaia', lat: 21.6605, lng: 39.17382, name: { tr: 'Cidde Havalimanı (KAIA)', en: 'Jeddah Airport (KAIA)', ar: 'مطار الملك عبدالعزيز الدولي' }, note: { tr: '1. Terminal’e bağlı', en: 'Connected to Terminal 1', ar: 'متصلة بالصالة 1' } },
  { id: 'kaec', lat: 22.42182, lng: 39.19175, name: { tr: 'Kral Abdullah Ekonomik Şehri', en: 'King Abdullah Economic City', ar: 'مدينة الملك عبدالله الاقتصادية' }, note: { tr: 'Rabiğ', en: 'Rabigh', ar: 'رابغ' } },
  { id: 'madinah', lat: 24.4723, lng: 39.6996, name: { tr: 'Medine', en: 'Madinah', ar: 'المدينة المنورة' } },
];

export const HHR_TIMES: { from: T3; to: T3; time: T3 }[] = [
  { from: { tr: 'Mekke', en: 'Makkah', ar: 'مكة' }, to: { tr: 'Medine', en: 'Madinah', ar: 'المدينة' }, time: { tr: 'yaklaşık 2 sa 15 dk', en: 'about 2 h 15 min', ar: 'نحو ساعتين وربع' } },
  { from: { tr: 'Cidde Havalimanı', en: 'Jeddah Airport', ar: 'مطار جدة' }, to: { tr: 'Mekke', en: 'Makkah', ar: 'مكة' }, time: { tr: 'yaklaşık 45 dk', en: 'about 45 min', ar: 'نحو 45 دقيقة' } },
  { from: { tr: 'Cidde Havalimanı', en: 'Jeddah Airport', ar: 'مطار جدة' }, to: { tr: 'Medine', en: 'Madinah', ar: 'المدينة' }, time: { tr: 'yaklaşık 1 sa 45 dk', en: 'about 1 h 45 min', ar: 'نحو ساعة و45 دقيقة' } },
];

export const HHR_TIPS: T3[] = [
  { tr: 'Bilet resmî sitede (sar.hhr.sa), resmî uygulamada ya da istasyon gişelerinde satılır. Yabancı yolcular her bilete pasaport bilgisi girer.', en: 'Tickets are sold on the official site (sar.hhr.sa), the official app or at station counters. Foreign passengers enter passport details for each ticket.', ar: 'تُباع التذاكر عبر الموقع الرسمي (sar.hhr.sa) أو التطبيق الرسمي أو مكاتب المحطات. يدخل الركاب الأجانب بيانات الجواز لكل تذكرة.' },
  { tr: 'Hac, Ramazan ve hafta sonlarında biletler çabuk biter; önceden alın. Ücretler tarihe göre değişir.', en: 'Tickets sell out fast during Hajj, Ramadan and weekends; book early. Fares vary by date.', ar: 'تنفد التذاكر سريعًا في الحج ورمضان وعطلة نهاية الأسبوع؛ احجز مبكرًا. تختلف الأسعار حسب التاريخ.' },
  { tr: 'Bagaj: genel kural kişi başı bir büyük bavul (en çok 25 kg) ve bir el çantasıdır; biletinizdeki koşullara bakın.', en: 'Luggage: the usual rule is one large suitcase (up to 25 kg) and one hand bag per person; check your ticket’s terms.', ar: 'الأمتعة: القاعدة المعتادة حقيبة كبيرة واحدة (حتى 25 كغ) وحقيبة يد لكل راكب؛ راجع شروط تذكرتك.' },
  { tr: 'İstasyonlar şehir merkezinin dışında; Harem’e taksi ya da otobüsle gidilir. Trenden 30–45 dakika önce istasyonda olun.', en: 'Stations are outside the city centres; take a taxi or bus to the Haram. Be at the station 30–45 minutes early.', ar: 'المحطات خارج وسط المدينة؛ استخدم سيارة أجرة أو حافلة إلى الحرم. كن في المحطة قبل 30–45 دقيقة.' },
];

export const HHR_LINKS = {
  book: 'https://sar.hhr.sa',
  timetable: 'https://sar.hhr.sa/timetable',
};
