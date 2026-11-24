// Tavaf asistanının içeriği. Fıkhî bilgiler Diyanet İşleri Başkanlığı Hac İlmihali'ne (Hanefî) göre;
// hadis numaraları sunnah.com ile karşılaştırıldı. Her şavt için Sünnet'te belirlenmiş özel bir dua yoktur:
// asistan yalnızca sahih kaynaklı dua ve zikirleri önerir.
import type { ML } from '@/data/sites';
import type { ZoneId } from '@/services/tawaf';

/** Metni uygulamada saklanan dua (çevrimdışı çalışır). `quran`: kâri sesi için [sûre, âyet]. */
export type DuaText = {
  id: string;
  ar: string;
  tr: string; // Latin harfli okunuş
  mean: ML; // ar alanı boş bırakılabilir (Arapça arayüzde metnin kendisi yeterli)
  ref: string;
  quran?: [number, number, number?]; // [sûre, ilk âyet, son âyet]
  count?: number;
  when?: ML;
};

export const ISTILAM: DuaText = {
  id: 'istilam',
  ar: 'بِسْمِ اللَّهِ، اللَّهُ أَكْبَرُ',
  tr: 'Bismillâhi Allâhu ekber',
  mean: { tr: 'Allah’ın adıyla; Allah en büyüktür.', en: 'In the name of Allah; Allah is the Greatest.', ar: '' },
  ref: 'Buhârî, 1613 (tekbir) · besmele: İbn Ömer’in uygulaması (Beyhakî)',
};

export const RABBANA: DuaText = {
  id: 'rabbana-atina',
  ar: 'رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ',
  tr: 'Rabbenâ âtinâ fi’d-dünyâ haseneten ve fi’l-âhirati haseneten ve kınâ azâbe’n-nâr',
  mean: {
    tr: 'Rabbimiz! Bize dünyada da iyilik ver, ahirette de iyilik ver ve bizi ateş azabından koru.',
    en: 'Our Lord, give us good in this world and good in the Hereafter, and protect us from the punishment of the Fire.',
    ar: '',
  },
  ref: 'Bakara 201 · Ebû Dâvûd, 1892',
  quran: [2, 201],
};

export const MAQAM_AYAH: DuaText = {
  id: 'maqam',
  ar: 'وَاتَّخِذُوا مِنْ مَقَامِ إِبْرَاهِيمَ مُصَلًّى',
  tr: 'Vettehızû min makâmi İbrâhîme musallâ',
  mean: { tr: 'İbrâhîm’in makamından kendinize bir namaz yeri edinin.', en: 'And take the Station of Abraham as a place of prayer.', ar: '' },
  ref: 'Bakara 125 · Müslim, 1218',
  quran: [2, 125],
};

/** Şavtlar boyunca önerilen sahih kaynaklı kısa dua ve zikirler (her şavtta sıradakiler gösterilir). */
export const TAWAF_DHIKR: DuaText[] = [
  {
    id: 'taqabbal',
    ar: 'رَبَّنَا تَقَبَّلْ مِنَّا إِنَّكَ أَنْتَ السَّمِيعُ الْعَلِيمُ',
    tr: 'Rabbenâ tekabbel minnâ inneke ente’s-semîu’l-alîm',
    mean: { tr: 'Rabbimiz! Bizden kabul buyur; şüphesiz sen işitensin, bilensin. (Hz. İbrâhîm ve İsmâil Kâbe’nin temellerini yükseltirken)', en: 'Our Lord, accept this from us; You are the All-Hearing, the All-Knowing. (Abraham and Ishmael, raising the foundations of the House)', ar: '' },
    ref: 'Bakara 127',
    quran: [2, 127],
  },
  {
    id: 'baqiyat',
    ar: 'سُبْحَانَ اللَّهِ، وَالْحَمْدُ لِلَّهِ، وَلَا إِلَهَ إِلَّا اللَّهُ، وَاللَّهُ أَكْبَرُ',
    tr: 'Sübhânallâhi ve’l-hamdü lillâhi ve lâ ilâhe illallâhü vallâhü ekber',
    mean: { tr: 'Allah’ı tesbih ederim; hamd Allah’a mahsustur; Allah’tan başka ilah yoktur; Allah en büyüktür. (Allah’a en sevimli sözler)', en: 'Glory be to Allah, praise be to Allah, there is no god but Allah, and Allah is the Greatest. (The words most beloved to Allah)', ar: '' },
    ref: 'Müslim, 2137',
  },
  {
    id: 'hawqala',
    ar: 'لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ',
    tr: 'Lâ havle ve lâ kuvvete illâ billâh',
    mean: { tr: 'Güç ve kuvvet ancak Allah’tandır. (Cennet hazinelerinden bir hazine)', en: 'There is no power and no strength except with Allah. (A treasure of Paradise)', ar: '' },
    ref: 'Buhârî, 6384',
  },
  {
    id: 'huda',
    ar: 'اللَّهُمَّ إِنِّي أَسْأَلُكَ الْهُدَى وَالتُّقَى وَالْعَفَافَ وَالْغِنَى',
    tr: 'Allâhümme innî es’elüke’l-hüdâ ve’t-tükâ ve’l-afâfe ve’l-ğınâ',
    mean: { tr: 'Allah’ım! Senden hidayet, takva, iffet ve gönül zenginliği isterim.', en: 'O Allah, I ask You for guidance, piety, chastity and self-sufficiency.', ar: '' },
    ref: 'Müslim, 2721',
  },
  {
    id: 'ighfirli',
    ar: 'اللَّهُمَّ اغْفِرْ لِي وَارْحَمْنِي وَاهْدِنِي وَعَافِنِي وَارْزُقْنِي',
    tr: 'Allâhümme’ğfir lî verhamnî vehdinî ve âfinî verzuknî',
    mean: { tr: 'Allah’ım! Beni bağışla, bana merhamet et, beni doğru yola ilet, bana afiyet ver ve beni rızıklandır.', en: 'O Allah, forgive me, have mercy on me, guide me, grant me well-being and provide for me.', ar: '' },
    ref: 'Müslim, 2697',
  },
  {
    id: 'subhanallah-azim',
    ar: 'سُبْحَانَ اللَّهِ وَبِحَمْدِهِ، سُبْحَانَ اللَّهِ الْعَظِيمِ',
    tr: 'Sübhânallâhi ve bi-hamdihî, sübhânallâhi’l-azîm',
    mean: { tr: 'Allah’ı hamdiyle tesbih ederim; yüce Allah’ı tesbih ederim. (Dile hafif, mizanda ağır iki söz)', en: 'Glory and praise be to Allah; glory be to Allah the Almighty. (Light on the tongue, heavy on the scale)', ar: '' },
    ref: 'Buhârî, 6406',
  },
  {
    id: 'afw',
    ar: 'اللَّهُمَّ إِنَّكَ عَفُوٌّ تُحِبُّ الْعَفْوَ فَاعْفُ عَنِّي',
    tr: 'Allâhümme inneke afüvvün tuhibbü’l-afve fa’fu annî',
    mean: { tr: 'Allah’ım! Sen affedicisin, affetmeyi seversin; beni affet.', en: 'O Allah, You are Pardoning and love to pardon, so pardon me.', ar: '' },
    ref: 'Tirmizî, 3513',
  },
];

export type TawafType = 'umre' | 'kudum' | 'ziyaret' | 'veda' | 'nafile';
export const TAWAF_TYPES: { id: TawafType; name: ML; ramal: 'yes' | 'ifSay' | 'no' }[] = [
  { id: 'umre', name: { tr: 'Umre tavafı', en: 'Umrah tawaf', ar: 'طواف العمرة' }, ramal: 'yes' },
  { id: 'kudum', name: { tr: 'Kudüm tavafı', en: 'Arrival tawaf (Qudum)', ar: 'طواف القدوم' }, ramal: 'ifSay' },
  { id: 'ziyaret', name: { tr: 'Ziyaret (ifâza) tavafı', en: 'Tawaf al-Ifadah', ar: 'طواف الإفاضة' }, ramal: 'ifSay' },
  { id: 'veda', name: { tr: 'Veda tavafı', en: 'Farewell tawaf', ar: 'طواف الوداع' }, ramal: 'no' },
  { id: 'nafile', name: { tr: 'Nafile tavaf', en: 'Voluntary tawaf', ar: 'طواف التطوع' }, ramal: 'no' },
];

export function niyet(type: TawafType, lang: keyof ML): string {
  const n = TAWAF_TYPES.find((t) => t.id === type)!.name;
  if (lang === 'en') return `O Allah, I intend to perform the ${n.en} for Your sake. Make it easy for me and accept it from me.`;
  if (lang === 'ar') return `اللهم إني أريد ${n.ar} لوجهك الكريم، فيسّره لي وتقبّله مني.`;
  return `Allah’ım! Senin rızan için ${n.tr.toLocaleLowerCase('tr')} yapmak istiyorum. Onu bana kolaylaştır ve kabul eyle.`;
}

export const NIYET_NOTE: ML = {
  tr: 'Niyet kalpte yapılır; dille söylemek şart değildir.',
  en: 'The intention is in the heart; saying it aloud is not required.',
  ar: 'النية محلها القلب، ولا يشترط التلفظ بها.',
};

export const PREP: { id: string; text: ML; ramalOnly?: boolean }[] = [
  { id: 'wudu', text: { tr: 'Abdestli olun; tavafta abdest gerekir.', en: 'Be in a state of wudu; it is required for tawaf.', ar: 'كن على وضوء؛ الطهارة شرط للطواف.' } },
  { id: 'left', text: { tr: 'Kâbe solunuzda kalacak şekilde yürüyün.', en: 'Walk with the Kaaba on your left.', ar: 'اجعل الكعبة عن يسارك.' } },
  { id: 'start', text: { tr: 'Rükn-i Yemânî tarafından gelerek Hacerü’l-Esved hizasında başlayın. Üst katlarda yeşil ışıklar başlangıç çizgisini gösterir.', en: 'Approach from the Yemeni Corner side and begin in line with the Black Stone. On the upper floors, green lights mark the starting line.', ar: 'ابدأ من محاذاة الحجر الأسود قادمًا من جهة الركن اليماني. في الأدوار العليا تدل الأضواء الخضراء على خط البداية.' } },
  { id: 'ramal', ramalOnly: true, text: { tr: 'Erkekler: Arkasından sa’y yapılacak tavafta ıztıba yapılır (ihramın üst örtüsü sağ koltuk altından geçirilip sol omza atılır) ve ilk üç şavtta remel yapılır (kısa adımlarla, omuzları silkerek çabuk yürümek). Kalabalıkta remel mümkün değilse terk edilir. Kadınlar remel ve ıztıba yapmaz.', en: 'Men: in a tawaf followed by sa’y, uncover the right shoulder (idtiba) and walk briskly with short steps in the first three rounds (ramal). Skip ramal if the crowd does not allow it. Women do neither.', ar: 'للرجال: في الطواف الذي يعقبه سعي يُسنّ الاضطباع، والرَّمَل في الأشواط الثلاثة الأولى إن تيسّر. ولا رمل ولا اضطباع على النساء.' } },
  { id: 'calm', text: { tr: 'Hacerü’l-Esved’e ulaşmak için itişmeyin; uzaktan selamlamak yeterlidir. Hizasında durmadan yürüyün, yüksek sesle dua etmeyin.', en: 'Do not push to reach the Black Stone; saluting it from a distance is enough. Keep walking when you are in line with it, and do not pray loudly.', ar: 'لا تزاحم للوصول إلى الحجر الأسود؛ تكفي الإشارة من بعيد. لا تتوقف عند محاذاته، ولا ترفع صوتك بالدعاء.' } },
  { id: 'ear', text: { tr: 'Sesli asistanı kulaklıkla kullanın.', en: 'Use the voice assistant with earphones.', ar: 'استخدم المساعد الصوتي مع سماعات الأذن.' } },
];

export const ZONES: Record<ZoneId, { title: ML; short: ML; text: ML; dua?: DuaText; ref?: string }> = {
  start: {
    title: { tr: 'Hacerü’l-Esved hizası', en: 'In line with the Black Stone', ar: 'محاذاة الحجر الأسود' },
    short: { tr: 'İstilam', en: 'Istilam', ar: 'الاستلام' },
    text: {
      tr: 'Yüzünüzü Hacerü’l-Esved’e dönün, ellerinizi avuç içleri Kâbe’ye dönük kaldırıp “Bismillâhi Allâhu ekber” deyin ve durmadan yürümeye devam edin.',
      en: 'Face the Black Stone, raise your hands with palms toward the Kaaba, say “Bismillahi Allahu akbar” and keep walking without stopping.',
      ar: 'استقبل الحجر الأسود وارفع يديك مشيرًا إليه وقل: بسم الله، الله أكبر، ثم واصل المشي دون توقف.',
    },
    dua: ISTILAM,
  },
  door: {
    title: { tr: 'Kâbe kapısı · Mültezem', en: 'Kaaba door · Multazam', ar: 'باب الكعبة · الملتزم' },
    short: { tr: 'Kapı', en: 'Door', ar: 'الباب' },
    text: {
      tr: 'Mültezem, Hacerü’l-Esved ile kapı arasındaki duvardır. Tavaf sırasında burada durmayın; dua etmek isterseniz tavaftan sonra, kalabalık yoksa gelin.',
      en: 'The Multazam is the wall between the Black Stone and the door. Do not stop here during tawaf; if you wish to pray there, come after tawaf when it is not crowded.',
      ar: 'الملتزم ما بين الحجر الأسود والباب. لا تتوقف هنا أثناء الطواف، ويمكنك الدعاء عنده بعد الطواف إن لم يكن زحام.',
    },
  },
  iraqi: {
    title: { tr: 'Rükn-i Irâkî', en: 'Iraqi Corner', ar: 'الركن العراقي' },
    short: { tr: 'Irâkî', en: 'Iraqi', ar: 'العراقي' },
    text: { tr: 'Bu köşe istilam edilmez; dua ve zikre devam edin.', en: 'This corner is not saluted or touched; continue your prayers and dhikr.', ar: 'لا يُستلم هذا الركن؛ واصل الدعاء والذكر.' },
    ref: 'Buhârî, 1609',
  },
  hijr: {
    title: { tr: 'Hatîm (Hicr-i İsmâil)', en: 'Hatim (Hijr Ismail)', ar: 'الحِجر (حِجر إسماعيل)' },
    short: { tr: 'Hatîm', en: 'Hatim', ar: 'الحِجر' },
    text: {
      tr: 'Tavafı yarım daire şeklindeki Hatîm duvarının dışından yapın; içinden geçilen şavt geçerli olmaz. Duvarın üstündeki altın oluk Mîzâb-ı Rahmet’tir.',
      en: 'Walk outside the semicircular Hatim wall; a round that passes inside it does not count. The golden spout above is the Mizab al-Rahmah.',
      ar: 'طُف من خارج جدار الحِجر؛ فالشوط الذي يمر من داخله لا يُحتسب. والميزاب الذهبي فوقه هو ميزاب الرحمة.',
    },
  },
  shami: {
    title: { tr: 'Rükn-i Şâmî', en: 'Shami Corner', ar: 'الركن الشامي' },
    short: { tr: 'Şâmî', en: 'Shami', ar: 'الشامي' },
    text: { tr: 'Bu köşe istilam edilmez; dua ve zikre devam edin.', en: 'This corner is not saluted or touched; continue your prayers and dhikr.', ar: 'لا يُستلم هذا الركن؛ واصل الدعاء والذكر.' },
    ref: 'Buhârî, 1609',
  },
  west: {
    title: { tr: 'Batı cephesi', en: 'Western side', ar: 'الجهة الغربية' },
    short: { tr: 'Batı', en: 'West', ar: 'الغرب' },
    text: { tr: 'Rükn-i Yemânî’ye yaklaşıyorsunuz. Dilediğiniz duayı kendi dilinizde de yapabilirsiniz.', en: 'You are approaching the Yemeni Corner. You may also pray in your own language.', ar: 'أنت تقترب من الركن اليماني. ادعُ بما شئت ولو بلغتك.' },
  },
  yamani: {
    title: { tr: 'Rükn-i Yemânî', en: 'Yemeni Corner', ar: 'الركن اليماني' },
    short: { tr: 'Yemânî', en: 'Yemeni', ar: 'اليماني' },
    text: {
      tr: 'Mümkünse sağ elinizle dokunun; öpülmez. Kalabalıkta dokunamıyorsanız işaret etmeden geçin.',
      en: 'If you can, touch it with your right hand; it is not kissed. If you cannot reach it, pass by without gesturing.',
      ar: 'استلمه بيدك اليمنى إن تيسّر دون تقبيل، وإن لم تستطع فامضِ دون إشارة.',
    },
    ref: 'Buhârî, 1609',
  },
  rabbana: {
    title: { tr: 'İki rükün arası', en: 'Between the two corners', ar: 'بين الركنين' },
    short: { tr: 'Rabbenâ', en: 'Rabbana', ar: 'ربنا آتنا' },
    text: {
      tr: 'Rükn-i Yemânî ile Hacerü’l-Esved arasında Peygamberimiz şu duayı okurdu:',
      en: 'Between the Yemeni Corner and the Black Stone, the Prophet ﷺ used to say:',
      ar: 'كان النبي ﷺ يقول بين الركنين:',
    },
    dua: RABBANA,
  },
};

export const FREE_NOTE: ML = {
  tr: 'Her şavt için Sünnet’te belirlenmiş özel bir dua yoktur. Kur’an okuyabilir, zikredebilir, dilediğiniz duayı kendi dilinizde yapabilirsiniz.',
  en: 'There is no specific prayer prescribed for each round. You may recite Qur’an, make dhikr, or pray in your own language.',
  ar: 'لا يوجد دعاء مخصوص لكل شوط؛ اقرأ القرآن واذكر الله وادعُ بما شئت ولو بلغتك.',
};

export const COUNT_NOTE: ML = {
  tr: 'Otomatik sayım yardımcıdır; şavtlarınızı siz de takip edin. Şüpheye düşerseniz kesin bildiğiniz sayıyı esas alın.',
  en: 'Automatic counting is an aid; keep your own count too. If in doubt, go by the number you are certain of.',
  ar: 'العدّ الآلي وسيلة مساعدة؛ احفظ عدد أشواطك بنفسك، وعند الشك ابنِ على اليقين.',
};

export const AFTER: { id: string; title: ML; text: ML; dua?: DuaText; ramalOnly?: boolean }[] = [
  { id: 'last', title: { tr: 'Son istilam', en: 'Final istilam', ar: 'الاستلام الأخير' }, text: { tr: 'Yedinci şavtı Hacerü’l-Esved hizasında bitirip bir kez daha istilam edin.', en: 'Finish the seventh round in line with the Black Stone and salute it once more.', ar: 'أنهِ الشوط السابع عند محاذاة الحجر الأسود واستلمه مرة أخرى.' } },
  { id: 'cover', ramalOnly: true, title: { tr: 'Omzunuzu örtün', en: 'Cover your shoulder', ar: 'غطِّ كتفك' }, text: { tr: 'Erkekler ıztıbayı bitirir; sağ omuz örtülür.', en: 'Men end idtiba and cover the right shoulder.', ar: 'ينهي الرجل الاضطباع ويغطي كتفه الأيمن.' } },
  { id: 'maqam', title: { tr: 'Makam-ı İbrâhîm', en: 'Station of Abraham', ar: 'مقام إبراهيم' }, text: { tr: 'Makam’a doğru giderken şu ayeti okuyun:', en: 'Recite this verse as you go toward the Maqam:', ar: 'اقرأ هذه الآية وأنت تتجه إلى المقام:' }, dua: MAQAM_AYAH },
  { id: 'salah', title: { tr: '2 rekât tavaf namazı', en: 'Two rak‘ahs of tawaf', ar: 'ركعتا الطواف' }, text: { tr: 'Mümkünse Makam-ı İbrâhîm’in arkasında, kalabalıksa mescidin herhangi bir yerinde kılın. Birinci rekâtta Kâfirûn, ikinci rekâtta İhlâs okumak sünnettir (Müslim, 1218). Hanefî mezhebine göre vâciptir; kerahat vaktine denk gelirse vakit çıkınca kılınır.', en: 'Pray behind the Maqam if possible, otherwise anywhere in the mosque. It is sunnah to recite al-Kafirun in the first and al-Ikhlas in the second (Muslim 1218). Wajib in the Hanafi school; if it falls in a disliked time, pray it after that time.', ar: 'صلِّهما خلف المقام إن تيسّر وإلا ففي أي مكان من المسجد، ويُسنّ أن تقرأ فيهما الكافرون والإخلاص (مسلم ١٢١٨). وهما واجبتان عند الحنفية، فإن وافقتا وقت كراهة أُخّرتا.' } },
  { id: 'zamzam', title: { tr: 'Zemzem', en: 'Zamzam', ar: 'زمزم' }, text: { tr: 'Zemzem içip dua edin. Peygamberimiz Zemzem için “O mübarektir; doyurucu bir yiyecektir” buyurmuştur (Müslim, 2473).', en: 'Drink Zamzam and make du‘a. The Prophet ﷺ said of it: “It is blessed; it is food that satisfies” (Muslim 2473).', ar: 'اشرب من زمزم وادعُ؛ قال ﷺ: «إنها مباركة، إنها طعام طُعم» (مسلم ٢٤٧٣).' } },
  { id: 'multazam', title: { tr: 'Mültezem (isteğe bağlı)', en: 'Multazam (optional)', ar: 'الملتزم (اختياري)' }, text: { tr: 'Kalabalık değilse Hacerü’l-Esved ile kapı arasındaki duvarda dua edebilirsiniz.', en: 'If it is not crowded, you may pray at the wall between the Black Stone and the door.', ar: 'إن لم يكن زحام فادعُ عند الجدار بين الحجر الأسود والباب.' } },
  { id: 'say', title: { tr: 'Sa’y', en: 'Sa‘y', ar: 'السعي' }, text: { tr: 'Arkasından sa’y yapılacaksa Hacerü’l-Esved’i tekrar istilam edip Safa’ya geçin (Müslim, 1218).', en: 'If sa‘y follows, salute the Black Stone again and go to Safa (Muslim 1218).', ar: 'إن كان بعده سعي فاستلم الحجر الأسود ثم اتجه إلى الصفا (مسلم ١٢١٨).' } },
];
