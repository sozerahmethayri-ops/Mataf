// Tavaf asistanı için yakın plan 3D sahne: Kâbe (gerçek ölçü ve yön), Hatîm duvarı, Makam-ı İbrâhîm,
// başlangıç çizgisi, kullanıcının tavaf halkası ve tamamlanan yay. Kamera kullanıcının tarafından bakar.
import type { Pt } from '@/data/sites';
import {
  CORNERS, DOOR, KAABA, KAABA_POLY, MAQAM, bearingOf, dirOf, hijrBand, pointAt, zoneRange, type ZoneId,
} from '@/services/tawaf';
import { Cam, extrude, flat, ptsStr, type Prim } from './oblique';

export type TawafView = { cam: Cam; prims: Prim[]; anchors: Record<string, [number, number]>; kaabaBox: { x: number; y: number; w: number; h: number } };

function convexHull(pts: [number, number][]): [number, number][] {
  const p = [...pts].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cross = (o: number[], a: number[], b: number[]) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lower: [number, number][] = [];
  for (const q of p) { while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], q) <= 0) lower.pop(); lower.push(q); }
  const upper: [number, number][] = [];
  for (const q of [...p].reverse()) { while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], q) <= 0) upper.pop(); upper.push(q); }
  return [...lower.slice(0, -1), ...upper.slice(0, -1)];
}
function inside(pt: [number, number], poly: [number, number][]) {
  let c = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i];
    const [xj, yj] = poly[j];
    if (yi > pt[1] !== yj > pt[1] && pt[0] < ((xj - xi) * (pt[1] - yi)) / (yj - yi) + xi) c = !c;
  }
  return c;
}

const ring = (r: number, from = 0, to = 360, n = 72): Pt[] => {
  const out: Pt[] = [];
  const steps = Math.max(2, Math.round((n * Math.abs(to - from)) / 360));
  for (let i = 0; i <= steps; i++) out.push(pointAt(from + ((to - from) * i) / steps, r));
  return out;
};
const pathOf = (cam: Cam, pts: Pt[], h = 0) => pts.map(([x, y], i) => {
  const [a, b] = cam.P(x, y, h);
  return `${i ? 'L' : 'M'}${a.toFixed(1)} ${b.toFixed(1)}`;
}).join(' ');

/** İzleyicinin pusula yönünden kamera dönüşü. */
export const rotForViewer = (viewerBearing: number) => 180 - viewerBearing;

export function buildTawafView(opts: {
  width: number; height: number;
  viewerBearing: number; // izleyicinin Kâbe'ye göre durduğu yön (°)
  radius: number; // gösterilecek halka yarıçapı (m)
  progress?: number; // bu şavttaki ilerleme (°)
  userR?: number;
  zone?: ZoneId;
}): TawafView {
  const { width, height, viewerBearing, radius } = opts;
  const R = Math.max(20, radius + 8);
  const rot = rotForViewer(viewerBearing);
  const k = Math.min((width - 20) / (2 * R), (height - 30) / (2 * R * 0.58 + 13.1 * 0.815 * 0.6));
  const cam = Cam.centeredOn(k, [0, 0], width / 2, height * 0.56, rot);
  const P = cam.P.bind(cam);
  const prims: Prim[] = [];
  const ur = opts.userR ?? radius;

  // Zemin: mataf mermeri ve mesafe halkaları
  prims.push(flat(cam, ring(R + 30, 0, 360, 96), '#F7F5F0'));
  for (const rr of [10, 20, 30, 40, 50, 60]) if (rr < R + 25)
    prims.push({ t: 'path', d: pathOf(cam, ring(rr, 0, 360, 96)) + ' Z', stroke: '#E6E1D8', sw: 0.8, fill: 'none' });

  // Bulunulan bölgenin vurgusu (halka üzerinde)
  if (opts.zone) {
    const [a, b] = zoneRange(opts.zone);
    const outer = ring(ur + 3.5, a, b, 120);
    const inner = ring(Math.max(6, ur - 3.5), a, b, 120).reverse();
    prims.push(flat(cam, [...outer, ...inner], opts.zone === 'rabbana' || opts.zone === 'start' ? 'rgba(242,106,27,0.16)' : 'rgba(37,99,235,0.10)'));
  }

  // Tavaf halkası ve yön okları (saat yönünün tersi)
  prims.push({ t: 'path', d: pathOf(cam, ring(ur, 0, 360, 120)) + ' Z', stroke: '#CFC7B8', sw: 1.6, fill: 'none' });
  for (let p = 20; p < 360; p += 40) {
    const [a, b, c] = [pointAt(p - 2.5, ur + 1.6), pointAt(p + 1.5, ur), pointAt(p - 2.5, ur - 1.6)];
    prims.push({ t: 'path', d: pathOf(cam, [a, b, c]), stroke: '#A39A89', sw: 1.6, fill: 'none' });
  }

  // Bu şavtta yürünen yay
  if (opts.progress && opts.progress > 0.5)
    prims.push(
      { t: 'path', d: pathOf(cam, ring(ur, 0, opts.progress, 180)), stroke: '#FFFFFF', sw: 8, fill: 'none' },
      { t: 'path', d: pathOf(cam, ring(ur, 0, opts.progress, 180)), stroke: '#F26A1B', sw: 4.5, fill: 'none' },
    );

  // Başlangıç çizgisi (Hacerü'l-Esved hizası) ve yeşil ışık
  const bs = bearingOf(CORNERS.aswad);
  const s0 = CORNERS.aswad;
  const s1: Pt = [dirOf(bs)[0] * (R + 22), dirOf(bs)[1] * (R + 22)];
  prims.push({ t: 'path', d: pathOf(cam, [s0, s1]), stroke: '#2F8F57', sw: 2.2, fill: 'none' });
  const gl: Pt = [dirOf(bs)[0] * (ur + 7), dirOf(bs)[1] * (ur + 7)]; // yeşil ışık: halkanın hemen dışında
  const [gx, gy] = P(gl[0], gl[1], 0);
  const [, gty] = P(gl[0], gl[1], 6);
  prims.push({ t: 'rect', x: gx - 2, y: gty, w: 4, h: gy - gty, fill: '#2F8F57' });
  prims.push({ t: 'circ', cx: gx, cy: gty, r: 4, fill: '#7CFC9A', stroke: '#2F8F57', sw: 1.2 });

  // 3D cisimler: derinliğe göre sıralı (önce arkadakiler)
  type Obj = { d: number; prims: Prim[] };
  const objs: Obj[] = [];

  // Çatı duvarlardan açık: kutu hissi için (gerçekte çatı açık renkli mermer kaplıdır)
  const kaaba: Prim[] = [...extrude(cam, KAABA_POLY, 0, KAABA.height, '#6B6D75', '#2A2B31', '#18191D', [], '#3B3C43')];
  // Kuşak (hizam) — yalnız yan yüzler
  kaaba.push(...extrude(cam, KAABA_POLY, 8.6, 9.5, '#000', '#C9A227', '#A8861A', [], 'none').slice(0, -1));
  // Kapı (kuzeydoğu duvarı görünüyorsa)
  const nDoor = dirOf(KAABA.axis - 90);
  if (nDoor[0] * cam.st + nDoor[1] * cam.ct > 0) {
    const t = dirOf(KAABA.axis + 180);
    const a: Pt = [DOOR.center[0] - (t[0] * DOOR.width) / 2, DOOR.center[1] - (t[1] * DOOR.width) / 2];
    const b: Pt = [DOOR.center[0] + (t[0] * DOOR.width) / 2, DOOR.center[1] + (t[1] * DOOR.width) / 2];
    kaaba.push({ t: 'poly', pts: ptsStr([P(a[0], a[1], DOOR.bottom), P(b[0], b[1], DOOR.bottom), P(b[0], b[1], DOOR.top), P(a[0], a[1], DOOR.top)]), fill: '#C9A227', stroke: '#8A6D12', sw: 0.8 });
  }
  // Hacerü'l-Esved: köşede gümüş çerçeve
  const [hx, hy] = P(CORNERS.aswad[0], CORNERS.aswad[1], 1.5);
  kaaba.push({ t: 'ell', cx: hx, cy: hy, rx: Math.max(3, 0.42 * k), ry: Math.max(3.6, 0.5 * k), fill: '#D9DCE1', stroke: '#8E939C', sw: 1 });
  kaaba.push({ t: 'ell', cx: hx, cy: hy, rx: Math.max(1.6, 0.24 * k), ry: Math.max(2, 0.3 * k), fill: '#1B1B1F' });
  // Mîzâb (altın oluk) — Hatîm duvarı tarafında, çatı hizasında
  const mz: Pt = [(CORNERS.iraqi[0] + CORNERS.shami[0]) / 2, (CORNERS.iraqi[1] + CORNERS.shami[1]) / 2];
  const nh = dirOf(KAABA.axis + 180);
  const [m1x, m1y] = P(mz[0], mz[1], 12.9);
  const [m2x, m2y] = P(mz[0] + nh[0] * 1.6, mz[1] + nh[1] * 1.6, 12.5);
  kaaba.push({ t: 'path', d: `M${m1x.toFixed(1)} ${m1y.toFixed(1)} L${m2x.toFixed(1)} ${m2y.toFixed(1)}`, stroke: '#C9A227', sw: Math.max(2, 0.35 * k) });
  objs.push({ d: cam.depthOf(0, 0), prims: kaaba });

  const hb = hijrBand();
  objs.push({ d: cam.depthOf(...hb.mid[12]), prims: extrude(cam, [...hb.outer, ...[...hb.inner].reverse()], 0, 1.32, '#FBFAF7', '#E9E4DA', '#D6CFC1', [], '#CFC7B8') });

  const oct: Pt[] = Array.from({ length: 8 }, (_, i) => [MAQAM[0] + 0.9 * Math.cos((i * Math.PI) / 4), MAQAM[1] + 0.9 * Math.sin((i * Math.PI) / 4)]);
  const maqam = extrude(cam, oct, 0, 2.2, '#E2C15A', '#D4AF37', '#B08B1C', [], '#9C7A14');
  const [qx, qy] = P(MAQAM[0], MAQAM[1], 2.6);
  maqam.push({ t: 'circ', cx: qx, cy: qy, r: Math.max(2.5, 0.55 * k), fill: '#E2C15A', stroke: '#9C7A14', sw: 0.8 });
  objs.push({ d: cam.depthOf(MAQAM[0], MAQAM[1]), prims: maqam });

  objs.sort((a, b) => a.d - b.d);
  for (const o of objs) prims.push(...o.prims);

  // Etiket bağlantı noktaları (ekran koordinatı). Kâbe'nin arkasında kalanlar gizlenir;
  // Hatîm için duvarın görünen bir noktası aranır.
  const hull = convexHull(KAABA_POLY.flatMap(([x, y]) => [P(x, y, 0), P(x, y, KAABA.height)]));
  const cd = cam.depthOf(0, 0);
  const hidden = (p: Pt, h: number) => cam.depthOf(p[0], p[1]) < cd && inside(P(p[0], p[1], h), hull);
  const anchors: Record<string, [number, number]> = {};
  for (const id of ['aswad', 'iraqi', 'shami', 'yamani'] as const) if (!hidden(CORNERS[id], 0)) anchors[id] = P(...CORNERS[id], 0);
  const hv = [hb.mid[12], hb.mid[6], hb.mid[18], hb.mid[3], hb.mid[21]].find((m) => !hidden(m, 1.4));
  if (hv) anchors.hijr = P(...hv, 1.4);
  if (nDoor[0] * cam.st + nDoor[1] * cam.ct > 0) anchors.door = P(...DOOR.center, DOOR.top);
  if (!hidden(MAQAM, 2)) anchors.maqam = P(MAQAM[0], MAQAM[1], 3);
  anchors.start = [gx, gty - 4];
  const xs = hull.map((q) => q[0]);
  const ys = hull.map((q) => q[1]);
  const kaabaBox = { x: Math.min(...xs) + 4, y: Math.min(...ys) + 4, w: Math.max(...xs) - Math.min(...xs) - 8, h: Math.max(...ys) - Math.min(...ys) - 8 };
  return { cam, prims, anchors, kaabaBox };
}
