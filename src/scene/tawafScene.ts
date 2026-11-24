// Tavaf asistanı için yakın plan 3D sahne: Kâbe (gerçek ölçü ve yön), Hatîm duvarı, Makam-ı İbrâhîm,
// başlangıç çizgisi, kullanıcının tavaf halkası ve tamamlanan yay. Kamera kullanıcının tarafından bakar.
import type { Pt } from '@/data/sites';
import {
  CORNERS, DOOR, KAABA, KAABA_POLY, MAQAM, bearingOf, dirOf, hijrBand, pointAt, zoneRange, type ZoneId,
} from '@/services/tawaf';
import { buildKaaba } from './kaaba';
import { CA, Cam, SA, flat, type Prim } from './oblique';

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
  // Çerçeve: Beytullah sahnenin odağı. Ölçek, Kâbe genişliğin %40–55'ini kaplayacak ve izleyici
  // (halkanın önü, ekranın altı) görünür kalacak şekilde seçilir; uzak halkanın yanları kırpılabilir.
  const span = 16.9; // Kâbe'nin ekrandaki en geniş yatay boyu (köşegen, m)
  const up = SA * 8 + CA * KAABA.height + 1.2; // Kâbe merkezinden çatının arka köşesine (m, ekran birimi)
  const rFront = Math.min(45, radius + 4); // önde görünmesi gereken uzaklık (izleyici + pay)
  const kRing = (width - 24) / (2 * (radius + 4));
  const kV = (height - 40) / (up + rFront * SA);
  const k = Math.min(kV, width * 0.55 / span, Math.max(kRing, width * 0.4 / span));
  const cy = (height - (up + rFront * SA) * k) / 2 + up * k + 4;
  const cam = Cam.centeredOn(k, [0, 0], width / 2, cy, rot);
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
      { t: 'path', d: pathOf(cam, ring(ur, 0, opts.progress, 180)), stroke: '#F26A1B', sw: 4.5, fill: 'none', keep: true },
    );

  // Başlangıç çizgisi (Hacerü'l-Esved hizası) ve yeşil ışık
  const bs = bearingOf(CORNERS.aswad);
  const s0 = CORNERS.aswad;
  const s1: Pt = [dirOf(bs)[0] * (R + 22), dirOf(bs)[1] * (R + 22)];
  prims.push({ t: 'path', d: pathOf(cam, [s0, s1]), stroke: '#2F8F57', sw: 2.2, fill: 'none', keep: true });
  const gl: Pt = [dirOf(bs)[0] * (ur + 7), dirOf(bs)[1] * (ur + 7)]; // yeşil ışık: halkanın hemen dışında
  const [gx, gy] = P(gl[0], gl[1], 0);
  const [, gty] = P(gl[0], gl[1], 6);
  prims.push({ t: 'rect', x: gx - 2, y: gty, w: 4, h: gy - gty, fill: '#2F8F57', keep: true });
  prims.push({ t: 'circ', cx: gx, cy: gty, r: 4, fill: '#7CFC9A', stroke: '#2F8F57', sw: 1.2, keep: true });

  // Kâbe (Hatîm duvarı, Makam ve gölgeyle birlikte; kendi içinde doğru sıralı)
  const kb = buildKaaba(cam);
  // Başlangıç ışığı Kâbe'nin önündeyse ondan sonra, arkasındaysa önce çizilir
  const pole = prims.splice(prims.length - 2, 2);
  prims.push(...kb.under);
  const poleFront = cam.depthOf(gl[0], gl[1]) > kb.frontDepth;
  if (!poleFront) prims.push(...pole);
  prims.push(...kb.body);
  if (poleFront) prims.push(...pole);

  const hb = hijrBand();
  const nDoor = dirOf(KAABA.axis - 90);

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
