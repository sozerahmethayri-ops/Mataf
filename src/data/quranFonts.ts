// Kur'an hat (yazı) seçenekleri. Medine Mushafı: DigitalKhatt New Madina'nın değiştirilmiş sürümü (assets/fonts,
// OFL; tools/fonts/digitalkhatt_ttf.py). Yalnız Uthmani metnin bütün Kur'an işaretlerini (küçük harfler, durak işaretleri,
// ﴿﴾, ۩) çizen açık lisanslı (SIL OFL 1.1) yazı tipleri. Kûfî (Reem Kufi), Rik'a (Aref Ruqaa) ve Nestâlik
// (Noto Nastaliq Urdu) 19–23 işareti çizemediği için yok (fontTools ile ölçüldü, 0.17.0).
// size: aynı punto bu yazıda ne kadar büyük gösterilsin; minLine: yazının doğal satır yüksekliği (em). Satır bundan
// kısa olursa üst üste binen harekeler kesilir. Arayüz sistem yazı tipinde kalır; bu dosyalar yalnız Kur'an metni için.
export type QuranFontId = 'system' | 'madina' | 'amiri' | 'scheherazade' | 'naskh' | 'lateef';
type ML = { tr: string; en: string; ar: string };
export type QuranFont = { id: QuranFontId; family?: string; name: ML; desc: ML; size: number; minLine: number };

export const QURAN_FONTS: QuranFont[] = [
  { id: 'system', name: { tr: 'Cihazın yazısı', en: 'Device font', ar: 'خط الجهاز' },
    desc: { tr: 'Telefonun kendi Arapça yazısı', en: 'Your phone’s own Arabic font', ar: 'الخط العربي في هاتفك' }, size: 1, minLine: 0 },
  // Varsayılan (0.22.0): cihazın yazısı bazı telefonlarda (Samsung, Xiaomi) Kur'an işaretlerini eksik çiziyordu.
  { id: 'madina', family: 'MatafMadina', name: { tr: 'Medine Mushafı', en: 'Madina Mushaf', ar: 'مصحف المدينة' },
    desc: { tr: 'Medine mushafının hattı (DigitalKhatt); kelime araları açık', en: 'The script of the Madina mushaf (DigitalKhatt), with clear word spacing', ar: 'خط مصحف المدينة (DigitalKhatt) بمسافات واضحة' }, size: 1, minLine: 2.2 },
  { id: 'amiri', family: 'AmiriQuran', name: { tr: 'Amiri Kur’an', en: 'Amiri Quran', ar: 'أميري قرآن' },
    desc: { tr: 'Klasik nesih; eski Kahire (Bulak) baskılarının üslubu', en: 'Classical naskh in the style of the old Cairo (Bulaq) prints', ar: 'نسخ تقليدي على طريقة مطبعة بولاق' }, size: 1.05, minLine: 2.5 },
  { id: 'scheherazade', family: 'ScheherazadeNew', name: { tr: 'Scheherazade', en: 'Scheherazade', ar: 'شهرزاد' },
    desc: { tr: 'Geleneksel nesih; iri, açık, harekeler belirgin', en: 'Traditional naskh; large and open with clear vowel marks', ar: 'نسخ تقليدي كبير وواضح التشكيل' }, size: 0.95, minLine: 2.1 },
  { id: 'naskh', family: 'NotoNaskhArabic', name: { tr: 'Noto Nesih', en: 'Noto Naskh', ar: 'نوتو نسخ' },
    desc: { tr: 'Sade nesih; her telefonda aynı görünür', en: 'Plain naskh that looks the same on every phone', ar: 'نسخ بسيط يظهر بالشكل نفسه على كل هاتف' }, size: 1, minLine: 1.8 },
  { id: 'lateef', family: 'Lateef', name: { tr: 'Lateef', en: 'Lateef', ar: 'لطيف' },
    desc: { tr: 'Hint alt kıtası mushaflarının nesih üslubu', en: 'Naskh in the style of South Asian mushafs', ar: 'نسخ على طريقة مصاحف شبه القارة الهندية' }, size: 1.2, minLine: 2.1 },
];

/** Seçilmediyse (ya da bilinmiyorsa) Medine Mushafı; "Cihazın yazısı" yalnız açıkça seçilince */
export const DEFAULT_QURAN_FONT: QuranFontId = 'madina';
export const quranFont = (id?: string) => QURAN_FONTS.find((f) => f.id === id) ?? QURAN_FONTS.find((f) => f.id === DEFAULT_QURAN_FONT)!;

const arDigits = (n: number) => String(n).replace(/\d/g, (d) => '٠١٢٣٤٥٦٧٨٩'[Number(d)]);
/** Âyet sonu işareti: Medine hattında U+06DD + rakam (yazı rakamı mushaftaki gibi süslü dairenin içine alır), diğerlerinde ﴿n﴾ */
export const ayahMark = (f: QuranFont, n: number) => (f.id === 'madina' ? `\u06DD${arDigits(n)}` : `\uFD3F${arDigits(n)}\uFD3E`);

/** Satır yüksekliği: yazının doğal yüksekliğinden kısa olmasın (harekeler kesilmesin) */
export const lineFor = (f: QuranFont, fontSize: number, base: number) => Math.max(base, Math.round(fontSize * f.minLine));
