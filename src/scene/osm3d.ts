// OpenStreetMap "Simple 3D Buildings" parçalarından eğik 3D çizim.
// Veri: © OpenStreetMap katkıcıları — ODbL 1.0 (https://www.openstreetmap.org/copyright).
//
// Her bina parçası h0–h1 arasında yükseltilir ve OSM'deki çatı biçimi (düz, kubbe, soğan, koni, piramit,
// beşik, kırma, tek eğim) korunur. İçbükey parçalar dışbükey parçalara bölünür (kulak kırpma + Hertel–Mehlhorn).
// Minareler, OSM'de üst üste binen silindir katlarından tek bir silüet olarak çizilir.
//
// Çizim sırası (ressam): her dışbükey parça çifti için ayırıcı eksen (SAT) bulunur; eksenin izleyiciye bakan
// tarafındaki parça sonra çizilir. Planda örtüşen (üst üste duran) parçalarda alttaki önce gelir. Kısıtlar
// topolojik sıralanır; sonuç yalnızca dönüş açısına bağlı olduğundan açı başına önbelleğe alınır.
// Ana bina kütlesi (dış hat halkaları + iç avlu) tek parça çizilir: önce görünen duvarlar, sonra avludakiler
// (ör. Kâbe), en son çatı — düz çatılı bir kütle için bu sıra içbükey biçimlerde de her zaman doğrudur.
import type { Pt } from '@/data/sites';
import { CA, Cam, SA, faceLight, minaret, mixHex, ptsStr, visibleWalls, type Prim, type Wall } from './oblique';

export type Roof = 'F' | 'D' | 'S' | 'P' | 'G' | 'H' | 'O' | 'R' | 'C' | 'M' | 'B';
export type Part = {
  h0: number;
  h1: number;
  roof: Roof;
  rh: number;
  /** Tek eğimli çatının aşağı baktığı yön (derece, kuzeyden saat yönünde). */
  rd: number | null;
  wall: string | null;
  roofC: string | null;
  pts: Pt[];
  circ: { x: number; y: number; r: number; n: number } | null;
};
export type Osm3d = { parts: Part[]; outer: Pt[][]; inner: Pt[][]; marks: [number, number, number][] };

const NAMED: Record<string, string> = {
  white: '#FFFFFF', black: '#2A2A2A', green: '#2E7D4F', brown: '#8B5A2B', red: '#B03A2E', grey: '#9A9A9A', gray: '#9A9A9A',
  yellow: '#E8C547', blue: '#3D6FB5', silver: '#C0C0C0', gold: '#D4AF37',
};
const hexOf = (s: string | undefined) => (!s ? null : s.startsWith('#') ? (s.length === 4 ? `#${s[1]}${s[1]}${s[2]}${s[2]}${s[3]}${s[3]}` : s.slice(0, 7)) : NAMED[s] ?? null);

function deltaPoly(nums: number[]): Pt[] {
  const out: Pt[] = [];
  let x = 0;
  let y = 0;
  for (let i = 0; i + 1 < nums.length; i += 2) {
    if (i === 0) { x = nums[0]; y = nums[1]; } else { x += nums[i]; y += nums[i + 1]; }
    out.push([x / 10, y / 10]);
  }
  return out;
}

/** Sıkıştırılmış metni (bkz. src/data/osm/*.ts başlığı) parçalara çözer. */
export function decodeOsm3d(txt: string): Osm3d {
  const res: Osm3d = { parts: [], outer: [], inner: [], marks: [] };
  let pal: string[] = [];
  for (const line of txt.split('\n')) {
    const t = line.trim().split(/\s+/);
    if (!t[0]) continue;
    if (t[0] === 'pal') { pal = t.slice(1); continue; }
    if (t[0] === 'o' || t[0] === 'i') { (t[0] === 'o' ? res.outer : res.inner).push(deltaPoly(t.slice(1).map(Number))); continue; }
    if (t[0] === 'm') { res.marks.push([+t[1] / 10, +t[2] / 10, +t[3] / 10]); continue; }
    const h0 = +t[0] / 10;
    let h1 = +t[1] / 10;
    const roof = t[2] as Roof;
    const rh = +t[3] / 10;
    const col = (s: string) => (s === '-' ? null : hexOf(pal[+s]));
    // OSM'de birkaç alem parçasında yükseklik < taban yüksekliği yazılmış: üstüne oturt.
    if (h1 < h0) h1 = h0 + Math.max(rh, 1.5) + 2;
    let pts: Pt[];
    let circ: Part['circ'] = null;
    if (t[7] === 'c') {
      const [cx, cy, r] = [+t[8] / 10, +t[9] / 10, +t[10] / 10];
      const n = +t[11];
      const a0 = (+t[12] * Math.PI) / 180;
      pts = Array.from({ length: n }, (_, i) => [cx + r * Math.cos(a0 + (2 * Math.PI * i) / n), cy + r * Math.sin(a0 + (2 * Math.PI * i) / n)] as Pt);
      circ = { x: cx, y: cy, r, n };
    } else {
      pts = deltaPoly(t.slice(8).map(Number));
    }
    res.parts.push({ h0, h1, roof, rh, rd: t[4] === '-' ? null : +t[4], wall: col(t[5]), roofC: col(t[6]), pts, circ });
  }
  return res;
}

// ───────────────────────── Geometri yardımcıları ─────────────────────────

export function signedArea(p: Pt[]) {
  let s = 0;
  for (let i = 0; i < p.length; i++) {
    const [x1, y1] = p[i];
    const [x2, y2] = p[(i + 1) % p.length];
    s += x1 * y2 - x2 * y1;
  }
  return s / 2;
}
export const centroid = (p: Pt[]): Pt => [p.reduce((s, q) => s + q[0], 0) / p.length, p.reduce((s, q) => s + q[1], 0) / p.length];

export function pointInPoly(p: Pt, poly: Pt[]) {
  const [x, y] = p;
  let c = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i];
    const [xj, yj] = poly[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c;
  }
  return c;
}

const cross = (o: Pt, a: Pt, b: Pt) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);

/** Ardışık tekrarları ve neredeyse doğrusal köşeleri ayıklar; yönü pozitif alana çevirir. */
function clean(p: Pt[]): Pt[] {
  let q = p.filter((v, i) => Math.hypot(v[0] - p[(i + 1) % p.length][0], v[1] - p[(i + 1) % p.length][1]) > 0.05);
  for (let pass = 0; pass < 3 && q.length > 3; pass++) {
    const r: Pt[] = [];
    for (let i = 0; i < q.length; i++) {
      const a = q[(i - 1 + q.length) % q.length];
      const b = q[i];
      const c = q[(i + 1) % q.length];
      const L = Math.hypot(c[0] - a[0], c[1] - a[1]) || 1;
      if (Math.abs(cross(a, b, c)) / L > 0.03) r.push(b);
    }
    if (r.length === q.length || r.length < 3) break;
    q = r;
  }
  return signedArea(q) < 0 ? [...q].reverse() : q;
}

function isConvex(p: Pt[]) {
  for (let i = 0; i < p.length; i++) if (cross(p[i], p[(i + 1) % p.length], p[(i + 2) % p.length]) < -1e-6) return false;
  return true;
}

function inTri(p: Pt, a: Pt, b: Pt, c: Pt) {
  return cross(a, b, p) >= -1e-9 && cross(b, c, p) >= -1e-9 && cross(c, a, p) >= -1e-9;
}

/** Kulak kırpma (pozitif yönlü basit çokgen) → üçgen indisleri. */
function triangulate(p: Pt[]): [number, number, number][] {
  const idx = p.map((_, i) => i);
  const tris: [number, number, number][] = [];
  let guard = 0;
  while (idx.length > 3 && guard++ < 5000) {
    let cut = false;
    for (let i = 0; i < idx.length; i++) {
      const ia = idx[(i - 1 + idx.length) % idx.length];
      const ib = idx[i];
      const ic = idx[(i + 1) % idx.length];
      if (cross(p[ia], p[ib], p[ic]) <= 1e-9) continue;
      let ear = true;
      for (const j of idx) {
        if (j === ia || j === ib || j === ic) continue;
        if (inTri(p[j], p[ia], p[ib], p[ic])) { ear = false; break; }
      }
      if (!ear) continue;
      tris.push([ia, ib, ic]);
      idx.splice(i, 1);
      cut = true;
      break;
    }
    if (!cut) break; // bozuk çokgen: kalanı yelpaze yap
  }
  for (let i = 1; i + 1 < idx.length; i++) tris.push([idx[0], idx[i], idx[i + 1]]);
  return tris;
}

/** Dışbükey parçalar; `real[i]`: i→i+1 kenarı asıl dış kenar mı (iç köşegen değil). */
export type Piece = { pts: Pt[]; real: boolean[]; convex?: boolean };
export function convexPieces(raw: Pt[]): Piece[] {
  const p = clean(raw);
  const n = p.length;
  if (n < 3) return [];
  if (isConvex(p)) return [{ pts: p, real: p.map(() => true) }];
  // Neredeyse dışbükey (zarf alanı ≤ %25 fazla) ve küçük: bölmeye değmez; sıralamada zarfı kullanılır
  const ha = Math.abs(signedArea(hull(p)));
  if (ha <= Math.abs(signedArea(p)) * 1.25 && ha < 6000) return [{ pts: p, real: p.map(() => true), convex: false }];
  let polys: number[][] = triangulate(p).map((t) => [...t]);
  const isReal = (a: number, b: number) => (a + 1) % n === b || (b + 1) % n === a;
  const convexIdx = (q: number[]) => isConvex(q.map((i) => p[i]));
  // Hertel–Mehlhorn: köşegeni kaldırınca dışbükey kalıyorsa iki parçayı birleştir
  let merged = true;
  while (merged) {
    merged = false;
    outer: for (let a = 0; a < polys.length; a++) {
      for (let b = a + 1; b < polys.length; b++) {
        const A = polys[a];
        const B = polys[b];
        for (let i = 0; i < A.length; i++) {
          const u = A[i];
          const v = A[(i + 1) % A.length];
          if (isReal(u, v)) continue;
          const j = B.findIndex((x, jj) => x === v && B[(jj + 1) % B.length] === u);
          if (j < 0) continue;
          // A'yı v'den başlat (… u ile biter), B'yi u'dan başlat (… v ile biter)
          const ra = [...A.slice((i + 1) % A.length), ...A.slice(0, (i + 1) % A.length)];
          const rb = [...B.slice((j + 1) % B.length), ...B.slice(0, (j + 1) % B.length)];
          const m = [...ra, ...rb.slice(1, rb.length - 1)];
          if (!convexIdx(m)) continue;
          polys = polys.filter((_, k) => k !== a && k !== b);
          polys.push(m);
          merged = true;
          break outer;
        }
      }
    }
  }
  return polys.map((q) => ({ pts: q.map((i) => p[i]), real: q.map((i, k) => isReal(i, q[(k + 1) % q.length])) }));
}

/** Dışbükey iki çokgen için ayırıcı eksen: örtüşüyorsa null, değilse A'dan B'ye yön. */
function separate(A: Pt[], B: Pt[], depth: (v: Pt) => number): Pt | null {
  let best: Pt | null = null;
  let bestD = -1;
  const test = (P: Pt[]) => {
    for (let i = 0; i < P.length; i++) {
      const a = P[i];
      const b = P[(i + 1) % P.length];
      const L = Math.hypot(b[0] - a[0], b[1] - a[1]);
      if (L < 1e-6) continue;
      const n: Pt = [(b[1] - a[1]) / L, -(b[0] - a[0]) / L];
      let a0 = Infinity, a1 = -Infinity, b0 = Infinity, b1 = -Infinity;
      for (const q of A) { const s = q[0] * n[0] + q[1] * n[1]; a0 = Math.min(a0, s); a1 = Math.max(a1, s); }
      for (const q of B) { const s = q[0] * n[0] + q[1] * n[1]; b0 = Math.min(b0, s); b1 = Math.max(b1, s); }
      let dir: Pt | null = null;
      if (b0 - a1 >= -0.02) dir = n;
      else if (a0 - b1 >= -0.02) dir = [-n[0], -n[1]];
      if (!dir) continue;
      const d = Math.abs(depth(dir));
      if (d > bestD) { bestD = d; best = dir; }
    }
  };
  test(A);
  test(B);
  return best;
}

function closestOnSeg(p: Pt, a: Pt, b: Pt): Pt {
  const ex = b[0] - a[0];
  const ey = b[1] - a[1];
  const L = ex * ex + ey * ey || 1;
  const t = Math.max(0, Math.min(1, ((p[0] - a[0]) * ex + (p[1] - a[1]) * ey) / L));
  return [a[0] + ex * t, a[1] + ey * t];
}

/** Çokgen ile halka kümesi arasındaki en yakın nokta çifti: halkadan çokgene vektör. */
function closestVec(poly: Pt[], rings: Pt[][]): Pt {
  let best = Infinity;
  let v: Pt = [0, 0];
  for (const ring of rings) {
    for (let i = 0; i < ring.length; i++) {
      const a = ring[i];
      const b = ring[(i + 1) % ring.length];
      for (const q of poly) {
        const c = closestOnSeg(q, a, b);
        const d = Math.hypot(q[0] - c[0], q[1] - c[1]);
        if (d < best) { best = d; v = [q[0] - c[0], q[1] - c[1]]; }
      }
    }
    for (const q of ring) {
      for (let i = 0; i < poly.length; i++) {
        const c = closestOnSeg(q, poly[i], poly[(i + 1) % poly.length]);
        const d = Math.hypot(q[0] - c[0], q[1] - c[1]);
        if (d < best) { best = d; v = [c[0] - q[0], c[1] - q[1]]; }
      }
    }
  }
  return v;
}

/** Noktaların dışbükey zarfı. */
export function hull(points: Pt[]): Pt[] {
  const p = [...points].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  if (p.length < 3) return p;
  const lo: Pt[] = [];
  for (const q of p) { while (lo.length >= 2 && cross(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop(); lo.push(q); }
  const up: Pt[] = [];
  for (let i = p.length - 1; i >= 0; i--) { const q = p[i]; while (up.length >= 2 && cross(up[up.length - 2], up[up.length - 1], q) <= 0) up.pop(); up.push(q); }
  return [...lo.slice(0, -1), ...up.slice(0, -1)];
}

// ───────────────────────── Renk ve ışık ─────────────────────────

/** Yüz rengi: 0 = gölge, 0,5 = kendi rengi, 1 = tam ışık. Birleştirilebilsin diye 1/8'e yuvarlanır. */
export function shade(c: string, l: number) {
  const q = Math.round(Math.max(0, Math.min(1, l)) * 8) / 8;
  return q < 0.5 ? mixHex(c, '#3B342B', (0.5 - q) * 0.95) : mixHex(c, '#FFFFFF', (q - 0.5) * 0.6);
}
const GOLD = /^#(ffcc00|d4af37|ffd700|e8c547)$/i;

const f = (v: number) => v.toFixed(1);
const M = (x: number, y: number) => `M${f(x)} ${f(y)}`;
const L = (x: number, y: number) => `L${f(x)} ${f(y)}`;

function polyPath(cam: Cam, pts: Pt[], hs: number | number[]) {
  return pts.map(([x, y], i) => {
    const [a, b] = cam.P(x, y, typeof hs === 'number' ? hs : hs[i]);
    return (i ? L : M)(a, b);
  }).join(' ') + ' Z';
}

type BB = [number, number, number, number];
const ALL: BB = [-Infinity, -Infinity, Infinity, Infinity];

/** Çizimin ekrandaki sınır kutusu (yay ve eğriler için güvenli tarafta). Çözülemezse her şeyle örtüşür. */
function bboxOf(p: Prim): BB {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  const add = (x: number, y: number, r = 0) => { x0 = Math.min(x0, x - r); y0 = Math.min(y0, y - r); x1 = Math.max(x1, x + r); y1 = Math.max(y1, y + r); };
  if (p.t === 'poly') {
    const v = p.pts.split(/[ ,]+/).map(Number);
    for (let i = 0; i + 1 < v.length; i += 2) add(v[i], v[i + 1]);
  } else if (p.t === 'ell') add(p.cx, p.cy, Math.max(p.rx, p.ry));
  else if (p.t === 'circ') add(p.cx, p.cy, p.r);
  else if (p.t === 'rect') { add(p.x, p.y); add(p.x + p.w, p.y + p.h); }
  else {
    const tok = p.d.match(/[A-Za-z]|-?\d*\.?\d+(?:e[-+]?\d+)?/g) ?? [];
    let cmd = '';
    for (let i = 0; i < tok.length;) {
      const t = tok[i];
      if (/[A-Za-z]/.test(t)) { cmd = t; i++; if (cmd === 'Z') continue; if (!'MLCQA'.includes(cmd)) return ALL; continue; }
      const n = (k: number) => +tok[i + k];
      if (cmd === 'M' || cmd === 'L') { add(n(0), n(1)); i += 2; }
      else if (cmd === 'C') { add(n(0), n(1)); add(n(2), n(3)); add(n(4), n(5)); i += 6; }
      else if (cmd === 'Q') { add(n(0), n(1)); add(n(2), n(3)); i += 4; }
      else if (cmd === 'A') { add(n(5), n(6), 2 * Math.max(n(0), n(1))); i += 7; }
      else return ALL;
    }
  }
  if (!Number.isFinite(x0)) return ALL;
  const w = (p.stroke ? (p.sw ?? 1) : 0) + 0.5;
  return [x0 - w, y0 - w, x1 + w, y1 + w];
}
const hit = (a: BB, b: BB) => a[0] <= b[2] && b[0] <= a[2] && a[1] <= b[3] && b[1] <= a[3];

type SP = [number, number][];
/** Yalnız düz çizgili şekillerin ekran çokgenleri (yay/eğri içerenler için null: kutu testi yeter). */
function polysOf(p: Prim): SP[] | null {
  if (p.stroke) return null;
  if (p.t === 'poly') {
    const v = p.pts.split(/[ ,]+/).map(Number);
    const q: SP = [];
    for (let i = 0; i + 1 < v.length; i += 2) q.push([v[i], v[i + 1]]);
    return [q];
  }
  if (p.t !== 'path' || /[^MLZ\d\s.,eE-]/.test(p.d)) return null;
  const out: SP[] = [];
  for (const sub of p.d.split('M').slice(1)) {
    const v = sub.replace(/[LZ]/g, ' ').trim().split(/[ ,]+/).map(Number);
    const q: SP = [];
    for (let i = 0; i + 1 < v.length; i += 2) q.push([v[i], v[i + 1]]);
    if (q.length >= 3) out.push(q);
  }
  return out;
}
const x2 = (o: [number, number], a: [number, number], b: [number, number]) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
function insideSP(pt: [number, number], q: SP) {
  let c = false;
  for (let i = 0, j = q.length - 1; i < q.length; j = i++) {
    const [xi, yi] = q[i];
    const [xj, yj] = q[j];
    if (yi > pt[1] !== yj > pt[1] && pt[0] < ((xj - xi) * (pt[1] - yi)) / (yj - yi) + xi) c = !c;
  }
  return c;
}
/** İki ekran çokgeni iç bölgelerde örtüşüyor mu (kenar teması örtüşme sayılmaz, 0,3 px pay). */
function polyHit(A: SP, B: SP) {
  const e = 0.3;
  for (let i = 0; i < A.length; i++) {
    const a = A[i], b = A[(i + 1) % A.length];
    for (let j = 0; j < B.length; j++) {
      const c = B[j], d = B[(j + 1) % B.length];
      const d1 = x2(a, b, c), d2 = x2(a, b, d), d3 = x2(c, d, a), d4 = x2(c, d, b);
      const lab = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
      const lcd = Math.hypot(d[0] - c[0], d[1] - c[1]) || 1;
      if (((d1 > e * lab && d2 < -e * lab) || (d1 < -e * lab && d2 > e * lab)) && ((d3 > e * lcd && d4 < -e * lcd) || (d3 < -e * lcd && d4 > e * lcd))) return true;
    }
  }
  const inner = (P: SP) => {
    const cx = P.reduce((s, q) => s + q[0], 0) / P.length;
    const cy = P.reduce((s, q) => s + q[1], 0) / P.length;
    return [[cx, cy] as [number, number], ...P.map(([x, y]) => { const L = Math.hypot(cx - x, cy - y) || 1; return [x + ((cx - x) / L) * Math.min(0.6, L), y + ((cy - y) / L) * Math.min(0.6, L)] as [number, number]; })];
  };
  return inner(A).some((q) => insideSP(q, B)) || inner(B).some((q) => insideSP(q, A));
}
type Shape = { bb: BB; polys: SP[] | null; pbb: BB[] };
const spBox = (q: SP): BB => {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const [x, y] of q) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
  return [x0, y0, x1, y1];
};
function shapeOf(p: Prim): Shape {
  let polys = polysOf(p);
  // Çok köşeli büyük şekillerde (çatı, zemin) kesin test pahalı: kutu testiyle yetin
  if (polys && polys.reduce((n, q) => n + q.length, 0) > 32) polys = null;
  return { bb: bboxOf(p), polys, pbb: polys ? polys.map(spBox) : [] };
}
function overlaps(a: Shape, b: Shape) {
  if (!hit(a.bb, b.bb)) return false;
  if (!a.polys || !b.polys) return true;
  for (let i = 0; i < a.polys.length; i++) {
    for (let j = 0; j < b.polys.length; j++) {
      const A = a.pbb[i], B = b.pbb[j];
      if (A[0] >= B[2] - 0.3 || B[0] >= A[2] - 0.3 || A[1] >= B[3] - 0.3 || B[1] >= A[3] - 0.3) continue;
      if (polyHit(a.polys[i], b.polys[j])) return true;
    }
  }
  return false;
}

function asPath(p: Prim): string {
  if (p.t === 'poly') return `M${p.pts.replace(/ /g, ' L')} Z`;
  if (p.t === 'ell') return `M${f(p.cx - p.rx)} ${f(p.cy)} A${f(p.rx)} ${f(p.ry)} 0 1 0 ${f(p.cx + p.rx)} ${f(p.cy)} A${f(p.rx)} ${f(p.ry)} 0 1 0 ${f(p.cx - p.rx)} ${f(p.cy)} Z`;
  if (p.t === 'path') return p.d;
  return '';
}
function mergeKey(p: Prim): string | null {
  if (p.grad || p.op !== undefined || p.t === 'circ' || p.t === 'rect') return null;
  if (p.t === 'path' && p.rule) return null;
  const fill = (p as { fill?: string }).fill;
  if (p.stroke) return !fill || fill === 'none' ? `s|${p.stroke}|${p.sw ?? 1}|${p.cap ?? ''}|${p.keep ? 1 : 0}` : null;
  if (!fill || fill === 'none') return null;
  return `f|${fill}|${p.nfill ?? ''}|${p.keep ? 1 : 0}`;
}

/**
 * Çizim sırasını bozmadan aynı görünümlü çizimleri tek SVG yoluna toplar: bir çizim, kendisiyle ekranda
 * örtüşen son gruptan sonraki aynı renkli bir gruba katılabilir (grup içinde örtüşme olmaz → dolgu kuralı
 * sorunu da olmaz). Telefonda SVG öğe sayısını birkaç kat düşürür; görüntü birebir aynıdır.
 */
export function mergePrims(prims: Prim[]): Prim[] {
  const groups: { key: string | null; prims: Prim[]; shapes: Shape[]; bb: BB }[] = [];
  for (const p of prims) {
    const sh = shapeOf(p);
    const key = mergeKey(p);
    let j = -1;
    for (let g = groups.length - 1; g >= 0 && j < 0; g--) {
      const G = groups[g];
      if (hit(G.bb, sh.bb) && G.shapes.some((q) => overlaps(q, sh))) j = g;
    }
    let target = -1;
    if (key) for (let g = groups.length - 1; g > j; g--) if (groups[g].key === key) { target = g; break; }
    if (target >= 0) {
      const G = groups[target];
      G.prims.push(p);
      G.shapes.push(sh);
      G.bb = [Math.min(G.bb[0], sh.bb[0]), Math.min(G.bb[1], sh.bb[1]), Math.max(G.bb[2], sh.bb[2]), Math.max(G.bb[3], sh.bb[3])];
    } else groups.push({ key, prims: [p], shapes: [sh], bb: sh.bb });
  }
  return groups.map((g) => {
    if (g.prims.length === 1) return g.prims[0];
    const a = g.prims[0] as Prim & { fill?: string };
    return { t: 'path', d: g.prims.map(asPath).join(' '), fill: a.fill ?? 'none', stroke: a.stroke, sw: a.sw, cap: a.cap, keep: a.keep, nfill: a.nfill } as Prim;
  });
}

// ───────────────────────── Parça çizimi ─────────────────────────

/** Parçanın yan duvarları ve üst yüzü için renkler. */
export type Paint = { wall: string; roof: string; edge?: boolean };

/** Duvarlar: yalnız izleyiciye bakan asıl kenarlar; arkadan öne sıralı. `base(m)`: o noktada duvarın başladığı yükseklik. */
function walls(cam: Cam, pts: Pt[], real: boolean[], h0: number | ((m: Pt) => number), tops: number[], color: string, convex = true): Prim[] {
  const out: { d: number; p: Prim }[] = [];
  for (let i = 0; i < pts.length; i++) {
    if (!real[i]) continue;
    const a = pts[i];
    const b = pts[(i + 1) % pts.length];
    const nx = b[1] - a[1];
    const ny = -(b[0] - a[0]);
    if (cam.depthOf(nx, ny) <= 1e-6) continue;
    const mid: Pt = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
    const lo = typeof h0 === 'number' ? h0 : h0(mid);
    const ta = tops[i];
    const tb = tops[(i + 1) % pts.length];
    if (Math.max(ta, tb) <= lo + 0.05) continue;
    const q = [cam.P(a[0], a[1], lo), cam.P(b[0], b[1], lo), cam.P(b[0], b[1], Math.max(lo, tb)), cam.P(a[0], a[1], Math.max(lo, ta))];
    out.push({ d: cam.depthOf(mid[0], mid[1]), p: { t: 'poly', pts: ptsStr(q), fill: shade(color, faceLight(cam, nx, ny)), keep: GOLD.test(color) || undefined } });
  }
  out.sort((x, y) => x.d - y.d);
  if (!convex) return out.map((x) => x.p);
  // Dışbükey parçada öne bakan duvarlar ekranda örtüşmez: aynı tondakiler tek yol olur
  const by = new Map<string, Prim[]>();
  for (const { p } of out) by.set(p.fill as string, [...(by.get(p.fill as string) ?? []), p]);
  return [...by.values()].map((g) => (g.length === 1 ? g[0] : { t: 'path', d: g.map((q) => `M${(q as { pts: string }).pts.replace(/ /g, ' L')} Z`).join(' '), fill: g[0].fill as string, keep: g[0].keep }));
}

/** Dikey silindir gövdesi: soldan aydınlık yatay geçişli tek şekil. */
export function cylinder(cam: Cam, x: number, y: number, r: number, h0: number, h1: number, color: string): Prim {
  const [bx, b0] = cam.P(x, y, h0);
  const [, b1] = cam.P(x, y, h1);
  const rx = Math.max(0.4, r * cam.k);
  const ry = rx * SA;
  return {
    t: 'path', d: `${M(bx - rx, b1)} ${L(bx - rx, b0)} A${f(rx)} ${f(ry)} 0 0 0 ${f(bx + rx)} ${f(b0)} ${L(bx + rx, b1)} Z`, fill: color,
    grad: { x1: bx - rx, y1: 0, x2: bx + rx, y2: 0, stops: [[0, shade(color, 0.78)], [0.4, shade(color, 0.62)], [1, shade(color, 0.22)]] },
    keep: GOLD.test(color) || undefined,
  };
}

/** Yarım elipsoit kubbe (r yatay yarıçap, rh yükseklik); `onion`: soğan kubbe; `pointed`: sivri (Osmanlı) kubbe. */
export function domeCap(cam: Cam, x: number, y: number, r: number, h: number, rh: number, color: string, onion = false, pointed = false): Prim {
  const [bx, b] = cam.P(x, y, h);
  const rx = Math.max(0.5, r * cam.k);
  const ry = rx * SA;
  const top = cam.k * Math.sqrt((rh * CA) ** 2 + (r * SA) ** 2);
  let d: string;
  if (pointed) {
    const H = rh * CA * cam.k + ry * 0.55;
    d = `${M(bx - rx, b)} C${f(bx - rx)} ${f(b - H * 0.62)} ${f(bx - rx * 0.32)} ${f(b - H * 0.9)} ${f(bx)} ${f(b - H)} C${f(bx + rx * 0.32)} ${f(b - H * 0.9)} ${f(bx + rx)} ${f(b - H * 0.62)} ${f(bx + rx)} ${f(b)} A${f(rx)} ${f(ry)} 0 0 1 ${f(bx - rx)} ${f(b)} Z`;
  } else if (onion) {
    const H = rh * CA * cam.k + ry;
    d = `${M(bx - rx * 0.85, b)} C${f(bx - rx * 1.25)} ${f(b - H * 0.42)} ${f(bx - rx * 0.25)} ${f(b - H * 0.72)} ${f(bx)} ${f(b - H)} C${f(bx + rx * 0.25)} ${f(b - H * 0.72)} ${f(bx + rx * 1.25)} ${f(b - H * 0.42)} ${f(bx + rx * 0.85)} ${f(b)} A${f(rx * 0.85)} ${f(ry * 0.85)} 0 0 1 ${f(bx - rx * 0.85)} ${f(b)} Z`;
  } else {
    d = `${M(bx - rx, b)} A${f(rx)} ${f(top)} 0 0 1 ${f(bx + rx)} ${f(b)} A${f(rx)} ${f(ry)} 0 0 1 ${f(bx - rx)} ${f(b)} Z`;
  }
  return {
    t: 'path', d, fill: color, keep: GOLD.test(color) || undefined,
    grad: { x1: bx - rx * 0.8, y1: b - top, x2: bx + rx, y2: b + ry, stops: [[0, shade(color, 0.85)], [0.45, shade(color, 0.6)], [1, shade(color, 0.25)]] },
  };
}

/** Koni / yuvarlak tabanlı piramit. */
function coneCap(cam: Cam, x: number, y: number, r: number, h: number, rh: number, color: string): Prim {
  const [bx, b] = cam.P(x, y, h);
  const [, t] = cam.P(x, y, h + rh);
  const rx = Math.max(0.5, r * cam.k);
  const ry = rx * SA;
  // Basık koni üstten bakınca tabanının tamamı görünür
  const back = b - t < ry * 1.05 ? `A${f(rx)} ${f(ry)} 0 0 1 ${f(bx + rx)} ${f(b)}` : `${L(bx, t)} ${L(bx + rx, b)}`;
  return {
    t: 'path', d: `${M(bx - rx, b)} ${back} A${f(rx)} ${f(ry)} 0 0 1 ${f(bx - rx)} ${f(b)} Z`, fill: color, keep: GOLD.test(color) || undefined,
    grad: { x1: bx - rx, y1: 0, x2: bx + rx, y2: 0, stops: [[0, shade(color, 0.8)], [0.45, shade(color, 0.6)], [1, shade(color, 0.25)]] },
  };
}

type Face3 = { pts: [number, number, number][]; n: Pt; slope: number; color: string };
function facesPrims(cam: Cam, faces: Face3[]): Prim[] {
  return faces
    .map((fc) => {
      const c = centroid(fc.pts.map((p) => [p[0], p[1]] as Pt));
      // Eğimli yüz: yatay normal + yukarı bileşen → yataya yaklaştıkça daha aydınlık
      const l = faceLight(cam, fc.n[0], fc.n[1]) * (1 - fc.slope) + 0.78 * fc.slope;
      return { d: cam.depthOf(c[0], c[1]) + (fc.slope > 0.99 ? 1e3 : 0), p: { t: 'poly', pts: ptsStr(fc.pts.map(([x, y, h]) => cam.P(x, y, h))), fill: shade(fc.color, l), keep: GOLD.test(fc.color) || undefined } as Prim };
    })
    .sort((a, b) => a.d - b.d)
    .map((x) => x.p);
}

/** Çokgen çatılar (piramit, beşik, kırma): yüzler arkadan öne. */
function polyRoof(cam: Cam, p: Pt[], roof: Roof, hw: number, h1: number, paint: Paint): Prim[] {
  const rh = h1 - hw;
  const faces: Face3[] = [];
  const tri = (a: Pt, b: Pt, apex: [number, number, number], color: string, wallLike = false) => {
    const n: Pt = [b[1] - a[1], -(b[0] - a[0])];
    const m: Pt = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
    const run = Math.hypot(apex[0] - m[0], apex[1] - m[1]) || 0.01;
    faces.push({ pts: [[a[0], a[1], hw], [b[0], b[1], hw], apex], n, slope: wallLike ? 0 : run / (run + rh), color });
  };
  if ((roof === 'G' || roof === 'R' || roof === 'H') && p.length === 4) {
    const e = [0, 1, 2, 3].map((i) => Math.hypot(p[(i + 1) % 4][0] - p[i][0], p[(i + 1) % 4][1] - p[i][1]));
    const s = e[0] + e[2] < e[1] + e[3] ? 0 : 1; // kısa kenarlar: s ve s+2
    const mid = (i: number): Pt => [(p[i][0] + p[(i + 1) % 4][0]) / 2, (p[i][1] + p[(i + 1) % 4][1]) / 2];
    let r1 = mid(s);
    let r2 = mid(s + 2);
    if (roof === 'H') {
      const len = Math.hypot(r2[0] - r1[0], r2[1] - r1[1]);
      const inset = Math.min(len * 0.45, (e[s] + e[s + 2]) / 4);
      const ux = (r2[0] - r1[0]) / (len || 1);
      const uy = (r2[1] - r1[1]) / (len || 1);
      r1 = [r1[0] + ux * inset, r1[1] + uy * inset];
      r2 = [r2[0] - ux * inset, r2[1] - uy * inset];
    }
    const R1: [number, number, number] = [r1[0], r1[1], h1];
    const R2: [number, number, number] = [r2[0], r2[1], h1];
    // Uç yüzler (beşikte dikey alın duvarı) ve iki eğimli yüz
    tri(p[s], p[(s + 1) % 4], R1, roof === 'H' ? paint.roof : paint.wall, roof !== 'H');
    tri(p[(s + 2) % 4], p[(s + 3) % 4], R2, roof === 'H' ? paint.roof : paint.wall, roof !== 'H');
    const a = p[(s + 1) % 4], b = p[(s + 2) % 4], c = p[(s + 3) % 4], d = p[s];
    const sideN = (u: Pt, v: Pt): Pt => [v[1] - u[1], -(v[0] - u[0])];
    for (const [u, v, A, B] of [[a, b, R1, R2], [c, d, R2, R1]] as [Pt, Pt, [number, number, number], [number, number, number]][]) {
      const m: Pt = [(u[0] + v[0]) / 2, (u[1] + v[1]) / 2];
      const run = Math.hypot((A[0] + B[0]) / 2 - m[0], (A[1] + B[1]) / 2 - m[1]) || 0.01;
      faces.push({ pts: [[u[0], u[1], hw], [v[0], v[1], hw], B, A], n: sideN(u, v), slope: run / (run + rh), color: paint.roof });
    }
  } else {
    const c = centroid(p);
    const apex: [number, number, number] = [c[0], c[1], h1];
    for (let i = 0; i < p.length; i++) tri(p[i], p[(i + 1) % p.length], apex, paint.roof);
  }
  // Arkaya bakan eğimli yüzler de üstten görünür; dikey alınlar yalnız öne bakıyorsa.
  return facesPrims(cam, faces.filter((fc) => fc.slope > 0 || cam.depthOf(fc.n[0], fc.n[1]) > 0));
}

/** Tek bir dışbükey parça (ya da büyük bir parçanın dışbükey bölümü). */
function piecePrims(cam: Cam, part: Part, piece: Piece, whole: boolean, paint: Paint, base: (m: Pt) => number): Prim[] {
  const { pts, real } = piece;
  const out: Prim[] = [];
  const roof = whole ? part.roof : 'F';
  const rh = Math.min(part.rh, part.h1 - part.h0);
  const smooth = whole && part.circ && part.circ.n >= 14;
  const cx = part.circ ? part.circ.x : centroid(pts)[0];
  const cy = part.circ ? part.circ.y : centroid(pts)[1];
  const rad = part.circ ? part.circ.r : Math.max(...pts.map((q) => Math.hypot(q[0] - cx, q[1] - cy)));
  const capped = roof === 'D' || roof === 'O' || roof === 'C' || (roof === 'P' && !!part.circ && part.circ.n >= 14);
  const sloped = (roof === 'P' && !capped) || roof === 'G' || roof === 'H' || roof === 'R';
  let hw = part.h1;
  if ((capped || sloped) && rh > 0.2) hw = part.h1 - rh;
  // Tek eğimli çatı: köşe başına üst yükseklik
  let tops = pts.map(() => hw);
  if (roof === 'S' && rh > 0.1) {
    const a = (((part.rd ?? 0) * Math.PI) / 180);
    const dir: Pt = [Math.sin(a), -Math.cos(a)]; // yerel (doğu, güney)
    const s = pts.map((q) => q[0] * dir[0] + q[1] * dir[1]);
    const lo = Math.min(...s);
    const hi = Math.max(...s);
    tops = s.map((v) => part.h1 - (rh * (v - lo)) / (hi - lo || 1));
  }
  const h0 = part.h0;
  if (smooth) {
    const b = base([cx, cy]);
    if (hw > b + 0.05) out.push(cylinder(cam, cx, cy, rad, Math.max(h0, b), hw, paint.wall));
  } else {
    out.push(...walls(cam, pts, real, (m) => Math.max(h0, base(m)), tops, paint.wall, piece.convex !== false));
  }
  if (capped && rh > 0.2) {
    if (roof === 'D' || roof === 'O') out.push(domeCap(cam, cx, cy, rad, hw, rh, paint.roof, roof === 'O'));
    else out.push(coneCap(cam, cx, cy, rad, hw, rh, paint.roof));
  } else if (sloped && rh > 0.2) {
    out.push(...polyRoof(cam, pts, roof, hw, part.h1, paint));
  } else if (smooth) {
    const [bx, by] = cam.P(cx, cy, hw);
    out.push({ t: 'ell', cx: bx, cy: by, rx: Math.max(0.4, rad * cam.k), ry: Math.max(0.25, rad * cam.k * SA), fill: shade(paint.roof, 0.72), keep: GOLD.test(paint.roof) || undefined });
  } else {
    const top: Prim = { t: 'path', d: polyPath(cam, pts, tops), fill: shade(paint.roof, roof === 'S' ? 0.62 : 0.72), keep: GOLD.test(paint.roof) || undefined };
    if (paint.edge && whole && cam.k >= 0.5 && Math.abs(signedArea(pts)) * cam.k * cam.k > 900) Object.assign(top, { stroke: shade(paint.roof, 0.45), sw: 0.5 });
    out.push(top);
  }
  return out;
}

// ───────────────────────── Minare (katlardan silüet) ─────────────────────────

export type Tier = { h0: number; h1: number; r: number; off: Pt; roof: Roof; rh: number; color: string; out: number };
export type Tower = { x: number; y: number; base: number; top: number; tiers: Tier[] };

/**
 * Minare: OSM'deki silindir katlarının (gövde, şerefe, kameriye sütunları, külah, alem) yarıçap
 * profilinden basamaklı tek silüet; aynı renkli ardışık katlar tek şekil olur.
 */
export function towerPrims(cam: Cam, t: Tower, from: number): Prim[] {
  const k = cam.k;
  const [bx] = cam.P(t.x, t.y, 0);
  const Y = (h: number) => cam.P(t.x, t.y, h)[1];
  const out: Prim[] = [];
  // Merkezdeki katlar ve çevresine dizilmiş parçalar (dış yarıçaplarıyla) gövdeyi oluşturur
  const solid = t.tiers.filter((s) => s.r >= 0.75).map((s) => {
    const o = Math.hypot(s.off[0], s.off[1]);
    return o < 1.2 ? s : { ...s, r: s.out * 0.92, roof: 'F' as Roof, rh: 0 };
  });
  const cols = t.tiers.filter((s) => s.r < 0.75 && Math.hypot(s.off[0], s.off[1]) >= 1.2);
  const thin = t.tiers.filter((s) => s.r < 0.75 && Math.hypot(s.off[0], s.off[1]) < 1.2);
  const capOf = (s: Tier) => (s.roof === 'D' || s.roof === 'O' || s.roof === 'C' || s.roof === 'P') && s.rh > 0.3;
  const wallTop = (s: Tier) => (capOf(s) ? s.h1 - s.rh : s.h1);
  const cuts = [...new Set([from, ...solid.flatMap((s) => [s.h0, wallTop(s)]), ...cols.flatMap((s) => [s.h0, s.h1])])].filter((h) => h >= from).sort((a, b) => a - b);
  type Band = { a: number; b: number; r: number; color: string; open: boolean };
  const bands: Band[] = [];
  for (let i = 0; i + 1 < cuts.length; i++) {
    const a = cuts[i];
    const b = cuts[i + 1];
    const m = (a + b) / 2;
    let best: Tier | null = null;
    for (const s of solid) if (s.h0 <= m && wallTop(s) >= m && (!best || s.r > best.r)) best = s;
    if (best) { bands.push({ a, b, r: best.r, color: best.color, open: false }); continue; }
    const cs = cols.filter((s) => s.h0 <= m && s.h1 >= m);
    if (cs.length) { bands.push({ a, b, r: Math.max(...cs.map((s) => Math.hypot(s.off[0], s.off[1]) + s.r)), color: cs[0].color, open: true }); continue; }
    // OSM'de gövdesi boş bırakılmış aralık: alt ve üst katların daha incesiyle gövdeyi sürdür
    const below = solid.filter((s) => wallTop(s) <= a + 0.01).sort((p, q) => wallTop(q) - wallTop(p))[0];
    const above = solid.filter((s) => s.h0 >= b - 0.01).sort((p, q) => p.h0 - q.h0)[0];
    const rs = [below?.r, above?.r].filter((v): v is number => !!v);
    if (rs.length && m < t.top - 3) bands.push({ a, b, r: Math.max(1.6, Math.min(...rs) * 0.75), color: (above ?? below)!.color, open: false });
  }
  // Aynı renkli ardışık bantlar → basamaklı tek silüet
  for (let i = 0; i < bands.length;) {
    let j = i;
    while (j + 1 < bands.length && bands[j + 1].color === bands[i].color && bands[j + 1].open === bands[i].open && Math.abs(bands[j + 1].a - bands[j].b) < 0.01) j++;
    const run = bands.slice(i, j + 1);
    const w = Math.max(...run.map((s) => s.r)) * k;
    const left = run.flatMap((s) => [[bx - s.r * k, Y(s.a)], [bx - s.r * k, Y(s.b)]]);
    const right = [...run].reverse().flatMap((s) => [[bx + s.r * k, Y(s.b)], [bx + s.r * k, Y(s.a)]]);
    const d = [...left, ...right].map(([px, py], n) => (n ? L : M)(px, py)).join(' ') + ' Z';
    const c = run[0].color;
    if (run[0].open) {
      out.push({ t: 'path', d, fill: mixHex(c, '#5E564A', 0.55), nfill: '#F3D27A' });
    } else {
      out.push({ t: 'path', d, fill: c, keep: GOLD.test(c) || undefined, grad: { x1: bx - w, y1: 0, x2: bx + w, y2: 0, stops: [[0, shade(c, 0.8)], [0.42, shade(c, 0.62)], [1, shade(c, 0.24)]] } });
    }
    i = j + 1;
  }
  // Şerefe döşemeleri: üstteki bant daralıyorsa açık renkli elips kenar
  if (k >= 0.9) {
    const ledges: string[] = [];
    for (let i = 0; i + 1 < bands.length; i++) {
      if (bands[i + 1].r < bands[i].r - 0.25 && !bands[i].open) {
        const rx = bands[i].r * k;
        const ry = rx * SA;
        const y = Y(bands[i].b);
        ledges.push(`${M(bx - rx, y)} A${f(rx)} ${f(ry)} 0 0 1 ${f(bx + rx)} ${f(y)} A${f(rx)} ${f(ry)} 0 0 1 ${f(bx - rx)} ${f(y)} Z`);
      }
    }
    if (ledges.length) out.push({ t: 'path', d: ledges.join(' '), fill: '#F4F1EA' });
  }
  // Kameriye sütunları (öndekiler)
  if (cols.length && k >= 1.1) {
    const d: string[] = [];
    for (const s of cols) {
      if (s.off[0] * cam.st + s.off[1] * cam.ct < -0.3) continue;
      const sx = bx + (s.off[0] * cam.ct - s.off[1] * cam.st) * k;
      d.push(`${M(sx, Y(s.h0))} ${L(sx, Y(s.h1))}`);
    }
    if (d.length) out.push({ t: 'path', d: d.join(' '), stroke: '#FBFAF6', sw: Math.max(0.6, 0.5 * k), fill: 'none' });
  }
  // Külah / kubbe
  for (const s of solid.filter(capOf)) {
    if (s.r * k < 0.3) continue;
    if (s.roof === 'D' || s.roof === 'O') out.push(domeCap(cam, t.x, t.y, s.r, wallTop(s), s.rh, s.color, s.roof === 'O'));
    else out.push(coneCap(cam, t.x, t.y, s.r, wallTop(s), s.rh, s.color));
  }
  // Alem ve hilâl
  const fin = thin.filter((s) => s.h0 >= t.top - 25);
  const finTop = Math.max(t.top, ...fin.map((s) => s.h1));
  const finBot = fin.length ? Math.min(...fin.map((s) => s.h0)) : t.top;
  if (finTop > finBot + 0.5) out.push({ t: 'path', d: `${M(bx, Y(finBot))} ${L(bx, Y(finTop))}`, stroke: '#C9A227', sw: Math.max(0.7, 0.45 * k), fill: 'none', keep: true });
  const r = Math.max(1, 1.1 * k);
  const cy = Y(finTop) - r * 0.9;
  out.push({ t: 'path', d: `${M(bx - r, cy)} A${f(r)} ${f(r)} 0 0 0 ${f(bx + r)} ${f(cy)} A${f(r * 1.3)} ${f(r * 1.3)} 0 0 1 ${f(bx - r)} ${f(cy)} Z`, fill: '#D4AF37', keep: true });
  return out;
}

/** Minareleri katlarından bulur: tabanı alçak, ince ve yüksek silindir kümeleri. */
export function findTowers(parts: Part[], minTop = 55, maxBase = 50): { towers: Tower[]; used: Set<Part> } {
  const rOf = (p: Part) => {
    const c = p.circ ? ([p.circ.x, p.circ.y] as Pt) : centroid(p.pts);
    return { c, r: p.circ ? p.circ.r : Math.max(...p.pts.map((q) => Math.hypot(q[0] - c[0], q[1] - c[1]))) };
  };
  const seeds = parts.filter((p) => p.circ && p.h0 < 130 && p.circ.r >= 2 && p.circ.r <= 8.6);
  const groups: { c: Pt; seeds: Part[] }[] = [];
  for (const s of seeds) {
    const { c } = rOf(s);
    const g = groups.find((q) => Math.hypot(q.c[0] - c[0], q.c[1] - c[1]) < 6);
    if (g) g.seeds.push(s); else groups.push({ c, seeds: [s] });
  }
  const towers: Tower[] = [];
  const used = new Set<Part>();
  for (const g of groups) {
    const near = parts.filter((p) => {
      const { c, r } = rOf(p);
      return !used.has(p) && r < 9 && p.h1 <= 200 && Math.hypot(c[0] - g.c[0], c[1] - g.c[1]) < 12;
    });
    if (near.length < 6) continue;
    const base = Math.min(...near.map((p) => p.h0));
    if (base > maxBase) continue;
    const members = near;
    const top = Math.max(...members.map((p) => p.h1));
    if (top < minTop) continue;
    members.forEach((p) => used.add(p));
    towers.push({
      x: g.c[0], y: g.c[1], base, top,
      tiers: members.map((p) => {
        const { c, r } = rOf(p);
        const out = Math.max(...p.pts.map((q) => Math.hypot(q[0] - g.c[0], q[1] - g.c[1])));
        return { h0: p.h0, h1: p.h1, r, off: [c[0] - g.c[0], c[1] - g.c[1]] as Pt, roof: p.roof, rh: p.rh, color: p.wall ?? p.roofC ?? '#EEEAE2', out };
      }),
    });
  }
  return { towers, used };
}

// ───────────────────────── Sahne modeli ve sıralama ─────────────────────────

/** Çizim birimi: dışbükey taban izi, yükseklik aralığı ve kameraya göre çizim işlevi. */
export type Item = {
  fp: Pt[];
  h0: number;
  h1: number;
  /** Ekranda bir pikselden küçükse atlamak için yaklaşık boyut (m). */
  size: number;
  draw: (cam: Cam) => Prim[];
  ghost?: boolean;
};

/** Ana kütle: dış hat halkaları (+ iç avlular) tek yükseklikte, düz çatılı. */
export type Mass = {
  outer: Pt[][];
  holes: Pt[][];
  h: number;
  wall: string;
  roof: string;
  /** Duvarlar çizildikten sonra (cephe süslemeleri). */
  decorate?: (cam: Cam, walls: Wall[]) => Prim[];
  /** Avlu zemini ve Kâbe gibi avlunun içindekiler. */
  floor?: (cam: Cam) => Prim[];
};

export type Model = {
  mass: Mass | null;
  items: Item[];
  /** Avlunun içindeki çizim birimleri (duvarlarla çatı arasında çizilir). */
  court: Item[];
  orders: Map<number, { main: number[]; court: number[] }>;
};

const inMass = (m: Mass, p: Pt) => m.outer.some((o) => pointInPoly(p, o)) && !m.holes.some((h) => pointInPoly(p, h));
export const insideMass = inMass;

export type BuildOpts = {
  data: Osm3d;
  /** Dış hat halkaları ve yüksekliği; yoksa en büyük parça ana kütle olur. */
  mass?: Omit<Mass, 'outer' | 'holes'> | null;
  massFromLargest?: { minArea: number; wall: string; roof: string; decorate?: Mass['decorate'] };
  paint: (p: Part) => Paint;
  skip?: (p: Part) => boolean;
  /** Parçaya özel ek çizim (ör. saat kadranları). */
  extra?: (cam: Cam, p: Part) => Prim[];
  /** `fromTiers`: OSM katlarından; `marks`: veri dosyasındaki minare noktalarından (genel minare çizimi). */
  towers?: { fromTiers?: boolean; marks?: boolean; tone?: (c: string) => string };
  /** Ek çizim birimleri (Kâbe, şemsiyeler…). */
  more?: Item[];
  ghost?: (c: Pt, p: Part | null) => boolean;
};

export function buildModel(o: BuildOpts): Model {
  let parts = o.data.parts.filter((p) => p.h1 - p.h0 > 0.05 && p.pts.length >= 3 && !o.skip?.(p));
  let mass: Mass | null = null;
  if (o.data.outer.length && o.mass) {
    mass = { ...o.mass, outer: o.data.outer.map(clean), holes: o.data.inner.map(clean) };
  } else if (o.massFromLargest) {
    const big = parts.reduce<Part | null>((a, p) => (!a || Math.abs(signedArea(p.pts)) > Math.abs(signedArea(a.pts)) ? p : a), null);
    if (big && Math.abs(signedArea(big.pts)) >= o.massFromLargest.minArea) {
      mass = { h: big.h1, wall: o.massFromLargest.wall, roof: o.massFromLargest.roof, decorate: o.massFromLargest.decorate, outer: [clean(big.pts)], holes: [] };
      parts = parts.filter((p) => p !== big);
    }
  }
  const items: Item[] = [];
  const court: Item[] = [];
  const massH = mass?.h ?? 0;
  const baseAt = (m: Pt) => (mass && inMass(mass, m) ? massH : 0);

  // Minareler
  if (o.towers?.fromTiers) {
    const { towers, used } = findTowers(parts);
    parts = parts.filter((p) => !used.has(p));
    for (const t of towers) {
      if (o.towers.tone) t.tiers = t.tiers.map((s) => ({ ...s, color: o.towers!.tone!(s.color) }));
      const r = Math.max(...t.tiers.map((s) => s.out));
      const from = Math.max(t.base, baseAt([t.x, t.y]));
      items.push({ fp: circlePoly(t.x, t.y, r), h0: t.base, h1: t.top, size: r, draw: (cam) => towerPrims(cam, t, from), ghost: o.ghost?.([t.x, t.y], null) });
    }
  }

  if (o.towers?.marks) {
    for (const [x, y, h] of o.data.marks) {
      // Minarenin OSM'deki kare taban izi yerine silüet çizilir
      parts = parts.filter((p) => !(p.h0 < 0.5 && Math.abs(p.h1 - h) < 1.5 && Math.hypot(centroid(p.pts)[0] - x, centroid(p.pts)[1] - y) < 8));
      const from = baseAt([x, y]);
      items.push({ fp: circlePoly(x, y, 3.2), h0: 0, h1: h, size: 4, draw: (cam) => minaret(cam, x, y, h, from), ghost: o.ghost?.([x, y], null) });
    }
  }

  for (const p of parts) {
    const c = p.circ ? ([p.circ.x, p.circ.y] as Pt) : centroid(p.pts);
    const pieces = convexPieces(p.pts);
    const whole = pieces.length === 1 && pieces[0].convex !== false;
    // Ana kütlenin içinde kalan ve ondan alçak parçalar görünmez
    if (mass && p.h1 <= massH + 0.05 && p.pts.every((q) => inMass(mass, q))) continue;
    // Çatıda "havada" duran büyük döşemeler (OSM'de min_height boşluk bırakmış) çatıya oturtulur
    let part = p;
    if (mass && p.h0 > massH + 0.5 && Math.abs(signedArea(p.pts)) > 1500 && inMass(mass, c)) part = { ...p, h0: massH };
    const paint = o.paint(part);
    const inCourt = !!mass && mass.holes.some((h) => pointInPoly(c, h));
    const ghost = o.ghost?.(c, p);
    for (const pc of pieces) {
      const size = Math.max(...pc.pts.map((q) => Math.hypot(q[0] - c[0], q[1] - c[1])), part.h1 - part.h0) ;
      const it: Item = {
        fp: pc.convex === false ? hull(pc.pts) : pc.pts, h0: part.h0, h1: part.h1, size,
        draw: (cam) => {
          const pr = piecePrims(cam, part, pc, whole, paint, baseAt);
          if (o.extra && whole) pr.push(...o.extra(cam, part));
          return pr;
        },
        ghost,
      };
      (inCourt ? court : items).push(it);
    }
  }
  for (const it of o.more ?? []) {
    const c = centroid(it.fp);
    (mass && mass.holes.some((h) => pointInPoly(c, h)) ? court : items).push(it);
  }
  return { mass, items, court, orders: new Map() };
}

export function circlePoly(x: number, y: number, r: number, n = 10): Pt[] {
  return Array.from({ length: n }, (_, i) => [x + r * Math.cos((2 * Math.PI * i) / n), y + r * Math.sin((2 * Math.PI * i) / n)] as Pt);
}

/** Birim ölçekte ekran sınır kutusu (yalnız dönüşe bağlı). */
function sbox(cam: Cam, fp: Pt[], h0: number, h1: number) {
  let u0 = Infinity, u1 = -Infinity, v0 = Infinity, v1 = -Infinity;
  for (const [x, y] of fp) {
    const u = x * cam.ct - y * cam.st;
    const d = SA * (x * cam.st + y * cam.ct);
    u0 = Math.min(u0, u); u1 = Math.max(u1, u);
    v0 = Math.min(v0, d - CA * h1); v1 = Math.max(v1, d - CA * h0);
  }
  return [u0, v0, u1, v1];
}

/** Kısıtlı topolojik sıralama (döngüde en arkadakini öne alır). */
function sortItems(cam: Cam, list: Item[], mass: Mass | null): number[] {
  const n = list.length + (mass ? 1 : 0);
  const MI = list.length; // kütlenin indisi
  const depth = (v: Pt) => cam.depthOf(v[0], v[1]);
  const fpOf = (i: number) => (i === MI ? mass!.outer.flat() : list[i].fp);
  const boxes = Array.from({ length: n }, (_, i) => (i === MI ? sbox(cam, mass!.outer.flat(), 0, mass!.h) : sbox(cam, list[i].fp, list[i].h0, list[i].h1)));
  const key = Array.from({ length: n }, (_, i) => {
    const c = centroid(fpOf(i));
    return depth(c);
  });
  const after: number[][] = Array.from({ length: n }, () => []);
  const indeg = new Array(n).fill(0);
  const edge = (a: number, b: number) => { after[a].push(b); indeg[b]++; }; // a önce
  const rings = mass ? [...mass.outer, ...mass.holes] : [];
  const massHull = mass ? hull(mass.outer.flat()) : [];
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const A = boxes[i];
      const B = boxes[j];
      if (A[2] < B[0] - 0.2 || B[2] < A[0] - 0.2 || A[3] < B[1] - 0.2 || B[3] < A[1] - 0.2) continue;
      if (i === MI || j === MI) {
        const o = i === MI ? j : i;
        const it = list[o];
        const c = centroid(it.fp);
        const over = inMass(mass!, c) || it.fp.some((q) => inMass(mass!, q));
        let massFirst: boolean;
        if (over) massFirst = true;
        else {
          // Kütlenin dışbükey zarfının dışındaysa zarfla ayırıcı eksen yeter (ucuz); içindeyse en yakın nokta
          const sep = separate(massHull, it.fp, depth);
          const v = sep ?? closestVec(it.fp, rings);
          const d = depth(v);
          if (Math.abs(d) < 1e-6) continue;
          massFirst = d > 0;
        }
        if (massFirst) edge(MI, o); else edge(o, MI);
        continue;
      }
      const dir = separate(list[i].fp, list[j].fp, depth);
      if (!dir) {
        const a = list[i];
        const b = list[j];
        if (a.h0 < b.h0 - 0.01 || (Math.abs(a.h0 - b.h0) <= 0.01 && a.h1 <= b.h1)) edge(i, j); else edge(j, i);
        continue;
      }
      const d = depth(dir);
      if (d > 1e-4) edge(i, j);
      else if (d < -1e-4) edge(j, i);
    }
  }
  const done = new Array(n).fill(false);
  const res: number[] = [];
  for (let step = 0; step < n; step++) {
    let pick = -1;
    for (let i = 0; i < n; i++) if (!done[i] && indeg[i] === 0 && (pick < 0 || key[i] < key[pick])) pick = i;
    if (pick < 0) for (let i = 0; i < n; i++) if (!done[i] && (pick < 0 || key[i] < key[pick])) pick = i; // döngü
    done[pick] = true;
    res.push(pick);
    for (const b of after[pick]) indeg[b]--;
  }
  return res;
}

/** Modeli kameraya göre çizer: `below` normal sırayla, `ghost` (yarı saydam katman) önde kalan uzak yapılar. */
export function drawModel(cam: Cam, m: Model): { below: Prim[]; ghost: Prim[] } {
  const rk = Math.round(cam.rotDeg * 10);
  let ord = m.orders.get(rk);
  if (!ord) {
    ord = { main: sortItems(cam, m.items, m.mass), court: sortItems(cam, m.court, null) };
    if (m.orders.size > 24) m.orders.clear();
    m.orders.set(rk, ord);
  }
  const below: Prim[] = [];
  const ghost: Prim[] = [];
  const tiny = 1.2 / cam.k; // ~1 pikselin altındaki ayrıntılar atlanır
  const visible = (it: Item) => it.size >= tiny;
  for (const i of ord.main) {
    if (i === m.items.length && m.mass) {
      below.push(...massPrims(cam, m.mass, () => {
        const cp: Prim[] = [];
        for (const j of ord!.court) if (visible(m.court[j])) cp.push(...m.court[j].draw(cam));
        return cp;
      }));
      continue;
    }
    const it = m.items[i];
    if (!visible(it)) continue;
    // Uzak yapı (ör. Saat Kulesi) yalnız izleyiciyle mescit arasında kalıyorsa yarı saydam katmana gider
    const c = centroid(it.fp);
    const asGhost = !!it.ghost && cam.depthOf(c[0], c[1]) > 60;
    if (asGhost && it.size * cam.k < 3) continue; // yarı saydam katmanda küçük ayrıntılar görünmez
    (asGhost ? ghost : below).push(...it.draw(cam));
  }
  return { below: mergePrims(below), ghost: mergePrims(ghost) };
}

/** Ana kütle: görünen tüm duvarlar → cephe süsü → avlu içi → çatı. */
function massPrims(cam: Cam, m: Mass, court: () => Prim[]): Prim[] {
  const out: Prim[] = [];
  if (m.floor) out.push(...m.floor(cam));
  const all: Wall[] = [];
  for (const o of m.outer) all.push(...visibleWalls(cam, o, m.holes.filter((h) => pointInPoly(centroid(h), o))));
  all.sort((a, b) => a.d - b.d);
  for (const w of all) {
    out.push({ t: 'poly', pts: ptsStr([cam.P(w.a[0], w.a[1], 0), cam.P(w.b[0], w.b[1], 0), cam.P(w.b[0], w.b[1], m.h), cam.P(w.a[0], w.a[1], m.h)]), fill: shade(m.wall, w.light) });
  }
  if (m.decorate) out.push(...m.decorate(cam, all));
  out.push(...court());
  const d = [...m.outer, ...m.holes].map((r) => polyPath(cam, r, m.h)).join(' ');
  out.push({ t: 'path', d, fill: m.roof, stroke: shade(m.roof, 0.42), sw: 0.7, rule: 'evenodd' });
  return out;
}

export type ArcadeRow = { h0: number; h1: number; w: number; step: number };

/**
 * Cephe kemer dizileri ve saçak: ışık düzeyine göre gruplanmış birkaç yol (çok sayıda duvarda da hafif).
 * Pencereler gece (koyu tema) içeriden aydınlanmış görünür.
 */
export function arcades(cam: Cam, ws: Wall[], height: number, rows: ArcadeRow[], skipNear?: (p: Pt) => boolean): Prim[] {
  const k = cam.k;
  if (k < 0.45) return [];
  const arch = k >= 1.6;
  const buckets = new Map<number, string[]>();
  const cornice: string[] = [];
  for (const w of ws) {
    if (w.len < 2) continue;
    const t: Pt = [(w.b[0] - w.a[0]) / w.len, (w.b[1] - w.a[1]) / w.len];
    const at = (u: number, h: number) => cam.P(w.a[0] + t[0] * u, w.a[1] + t[1] * u, h);
    const shape = (pts: [number, number][]) => pts.map(([u, h], i) => { const [x, y] = at(u, h); return (i ? L : M)(x, y); }).join(' ') + ' Z';
    if (k >= 0.6) {
      const q = Math.round(w.light * 5) / 5;
      for (const r of rows) {
        if (r.w * k < 1 || r.h1 > height) continue;
        const n = Math.floor((w.len - 3) / r.step);
        if (n < 1) continue;
        const u0 = (w.len - (n - 1) * r.step) / 2;
        const hw = r.w / 2;
        for (let i = 0; i < n; i++) {
          const u = u0 + i * r.step;
          if (skipNear?.([w.a[0] + t[0] * u, w.a[1] + t[1] * u])) continue;
          const d = shape(arch
            ? [[u - hw, r.h0], [u + hw, r.h0], [u + hw, r.h1 - r.w * 0.55], [u + hw * 0.55, r.h1 - r.w * 0.12], [u, r.h1], [u - hw * 0.55, r.h1 - r.w * 0.12], [u - hw, r.h1 - r.w * 0.55]]
            : [[u - hw, r.h0], [u + hw, r.h0], [u + hw, r.h1], [u - hw, r.h1]]);
          const b = buckets.get(q) ?? [];
          b.push(d);
          buckets.set(q, b);
        }
      }
    }
    const [ax, ay] = at(0, height - 1.4);
    const [bx, by] = at(w.len, height - 1.4);
    cornice.push(`${M(ax, ay)} ${L(bx, by)}`);
  }
  const out: Prim[] = [];
  for (const [q, d] of [...buckets.entries()].sort((a, b) => a[0] - b[0])) {
    out.push({ t: 'path', d: d.join(' '), fill: mixHex('#988D7B', '#C4BAA8', q), nfill: mixHex('#C98F3A', '#F4CE78', q) });
  }
  if (cornice.length) out.push({ t: 'path', d: cornice.join(' '), stroke: '#B3A894', sw: Math.max(0.5, 0.8 * k), fill: 'none' });
  return out;
}
