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
