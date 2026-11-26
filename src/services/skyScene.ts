// Resimli gökyüzü sahnesi: renkler güneşin yüksekliğine göre akıcı değişir (gece, şafak, gün doğumu, öğle,
// ikindi, gün batımı). Sabah ve akşam alacakaranlığının tonları farklıdır. Güneş ve ayın sahnedeki yeri
// gerçek yükseklik ve yönden hesaplanır. Saf hesap: testlerde de çalışır.
import { contrast, mix } from '../constants/theme';

export type SceneKind = 'makkah' | 'madinah' | 'mosque';

type ColorKey = 'skyTop' | 'skyMid' | 'skyLow' | 'glow' | 'sun' | 'far' | 'far2' | 'wall' | 'shade' | 'ground' | 'cloud' | 'cloudShade';
type Frame = { alt: number; c: Record<ColorKey, string>; stars: number; lights: number; dark: number };

export type ScenePalette = Record<ColorKey, string> & {
  /** 0–1: yıldızların görünürlüğü */
  stars: number;
  /** 0–1: pencere ve minare ışıkları */
  lights: number;
  /** 0–1: yapıların karanlığa gömülme oranı */
  dark: number;
  /** Gökyüzü üstündeki yazı rengi ve yarı saydam çip zemini */
  text: string;
  textSoft: string;
  glass: string;
  glassBorder: string;
};

// Ortak kareler: gece ve gündüz sabah-akşam aynı
const NIGHT_DEEP: Frame = {
  alt: -90, stars: 1, lights: 1, dark: 1,
  c: { skyTop: '#060A1C', skyMid: '#0D1533', skyLow: '#1A244E', glow: '#2A3566', sun: '#FFFFFF', far: '#151C3C', far2: '#10162F', wall: '#1A2140', shade: '#121833', ground: '#1A2142', cloud: '#1A2142', cloudShade: '#131A37' },
};
const NIGHT: Frame = {
  alt: -18, stars: 1, lights: 1, dark: 1,
  c: { skyTop: '#091027', skyMid: '#131D44', skyLow: '#26305E', glow: '#33407A', sun: '#FFFFFF', far: '#192145', far2: '#121936', wall: '#1D2547', shade: '#141B39', ground: '#20284B', cloud: '#232B50', cloudShade: '#1A2142' },
};
const DAY: Frame = {
  alt: 20, stars: 0, lights: 0, dark: 0,
  c: { skyTop: '#2C7BCF', skyMid: '#74B3E8', skyLow: '#F7E6CC', glow: '#FFF1C2', sun: '#FFF4CF', far: '#DDBFA3', far2: '#C9A285', wall: '#F7EDE0', shade: '#DCC6AC', ground: '#F3E9DB', cloud: '#FFFFFF', cloudShade: '#E5EBF4' },
};
const NOON: Frame = { ...DAY, alt: 90, c: { ...DAY.c, skyTop: '#2876CC', skyMid: '#6FB0E7', skyLow: '#F4E5CE' } };

const DAWN: Frame[] = [
  NIGHT_DEEP, NIGHT,
  { alt: -12, stars: 0.75, lights: 1, dark: 0.9, c: { skyTop: '#101A43', skyMid: '#283366', skyLow: '#5A4F80', glow: '#7A5C8C', sun: '#FFD7A8', far: '#2A2C55', far2: '#1F2245', wall: '#2A2D55', shade: '#1E2146', ground: '#2E3159', cloud: '#4A4775', cloudShade: '#34365E' } },
  { alt: -6, stars: 0.3, lights: 0.85, dark: 0.7, c: { skyTop: '#20346C', skyMid: '#56649E', skyLow: '#E9A283', glow: '#F5A77E', sun: '#FFC08A', far: '#5B5482', far2: '#433F69', wall: '#4A4570', shade: '#36335A', ground: '#554F78', cloud: '#E7A9A0', cloudShade: '#9C7E9A' } },
  { alt: -2, stars: 0.08, lights: 0.6, dark: 0.45, c: { skyTop: '#33558F', skyMid: '#8C93C2', skyLow: '#FDB77E', glow: '#FFB070', sun: '#FF9E4F', far: '#8E6E86', far2: '#6E5470', wall: '#8A6E80', shade: '#634E66', ground: '#A08594', cloud: '#FFD0B0', cloudShade: '#D99A8E' } },
  { alt: 2, stars: 0, lights: 0.25, dark: 0.12, c: { skyTop: '#3A68A8', skyMid: '#9DB3D8', skyLow: '#FFCF96', glow: '#FFC27A', sun: '#FFB45C', far: '#C99A86', far2: '#A27769', wall: '#F2CFB0', shade: '#C9967C', ground: '#F1D5BC', cloud: '#FFE6CC', cloudShade: '#F2B79A' } },
  { alt: 8, stars: 0, lights: 0, dark: 0, c: { skyTop: '#3474BE', skyMid: '#8FBDE6', skyLow: '#FFE0B6', glow: '#FFE0A0', sun: '#FFD27A', far: '#D9B19A', far2: '#BC8F78', wall: '#F6E2CC', shade: '#D7B596', ground: '#F3E2CF', cloud: '#FFFFFF', cloudShade: '#F3D5C2' } },
  DAY, NOON,
];

const DUSK: Frame[] = [
  NIGHT_DEEP, NIGHT,
  { alt: -12, stars: 0.75, lights: 1, dark: 0.9, c: { skyTop: '#0F1840', skyMid: '#2A2F66', skyLow: '#5E4878', glow: '#7E5482', sun: '#FFC9A8', far: '#2B2A54', far2: '#202144', wall: '#2B2C54', shade: '#1F2045', ground: '#2F3058', cloud: '#4C4472', cloudShade: '#35345C' } },
  { alt: -6, stars: 0.3, lights: 0.85, dark: 0.7, c: { skyTop: '#1E2E66', skyMid: '#555A98', skyLow: '#E58A8E', glow: '#F08C7A', sun: '#FF9F7A', far: '#5E4E7C', far2: '#453A66', wall: '#4D4270', shade: '#382F59', ground: '#584A77', cloud: '#E3949C', cloudShade: '#9A7090' } },
  { alt: -2, stars: 0.08, lights: 0.6, dark: 0.45, c: { skyTop: '#2F4A88', skyMid: '#8F7FB6', skyLow: '#FF9A6A', glow: '#FF8C55', sun: '#FF7A3C', far: '#8F6680', far2: '#6E4C6A', wall: '#8A6678', shade: '#624660', ground: '#A07C8C', cloud: '#FFB59A', cloudShade: '#D98479' } },
  { alt: 2, stars: 0, lights: 0.25, dark: 0.12, c: { skyTop: '#365FA0', skyMid: '#A79CC8', skyLow: '#FFB677', glow: '#FFA45E', sun: '#FF9A40', far: '#C88A78', far2: '#A0695D', wall: '#F2BE9C', shade: '#C58168', ground: '#F0C7AA', cloud: '#FFD8BC', cloudShade: '#F09C82' } },
  { alt: 8, stars: 0, lights: 0, dark: 0, c: { skyTop: '#3270B8', skyMid: '#97B8E0', skyLow: '#FFD39E', glow: '#FFD08A', sun: '#FFC560', far: '#D5A68C', far2: '#B8846C', wall: '#F5D7BA', shade: '#D3A585', ground: '#F2DAC2', cloud: '#FFF4EA', cloudShade: '#F2C9B2' } },
  DAY, NOON,
];

const WHITE = '#FFFFFF';
const INK = '#1D2735';
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Yazının (üstteki çiplerin) durduğu bölgenin gökyüzü rengi. */
export const textZone = (p: Pick<ScenePalette, 'skyTop' | 'skyMid'>) => mix(p.skyTop, p.skyMid, 0.2);

/** Güneşin yüksekliğine (derece) göre sahne renkleri. morning: güneş doğu yarıda (sabah tonları). */
export function scenePalette(sunAlt: number, morning: boolean): ScenePalette {
  const fr = morning ? DAWN : DUSK;
  const alt = Math.max(-90, Math.min(90, sunAlt));
  let i = 0;
  while (i < fr.length - 2 && alt > fr[i + 1].alt) i++;
  const a = fr[i], b = fr[i + 1];
  const t = Math.max(0, Math.min(1, (alt - a.alt) / (b.alt - a.alt || 1)));
  const c = Object.fromEntries((Object.keys(a.c) as ColorKey[]).map((k) => [k, mix(a.c[k], b.c[k], t)])) as Record<ColorKey, string>;
  const zone = textZone(c);
  const light = contrast(WHITE, zone) >= 3;
  return {
    ...c,
    stars: lerp(a.stars, b.stars, t),
    lights: lerp(a.lights, b.lights, t),
    dark: lerp(a.dark, b.dark, t),
    text: light ? WHITE : INK,
    textSoft: light ? 'rgba(255,255,255,0.86)' : 'rgba(29,39,53,0.78)',
    // Koyu, yarı saydam çip: arkasında güneş ya da açık bir bina olsa da beyaz yazı okunur
    glass: light ? 'rgba(14,18,34,0.28)' : 'rgba(255,255,255,0.5)',
    glassBorder: light ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.7)',
  };
}

/**
 * Gök cisminin sahnedeki yeri. x: 0 (sol, doğu) – 1 (sağ, batı); güneye bakan birinin gördüğü gibi.
 * h: 0 ufuk – 1 tepe (sin(yükseklik)). Yön kuzeyden saat yönünde derece.
 */
export function bodyPos(alt: number, az: number) {
  const r = Math.PI / 180;
  return { x: 0.5 - 0.44 * Math.cos(alt * r) * Math.sin(az * r), h: Math.sin(alt * r) };
}

/** Ufuktaki kızıllığın gücü (0–1): güneş ufka yakınken en güçlü. */
export const horizonGlow = (sunAlt: number) => Math.exp(-(((sunAlt + 1) / 8) ** 2));

const near = (lat: number, lng: number, lat2: number, lng2: number, km: number) => {
  const r = Math.PI / 180;
  const a = Math.sin(((lat2 - lat) * r) / 2) ** 2 + Math.cos(lat * r) * Math.cos(lat2 * r) * Math.sin(((lng2 - lng) * r) / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(a)) < km;
};

/** Sahne: Mekke'de Kâbe ve Saat Kulesi, Medine'de Yeşil Kubbe, başka yerde bir cami. */
export function sceneKind(lat: number, lng: number): SceneKind {
  if (near(lat, lng, 21.4225, 39.8262, 60)) return 'makkah';
  if (near(lat, lng, 24.4672, 39.6111, 60)) return 'madinah';
  return 'mosque';
}
