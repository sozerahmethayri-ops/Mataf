// Mescid çevresinde rota: gerçek bina dış hatlarının (OpenStreetMap) çevresinden en kısa yürüme yolu
// + açık kapı seçimi. Kapı durumu "kapalı" ya da "sadece çıkış" ise o kapı kullanılmaz → otomatik yeniden rota.
import { HARAM_3D } from '@/data/osm/haram3d';
import { NABAWI_3D } from '@/data/osm/nabawi3d';
import { DESTINATIONS, GATES, dist, type City, type Destination, type Gate, type Pt } from '@/data/sites';
import { decodeOsm3d, pointInPoly, signedArea } from '@/scene/osm3d';
import { polylineLength } from '@/scene/oblique';
import type { GateStatus } from './reports';

export type Plan = { points: Pt[]; gate?: Gate; lengthM: number; minutes: number };

const BLOCKED: GateStatus[] = ['closed', 'exitOnly'];

/** Yürüme ağı: bina halkaları (engel) ve köşelerin 10 m dışındaki düğümler; düğümler arası görünürlük. */
type Net = { rings: Pt[][]; nodes: Pt[]; seen: boolean[][] };
const nets: Partial<Record<City, Net>> = {};

/** Kapalı halkayı Douglas–Peucker ile sadeleştirir. */
function simplify(ring: Pt[], tol: number): Pt[] {
  const dp = (pts: Pt[]): Pt[] => {
    if (pts.length < 3) return pts;
    const [a, b] = [pts[0], pts[pts.length - 1]];
    let best = -1;
    let bi = 0;
    for (let i = 1; i < pts.length - 1; i++) {
      const d = distToSeg(pts[i], a, b);
      if (d > best) { best = d; bi = i; }
    }
    if (best <= tol) return [a, b];
    return [...dp(pts.slice(0, bi + 1)).slice(0, -1), ...dp(pts.slice(bi))];
  };
  let far = 0;
  ring.forEach((p, i) => { if (dist(p, ring[0]) > dist(ring[far], ring[0])) far = i; });
  const one = dp(ring.slice(0, far + 1));
  const two = dp([...ring.slice(far), ring[0]]);
  return [...one.slice(0, -1), ...two.slice(0, -1)];
}

function crosses(a: Pt, b: Pt, c: Pt, d: Pt) {
  const o = (p: Pt, q: Pt, r: Pt) => (q[0] - p[0]) * (r[1] - p[1]) - (q[1] - p[1]) * (r[0] - p[0]);
  const d1 = o(a, b, c), d2 = o(a, b, d), d3 = o(c, d, a), d4 = o(c, d, b);
  return ((d1 > 1e-9 && d2 < -1e-9) || (d1 < -1e-9 && d2 > 1e-9)) && ((d3 > 1e-9 && d4 < -1e-9) || (d3 < -1e-9 && d4 > 1e-9));
}

function clearLine(rings: Pt[][], a: Pt, b: Pt) {
  for (const r of rings) {
    for (let i = 0; i < r.length; i++) if (crosses(a, b, r[i], r[(i + 1) % r.length])) return false;
    for (const t of [0.25, 0.5, 0.75]) if (pointInPoly([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t], r)) return false;
  }
  return true;
}

function ringsOf(city: City): Pt[][] {
  if (city === 'makkah') return decodeOsm3d(HARAM_3D).outer;
  const parts = decodeOsm3d(NABAWI_3D).parts;
  return [parts.reduce((a, p) => (Math.abs(signedArea(p.pts)) > Math.abs(signedArea(a.pts)) ? p : a)).pts];
}

function netOf(city: City): Net {
  const have = nets[city];
  if (have) return have;
  const rings = ringsOf(city);
  const nodes: Pt[] = [];
  for (const r0 of rings) {
    const r = simplify(r0, 3);
    const s = Math.sign(signedArea(r)) || 1;
    for (let i = 0; i < r.length; i++) {
      const a = r[(i - 1 + r.length) % r.length];
      const b = r[i];
      const c = r[(i + 1) % r.length];
      const turn = (b[0] - a[0]) * (c[1] - b[1]) - (b[1] - a[1]) * (c[0] - b[0]);
      if (turn * s <= 0) continue; // içbükey köşe: en kısa yol buradan geçmez
      // köşeden dışarıya, iki kenar normalinin ortalaması yönünde 10 m
      const n1 = norm([(b[1] - a[1]) * s, -(b[0] - a[0]) * s]);
      const n2 = norm([(c[1] - b[1]) * s, -(c[0] - b[0]) * s]);
      const m = norm([n1[0] + n2[0], n1[1] + n2[1]]);
      const p: Pt = [b[0] + m[0] * 10, b[1] + m[1] * 10];
      if (rings.some((q) => pointInPoly(p, q))) continue;
      nodes.push(p);
    }
  }
  const seen = nodes.map((a, i) => nodes.map((b, j) => i !== j && clearLine(rings, a, b)));
  const net = { rings, nodes, seen };
  nets[city] = net;
  return net;
}
const norm = (v: Pt): Pt => { const L = Math.hypot(v[0], v[1]) || 1; return [v[0] / L, v[1] / L]; };

/** Binaların içinden geçmeyen en kısa yürüme yolu (görünürlük ağı + Dijkstra). */
export function walkPath(city: City, a: Pt, b: Pt): Pt[] {
  const net = netOf(city);
  if (clearLine(net.rings, a, b)) return [a, b];
  const n = net.nodes.length;
  const S = n;
  const T = n + 1;
  const pos = (i: number) => (i === S ? a : i === T ? b : net.nodes[i]);
  const fromA = net.nodes.map((q) => clearLine(net.rings, a, q));
  const toB = net.nodes.map((q) => clearLine(net.rings, q, b));
  const D = new Array(n + 2).fill(Infinity);
  const prev = new Array(n + 2).fill(-1);
  const done = new Array(n + 2).fill(false);
  D[S] = 0;
  for (;;) {
    let u = -1;
    for (let i = 0; i < n + 2; i++) if (!done[i] && D[i] < Infinity && (u < 0 || D[i] < D[u])) u = i;
    if (u < 0 || u === T) break;
    done[u] = true;
    const relax = (v: number) => {
      const w = D[u] + dist(pos(u), pos(v));
      if (w < D[v]) { D[v] = w; prev[v] = u; }
    };
    if (u === S) net.nodes.forEach((_, j) => fromA[j] && relax(j));
    else {
      for (let j = 0; j < n; j++) if (net.seen[u][j]) relax(j);
      if (toB[u]) relax(T);
    }
  }
  if (D[T] === Infinity) return [a, b];
  const path: Pt[] = [];
  for (let v = T; v >= 0; v = prev[v]) path.unshift(pos(v));
  return path;
}

/** Nokta bir mescit binasının (Mekke'de Mataf avlusu dahil) içinde mi? */
export function isInsideBuilding(city: City, p: Pt) {
  return netOf(city).rings.some((r) => pointInPoly(p, r));
}

function finish(points: Pt[], gate?: Gate): Plan {
  // ardışık aynı noktaları temizle
  const clean = points.filter((p, i) => i === 0 || dist(p, points[i - 1]) > 0.5);
  const lengthM = polylineLength(clean);
  return { points: clean, gate, lengthM, minutes: Math.max(1, Math.round(lengthM / 60)) }; // kalabalıkta ~60 m/dk
}

export function planRoute(
  city: City,
  from: Pt,
  destId: string,
  statusOf: (gateId: string) => GateStatus,
): Plan | null {
  const dest = DESTINATIONS.find((d) => d.id === destId && d.city === city) as Destination | undefined;
  if (!dest) return null;
  if (isInsideBuilding(city, from)) return finish([from, dest.pos]);
  if (!dest.inside) return finish(walkPath(city, from, dest.pos));
  let best: Plan | null = null;
  for (const g of GATES.filter((x) => x.city === city)) {
    if (BLOCKED.includes(statusOf(g.id))) continue;
    const p = finish([...walkPath(city, from, g.out), g.pos, g.inner, dest.pos], g);
    if (!best || p.lengthM < best.lengthM) best = p;
  }
  return best;
}

/** Rota üzerindeki konuma göre sıradaki yönlendirme. */
export function nextStep(plan: Plan, pos: Pt) {
  const pts = plan.points;
  let seg = 0;
  let bd = Infinity;
  for (let i = 0; i < pts.length - 1; i++) {
    const d = distToSeg(pos, pts[i], pts[i + 1]);
    if (d < bd) { bd = d; seg = i; }
  }
  const next = pts[seg + 1];
  const distM = Math.round(dist(pos, next));
  const after = pts[seg + 2];
  let turn: 'left' | 'right' | 'straight' | 'arrive' = 'arrive';
  if (after) {
    const a = [next[0] - pts[seg][0], next[1] - pts[seg][1]];
    const b = [after[0] - next[0], after[1] - next[1]];
    const cross = a[0] * b[1] - a[1] * b[0]; // y güneye bakar: pozitif = sağ
    const ang = Math.abs(Math.atan2(cross, a[0] * b[0] + a[1] * b[1]));
    turn = ang < 0.35 ? 'straight' : cross > 0 ? 'right' : 'left';
  }
  const atGate = plan.gate && dist(next, plan.gate.pos) < 1 ? plan.gate : undefined;
  return { distM, turn, atGate, segment: seg };
}

function distToSeg(p: Pt, a: Pt, b: Pt) {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const L = dx * dx + dy * dy || 1;
  const t = Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / L));
  return Math.hypot(p[0] - (a[0] + t * dx), p[1] - (a[1] + t * dy));
}

/** Demo yürüyüşü için rota üzerinde metre cinsinden ilerleme noktası. */
export function pointAlong(points: Pt[], m: number): Pt {
  let left = m;
  for (let i = 1; i < points.length; i++) {
    const s = dist(points[i - 1], points[i]);
    if (left <= s) {
      const t = left / s;
      return [points[i - 1][0] + t * (points[i][0] - points[i - 1][0]), points[i - 1][1] + t * (points[i][1] - points[i - 1][1])];
    }
    left -= s;
  }
  return points[points.length - 1];
}
