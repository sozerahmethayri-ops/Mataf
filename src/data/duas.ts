// Dua kütüphanesi. İki tür kayıt var:
//  • Metin kaydı (DuaText): hadis kaynaklı dualar; Arapça metin, okunuş ve anlam uygulamada saklanır (çevrimdışı).
//  • Ayet kaydı (QuranRef): Kur'an'daki dualar; Arapça metin, okunuş ve meal alquran.cloud'dan, kullanıcının
//    seçtiği meal dilinde gelir, ses kâri kaydıdır.
// Kaynak numaraları: Buhârî/Müslim/Ebû Dâvûd/Tirmizî (sunnah.com numaralandırması).
import type { ML } from '@/data/sites';
import { ISTILAM, MAQAM_AYAH, RABBANA, TAWAF_DHIKR, type DuaText } from './tawaf';

export type QuranRef = { id: string; quran: [number, number, number?]; when?: ML; count?: number; note?: string };
export type DuaEntry = DuaText | QuranRef;
export const isQuranRef = (d: DuaEntry): d is QuranRef => !('ar' in d);

const w = (tr: string, en: string, ar = ''): ML => ({ tr, en, ar });
const dhikr = (id: string) => TAWAF_DHIKR.find((d) => d.id === id)!;

const TAHLIL = 'لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ، وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ';
const TAHLIL_TR = 'Lâ ilâhe illallâhü vahdehû lâ şerîke leh, lehü’l-mülkü ve lehü’l-hamdü ve hüve alâ külli şey’in kadîr';
const TAHLIL_MEAN = w(
  'Allah’tan başka ilah yoktur; O tektir, ortağı yoktur. Mülk O’nundur, hamd O’na mahsustur ve O her şeye gücü yetendir.',
  'There is no god but Allah alone, without partner. His is the dominion and His is the praise, and He has power over all things.',
);

export const DUA_LIB: { id: string; title: ML; icon: string; items: DuaEntry[] }[] = [
  {
    id: 'tavaf', icon: 'kaaba', title: w('Tavaf', 'Tawaf', 'الطواف'),
    items: [ISTILAM, RABBANA, ...TAWAF_DHIKR, MAQAM_AYAH],
  },
  {
    id: 'say', icon: 'flag', title: w('Sa’y', 'Sa‘y', 'السعي'),
    items: [
      { id: 'safa-ayah', quran: [2, 158], when: w('Safa’ya ilk yaklaşırken', 'When first approaching Safa', 'عند الدنو من الصفا') },
      {
        id: 'safa-dhikr',
        ar: `${TAHLIL}، لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ، أَنْجَزَ وَعْدَهُ، وَنَصَرَ عَبْدَهُ، وَهَزَمَ الْأَحْزَابَ وَحْدَهُ`,
        tr: `${TAHLIL_TR}. Lâ ilâhe illallâhü vahdeh, enceze va’deh, ve nasara abdeh, ve hezeme’l-ahzâbe vahdeh`,
        mean: w(
          'Allah’tan başka ilah yoktur; O tektir, ortağı yoktur. Mülk O’nundur, hamd O’na mahsustur, O her şeye gücü yetendir. Allah’tan başka ilah yoktur; O vaadini yerine getirdi, kuluna yardım etti ve düşman toplulukları tek başına yendi.',
          'There is no god but Allah alone… He fulfilled His promise, aided His servant and alone defeated the confederates.',
        ),
        when: w('Safa ve Merve’de kıbleye dönerek (aralarda dua edilir)', 'On Safa and Marwah, facing the Qibla (with du‘a in between)', 'على الصفا والمروة مستقبل القبلة'),
        count: 3,
        ref: 'Müslim, 1218',
      },
    ],
  },
  {
    id: 'hac', icon: 'globe', title: w('Hac ve umre', 'Hajj & Umrah', 'الحج والعمرة'),
    items: [
      {
        id: 'telbiye',
        ar: 'لَبَّيْكَ اللَّهُمَّ لَبَّيْكَ، لَبَّيْكَ لَا شَرِيكَ لَكَ لَبَّيْكَ، إِنَّ الْحَمْدَ وَالنِّعْمَةَ لَكَ وَالْمُلْكَ، لَا شَرِيكَ لَكَ',
        tr: 'Lebbeyk Allâhümme lebbeyk, lebbeyke lâ şerîke leke lebbeyk, inne’l-hamde ve’n-ni’mete leke ve’l-mülk, lâ şerîke lek',
        mean: w('Buyur Allah’ım, buyur! Senin ortağın yoktur, buyur! Hamd, nimet ve mülk senindir; senin ortağın yoktur.', 'Here I am, O Allah, here I am. You have no partner, here I am. Praise, grace and dominion are Yours; You have no partner.'),
        when: w('İhramdayken', 'While in ihram', 'في الإحرام'),
        ref: 'Buhârî, 1549',
      },
      {
        id: 'arafat', ar: TAHLIL, tr: TAHLIL_TR,
        mean: w(`${TAHLIL_MEAN.tr} (Duaların en hayırlısı Arefe günü yapılandır.)`, `${TAHLIL_MEAN.en} (The best du‘a is the du‘a of the Day of Arafah.)`),
        when: w('Arefe günü', 'Day of Arafah', 'يوم عرفة'),
        ref: 'Tirmizî, 3585',
      },
    ],
  },
  {
    id: 'mescit', icon: 'gate', title: w('Mescide giriş-çıkış', 'Entering & leaving the mosque', 'دخول المسجد والخروج منه'),
    items: [
      { id: 'enter', ar: 'اللَّهُمَّ افْتَحْ لِي أَبْوَابَ رَحْمَتِكَ', tr: 'Allâhümme’ftah lî ebvâbe rahmetik', mean: w('Allah’ım, bana rahmetinin kapılarını aç.', 'O Allah, open for me the gates of Your mercy.'), when: w('Girerken', 'On entering', 'عند الدخول'), ref: 'Müslim, 713' },
      { id: 'leave', ar: 'اللَّهُمَّ إِنِّي أَسْأَلُكَ مِنْ فَضْلِكَ', tr: 'Allâhümme innî es’elüke min fadlik', mean: w('Allah’ım, senden lütfunu isterim.', 'O Allah, I ask You of Your bounty.'), when: w('Çıkarken', 'On leaving', 'عند الخروج'), ref: 'Müslim, 713' },
    ],
  },
  {
    id: 'zemzem', icon: 'water', title: w('Zemzem', 'Zamzam', 'زمزم'),
    items: [
      { id: 'zamzam', ar: 'مَاءُ زَمْزَمَ لِمَا شُرِبَ لَهُ', tr: 'Mâu zemzeme limâ şuribe leh', mean: w('Zemzem suyu ne niyetle içilirse onun içindir. (İçerken dilediğiniz duayı yapın.)', 'Zamzam water is for whatever it is drunk for. (Make any du‘a as you drink.)'), ref: 'İbn Mâce, 3062' },
    ],
  },
  {
    id: 'medine', icon: 'pin', title: w('Medine ve ziyaret', 'Madinah & visiting', 'المدينة والزيارة'),
    items: [
      {
        id: 'salawat',
        ar: 'اللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ وَعَلَى آلِ مُحَمَّدٍ، كَمَا صَلَّيْتَ عَلَى إِبْرَاهِيمَ وَعَلَى آلِ إِبْرَاهِيمَ، إِنَّكَ حَمِيدٌ مَجِيدٌ، اللَّهُمَّ بَارِكْ عَلَى مُحَمَّدٍ وَعَلَى آلِ مُحَمَّدٍ، كَمَا بَارَكْتَ عَلَى إِبْرَاهِيمَ وَعَلَى آلِ إِبْرَاهِيمَ، إِنَّكَ حَمِيدٌ مَجِيدٌ',
        tr: 'Allâhümme salli alâ Muhammedin ve alâ âli Muhammed, kemâ salleyte alâ İbrâhîme ve alâ âli İbrâhîm, inneke hamîdün mecîd. Allâhümme bârik alâ Muhammedin ve alâ âli Muhammed, kemâ bârakte alâ İbrâhîme ve alâ âli İbrâhîm, inneke hamîdün mecîd',
        mean: w('Allah’ım! İbrâhîm’e ve ailesine rahmet ettiğin gibi Muhammed’e ve ailesine de rahmet et; İbrâhîm’e ve ailesine bereket verdiğin gibi Muhammed’e ve ailesine de bereket ver. Şüphesiz sen övülmeye layıksın, şanı yücesin.', 'O Allah, send prayers upon Muhammad and the family of Muhammad as You sent prayers upon Abraham and his family… and bless Muhammad and his family as You blessed Abraham and his family. You are Praiseworthy, Glorious.'),
        ref: 'Buhârî, 3370',
      },
      {
        id: 'baqi',
        ar: 'السَّلَامُ عَلَيْكُمْ أَهْلَ الدِّيَارِ مِنَ الْمُؤْمِنِينَ وَالْمُسْلِمِينَ، وَإِنَّا إِنْ شَاءَ اللَّهُ لَلَاحِقُونَ، أَسْأَلُ اللَّهَ لَنَا وَلَكُمُ الْعَافِيَةَ',
        tr: 'Es-selâmü aleyküm ehle’d-diyâri mine’l-mü’minîne ve’l-müslimîn, ve innâ inşâallâhü le-lâhikûn, es’elüllâhe lenâ ve lekümü’l-âfiyeh',
        mean: w('Ey bu yurtların mümin ve müslüman sakinleri, size selam olsun! İnşallah biz de size katılacağız. Allah’tan bize ve size afiyet dilerim.', 'Peace be upon you, believing and Muslim dwellers of these abodes. We shall join you, if Allah wills. I ask Allah for well-being for us and for you.'),
        when: w('Kabir ziyaretinde (Bakî dahil)', 'When visiting graves (incl. al-Baqi)', 'عند زيارة القبور'),
        ref: 'Müslim, 975',
      },
    ],
  },
  {
    id: 'sabah', icon: 'clock', title: w('Sabah ve akşam', 'Morning & evening', 'أذكار الصباح والمساء'),
    items: [
      {
        id: 'asbahna',
        ar: 'أَصْبَحْنَا وَأَصْبَحَ الْمُلْكُ لِلَّهِ، وَالْحَمْدُ لِلَّهِ، لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ، رَبِّ أَسْأَلُكَ خَيْرَ مَا فِي هَذَا الْيَوْمِ وَخَيْرَ مَا بَعْدَهُ، وَأَعُوذُ بِكَ مِنْ شَرِّ مَا فِي هَذَا الْيَوْمِ وَشَرِّ مَا بَعْدَهُ، رَبِّ أَعُوذُ بِكَ مِنَ الْكَسَلِ وَسُوءِ الْكِبَرِ، رَبِّ أَعُوذُ بِكَ مِنْ عَذَابٍ فِي النَّارِ وَعَذَابٍ فِي الْقَبْرِ',
        tr: 'Asbahnâ ve asbaha’l-mülkü lillâh, ve’l-hamdü lillâh, lâ ilâhe illallâhü vahdehû lâ şerîke leh, lehü’l-mülkü ve lehü’l-hamdü ve hüve alâ külli şey’in kadîr. Rabbi es’elüke hayra mâ fî hâze’l-yevmi ve hayra mâ ba’deh, ve eûzü bike min şerri mâ fî hâze’l-yevmi ve şerri mâ ba’deh. Rabbi eûzü bike mine’l-keseli ve sûi’l-kiber. Rabbi eûzü bike min azâbin fi’n-nâri ve azâbin fi’l-kabr',
        mean: w('Sabaha erdik, mülk de Allah’a ait olarak sabahladı… Rabbim! Bu günün ve sonrasının hayrını senden ister, şerrinden sana sığınırım. Tembellikten ve ihtiyarlığın kötülüğünden, cehennem ve kabir azabından sana sığınırım. (Akşam: “Emseynâ ve emse’l-mülkü lillâh… hâzihi’l-leyle”.)', 'We have reached the morning and the dominion belongs to Allah… My Lord, I ask You for the good of this day and what follows it, and seek refuge in You from its evil… from laziness, the misery of old age, and the punishment of the Fire and the grave. (Evening: “Amsayna wa amsal-mulku lillah… this night”.)'),
        when: w('Sabah (akşam uyarlamasıyla)', 'Morning (evening variant noted)', 'صباحًا ومساءً'),
        ref: 'Müslim, 2723',
      },
      {
        id: 'bika-asbahna',
        ar: 'اللَّهُمَّ بِكَ أَصْبَحْنَا، وَبِكَ أَمْسَيْنَا، وَبِكَ نَحْيَا، وَبِكَ نَمُوتُ، وَإِلَيْكَ النُّشُورُ',
        tr: 'Allâhümme bike asbahnâ ve bike emseynâ ve bike nahyâ ve bike nemûtü ve ileyke’n-nüşûr',
        mean: w('Allah’ım! Seninle sabaha, seninle akşama erdik; seninle yaşar, seninle ölürüz. Dönüş sanadır. (Akşam: “…ve ileyke’l-masîr”.)', 'O Allah, by You we reach the morning and the evening, by You we live and die, and to You is the resurrection.'),
        when: w('Sabah', 'Morning', 'صباحًا'),
        ref: 'Tirmizî, 3391',
      },
      {
        id: 'la-yadurru',
        ar: 'بِسْمِ اللَّهِ الَّذِي لَا يَضُرُّ مَعَ اسْمِهِ شَيْءٌ فِي الْأَرْضِ وَلَا فِي السَّمَاءِ وَهُوَ السَّمِيعُ الْعَلِيمُ',
        tr: 'Bismillâhillezî lâ yedurru mea’smihî şey’ün fi’l-ardı ve lâ fi’s-semâi ve hüve’s-semîu’l-alîm',
        mean: w('İsmiyle birlikte yerde ve gökte hiçbir şeyin zarar veremeyeceği Allah’ın adıyla. O işitendir, bilendir.', 'In the name of Allah, with whose name nothing on earth or in heaven can cause harm, and He is the All-Hearing, the All-Knowing.'),
        when: w('Sabah ve akşam', 'Morning and evening', 'صباحًا ومساءً'), count: 3,
        ref: 'Ebû Dâvûd, 5088',
      },
      {
        id: 'sayyid',
        ar: 'اللَّهُمَّ أَنْتَ رَبِّي لَا إِلَهَ إِلَّا أَنْتَ، خَلَقْتَنِي وَأَنَا عَبْدُكَ، وَأَنَا عَلَى عَهْدِكَ وَوَعْدِكَ مَا اسْتَطَعْتُ، أَعُوذُ بِكَ مِنْ شَرِّ مَا صَنَعْتُ، أَبُوءُ لَكَ بِنِعْمَتِكَ عَلَيَّ، وَأَبُوءُ لَكَ بِذَنْبِي، فَاغْفِرْ لِي، فَإِنَّهُ لَا يَغْفِرُ الذُّنُوبَ إِلَّا أَنْتَ',
        tr: 'Allâhümme ente rabbî lâ ilâhe illâ ent, halaktenî ve ene abdük, ve ene alâ ahdike ve va’dike mesteta’t, eûzü bike min şerri mâ sana’t, ebûu leke bi-ni’metike aleyye ve ebûu leke bi-zenbî, fağfir lî fe-innehû lâ yağfiru’z-zünûbe illâ ent',
        mean: w('Seyyidü’l-istiğfâr: Allah’ım! Sen benim Rabbimsin, senden başka ilah yoktur. Beni sen yarattın, ben senin kulunum… Bana verdiğin nimetleri ve günahımı itiraf ederim; beni bağışla, çünkü günahları ancak sen bağışlarsın.', 'The master supplication for forgiveness: O Allah, You are my Lord… I acknowledge Your favour upon me and my sin, so forgive me, for none forgives sins but You.'),
        when: w('Sabah ve akşam', 'Morning and evening', 'صباحًا ومساءً'),
        ref: 'Buhârî, 6306',
      },
      { id: 'ikhlas', quran: [112, 1, 4], count: 3, when: w('Sabah ve akşam · İhlâs, Felak, Nâs', 'Morning & evening · al-Ikhlas, al-Falaq, an-Nas', 'صباحًا ومساءً'), note: 'Ebû Dâvûd, 5082' },
      { id: 'falaq', quran: [113, 1, 5], count: 3, when: w('Sabah ve akşam', 'Morning and evening', 'صباحًا ومساءً'), note: 'Ebû Dâvûd, 5082' },
      { id: 'nas', quran: [114, 1, 6], count: 3, when: w('Sabah ve akşam', 'Morning and evening', 'صباحًا ومساءً'), note: 'Ebû Dâvûd, 5082' },
    ],
  },
  {
    id: 'namaz', icon: 'moon', title: w('Namazdan sonra', 'After prayer', 'بعد الصلاة'),
    items: [
      {
        id: 'antas-salam',
        ar: 'أَسْتَغْفِرُ اللَّهَ، أَسْتَغْفِرُ اللَّهَ، أَسْتَغْفِرُ اللَّهَ، اللَّهُمَّ أَنْتَ السَّلَامُ وَمِنْكَ السَّلَامُ، تَبَارَكْتَ يَا ذَا الْجَلَالِ وَالْإِكْرَامِ',
        tr: 'Estağfirullâh (3 kez). Allâhümme ente’s-selâmü ve minke’s-selâm, tebârakte yâ ze’l-celâli ve’l-ikrâm',
        mean: w('Allah’tan bağışlanma dilerim. Allah’ım! Selâm sensin, esenlik sendendir. Ey celal ve ikram sahibi, sen ne yücesin!', 'I seek Allah’s forgiveness (3×). O Allah, You are Peace and from You is peace. Blessed are You, O Possessor of majesty and honour.'),
        ref: 'Müslim, 591',
      },
      {
        id: 'tasbihat',
        ar: `سُبْحَانَ اللَّهِ (٣٣)، الْحَمْدُ لِلَّهِ (٣٣)، اللَّهُ أَكْبَرُ (٣٣)، ${TAHLIL}`,
        tr: `Sübhânallâh (33), el-hamdü lillâh (33), Allâhü ekber (33); ${TAHLIL_TR}`,
        mean: w('Tesbihat: 33 kez Sübhânallâh, 33 kez Elhamdülillâh, 33 kez Allâhüekber; yüze tamamlarken kelime-i tevhid.', 'Glory be to Allah (33), praise be to Allah (33), Allah is the Greatest (33), completing a hundred with the tahlil.'),
        ref: 'Müslim, 597',
      },
      { id: 'kursi', quran: [2, 255], when: w('Her namazdan sonra', 'After every prayer', 'دبر كل صلاة'), note: 'Nesâî, es-Sünenü’l-kübrâ' },
      { id: 'ainni', ar: 'اللَّهُمَّ أَعِنِّي عَلَى ذِكْرِكَ وَشُكْرِكَ وَحُسْنِ عِبَادَتِكَ', tr: 'Allâhümme e’innî alâ zikrike ve şükrike ve husni ibâdetik', mean: w('Allah’ım! Seni anmak, sana şükretmek ve sana güzelce ibadet etmek için bana yardım et.', 'O Allah, help me to remember You, thank You and worship You well.'), ref: 'Ebû Dâvûd, 1522' },
      {
        id: 'zalamtu',
        ar: 'اللَّهُمَّ إِنِّي ظَلَمْتُ نَفْسِي ظُلْمًا كَثِيرًا، وَلَا يَغْفِرُ الذُّنُوبَ إِلَّا أَنْتَ، فَاغْفِرْ لِي مَغْفِرَةً مِنْ عِنْدِكَ، وَارْحَمْنِي، إِنَّكَ أَنْتَ الْغَفُورُ الرَّحِيمُ',
        tr: 'Allâhümme innî zalemtü nefsî zulmen kesîrâ, ve lâ yağfiru’z-zünûbe illâ ent, fağfir lî mağfiraten min ındik, verhamnî, inneke ente’l-ğafûru’r-rahîm',
        mean: w('Allah’ım! Ben nefsime çok zulmettim; günahları ancak sen bağışlarsın. Katından bir mağfiretle beni bağışla ve bana merhamet et. Sen çok bağışlayan, çok merhamet edensin. (Peygamberimiz Hz. Ebû Bekir’e namazda okuması için öğretti.)', 'O Allah, I have wronged myself greatly and none forgives sins but You, so forgive me with forgiveness from You and have mercy on me. (Taught to Abu Bakr for his prayer.)'),
        ref: 'Buhârî, 834',
      },
    ],
  },
  {
    id: 'ezan', icon: 'bell', title: w('Ezan ve abdest', 'Adhan & wudu', 'الأذان والوضوء'),
    items: [
      {
        id: 'after-adhan',
        ar: 'اللَّهُمَّ رَبَّ هَذِهِ الدَّعْوَةِ التَّامَّةِ، وَالصَّلَاةِ الْقَائِمَةِ، آتِ مُحَمَّدًا الْوَسِيلَةَ وَالْفَضِيلَةَ، وَابْعَثْهُ مَقَامًا مَحْمُودًا الَّذِي وَعَدْتَهُ',
        tr: 'Allâhümme rabbe hâzihi’d-da’veti’t-tâmmeh, ve’s-salâti’l-kâimeh, âti Muhammedeni’l-vesîlete ve’l-fadîleh, veb’ashü makâmen mahmûdeni’llezî vaadteh',
        mean: w('Ey bu eksiksiz davetin ve kılınacak namazın Rabbi Allah’ım! Muhammed’e vesîleyi ve fazileti ver; onu vaat ettiğin makâm-ı mahmûda ulaştır.', 'O Allah, Lord of this perfect call and the prayer to be established, grant Muhammad al-wasilah and excellence, and raise him to the praised station You promised him.'),
        when: w('Ezandan sonra', 'After the adhan', 'بعد الأذان'),
        ref: 'Buhârî, 614',
      },
      {
        id: 'after-wudu',
        ar: 'أَشْهَدُ أَنْ لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، وَأَشْهَدُ أَنَّ مُحَمَّدًا عَبْدُهُ وَرَسُولُهُ، اللَّهُمَّ اجْعَلْنِي مِنَ التَّوَّابِينَ وَاجْعَلْنِي مِنَ الْمُتَطَهِّرِينَ',
        tr: 'Eşhedü en lâ ilâhe illallâhü vahdehû lâ şerîke leh, ve eşhedü enne Muhammeden abdühû ve rasûlüh. Allâhümme’c’alnî mine’t-tevvâbîne vec’alnî mine’l-mütetahhirîn',
        mean: w('Allah’tan başka ilah olmadığına, O’nun tek ve ortaksız olduğuna; Muhammed’in O’nun kulu ve elçisi olduğuna şahitlik ederim. Allah’ım! Beni tövbe edenlerden ve temizlenenlerden eyle.', 'I bear witness that there is no god but Allah alone… and that Muhammad is His servant and messenger. O Allah, make me among those who repent and those who purify themselves.'),
        when: w('Abdestten sonra', 'After wudu', 'بعد الوضوء'),
        ref: 'Müslim, 234 · son kısım: Tirmizî, 55',
      },
    ],
  },
  {
    id: 'uyku', icon: 'moon', title: w('Uyku', 'Sleep', 'النوم'),
    items: [
      { id: 'sleep', ar: 'بِاسْمِكَ اللَّهُمَّ أَمُوتُ وَأَحْيَا', tr: 'Bismike’llâhümme emûtü ve ahyâ', mean: w('Allah’ım! Senin adınla ölür, senin adınla dirilirim.', 'In Your name, O Allah, I die and I live.'), when: w('Yatarken', 'Before sleeping', 'عند النوم'), ref: 'Buhârî, 6312' },
      { id: 'wake', ar: 'الْحَمْدُ لِلَّهِ الَّذِي أَحْيَانَا بَعْدَ مَا أَمَاتَنَا وَإِلَيْهِ النُّشُورُ', tr: 'El-hamdü lillâhillezî ahyânâ ba’de mâ emâtenâ ve ileyhi’n-nüşûr', mean: w('Bizi öldürdükten sonra dirilten Allah’a hamdolsun; dönüş O’nadır.', 'Praise be to Allah who gave us life after causing us to die, and to Him is the resurrection.'), when: w('Uyanınca', 'On waking', 'عند الاستيقاظ'), ref: 'Buhârî, 6312' },
    ],
  },
  {
    id: 'yemek', icon: 'food', title: w('Yemek', 'Food', 'الطعام'),
    items: [
      { id: 'bismillah', ar: 'بِسْمِ اللَّهِ', tr: 'Bismillâh', mean: w('Allah’ın adıyla. (Sağ elle ve önünüzden yiyin.)', 'In the name of Allah. (Eat with your right hand, from what is in front of you.)'), when: w('Yemeğe başlarken', 'Before eating', 'قبل الطعام'), ref: 'Buhârî, 5376' },
      { id: 'after-food', ar: 'الْحَمْدُ لِلَّهِ حَمْدًا كَثِيرًا طَيِّبًا مُبَارَكًا فِيهِ، غَيْرَ مَكْفِيٍّ وَلَا مُوَدَّعٍ وَلَا مُسْتَغْنًى عَنْهُ رَبَّنَا', tr: 'El-hamdü lillâhi hamden kesîran tayyiben mübâreken fîh, ğayra mekfiyyin ve lâ müveddain ve lâ müstağnen anhü rabbenâ', mean: w('Allah’a çok, temiz ve bereketli hamd olsun; ey Rabbimiz, hamdimiz yeterli görülmez, terk edilmez, ondan müstağni kalınmaz.', 'Praise be to Allah, abundant, good and blessed praise — never enough, never abandoned, never dispensed with, our Lord.'), when: w('Yemekten sonra', 'After eating', 'بعد الطعام'), ref: 'Buhârî, 5458' },
    ],
  },
  {
    id: 'yol', icon: 'nav', title: w('Ev ve yolculuk', 'Home & travel', 'البيت والسفر'),
    items: [
      { id: 'leave-home', ar: 'بِسْمِ اللَّهِ، تَوَكَّلْتُ عَلَى اللَّهِ، لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ', tr: 'Bismillâh, tevekkeltü alallâh, lâ havle ve lâ kuvvete illâ billâh', mean: w('Allah’ın adıyla; Allah’a dayandım. Güç ve kuvvet ancak Allah’tandır.', 'In the name of Allah; I rely on Allah; there is no power or strength except with Allah.'), when: w('Evden çıkarken', 'Leaving home', 'عند الخروج من البيت'), ref: 'Ebû Dâvûd, 5095' },
      { id: 'travel', ar: 'سُبْحَانَ الَّذِي سَخَّرَ لَنَا هَذَا وَمَا كُنَّا لَهُ مُقْرِنِينَ وَإِنَّا إِلَى رَبِّنَا لَمُنْقَلِبُونَ', tr: 'Sübhânellezî sahhara lenâ hâzâ ve mâ künnâ lehû mukrinîn ve innâ ilâ rabbinâ le-munkalibûn', mean: w('Bunu bizim hizmetimize veren Allah’ı tesbih ederiz; yoksa biz buna güç yetiremezdik. Şüphesiz Rabbimize döneceğiz.', 'Glory be to Him who has subjected this to us, though we could not have done so ourselves; and to our Lord we shall return.'), when: w('Bir araca binince (öncesinde üç kez tekbir)', 'Boarding a vehicle (after takbir three times)', 'عند الركوب'), ref: 'Zuhruf 13–14 · Müslim, 1342' },
      { id: 'stop', ar: 'أَعُوذُ بِكَلِمَاتِ اللَّهِ التَّامَّاتِ مِنْ شَرِّ مَا خَلَقَ', tr: 'Eûzü bi-kelimâtillâhi’t-tâmmâti min şerri mâ halak', mean: w('Yarattıklarının şerrinden Allah’ın eksiksiz kelimelerine sığınırım.', 'I seek refuge in the perfect words of Allah from the evil of what He has created.'), when: w('Bir yerde konaklarken', 'When stopping somewhere', 'عند نزول منزل'), ref: 'Müslim, 2708' },
    ],
  },
  {
    id: 'sikinti', icon: 'alert', title: w('Sıkıntı ve keder', 'Distress & worry', 'الكرب والهم'),
    items: [
      { id: 'karb', ar: 'لَا إِلَهَ إِلَّا اللَّهُ الْعَظِيمُ الْحَلِيمُ، لَا إِلَهَ إِلَّا اللَّهُ رَبُّ الْعَرْشِ الْعَظِيمِ، لَا إِلَهَ إِلَّا اللَّهُ رَبُّ السَّمَاوَاتِ وَرَبُّ الْأَرْضِ وَرَبُّ الْعَرْشِ الْكَرِيمِ', tr: 'Lâ ilâhe illallâhü’l-azîmü’l-halîm, lâ ilâhe illallâhü rabbü’l-arşi’l-azîm, lâ ilâhe illallâhü rabbü’s-semâvâti ve rabbü’l-ardı ve rabbü’l-arşi’l-kerîm', mean: w('Azîm ve Halîm olan Allah’tan başka ilah yoktur; büyük Arş’ın Rabbi Allah’tan başka ilah yoktur; göklerin, yerin ve değerli Arş’ın Rabbi Allah’tan başka ilah yoktur.', 'There is no god but Allah, the Mighty, the Forbearing; no god but Allah, Lord of the Mighty Throne; no god but Allah, Lord of the heavens, the earth and the Noble Throne.'), when: w('Büyük sıkıntıda', 'In great distress', 'عند الكرب'), ref: 'Buhârî, 6346' },
      { id: 'hamm', ar: 'اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنَ الْهَمِّ وَالْحَزَنِ، وَالْعَجْزِ وَالْكَسَلِ، وَالْبُخْلِ وَالْجُبْنِ، وَضَلَعِ الدَّيْنِ وَغَلَبَةِ الرِّجَالِ', tr: 'Allâhümme innî eûzü bike mine’l-hemmi ve’l-hazen, ve’l-aczi ve’l-kesel, ve’l-buhli ve’l-cübn, ve dalai’d-deyni ve ğalebeti’r-ricâl', mean: w('Allah’ım! Kaygıdan ve üzüntüden, acizlikten ve tembellikten, cimrilikten ve korkaklıktan, borç yükünden ve insanların baskısından sana sığınırım.', 'O Allah, I seek refuge in You from anxiety and grief, weakness and laziness, miserliness and cowardice, the burden of debt and being overpowered by men.'), ref: 'Buhârî, 6369' },
      { id: 'yunus', quran: [21, 87], when: w('Hz. Yûnus’un duası', 'The prayer of Jonah', 'دعاء ذي النون') },
      { id: 'hasbuna', quran: [3, 173], when: w('“Hasbünallâhü ve ni‘me’l-vekîl”', '“Allah is sufficient for us”', 'حسبنا الله ونعم الوكيل'), note: 'Buhârî, 4563' },
    ],
  },
  {
    id: 'sifa', icon: 'aid', title: w('Hastalık ve şifa', 'Illness & healing', 'المرض والشفاء'),
    items: [
      { id: 'ruqyah', ar: 'اللَّهُمَّ رَبَّ النَّاسِ، أَذْهِبِ الْبَاسَ، اشْفِهِ وَأَنْتَ الشَّافِي، لَا شِفَاءَ إِلَّا شِفَاؤُكَ، شِفَاءً لَا يُغَادِرُ سَقَمًا', tr: 'Allâhümme rabbe’n-nâs, ezhibi’l-be’s, işfihî ve ente’ş-şâfî, lâ şifâe illâ şifâük, şifâen lâ yuğâdiru sekamâ', mean: w('Ey insanların Rabbi Allah’ım! Sıkıntıyı gider; ona şifa ver, şifa veren sensin. Senin şifandan başka şifa yoktur; hiçbir hastalık bırakmayan bir şifa ver.', 'O Allah, Lord of mankind, remove the harm and heal him; You are the Healer. There is no healing but Yours, a healing that leaves no illness.'), when: w('Hastaya okunur', 'Recited over the sick', 'يُقرأ على المريض'), ref: 'Buhârî, 5743' },
      { id: 'pain', ar: 'بِسْمِ اللَّهِ (٣) — أَعُوذُ بِاللَّهِ وَقُدْرَتِهِ مِنْ شَرِّ مَا أَجِدُ وَأُحَاذِرُ (٧)', tr: 'Bismillâh (3 kez) — Eûzü billâhi ve kudretihî min şerri mâ ecidü ve uhâzir (7 kez)', mean: w('Elinizi ağrıyan yere koyarak: Allah’ın adıyla. Hissettiğim ve endişe ettiğim şeyin şerrinden Allah’a ve O’nun kudretine sığınırım.', 'With your hand on the place of pain: In the name of Allah (3×). I seek refuge in Allah and His power from the evil of what I feel and fear (7×).'), ref: 'Müslim, 2202' },
      { id: 'visit', ar: 'لَا بَأْسَ، طَهُورٌ إِنْ شَاءَ اللَّهُ', tr: 'Lâ be’s, tahûrun inşâallâh', mean: w('Geçmiş olsun; inşallah günahlardan arındırıcıdır.', 'No harm; it is a purification, if Allah wills.'), when: w('Hasta ziyaretinde', 'Visiting the sick', 'عند عيادة المريض'), ref: 'Buhârî, 3616' },
      { id: 'ayyub', quran: [21, 83], when: w('Hz. Eyyûb’un duası', 'The prayer of Job', 'دعاء أيوب') },
    ],
  },
  {
    id: 'tovbe', icon: 'star', title: w('Tövbe ve af', 'Repentance', 'التوبة والاستغفار'),
    items: [
      { id: 'istighfar', ar: 'أَسْتَغْفِرُ اللَّهَ وَأَتُوبُ إِلَيْهِ', tr: 'Estağfirullâhe ve etûbü ileyh', mean: w('Allah’tan bağışlanma diler, O’na tövbe ederim. (Peygamberimiz günde yetmiş defadan fazla söylerdi.)', 'I seek Allah’s forgiveness and repent to Him. (The Prophet ﷺ said it more than seventy times a day.)'), ref: 'Buhârî, 6307' },
      dhikr('afw'),
      { id: 'adam', quran: [7, 23], when: w('Hz. Âdem ve Havva’nın duası', 'The prayer of Adam and Eve', 'دعاء آدم وحواء') },
      { id: 'musa', quran: [28, 16], when: w('Hz. Mûsâ’nın duası', 'The prayer of Moses', 'دعاء موسى') },
    ],
  },
  {
    id: 'hidayet', icon: 'book', title: w('Hidayet ve ilim', 'Guidance & knowledge', 'الهداية والعلم'),
    items: [
      dhikr('huda'),
      dhikr('ighfirli'),
      { id: 'aslih', ar: 'اللَّهُمَّ أَصْلِحْ لِي دِينِيَ الَّذِي هُوَ عِصْمَةُ أَمْرِي، وَأَصْلِحْ لِي دُنْيَايَ الَّتِي فِيهَا مَعَاشِي، وَأَصْلِحْ لِي آخِرَتِي الَّتِي فِيهَا مَعَادِي، وَاجْعَلِ الْحَيَاةَ زِيَادَةً لِي فِي كُلِّ خَيْرٍ، وَاجْعَلِ الْمَوْتَ رَاحَةً لِي مِنْ كُلِّ شَرٍّ', tr: 'Allâhümme aslih lî dîniye’llezî hüve ısmetü emrî, ve aslih lî dünyâye’lletî fîhâ meâşî, ve aslih lî âhıratî’lletî fîhâ meâdî, vec’ali’l-hayâte ziyâdeten lî fî külli hayr, vec’ali’l-mevte râhaten lî min külli şerr', mean: w('Allah’ım! İşimin koruyucusu olan dinimi, geçimimin olduğu dünyamı ve dönüşümün olduğu ahiretimi ıslah et. Hayatı benim için her hayırda artış, ölümü her kötülükten kurtuluş kıl.', 'O Allah, set right my religion which is the safeguard of my affairs, my worldly life wherein is my livelihood, and my Hereafter to which I return; make life an increase in all good and death a relief from all evil.'), ref: 'Müslim, 2720' },
      { id: 'muqallib', ar: 'يَا مُقَلِّبَ الْقُلُوبِ ثَبِّتْ قَلْبِي عَلَى دِينِكَ', tr: 'Yâ mukallibe’l-kulûb, sebbit kalbî alâ dînik', mean: w('Ey kalpleri halden hale çeviren! Kalbimi dinin üzere sabit kıl.', 'O Turner of hearts, keep my heart firm upon Your religion.'), ref: 'Tirmizî, 2140' },
      { id: 'ilm', quran: [20, 114], when: w('“Rabbi zidnî ilmâ”', '“My Lord, increase me in knowledge”', 'رب زدني علمًا') },
      { id: 'sharh', quran: [20, 25, 28], when: w('Hz. Mûsâ’nın duası', 'The prayer of Moses', 'دعاء موسى') },
      { id: 'la-tuzigh', quran: [3, 8] },
    ],
  },
  {
    id: 'aile', icon: 'pin', title: w('Anne-baba ve aile', 'Parents & family', 'الوالدان والأسرة'),
    items: [
      { id: 'parents', quran: [17, 24] },
      { id: 'ibrahim-parents', quran: [14, 41] },
      { id: 'nuh', quran: [71, 28] },
      { id: 'family', quran: [25, 74] },
      { id: 'ahqaf', quran: [46, 15] },
    ],
  },
  {
    id: 'rabbena', icon: 'book', title: w('Kur’an’daki dualar', 'Prayers from the Qur’an', 'أدعية قرآنية'),
    items: (
      [[2, 127], [2, 128], [2, 201], [2, 250], [2, 286], [3, 8], [3, 9], [3, 16], [3, 53], [3, 147], [3, 191], [3, 192], [3, 193], [3, 194],
        [5, 83], [7, 23], [7, 47], [7, 126], [10, 85, 86], [14, 38], [14, 40], [18, 10], [23, 109], [25, 65, 66], [40, 7, 9], [59, 10], [60, 4, 5], [66, 8]] as [number, number, number?][]
    ).map((q) => ({ id: `q-${q.join('-')}`, quran: q })),
  },
  {
    id: 'zikir', icon: 'counter', title: w('Zikir ve tesbih', 'Dhikr', 'الأذكار'),
    items: [
      dhikr('baqiyat'),
      { id: 'subhanallah-100', ar: 'سُبْحَانَ اللَّهِ وَبِحَمْدِهِ', tr: 'Sübhânallâhi ve bi-hamdih', mean: w('Allah’ı hamdiyle tesbih ederim. (Günde yüz kez söyleyenin hataları deniz köpüğü kadar olsa da bağışlanır.)', 'Glory and praise be to Allah. (Whoever says it a hundred times a day has his sins forgiven, even if like the foam of the sea.)'), count: 100, ref: 'Buhârî, 6405' },
      dhikr('subhanallah-azim'),
      dhikr('hawqala'),
      { id: 'tahlil-100', ar: TAHLIL, tr: TAHLIL_TR, mean: TAHLIL_MEAN, count: 100, when: w('Günde yüz kez', 'A hundred times a day', 'مائة مرة في اليوم'), ref: 'Buhârî, 6403' },
    ],
  },
  {
    id: 'gunluk', icon: 'list', title: w('Gündelik', 'Daily life', 'أذكار يومية'),
    items: [
      { id: 'toilet', ar: 'اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنَ الْخُبُثِ وَالْخَبَائِثِ', tr: 'Allâhümme innî eûzü bike mine’l-hubüsi ve’l-habâis', mean: w('Allah’ım! Erkek ve dişi şeytanların şerrinden sana sığınırım.', 'O Allah, I seek refuge in You from the male and female devils.'), when: w('Tuvalete girerken', 'Entering the toilet', 'عند دخول الخلاء'), ref: 'Buhârî, 142' },
      { id: 'sneeze', ar: 'الْحَمْدُ لِلَّهِ — يَرْحَمُكَ اللَّهُ — يَهْدِيكُمُ اللَّهُ وَيُصْلِحُ بَالَكُمْ', tr: 'Hapşıran: El-hamdü lillâh · Duyan: Yerhamükallâh · Hapşıran: Yehdîkümullâhü ve yuslihu bâleküm', mean: w('Hamd Allah’a mahsustur · Allah sana merhamet etsin · Allah sizi doğru yola iletsin ve halinizi düzeltsin.', 'Praise be to Allah · May Allah have mercy on you · May Allah guide you and set your affairs right.'), when: w('Hapşırınca', 'On sneezing', 'عند العطاس'), ref: 'Buhârî, 6224' },
      { id: 'anger', ar: 'أَعُوذُ بِاللَّهِ مِنَ الشَّيْطَانِ الرَّجِيمِ', tr: 'Eûzü billâhi mine’ş-şeytâni’r-racîm', mean: w('Kovulmuş şeytandan Allah’a sığınırım.', 'I seek refuge in Allah from the accursed Satan.'), when: w('Öfkelenince', 'When angry', 'عند الغضب'), ref: 'Buhârî, 3282' },
      { id: 'rain', ar: 'اللَّهُمَّ صَيِّبًا نَافِعًا', tr: 'Allâhümme sayyiben nâfiâ', mean: w('Allah’ım! Faydalı bir yağmur kıl.', 'O Allah, make it a beneficial rain.'), when: w('Yağmur yağarken', 'When it rains', 'عند نزول المطر'), ref: 'Buhârî, 1032' },
      { id: 'majlis', ar: 'سُبْحَانَكَ اللَّهُمَّ وَبِحَمْدِكَ، أَشْهَدُ أَنْ لَا إِلَهَ إِلَّا أَنْتَ، أَسْتَغْفِرُكَ وَأَتُوبُ إِلَيْكَ', tr: 'Sübhânekellâhümme ve bi-hamdik, eşhedü en lâ ilâhe illâ ent, estağfiruke ve etûbü ileyk', mean: w('Allah’ım! Seni hamdinle tesbih ederim. Senden başka ilah olmadığına şahitlik ederim; senden bağışlanma diler, sana tövbe ederim.', 'Glory and praise be to You, O Allah. I bear witness that there is no god but You; I seek Your forgiveness and repent to You.'), when: w('Bir meclisten kalkarken', 'When leaving a gathering', 'كفارة المجلس'), ref: 'Tirmizî, 3433' },
    ],
  },
];

export const duaCount = (c: (typeof DUA_LIB)[number]) => c.items.length;
export const allTextDuas = () => {
  const seen = new Set<string>();
  const out: { cat: string; d: DuaText }[] = [];
  for (const c of DUA_LIB) for (const d of c.items) if (!isQuranRef(d) && !seen.has(d.id)) { seen.add(d.id); out.push({ cat: c.id, d }); }
  return out;
};
