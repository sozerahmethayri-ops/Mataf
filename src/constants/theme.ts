// MATAF görsel dili: açık / koyu tema ve renk paletleri.
// `C` tek bir değiştirilebilir nesnedir: applyTheme() değerlerini günceller, ThemeProvider uygulamayı yeniden çizer.
// Kontrastlar scripts/check-logic.ts'te WCAG AA'ya göre test edilir.

export type ThemeMode = 'light' | 'dark' | 'system';
export type PaletteId = 'kabe' | 'zumrut' | 'gece' | 'altin' | 'gul';

// Sıcak tonlar: krem zemin, kum rengi yüzeyler, kahveye çalan koyu yazı
const LIGHT = {
  bg: '#FBF7F1',
  surface: '#F3EBDF',
  border: '#E9DFD1',
  borderStrong: '#DCCFBE',
  ink: '#2A2018',
  ink2: '#4A3D33',
  muted: '#6F5D4C',
  onInk: '#FFFFFF', // koyu (ink) zemin üstündeki yazı
  overlay: 'rgba(251,247,241,0.94)', // harita etiketleri
  closed: '#B42318',
  closedTint: '#FCE9E6',
  limited: '#92400E',
  limitedFill: '#F5A524',
  limitedTint: '#FBEFD0',
  open: '#0F766E',
  openTint: '#E4F2EE',
  user: '#2563EB',
  userTint: '#EAF0FC',
  green: '#26754A',
  greenDark: '#1E5A38',
  greenTint: '#E9F3EA',
  gold: '#C9A227',
  mapGround: '#EFECE6',
};
type Base = typeof LIGHT;

// Koyu tema da sıcak: kahveye çalan gece tonları
const DARK: Base = {
  bg: '#17120E',
  surface: '#231C16',
  border: '#30271F',
  borderStrong: '#40352B',
  ink: '#F6EFE7',
  ink2: '#E2D7CA',
  muted: '#B3A393',
  onInk: '#17120E',
  overlay: 'rgba(35,28,22,0.94)',
  closed: '#FF8A80',
  closedTint: '#3A1715',
  limited: '#F7C55A',
  limitedFill: '#F5A524',
  limitedTint: '#33270C',
  open: '#4FD1BB',
  openTint: '#0F2C28',
  user: '#6EA0FF',
  userTint: '#16233F',
  green: '#2A8550',
  greenDark: '#1E5A38',
  greenTint: '#14261A',
  gold: '#D9B440',
  mapGround: '#1B1D21',
};

type Accent = { route: string; accent: string; onAccent: string; accentTint: string; accentSoft: string };
export const PALETTES: Record<PaletteId, { name: { tr: string; en: string; ar: string }; light: Accent; dark: Accent }> = {
  kabe: {
    name: { tr: 'Kiremit (varsayılan)', en: 'Terracotta (default)', ar: 'طوبي (افتراضي)' },
    light: { route: '#F26A1B', accent: '#B4420F', onAccent: '#FFFFFF', accentTint: '#FBE4D3', accentSoft: '#FDF0E5' },
    dark: { route: '#F68A47', accent: '#F7934F', onAccent: '#1F0F05', accentTint: '#3A2214', accentSoft: '#2B1B11' },
  },
  zumrut: {
    name: { tr: 'Zümrüt', en: 'Emerald', ar: 'زمردي' },
    light: { route: '#10B981', accent: '#047857', onAccent: '#FFFFFF', accentTint: '#E3F6EE', accentSoft: '#F1FBF6' },
    dark: { route: '#34D399', accent: '#3DD9A0', onAccent: '#052E1F', accentTint: '#0E2E22', accentSoft: '#0B231A' },
  },
  gece: {
    name: { tr: 'Gece mavisi', en: 'Midnight', ar: 'أزرق ليلي' },
    light: { route: '#6366F1', accent: '#3730A3', onAccent: '#FFFFFF', accentTint: '#ECEBFD', accentSoft: '#F5F5FE' },
    dark: { route: '#818CF8', accent: '#A5ABFF', onAccent: '#14123A', accentTint: '#1E1D45', accentSoft: '#171634' },
  },
  altin: {
    name: { tr: 'Altın', en: 'Gold', ar: 'ذهبي' },
    light: { route: '#D49A12', accent: '#855800', onAccent: '#FFFFFF', accentTint: '#FBF1D9', accentSoft: '#FDF8EC' },
    dark: { route: '#E8B931', accent: '#EBC048', onAccent: '#2A1E00', accentTint: '#33290E', accentSoft: '#26200C' },
  },
  gul: {
    name: { tr: 'Gül', en: 'Rose', ar: 'وردي' },
    light: { route: '#E11D74', accent: '#BE185D', onAccent: '#FFFFFF', accentTint: '#FCE7F1', accentSoft: '#FDF2F7' },
    dark: { route: '#F472B6', accent: '#F58BC3', onAccent: '#3A0820', accentTint: '#3A1527', accentSoft: '#2B111E' },
  },
};

export type Colors = Base & Accent;
/** Etkin renkler. Bileşenler çizim sırasında okur; tema değişince ThemeProvider yeniden çizdirir. */
export const C: Colors = { ...LIGHT, ...PALETTES.kabe.light };

export const R = { sm: 10, md: 14, lg: 18, xl: 24, pill: 999 } as const;
export const S = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24 } as const;

export const shadow = {
  shadowColor: '#4A3424',
  shadowOpacity: 0.12,
  shadowRadius: 10,
  shadowOffset: { width: 0, height: 3 },
  elevation: 4,
};

// ── Yazı ölçeği (Ayarlar → Görünüm): fs(n) temel boyutu ölçekler; değişince ekranlar yeniden kurulur ──
let textScale = 1;
let arabicScale = 1;
/** Yazı boyutu: temel piksel değerini kullanıcının seçtiği ölçekle çarpar. */
export const fs = (n: number) => Math.round(n * textScale * 2) / 2;
/** Arapça (Kur'an, dua) yazı boyutu: ayrı ölçek. */
export const fsAr = (n: number) => Math.round(n * arabicScale * 2) / 2;
/** Seçili yazı ölçeği (1 = normal, 1.3 = çok büyük); düzeni büyük yazıya göre değiştirmek için */
export const getTextScale = () => textScale;
export function applyTextScale(text: number, arabic: number) {
  textScale = text;
  arabicScale = arabic;
  for (const fn of listeners) fn();
}

let darkNow = false;
export const isDark = () => darkNow;
const listeners = new Set<() => void>();
/** Modül düzeyinde renkten türetilen değerler (ör. stil tabloları) tema değişince yenilensin. */
export function onThemeChange(fn: () => void) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function colorsFor(dark: boolean, palette: PaletteId): Colors {
  return { ...(dark ? DARK : LIGHT), ...PALETTES[palette][dark ? 'dark' : 'light'] };
}

export function applyTheme(dark: boolean, palette: PaletteId) {
  Object.assign(C, colorsFor(dark, palette));
  darkNow = dark;
  shadow.shadowColor = dark ? '#000000' : '#4A3424';
  shadow.shadowOpacity = dark ? 0.45 : 0.12;
  for (const fn of listeners) fn();
}

// ── 3D sahne: gece tonları ──
// Sahne renkleri açık temaya göre tanımlıdır; koyu temada parlaklık sıkıştırılır (beyaz → orta gri,
// siyah Kâbe koyu kalır), renk tonu korunur.
const cache = new Map<string, string>();
export function nightColor(c: string | undefined): string | undefined {
  if (!c || c === 'none' || !darkNow) return c;
  const hit = cache.get(c);
  if (hit) return hit;
  let r: number, g: number, b: number, a = 1;
  const m = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(c);
  const rg = /^rgba?\(([^)]+)\)$/i.exec(c);
  if (m) {
    const h = m[1].length === 3 ? m[1].split('').map((x) => x + x).join('') : m[1];
    r = parseInt(h.slice(0, 2), 16); g = parseInt(h.slice(2, 4), 16); b = parseInt(h.slice(4, 6), 16);
  } else if (rg) {
    const p = rg[1].split(',').map((x) => parseFloat(x));
    [r, g, b] = p; a = p[3] ?? 1;
  } else return c;
  // RGB → HSL
  const rn = r / 255, gn = g / 255, bn = b / 255;
  const max = Math.max(rn, gn, bn), min = Math.min(rn, gn, bn);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    h = max === rn ? (gn - bn) / d + (gn < bn ? 6 : 0) : max === gn ? (bn - rn) / d + 2 : (rn - gn) / d + 4;
    h /= 6;
  }
  // Gece: parlaklık sıkıştırılır ama sahne solmasın (beyaz → açık gri-mavi, renkler canlı kalır)
  const l2 = 0.13 + l * 0.52;
  // Açık bej/mermer tonlar gece zeytin-altın gibi çamurlaşmasın: açık renklerde doygunluğu biraz düşür
  const s2 = Math.min(1, s * Math.max(0.45, 1 - 1.4 * Math.max(0, l - 0.6)) * 1.1);
  // HSL → RGB
  const q = l2 < 0.5 ? l2 * (1 + s2) : l2 + s2 - l2 * s2;
  const p = 2 * l2 - q;
  const f = (t: number) => {
    t = (t + 1) % 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  const to = (x: number) => Math.round(x * 255);
  const out = s2 === 0 ? [l2, l2, l2] : [f(h + 1 / 3), f(h), f(h - 1 / 3)];
  const res = a < 1 ? `rgba(${to(out[0])},${to(out[1])},${to(out[2])},${a})` : `#${out.map((x) => to(x).toString(16).padStart(2, '0')).join('')}`;
  cache.set(c, res);
  return res;
}
/** Tema değişince sahne renk önbelleğini temizle. */
onThemeChange(() => cache.clear());

/** İki #rrggbb rengi karıştırır (t=0 → a, t=1 → b). */
export function mix(a: string, b: string, t: number) {
  const p = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const [x, y] = [p(a), p(b)];
  return `#${x.map((v, i) => Math.round(v + (y[i] - v) * t).toString(16).padStart(2, '0')).join('')}`;
}
/** Kategori rozeti: açık temada verilen ton, koyuda aynı rengin açık ön planı + koyu zemini. */
export const tone = (fg: string, bg: string) => (darkNow ? { fg: mix(fg, '#FFFFFF', 0.45), bg: mix(fg, C.bg, 0.8) } : { fg, bg });

// ── WCAG kontrast (testlerde kullanılır) ──
export function contrast(a: string, b: string) {
  const lum = (hex: string) => {
    const h = hex.replace('#', '');
    const [r, g, bl] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
    return 0.2126 * r + 0.7152 * g + 0.0722 * bl;
  };
  const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m);
  return (x + 0.05) / (y + 0.05);
}
