// Hac rehberi içeriği. Fıkhî bilgiler Diyanet İşleri Başkanlığı'nın Hac İlmihali'ne (Hanefî mezhebi, diğer
// mezheplerin görüşleri yerinde belirtilerek) göre özetlenmiştir. Her adımın "src" alanı dayanağını gösterir.
// Hadis numaraları sunnah.com numaralandırmasıyla. Bir ilahiyatçıya kontrol ettirilmesi bekleniyor (yol haritası).
import type { IconName } from '@/components/Icon';
import { DUA_LIB } from './duas';
import type { DuaText } from './tawaf';
import { RABBANA } from './tawaf';
import { TELBIYE, type T3 } from './umre';

export type HacType = 'temettu' | 'ifrad' | 'kiran';

export const HAC_TYPES: { id: HacType; title: T3; text: T3; hedy: boolean }[] = [
  {
    id: 'temettu',
    title: { tr: 'Temettu', en: 'Tamattu‘', ar: 'التمتع' },
    text: {
      tr: 'Hac aylarında önce umre yapılıp ihramdan çıkılır; 8 Zilhicce’de hac için yeniden ihrama girilir. Türkiye’den gidenlerin çoğu bunu yapar. Şükür kurbanı vaciptir.',
      en: 'Umrah first in the Hajj months, then out of ihram; a new ihram for Hajj on 8 Dhu al-Hijjah. Most pilgrims from Türkiye do this. The thanksgiving sacrifice is required.',
    },
    hedy: true,
  },
  {
    id: 'kiran',
    title: { tr: 'Kıran', en: 'Qiran', ar: 'القران' },
    text: {
      tr: 'Umre ve hac için mîkatta birlikte, tek ihramla niyet edilir; umreden sonra ihramdan çıkılmaz. Şükür kurbanı vaciptir.',
      en: 'Umrah and Hajj intended together with one ihram at the miqat; you stay in ihram after umrah. The thanksgiving sacrifice is required.',
    },
    hedy: true,
  },
  {
    id: 'ifrad',
    title: { tr: 'İfrad', en: 'Ifrad', ar: 'الإفراد' },
    text: {
      tr: 'Yalnız hac için ihrama girilir. Kurban vacip değildir (isteyen keser).',
      en: 'Ihram for Hajj only. The sacrifice is not required (voluntary).',
    },
    hedy: false,
  },
];

const libDua = (cat: string, id: string) => {
  const d = DUA_LIB.find((c) => c.id === cat)?.items.find((x) => x.id === id);
  if (!d || !('ar' in d)) throw new Error(`dua yok: ${id}`);
  return d as DuaText;
};

/** Arefe günü tehlili (Tirmizî, 3585) */
export const AREFE_DUA = libDua('hac', 'arafat');

export const TESRIK_TEKBIR: DuaText = {
  id: 'tesrik',
  ar: 'اللَّهُ أَكْبَرُ اللَّهُ أَكْبَرُ، لَا إِلَهَ إِلَّا اللَّهُ وَاللَّهُ أَكْبَرُ، اللَّهُ أَكْبَرُ وَلِلَّهِ الْحَمْدُ',
  tr: 'Allâhu ekber Allâhu ekber, lâ ilâhe illallâhu vallâhu ekber, Allâhu ekber ve lillâhi’l-hamd',
  mean: {
    tr: 'Allah en büyüktür, Allah en büyüktür. Allah’tan başka ilah yoktur. Allah en büyüktür, Allah en büyüktür; hamd Allah’a mahsustur.',
    en: 'Allah is the Greatest, Allah is the Greatest. There is no god but Allah. Allah is the Greatest, Allah is the Greatest, and to Allah belongs all praise.',
    ar: '',
  },
  when: {
    tr: 'Arefe günü sabahından bayramın 4. günü ikindisine kadar her farz namazdan sonra (23 vakit)',
    en: 'After every obligatory prayer from Fajr on the Day of Arafah to Asr on the 4th day of Eid (23 prayers)',
    ar: 'بعد كل فريضة من فجر يوم عرفة إلى عصر رابع أيام العيد',
  },
  ref: 'Hanefîlerde tercih edilen görüş (Ebû Yûsuf ve İmam Muhammed): 23 vakit, vacip · Diyanet',
};

export const CEMRE_TEKBIR: DuaText = {
  id: 'cemre-tekbir',
  ar: 'بِسْمِ اللَّهِ، اللَّهُ أَكْبَرُ',
  tr: 'Bismillâhi Allâhu ekber',
  mean: { tr: 'Allah’ın adıyla; Allah en büyüktür.', en: 'In the name of Allah; Allah is the Greatest.', ar: '' },
  when: { tr: 'Her taşı atarken', en: 'With every pebble', ar: 'مع كل حصاة' },
  ref: 'Her taşta tekbir: Buhârî, 1751',
};

export const MESAR_AYAH: DuaText = {
  id: 'mesar-ayah',
  ar: 'فَإِذَا أَفَضْتُمْ مِنْ عَرَفَاتٍ فَاذْكُرُوا اللَّهَ عِنْدَ الْمَشْعَرِ الْحَرَامِ، وَاذْكُرُوهُ كَمَا هَدَاكُمْ',
  tr: 'Fe izâ efadtüm min Arafâtin fezkürullâhe inde’l-meş‘ari’l-harâm, vezkürûhü kemâ hedâküm',
  mean: {
    tr: 'Arafat’tan akın edip ayrıldığınızda Meş‘ar-i Harâm’da Allah’ı anın; O’nu, size gösterdiği şekilde anın.',
    en: 'When you depart from Arafat, remember Allah at al-Mash‘ar al-Haram, and remember Him as He has guided you.',
    ar: '',
  },
  when: { tr: 'Müzdelife’de', en: 'At Muzdalifah', ar: 'في مزدلفة' },
  ref: 'Bakara 198',
};

export type HacStep = {
  id: string;
  icon: IconName;
  /** Zilhicce günü (8–13); yoksa tarihe bağlı değil */
  dh?: number;
  /** Yalnız bu hac türlerinde gösterilir */
  types?: HacType[];
  title: T3;
  summary: T3;
  todo: T3[];
  duas?: DuaText[];
  mistakes?: { text: T3; penalty?: T3 }[];
  action?: { label: T3; to: string; icon: IconName };
  callout?: { title: T3; text: T3; note?: T3 };
  /** Dayanak */
  src: string[];
};

const DIB = 'Diyanet İşleri Başkanlığı, Hac İlmihali (DİB Yayınları)';

export const HAC_STEPS: HacStep[] = [
  {
    id: 'umre',
    icon: 'kaaba',
    types: ['temettu'],
    title: { tr: 'Varış: umre (temettu)', en: 'Arrival: umrah (tamattu‘)', ar: 'الوصول: العمرة (التمتع)' },
    summary: {
      tr: 'Mîkatta umre niyetiyle ihrama girilir; Mekke’de umre tavafı, sa’y ve tıraşla ihramdan çıkılır. 8 Zilhicce’ye kadar ihramsız beklenir.',
      en: 'Ihram for umrah at the miqat; in Makkah, tawaf, sa‘y and a haircut end the ihram. You wait without ihram until 8 Dhu al-Hijjah.',
    },
    todo: [
      { tr: 'Umre rehberindeki adımları izleyin (mîkat, ihram, tavaf, sa’y, tıraş).', en: 'Follow the Umrah guide (miqat, ihram, tawaf, sa‘y, haircut).' },
      { tr: 'Hac ihramına kadar nafile tavafları çoğaltın; hac için güç toplayın.', en: 'Until the Hajj ihram, do voluntary tawafs and save your strength.' },
    ],
    action: { label: { tr: 'Umre rehberini aç', en: 'Open Umrah guide', ar: 'دليل العمرة' }, to: '/umre', icon: 'kaaba' },
    src: [DIB + ' · Temettu haccının yapılışı'],
  },
  {
    id: 'kudum',
    icon: 'kaaba',
    types: ['ifrad', 'kiran'],
    title: { tr: 'Varış: kudüm tavafı', en: 'Arrival: tawaf al-qudum', ar: 'الوصول: طواف القدوم' },
    summary: {
      tr: 'İfrad ve kıranda mîkatta girilen ihramla Mekke’ye varılır. Kıranda önce umrenin tavaf ve sa’yi yapılır, ihramdan çıkılmaz. Kudüm tavafı sünnettir.',
      en: 'In ifrad and qiran you arrive in the ihram from the miqat. In qiran the umrah tawaf and sa‘y come first and you stay in ihram. The arrival tawaf is sunnah.',
    },
    todo: [
      { tr: 'Kıran: umre tavafı ve sa’yi; tıraş olmayın, ihramda kalın.', en: 'Qiran: umrah tawaf and sa‘y; do not cut hair, stay in ihram.' },
      { tr: 'Kudüm tavafı (sünnet). Ardından haccın sa’yi yapılabilir; o zaman erkekler bu tavafın ilk üç şavtında remel yapar.', en: 'Arrival tawaf (sunnah). Hajj sa‘y may follow; then men do ramal in its first three circuits.' },
    ],
    action: { label: { tr: 'Tavaf asistanı', en: 'Tawaf assistant', ar: 'مساعد الطواف' }, to: '/tavaf', icon: 'kaaba' },
    src: [DIB + ' · Haccın sünnetleri (kudüm tavafı), Tavaf çeşitleri'],
  },
  {
    id: 'terviye',
    icon: 'shield',
    dh: 8,
    title: { tr: '8 Zilhicce · Terviye: hac ihramı', en: '8 Dhu al-Hijjah · Tarwiyah: Hajj ihram', ar: '٨ ذو الحجة · التروية: إحرام الحج' },
    summary: {
      tr: 'Temettu yapanlar bulundukları yerden hac niyetiyle ihrama girer. Sünnet olan, Mina’ya gidip Arefe gecesini orada geçirmektir; kafileler çoğu zaman doğrudan Arafat’a çıkar.',
      en: 'Tamattu‘ pilgrims enter ihram for Hajj where they are. The sunnah is to go to Mina and spend the night before Arafah there; groups often go straight to Arafat.',
    },
    callout: {
      title: { tr: 'Niyet (temettu)', en: 'Intention (tamattu‘)', ar: 'النية' },
      text: { tr: '“Allah’ım! Hac yapmak istiyorum; onu bana kolaylaştır ve kabul eyle.” Ardından telbiye.', en: '“O Allah, I intend Hajj; make it easy for me and accept it.” Then the talbiyah.' },
    },
    todo: [
      { tr: 'Gusül ya da abdest, ihram kıyafeti; iki rekât ihram namazı, niyet ve telbiye.', en: 'Ghusl or wudu, ihram clothes; two rak‘ahs, intention and talbiyah.' },
      { tr: 'İsteyen hac ihramından sonra nafile bir tavaf yapıp haccın sa’yini öne alabilir.', en: 'You may do a voluntary tawaf after the Hajj ihram and perform the Hajj sa‘y early.' },
      { tr: 'Kafilenizin çıkış saatine uyun; su, şemsiye, ilaç, kimlik kartı ve küçük bir çanta yanınızda olsun.', en: 'Follow your group’s departure time; carry water, an umbrella, medicine, your ID card and a small bag.' },
    ],
    duas: [TELBIYE],
    mistakes: [
      { text: { tr: 'Hac ihramına girmeden Arafat’a çıkmak', en: 'Going to Arafat without the Hajj ihram' }, penalty: { tr: 'Vakfe ihramsız geçerli olmaz.', en: 'The standing is not valid without ihram.' } },
    ],
    src: [DIB + ' · Haccın sünnetleri; Temettu haccının yapılışı'],
  },
  {
    id: 'arafat',
    icon: 'sun',
    dh: 9,
    title: { tr: '9 Zilhicce · Arefe: Arafat vakfesi (farz)', en: '9 Dhu al-Hijjah · Arafah: standing at Arafat (fard)', ar: '٩ ذو الحجة · الوقوف بعرفة (ركن)' },
    summary: {
      tr: 'Haccın asıl rüknüdür. Öğle vaktinin girişinden bayram sabahı imsaka kadar Arafat sınırları içinde kısa bir an bulunmak yeterlidir; uyur ya da abdestsiz olmak engel değildir.',
      en: 'The main pillar of Hajj. Being inside Arafat for a moment between the start of Dhuhr and dawn of Eid is enough; sleeping or lacking wudu does not prevent it.',
    },
    callout: {
      title: { tr: 'Sınıra dikkat', en: 'Mind the boundary', ar: 'انتبه للحدود' },
      text: {
        tr: 'Urene vadisi Arafat’tan sayılmaz. Nemire Mescidi’nin ön (kıble) tarafının bir kısmı Arafat dışındadır; içerideki levhalara bakın.',
        en: 'The valley of Uranah is not part of Arafat. Part of the front (qibla side) of Namirah Mosque lies outside Arafat; check the signs inside.',
      },
      note: { tr: 'Uygulamadaki sınır yaklaşık; sahadaki tabelaları esas alın.', en: 'The boundary in the app is approximate; trust the signs on site.' },
    },
    todo: [
      { tr: 'Gündüz Arafat’ta bulunuyorsanız güneş batana kadar Arafat sınırları içinde kalın (vacip).', en: 'If you are at Arafat by day, stay inside its boundary until sunset (wajib).' },
      { tr: 'Öğle ve ikindi: Ebû Hanîfe’ye göre birlikte (cem-i takdim) kılmak için Nemire Mescidi’nde imamla cemaat şarttır; çadırda kılıyorsanız her namazı kendi vaktinde kılın. Diğer imamlara göre cem sünnettir; kafile görevlinizin uygulamasına uyun.', en: 'Dhuhr and Asr: Abu Hanifa requires praying behind the imam at Namirah Mosque to combine them; in your tent pray each at its own time. Other imams hold combining as sunnah; follow your group’s guide.' },
      { tr: 'Vaktinizi dua, zikir, telbiye, istiğfar ve Kur’an ile geçirin; mümkünse kıbleye dönük ve abdestli durun.', en: 'Spend the time in du‘a, dhikr, talbiyah, istighfar and Qur’an; face the qibla with wudu if you can.' },
      { tr: 'Teşrik tekbiri bu sabahtan başlar: her farzdan sonra bir kez.', en: 'Takbir al-tashriq starts this morning: once after every obligatory prayer.' },
      { tr: 'Güneş batınca sakin şekilde Müzdelife’ye hareket edin. Yatsı vaktinin çıkmasından korkulmadıkça akşam namazını Arafat’ta ya da yolda kılmayın.', en: 'After sunset leave calmly for Muzdalifah. Unless Isha time is about to run out, do not pray Maghrib at Arafat or on the way.' },
    ],
    action: { label: { tr: 'Arafat sınırını haritada gör', en: 'See the Arafat boundary', ar: 'حدود عرفة على الخريطة' }, to: '/hac-harita?yer=arafat', icon: 'map' },
    duas: [AREFE_DUA, RABBANA, TESRIK_TEKBIR],
    mistakes: [
      { text: { tr: 'Güneş batmadan Arafat sınırından çıkmak', en: 'Leaving Arafat before sunset' }, penalty: { tr: 'Vacip terk edilir; geri dönülmezse ceza (dem) gerekir.', en: 'A wajib is left; unless you return, a penalty sacrifice (dam) is due.' } },
      { text: { tr: 'Vakfeyi Urene vadisinde ya da Nemire Mescidi’nin dışarıda kalan bölümünde yapmak', en: 'Standing in the valley of Uranah or in the part of Namirah Mosque outside Arafat' }, penalty: { tr: 'Hanefî, Şâfiî ve Hanbelîlere göre vakfe geçerli olmaz.', en: 'Invalid according to Hanafis, Shafi‘is and Hanbalis.' } },
    ],
    src: [DIB + ' · Arafat vakfesi (rüknü, şartları, vacibi, sünnetleri)', 'TDV İslâm Ansiklopedisi, “Vakfe”', 'Tirmizî, 3585 (Arefe duası)'],
  },
  {
    id: 'muzdelife',
    icon: 'moon',
    dh: 9,
    title: { tr: 'Bayram gecesi · Müzdelife', en: 'Eid night · Muzdalifah', ar: 'ليلة العيد · مزدلفة' },
    summary: {
      tr: 'Akşam ve yatsı yatsı vaktinde birlikte kılınır, gece Müzdelife’de geçirilir, taşlar toplanır. Hanefîlere göre vakfe vakti bayram sabahı imsaktan güneş doğana kadardır.',
      en: 'Maghrib and Isha are prayed together at Isha time, the night is spent at Muzdalifah and pebbles are collected. For Hanafis the standing is from dawn to sunrise on Eid.',
    },
    callout: {
      title: { tr: 'Günümüz uygulaması', en: 'Today’s practice', ar: 'التطبيق اليوم' },
      text: {
        tr: 'Yer darlığı ve izdiham nedeniyle Müzdelife vakfesi günümüzde, Arefe günü güneş battıktan sonra bayram sabahı güneş doğuncaya kadar olan zaman diliminde yaptırılmaktadır. Kafile görevlinizin talimatına uyun.',
        en: 'Because of crowding, the Muzdalifah standing is now done in the time between sunset on the Day of Arafah and sunrise on Eid. Follow your group guide.',
      },
    },
    todo: [
      { tr: 'Akşam ve yatsıyı yatsı vaktinde birlikte (cem-i te’hir) kılın; Ebû Hanîfe ve İmam Muhammed’e göre vaciptir.', en: 'Pray Maghrib and Isha together at Isha time; wajib according to Abu Hanifa and Muhammad.' },
      { tr: 'Taş toplayın: nohut büyüklüğünde, temiz; toplam 70 (bayramın 4. günü Mina’da kalmayacaksanız 49) ve birkaç yedek. Büyük taşı kırıp atmayın.', en: 'Collect pebbles: chickpea-sized and clean; 70 in total (49 if you leave Mina before the 4th day) plus a few spares. Do not break big stones.' },
      { tr: 'Geceyi Müzdelife’de geçirmek, sabahı erken kılmak, Meş‘ar-i Harâm civarında dua etmek ve güneş doğmadan Mina’ya gitmek sünnettir.', en: 'Spending the night, praying Fajr early, du‘a near al-Mash‘ar al-Haram and leaving for Mina before sunrise are sunnah.' },
      { tr: 'Kadın, yaşlı ve zayıflar geceden Mina’ya gönderilebilir.', en: 'Women, the elderly and the weak may be sent on to Mina during the night.' },
    ],
    duas: [MESAR_AYAH, TESRIK_TEKBIR],
    mistakes: [
      { text: { tr: 'Muhassir vadisinde vakfe yapmak', en: 'Standing in the valley of Muhassir' }, penalty: { tr: 'Müzdelife’den sayılmaz.', en: 'It is not part of Muzdalifah.' } },
      { text: { tr: 'Mazeretsiz Müzdelife vakfesini terk etmek', en: 'Skipping the Muzdalifah standing without excuse' }, penalty: { tr: 'Vacip terk edilir; ceza (dem) gerekir.', en: 'A wajib is left; a penalty sacrifice (dam) is due.' } },
    ],
    action: { label: { tr: 'Müzdelife ve Mina haritada', en: 'Muzdalifah and Mina on the map', ar: 'مزدلفة ومنى على الخريطة' }, to: '/hac-harita?yer=muzdelife', icon: 'map' },
    src: [DIB + ' · Müzdelife vakfesi; Taşların toplanması', 'TDV İslâm Ansiklopedisi, “Vakfe”'],
  },
  {
    id: 'bayram1',
    icon: 'flag',
    dh: 10,
    title: { tr: '10 Zilhicce · Bayramın 1. günü: Akabe, kurban, tıraş', en: '10 Dhu al-Hijjah · Eid day 1: Aqabah, sacrifice, haircut', ar: '١٠ ذو الحجة · العقبة والهدي والحلق' },
    summary: {
      tr: 'Yalnız büyük şeytana (Akabe cemresi) 7 taş atılır, kurban kesilir (temettu ve kıranda vacip), tıraş olunur. Böylece eşle ilgili yasak dışındaki ihram yasakları kalkar.',
      en: 'Seven pebbles at the big Jamrah (al-Aqabah) only, the sacrifice (required for tamattu‘ and qiran), then the haircut. All ihram restrictions except marital relations end.',
    },
    callout: {
      title: { tr: 'Sıra önemli (Ebû Hanîfe)', en: 'Order matters (Abu Hanifa)', ar: 'الترتيب' },
      text: {
        tr: 'Taş → kurban → tıraş sırası Ebû Hanîfe’ye göre vaciptir; bozulursa dem gerekir. Kurbanınızın kesildiği haber verilmeden tıraş olmayın. (İfradda kurban vacip olmadığından taştan sonra tıraş olunur.)',
        en: 'Pebbles → sacrifice → haircut is wajib for Abu Hanifa; breaking it needs a dam. Do not cut your hair before you are told your sacrifice is done. (In ifrad there is no required sacrifice: haircut after the pebbles.)',
      },
      note: { tr: 'Ebû Yûsuf, İmam Muhammed ve diğer mezheplere göre bu sıra sünnettir.', en: 'For Abu Yusuf, Muhammad and the other schools the order is sunnah.' },
    },
    todo: [
      { tr: 'Akabe’ye 7 taş: vakti imsaktan başlar, ertesi günün imsakına kadar sürer. Her taşta tekbir; taşı sağ elin baş ve işaret parmağıyla tutun. Akabe’de durmadan ayrılın.', en: 'Seven at al-Aqabah: from dawn until the next dawn. Takbir with each; hold the pebble between the right thumb and index finger. Do not stop at al-Aqabah.' },
      { tr: 'İlk taşla telbiye sona erer.', en: 'The talbiyah ends with the first pebble.' },
      { tr: 'Kurban: Harem sınırları içinde, Ebû Hanîfe’ye göre bayramın 3. gününe kadar kesilir. Türk hacılarının kurbanları vekâletle kestirilir. Kurban bulamayan hacda 3, dönüşte 7 gün oruç tutar.', en: 'Sacrifice: within the Haram, by the 3rd day of Eid for Abu Hanifa. Pilgrims from Türkiye have it done by proxy. If unavailable: fast 3 days during Hajj and 7 after returning.' },
      { tr: 'Tıraş: imsaktan sonra başlar; Ebû Hanîfe’ye göre bayramın 3. günü güneş batmadan yapılmalıdır. Erkekler başın en az dörtte birini, kadınlar saç uçlarından parmak ucu kadar keser. Harem sınırları içinde (Mina ya da Mekke) olun.', en: 'Haircut: after dawn; for Abu Hanifa before sunset of Eid day 3. Men at least a quarter of the head; women a fingertip’s length. Do it inside the Haram (Mina or Makkah).' },
    ],
    action: { label: { tr: 'Şeytan taşlama sayacı', en: 'Jamarat counter', ar: 'عداد الجمرات' }, to: '/cemerat', icon: 'flag' },
    duas: [CEMRE_TEKBIR],
    mistakes: [
      { text: { tr: 'Akabe’yi imsaktan önce taşlamak', en: 'Stoning al-Aqabah before dawn' }, penalty: { tr: 'Hanefîlere göre geçerli olmaz; vaktinde yeniden atılır. Diyanet Fetva Kurulu: izdiham nedeniyle bu günün taşları bayramın 4. günü güneş batana kadar atılırsa ceza gerekmez görüşüyle amel edilebilir.', en: 'Invalid for Hanafis; throw again in time. Diyanet: because of crowding, one may follow the view that throwing this day’s pebbles by sunset of day 4 needs no penalty.' } },
      { text: { tr: 'Kurbanı kesilmeden tıraş olmak (temettu, kıran)', en: 'Cutting hair before the sacrifice (tamattu‘, qiran)' }, penalty: { tr: 'Ebû Hanîfe’ye göre dem gerekir.', en: 'A dam for Abu Hanifa.' } },
    ],
    src: [DIB + ' · Cemrelere taş atma; Hedy; Tıraş; Tertip; Tehallül', 'Diyanet Fetva Kurulu (Akabe cemresi ve izdiham)', 'Buhârî, 1751'],
  },
  {
    id: 'ziyaret',
    icon: 'kaaba',
    dh: 10,
    title: { tr: 'Ziyaret tavafı ve haccın sa’yi (farz)', en: 'Tawaf al-Ifadah and Hajj sa‘y (fard)', ar: 'طواف الإفاضة وسعي الحج (ركن)' },
    summary: {
      tr: 'Haccın ikinci rüknüdür. Bayramın 1. günü imsakla başlar; Ebû Hanîfe’ye göre bayramın ilk üç günü içinde yapılması vaciptir. Sa’y önceden yapılmadıysa ardından yapılır. Bu tavafla bütün ihram yasakları kalkar.',
      en: 'The second pillar. It starts at dawn on Eid day 1; for Abu Hanifa it is wajib within the first three days of Eid. Sa‘y follows if not done earlier. All ihram restrictions end with it.',
    },
    todo: [
      { tr: 'Niyet: “Allah’ım! Haccın tavafını yapmak istiyorum; kolaylaştır ve kabul eyle.” 7 şavt, iki rekât tavaf namazı.', en: 'Intention: “O Allah, I intend the tawaf of Hajj; make it easy and accept it.” Seven circuits, two rak‘ahs.' },
      { tr: 'Haccın sa’yini daha önce yapmadıysanız şimdi yapın.', en: 'If you have not done the Hajj sa‘y, do it now.' },
      { tr: 'Özel hâldeki kadınlar tavaf dışındaki bütün görevleri yapar; ziyaret tavafını temizlenince yaparlar, gecikme için ceza gerekmez. Mekke’den ayrılmak zorunda kalırsanız kafile din görevlisine danışın.', en: 'Women in menses do everything except tawaf; they do this tawaf once clean, with no penalty for the delay. If you must leave Makkah, ask your group’s religious guide.' },
    ],
    action: { label: { tr: 'Tavaf asistanı', en: 'Tawaf assistant', ar: 'مساعد الطواف' }, to: '/tavaf', icon: 'kaaba' },
    mistakes: [
      { text: { tr: 'Mazeretsiz bayramın 3. gününden sonraya bırakmak', en: 'Delaying past Eid day 3 without excuse' }, penalty: { tr: 'Ebû Hanîfe’ye göre dem gerekir; tavaf yine yapılır.', en: 'A dam for Abu Hanifa; the tawaf is still done.' } },
    ],
    src: [DIB + ' · Ziyaret tavafı (vakti); Hacda kadınlar', 'Diyanet İslam İlmihali I (özel hâldeki kadınlar)'],
  },
  {
    id: 'tesrik',
    icon: 'flag',
    dh: 11,
    title: { tr: '11–12 (13) Zilhicce · Üç cemreye taş', en: '11–12 (13) Dhu al-Hijjah · All three Jamarat', ar: '١١–١٢ (١٣) ذو الحجة · رمي الجمرات الثلاث' },
    summary: {
      tr: 'Her gün öğle vakti girdikten sonra sırayla küçük, orta ve büyük cemreye yedişer taş atılır. Vakit ertesi günün imsakına kadar sürer.',
      en: 'Each day after Dhuhr begins: seven pebbles each at the small, middle and big Jamrah in that order. The time lasts until the next dawn.',
    },
    todo: [
      { tr: 'Öğleden (zeval) önce atılan taş geçerli olmaz; öğleden sonra yeniden atılır.', en: 'Pebbles thrown before Dhuhr do not count; throw again after Dhuhr.' },
      { tr: 'Küçük ve orta cemreden sonra kenara çekilip kıbleye dönün, ellerinizi kaldırıp dua edin. Büyük cemrede durmadan ayrılın.', en: 'After the small and middle Jamrah step aside, face the qibla and make du‘a with raised hands. Do not stop at the big one.' },
      { tr: 'Sıra (küçük, orta, büyük) Hanefîlere göre sünnettir; diğer mezheplere göre vaciptir.', en: 'The order is sunnah for Hanafis and wajib for the other schools.' },
      { tr: 'Mina’dan erken ayrılmak (nefr-i evvel): 12’sinin taşlarını atıp 13’ünün imsakından önce Mina’dan çıkan 13’ünün taşlarını atmaz. Diğer mezheplere göre güneş batmadan çıkmak gerekir.', en: 'Leaving early: after the 12th’s pebbles, leaving Mina before dawn of the 13th means no pebbles on the 13th. Other schools require leaving before sunset.' },
      { tr: '13’ünde kalanlar o günün taşlarını da atar; vakit güneş batınca biter. Ebû Hanîfe bu günün taşlarını öğleden önce atmayı da caiz görür.', en: 'Those who stay throw on the 13th too, until sunset. Abu Hanifa also allows that day’s pebbles before Dhuhr.' },
      { tr: 'Hasta ve özürlüler vekille attırabilir; vekil önce kendi taşlarını atar. Bayram günlerinde Mina’da gecelemek Hanefîlere göre sünnettir.', en: 'The sick and unable may appoint a proxy, who first throws his own. Spending the Eid nights at Mina is sunnah for Hanafis.' },
    ],
    action: { label: { tr: 'Şeytan taşlama sayacı', en: 'Jamarat counter', ar: 'عداد الجمرات' }, to: '/cemerat', icon: 'flag' },
    duas: [CEMRE_TEKBIR, TESRIK_TEKBIR],
    mistakes: [
      { text: { tr: 'Bir günün taşlarını vaktinde atmamak', en: 'Missing a day’s pebbles in time' }, penalty: { tr: 'Bayramın 4. günü güneş batana kadar kaza edilir; Ebû Hanîfe’ye göre gecikme için dem gerekir. Bir günün taşlarının yarıdan azı eksik kalırsa her taş için fıtre kadar sadaka verilir.', en: 'Make them up by sunset of Eid day 4; Abu Hanifa requires a dam for the delay. If less than half of a day’s pebbles are missed, give a fitrah-sized charity per pebble.' } },
    ],
    src: [DIB + ' · Cemrelere taş atma (2.–4. günler, sayı, kaza, vekâlet)', 'TDV İslâm Ansiklopedisi, “Cemre”', 'Buhârî, 1751'],
  },
  {
    id: 'veda',
    icon: 'nav',
    title: { tr: 'Veda tavafı (vacip)', en: 'Farewell tawaf (wajib)', ar: 'طواف الوداع (واجب)' },
    summary: {
      tr: 'Mekke’den ayrılırken yapılan son tavaftır; uzaktan gelenler (âfâkî) için vaciptir. Özel hâldeki kadınlar bu tavaftan muaftır.',
      en: 'The last tawaf before leaving Makkah; wajib for pilgrims from afar. Women in menses are exempt.',
    },
    todo: [
      { tr: 'Niyet: “Allah’ım! Veda tavafı yapmak istiyorum; kolaylaştır ve kabul eyle.”', en: 'Intention: “O Allah, I intend the farewell tawaf; make it easy and accept it.”' },
      { tr: 'Özel hâldeki kadınlar tavaf yapmaz; Mescid-i Harâm’ın kapısında durup dua edebilirler.', en: 'Women in menses do not do it; they may stand at the gate of al-Masjid al-Haram and make du‘a.' },
    ],
    action: { label: { tr: 'Tavaf asistanı', en: 'Tawaf assistant', ar: 'مساعد الطواف' }, to: '/tavaf', icon: 'kaaba' },
    mistakes: [
      { text: { tr: 'Veda tavafı yapmadan ayrılmak', en: 'Leaving without the farewell tawaf' }, penalty: { tr: 'Mîkat geçilmediyse dönüp yapılır; geçildiyse dem gerekir.', en: 'Return and do it if the miqat is not passed; otherwise a dam is due.' } },
    ],
    src: [DIB + ' · Veda tavafı'],
  },
];

export const HAC_PILLARS: { title: T3; items: T3[] }[] = [
  {
    title: { tr: 'Farzlar', en: 'Obligatory (fard)', ar: 'الأركان' },
    items: [
      { tr: 'İhram (şart)', en: 'Ihram (condition)' },
      { tr: 'Arafat vakfesi (rükün)', en: 'Standing at Arafat (pillar)' },
      { tr: 'Ziyaret tavafı (rükün)', en: 'Tawaf al-Ifadah (pillar)' },
    ],
  },
  {
    title: { tr: 'Vacipler (Hanefî)', en: 'Required (wajib, Hanafi)', ar: 'الواجبات (الحنفية)' },
    items: [
      { tr: 'Sa’y', en: 'Sa‘y' },
      { tr: 'Müzdelife vakfesi', en: 'Standing at Muzdalifah' },
      { tr: 'Şeytan taşlama', en: 'Stoning the Jamarat' },
      { tr: 'Tıraş olmak ya da saçları kısaltmak', en: 'Shaving or shortening the hair' },
      { tr: 'Veda tavafı (âfâkî için)', en: 'Farewell tawaf (for those from afar)' },
      { tr: 'Temettu ve kıranda şükür kurbanı', en: 'Thanksgiving sacrifice in tamattu‘ and qiran' },
    ],
  },
  {
    title: { tr: 'Başlıca sünnetler', en: 'Main sunnahs', ar: 'أهم السنن' },
    items: [
      { tr: 'Kudüm tavafı (ifrad ve kıran)', en: 'Arrival tawaf (ifrad and qiran)' },
      { tr: 'Mekke, Arafat ve Mina’daki hutbeler', en: 'The sermons in Makkah, Arafat and Mina' },
      { tr: 'Arefe gecesini Mina’da geçirmek', en: 'The night before Arafah at Mina' },
      { tr: 'Bayram gecesini Müzdelife’de geçirmek', en: 'The night of Eid at Muzdalifah' },
      { tr: 'Bayram günlerinde Mina’da kalmak', en: 'Staying at Mina on the days of Eid' },
    ],
  },
];

export const HAC_NOTE: T3 = {
  tr: 'Mezhep farkları yerinde belirtildi; uygulamada kafilenizin din görevlisine uyun. Vacibi mazeretsiz terk etmek dem (koyun ya da keçi) gerektirir, mazeretle terk edene ceza gerekmez.',
  en: 'School differences are noted where they matter; follow your group’s religious guide. Leaving a wajib without excuse requires a dam (a sheep or goat); with a valid excuse there is no penalty.',
};

export const HAC_SOURCES = [
  'Diyanet İşleri Başkanlığı, Hac İlmihali (DİB Yayınları)',
  'Diyanet İşleri Başkanlığı, İslam İlmihali I',
  'Diyanet Fetva Kurulu: Akabe cemresinin izdiham nedeniyle geciktirilmesi',
  'TDV İslâm Ansiklopedisi: “Cemre”, “Vakfe”',
  'Hadis: Buhârî 1549 (telbiye), 1751 (cemrelerde tekbir ve dua); Tirmizî 3585 (Arefe duası)',
  'Kur’an: Bakara 198, 201',
];
