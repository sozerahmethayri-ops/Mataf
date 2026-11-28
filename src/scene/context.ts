// 3B sahnenin zemin katmanı: mescidin 1,3 km çevresindeki bina tabanları ve yollar (OSM, src/data/osm/context.ts).
// Düz çizilir (yükseltilmez): mescidi ve çekirdek yapıları örtmesin, uzaklaştırınca şehir dokusu görünsün.
// Aynı sınıftaki bütün öğeler tek SVG yoluna toplanır (binlerce şekil yerine birkaç yol).
import { C } from '@/constants/theme';
import { CONTEXT } from '@/data/osm/context';
import type { City, Pt } from '@/data/sites';
import type { Cam, Prim } from './oblique';

type Layer = { b: Pt[][][]; r: Pt[][][] };
const cache: Partial<Record<City, Layer>> = {};
const ROAD_W = [14, 10, 8, 6, 4];

function parse(s: string): Pt[][] {
  if (!s) return [];
  return s.split(';').map((it) => it.split(' ').map((q) => {
    const i = q.indexOf(',');
    return [Number(q.slice(0, i)), Number(q.slice(i + 1))] as Pt;
  }));
}

export function contextLayer(city: City): Layer {
  let l = cache[city];
  if (!l) {
    l = { b: CONTEXT[city].b.map(parse), r: CONTEXT[city].r.map(parse) };
    cache[city] = l;
  }
  return l;
}

/** Zeminin koyu olup olmadığı (renkler temaya göre) */
function isDark(hex: string) {
  const n = parseInt(hex.slice(1, 7), 16);
  return ((n >> 16) & 255) * 0.299 + ((n >> 8) & 255) * 0.587 + (n & 255) * 0.114 < 128;
}

export function contextPrims(cam: Cam, city: City): Prim[] {
  const l = contextLayer(city);
  const dark = isDark(C.mapGround);
  const road = dark ? '#33363D' : '#FBF9F5';
  const roadEdge = dark ? '#25282D' : '#DDD5C8';
  const bld = dark ? ['#2A2D33', '#31343A', '#383B42'] : ['#DCD4C7', '#D1C8B9', '#C6BCAB'];
  const bldEdge = dark ? '#3A3D44' : '#C9BFAF';
  const f = (v: number) => v.toFixed(1);
  const line = (pts: Pt[]) => pts.map((p, i) => {
    const [x, y] = cam.P(p[0], p[1]);
    return `${i ? 'L' : 'M'}${f(x)} ${f(y)}`;
  }).join('');
  const out: Prim[] = [];
  // Yollar: önce kenar (biraz geniş, koyu), sonra dolgu; geniş sınıf üstte kalsın diye dardan genişe
  for (let c = l.r.length - 1; c >= 0; c--) {
    if (!l.r[c].length) continue;
    const d = l.r[c].map(line).join('');
    const w = Math.max(0.8, ROAD_W[c] * cam.k);
    out.push({ t: 'path', d, stroke: roadEdge, sw: w + Math.max(0.6, 1.2 * cam.k) });
    out.push({ t: 'path', d, stroke: road, sw: w });
  }
  // Bina tabanları: yükseklik sınıfına göre koyulaşan ton, ince kenar
  l.b.forEach((items, c) => {
    if (!items.length) return;
    out.push({ t: 'path', d: items.map((r) => `${line(r)}Z`).join(''), fill: bld[c], stroke: bldEdge, sw: Math.max(0.4, 0.6 * cam.k) });
  });
  return out;
}
