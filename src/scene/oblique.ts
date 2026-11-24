// Gerçek ölçekli eğik 3D izdüşüm. Birim: metre. Tek kamera: yatay ölçek k (px/m),
// zemin derinliği k·sinα, yükseklik k·cosα. Plan, ekranda -35° döndürülür.
import type { Pt } from '@/data/sites';

export const SA = 0.58;
export const CA = Math.sqrt(1 - SA * SA);

/** Doğrusal renk geçişi (ekran koordinatında): dolgu yerine kullanılır. Durak: [konum 0–1, renk, saydamlık?]. */
export type Grad = { x1: number; y1: number; x2: number; y2: number; stops: [number, string, number?][] };
/** `keep`: koyu temada gece tonuna çevirme (Kâbe örtüsü, altın, gümüş gerçek rengiyle kalsın). */
/** `nfill`: koyu temada (gece) kullanılacak dolgu — ör. ışığı yanan pencereler. */
type PrimExtra = { grad?: Grad; keep?: boolean; op?: number; cap?: 'round' | 'butt'; nfill?: string };
export type Prim = PrimExtra & (
  | { t: 'poly'; pts: string; fill: string; stroke?: string; sw?: number }
  | { t: 'path'; d: string; fill?: string; stroke?: string; sw?: number; rule?: 'evenodd' }
  | { t: 'ell'; cx: number; cy: number; rx: number; ry: number; fill: string; stroke?: string; sw?: number }
  | { t: 'circ'; cx: number; cy: number; r: number; fill: string; stroke?: string; sw?: number }
  | { t: 'rect'; x: number; y: number; w: number; h: number; fill: string; stroke?: string; sw?: number });

export class Cam {
  /** Planın ekrandaki dönüş açısının kosinüs/sinüsü (varsayılan -35°). */
  readonly ct: number;
  readonly st: number;
  /** `rotDeg`: izleyicinin bulunduğu yön; (sin, cos) = izleyiciye doğru yerel (doğu, güney) birim vektörü. */
  constructor(public k: number, public ox: number, public oy: number, public rotDeg = -35) {
    const th = (rotDeg * Math.PI) / 180;
    this.ct = Math.cos(th);
    this.st = Math.sin(th);
  }
  P(x: number, y: number, h = 0): [number, number] {
    const X = x * this.ct - y * this.st;
    const Y = x * this.st + y * this.ct;
    return [this.ox + this.k * X, this.oy + this.k * SA * Y - this.k * CA * h];
  }
  /** İzleyiciye yakınlık (büyük = önde). */
  depthOf(x: number, y: number) {
    return x * this.st + y * this.ct;
  }
  /** Ekrandaki (sx, sy) noktasına `p` noktasını oturtan kamera. */
  static centeredOn(k: number, p: Pt, sx: number, sy: number, rotDeg = -35) {
    const c = new Cam(k, 0, 0, rotDeg);
    const [x, y] = c.P(p[0], p[1]);
    return new Cam(k, sx - x, sy - y, rotDeg);
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

/** İki #rrggbb rengi karıştırır (t=0 → a, t=1 → b). */
export function mixHex(a: string, b: string, t: number) {
  const p = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const [x, y] = [p(a), p(b)];
  const u = Math.min(1, Math.max(0, t));
  return `#${x.map((v, i) => Math.round(v + (y[i] - v) * u).toString(16).padStart(2, '0')).join('')}`;
}

/** Yüzün ekrana göre aydınlığı (0–1): ışık sol önden; tüm sahnelerde ortak. */
export function faceLight(cam: Cam, nx: number, ny: number) {
  const L = Math.hypot(nx, ny) || 1;
  const sx = (nx * cam.ct - ny * cam.st) / L;
  const sd = (nx * cam.st + ny * cam.ct) / L;
  return Math.max(0, Math.min(1, 0.5 + 0.5 * (-0.62 * sx + 0.78 * sd)));
}

/** Görünen bir dış yüz: köşeler, dış normal ve aydınlık. */
export type Wall = { a: Pt; b: Pt; n: Pt; len: number; light: number; d: number };
/** Çokgenin (ve deliklerinin) izleyiciye bakan duvarları. */
export function visibleWalls(cam: Cam, outer: Pt[], holes: Pt[][] = []): Wall[] {
  const out: Wall[] = [];
  const ring = (pl: Pt[], inward: boolean) => {
    const a = area(pl);
    for (let i = 0; i < pl.length; i++) {
      const [x1, y1] = pl[i];
      const [x2, y2] = pl[(i + 1) % pl.length];
      const ex = x2 - x1;
      const ey = y2 - y1;
      const len = Math.hypot(ex, ey);
      if (len < 1e-6) continue;
      let nx = a > 0 ? ey : -ey;
      let ny = a > 0 ? -ex : ex;
      if (inward) { nx = -nx; ny = -ny; }
      if (nx * cam.st + ny * cam.ct > 1e-6) {
        out.push({ a: pl[i], b: pl[(i + 1) % pl.length], n: [nx / len, ny / len], len, light: faceLight(cam, nx, ny), d: cam.depthOf((x1 + x2) / 2, (y1 + y2) / 2) });
      }
    }
  };
  ring(outer, false);
  holes.forEach((h) => ring(h, true));
  return out.sort((p, q) => p.d - q.d);
}

/** Çokgeni h0–h1 arasında yükseltir: görünen yan yüzler + çatı (delikli olabilir).
 *  Yüzler ışığa göre `dark`–`light` arasında yumuşak gölgelenir; `grad` ile yukarıdan aşağı hafif geçiş. */
export function extrude(
  cam: Cam, outer: Pt[], h0: number, h1: number,
  top: string, light: string, dark: string,
  holes: Pt[][] = [], stroke = '#DCD4C6', opts: { grad?: boolean } = {},
): Prim[] {
  const out: Prim[] = visibleWalls(cam, outer, holes).map((w) => {
    const c = mixHex(dark, light, w.light < 0.5 ? w.light * 0.9 : 0.45 + (w.light - 0.5) * 1.1);
    const q = [cam.P(w.a[0], w.a[1], h0), cam.P(w.b[0], w.b[1], h0), cam.P(w.b[0], w.b[1], h1), cam.P(w.a[0], w.a[1], h1)];
    const prim: Prim = { t: 'poly', pts: ptsStr(q), fill: c };
    if (opts.grad) {
      const mx = (w.a[0] + w.b[0]) / 2, my = (w.a[1] + w.b[1]) / 2;
      const [x1, y1] = cam.P(mx, my, h1);
      const [x2, y2] = cam.P(mx, my, h0);
      prim.grad = { x1, y1, x2, y2, stops: [[0, mixHex(c, '#FFFFFF', 0.25)], [1, mixHex(c, '#6E6350', 0.12)]] };
    }
    return prim;
  });
  const sub = (pl: Pt[]) => pl.map(([x, y], i) => {
    const [a, b] = cam.P(x, y, h1);
    return `${i ? 'L' : 'M'}${f(a)} ${f(b)}`;
  }).join(' ') + ' Z';
  out.push({ t: 'path', d: [outer, ...holes].map(sub).join(' '), fill: top, stroke, sw: 0.8, rule: 'evenodd' });
  return out;
}

/**
 * Minare (ekrana dik çizilir; minareler her yönden aynı görünür): kare kaide, sekizgen gövde,
 * üç şerefe, kameriye (açık köşk), sivri külah ve altın hilâl. Işık soldan: gövdede yatay geçiş.
 */
export function minaret(cam: Cam, x: number, y: number, h: number): Prim[] {
  const [bx, by] = cam.P(x, y, 0);
  const [, ty] = cam.P(x, y, h);
  const H = by - ty;
  const w = Math.max(2.4, 5.2 * cam.k);
  const Y = (fr: number) => by - H * fr;
  const out: Prim[] = [];
  // Gövde: kademeli silüet (kaide → gövde → üst gövde → kameriye)
  const secs: [number, number, number][] = [[0, 0.3, 1], [0.3, 0.62, 0.8], [0.62, 0.8, 0.68], [0.8, 0.885, 0.62]];
  const left = secs.map(([a, b, s]) => [[bx - (w * s) / 2, Y(a)], [bx - (w * s) / 2, Y(b)]] as [number, number][]).flat();
  const right = [...secs].reverse().map(([a, b, s]) => [[bx + (w * s) / 2, Y(b)], [bx + (w * s) / 2, Y(a)]] as [number, number][]).flat();
  const body = [...left, ...right];
  out.push({
    t: 'path', d: body.map(([px, py], i) => `${i ? 'L' : 'M'}${f(px)} ${f(py)}`).join(' ') + ' Z', fill: '#EFEBE3',
    grad: { x1: bx - w / 2, y1: 0, x2: bx + w / 2, y2: 0, stops: [[0, '#FBFAF6'], [0.45, '#EEE9E0'], [1, '#C9C0B0']] },
    stroke: '#C2B9A9', sw: 0.5,
  });
  // Şerefeler
  const bal = (fr: number, s: number) => {
    const bw = w * s * 1.32;
    const bh = Math.max(1, H * 0.013);
    out.push({ t: 'rect', x: bx - bw / 2, y: Y(fr) - bh, w: bw, h: bh, fill: '#E4DED3', stroke: '#B5AC9C', sw: 0.4 });
  };
  bal(0.3, 0.8);
  bal(0.62, 0.68);
  bal(0.8, 0.62);
  // Kameriye açıklıkları ve gövde pencereleri
  if (w >= 4) {
    const ow = Math.max(0.7, w * 0.12);
    const o0 = Y(0.875), o1 = Y(0.815);
    out.push({ t: 'path', d: [-0.18, 0.12].map((dx) => `M${f(bx + dx * w)} ${f(o0)} L${f(bx + dx * w + ow)} ${f(o0)} L${f(bx + dx * w + ow)} ${f(o1)} L${f(bx + dx * w)} ${f(o1)} Z`).join(' '), fill: '#8A8072', nfill: '#F3D27A' });
  }
  if (w >= 6) {
    const ws: string[] = [];
    for (const fr of [0.16, 0.46, 0.71]) {
      const sw = w * 0.1;
      ws.push(`M${f(bx - sw / 2)} ${f(Y(fr))} L${f(bx + sw / 2)} ${f(Y(fr))} L${f(bx + sw / 2)} ${f(Y(fr + 0.05))} L${f(bx - sw / 2)} ${f(Y(fr + 0.05))} Z`);
    }
    out.push({ t: 'path', d: ws.join(' '), fill: '#A39885', nfill: '#E9C46A' });
  }
  // Külah (sivri, hafif kavisli) ve hilâl
  const cw = w * 0.66;
  const c0 = Y(0.885), c1 = Y(0.975);
  out.push({
    t: 'path', d: `M${f(bx - cw / 2)} ${f(c0)} Q${f(bx - cw * 0.45)} ${f(c0 - (c0 - c1) * 0.55)} ${f(bx)} ${f(c1)} Q${f(bx + cw * 0.45)} ${f(c0 - (c0 - c1) * 0.55)} ${f(bx + cw / 2)} ${f(c0)} Z`,
    fill: '#E6E0D5', grad: { x1: bx - cw / 2, y1: 0, x2: bx + cw / 2, y2: 0, stops: [[0, '#F7F4EE'], [1, '#BFB5A4']] }, stroke: '#B5AC9C', sw: 0.4,
  });
  const fy = Y(1);
  out.push({ t: 'path', d: `M${f(bx)} ${f(c1)} L${f(bx)} ${f(fy)}`, stroke: '#C9A227', sw: Math.max(0.8, w * 0.1), fill: 'none', keep: true });
  // Hilâl: uçları yukarı bakan ay (dış yay alttan, iç yay daha düz)
  const r = Math.max(1.1, w * 0.2);
  const cy = fy - r * 0.9;
  out.push({ t: 'path', d: `M${f(bx - r)} ${f(cy)} A${f(r)} ${f(r)} 0 0 0 ${f(bx + r)} ${f(cy)} A${f(r * 1.3)} ${f(r * 1.3)} 0 0 1 ${f(bx - r)} ${f(cy)} Z`, fill: '#D4AF37', keep: true });
  return out;
}

export function polylineLength(pts: Pt[]) {
  let s = 0;
  for (let i = 1; i < pts.length; i++) s += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
  return s;
}
