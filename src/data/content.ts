// Uygulama içi sabit içerikler. Kaynaklar ve doğrulama notları docs/VERI-KAYNAKLARI.md'de.
import type { City, Pt } from './sites';

// ── Mescid içi hizmet noktaları (ÖRNEK VERİ — resmî kurum verisiyle değiştirilecek) ──
export type PlaceCat = 'gate' | 'zamzam' | 'wc' | 'lift' | 'access' | 'aid' | 'lost' | 'meet';
export type Place = { id: string; city: City; cat: PlaceCat; name: string; detail: string; pos: Pt; gateId?: string };

export const PLACES: Place[] = [
  { id: 'p1', city: 'makkah', cat: 'meet', name: 'Buluşma noktası · Kral Fahd Kapısı önü', detail: 'Batı avlusu', pos: [-262, -10] },
  { id: 'p2', city: 'makkah', cat: 'wc', name: 'Tuvalet ve abdesthane · erkek', detail: 'Batı avlusu, alt kat', pos: [-275, 40] },
  { id: 'p3', city: 'makkah', cat: 'wc', name: 'Tuvalet ve abdesthane · kadın', detail: 'Batı avlusu, alt kat', pos: [-275, 80] },
  { id: 'p4', city: 'makkah', cat: 'zamzam', name: 'Zemzem standı · Kral Fahd revakı', detail: 'Zemin', pos: [-200, -15] },
  { id: 'p5', city: 'makkah', cat: 'zamzam', name: 'Zemzem · Mataf kenarı', detail: 'Zemin', pos: [-55, 20] },
  { id: 'p6', city: 'makkah', cat: 'access', name: 'Tekerlekli sandalye teslim noktası', detail: 'Kral Fahd Kapısı yanı', pos: [-245, 10] },
  { id: 'p7', city: 'makkah', cat: 'access', name: 'Engelli tavaf yolu', detail: '1. kat', pos: [-60, -40] },
  { id: 'p8', city: 'makkah', cat: 'lift', name: 'Asansör · Kral Fahd revakı', detail: 'Zemin → 1. kat → çatı', pos: [-215, 5] },
  { id: 'p9', city: 'makkah', cat: 'aid', name: 'Sağlık noktası · batı', detail: 'Zemin', pos: [-225, 30] },
  { id: 'p10', city: 'makkah', cat: 'lost', name: 'Kayıp eşya ofisi', detail: 'Güney avlusu', pos: [-30, 200] },
  { id: 'p11', city: 'madinah', cat: 'meet', name: 'Buluşma noktası · Kral Fahd Kapısı önü', detail: 'Kuzey avlusu', pos: [0, -230] },
  { id: 'p12', city: 'madinah', cat: 'wc', name: 'Tuvalet ve abdesthane', detail: 'Kuzey avlusu, alt kat', pos: [-80, -250] },
  { id: 'p13', city: 'madinah', cat: 'zamzam', name: 'Zemzem kapları', detail: 'Mescit içi, sütun dipleri', pos: [0, -100] },
  { id: 'p14', city: 'madinah', cat: 'aid', name: 'Sağlık noktası', detail: 'Doğu avlusu', pos: [175, 20] },
];

// ── Ravza ziyaret saatleri (Suudi Basın Ajansı, 20 Ekim 2026; otomatik güncellenecek) ──
export const RAWDAH = {
  version: '2026-10-20',
  source: 'Suudi Basın Ajansı (SPA), 20 Ekim 2026',
  tourUrl: 'https://vr.qurancomplex.gov.sa/msq/',
  nusukUrl: 'https://www.nusuk.sa/',
  insideMinutes: 20,
  reissueDays: 365,
  entry: { tr: 'Bab Mekke (Kapı 37) önündeki güney avluları', en: 'Southern courtyards in front of Makkah Gate (37)', ar: 'الساحات الجنوبية أمام باب مكة (37)' },
  hours: {
    men: { satThu: ['02:00 – sabah namazı', '11:20 – yatsı'], fri: ['02:00 – sabah namazı', '09:00 – yatsı'] },
    women: { satThu: ['sabah namazı – 11:00', 'yatsı – 02:00'], fri: ['sabah namazı – 09:00', 'yatsı – 02:00'] },
  },
  steps: [
    'Güney avlusu · Bab Mekke (37) önünde izin kontrolü',
    'Görevlinin işaretiyle Ravza’ya giriş',
    'Yeşil halıda 2 rekât namaz ve dua · 20 dk',
    'Muvâcehe-i Şerîfe önünde selam',
    'Çıkış · Bab el-Bakî (41)',
  ],
};

// ── Dualar (Arapça metin, okunuş, Türkçe anlam, kaynak) ──
export type Dua = { ar: string; tr: string; meaning: string; ref: string };
export const DUA_CATS: { id: string; title: string; items: Dua[] }[] = [
  { id: 'mescit', title: 'Mescide giriş-çıkış', items: [
    { ar: 'اللَّهُمَّ افْتَحْ لِي أَبْوَابَ رَحْمَتِكَ', tr: 'Allâhümme’ftah lî ebvâbe rahmetik', meaning: 'Allah’ım, bana rahmetinin kapılarını aç. (girerken)', ref: 'Müslim, 713' },
    { ar: 'اللَّهُمَّ إِنِّي أَسْأَلُكَ مِنْ فَضْلِكَ', tr: 'Allâhümme innî es’elüke min fadlik', meaning: 'Allah’ım, senden lütfunu isterim. (çıkarken)', ref: 'Müslim, 713' },
  ] },
  { id: 'telbiye', title: 'Telbiye', items: [
    { ar: 'لَبَّيْكَ اللَّهُمَّ لَبَّيْكَ، لَبَّيْكَ لَا شَرِيكَ لَكَ لَبَّيْكَ، إِنَّ الْحَمْدَ وَالنِّعْمَةَ لَكَ وَالْمُلْكَ، لَا شَرِيكَ لَكَ', tr: 'Lebbeyk Allâhümme lebbeyk, lebbeyke lâ şerîke leke lebbeyk, inne’l-hamde ve’n-ni’mete leke ve’l-mülk, lâ şerîke lek', meaning: 'Buyur Allah’ım, buyur! Senin hiçbir ortağın yoktur, buyur! Hamd, nimet ve mülk senindir; senin ortağın yoktur.', ref: 'Buhârî, 1549' },
  ] },
  { id: 'tavaf', title: 'Tavaf', items: [
    { ar: 'رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ', tr: 'Rabbenâ âtinâ fi’d-dünyâ haseneten ve fi’l-âhirati haseneten ve kınâ azâbe’n-nâr', meaning: 'Rabbimiz! Bize dünyada da iyilik ver, ahirette de iyilik ver ve bizi ateş azabından koru. (Rükn-i Yemânî ile Hacerülesved arasında)', ref: 'Bakara 201; Ebû Dâvûd, 1892' },
  ] },
  { id: 'say', title: "Sa'y", items: [
    { ar: 'إِنَّ الصَّفَا وَالْمَرْوَةَ مِنْ شَعَائِرِ اللَّهِ', tr: 'İnne’s-Safâ ve’l-Mervete min şeâirillâh', meaning: 'Şüphesiz Safa ile Merve Allah’ın nişanlarındandır. (Safa’ya ilk çıkışta)', ref: 'Bakara 158; Müslim, 1218' },
  ] },
  { id: 'zemzem', title: 'Zemzem', items: [
    { ar: 'مَاءُ زَمْزَمَ لِمَا شُرِبَ لَهُ', tr: 'Mâu zemzeme limâ şuribe leh', meaning: 'Zemzem suyu ne niyetle içilirse onun içindir. (Hadis; içerken dilediğiniz duayı yapabilirsiniz.)', ref: 'İbn Mâce, 3062' },
  ] },
  { id: 'yolculuk', title: 'Yolculuk', items: [
    { ar: 'سُبْحَانَ الَّذِي سَخَّرَ لَنَا هَذَا وَمَا كُنَّا لَهُ مُقْرِنِينَ وَإِنَّا إِلَى رَبِّنَا لَمُنْقَلِبُونَ', tr: 'Sübhânellezî sahhara lenâ hâzâ ve mâ künnâ lehû mukrinîn ve innâ ilâ rabbinâ le-munkalibûn', meaning: 'Bunu bizim hizmetimize veren Allah’ı tesbih ederiz; yoksa biz buna güç yetiremezdik. Şüphesiz biz Rabbimize döneceğiz.', ref: 'Zuhruf 13–14; Müslim, 1342' },
  ] },
  { id: 'sabah', title: 'Sabah ve akşam', items: [
    { ar: 'أَصْبَحْنَا وَأَصْبَحَ الْمُلْكُ لِلَّهِ وَالْحَمْدُ لِلَّهِ', tr: 'Asbahnâ ve asbaha’l-mülkü lillâh, ve’l-hamdü lillâh', meaning: 'Sabaha erdik, mülk de Allah’ındır; hamd Allah’a mahsustur. (Akşam: Emseynâ ve emse’l-mülkü lillâh)', ref: 'Müslim, 2723' },
  ] },
];

// ── Veri kaynakları ekranı için ──
export const SOURCES = [
  { id: 'reports', title: 'Kapı durumları', meta: 'Ziyaretçi bildirimleri (yerel demo / Supabase)', live: true },
  { id: 'official', title: 'Resmî kapanmalar ve rotalar', meta: 'Genel Kurum akıllı haritası — entegrasyon anlaşması bekleniyor', live: true },
  { id: 'quran', title: 'Kur’an metni ve meal', meta: 'alquran.cloud · cihazda saklanır', live: false, cacheKey: 'quran' },
  { id: 'hadith', title: 'Sahîh-i Buhârî', meta: 'fawazahmed0/hadith-api · cihazda saklanır', live: false, cacheKey: 'hadith' },
  { id: 'osm', title: 'Şehir haritası yerleri', meta: 'OpenStreetMap (Overpass) · haftalık', live: false, cacheKey: 'osm' },
  { id: 'rawdah', title: 'Ravza saatleri', meta: `SPA · sürüm ${'2026-10-20'}`, live: false },
  { id: 'prayer', title: 'Namaz vakitleri', meta: 'Telefonda hesaplanır (adhan)', live: false },
];
