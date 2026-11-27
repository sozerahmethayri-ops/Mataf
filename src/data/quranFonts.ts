// Kur'an hat (yazı) seçenekleri. Yalnız Uthmani metnin bütün Kur'an işaretlerini (küçük harfler, durak işaretleri,
// ﴿﴾, ۩) çizen açık lisanslı (SIL OFL 1.1) yazı tipleri. Kûfî (Reem Kufi), Rik'a (Aref Ruqaa) ve Nestâlik
// (Noto Nastaliq Urdu) 19–23 işareti çizemediği için yok (fontTools ile ölçüldü, 0.17.0).
// size: aynı punto bu yazıda ne kadar büyük gösterilsin; minLine: yazının doğal satır yüksekliği (em). Satır bundan
// kısa olursa üst üste binen harekeler kesilir. Arayüz sistem yazı tipinde kalır; bu dosyalar yalnız Kur'an metni için.
export type QuranFontId = 'system' | 'amiri' | 'scheherazade' | 'naskh' | 'lateef';
type ML = { tr: string; en: string; ar: string };
export type QuranFont = { id: QuranFontId; family?: string; name: ML; desc: ML; size: number; minLine: number };

export const QURAN_FONTS: QuranFont[] = [
  { id: 'system', name: { tr: 'Cihazın yazısı', en: 'Device font', ar: 'خط الجهاز' },
    desc: { tr: 'Telefonun kendi Arapça yazısı', en: 'Your phone’s own Arabic font', ar: 'الخط العربي في هاتفك' }, size: 1, minLine: 0 },
  { id: 'amiri', family: 'AmiriQuran', name: { tr: 'Amiri Kur’an', en: 'Amiri Quran', ar: 'أميري قرآن' },
    desc: { tr: 'Klasik nesih; eski Kahire (Bulak) baskılarının üslubu', en: 'Classical naskh in the style of the old Cairo (Bulaq) prints', ar: 'نسخ تقليدي على طريقة مطبعة بولاق' }, size: 1.05, minLine: 2.5 },
  { id: 'scheherazade', family: 'ScheherazadeNew', name: { tr: 'Scheherazade', en: 'Scheherazade', ar: 'شهرزاد' },
    desc: { tr: 'Geleneksel nesih; iri, açık, harekeler belirgin', en: 'Traditional naskh; large and open with clear vowel marks', ar: 'نسخ تقليدي كبير وواضح التشكيل' }, size: 0.95, minLine: 2.1 },
  { id: 'naskh', family: 'NotoNaskhArabic', name: { tr: 'Noto Nesih', en: 'Noto Naskh', ar: 'نوتو نسخ' },
    desc: { tr: 'Sade nesih; her telefonda aynı görünür', en: 'Plain naskh that looks the same on every phone', ar: 'نسخ بسيط يظهر بالشكل نفسه على كل هاتف' }, size: 1, minLine: 1.8 },
  { id: 'lateef', family: 'Lateef', name: { tr: 'Lateef', en: 'Lateef', ar: 'لطيف' },
    desc: { tr: 'Hint alt kıtası mushaflarının nesih üslubu', en: 'Naskh in the style of South Asian mushafs', ar: 'نسخ على طريقة مصاحف شبه القارة الهندية' }, size: 1.2, minLine: 2.1 },
];

export const quranFont = (id?: string) => QURAN_FONTS.find((f) => f.id === id) ?? QURAN_FONTS[0];

/** Satır yüksekliği: yazının doğal yüksekliğinden kısa olmasın (harekeler kesilmesin) */
export const lineFor = (f: QuranFont, fontSize: number, base: number) => Math.max(base, Math.round(fontSize * f.minLine));
