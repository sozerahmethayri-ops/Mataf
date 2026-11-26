// Mescid-i Haram'da yaşlı ve engelli ziyaretçiler için tekerlekli sandalye ve golf arabası hizmetleri.
// Kaynak: Haremeyn İşleri Genel Kurumu duyuruları (SPA ve basın, 2024–2026). Yerler ve kurallar sezona göre değişebilir.
import type { IconName } from '@/components/Icon';

type T3 = { tr: string; en: string; ar: string };

export const ACCESS_SITE = 'https://alharamain.gov.sa';

export const ACCESS_CARDS: { icon: IconName; title: T3; text: T3 }[] = [
  {
    icon: 'wheel',
    title: { tr: 'Ücretsiz tekerlekli sandalye', en: 'Free wheelchair', ar: 'كرسي متحرك مجاني' },
    text: {
      tr: 'Yaşlı ve engelliler için 24 saat ücretsiz. Sandalyeyi yanınızdaki kişi iter. Teslim noktaları doğu avlusunda Selâm Kapısı (19) ve batı avlusunda Şubeyke Köprüsü yanında. İş bitince aynı noktaya iade edilir. Ramazan ve hac günlerinde sandalye bitebilir; mümkünse katlanır bir sandalye getirin.',
      en: 'Free around the clock for the elderly and people with disabilities; your companion pushes it. Pick-up points: the eastern courtyard at Bab al-Salam (19) and the western courtyard by the Shubaika Bridge. Return it to the same point. In Ramadan and Hajj they can run out; bring a folding wheelchair if you can.',
      ar: 'مجانًا على مدار الساعة لكبار السن وذوي الإعاقة، ويدفعه مرافقك. نقاط التسليم: الساحة الشرقية عند باب السلام (19) والساحة الغربية عند جسر الشبيكة. يُعاد إلى النقطة نفسها. قد تنفد في رمضان والحج، فأحضر كرسيًا قابلًا للطي إن استطعت.',
    },
  },
  {
    icon: 'car',
    title: { tr: 'Golf arabası ve itici ile sandalye', en: 'Golf cart or pushed wheelchair', ar: 'عربة القولف أو العربة بدافع' },
    text: {
      tr: 'Ücretli. Tavaf, sa’y ya da tam umre için gün ve saat seçerek Haremeyn İdaresi’nin “Birleşik Ulaşım Platformu”ndan önceden ayırtılır; golf arabaları yalnız bu platformla ayrılır. 65 yaş üstüne rezervasyon önerilir; yapamayanlar Harem’deki hizmet noktalarına başvurabilir. Noktalar Ecyad (Kral Abdülaziz Kapısı) tarafında ve Şubeyke Köprüsü girişinde. Biletinizi ve kimliğinizi yanınıza alıp saatinde gelin.',
      en: 'Paid. Book ahead on the Authority’s Unified Mobility Platform for tawaf, sa‘y or a full umrah at a chosen date and time; golf carts are booked only there. Booking is advised for those over 65; others can ask at service points in the mosque. Points are on the Ajyad side (King Abdulaziz Gate) and at the Shubaika Bridge entrance. Arrive on time with your ticket and ID.',
      ar: 'بأجر. يُحجز مسبقًا عبر «منصة التنقل الموحدة» التابعة للهيئة للطواف أو السعي أو العمرة كاملة مع اختيار اليوم والوقت، ولا تُحجز عربات القولف إلا عبرها. يُنصح من تجاوز 65 عامًا بالحجز، ويمكن لغيرهم مراجعة نقاط الخدمة. النقاط في جهة أجياد (باب الملك عبدالعزيز) ومدخل جسر الشبيكة. احضر في موعدك ومعك التذكرة والهوية.',
    },
  },
  {
    icon: 'aid',
    title: { tr: 'Engelli ziyaretçiler', en: 'Visitors with disabilities', ar: 'ذوو الإعاقة' },
    text: {
      tr: 'Engelli ziyaretçi, rezervasyon yapmadan golf arabası noktasına gidip bir refakatçiyle ücretsiz yararlanabilir. Harem’de engellilere ayrılmış namaz alanları da var; yerini görevlilere sorun.',
      en: 'A visitor with a disability can go straight to a golf-cart point and ride free with one companion, without booking. There are also prayer areas reserved for people with disabilities; ask the staff where they are.',
      ar: 'يمكن لذي الإعاقة التوجه مباشرة إلى نقطة عربات القولف والاستفادة مجانًا مع مرافق دون حجز. وفي المسجد مصليات مخصصة لذوي الإعاقة؛ اسأل المنظمين عن أماكنها.',
    },
  },
  {
    icon: 'hotel',
    title: { tr: 'Otelden alma', en: 'Pick-up from your hotel', ar: 'النقل من الفندق' },
    text: {
      tr: 'Harem’e yakın bazı otellerde araba aynı platformdan otele çağrılabilir. Görevli sizi tavafa ya da umreye götürür; tam hizmette otele geri getirir.',
      en: 'At some hotels near the mosque you can call a cart to the hotel on the same platform. A staff member takes you for tawaf or umrah and, with the full service, back to the hotel.',
      ar: 'في بعض الفنادق القريبة يمكن طلب العربة إلى الفندق عبر المنصة نفسها، ويرافقك مرافق معتمد للطواف أو العمرة ثم يعيدك إلى الفندق في الخدمة الكاملة.',
    },
  },
  {
    icon: 'walk',
    title: { tr: 'Sa’y ve tavafta', en: 'During sa‘y and tawaf', ar: 'في السعي والطواف' },
    text: {
      tr: 'Mes’a’da (Safa–Merve) tekerlekli sandalyeler için ayrı şerit var. Kalabalıkta tavafı üst katlarda yapmak daha rahattır. Sandalye ya da arabayla tavaf ve sa’y caizdir; ara vermek de caizdir.',
      en: 'The Mas‘a (Safa–Marwa) has a separate wheelchair lane. In crowds, tawaf on the upper floors is easier. Tawaf and sa‘y in a wheelchair or cart are valid, and resting in between is allowed.',
      ar: 'في المسعى مسار مخصص للكراسي المتحركة. وفي الزحام يكون الطواف في الأدوار العليا أيسر. ويصح الطواف والسعي بالكرسي أو العربة، وتجوز الاستراحة بينهما.',
    },
  },
];

export const ACCESS_NOTE: T3 = {
  tr: 'Bilgiler Haremeyn İşleri Genel Kurumu duyurularına dayanır (Suudi Basın Ajansı ve basın, 2024–2026; son kontrol Kasım 2026). Yerler ve kurallar sezona göre değişebilir; görevlilere sorun.',
  en: 'Based on announcements of the General Authority for the Care of the Two Holy Mosques (Saudi Press Agency and press, 2024–2026; last checked November 2026). Locations and rules change by season; ask the staff.',
  ar: 'المعلومات من إعلانات الهيئة العامة للعناية بشؤون المسجد الحرام والمسجد النبوي (واس والصحافة، 2024–2026؛ آخر مراجعة نوفمبر 2026). قد تتغير المواقع والقواعد بحسب الموسم؛ اسأل المنظمين.',
};
