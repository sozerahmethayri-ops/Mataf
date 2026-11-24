// Mescid çevresinde rota: dış halka üzerinden kısa yön + açık kapı seçimi.
// Kapı durumu "kapalı" ya da "sadece çıkış" ise o kapı kullanılmaz → otomatik yeniden rota.
import { DESTINATIONS, GATES, RINGS, dist, type City, type Destination, type Gate, type Pt } from '@/data/sites';
import { polylineLength } from '@/scene/oblique';
import type { GateStatus } from './reports';

export type Plan = { points: Pt[]; gate?: Gate; lengthM: number; minutes: number };

const BLOCKED: GateStatus[] = ['closed', 'exitOnly'];

function nearestIdx(ring: Pt[], p: Pt) {
  let best = 0;
  let bd = Infinity;
  ring.forEach((r, i) => {
    const d = dist(r, p);
    if (d < bd) { bd = d; best = i; }
  });
  return best;
}

/** Halka üzerinde a'dan b'ye en kısa yön. */
function ringPath(city: City, a: Pt, b: Pt): Pt[] {
  const ring = RINGS[city];
  const ia = nearestIdx(ring, a);
  const ib = nearestIdx(ring, b);
  const n = ring.length;
  const cw: Pt[] = [];
  for (let i = ia; ; i = (i + 1) % n) { cw.push(ring[i]); if (i === ib) break; }
  const ccw: Pt[] = [];
  for (let i = ia; ; i = (i - 1 + n) % n) { ccw.push(ring[i]); if (i === ib) break; }
  const pa = [a, ...cw, b];
  const pb = [a, ...ccw, b];
  return polylineLength(pa) <= polylineLength(pb) ? pa : pb;
}

export function isInsideBuilding(city: City, p: Pt) {
  const [x, y] = p;
  if (city === 'makkah') return (x > -235 && x < 118 && y > -200 && y < 165) || (x > -240 && x < 70 && y > -555 && y < -240);
  return (x > -147 && x < 147 && y > -190 && y < 130) || (x > -46 && x < 46 && y >= 130 && y < 176);
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
  if (!dest.inside) return finish(ringPath(city, from, dest.pos));
  let best: Plan | null = null;
  for (const g of GATES.filter((x) => x.city === city)) {
    if (BLOCKED.includes(statusOf(g.id))) continue;
    const p = finish([...ringPath(city, from, g.out), g.pos, g.inner, dest.pos], g);
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
