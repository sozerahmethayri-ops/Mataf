// Mescid-i Haram ve Mescid-i Nebevî için yerel koordinat sistemi (metre).
// x = doğu (+), y = güney (+). Orijin: Mekke'de Kâbe, Medine'de bina merkezi.
// Ölçüler yayımlanmış değerlerden; dış hatlar ve kapı yerleri yaklaşık (docs/VERI-KAYNAKLARI.md).

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
  // Kâbe merkezi
  makkah: { lat: 21.42252, lng: 39.82621, name: { tr: 'Mescid-i Haram', en: 'Masjid al-Haram', ar: 'المسجد الحرام' } },
  // Mescid-i Nebevî bina merkezi (yaklaşık)
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

export const GATES: Gate[] = [
  { id: 'mk-1', city: 'makkah', no: '1', name: { tr: 'Kral Abdülaziz Kapısı', en: 'King Abdulaziz Gate', ar: 'باب الملك عبدالعزيز' }, side: { tr: 'Güney · Ecyad / Saat Kulesi', en: 'South · Ajyad / Clock Tower', ar: 'الجنوب · أجياد' }, pos: [-60, 165], out: [-60, 195], inner: [-45, 110] },
  { id: 'mk-79', city: 'makkah', no: '79', name: { tr: 'Kral Fahd Kapısı', en: 'King Fahd Gate', ar: 'باب الملك فهد' }, side: { tr: 'Batı', en: 'West', ar: 'الغرب' }, pos: [-235, -18], out: [-262, -18], inner: [-110, -10] },
  { id: 'mk-62', city: 'makkah', no: '62', name: { tr: 'Umre Kapısı', en: 'Umrah Gate', ar: 'باب العمرة' }, side: { tr: 'Kuzeybatı', en: 'North-west', ar: 'الشمال الغربي' }, pos: [-168, -200], out: [-168, -222], inner: [-80, -95] },
  { id: 'mk-45', city: 'makkah', no: '45', name: { tr: 'Fetih Kapısı', en: 'Al-Fath Gate', ar: 'باب الفتح' }, side: { tr: 'Kuzey · Merve tarafı', en: 'North · Marwah side', ar: 'الشمال · جهة المروة' }, pos: [40, -200], out: [40, -222], inner: [20, -100] },
  { id: 'mk-19', city: 'makkah', no: '19', name: { tr: 'Selam Kapısı (bodrum)', en: 'Al-Salam Gate (basement)', ar: 'باب السلام' }, side: { tr: "Doğu · Mes'a yanı", en: "East · by the Mas'a", ar: 'الشرق · بجوار المسعى' }, pos: [118, -40], out: [140, -40], inner: [60, -20] },
  { id: 'mk-100', city: 'makkah', no: '100', name: { tr: 'Kral Abdullah Kapısı', en: 'King Abdullah Gate', ar: 'باب الملك عبدالله' }, side: { tr: 'Kuzey · yeni genişleme', en: 'North · new expansion', ar: 'الشمال · التوسعة' }, pos: [-85, -555], out: [-85, -578], inner: [-60, -110] },
  { id: 'md-21', city: 'madinah', no: '21', name: { tr: 'Kral Fahd Kapısı', en: 'King Fahd Gate', ar: 'باب الملك فهد' }, side: { tr: 'Kuzey', en: 'North', ar: 'الشمال' }, pos: [0, -190], out: [0, -215], inner: [0, -150] },
  { id: 'md-1', city: 'madinah', no: '1', name: { tr: 'Bab-üs Selam', en: 'Bab al-Salam', ar: 'باب السلام' }, side: { tr: 'Batı · eski çekirdek', en: 'West · old core', ar: 'الغرب' }, pos: [-46, 160], out: [-70, 160], inner: [-20, 158] },
  { id: 'md-41', city: 'madinah', no: '41', name: { tr: 'Bab el-Bakî', en: 'Bab al-Baqi', ar: 'باب البقيع' }, side: { tr: "Doğu · Hücre-i Saadet'e en yakın", en: 'East · nearest the Prophet’s chamber', ar: 'الشرق' }, pos: [46, 160], out: [70, 160], inner: [20, 158] },
  { id: 'md-37', city: 'madinah', no: '37', name: { tr: 'Bab Mekke', en: 'Makkah Gate', ar: 'باب مكة' }, side: { tr: 'Güney · Ravza girişi avlusu', en: 'South · Rawdah entry courtyard', ar: 'الجنوب' }, pos: [-95, 130], out: [-95, 160], inner: [-95, 100] },
];

export const DESTINATIONS: Destination[] = [
  { id: 'mataf', city: 'makkah', label: 'dest.mataf', pos: [-30, -2], inside: true },
  { id: 'safa', city: 'makkah', label: 'dest.safa', pos: [95, 95], inside: true },
  { id: 'rawdah', city: 'madinah', label: 'dest.rawdah', pos: [-95, 172], inside: false },
  { id: 'baqi', city: 'madinah', label: 'dest.baqi', pos: [215, 40], inside: false },
];

// Binanın dışından dolaşan yürüme halkası (saat yönünde).
export const RINGS: Record<City, Pt[]> = {
  makkah: [[-262, -222], [-85, -222], [40, -222], [140, -300], [140, -40], [140, 130], [80, 195], [-60, 195], [-262, 195], [-262, -18]],
  madinah: [[-175, -215], [0, -215], [180, -215], [180, 0], [180, 200], [46, 200], [-95, 200], [-175, 200], [-175, 0]],
};

/** Mescid çevresinde değilse kullanılacak demo başlangıç konumu. */
export const DEMO_START: Record<City, Pt> = { makkah: [-330, 60], madinah: [-20, -250] };
