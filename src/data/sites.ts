// Mescid-i Haram ve Mescid-i Nebevî için yerel koordinat sistemi (metre).
// x = doğu (+), y = güney (+). Orijin: Mekke'de Kâbe'nin merkezi, Medine'de binanın güney kenarına yakın sabit nokta.
// Bina dış hatları ve kapı yerleri OpenStreetMap'ten (© OpenStreetMap katkıcıları, ODbL); kapı numaraları
// Genel Kurum'un kullandığı yaygın numaralardır (docs/VERI-KAYNAKLARI.md).

export type City = 'makkah' | 'madinah';
export type Pt = [number, number];
export type ML = { tr: string; en: string; ar: string };

export type Gate = {
  id: string; // ör. 'mk-79'
  city: City;
  no: string;
  name: ML;
  side: ML;
  pos: Pt; // kapının bina cephesindeki yeri
  out: Pt; // kapının hemen dışındaki nokta (dış çevre yoluna bağlanır)
  inner: Pt; // kapıdan geçtikten sonraki iç nokta
};

export type Destination = {
  id: string;
  city: City;
  label: 'dest.mataf' | 'dest.safa' | 'dest.rawdah' | 'dest.baqi';
  pos: Pt;
  inside: boolean; // bina içinden mi gidilir (kapı seçimi gerekir)
};

export const ANCHORS: Record<City, { lat: number; lng: number; name: ML }> = {
  // Kâbe merkezi (OSM'deki Kâbe çokgeninin merkezi)
  makkah: { lat: 21.4225165, lng: 39.826182, name: { tr: 'Mescid-i Haram', en: 'Masjid al-Haram', ar: 'المسجد الحرام' } },
  // Mescid-i Nebevî: Yeşil Kubbe'nin ~10 m güneybatısı (OSM verisinin orijini)
  madinah: { lat: 24.4675, lng: 39.6114, name: { tr: 'Mescid-i Nebevî', en: "Prophet's Mosque", ar: 'المسجد النبوي' } },
};

const M = 111320;
export function toLatLng(city: City, p: Pt) {
  const a = ANCHORS[city];
  return { latitude: a.lat - p[1] / M, longitude: a.lng + p[0] / (M * Math.cos((a.lat * Math.PI) / 180)) };
}
export function toLocal(city: City, lat: number, lng: number): Pt {
  const a = ANCHORS[city];
  return [(lng - a.lng) * M * Math.cos((a.lat * Math.PI) / 180), -(lat - a.lat) * M];
}
export const dist = (a: Pt, b: Pt) => Math.hypot(a[0] - b[0], a[1] - b[1]);

// Kapılar: konum OSM'deki giriş noktası (bina dış hattının üstünde); `out` 18 m dışarıda, `inner` 25 m içeride.
export const GATES: Gate[] = [
  { id: 'mk-1', city: 'makkah', no: '1', name: { tr: 'Kral Abdülaziz Kapısı', en: 'King Abdulaziz Gate', ar: 'باب الملك عبدالعزيز' }, side: { tr: 'Güney · Ecyad / Saat Kulesi', en: 'South · Ajyad / Clock Tower', ar: 'الجنوب · أجياد' }, pos: [-35, 163], out: [-39, 180], inner: [-30, 138] },
  { id: 'mk-79', city: 'makkah', no: '79', name: { tr: 'Kral Fahd Kapısı', en: 'King Fahd Gate', ar: 'باب الملك فهد' }, side: { tr: 'Güneybatı', en: 'South-west', ar: 'الجنوب الغربي' }, pos: [-221, 142], out: [-236, 152], inner: [-200, 128] },
  { id: 'mk-62', city: 'makkah', no: '62', name: { tr: 'Umre Kapısı', en: 'Umrah Gate', ar: 'باب العمرة' }, side: { tr: 'Batı', en: 'West', ar: 'الغرب' }, pos: [-167, -36], out: [-185, -40], inner: [-143, -31] },
  { id: 'mk-45', city: 'makkah', no: '45', name: { tr: 'Fetih Kapısı', en: 'Al-Fath Gate', ar: 'باب الفتح' }, side: { tr: 'Kuzey · Şamiye avlusu', en: 'North · Shamiya courtyard', ar: 'الشمال · الشامية' }, pos: [34, -166], out: [37, -183], inner: [29, -141] },
  { id: 'mk-100', city: 'makkah', no: '100', name: { tr: 'Kral Abdullah Kapısı', en: 'King Abdullah Gate', ar: 'باب الملك عبدالله' }, side: { tr: 'Kuzeybatı · yeni genişleme', en: 'North-west · new expansion', ar: 'الشمال الغربي · التوسعة' }, pos: [-212, -318], out: [-222, -333], inner: [-199, -297] },
  { id: 'md-1', city: 'madinah', no: '1', name: { tr: 'Bab-üs Selam', en: 'Bab al-Salam', ar: 'باب السلام' }, side: { tr: 'Batı · Ravza ziyareti girişi', en: 'West · Rawdah visit entrance', ar: 'الغرب · مدخل الروضة' }, pos: [-75, 7], out: [-93, 7], inner: [-50, 7] },
  { id: 'md-41', city: 'madinah', no: '41', name: { tr: 'Bab el-Bakî', en: 'Bab al-Baqi', ar: 'باب البقيع' }, side: { tr: "Doğu · Hücre-i Saadet'in yanı (çıkış)", en: 'East · beside the Prophet’s chamber (exit)', ar: 'الشرق · بجوار الحجرة' }, pos: [20, 5], out: [38, 5], inner: [-5, 5] },
  { id: 'md-37', city: 'madinah', no: '37', name: { tr: 'Bab Mekke', en: 'Makkah Gate', ar: 'باب مكة' }, side: { tr: 'Güney · doğu kanat', en: 'South · east wing', ar: 'الجنوب' }, pos: [109, -30], out: [109, -12], inner: [109, -55] },
  { id: 'md-21', city: 'madinah', no: '21', name: { tr: 'Kral Fahd Kapıları (20–22)', en: 'King Fahd Gates (20–22)', ar: 'باب الملك فهد' }, side: { tr: 'Kuzey · ana giriş', en: 'North · main entrance', ar: 'الشمال' }, pos: [-25, -268], out: [-25, -286], inner: [-25, -243] },
  { id: 'md-7', city: 'madinah', no: '7', name: { tr: 'Kral Suud Kapıları (7–9)', en: 'King Saud Gates (7–9)', ar: 'باب الملك سعود' }, side: { tr: 'Batı', en: 'West', ar: 'الغرب' }, pos: [-228, -85], out: [-246, -85], inner: [-203, -85] },
  { id: 'md-33', city: 'madinah', no: '33', name: { tr: 'Kral Abdülaziz Kapıları (33–35)', en: 'King Abdulaziz Gates (33–35)', ar: 'باب الملك عبدالعزيز' }, side: { tr: 'Doğu · Bakî tarafı', en: 'East · Baqi side', ar: 'الشرق · جهة البقيع' }, pos: [182, -86], out: [200, -86], inner: [157, -86] },
];

export const DESTINATIONS: Destination[] = [
  { id: 'mataf', city: 'makkah', label: 'dest.mataf', pos: [-30, -2], inside: true },
  { id: 'safa', city: 'makkah', label: 'dest.safa', pos: [116, 92], inside: true },
  // Ravza: Hücre-i Saadet (Yeşil Kubbe) ile minber arası
  { id: 'rawdah', city: 'madinah', label: 'dest.rawdah', pos: [-12, -8], inside: true },
  // Bakî'nin batı girişi
  { id: 'baqi', city: 'madinah', label: 'dest.baqi', pos: [222, 40], inside: false },
];

/** Mescid çevresinde değilse kullanılacak demo başlangıç konumu. */
export const DEMO_START: Record<City, Pt> = { makkah: [-330, 60], madinah: [-60, -330] };
