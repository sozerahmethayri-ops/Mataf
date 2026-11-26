// Umre rehberi ve sa'y içeriği. Fıkhî bilgiler Diyanet İşleri Başkanlığı'nın Hac ve Umre İlmihali'ne
// (Hanefî mezhebi) göre özetlenmiştir; hadis numaraları sunnah.com numaralandırmasıyla. Arapça arayüzde
// açıklama metni yoksa İngilizcesi gösterilir. Bir ilahiyatçıya kontrol ettirilmesi bekleniyor (yol haritası).
import type { IconName } from '@/components/Icon';
import { DUA_LIB } from './duas';
import type { DuaText } from './tawaf';
import { MAQAM_AYAH } from './tawaf';

/** TR ve EN zorunlu; AR yoksa EN gösterilir. */
export type T3 = { tr: string; en: string; ar?: string };

const lib = (id: string) => {
  for (const c of DUA_LIB) for (const d of c.items) if (d.id === id && 'ar' in d) return d as DuaText;
  throw new Error(`dua yok: ${id}`);
};

export const TELBIYE = lib('telbiye');
export const ENTER_MOSQUE = lib('enter');
export const SAFA_DHIKR = lib('safa-dhikr');

export const SAFA_AYAH: DuaText = {
  id: 'safa-ayah-text',
  ar: 'إِنَّ الصَّفَا وَالْمَرْوَةَ مِنْ شَعَائِرِ اللَّهِ، أَبْدَأُ بِمَا بَدَأَ اللَّهُ بِهِ',
  tr: 'İnne’s-Safâ ve’l-Mervete min şeâirillâh. Ebdeü bimâ bedeallâhü bih',
  mean: {
    tr: 'Şüphesiz Safâ ile Merve Allah’ın nişanelerindendir. Allah’ın başladığı yerden başlıyorum.',
    en: 'Indeed, Safa and Marwah are among the symbols of Allah. I begin with what Allah began with.',
    ar: '',
  },
  when: { tr: 'Safâ’ya ilk yaklaşırken (yalnız birinci şavtın başında)', en: 'When first approaching Safa (only at the start)', ar: 'عند الدنو من الصفا أول مرة' },
  ref: 'Bakara 158 · Müslim, 1218',
};

export const SAY_BETWEEN: DuaText = {
  id: 'say-between',
  ar: 'رَبِّ اغْفِرْ وَارْحَمْ، إِنَّكَ أَنْتَ الْأَعَزُّ الْأَكْرَمُ',
  tr: 'Rabbi’ğfir verham, inneke ente’l-eazzü’l-ekram',
  mean: {
    tr: 'Rabbim! Bağışla ve merhamet et; şüphesiz sen en güçlü, en cömert olansın.',
    en: 'My Lord, forgive and have mercy; You are the Most Mighty, the Most Generous.',
    ar: '',
  },
  when: { tr: 'Safâ ile Merve arasında', en: 'Between Safa and Marwah', ar: 'بين الصفا والمروة' },
  ref: 'İbn Mes’ûd ve İbn Ömer’in sa’yde okuduğu (İbn Ebî Şeybe, Musannef) — sahabe uygulaması',
};

export type UmreStep = {
  id: string;
  icon: IconName;
  title: T3;
  summary: T3;
  todo: T3[];
  duas?: DuaText[];
  /** Sık yapılan hatalar ve (varsa) cezası */
  mistakes?: { text: T3; penalty?: T3 }[];
  action?: { label: T3; to: string; icon: IconName };
  /** Niyet metni gibi vurgulu kart */
  callout?: { title: T3; text: T3; note?: T3 };
};

export const UMRE_STEPS: UmreStep[] = [
  {
    id: 'mikat',
    icon: 'flag',
    title: { tr: 'Mîkat ve hazırlık', en: 'Miqat and preparation', ar: 'الميقات والاستعداد' },
    summary: {
      tr: 'Umreye niyetli olan, mîkat sınırını geçmeden ihrama girer.',
      en: 'Anyone intending umrah enters ihram before crossing the miqat boundary.',
      ar: 'من أراد العمرة أحرم قبل مجاوزة الميقات.',
    },
    todo: [
      {
        tr: 'Türkiye’den uçakla doğrudan Cidde’ye gidenler, uçak Cuhfe (Râbiğ) hizasına gelmeden ihrama girer. Mîkata yaklaşıldığı genellikle anons edilir; ihram kıyafeti evde ya da havalimanında giyilebilir, niyet ve telbiye uçakta mîkattan önce yapılır.',
        en: 'If you fly directly to Jeddah, enter ihram before the plane reaches the line of al-Juhfah (Rabigh). The crew usually announces it; you may put on the ihram garments at home or at the airport and make the intention and talbiyah on the plane before the miqat.',
      },
      {
        tr: 'Önce Medine’ye gidenler, Mekke’ye çıkarken Zülhuleyfe (Âbâr-ı Ali, Mîkat Mescidi) mîkatında ihrama girer.',
        en: 'If you go to Madinah first, enter ihram at Dhul-Hulayfah (Abyar Ali, the Miqat Mosque) on the way to Makkah.',
      },
      {
        tr: 'Mekke’de bulunanlar (ör. ikinci umre için) Harem sınırının dışına çıkar; çoğunlukla Ten’îm’deki Hz. Âişe Mescidi ya da Ci’râne’de ihrama girilir.',
        en: 'If you are already in Makkah (e.g. for another umrah), go outside the Haram boundary, usually to the Aisha Mosque at Tan‘im or to Ji‘ranah.',
      },
      {
        tr: 'Tırnaklarınızı kesin, istenmeyen tüyleri temizleyin, gusül ya da abdest alın (sünnet). Bedene koku sürülebilir; ihram kumaşına sürülmez.',
        en: 'Trim your nails, remove unwanted hair, and take a ghusl or wudu (sunnah). Perfume may be applied to the body, not to the ihram cloth.',
      },
    ],
    mistakes: [
      {
        text: { tr: 'Mîkatı ihramsız geçmek', en: 'Crossing the miqat without ihram' },
        penalty: {
          tr: 'Dem gerekir. Geri dönüp mîkatta ihrama girer ve umrenin hiçbir işine başlamadan bunu yaparsa ceza düşer.',
          en: 'A dam (sacrifice) is due. It drops if you go back and enter ihram at the miqat before starting any rite.',
        },
      },
    ],
  },
  {
    id: 'ihram',
    icon: 'star',
    title: { tr: 'İhrama girme: niyet ve telbiye', en: 'Entering ihram: intention and talbiyah', ar: 'الإحرام: النية والتلبية' },
    summary: {
      tr: 'Hanefî mezhebine göre niyet ile telbiye birlikte yapılınca ihrama girilmiş olur.',
      en: 'In the Hanafi school, ihram begins when the intention is made together with the talbiyah.',
      ar: 'ينعقد الإحرام عند الحنفية بالنية مع التلبية.',
    },
    todo: [
      {
        tr: 'Erkekler: dikişsiz iki parça örtü giyer; biri belden aşağı (izâr), diğeri omuzlara (ridâ). Baş açık kalır; ayağın üstünü ve topukları açıkta bırakan terlik ya da sandalet giyilir.',
        en: 'Men: wear two unstitched cloths, one around the waist (izar) and one over the shoulders (rida). The head stays uncovered; wear sandals that leave the top of the foot and the heels uncovered.',
      },
      {
        tr: 'Kadınlar: tesettüre uygun normal elbiselerini giyer; yüz ve eller açık kalır, peçe ve eldiven takılmaz.',
        en: 'Women: wear their normal modest clothes; the face and hands stay uncovered — no niqab or gloves.',
      },
      {
        tr: 'Kerahat vakti değilse ihram için iki rekât namaz kılınır (sünnet); uçakta kılınamıyorsa terk edilir.',
        en: 'If it is not a disliked time, pray two rak‘ahs for ihram (sunnah); skip them if this is not possible on the plane.',
      },
      {
        tr: 'Niyet edip telbiyeyi söyleyin. Erkekler telbiyeyi yüksek sesle, kadınlar kendi duyacakları kadar söyler. İhram boyunca sık sık tekrarlanır.',
        en: 'Make the intention and say the talbiyah. Men say it aloud; women say it so that they themselves hear it. Repeat it often while in ihram.',
      },
      {
        tr: 'Umrede telbiye, tavafa başlarken Hacerü’l-Esved istilam edilince kesilir.',
        en: 'In umrah, the talbiyah stops when you begin tawaf by saluting the Black Stone.',
      },
    ],
    callout: {
      title: { tr: 'Niyet', en: 'Intention', ar: 'النية' },
      text: {
        tr: 'Allah’ım! Senin rızan için umre yapmak istiyorum. Onu bana kolaylaştır ve kabul eyle.',
        en: 'O Allah, I intend to perform umrah for Your sake. Make it easy for me and accept it from me.',
        ar: 'اللهم إني أريد العمرة فيسّرها لي وتقبّلها مني.',
      },
      note: {
        tr: 'Niyet kalpte yapılır; dille söylemek şart değildir.',
        en: 'The intention is in the heart; saying it aloud is not required.',
        ar: 'النية محلها القلب، ولا يشترط التلفظ بها.',
      },
    },
    duas: [TELBIYE],
  },
  {
    id: 'varis',
    icon: 'gate',
    title: { tr: 'Mekke’ye varış ve Mescid-i Haram’a giriş', en: 'Arriving in Makkah and entering the Haram', ar: 'الوصول إلى مكة ودخول المسجد الحرام' },
    summary: {
      tr: 'Otele yerleşip dinlenin; abdestli olarak Mescid-i Haram’a gidin.',
      en: 'Settle in and rest at your hotel; go to the Haram in a state of wudu.',
      ar: 'استقر في فندقك ثم توجه إلى المسجد الحرام على وضوء.',
    },
    todo: [
      {
        tr: 'Acele etmeyin: yorgunsanız önce dinlenin. İhram yasakları siz ihramdan çıkana kadar sürer.',
        en: 'There is no rush: rest first if you are tired. The ihram restrictions continue until you leave ihram.',
      },
      {
        tr: 'Otelinizin konumunu kaydedin (Menü → Otelime dön); kalabalıkta dönüş yolunu bulmak kolaylaşır.',
        en: 'Save your hotel location (Menu → Back to my hotel); it makes finding your way back easier in the crowds.',
      },
      {
        tr: 'Mescide sağ ayakla, giriş duasıyla girin. Hangi kapıdan gireceğinizi önceden seçin ve kapı numarasını not edin; buluşma yeri olarak da kullanın.',
        en: 'Enter with your right foot, saying the du‘a for entering. Choose your gate in advance and note its number; use it as your meeting point.',
      },
      {
        tr: 'Kâbe’yi ilk gördüğünüzde dilediğiniz duayı edin, sonra tavaf için Mataf’a (Kâbe çevresi) ya da kalabalıksa üst katlara geçin.',
        en: 'When you first see the Kaaba, make any du‘a you wish, then go to the Mataf around the Kaaba, or to the upper floors if it is crowded.',
      },
    ],
    duas: [ENTER_MOSQUE],
    action: { label: { tr: 'Kapı ve yol tarifi', en: 'Gates and directions', ar: 'الأبواب والاتجاهات' }, to: '/harita', icon: 'map' },
  },
  {
    id: 'tavaf',
    icon: 'kaaba',
    title: { tr: 'Umre tavafı', en: 'Umrah tawaf', ar: 'طواف العمرة' },
    summary: {
      tr: 'Kâbe solunuzda kalacak şekilde, Hacerü’l-Esved hizasından başlayarak 7 şavt.',
      en: 'Seven rounds with the Kaaba on your left, starting in line with the Black Stone.',
      ar: 'سبعة أشواط تجعل فيها الكعبة عن يسارك مبتدئًا من محاذاة الحجر الأسود.',
    },
    todo: [
      { tr: 'Abdestli olun; tavafta abdest gerekir.', en: 'Be in wudu; it is required for tawaf.' },
      {
        tr: 'Erkekler: tavaftan önce ıztıba yapar (ridânın ortası sağ koltuk altından geçirilip ucu sol omza atılır) ve ilk üç şavtta remel yapar (kısa adımlarla, omuzları silkerek çabuk yürümek). Kalabalıkta remel yapılamıyorsa terk edilir.',
        en: 'Men: uncover the right shoulder before tawaf (idtiba) and walk briskly with short steps in the first three rounds (ramal). Skip ramal if the crowd does not allow it.',
      },
      { tr: 'Hacerü’l-Esved hizasında istilam edip başlayın; her şavtın başında tekrarlayın.', en: 'Begin by saluting the Black Stone from its line; repeat at the start of each round.' },
      { tr: 'Hatîm’in (yarım daire duvar) dışından yürüyün; Rükn-i Yemânî ile Hacerü’l-Esved arasında “Rabbenâ âtinâ” okuyun.', en: 'Walk outside the Hatim (the semicircular wall); between the Yemeni Corner and the Black Stone recite “Rabbana atina”.' },
      { tr: 'Tavaf asistanı şavtları GPS ile sayar ve her köşede ne yapacağınızı söyler.', en: 'The tawaf assistant counts rounds by GPS and tells you what to do at each corner.' },
    ],
    mistakes: [
      { text: { tr: 'Hatîm’in içinden geçmek', en: 'Passing inside the Hatim' }, penalty: { tr: 'O şavt sayılmaz; yeniden yapılır.', en: 'That round does not count and must be redone.' } },
      { text: { tr: 'Şavt sayısında şüphe', en: 'Doubt about the number of rounds' }, penalty: { tr: 'Az olan esas alınır ve tamamlanır.', en: 'Take the lower number and complete the rest.' } },
      {
        text: { tr: 'Abdestsiz tavaf', en: 'Tawaf without wudu' },
        penalty: { tr: 'Tavaf abdestle yeniden yapılır; yapılmazsa dem gerekir.', en: 'Repeat the tawaf with wudu; otherwise a dam is due.' },
      },
      { text: { tr: 'Hacerü’l-Esved’e ulaşmak için itişmek', en: 'Pushing to reach the Black Stone' }, penalty: { tr: 'Ceza gerektirmez ama başkasına eziyet günahtır; uzaktan selamlamak yeterlidir.', en: 'No penalty, but harming others is sinful; saluting from a distance is enough.' } },
    ],
    action: { label: { tr: 'Tavaf asistanını aç', en: 'Open the tawaf assistant', ar: 'افتح مساعد الطواف' }, to: '/tavaf', icon: 'kaaba' },
  },
  {
    id: 'namaz',
    icon: 'water',
    title: { tr: 'Tavaf namazı ve Zemzem', en: 'Prayer of tawaf and Zamzam', ar: 'ركعتا الطواف وزمزم' },
    summary: {
      tr: 'İki rekât tavaf namazı (Hanefî’ye göre vâcip), ardından Zemzem.',
      en: 'Two rak‘ahs of tawaf (wajib in the Hanafi school), then Zamzam.',
      ar: 'ركعتا الطواف (واجبتان عند الحنفية) ثم زمزم.',
    },
    todo: [
      { tr: 'Erkekler omzunu örter (ıztıba biter).', en: 'Men cover the right shoulder again (idtiba ends).' },
      {
        tr: 'Mümkünse Makam-ı İbrâhîm’in arkasında, kalabalıksa mescidin herhangi bir yerinde iki rekât kılın; birinci rekâtta Kâfirûn, ikincide İhlâs okumak sünnettir. Kerahat vaktine denk gelirse vakit çıkınca kılınır.',
        en: 'Pray two rak‘ahs behind the Maqam if possible, otherwise anywhere in the mosque; it is sunnah to recite al-Kafirun and al-Ikhlas. If it is a disliked time, pray them when it ends.',
      },
      { tr: 'Zemzem içip dua edin.', en: 'Drink Zamzam and make du‘a.' },
      { tr: 'İsterseniz kalabalık değilse Mültezem’de dua edin; sonra Hacerü’l-Esved’i bir kez daha istilam edip Safâ’ya geçin.', en: 'If it is not crowded you may pray at the Multazam; then salute the Black Stone once more and go to Safa.' },
    ],
    duas: [MAQAM_AYAH],
  },
  {
    id: 'say',
    icon: 'walk',
    title: { tr: 'Sa’y', en: 'Sa‘y', ar: 'السعي' },
    summary: {
      tr: 'Safâ’dan başlayıp Merve’de biten 7 şavt: Safâ → Merve bir, Merve → Safâ bir şavt.',
      en: 'Seven trips starting at Safa and ending at Marwah: Safa → Marwah is one, Marwah → Safa is another.',
      ar: 'سبعة أشواط تبدأ بالصفا وتنتهي بالمروة؛ الذهاب شوط والعودة شوط.',
    },
    todo: [
      { tr: 'Safâ’ya çıkınca Kâbe’ye dönüp tekbir getirin, aşağıdaki zikri okuyun ve dua edin; bunu üç kez yapın. Merve’de de aynısı yapılır.', en: 'On Safa, face the Kaaba, say takbir, recite the dhikr below and make du‘a, three times. Do the same on Marwah.' },
      { tr: 'Yeşil ışıklarla işaretli bölümde erkekler hafifçe koşar (hervele); kadınlar normal yürür.', en: 'In the section marked by green lights, men jog lightly; women walk normally.' },
      { tr: 'Sa’y için abdest şart değildir ama abdestli olmak güzeldir. Özel hâldeki kadın da sa’y yapabilir (tavaftan sonra).', en: 'Wudu is not required for sa‘y but is recommended. A menstruating woman may perform sa‘y (after tawaf).' },
      { tr: 'Dinlenmek için ara vermek, tekerlekli sandalye ya da elektrikli araba kullanmak caizdir.', en: 'You may rest in between, and you may use a wheelchair or electric cart.' },
    ],
    duas: [SAFA_AYAH, SAFA_DHIKR, SAY_BETWEEN],
    mistakes: [
      { text: { tr: 'Merve’den başlamak', en: 'Starting at Marwah' }, penalty: { tr: 'Merve’den Safâ’ya yürünen ilk yol sayılmaz.', en: 'The first trip from Marwah to Safa does not count.' } },
      {
        text: { tr: 'Sa’yin tamamını ya da dört şavtını terk etmek', en: 'Leaving all of sa‘y, or four or more trips' },
        penalty: { tr: 'Sa’y vâciptir; özürsüz terk edilirse dem gerekir. Dörtten az şavt eksikse her şavt için bir sadaka.', en: 'Sa‘y is wajib; leaving it without excuse requires a dam. If fewer than four trips are missing, one sadaqah for each.' },
      },
    ],
    action: { label: { tr: 'Sa’y sayacını aç', en: 'Open the sa‘y counter', ar: 'افتح عدّاد السعي' }, to: '/say', icon: 'walk' },
  },
  {
    id: 'tiras',
    icon: 'check',
    title: { tr: 'Tıraş ya da saç kısaltma: ihramdan çıkış', en: 'Shaving or shortening: leaving ihram', ar: 'الحلق أو التقصير والتحلل' },
    summary: {
      tr: 'Tıraş ya da kısaltmayla ihramdan çıkılır ve umre tamamlanır.',
      en: 'Shaving or shortening the hair ends ihram and completes the umrah.',
      ar: 'بالحلق أو التقصير يتحلل المعتمر وتتم العمرة.',
    },
    todo: [
      {
        tr: 'Erkekler başın tamamını tıraş eder (daha faziletli) ya da saçlarını kısaltır; Hanefî mezhebine göre başın en az dörtte birindeki saçlar parmak boğumu kadar (yaklaşık 2 cm) kısaltılır.',
        en: 'Men shave the whole head (more virtuous) or shorten the hair; in the Hanafi school at least a quarter of the head is shortened by a fingertip’s length (about 2 cm).',
      },
      { tr: 'Kadınlar saçlarının uçlarından parmak boğumu kadar keser.', en: 'Women cut a fingertip’s length from the ends of their hair.' },
      { tr: 'Tıraş Harem sınırları içinde yapılır; Mes’a çıkışında berberler vardır.', en: 'It must be done within the Haram boundary; there are barbers near the exits of the Mas‘a.' },
      { tr: 'Tıraştan sonra ihram yasakları sona erer. Allah kabul etsin!', en: 'After this, the ihram restrictions end. May Allah accept it!' },
    ],
    mistakes: [
      { text: { tr: 'Tıraştan önce normal kıyafet giymek, koku sürmek', en: 'Wearing normal clothes or perfume before shaving' }, penalty: { tr: 'İhram yasağı sayılır; ilgili ceza gerekir (aşağıdaki listeye bakın).', en: 'Counts as an ihram violation; the relevant penalty applies (see the list below).' } },
      { text: { tr: 'Tıraşı Harem sınırı dışında yapmak', en: 'Shaving outside the Haram boundary' }, penalty: { tr: 'Ebû Hanîfe’ye göre dem gerekir.', en: 'According to Abu Hanifah, a dam is due.' } },
    ],
  },
];

/** İhram yasakları ve Hanefî mezhebine göre cezaları (Diyanet, Hac ve Umre İlmihali). */
export const IHRAM_RULES: { rule: T3; penalty: T3 }[] = [
  {
    rule: { tr: 'Erkeklerin dikişli elbise giymesi ve başını örtmesi; kadınların peçe ve eldiven takması', en: 'Men wearing stitched clothes or covering the head; women wearing a face veil or gloves' },
    penalty: { tr: 'Bir gün ya da bir gece boyunca: dem. Daha kısa: sadaka.', en: 'For a full day or night: dam. Shorter: sadaqah.' },
  },
  {
    rule: { tr: 'Koku sürmek; kokulu sabun, şampuan, krem kullanmak', en: 'Using perfume, or scented soap, shampoo or cream' },
    penalty: { tr: 'Büyük bir organın tamamına: dem. Daha azına: sadaka.', en: 'On a whole major limb: dam. Less: sadaqah.' },
  },
  {
    rule: { tr: 'Saç, sakal ve vücut tüylerini kesmek ya da koparmak', en: 'Cutting or removing hair from the head, beard or body' },
    penalty: { tr: 'Başın ya da sakalın en az dörtte biri: dem. Daha azı: sadaka.', en: 'A quarter of the head or beard or more: dam. Less: sadaqah.' },
  },
  {
    rule: { tr: 'Tırnak kesmek', en: 'Cutting nails' },
    penalty: { tr: 'Bir el ya da ayağın beş tırnağı: dem. Daha azı: her tırnak için bir sadaka.', en: 'All five nails of one hand or foot: dam. Fewer: one sadaqah per nail.' },
  },
  {
    rule: { tr: 'Cinsel ilişki ve ön davranışları', en: 'Marital relations and foreplay' },
    penalty: {
      tr: 'Umre tavafının dört şavtı tamamlanmadan ilişki umreyi bozar: dem ve kaza gerekir. Sonra ama tıraştan önce: dem.',
      en: 'Before four rounds of the umrah tawaf it invalidates the umrah: dam and a make-up umrah. After that but before shaving: dam.',
    },
  },
  {
    rule: { tr: 'Avlanmak; Harem bölgesinde kendiliğinden yetişen ağaç ve bitkileri koparmak', en: 'Hunting; cutting wild trees and plants in the Haram area' },
    penalty: { tr: 'Değeri kadar bedel ödenir.', en: 'Its value must be paid.' },
  },
  {
    rule: { tr: 'Kavga, kötü söz, kul hakkına girmek', en: 'Quarrelling, foul speech, wronging others' },
    penalty: { tr: 'Belirli bir cezası yoktur ama günahtır ve ihramın sevabını zedeler.', en: 'No set penalty, but it is sinful and harms the reward of ihram.' },
  },
];

export const RULES_NOTE: T3 = {
  tr: 'Dem: Harem bölgesinde kesilen bir koyun ya da keçi. Sadaka: bir fitre miktarı. Hanefî mezhebine göre bilmeden ya da unutarak işlenen yasak da ceza gerektirir; hastalık gibi bir özür varsa dem yerine üç gün oruç ya da altı fakiri doyurmak seçilebilir. Kesin hüküm için Diyanet’in Hac ve Umre İlmihali’ne ya da kafilenizdeki din görevlisine danışın.',
  en: 'Dam: a sheep or goat slaughtered in the Haram area. Sadaqah: the amount of zakat al-fitr. In the Hanafi school, a violation made unknowingly or by forgetting still requires the penalty; with a valid excuse such as illness, one may instead fast three days or feed six poor people. For a ruling on your case, ask a scholar or your group’s religious guide.',
};

export const SPECIAL_CASES: { title: T3; text: T3; to?: string; link?: T3 }[] = [
  {
    title: { tr: 'Özel hâldeki kadınlar', en: 'Women during menstruation' },
    text: {
      tr: 'İhrama girebilir ve tavaf dışındaki her şeyi yapabilir. Temizlenince gusül alıp tavaf eder, sonra sa’y ve kısaltma yapar.',
      en: 'She may enter ihram and do everything except tawaf. Once pure, she takes a ghusl and performs tawaf, then sa‘y and shortening.',
    },
  },
  {
    title: { tr: 'Yaşlılar ve hastalar', en: 'Elderly and sick pilgrims' },
    text: {
      tr: 'Tavaf ve sa’y tekerlekli sandalye ya da elektrikli arabayla yapılabilir; üst katlar ve Mes’a’da bu hizmetler vardır.',
      en: 'Tawaf and sa‘y may be performed in a wheelchair or electric cart; these services are available on the upper floors and in the Mas‘a.',
    },
    to: '/erisim',
    link: { tr: 'Sandalye ve araba nereden alınır?', en: 'Where to get a wheelchair or cart', ar: 'من أين تُؤخذ الكراسي والعربات؟' },
  },
  {
    title: { tr: 'Çocuklar', en: 'Children' },
    text: {
      tr: 'Çocuğun umresi geçerlidir ama farz olan haccın yerine geçmez; küçük çocuk adına niyeti velisi yapar.',
      en: 'A child’s umrah is valid but does not replace the obligatory Hajj; for a small child the guardian makes the intention.',
    },
  },
];
