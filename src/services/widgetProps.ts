// Ana ekran küçük uygulamasının (Android) verisi: 30 günün vakitleri, yer adı, renkler, kısa yazılar.
// Saf işlev (React Native'e bağlı değil): vakit hesabı ve biçimlendirme dışarıdan verilir; testlerde de çalışır.
import { colorsFor, type Colors, type PaletteId, type ThemeMode } from '@/constants/theme';
import type { Lang } from '@/i18n/strings';
import type { PrayerWidgetColors, PrayerWidgetDay, PrayerWidgetMode, PrayerWidgetProps } from '@/widgets/PrayerWidget';
import type { PrayerLogWidgetProps } from '@/widgets/PrayerLogWidget';
import { dayKey, type PrayerLog } from './prayerLog';

export const WIDGET_DAYS = 30;
export const WIDGET_KEYS = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'] as const;
export type WidgetKey = (typeof WIDGET_KEYS)[number];

const L = {
  next: { tr: 'Sıradaki:', en: 'Next:', ar: 'التالية:' },
  tomorrow: { tr: 'yarın', en: 'tomorrow', ar: 'غدًا' },
  after: { tr: 'Sonra', en: 'Then', ar: 'ثم' },
  left: { tr: '{p} vaktine kalan', en: 'Time until {p}', ar: 'المتبقي على {p}' },
  remain: { tr: 'kaldı', en: 'left', ar: 'متبقٍ' },
  stale: { tr: 'Güncellemek için MATAF’ı açın', en: 'Open MATAF to refresh', ar: 'افتح MATAF للتحديث' },
  empty: { tr: 'Vakitler için MATAF’ı bir kez açın', en: 'Open MATAF once to load prayer times', ar: 'افتح MATAF مرة لتحميل المواقيت' },
  makkah: { tr: 'Mekke', en: 'Makkah', ar: 'مكة' },
  madinah: { tr: 'Medine', en: 'Madinah', ar: 'المدينة' },
};

/** usePrayerPlace'in etiketi: 'makkah' / 'madinah' ya da çözülmüş yer adı (boş olabilir). */
export function widgetPlace(label: string, lang: Lang) {
  if (label === 'makkah') return L.makkah[lang];
  if (label === 'madinah') return L.madinah[lang];
  return label;
}

/**
 * Kutu rengi (Vakitler ve Ayarlar → kutu satırı, 0.22.0): dark ve light seçili paletin koyu ve açık tonları,
 * theme uygulamanın açık/koyu temasını izler. Varsayılan koyu, %40 şeffaf (duvar kâğıdı görünür).
 */
export type WidgetStyle = 'dark' | 'light' | 'theme';
export const WIDGET_STYLES: WidgetStyle[] = ['dark', 'light', 'theme'];
/** Şeffaflık yüzdesi (zemin); yazılar hep tam opak */
export const WIDGET_CLEAR = [0, 20, 40, 60, 80] as const;
export const DEFAULT_WIDGET_CLEAR = 40;
export const widgetMode = (style: WidgetStyle | undefined, theme: ThemeMode): PrayerWidgetMode =>
  style === 'theme' ? theme : style === 'light' ? 'light' : 'dark';

/** '#RRGGBB' + saydamlık → '#RRGGBBAA' (Expo renk çözücüsü CSS sırası: alfa sonda) */
export function withAlpha(hex: string, opacity: number) {
  const a = Math.round(Math.min(1, Math.max(0, opacity)) * 255);
  return hex.slice(0, 7) + a.toString(16).padStart(2, '0').toUpperCase();
}

const pickColors = (c: Colors, clear = DEFAULT_WIDGET_CLEAR): PrayerWidgetColors => ({
  bg: withAlpha(c.bg, 1 - clear / 100), ink: c.ink, muted: c.muted, accent: c.accent, tint: c.accentTint, fill: c.accent, onFill: c.onAccent,
});

export type WidgetPropsInput = {
  /** Bugün (saat önemsiz) */
  start: Date;
  /** Verilen günün vakitleri (öğle 12:00 verilir) */
  timesFor: (day: Date) => Record<WidgetKey, Date>;
  /** "05:12" */
  fmt: (d: Date) => string;
  /** "25 Kasım Çar" */
  dayLabel: (d: Date) => string;
  /** "17 Cemâziyelâhir 1448" (verilmezse yazılmaz) */
  hijriLabel?: (d: Date) => string;
  place: string;
  /** 6 kısa vakit adı (İmsak … Yatsı) */
  names: string[];
  lang: Lang;
  palette: PaletteId;
  mode: ThemeMode;
  /** Kutu rengi (verilmezse koyu) */
  style?: WidgetStyle;
  /** Zeminin şeffaflığı, % (verilmezse 40) */
  clear?: number;
  days?: number;
};

export function buildWidgetProps(o: WidgetPropsInput): PrayerWidgetProps {
  const days: PrayerWidgetDay[] = [];
  const n = o.days ?? WIDGET_DAYS;
  for (let i = 0; i < n; i++) {
    const d0 = new Date(o.start.getFullYear(), o.start.getMonth(), o.start.getDate() + i);
    const tt = o.timesFor(new Date(d0.getFullYear(), d0.getMonth(), d0.getDate(), 12));
    days.push({
      s: String(d0.getTime()),
      d: o.dayLabel(d0),
      ...(o.hijriLabel ? { h: o.hijriLabel(d0) } : null),
      t: WIDGET_KEYS.map((k) => o.fmt(tt[k])),
      a: WIDGET_KEYS.map((k) => String(tt[k].getTime())),
    });
  }
  return {
    v: 1,
    place: o.place,
    names: o.names.slice(0, 6),
    days,
    next: L.next[o.lang],
    tomorrow: L.tomorrow[o.lang],
    after: L.after[o.lang],
    left: L.left[o.lang],
    remain: L.remain[o.lang],
    stale: L.stale[o.lang],
    empty: L.empty[o.lang],
    mode: widgetMode(o.style, o.mode),
    light: pickColors(colorsFor(false, o.palette), o.clear),
    dark: pickColors(colorsFor(true, o.palette), o.clear),
  };
}

/** Küçük uygulamaların yenilenmesi gereken anlar: önümüzdeki vakitler ve gün başları (en çok n tane). */
export function widgetTicks(p: PrayerWidgetProps, now: number, n = 24) {
  const out: number[] = [];
  for (const d of p.days ?? []) {
    out.push(Number(d.s));
    for (const a of d.a) out.push(Number(a));
  }
  return out.filter((t) => t > now).sort((a, b) => a - b).slice(0, n);
}

/** Küçük uygulamadaki çizimin mantığı (testler için aynı kural): şimdiden sonraki ilk vakit. */
export function widgetNext(p: PrayerWidgetProps, now: number) {
  const days = p.days ?? [];
  for (let i = 0; i < days.length; i++) {
    for (let j = 0; j < days[i].a.length; j++) if (Number(days[i].a[j]) > now) return { day: i, prayer: j, tomorrow: Number(days[i].s) > now };
  }
  return null;
}

// ── Namaz takibi küçük uygulaması ──
/** Dil ve tema: ana sayfa açılınca kurulur; işaret değişince kayıtla birlikte kullanılır */
export type LogWidgetContext = {
  title: string;
  names: string[];
  allDone: string;
  empty: string;
  hatim?: string;
  palette: PaletteId;
  mode: ThemeMode;
  style?: WidgetStyle;
  clear?: number;
};

/** Son üç günün işaretleri (bugün, dün, önceki gün); küçük uygulama bugünü kendisi seçer */
export function buildLogWidgetProps(o: LogWidgetContext & { log: PrayerLog; today: Date }): PrayerLogWidgetProps {
  const days = [];
  for (let i = 0; i < 3; i++) {
    const k = dayKey(new Date(o.today.getFullYear(), o.today.getMonth(), o.today.getDate() - i, 12));
    days.push({ k, m: o.log[k] ?? 0 });
  }
  return {
    v: 1,
    title: o.title,
    names: o.names,
    days,
    allDone: o.allDone,
    hatim: o.hatim,
    empty: o.empty,
    mode: widgetMode(o.style, o.mode),
    light: pickColors(colorsFor(false, o.palette), o.clear),
    dark: pickColors(colorsFor(true, o.palette), o.clear),
  };
}
