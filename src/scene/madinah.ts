// Mescid-i Nebevî: OpenStreetMap'in gerçek bina dış hatlarından (© OpenStreetMap katkıcıları, ODbL).
// Ana bina (13 m), Yeşil Kubbe, 10 minarenin gerçek yeri ve yüksekliği (104 m / 70 m), çevredeki otel ve
// yapılar ile Cennetü'l-Bakî sınırı OSM'den gelir. Meydanlardaki 250 şemsiye 26 m aralıklı düzenle çizilir
// (gerçek düzene yakın, birebir değil); yüksekliği bilinmeyen oteller OSM'de verilen ya da tahmini yüksekliktedir.
import type { Pt } from '@/data/sites';
import { BAQI, NABAWI_3D } from '@/data/osm/nabawi3d';
import { Cam, type Prim } from './oblique';
import { arcades, buildModel, cylinder, decodeOsm3d, domeCap, drawModel, hull, pointInPoly, signedArea, type Item, type Model, type Paint, type Part } from './osm3d';

const f = (v: number) => v.toFixed(1);
const GREEN_DOME: Pt = [4.7, -7.6];

const isGreenDome = (p: Part) => !!p.circ && p.roof === 'D' && Math.hypot(p.circ.x - GREEN_DOME[0], p.circ.y - GREEN_DOME[1]) < 6;

/**
 * Yeşil Kubbe: OSM'de 13–19 m (kasnak + basık kubbe) olarak işli; fotoğraflardaki biçime göre kasnak, sivri
 * Osmanlı kubbesi ve altın alemle çizilir (çap OSM'den, ≈16,6 m; yükseklik yaklaşık).
 */
function greenDome(): Item {
  const [x, y] = GREEN_DOME;
  const r = 8.3;
  return {
    fp: Array.from({ length: 10 }, (_, i) => [x + r * Math.cos((i * Math.PI) / 5), y + r * Math.sin((i * Math.PI) / 5)] as Pt),
    h0: 13, h1: 26, size: 10,
    draw: (cam) => {
      const out: Prim[] = [cylinder(cam, x, y, r, 13, 15.5, '#3F8F5E'), domeCap(cam, x, y, r, 15.5, 8, '#2F8F57', false, true)];
      const [bx, b] = cam.P(x, y, 15.5);
      const H = 8 * 0.81 * cam.k + r * cam.k * 0.58 * 0.55;
      const top = b - H;
      const fin = Math.max(4, 3.2 * cam.k);
      out.push({ t: 'path', d: `M${f(bx)} ${f(top)} L${f(bx)} ${f(top - fin)}`, stroke: '#C9A227', sw: Math.max(0.8, 0.35 * cam.k), fill: 'none', keep: true });
      const rr = Math.max(1.1, 0.9 * cam.k);
      const cy = top - fin - rr * 0.9;
      out.push({ t: 'path', d: `M${f(bx - rr)} ${f(cy)} A${f(rr)} ${f(rr)} 0 0 0 ${f(bx + rr)} ${f(cy)} A${f(rr * 1.3)} ${f(rr * 1.3)} 0 0 1 ${f(bx - rr)} ${f(cy)} Z`, fill: '#D4AF37', keep: true });
      return out;
    },
  };
}

function paint(p: Part): Paint {
  const small = Math.abs(signedArea(p.pts)) < 450 && p.h1 <= 8;
  return small ? { wall: '#E8E2D6', roof: '#F1EDE5' } : { wall: '#E0D9CC', roof: '#ECE7DE', edge: true };
}

/** Açık şemsiye: direk + 24 m kare tente (14 m yükseklikte). */
function umbrella(x: number, y: number): Item {
  const s = 12;
  const h = 14;
  const fp: Pt[] = [[x - s, y - s], [x + s, y - s], [x + s, y + s], [x - s, y + s]];
  return {
    fp, h0: 0, h1: h + 1, size: 12,
    draw: (cam) => {
      const [bx, by] = cam.P(x, y);
      const [tx, ty] = cam.P(x, y, h);
      const top = fp.map(([a, b]) => cam.P(a, b, h));
      const out: Prim[] = [{ t: 'path', d: `M${f(bx)} ${f(by)} L${f(tx)} ${f(ty)}`, stroke: '#CFC8BB', sw: 0.8, fill: 'none' }];
      out.push({ t: 'poly', pts: top.map(([a, b]) => `${f(a)},${f(b)}`).join(' '), fill: '#FFFFFF' });
      if (cam.k >= 1.2) out.push({ t: 'path', d: `M${top.map(([a, b]) => `${f(a)} ${f(b)}`).join(' L')} Z`, stroke: '#DAD3C6', sw: 0.6, fill: 'none' });
      return out;
    },
  };
}

let model: Model | null = null;
let plaza: Pt[] = [];
function getModel(): Model {
  if (model) return model;
  const data = decodeOsm3d(NABAWI_3D);
  const parts = data.parts;
  const main = parts.reduce((a, p) => (Math.abs(signedArea(p.pts)) > Math.abs(signedArea(a.pts)) ? p : a));
  const others = parts.filter((p) => p !== main && p.h0 < 1);
  // Meydan: ana binanın 115 m çevresi
  plaza = hull(main.pts.flatMap(([x, y]) => Array.from({ length: 8 }, (_, i) => [x + 115 * Math.cos((i * Math.PI) / 4), y + 115 * Math.sin((i * Math.PI) / 4)] as Pt)));
  // Şemsiyeler: meydanda, binalara ve Bakî'ye değmeyecek yerlerde; her 5. sütun ve 6. sıra yürüme yolu
  const clear = (x: number, y: number) => {
    if (!pointInPoly([x, y], plaza) || pointInPoly([x, y], BAQI)) return false;
    for (const [dx, dy] of [[0, 0], [14, 0], [-14, 0], [0, 14], [0, -14], [10, 10], [-10, 10], [10, -10], [-10, -10]]) {
      const q: Pt = [x + dx, y + dy];
      if (pointInPoly(q, main.pts) || others.some((p) => pointInPoly(q, p.pts))) return false;
    }
    return true;
  };
  const umbrellas: Item[] = [];
  let ix = 0;
  for (let x = -340; x <= 300; x += 26, ix++) {
    let iy = 0;
    for (let y = -385; y <= 150; y += 26, iy++) {
      if (ix % 5 === 2 || iy % 6 === 3) continue;
      if (clear(x, y)) umbrellas.push(umbrella(x, y));
    }
  }
  model = buildModel({
    data,
    massFromLargest: {
      minArea: 60000, wall: '#ECE6DB', roof: '#F6F3EE',
      decorate: (cam, ws) => arcades(cam, ws, 13, [{ h0: 1, h1: 9.5, w: 3.4, step: 6.5 }]),
    },
    paint,
    towers: { marks: true },
    skip: isGreenDome,
    more: [...umbrellas, greenDome()],
  });
  return model;
}

export function buildMadinah(cam: Cam): { below: Prim[]; above: Prim[]; ghost: Prim[] } {
  const m = getModel();
  const P = (p: Pt) => cam.P(p[0], p[1]);
  const poly = (pl: Pt[], fill: string, extra: Partial<Prim> = {}): Prim => ({ t: 'poly', pts: pl.map((q) => P(q).map(f).join(',')).join(' '), fill, ...extra }) as Prim;
  const ground: Prim[] = [poly(plaza, '#FAF8F4'), poly(BAQI, '#EFE6D3', { stroke: '#D3C5A6', sw: Math.max(0.8, 1.6 * cam.k) })];
  // Bakî: mezar taşları (seyrek nokta deseni)
  if (cam.k >= 0.7) {
    const dots: string[] = [];
    const r = 0.9;
    for (let gx = 220; gx < 790; gx += 16)
      for (let gy = -115; gy < 300; gy += 16) {
        if (!pointInPoly([gx, gy], BAQI)) continue;
        const [cx, cy] = P([gx, gy]);
        dots.push(`M${f(cx - r)} ${f(cy)} a${r} ${r * 0.7} 0 1 0 ${2 * r} 0 a${r} ${r * 0.7} 0 1 0 ${-2 * r} 0`);
      }
    if (dots.length) ground.push({ t: 'path', d: dots.join(' '), fill: '#CDBD9C' });
  }
  const { below, ghost } = drawModel(cam, m);
  return { below: [...ground, ...below], above: [], ghost };
}

/** Ana ekranda sığdırılacak çekirdek alan: ana bina ve hemen çevresi. */
export const MADINAH_CORE: Pt[] = [[-257, -297], [211, -297], [211, 44], [-257, 44]];

export const MADINAH_LABELS = [
  { key: 'dome', pos: GREEN_DOME, h: 26, text: { tr: 'Yeşil Kubbe · Ravza', en: 'Green Dome · Rawdah', ar: 'القبة الخضراء' } },
  { key: 'baqi', pos: [480, 90] as Pt, h: 0, text: { tr: "Cennetü'l-Bakî", en: 'Jannat al-Baqi', ar: 'البقيع' } },
  { key: 'minaret', pos: [-217.7, -247.3] as Pt, h: 104, text: { tr: 'Minare 104 m', en: 'Minaret 104 m', ar: 'مئذنة ١٠٤ م' } },
];

