// Mescid-i Nebevî gerçek ölçekli sahnesi (metre). Bina ≈ 98.500 m², zemin kat 12,55 m,
// 18 m çaplı 27 sürgülü kubbe, yeni minareler ≈ 105 m, avlularda 25 m'lik şemsiyeler.
// Bina oranı, Yeşil Kubbe yüksekliği ve Bakî sınırı yaklaşıktır.
import { Cam, ellipsePl, extrude, flat, line, minaret, rect, type Prim } from './oblique';
import type { Pt } from '@/data/sites';

const BLD: Pt[] = [[-147, -190], [147, -190], [147, 130], [46, 130], [46, 176], [-46, 176], [-46, 130], [-147, 130]];

function insideBld(x: number, y: number, m = 16) {
  if (x > -147 - m && x < 147 + m && y > -190 - m && y < 130 + m) return true;
  return x > -46 - m && x < 46 + m && y > 120 && y < 176 + m;
}

export function buildMadinah(cam: Cam): { below: Prim[]; above: Prim[]; ghost: Prim[] } {
  const P = cam.P.bind(cam);
  const k = cam.k;
  const below: Prim[] = [];
  const above: Prim[] = [];

  for (const [a, b] of [
    [[-700, -348], [700, -348]], [[-700, 318], [700, 318]], [[-282, -900], [-282, 900]], [[490, -900], [490, 900]],
  ] as [Pt, Pt][]) below.push(line(cam, a, b, '#FFFFFF', 18 * k));
  below.push(flat(cam, rect(-265, -330, 205, 300), '#FAF8F4'));
  const baqi: Pt[] = [[215, -170], [470, -170], [470, 235], [215, 235]];
  below.push(flat(cam, baqi, '#EFE6D3'));
  for (let gx = 228; gx < 465; gx += 24)
    for (let gy = -160; gy < 230; gy += 24) {
      const [cx, cy] = P(gx, gy);
      below.push({ t: 'circ', cx, cy, r: 0.8, fill: '#CDBD9C' });
    }
  below.push(...extrude(cam, baqi, 0, 3, 'none', '#D8CBB0', '#CDBE9F', [], '#D8CBB0'));

  const umbrella = (x: number, y: number): Prim[] => {
    const s = 12;
    const h = 14;
    const [bx, by] = P(x, y);
    const [tx, ty] = P(x, y, h);
    const top = [P(x - s, y - s, h), P(x + s, y - s, h), P(x + s, y + s, h), P(x - s, y + s, h)];
    return [
      { t: 'path', d: `M${bx.toFixed(1)} ${by.toFixed(1)} L${tx.toFixed(1)} ${ty.toFixed(1)}`, stroke: '#CFC8BB', sw: 0.8 },
      { t: 'poly', pts: top.map(([a, b]) => `${a.toFixed(1)},${b.toFixed(1)}`).join(' '), fill: '#FFFFFF', stroke: '#D9D2C5', sw: 0.6 },
    ];
  };
  const umb: Pt[] = [];
  let ix = 0;
  for (let x = -252; x < 200; x += 26, ix++) {
    let iy = 0;
    for (let y = -318; y < 292; y += 26, iy++) {
      if (insideBld(x, y)) continue;
      if (ix % 5 === 2 || iy % 6 === 3) continue; // yürüme yolları
      umb.push([x, y]);
    }
  }
  umb.sort((a, b) => Cam.depth(a[0], a[1]) - Cam.depth(b[0], b[1]));
  const isFront = (u: Pt) => u[1] > 130 || u[0] < -147;
  for (const u of umb) if (!isFront(u)) below.push(...umbrella(u[0], u[1]));

  const holes = [rect(-36, 60, -8, 104), rect(8, 60, 36, 104)];
  for (const hl of holes) {
    below.push(flat(cam, hl, '#FFFFFF'));
    const cx = (hl[0][0] + hl[1][0]) / 2;
    for (const uy of [70, 94]) below.push(...umbrella(cx, uy));
  }
  below.push(...extrude(cam, BLD, 0, 12.55, '#F7F4EF', '#DDD6CA', '#CFC6B6', holes));
  below.push(flat(cam, rect(-46, 112, 46, 176), '#ECE5D7', 12.55));
  for (let dx = -40; dx <= 40; dx += 8)
    for (let dy = 118; dy <= 172; dy += 8) {
      if (dx > 16 && dy > 136) continue;
      const [cx, cy] = P(dx, dy, 12.55);
      below.push({ t: 'ell', cx, cy: cy - 0.6, rx: 2.6 * k, ry: 1.7 * k, fill: '#B9B4AA' });
    }
  let n = 0;
  for (const x of [-122, -82, 82, 122])
    for (const y of [-165, -120, -75, -30, 15, 60, 105]) {
      if (n++ >= 27) break;
      const [cx, cy] = P(x, y, 12.55);
      below.push({ t: 'ell', cx, cy, rx: 9 * k, ry: 9 * k * 0.58, fill: '#E7E1D5', stroke: '#D3CBBC', sw: 0.7 });
    }
  // Yeşil Kubbe (yaklaşık 27 m)
  below.push(...extrude(cam, ellipsePl(30, 152, 8, 8, 16), 12.55, 17, '#2E7D4F', '#2F8F57', '#256F45', [], '#256F45'));
  const [gx, gy] = P(30, 152, 17);
  const [, ty] = P(30, 152, 27);
  below.push({ t: 'path', d: `M${(gx - 8 * k - 0.5).toFixed(1)} ${gy.toFixed(1)} Q${gx.toFixed(1)} ${(ty - (gy - ty) * 0.9).toFixed(1)} ${(gx + 8 * k + 0.5).toFixed(1)} ${gy.toFixed(1)} Z`, fill: '#2F8F57' });
  below.push({ t: 'path', d: `M${gx.toFixed(1)} ${(ty - 2).toFixed(1)} L${gx.toFixed(1)} ${(ty - 7).toFixed(1)}`, stroke: '#C9A227', sw: 1.3 });

  for (const u of umb) if (isFront(u)) above.push(...umbrella(u[0], u[1]));
  const mins: [number, number, number][] = [
    [-147, -190, 105], [147, -190, 105], [-147, 130, 105], [147, 130, 105], [-18, -190, 105], [18, -190, 105],
    [-46, 176, 72], [46, 176, 72], [-46, 48, 72], [46, 48, 72],
  ];
  mins.sort((a, b) => Cam.depth(a[0], a[1]) - Cam.depth(b[0], b[1]));
  for (const [x, y, h] of mins) above.push(...minaret(cam, x, y, h));
  return { below, above, ghost: [] };
}

/** Ana ekranda sığdırılacak çekirdek alan. */
export const MADINAH_CORE: Pt[] = [[-175, -215], [180, -215], [180, 200], [-175, 200]];

export const MADINAH_LABELS = [
  { key: 'dome', pos: [30, 152] as Pt, h: 27, text: { tr: 'Yeşil Kubbe · Ravza', en: 'Green Dome · Rawdah', ar: 'القبة الخضراء' } },
  { key: 'baqi', pos: [240, 60] as Pt, h: 0, text: { tr: "Cennetü'l-Bakî", en: 'Jannat al-Baqi', ar: 'البقيع' } },
  { key: 'minaret', pos: [147, -190] as Pt, h: 105, text: { tr: 'Minare 105 m', en: 'Minaret 105 m', ar: 'مئذنة ١٠٥ م' } },
];
