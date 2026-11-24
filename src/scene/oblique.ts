// Gerçek ölçekli eğik 3D izdüşüm. Birim: metre. Tek kamera: yatay ölçek k (px/m),
// zemin derinliği k·sinα, yükseklik k·cosα. Plan, ekranda -35° döndürülür.
import type { Pt } from '@/data/sites';

const TH = (-35 * Math.PI) / 180;
const CT = Math.cos(TH);
const STH = Math.sin(TH);
export const SA = 0.58;
export const CA = Math.sqrt(1 - SA * SA);

export type Prim =
  | { t: 'poly'; pts: string; fill: string; stroke?: string; sw?: number; op?: number }
  | { t: 'path'; d: string; fill?: string; stroke?: string; sw?: number; op?: number; rule?: 'evenodd' }
  | { t: 'ell'; cx: number; cy: number; rx: number; ry: number; fill: string; stroke?: string; sw?: number }
  | { t: 'circ'; cx: number; cy: number; r: number; fill: string; stroke?: string; sw?: number }
  | { t: 'rect'; x: number; y: number; w: number; h: number; fill: string; stroke?: string; sw?: number };

export class Cam {
  constructor(public k: number, public ox: number, public oy: number) {}
  P(x: number, y: number, h = 0): [number, number] {
    const X = x * CT - y * STH;
    const Y = x * STH + y * CT;
    return [this.ox + this.k * X, this.oy + this.k * SA * Y - this.k * CA * h];
  }
  static depth(x: number, y: number) {
    return x * STH + y * CT;
  }
  /** Ekrandaki (sx, sy) noktasına `p` noktasını oturtan kamera. */
  static centeredOn(k: number, p: Pt, sx: number, sy: number) {
    const c = new Cam(k, 0, 0);
    const [x, y] = c.P(p[0], p[1]);
    return new Cam(k, sx - x, sy - y);
  }
}

const f = (v: number) => v.toFixed(1);
export const ptsStr = (ps: [number, number][]) => ps.map(([a, b]) => `${f(a)},${f(b)}`).join(' ');

function area(pl: Pt[]) {
  let s = 0;
  for (let i = 0; i < pl.length; i++) {
    const [x1, y1] = pl[i];
    const [x2, y2] = pl[(i + 1) % pl.length];
    s += x1 * y2 - x2 * y1;
  }
  return s / 2;
}

export const rect = (x0: number, y0: number, x1: number, y1: number): Pt[] => [
  [x0, y0], [x1, y0], [x1, y1], [x0, y1],
];

export function rrect(x0: number, y0: number, x1: number, y1: number, r: number, n = 6): Pt[] {
  const out: Pt[] = [];
  const corners: [number, number, number][] = [
    [x1 - r, y0 + r, -90], [x1 - r, y1 - r, 0], [x0 + r, y1 - r, 90], [x0 + r, y0 + r, 180],
  ];
  for (const [cx, cy, a0] of corners)
    for (let i = 0; i <= n; i++) {
      const a = ((a0 + (90 * i) / n) * Math.PI) / 180;
      out.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]);
    }
  return out;
}

export function ellipsePl(cx: number, cy: number, rx: number, ry: number, n = 40): Pt[] {
  return Array.from({ length: n }, (_, i) => [
    cx + rx * Math.cos((2 * Math.PI * i) / n),
    cy + ry * Math.sin((2 * Math.PI * i) / n),
  ]);
}

export function rot(pl: Pt[], deg: number): Pt[] {
  const a = (deg * Math.PI) / 180;
  const c = Math.cos(a);
  const s = Math.sin(a);
  return pl.map(([x, y]) => [x * c - y * s, x * s + y * c]);
}

export function flat(cam: Cam, pl: Pt[], fill: string, h = 0, extra: Partial<Prim> = {}): Prim {
  return { t: 'poly', pts: ptsStr(pl.map(([x, y]) => cam.P(x, y, h))), fill, ...(extra as object) } as Prim;
}

export function line(cam: Cam, a: Pt, b: Pt, stroke: string, sw: number, h = 0): Prim {
  const p1 = cam.P(a[0], a[1], h);
  const p2 = cam.P(b[0], b[1], h);
  return { t: 'path', d: `M${f(p1[0])} ${f(p1[1])} L${f(p2[0])} ${f(p2[1])}`, stroke, sw, fill: 'none' };
}

export function pathD(cam: Cam, pts: Pt[], h = 0) {
  return pts.map(([x, y], i) => {
    const [a, b] = cam.P(x, y, h);
    return `${i ? 'L' : 'M'}${f(a)} ${f(b)}`;
  }).join(' ');
}

/** Çokgeni h0–h1 arasında yükseltir: görünen yan yüzler + çatı (delikli olabilir). */
export function extrude(
  cam: Cam, outer: Pt[], h0: number, h1: number,
  top: string, light: string, dark: string,
  holes: Pt[][] = [], stroke = '#DCD4C6',
): Prim[] {
  const faces: { d: number; q: [number, number][]; c: string }[] = [];
  const ring = (pl: Pt[], inward: boolean) => {
    const a = area(pl);
    for (let i = 0; i < pl.length; i++) {
      const [x1, y1] = pl[i];
      const [x2, y2] = pl[(i + 1) % pl.length];
      const ex = x2 - x1;
      const ey = y2 - y1;
      let nx = a > 0 ? ey : -ey;
      let ny = a > 0 ? -ex : ex;
      if (inward) { nx = -nx; ny = -ny; }
      if (nx * STH + ny * CT > 1e-6) {
        const sx = nx * CT - ny * STH;
        faces.push({
          d: Cam.depth((x1 + x2) / 2, (y1 + y2) / 2),
          q: [cam.P(x1, y1, h0), cam.P(x2, y2, h0), cam.P(x2, y2, h1), cam.P(x1, y1, h1)],
          c: sx < 0 ? light : dark,
        });
      }
    }
  };
  ring(outer, false);
  holes.forEach((h) => ring(h, true));
  faces.sort((p, q) => p.d - q.d);
  const out: Prim[] = faces.map((fc) => ({ t: 'poly', pts: ptsStr(fc.q), fill: fc.c }));
  const sub = (pl: Pt[]) => pl.map(([x, y], i) => {
    const [a, b] = cam.P(x, y, h1);
    return `${i ? 'L' : 'M'}${f(a)} ${f(b)}`;
  }).join(' ') + ' Z';
  out.push({ t: 'path', d: [outer, ...holes].map(sub).join(' '), fill: top, stroke, sw: 0.8, rule: 'evenodd' });
  return out;
}

export function minaret(cam: Cam, x: number, y: number, h: number): Prim[] {
  const [bx, by] = cam.P(x, y, 0);
  const [, ty] = cam.P(x, y, h);
  const w = Math.max(2.2, 4.5 * cam.k);
  return [
    { t: 'rect', x: bx - w / 2, y: ty, w, h: by - ty, fill: '#F3EFE8', stroke: '#CFC6B6', sw: 0.6 },
    { t: 'rect', x: bx - w / 2 - 1.2, y: ty + (by - ty) * 0.35, w: w + 2.4, h: 1.8, fill: '#D9D1C3' },
    { t: 'path', d: `M${f(bx - w / 2)} ${f(ty)} L${f(bx)} ${f(ty - 7)} L${f(bx + w / 2)} ${f(ty)} Z`, fill: '#C9A227' },
  ];
}

export function polylineLength(pts: Pt[]) {
  let s = 0;
  for (let i = 1; i < pts.length; i++) s += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
  return s;
}
