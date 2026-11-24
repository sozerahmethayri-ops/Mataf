// Mescid-i Haram mimari ayrıntıları: cephe kemerleri, saçak, kapı portalları, kubbeler, Saat Kulesi silüeti.
// Ayrıntı ölçeğe (cam.k, piksel/metre) göre açılır: haritanın uzak görünümü hızlı ve sade kalır.
import type { Pt } from '@/data/sites';
import { CA, Cam, SA, mixHex, ptsStr, visibleWalls, type Prim, type Wall } from './oblique';

const f = (v: number) => v.toFixed(1);

/** Duvar yüzünde (u: duvar boyunca m, h: yükseklik m) noktayı ekrana çevirir. */
const onWall = (cam: Cam, w: Wall, u: number, h: number) => {
  const t: Pt = [(w.b[0] - w.a[0]) / w.len, (w.b[1] - w.a[1]) / w.len];
  return cam.P(w.a[0] + t[0] * u, w.a[1] + t[1] * u, h);
};
const shapePath = (cam: Cam, w: Wall, pts: [number, number][]) =>
  pts.map(([u, h], i) => { const [x, y] = onWall(cam, w, u, h); return `${i ? 'L' : 'M'}${f(x)} ${f(y)}`; }).join(' ') + ' Z';

/** Yan yüzleri gölgeli duvarlar (çatısız). */
export function wallPrims(cam: Cam, walls: Wall[], h0: number, h1: number, light: string, dark: string): Prim[] {
  return walls.map((w) => {
    const c = mixHex(dark, light, w.light < 0.5 ? w.light * 0.9 : 0.45 + (w.light - 0.5) * 1.1);
    const mx = (w.a[0] + w.b[0]) / 2, my = (w.a[1] + w.b[1]) / 2;
    const [x1, y1] = cam.P(mx, my, h1);
    const [x2, y2] = cam.P(mx, my, h0);
    return {
      t: 'poly', pts: ptsStr([cam.P(w.a[0], w.a[1], h0), cam.P(w.b[0], w.b[1], h0), cam.P(w.b[0], w.b[1], h1), cam.P(w.a[0], w.a[1], h1)]), fill: c,
      grad: { x1, y1, x2, y2, stops: [[0, mixHex(c, '#FFFFFF', 0.25)], [1, mixHex(c, '#6E6350', 0.12)]] },
    } as Prim;
  });
}

export type ArcadeRow = { h0: number; h1: number; w: number; step: number };

/**
 * Cephe kemerleri (sivri kemerli pencere dizileri) ve saçak bandı.
 * Pencereler gece (koyu tema) içeriden aydınlanmış görünür.
 */
export function facade(cam: Cam, walls: Wall[], height: number, rows: ArcadeRow[], opts: { skipNear?: (p: Pt) => boolean } = {}): Prim[] {
  const k = cam.k;
  const out: Prim[] = [];
  const arch = k >= 1.6;
  for (const w of walls) {
    const t: Pt = [(w.b[0] - w.a[0]) / w.len, (w.b[1] - w.a[1]) / w.len];
    if (k >= 0.6) {
      for (const r of rows) {
        if (r.w * k < 1) continue;
        const n = Math.floor((w.len - 4) / r.step);
        if (n < 1) continue;
        const u0 = (w.len - (n - 1) * r.step) / 2;
        const d: string[] = [];
        for (let i = 0; i < n; i++) {
          const u = u0 + i * r.step;
          if (opts.skipNear?.([w.a[0] + t[0] * u, w.a[1] + t[1] * u])) continue;
          const hw = r.w / 2;
          d.push(shapePath(cam, w, arch
            ? [[u - hw, r.h0], [u + hw, r.h0], [u + hw, r.h1 - r.w * 0.55], [u + hw * 0.55, r.h1 - r.w * 0.12], [u, r.h1], [u - hw * 0.55, r.h1 - r.w * 0.12], [u - hw, r.h1 - r.w * 0.55]]
            : [[u - hw, r.h0], [u + hw, r.h0], [u + hw, r.h1], [u - hw, r.h1]]));
        }
        if (d.length) out.push({ t: 'path', d: d.join(' '), fill: mixHex('#9A8F7D', '#C2B8A6', w.light), nfill: mixHex('#C98F3A', '#F4CE78', w.light) });
      }
    }
    // Saçak: üstte koyu çizgi + parlak kenar (silüeti netleştirir)
    if (k >= 0.45) {
      const [ax, ay] = cam.P(w.a[0], w.a[1], height - 1.6);
      const [bx, by] = cam.P(w.b[0], w.b[1], height - 1.6);
      out.push({ t: 'path', d: `M${f(ax)} ${f(ay)} L${f(bx)} ${f(by)}`, stroke: mixHex('#A89D8A', '#C9BFAE', w.light), sw: Math.max(0.6, 0.9 * k), fill: 'none' });
      if (k >= 1.2) {
        const [cx, cy] = cam.P(w.a[0], w.a[1], height - 0.3);
        const [dx, dy] = cam.P(w.b[0], w.b[1], height - 0.3);
        out.push({ t: 'path', d: `M${f(cx)} ${f(cy)} L${f(dx)} ${f(dy)}`, stroke: '#FBF9F4', sw: Math.max(0.5, 0.5 * k), fill: 'none' });
      }
    }
  }
  return out;
}

/**
 * Büyük kapı portalı: iki minare arasında cepheden öne çıkan, binadan yüksek kütle;
 * dış yüzünde büyük sivri kemer, kemerin içinde kapı açıklıkları ve üstte yazı kuşağı.
 */
export function portal(cam: Cam, a: Pt, b: Pt, outward: Pt, depth: number, height: number): Prim[] {
  const k = cam.k;
  const poly: Pt[] = [a, b, [b[0] + outward[0] * depth, b[1] + outward[1] * depth], [a[0] + outward[0] * depth, a[1] + outward[1] * depth]];
  const walls = visibleWalls(cam, poly);
  const out: Prim[] = wallPrims(cam, walls, 0, height, '#F6F2EA', '#D2C9B9');
  out.push({ t: 'poly', pts: ptsStr(poly.map((p) => cam.P(p[0], p[1], height))), fill: '#F4F0E8', stroke: '#D5CCBD', sw: 0.6 });
  const front = walls.find((w) => Math.abs(w.n[0] - outward[0]) + Math.abs(w.n[1] - outward[1]) < 0.2);
  if (front && k >= 0.5) {
    const W = front.len;
    const c = W / 2;
    const aw = W * 0.32;
    const ah = height * 0.74;
    const archPts = (hw: number, top: number, base: number): [number, number][] => [
      [c - hw, base], [c + hw, base], [c + hw, top - hw * 1.1], [c + hw * 0.6, top - hw * 0.25], [c, top], [c - hw * 0.6, top - hw * 0.25], [c - hw, top - hw * 1.1],
    ];
    // Kemer çerçevesi (açık) ve oyuk (koyu)
    out.push({ t: 'path', d: shapePath(cam, front, archPts(aw + 1.4, ah + 1.6, 0)), fill: '#E9E2D5' });
    out.push({ t: 'path', d: shapePath(cam, front, archPts(aw, ah, 0)), fill: '#8E8370', nfill: '#B9874A' });
    if (k >= 1.2) {
      // Kemerin içindeki kapı açıklıkları (aydınlık) ve yazı kuşağı
      const doors: string[] = [];
      for (const du of [-aw * 0.55, 0, aw * 0.55]) doors.push(shapePath(cam, front, [[c + du - aw * 0.18, 0], [c + du + aw * 0.18, 0], [c + du + aw * 0.18, ah * 0.42], [c + du, ah * 0.5], [c + du - aw * 0.18, ah * 0.42]]));
      out.push({ t: 'path', d: doors.join(' '), fill: '#5F574A', nfill: '#F6D38A' });
      const [x1, y1] = onWall(cam, front, W * 0.1, height * 0.88);
      const [x2, y2] = onWall(cam, front, W * 0.9, height * 0.88);
      out.push({ t: 'path', d: `M${f(x1)} ${f(y1)} L${f(x2)} ${f(y2)}`, stroke: '#B59B5A', sw: Math.max(0.8, 1.6 * k), fill: 'none', keep: true, op: 0.85 });
    }
  }
  return out;
}

/** Kurşun kaplı kubbe: alt yarım elips + kubbe yayı, sol üstte parlaklık; büyüklerde alem. */
export function dome(cam: Cam, x: number, y: number, h: number, r: number, tone: 'lead' | 'marble' = 'lead'): Prim[] {
  const k = cam.k;
  const [cx, cy] = cam.P(x, y, h);
  const rx = r * k;
  const ry = r * k * SA;
  const base = tone === 'lead' ? '#C8C2B6' : '#ECE7DE';
  const shade = tone === 'lead' ? '#A9A296' : '#D2CABB';
  const hi = tone === 'lead' ? '#EFECE6' : '#FFFFFF';
  const dh = r * 1.1 * CA * k;
  if (rx < 1.6) return [{ t: 'ell', cx, cy: cy - dh * 0.3, rx, ry: Math.max(ry, dh * 0.6), fill: base }];
  const out: Prim[] = [
    // Kasnak gölgesi, kubbe gövdesi, sağda gölge, solda parlaklık
    { t: 'ell', cx, cy, rx: rx * 1.04, ry: ry * 1.04, fill: shade },
    { t: 'path', d: `M${f(cx - rx)} ${f(cy)} A${f(rx)} ${f(dh)} 0 0 1 ${f(cx + rx)} ${f(cy)} A${f(rx)} ${f(ry)} 0 0 1 ${f(cx - rx)} ${f(cy)} Z`, fill: base },
    { t: 'path', d: `M${f(cx + rx * 0.15)} ${f(cy - dh * 0.98)} A${f(rx * 0.85)} ${f(dh)} 0 0 1 ${f(cx + rx)} ${f(cy)} A${f(rx)} ${f(ry)} 0 0 1 ${f(cx + rx * 0.2)} ${f(cy + ry * 0.98)} A${f(rx * 0.5)} ${f(dh * 1.6)} 0 0 0 ${f(cx + rx * 0.15)} ${f(cy - dh * 0.98)} Z`, fill: shade, op: 0.75 },
    { t: 'path', d: `M${f(cx - rx * 0.72)} ${f(cy - dh * 0.2)} A${f(rx * 0.5)} ${f(dh * 0.75)} 0 0 1 ${f(cx - rx * 0.05)} ${f(cy - dh * 0.9)} A${f(rx * 0.85)} ${f(dh * 1.05)} 0 0 0 ${f(cx - rx * 0.72)} ${f(cy - dh * 0.2)} Z`, fill: hi, op: 0.95 },
  ];
  if (r >= 4 && k >= 0.8) {
    const top = cy - dh;
    out.push({ t: 'path', d: `M${f(cx)} ${f(top)} L${f(cx)} ${f(top - Math.max(2, r * 0.35 * k))}`, stroke: '#C9A227', sw: Math.max(0.6, 0.12 * r * k), fill: 'none', keep: true });
    out.push({ t: 'circ', cx, cy: top - Math.max(2.4, r * 0.4 * k), r: Math.max(0.8, 0.08 * r * k), fill: '#D4AF37', keep: true });
  }
  return out;
}

/** Aynı yükseklikteki çok sayıda küçük kubbe (Osmanlı revakı): üst üste binmedikleri için katman katman
 *  birleştirilir — yüzlerce şekil yerine 4 şekil (telefonda hızlı). */
export function domeField(cam: Cam, centers: Pt[], h: number, r: number): Prim[] {
  const k = cam.k;
  const rx = r * k, ry = r * k * SA, dh = r * 1.1 * CA * k;
  const pts = centers.map(([x, y]) => cam.P(x, y, h));
  if (rx < 1.6) {
    return [{ t: 'path', d: pts.map(([cx, cy]) => `M${f(cx - rx)} ${f(cy)} A${f(rx)} ${f(Math.max(ry, dh * 0.6))} 0 1 0 ${f(cx + rx)} ${f(cy)} A${f(rx)} ${f(Math.max(ry, dh * 0.6))} 0 1 0 ${f(cx - rx)} ${f(cy)} Z`).join(' '), fill: '#C8C2B6' }];
  }
  const rim = pts.map(([cx, cy]) => `M${f(cx - rx * 1.04)} ${f(cy)} A${f(rx * 1.04)} ${f(ry * 1.04)} 0 1 0 ${f(cx + rx * 1.04)} ${f(cy)} A${f(rx * 1.04)} ${f(ry * 1.04)} 0 1 0 ${f(cx - rx * 1.04)} ${f(cy)} Z`).join(' ');
  const body = pts.map(([cx, cy]) => `M${f(cx - rx)} ${f(cy)} A${f(rx)} ${f(dh)} 0 0 1 ${f(cx + rx)} ${f(cy)} A${f(rx)} ${f(ry)} 0 0 1 ${f(cx - rx)} ${f(cy)} Z`).join(' ');
  const shade = pts.map(([cx, cy]) => `M${f(cx + rx * 0.15)} ${f(cy - dh * 0.98)} A${f(rx * 0.85)} ${f(dh)} 0 0 1 ${f(cx + rx)} ${f(cy)} A${f(rx)} ${f(ry)} 0 0 1 ${f(cx + rx * 0.2)} ${f(cy + ry * 0.98)} A${f(rx * 0.5)} ${f(dh * 1.6)} 0 0 0 ${f(cx + rx * 0.15)} ${f(cy - dh * 0.98)} Z`).join(' ');
  const hi = pts.map(([cx, cy]) => `M${f(cx - rx * 0.72)} ${f(cy - dh * 0.2)} A${f(rx * 0.5)} ${f(dh * 0.75)} 0 0 1 ${f(cx - rx * 0.05)} ${f(cy - dh * 0.9)} A${f(rx * 0.85)} ${f(dh * 1.05)} 0 0 0 ${f(cx - rx * 0.72)} ${f(cy - dh * 0.2)} Z`).join(' ');
  return [
    { t: 'path', d: rim, fill: '#A9A296' },
    { t: 'path', d: body, fill: '#C8C2B6' },
    { t: 'path', d: shade, fill: '#A9A296', op: 0.75 },
    { t: 'path', d: hi, fill: '#EFECE6', op: 0.95 },
  ];
}

/** Çatıdaki mermer döşeme derzleri (çok hafif ızgara); `holes` dikdörtgenleri atlanır. */
export function roofGrid(cam: Cam, x0: number, y0: number, x1: number, y1: number, h: number, step: number, holes: [number, number, number, number][] = []): Prim | null {
  if (cam.k < 1.1) return null;
  const segs: string[] = [];
  const seg = (a: Pt, b: Pt) => { const [p, q] = cam.P(a[0], a[1], h); const [r, s] = cam.P(b[0], b[1], h); segs.push(`M${f(p)} ${f(q)} L${f(r)} ${f(s)}`); };
  const cut = (fixed: number, from: number, to: number, vertical: boolean) => {
    let parts: [number, number][] = [[from, to]];
    for (const [hx0, hy0, hx1, hy1] of holes) {
      const [lo, hi, c0, c1] = vertical ? [hy0, hy1, hx0, hx1] : [hx0, hx1, hy0, hy1];
      if (fixed <= c0 || fixed >= c1) continue;
      parts = parts.flatMap(([a, b]) => (b <= lo || a >= hi ? [[a, b]] : [[a, Math.min(b, lo)], [Math.max(a, hi), b]].filter(([m, n]) => n - m > 0.5)) as [number, number][]);
    }
    for (const [a, b] of parts) seg(vertical ? [fixed, a] : [a, fixed], vertical ? [fixed, b] : [b, fixed]);
  };
  for (let x = Math.ceil(x0 / step) * step; x < x1; x += step) cut(x, y0, y1, true);
  for (let y = Math.ceil(y0 / step) * step; y < y1; y += step) cut(y, x0, x1, false);
  return { t: 'path', d: segs.join(' '), stroke: '#ECE6DB', sw: Math.max(0.4, 0.25 * cam.k), fill: 'none' };
}

/** Bir noktanın en yakın çokgen kenarı izleyiciye bakıyor mu? (Bitişik minare/portal önde mi çizilmeli?) */
export function nearestEdgeFaces(cam: Cam, poly: Pt[], p: Pt): boolean {
  let best = Infinity, n: Pt = [0, 0];
  let a2 = 0;
  for (let i = 0; i < poly.length; i++) { const [x1, y1] = poly[i]; const [x2, y2] = poly[(i + 1) % poly.length]; a2 += x1 * y2 - x2 * y1; }
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i], b = poly[(i + 1) % poly.length];
    const ex = b[0] - a[0], ey = b[1] - a[1];
    const L2 = ex * ex + ey * ey || 1;
    const t = Math.max(0, Math.min(1, ((p[0] - a[0]) * ex + (p[1] - a[1]) * ey) / L2));
    const d = Math.hypot(p[0] - a[0] - ex * t, p[1] - a[1] - ey * t);
    if (d < best) { best = d; n = a2 > 0 ? [ey, -ex] : [-ey, ex]; }
  }
  return cam.depthOf(n[0], n[1]) > 0;
}

/** Saat Kulesi (Ebrâcü'l-Beyt): gövde, saat bölümü ve dört kadran, altın taç, uzun alem ve hilâl. */
export function clockTower(cam: Cam): { d: number; prims: Prim[] }[] {
  const k = cam.k;
  const P = cam.P.bind(cam);
  const sq = (x0: number, y0: number, x1: number, y1: number): Pt[] => [[x0, y0], [x1, y0], [x1, y1], [x0, y1]];
  const front = (pl: Pt[]) => Math.max(...pl.map(([x, y]) => cam.depthOf(x, y)));
  const out: { d: number; prims: Prim[] }[] = [];
  const C: Pt = [-30, 326];
  const box = (hw: number) => sq(C[0] - hw, C[1] - hw, C[0] + hw, C[1] + hw);
  const prims: Prim[] = [];
  // Gövde ve kademeler
  for (const [hw, h0, h1, l, d] of [[28, 70, 395, '#EEE8DD', '#C9BFAE'], [25.5, 395, 412, '#E4DCCD', '#BDB29F'], [27, 412, 472, '#F1ECE3', '#CEC4B3']] as const) {
    const walls = visibleWalls(cam, box(hw));
    prims.push(...wallPrims(cam, walls, h0, h1, l, d));
    prims.push({ t: 'poly', pts: ptsStr(box(hw).map((p) => P(p[0], p[1], h1))), fill: '#EFEAE0' });
    if (h0 === 70 && k >= 0.35) {
      // Gövdede dikey pencere şeritleri
      const strips: string[] = [];
      for (const w of walls) for (const u of [w.len * 0.3, w.len * 0.5, w.len * 0.7]) {
        const [x1, y1] = onWall(cam, w, u, 90); const [x2, y2] = onWall(cam, w, u, 385);
        strips.push(`M${f(x1)} ${f(y1)} L${f(x2)} ${f(y2)}`);
      }
      prims.push({ t: 'path', d: strips.join(' '), stroke: '#B8AD9A', sw: Math.max(0.6, 1.4 * k), fill: 'none' });
    }
  }
  // Saat kadranları (görünen yüzlerde)
  for (const w of visibleWalls(cam, box(27))) {
    const ring = (r: number) => Array.from({ length: 28 }, (_, i) => {
      const a = (i / 28) * Math.PI * 2;
      return onWall(cam, w, w.len / 2 + r * Math.cos(a), 442 + r * Math.sin(a));
    });
    prims.push({ t: 'poly', pts: ptsStr(ring(21)), fill: '#D4AF37', keep: true });
    prims.push({ t: 'poly', pts: ptsStr(ring(18.5)), fill: '#FDFCF8', nfill: '#E8F7EE' });
    const [cx, cy] = onWall(cam, w, w.len / 2, 442);
    const [hx, hy] = onWall(cam, w, w.len / 2 + 6, 452);
    const [mx, my] = onWall(cam, w, w.len / 2 - 2, 458);
    prims.push({ t: 'path', d: `M${f(cx)} ${f(cy)} L${f(hx)} ${f(hy)} M${f(cx)} ${f(cy)} L${f(mx)} ${f(my)}`, stroke: '#2B2B2B', sw: Math.max(0.8, 1.2 * k), fill: 'none' });
  }
  // Taç: altın, yukarı daralan dört yüzlü külah
  const t0 = box(24), t1 = box(9);
  const faces: { d: number; pts: [number, number][]; c: string }[] = [];
  for (let i = 0; i < 4; i++) {
    const a = t0[i], b = t0[(i + 1) % 4], c = t1[(i + 1) % 4], d = t1[i];
    const nx = (a[0] + b[0]) / 2 - C[0], ny = (a[1] + b[1]) / 2 - C[1];
    if (cam.depthOf(nx, ny) <= 0) continue;
    const L = Math.hypot(nx, ny);
    const lt = Math.max(0, Math.min(1, 0.5 + 0.5 * (-0.62 * ((nx * cam.ct - ny * cam.st) / L) + 0.78 * ((nx * cam.st + ny * cam.ct) / L))));
    faces.push({ d: cam.depthOf((a[0] + b[0]) / 2, (a[1] + b[1]) / 2), pts: [P(a[0], a[1], 472), P(b[0], b[1], 472), P(c[0], c[1], 532), P(d[0], d[1], 532)], c: mixHex('#A8862A', '#EBCB6B', lt) });
  }
  faces.sort((p, q) => p.d - q.d).forEach((fc) => prims.push({ t: 'poly', pts: ptsStr(fc.pts), fill: fc.c, keep: true }));
  prims.push({ t: 'poly', pts: ptsStr(t1.map((p) => P(p[0], p[1], 532))), fill: '#E2C25E', keep: true });
  // Alem ve hilâl
  const [sx, sb] = P(C[0], C[1], 532);
  const [, st] = P(C[0], C[1], 592);
  prims.push({ t: 'path', d: `M${f(sx)} ${f(sb)} L${f(sx)} ${f(st)}`, stroke: '#C9A227', sw: Math.max(1.2, 2.2 * k), fill: 'none', keep: true });
  for (const [hh, rr] of [[548, 4.5], [565, 3.5]] as const) {
    const [, by] = P(C[0], C[1], hh);
    prims.push({ t: 'ell', cx: sx, cy: by, rx: Math.max(1.2, rr * k), ry: Math.max(1, rr * k * 0.7), fill: '#D4AF37', keep: true });
  }
  const r = Math.max(2, 6 * k);
  const cy = st - r * 0.9;
  prims.push({ t: 'path', d: `M${f(sx - r)} ${f(cy)} A${f(r)} ${f(r)} 0 0 0 ${f(sx + r)} ${f(cy)} A${f(r * 1.3)} ${f(r * 1.3)} 0 0 1 ${f(sx - r)} ${f(cy)} Z`, fill: '#D4AF37', keep: true });
  out.push({ d: front(box(28)), prims });
  return out;
}
