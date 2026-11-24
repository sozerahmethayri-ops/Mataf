// Beytullah — Kâbe-i Muazzama'nın ayrıntılı 3D modeli (gerçek ölçü ve yön; harita ve tavaf asistanı ortak kullanır).
//
// Ölçüler (yaklaşık, yayımlanmış değerler): duvarlar 12,86 m (kapı duvarı ve karşısı) × 11,03 m, yükseklik 13,1 m.
// Kuşak (hizâm) yerden ~8,5–9,5 m, kapı yerden 2,2 m yüksekte ve Hacerü'l-Esved köşesine yakın,
// Hacerü'l-Esved yerden ~1,1–1,5 m, Şâzervân (mermer etek) Hatîm tarafı hariç üç yanda,
// Mîzâb (altın oluk) Hatîm duvarının üstünde, Hicr duvarı ~1,3 m yüksek, Makam-ı İbrâhîm kapının karşısında.
//
// Işık ekrana göre sabittir (sol önden): kullanıcı Kâbe'nin etrafında dönse de görünüm hep okunaklı kalır.
// Ressam sıralaması harita hangi açıya dönerse dönsün doğrudur: dışbükey kutunun bir yüzü izleyiciye
// bakıyorsa o yüzün dışındaki her şey (Hatîm, Makam, oluk) kutunun önünde kalır, bakmıyorsa arkasında.
import { CORNERS, DOOR, KAABA, KAABA_POLY, MAQAM, hijrBand } from '@/services/tawaf';
import type { Pt } from '@/data/sites';
import { Cam, CA, ptsStr, type Grad, type Prim } from './oblique';

const H = KAABA.height;
const BAND: [number, number] = [8.5, 9.45];

// ── Renkler ──
const KISWA_D = '#0B0B0E';
const KISWA_L = '#3B3C44';
const GOLD_D = '#8A680E';
const GOLD_L = '#EAC95A';
const GOLD_HI = '#FBEBB0';
const INK = '#1C1606'; // altın işlemenin arasındaki siyah ipek
const MARBLE_D = '#C9C3B7';
const MARBLE_L = '#F7F5F0';

function mix(a: string, b: string, t: number) {
  const p = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const [x, y] = [p(a), p(b)];
  return `#${x.map((v, i) => Math.round(v + (y[i] - v) * Math.min(1, Math.max(0, t))).toString(16).padStart(2, '0')).join('')}`;
}
function rng(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const f1 = (v: number) => v.toFixed(1);

type Face = {
  id: 'ne' | 'nw' | 'sw' | 'se';
  a: Pt; b: Pt; t: Pt; n: Pt; len: number;
  front: boolean; light: number;
};

/** Yüzün ekrana göre aydınlığı (0–1): sol önden gelen ışık. */
function lightOf(cam: Cam, n: Pt) {
  const sx = n[0] * cam.ct - n[1] * cam.st; // ekranda sağa doğru bileşen
  const sd = n[0] * cam.st + n[1] * cam.ct; // izleyiciye doğru bileşen
  return Math.max(0, Math.min(1, 0.5 + 0.5 * (-0.62 * sx + 0.78 * sd)));
}

function faces(cam: Cam): Face[] {
  const ids: Face['id'][] = ['ne', 'nw', 'sw', 'se'];
  return KAABA_POLY.map((a, i) => {
    const b = KAABA_POLY[(i + 1) % 4];
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const t: Pt = [(b[0] - a[0]) / len, (b[1] - a[1]) / len];
    let n: Pt = [t[1], -t[0]];
    const mid: Pt = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
    if (n[0] * mid[0] + n[1] * mid[1] < 0) n = [-n[0], -n[1]];
    return { id: ids[i], a, b, t, n, len, front: cam.depthOf(n[0], n[1]) > 1e-6, light: lightOf(cam, n) };
  });
}

export type KaabaParts = {
  /** Zemine çizilenler (gölge, Hicr'in içi): sahnedeki 3D cisimlerden önce. */
  under: Prim[];
  /** Kâbe, Hatîm duvarı, Makam ve oluk — kendi içinde doğru sırada. */
  body: Prim[];
  /** Kâbe'nin izleyiciye en yakın noktasının derinliği (başka cisimleri önüne/arkasına koymak için). */
  frontDepth: number;
};

export function buildKaaba(cam: Cam, opts: { hijr?: boolean; maqam?: boolean; shadow?: boolean } = {}): KaabaParts {
  const { hijr = true, maqam = true, shadow = true } = opts;
  const k = cam.k; // piksel / metre: ayrıntı düzeyi buna göre
  const P = (p: Pt, h: number) => cam.P(p[0], p[1], h);
  const F = faces(cam);
  const at = (fc: Face, u: number): Pt => [fc.a[0] + fc.t[0] * u, fc.a[1] + fc.t[1] * u];
  const Q = (fc: Face, u: number, h: number) => P(at(fc, u), h);
  const quad = (fc: Face, u0: number, u1: number, h0: number, h1: number) => [Q(fc, u0, h0), Q(fc, u1, h0), Q(fc, u1, h1), Q(fc, u0, h1)];
  const vgrad = (fc: Face, u: number, hTop: number, hBot: number, stops: Grad['stops']): Grad => {
    const [x1, y1] = Q(fc, u, hTop);
    const [x2, y2] = Q(fc, u, hBot);
    return { x1, y1, x2, y2, stops };
  };
  const facePath = (fc: Face, pts: [number, number][]) =>
    pts.map(([u, h], i) => { const [x, y] = Q(fc, u, h); return `${i ? 'L' : 'M'}${f1(x)} ${f1(y)}`; }).join(' ');

  const under: Prim[] = [];
  const body: Prim[] = [];

  // ── Zemin: Hicr'in iç zemini, sonra yumuşak gölge (ışığın tersine, ekranda sağ arkaya) ──
  const hb = hijrBand();
  if (hijr) under.push({ t: 'poly', pts: ptsStr([...hb.inner, CORNERS.shami, CORNERS.iraqi].map((p) => P(p, 0))), fill: '#EFEBE3' });
  if (shadow) {
    const right: Pt = [cam.ct, -cam.st];
    const back: Pt = [-cam.st, -cam.ct];
    for (const [len, op] of [[9.5, 0.07], [6.5, 0.1]] as const) {
      const s: Pt = [(right[0] * 0.55 + back[0] * 0.83) * len, (right[1] * 0.55 + back[1] * 0.83) * len];
      const hull = convexHull([...KAABA_POLY, ...KAABA_POLY.map(([x, y]) => [x + s[0], y + s[1]] as Pt)].map((p) => P(p, 0)));
      under.push({ t: 'poly', pts: ptsStr(hull), fill: '#3A2E1E', op, keep: true });
    }
    under.push({ t: 'poly', pts: ptsStr(offsetPoly(KAABA_POLY, 0.9).map((p) => P(p, 0))), fill: '#2A2218', op: 0.08, keep: true });
  }

  // ── Hicr-i İsmâil (Hatîm) ──
  const nwFace = F.find((fc) => fc.id === 'nw')!;
  const hijrPrims: Prim[] = [];
  if (hijr) {
    hijrPrims.push(...hijrWall(cam, hb, k));
  }

  // ── Makam-ı İbrâhîm ──
  const maqamPrims = maqam ? maqamModel(cam, k) : [];

  // ── Mîzâb (altın oluk): Hatîm duvarının ortasında, çatı hizasından dışarı ──
  const mizab: Prim[] = [];
  {
    const u = nwFace.len / 2;
    const w = 0.24;
    const root0 = at(nwFace, u - w), root1 = at(nwFace, u + w);
    const out = (p: Pt, d: number): Pt => [p[0] + nwFace.n[0] * d, p[1] + nwFace.n[1] * d];
    const L = 2.3;
    if (nwFace.front && k >= 3) {
      // Oluğun duvara düşen gölgesi
      mizab.push({ t: 'poly', pts: ptsStr([P(root0, 12.55), P(root1, 12.55), P(root1, 11.7), P(root0, 11.7)]), fill: '#000000', op: 0.35, keep: true });
    }
    // Yan yüz (koyu altın) ve üst yüz (parlak altın)
    mizab.push({ t: 'poly', pts: ptsStr([P(root0, 12.75), P(out(root0, L), 12.45), P(out(root0, L), 12.2), P(root0, 12.5)]), fill: GOLD_D, keep: true });
    mizab.push({ t: 'poly', pts: ptsStr([P(root1, 12.75), P(out(root1, L), 12.45), P(out(root1, L), 12.2), P(root1, 12.5)]), fill: GOLD_D, keep: true });
    mizab.push({ t: 'poly', pts: ptsStr([P(root0, 12.75), P(root1, 12.75), P(out(root1, L), 12.45), P(out(root0, L), 12.45)]), fill: GOLD_L, stroke: GOLD_D, sw: Math.max(0.4, 0.04 * k), keep: true });
  }

  const nwFront = nwFace.front;
  const neFront = F.find((fc) => fc.id === 'ne')!.front;
  if (hijr && !nwFront) body.push(...hijrPrims);
  if (maqam && !neFront) body.push(...maqamPrims);
  if (!nwFront) body.push(...mizab);

  // ── Şâzervân: Hatîm tarafı hariç üç yanda mermer etek (0,3 m yüksek, 0,45 m dışa eğimli) ──
  const skirt = (fc: Face) => {
    if (fc.id === 'nw') return null;
    const o = 0.45;
    const prevN = F[(F.indexOf(fc) + 3) % 4].n;
    const nextN = F[(F.indexOf(fc) + 1) % 4].n;
    // Hatîm duvarına komşu uçlarda gönye yok (etek orada biter)
    const ca: Pt = F[(F.indexOf(fc) + 3) % 4].id === 'nw' ? [fc.a[0] + fc.n[0] * o, fc.a[1] + fc.n[1] * o] : [fc.a[0] + (fc.n[0] + prevN[0]) * o, fc.a[1] + (fc.n[1] + prevN[1]) * o];
    const cb: Pt = F[(F.indexOf(fc) + 1) % 4].id === 'nw' ? [fc.b[0] + fc.n[0] * o, fc.b[1] + fc.n[1] * o] : [fc.b[0] + (fc.n[0] + nextN[0]) * o, fc.b[1] + (fc.n[1] + nextN[1]) * o];
    const c = mix(MARBLE_D, MARBLE_L, 0.55 + 0.45 * fc.light);
    const prims: Prim[] = [{ t: 'poly', pts: ptsStr([P(ca, 0), P(cb, 0), P(fc.b, 0.32), P(fc.a, 0.32)]), fill: c, stroke: mix(MARBLE_D, '#9E978A', 0.4), sw: Math.max(0.3, 0.025 * k) }];
    if (k >= 6) {
      // Pirinç halkalar (örtünün bağlandığı)
      for (let u = 0.8; u < fc.len - 0.5; u += 1.6) {
        const [x, y] = P([fc.a[0] + fc.t[0] * u + fc.n[0] * 0.2, fc.a[1] + fc.t[1] * u + fc.n[1] * 0.2], 0.2);
        prims.push({ t: 'circ', cx: x, cy: y, r: Math.max(0.6, 0.07 * k), fill: '#B8913A', keep: true });
      }
    }
    return prims;
  };
  for (const fc of F) if (!fc.front) body.push(...(skirt(fc) ?? []));

  // ── Duvarlar (örtü: kisve) ──
  for (const fc of F) {
    if (!fc.front) continue;
    body.push(...wall(fc));
  }
  for (const fc of F) if (fc.front) body.push(...(skirt(fc) ?? []));

  // ── Çatı: kenarda siyah örtü kıvrımı, içi açık renk mermer ──
  body.push({ t: 'poly', pts: ptsStr(KAABA_POLY.map((p) => P(p, H))), fill: '#1A1A1F', keep: true });
  const roofIn = offsetPoly(KAABA_POLY, -0.4);
  {
    const ps = roofIn.map((p) => P(p, H));
    const ys = ps.map((p) => p[1]);
    body.push({
      t: 'poly', pts: ptsStr(ps), fill: '#E9E6DF',
      grad: { x1: 0, y1: Math.min(...ys), x2: 0, y2: Math.max(...ys), stops: [[0, '#D6D1C6'], [1, '#F1EEE7']] },
      stroke: '#B9B2A5', sw: Math.max(0.4, 0.04 * k),
    });
    if (k >= 5) body.push({ t: 'poly', pts: ptsStr(offsetPoly(KAABA_POLY, -0.75).map((p) => P(p, H))), fill: 'none', stroke: '#CFC9BD', sw: Math.max(0.4, 0.03 * k) });
  }
  // Silüet: görünen dikey kenarlar ve üst kenarlarda ipek parıltısı
  const edge: string[] = [];
  for (let i = 0; i < 4; i++) {
    const fc = F[i];
    const prev = F[(i + 3) % 4];
    if (fc.front) {
      const [x1, y1] = P(fc.a, H);
      const [x2, y2] = P(fc.b, H);
      edge.push(`M${f1(x1)} ${f1(y1)} L${f1(x2)} ${f1(y2)}`);
    }
    if (fc.front || prev.front) {
      const [x1, y1] = P(fc.a, 0.32);
      const [x2, y2] = P(fc.a, H);
      edge.push(`M${f1(x1)} ${f1(y1)} L${f1(x2)} ${f1(y2)}`);
    }
  }
  body.push({ t: 'path', d: edge.join(' '), fill: 'none', stroke: '#5A5B64', sw: Math.max(0.5, 0.05 * k), keep: true, op: 0.9 });

  // ── Hacerü'l-Esved: doğu köşesinde gümüş çerçeve ──
  {
    const fa = F.find((fc) => fc.id === 'ne')!;
    const fb = F.find((fc) => fc.id === 'se')!;
    if (fa.front || fb.front) {
      const [x, y] = P(CORNERS.aswad, 1.3);
      const rx = Math.max(1.6, 0.36 * k);
      const ry = Math.max(2, 0.46 * k * CA);
      body.push({ t: 'ell', cx: x, cy: y, rx, ry, fill: '#D9DCE2', stroke: '#7E848E', sw: Math.max(0.5, 0.05 * k), keep: true,
        grad: { x1: x - rx, y1: y - ry, x2: x + rx, y2: y + ry, stops: [[0, '#F4F6F9'], [0.5, '#C9CED6'], [1, '#8E949E']] } });
      if (k >= 3) {
        body.push({ t: 'ell', cx: x, cy: y + ry * 0.08, rx: rx * 0.5, ry: ry * 0.55, fill: '#231C19', keep: true });
        body.push({ t: 'ell', cx: x - rx * 0.15, cy: y - ry * 0.1, rx: rx * 0.14, ry: ry * 0.12, fill: '#6B5B52', keep: true });
      }
    }
  }

  if (nwFront) body.push(...mizab);
  const fronts: { d: number; prims: Prim[] }[] = [];
  if (hijr && nwFront) fronts.push({ d: cam.depthOf(...hb.mid[12]), prims: hijrPrims });
  if (maqam && neFront) fronts.push({ d: cam.depthOf(MAQAM[0], MAQAM[1]), prims: maqamPrims });
  fronts.sort((a, b) => a.d - b.d).forEach((o) => body.push(...o.prims));

  return { under, body, frontDepth: Math.max(...KAABA_POLY.map(([x, y]) => cam.depthOf(x, y))) };

  // ── Bir duvar yüzü ve süslemeleri ──
  function wall(fc: Face): Prim[] {
    const out: Prim[] = [];
    const base = mix(KISWA_D, KISWA_L, fc.light * 0.85);
    // Örtü: yukarıda hafif parlak, aşağıda koyu
    out.push({
      t: 'poly', pts: ptsStr(quad(fc, 0, fc.len, 0, H)), fill: base, keep: true,
      grad: vgrad(fc, fc.len / 2, H, 0, [[0, mix(base, '#6A6B75', 0.22)], [0.35, base], [1, mix(base, '#000000', 0.45)]]),
    });
    // Dokuma desen: kisvenin kumaşına işlenmiş yazıların oluşturduğu hafif zikzak (şerit şerit) doku
    if (k >= 4) {
      const z: string[] = [];
      const amp = 0.32;
      for (let h = 0.9; h < H - 0.4; h += 0.95) {
        if (h > BAND[0] - 1.9 && h < BAND[1] + 0.1) continue; // kuşak ve kandillerin olduğu bölge sade
        const pts: [number, number][] = [];
        for (let u = 0, j = 0; u <= fc.len + 1e-6; u += 0.55, j++) pts.push([Math.min(u, fc.len), h + (j % 2 ? amp : 0)]);
        z.push(facePath(fc, pts));
      }
      out.push({ t: 'path', d: z.join(' '), fill: 'none', stroke: mix(base, '#A4A5B0', k >= 8 ? 0.16 : 0.11), sw: Math.max(0.35, 0.035 * k), keep: true });
    }

    // Kapı perdesi (Sitâre): kapı duvarında
    if (fc.id === 'ne') out.push(...sitara(fc));

    // Kuşak (hizâm): altın işlemeli yazı
    const gold = mix(GOLD_D, GOLD_L, 0.35 + 0.65 * fc.light);
    out.push({
      t: 'poly', pts: ptsStr(quad(fc, 0, fc.len, BAND[0], BAND[1])), fill: gold, keep: true,
      grad: vgrad(fc, fc.len / 2, BAND[1], BAND[0], [[0, mix(gold, GOLD_HI, 0.55)], [0.45, gold], [1, mix(gold, GOLD_D, 0.6)]]),
    });
    if (k >= 2.5) {
      const bh = BAND[1] - BAND[0];
      const rim = (h: number) => { const [x1, y1] = Q(fc, 0, h); const [x2, y2] = Q(fc, fc.len, h); return `M${f1(x1)} ${f1(y1)} L${f1(x2)} ${f1(y2)}`; };
      out.push({ t: 'path', d: `${rim(BAND[1] - bh * 0.08)} ${rim(BAND[0] + bh * 0.08)}`, fill: 'none', stroke: mix(gold, GOLD_HI, 0.7), sw: Math.max(0.4, 0.035 * k), keep: true });
    }
    if (k >= 4.5) out.push(script(fc, 0.15, fc.len - 0.15, BAND[0] + 0.14, BAND[1] - 0.14, 11 + F.indexOf(fc), INK, 0.62));

    // Kuşak altı: köşelerde yuvarlak madalyonlar, aralarda kandiller (kanâdîl)
    if (k >= 3.5) {
      const hT = BAND[0] - 0.18;
      const shapes: number[] = [];
      for (const u of [0.85, fc.len - 0.85]) out.push(...medallion(fc, u, hT - 0.55, gold));
      for (const r of [1 / 3, 2 / 3]) {
        const u = fc.len * r;
        if (fc.id === 'ne' && Math.abs(u - doorU()) < 2.6) continue;
        shapes.push(u);
      }
      for (const u of shapes) out.push(...lantern(fc, u, hT, gold));
    }
    return out;
  }

  function doorU() {
    const fc = F.find((x) => x.id === 'ne')!;
    return (DOOR.center[0] - fc.a[0]) * fc.t[0] + (DOOR.center[1] - fc.a[1]) * fc.t[1];
  }

  /** Kapı ve onu örten altın işlemeli perde. */
  function sitara(fc: Face): Prim[] {
    const out: Prim[] = [];
    const c = doorU();
    const gold = mix(GOLD_D, GOLD_L, 0.4 + 0.6 * fc.light);
    const hw = 1.75, h0 = 1.85, h1 = BAND[0] - 0.08;
    // Zemin (siyah) ve altın çerçeve
    out.push({ t: 'poly', pts: ptsStr(quad(fc, c - hw, c + hw, h0, h1)), fill: mix(KISWA_D, KISWA_L, fc.light * 0.6), keep: true });
    if (k < 2) {
      out.push({ t: 'poly', pts: ptsStr(quad(fc, DOORL(), DOORR(), DOOR.bottom, DOOR.top)), fill: gold, keep: true });
      return out;
    }
    const sw = Math.max(0.5, 0.12 * k);
    out.push({ t: 'path', d: facePath(fc, [[c - hw, h0], [c + hw, h0], [c + hw, h1], [c - hw, h1], [c - hw, h0]]), fill: 'none', stroke: gold, sw, keep: true, cap: 'butt' });
    // Üstte yazı kuşakları
    const rows: [number, number][] = [[h1 - 0.55, h1 - 0.18], [h1 - 1.05, h1 - 0.7], [h1 - 1.55, h1 - 1.2]];
    rows.forEach(([a, b], i) => {
      out.push({ t: 'poly', pts: ptsStr(quad(fc, c - hw + 0.22, c + hw - 0.22, a, b)), fill: gold, keep: true,
        grad: vgrad(fc, c, b, a, [[0, mix(gold, GOLD_HI, 0.5)], [1, mix(gold, GOLD_D, 0.4)]]) });
      if (k >= 5) out.push(script(fc, c - hw + 0.3, c + hw - 0.3, a + 0.05, b - 0.05, 40 + i, INK, 0.6));
    });
    // Kapının üstünde sivri kemer
    const ka = DOOR.top + 0.2, kb = h1 - 1.75;
    out.push({ t: 'path', d: facePath(fc, [[c - 1.15, ka], [c - 1.15, ka + (kb - ka) * 0.45], [c, kb], [c + 1.15, ka + (kb - ka) * 0.45], [c + 1.15, ka]]),
      fill: 'none', stroke: gold, sw: Math.max(0.5, 0.09 * k), keep: true });
    if (k >= 5) out.push(script(fc, c - 0.8, c + 0.8, ka + 0.15, ka + (kb - ka) * 0.5, 47, gold, 0.9));
    // Kapı (altın kanatlar)
    const l = DOORL(), r = DOORR();
    out.push({ t: 'poly', pts: ptsStr(quad(fc, l, r, DOOR.bottom, DOOR.top)), fill: gold, stroke: mix(gold, GOLD_D, 0.7), sw: Math.max(0.4, 0.04 * k), keep: true,
      grad: vgrad(fc, c, DOOR.top, DOOR.bottom, [[0, mix(gold, GOLD_HI, 0.6)], [0.5, gold], [1, mix(gold, GOLD_D, 0.5)]]) });
    if (k >= 4) {
      const mid = facePath(fc, [[c, DOOR.bottom], [c, DOOR.top]]);
      const panels: string[] = [mid];
      for (const h of [DOOR.bottom + 0.75, DOOR.bottom + 1.55, DOOR.bottom + 2.35]) panels.push(facePath(fc, [[l + 0.12, h], [r - 0.12, h]]));
      out.push({ t: 'path', d: panels.join(' '), fill: 'none', stroke: mix(gold, GOLD_D, 0.75), sw: Math.max(0.35, 0.035 * k), keep: true });
    }
    if (k >= 6) out.push(script(fc, l + 0.12, r - 0.12, DOOR.bottom + 0.1, DOOR.top - 0.1, 53, mix(gold, GOLD_D, 0.85), 0.45));
    // Kapı altı ve yanları: altın şerit
    out.push({ t: 'poly', pts: ptsStr(quad(fc, c - hw + 0.22, c + hw - 0.22, h0 + 0.12, DOOR.bottom - 0.06)), fill: gold, keep: true });
    return out;
  }
  function DOORL() { return doorU() - DOOR.width / 2; }
  function DOORR() { return doorU() + DOOR.width / 2; }

  /** Kuşak altındaki kandil biçimli altın işleme. */
  function lantern(fc: Face, u: number, hT: number, gold: string): Prim[] {
    const s: [number, number][] = [[-0.32, -0.32], [-0.14, 0], [0.14, 0], [0.32, -0.32], [0.32, -1.05], [0, -1.55], [-0.32, -1.05]];
    const inner: [number, number][] = [[-0.16, -0.42], [0, -0.3], [0.16, -0.42], [0.16, -0.98], [0, -1.22], [-0.16, -0.98]];
    const mk = (pts: [number, number][]) => pts.map(([du, dh]) => Q(fc, u + du, hT + dh));
    const out: Prim[] = [
      { t: 'poly', pts: ptsStr(mk(s)), fill: gold, stroke: mix(gold, GOLD_D, 0.6), sw: Math.max(0.3, 0.03 * k), keep: true },
    ];
    if (k >= 5) out.push({ t: 'poly', pts: ptsStr(mk(inner)), fill: mix(KISWA_D, gold, 0.25), keep: true });
    // Asma zinciri
    const [x1, y1] = Q(fc, u, hT);
    const [x2, y2] = Q(fc, u, BAND[0]);
    out.push({ t: 'path', d: `M${f1(x1)} ${f1(y1)} L${f1(x2)} ${f1(y2)}`, stroke: gold, sw: Math.max(0.3, 0.03 * k), fill: 'none', keep: true });
    return out;
  }

  /** Köşelerde İhlâs sûresi yazılı yuvarlak madalyon. */
  function medallion(fc: Face, u: number, h: number, gold: string): Prim[] {
    const ring = (r: number) => Array.from({ length: 18 }, (_, i) => {
      const a = (i / 18) * Math.PI * 2;
      return Q(fc, u + r * Math.cos(a), h + r * Math.sin(a));
    });
    const out: Prim[] = [{ t: 'poly', pts: ptsStr(ring(0.42)), fill: gold, keep: true }];
    if (k >= 5) {
      out.push({ t: 'poly', pts: ptsStr(ring(0.3)), fill: mix(KISWA_D, gold, 0.18), keep: true });
      out.push(script(fc, u - 0.22, u + 0.22, h - 0.12, h + 0.14, 70 + Math.round(u * 10), gold, 0.95));
    }
    return out;
  }

  /** Hat yazısını andıran işleme: elifler, çanaklar, noktalar, keşideler (yüz koordinatında). */
  function script(fc: Face, u0: number, u1: number, h0: number, h1: number, seed: number, color: string, op: number): Prim {
    const r = rng(seed);
    const hh = h1 - h0;
    const d: string[] = [];
    let u = u0 + 0.05;
    while (u < u1 - 0.1) {
      const t = r();
      if (t < 0.38) {
        d.push(facePath(fc, [[u, h0 + hh * 0.12], [u + 0.02, h0 + hh * (0.62 + 0.36 * r())]]));
        u += 0.09 + r() * 0.08;
      } else if (t < 0.68) {
        const w = 0.16 + r() * 0.14;
        d.push(facePath(fc, [[u, h0 + hh * 0.5], [u + w * 0.15, h0 + hh * 0.18], [u + w * 0.6, h0 + hh * 0.1], [u + w, h0 + hh * 0.3]]));
        u += w + 0.04;
      } else if (t < 0.82) {
        const w = 0.22 + r() * 0.3;
        d.push(facePath(fc, [[u, h0 + hh * 0.2], [u + w, h0 + hh * 0.2]]));
        u += w * 0.6;
      } else {
        const hd = h0 + hh * (0.7 + 0.2 * r());
        d.push(facePath(fc, [[u, hd], [u + 0.04, hd + hh * 0.06]]));
        u += 0.06;
      }
    }
    return { t: 'path', d: d.join(' '), fill: 'none', stroke: color, sw: Math.max(0.35, 0.045 * k), op, keep: true };
  }
}

/** Hatîm (Hicr) duvarı: beyaz mermer, yüzleri ışığa göre gölgeli, üstü açık. */
function hijrWall(cam: Cam, hb: ReturnType<typeof hijrBand>, k: number): Prim[] {
  const ht = 1.32;
  const ring = [...hb.outer, ...[...hb.inner].reverse()];
  const faces: { d: number; pts: [number, number][]; c: string }[] = [];
  // Bant (C biçimli basit çokgen): alan işaretine göre dış normal — iç yüzler Hicr'e doğru bakar
  let area = 0;
  for (let i = 0; i < ring.length; i++) { const [x1, y1] = ring[i]; const [x2, y2] = ring[(i + 1) % ring.length]; area += x1 * y2 - x2 * y1; }
  for (let i = 0; i < ring.length; i++) {
    const a = ring[i];
    const b = ring[(i + 1) % ring.length];
    const ex = b[0] - a[0], ey = b[1] - a[1];
    const L = Math.hypot(ex, ey) || 1;
    const n: Pt = area > 0 ? [ey / L, -ex / L] : [-ey / L, ex / L];
    const mid: Pt = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
    if (cam.depthOf(n[0], n[1]) <= 1e-6) continue;
    const l = lightOf(cam, n);
    faces.push({ d: cam.depthOf(...mid), pts: [cam.P(a[0], a[1], 0), cam.P(b[0], b[1], 0), cam.P(b[0], b[1], ht), cam.P(a[0], a[1], ht)], c: mix(MARBLE_D, MARBLE_L, 0.35 + 0.65 * l) });
  }
  faces.sort((p, q) => p.d - q.d);
  const out: Prim[] = faces.map((fc) => ({ t: 'poly', pts: ptsStr(fc.pts), fill: fc.c, stroke: fc.c, sw: 0.4 }));
  out.push({ t: 'poly', pts: ptsStr(ring.map((p) => cam.P(p[0], p[1], ht))), fill: '#FBFAF7', stroke: '#CFC8BB', sw: Math.max(0.5, 0.04 * k) });
  if (k >= 6) {
    // Üstteki ince süs şeridi
    const mid = hb.mid.map((p) => cam.P(p[0], p[1], ht + 0.01));
    out.push({ t: 'path', d: mid.map(([x, y], i) => `${i ? 'L' : 'M'}${f1(x)} ${f1(y)}`).join(' '), fill: 'none', stroke: '#DDD5C5', sw: Math.max(0.5, 0.08 * k) });
  }
  return out;
}

/** Makam-ı İbrâhîm: mermer kaide, altın kafes, cam kubbe ve hilâl. */
function maqamModel(cam: Cam, k: number): Prim[] {
  const [mx, my] = MAQAM;
  const poly = (r: number, n: number, rot = 0): Pt[] => Array.from({ length: n }, (_, i) => [mx + r * Math.cos(rot + (i * 2 * Math.PI) / n), my + r * Math.sin(rot + (i * 2 * Math.PI) / n)]);
  const out: Prim[] = [];
  const prism = (pl: Pt[], h0: number, h1: number, dark: string, light: string, top: string, keep = false) => {
    const fs: { d: number; pts: [number, number][]; c: string }[] = [];
    for (let i = 0; i < pl.length; i++) {
      const a = pl[i], b = pl[(i + 1) % pl.length];
      const m: Pt = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
      const L = Math.hypot(m[0] - mx, m[1] - my) || 1;
      const n: Pt = [(m[0] - mx) / L, (m[1] - my) / L];
      if (cam.depthOf(n[0], n[1]) <= 1e-6) continue;
      fs.push({ d: cam.depthOf(...m), pts: [cam.P(a[0], a[1], h0), cam.P(b[0], b[1], h0), cam.P(b[0], b[1], h1), cam.P(a[0], a[1], h1)], c: mix(dark, light, lightOf(cam, n)) });
    }
    fs.sort((p, q) => p.d - q.d).forEach((fc) => out.push({ t: 'poly', pts: ptsStr(fc.pts), fill: fc.c, stroke: fc.c, sw: 0.3, keep }));
    out.push({ t: 'poly', pts: ptsStr(pl.map((p) => cam.P(p[0], p[1], h1))), fill: top, keep });
  };
  prism(poly(0.95, 8, Math.PI / 8), 0, 0.45, MARBLE_D, MARBLE_L, '#EEEBE4');
  prism(poly(0.62, 8, Math.PI / 8), 0.45, 1.55, GOLD_D, GOLD_L, GOLD_L, true);
  if (k >= 5) {
    // Kafesin dikey çubukları
    const bars: string[] = [];
    for (const p of poly(0.62, 16)) {
      if (cam.depthOf(p[0] - mx, p[1] - my) < 0) continue;
      const [x1, y1] = cam.P(p[0], p[1], 0.5);
      const [x2, y2] = cam.P(p[0], p[1], 1.5);
      bars.push(`M${f1(x1)} ${f1(y1)} L${f1(x2)} ${f1(y2)}`);
    }
    out.push({ t: 'path', d: bars.join(' '), fill: 'none', stroke: '#6E520A', sw: Math.max(0.3, 0.04 * k), keep: true });
  }
  // Cam kubbe (ekranda yarım elips) ve hilâl
  const [cx, cy] = cam.P(mx, my, 1.55);
  const rx = 0.62 * k;
  const ry = 0.85 * CA * k;
  out.push({ t: 'path', d: `M${f1(cx - rx)} ${f1(cy)} A${f1(rx)} ${f1(ry)} 0 0 1 ${f1(cx + rx)} ${f1(cy)} Z`, fill: '#DCEBEE', op: 0.92, stroke: GOLD_D, sw: Math.max(0.4, 0.05 * k), keep: true,
    grad: { x1: cx - rx, y1: cy - ry, x2: cx + rx, y2: cy, stops: [[0, '#FFFFFF'], [0.5, '#D6E6EA'], [1, '#A9C2C8']] } });
  if (k >= 4) out.push({ t: 'path', d: `M${f1(cx)} ${f1(cy)} L${f1(cx)} ${f1(cy - ry)} M${f1(cx - rx * 0.6)} ${f1(cy)} Q${f1(cx - rx * 0.5)} ${f1(cy - ry * 0.9)} ${f1(cx)} ${f1(cy - ry)} M${f1(cx + rx * 0.6)} ${f1(cy)} Q${f1(cx + rx * 0.5)} ${f1(cy - ry * 0.9)} ${f1(cx)} ${f1(cy - ry)}`, fill: 'none', stroke: GOLD_D, sw: Math.max(0.3, 0.035 * k), keep: true });
  const top = cy - ry;
  out.push({ t: 'path', d: `M${f1(cx)} ${f1(top)} L${f1(cx)} ${f1(top - 0.35 * k)}`, stroke: GOLD_D, sw: Math.max(0.5, 0.06 * k), fill: 'none', keep: true });
  out.push({ t: 'circ', cx, cy: top - 0.45 * k, r: Math.max(1, 0.12 * k), fill: GOLD_L, stroke: GOLD_D, sw: 0.4, keep: true });
  return out;
}

/** Dışbükey çokgeni (köşeleri dik varsayarak) d metre dışa (+) ya da içe (−) kaydırır. */
function offsetPoly(pl: Pt[], d: number): Pt[] {
  const c: Pt = [pl.reduce((s, p) => s + p[0], 0) / pl.length, pl.reduce((s, p) => s + p[1], 0) / pl.length];
  const ns = pl.map((a, i) => {
    const b = pl[(i + 1) % pl.length];
    const L = Math.hypot(b[0] - a[0], b[1] - a[1]);
    let n: Pt = [(b[1] - a[1]) / L, -(b[0] - a[0]) / L];
    if (n[0] * ((a[0] + b[0]) / 2 - c[0]) + n[1] * ((a[1] + b[1]) / 2 - c[1]) < 0) n = [-n[0], -n[1]];
    return n;
  });
  return pl.map((p, i) => {
    const n1 = ns[(i + pl.length - 1) % pl.length];
    const n2 = ns[i];
    return [p[0] + (n1[0] + n2[0]) * d, p[1] + (n1[1] + n2[1]) * d];
  });
}

function convexHull(pts: [number, number][]): [number, number][] {
  const p = [...pts].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cross = (o: number[], a: number[], b: number[]) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lower: [number, number][] = [];
  for (const q of p) { while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], q) <= 0) lower.pop(); lower.push(q); }
  const upper: [number, number][] = [];
  for (const q of [...p].reverse()) { while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], q) <= 0) upper.pop(); upper.push(q); }
  return [...lower.slice(0, -1), ...upper.slice(0, -1)];
}
