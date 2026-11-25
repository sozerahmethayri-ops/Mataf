// Hicrî takvim: Ümmü'l-Kurâ (Intl) ile gün/ay/yıl; Intl yoksa tablo yöntemi (±1 gün).
// Ay adları Türkçe/İngilizce/Arapça elle verilir (cihazdan bağımsız, düzgün yazım).
// Mübarek gün ve geceler hicrî tarihten hesaplanır.

export type Hijri = { d: number; m: number; y: number };
type Lang = 'tr' | 'en' | 'ar';

export const HIJRI_MONTHS: Record<Lang, string[]> = {
  tr: ['Muharrem', 'Safer', 'Rebîülevvel', 'Rebîülâhir', 'Cemâziyelevvel', 'Cemâziyelâhir', 'Receb', 'Şâban', 'Ramazan', 'Şevvâl', 'Zilkade', 'Zilhicce'],
  en: ['Muharram', 'Safar', 'Rabi al-Awwal', 'Rabi al-Thani', 'Jumada al-Ula', 'Jumada al-Akhirah', 'Rajab', 'Shaban', 'Ramadan', 'Shawwal', 'Dhu al-Qadah', 'Dhu al-Hijjah'],
  ar: ['مُحَرَّم', 'صَفَر', 'رَبِيع الأَوَّل', 'رَبِيع الآخِر', 'جُمَادَى الأُولَى', 'جُمَادَى الآخِرَة', 'رَجَب', 'شَعْبَان', 'رَمَضَان', 'شَوَّال', 'ذُو القَعْدَة', 'ذُو الحِجَّة'],
};

/** Tablo (Kuveyt) yöntemi: Intl takvimi yoksa yedek. */
export function hijriTabular(date: Date): Hijri {
  const jd = Math.floor(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 864e5) + 2440588;
  const l0 = jd - 1948440 + 10632;
  const n = Math.floor((l0 - 1) / 10631);
  let l = l0 - 10631 * n + 354;
  const j = Math.floor((10985 - l) / 5316) * Math.floor((50 * l) / 17719) + Math.floor(l / 5670) * Math.floor((43 * l) / 15238);
  l = l - Math.floor((30 - j) / 15) * Math.floor((17719 * j) / 50) - Math.floor(j / 16) * Math.floor((15238 * j) / 43) + 29;
  const m = Math.floor((24 * l) / 709);
  const d = l - Math.floor((709 * m) / 24);
  const y = 30 * n + j - 30;
  return { d, m, y };
}

let fmt: Intl.DateTimeFormat | null | undefined;
export function toHijri(date: Date): Hijri {
  if (fmt === undefined) {
    try {
      fmt = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura-nu-latn', { day: 'numeric', month: 'numeric', year: 'numeric' });
      // Takvim desteklenmiyorsa miladî döner: yıl 1300–1600 değilse kullanma
      const y = Number(fmt.formatToParts(new Date(2026, 0, 1)).find((p) => p.type === 'year')?.value);
      if (!(y > 1300 && y < 1600)) fmt = null;
    } catch {
      fmt = null;
    }
  }
  if (fmt) {
    try {
      const parts = fmt.formatToParts(date);
      const g = (t: string) => Number(parts.find((p) => p.type === t)?.value);
      const h = { d: g('day'), m: g('month'), y: g('year') };
      if (h.d > 0 && h.m > 0 && h.y > 0) return h;
    } catch { /* yedeğe düş */ }
  }
  return hijriTabular(date);
}

export function hijriText(date: Date, lang: Lang) {
  const h = toHijri(date);
  const month = HIJRI_MONTHS[lang][h.m - 1];
  if (lang === 'ar') return `${h.d} ${month} ${h.y} هـ`;
  if (lang === 'en') return `${h.d} ${month} ${h.y} AH`;
  return `${h.d} ${month} ${h.y}`;
}

type Special = { m: number; d: number; name: { tr: string; en: string; ar: string }; night?: boolean };
/** Mübarek gün ve geceler (hicrî ay/gün). Kandiller önceki akşam başlar. */
export const SPECIAL_DAYS: Special[] = [
  { m: 1, d: 1, name: { tr: 'Hicrî Yılbaşı', en: 'Islamic New Year', ar: 'رأس السنة الهجرية' } },
  { m: 1, d: 10, name: { tr: 'Âşûrâ Günü', en: 'Day of Ashura', ar: 'يوم عاشوراء' } },
  { m: 3, d: 12, name: { tr: 'Mevlid Kandili', en: 'Mawlid', ar: 'المولد النبوي' }, night: true },
  { m: 7, d: 27, name: { tr: 'Mîrac Kandili', en: "Isra and Mi'raj", ar: 'الإسراء والمعراج' }, night: true },
  { m: 8, d: 15, name: { tr: 'Berat Kandili', en: "Mid-Sha'ban", ar: 'ليلة النصف من شعبان' }, night: true },
  { m: 9, d: 1, name: { tr: 'Ramazan Başlangıcı', en: 'Start of Ramadan', ar: 'بداية رمضان' } },
  { m: 9, d: 27, name: { tr: 'Kadir Gecesi', en: 'Laylat al-Qadr', ar: 'ليلة القدر' }, night: true },
  { m: 10, d: 1, name: { tr: 'Ramazan Bayramı', en: 'Eid al-Fitr', ar: 'عيد الفطر' } },
  { m: 12, d: 9, name: { tr: 'Arefe Günü', en: 'Day of Arafah', ar: 'يوم عرفة' } },
  { m: 12, d: 10, name: { tr: 'Kurban Bayramı', en: 'Eid al-Adha', ar: 'عيد الأضحى' } },
];

/** Bugün ve sonraki `days` gün içindeki ilk mübarek gün (bugünse inDays = 0). */
export function nextSpecial(from: Date, days = 400): { s: Special; date: Date; inDays: number } | null {
  const base = new Date(from.getFullYear(), from.getMonth(), from.getDate(), 12);
  for (let i = 0; i <= days; i++) {
    const d = new Date(base.getTime() + i * 864e5);
    const h = toHijri(d);
    const s = SPECIAL_DAYS.find((x) => x.m === h.m && x.d === h.d);
    if (s) return { s, date: d, inDays: i };
  }
  return null;
}
