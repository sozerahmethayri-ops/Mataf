// Mescid-i Haram: OpenStreetMap'in gerçek 3D bina parçalarından (© OpenStreetMap katkıcıları, ODbL).
// Dış hat, Mataf avlusu, Mes'a, Kral Abdullah genişlemesi, 13 minare, kubbeler ve Ebrâcü'l-Beyt (Saat Kulesi)
// OSM'deki konum, yükseklik ve çatı biçimleriyle çizilir; Kâbe ayrıntılı kendi modelimizdir (tavaf asistanıyla ortak).
import { GATES, type Pt } from '@/data/sites';
import { HARAM_3D } from '@/data/osm/haram3d';
import { KAABA_POLY, MAQAM, hijrBand } from '@/services/tawaf';
import { buildKaaba } from './kaaba';
import { Cam, mixHex, type Prim } from './oblique';
import { arcades, buildModel, decodeOsm3d, drawModel, hull, type Model, type Paint, type Part } from './osm3d';

const f = (v: number) => v.toFixed(1);
const GOLDISH = /^#(ffcc00|ffd700|d4af37)$/i;

/** OSM renklerini sahnenin açık mermer tonlarına yaklaştırır (kubbeler OSM'de turuncu işaretli; gerçekte açık renk). */
function paint(p: Part): Paint {
  const tone = (c: string | null, t: number) => {
    if (!c) return null;
    if (GOLDISH.test(c)) return '#D4AF37';
    if (c.toLowerCase() === '#ff6414') return '#E2DDD3';
    if (c.toLowerCase() === '#277db5') return '#A8C1CF';
    return mixHex(c, '#F2EDE4', t);
  };
  const wall = tone(p.wall, 0.42) ?? '#E6E0D4';
  const roof = tone(p.roofC, 0.22) ?? mixHex(wall, '#FFFFFF', 0.4);
  return { wall, roof, edge: true };
}

/** Saat bölümünün dört yüzüne kadran; en tepeye hilâl. */
function extra(cam: Cam, p: Part): Prim[] {
  const out: Prim[] = [];
  if (p.h0 === 426 && p.h1 === 469 && cam.k >= 0.12) {
    const n = p.pts.length;
    const edges = p.pts.map((a, i) => ({ a, b: p.pts[(i + 1) % n], len: Math.hypot(p.pts[(i + 1) % n][0] - a[0], p.pts[(i + 1) % n][1] - a[1]) }))
      .sort((x, y) => y.len - x.len).slice(0, 4);
    const c: Pt = [p.pts.reduce((s, q) => s + q[0], 0) / n, p.pts.reduce((s, q) => s + q[1], 0) / n];
    for (const e of edges) {
      const t: Pt = [(e.b[0] - e.a[0]) / e.len, (e.b[1] - e.a[1]) / e.len];
      const m: Pt = [(e.a[0] + e.b[0]) / 2, (e.a[1] + e.b[1]) / 2];
      let nrm: Pt = [t[1], -t[0]];
      if ((m[0] - c[0]) * nrm[0] + (m[1] - c[1]) * nrm[1] < 0) nrm = [-nrm[0], -nrm[1]];
      if (cam.depthOf(nrm[0], nrm[1]) <= 0.05) continue;
      const at = (u: number, h: number) => cam.P(m[0] + t[0] * u + nrm[0] * 0.4, m[1] + t[1] * u + nrm[1] * 0.4, h);
      const ring = (r: number) => Array.from({ length: 28 }, (_, i) => {
        const a = (i / 28) * Math.PI * 2;
        const [x, y] = at(r * Math.cos(a), 447.5 + r * Math.sin(a));
        return `${i ? 'L' : 'M'}${f(x)} ${f(y)}`;
      }).join(' ') + ' Z';
      out.push({ t: 'path', d: ring(20.5), fill: '#D4AF37', keep: true });
      out.push({ t: 'path', d: ring(18), fill: '#FDFCF8', nfill: '#E8F7EE' });
      if (cam.k >= 0.35) {
        const [cx, cy] = at(0, 447.5);
        const [hx, hy] = at(6, 456);
        const [mx, my] = at(-2, 462);
        out.push({ t: 'path', d: `M${f(cx)} ${f(cy)} L${f(hx)} ${f(hy)} M${f(cx)} ${f(cy)} L${f(mx)} ${f(my)}`, stroke: '#2B2B2B', sw: Math.max(0.8, 1.2 * cam.k), fill: 'none' });
      }
    }
  }
  if (p.h1 >= 600) {
    // Alemin tepesindeki hilâl
    const cx = p.circ ? p.circ.x : p.pts[0][0];
    const cy0 = p.circ ? p.circ.y : p.pts[0][1];
    const [sx, sy] = cam.P(cx, cy0, p.h1);
    const r = Math.max(2, 6 * cam.k);
    const cy = sy - r * 0.9;
    out.push({ t: 'path', d: `M${f(sx - r)} ${f(cy)} A${f(r)} ${f(r)} 0 0 0 ${f(sx + r)} ${f(cy)} A${f(r * 1.3)} ${f(r * 1.3)} 0 0 1 ${f(sx - r)} ${f(cy)} Z`, fill: '#D4AF37', keep: true });
  }
  return out;
}

const nearGate = (p: Pt) => GATES.some((g) => g.city === 'makkah' && Math.hypot(p[0] - g.pos[0], p[1] - g.pos[1]) < 12);

let model: Model | null = null;
let plaza: Pt[] = [];
function getModel(): Model {
  if (model) return model;
  const data = decodeOsm3d(HARAM_3D);
  const hb = hijrBand();
  const kaabaFp = hull([...KAABA_POLY, ...hb.outer, [MAQAM[0] - 1.5, MAQAM[1] - 1.5], [MAQAM[0] + 1.5, MAQAM[1] + 1.5]]);
  model = buildModel({
    data,
    mass: {
      h: 21, wall: '#E9E3D7', roof: '#F7F4EF',
      decorate: (cam, ws) => arcades(cam, ws, 21, [{ h0: 1.2, h1: 8.5, w: 3.4, step: 6.8 }, { h0: 12, h1: 18.5, w: 2.6, step: 6.8 }], nearGate),
      floor: (cam) => data.inner.map((h) => ({ t: 'poly', pts: h.map(([x, y]) => cam.P(x, y).map(f).join(',')).join(' '), fill: '#FFFFFF' }) as Prim),
    },
    paint,
    // Kâbe, Hicr ve Makam yerine kendi ayrıntılı modelimiz
    skip: (p) => p.pts.every(([x, y]) => Math.hypot(x, y) < 17),
    extra,
    towers: { fromTiers: true, tone: (c) => (GOLDISH.test(c) ? '#D4AF37' : mixHex(c, '#F4F0E9', 0.55)) },
    more: [{ fp: kaabaFp, h0: 0, h1: 13.1, size: 14, draw: (cam) => { const kb = buildKaaba(cam, { shadow: cam.k >= 2 }); return [...kb.under, ...kb.body]; } }],
    ghost: (c) => c[1] > 240,
  });
  // Mescidin çevresindeki beyaz mermer meydan: ana bina + Mes'a + genişleme (30 m pay)
  const pts = [...data.outer[0], ...data.outer[1]];
  plaza = hull(pts.flatMap(([x, y]) => Array.from({ length: 8 }, (_, i) => [x + 30 * Math.cos((i * Math.PI) / 4), y + 30 * Math.sin((i * Math.PI) / 4)] as Pt)));
  return model;
}

export function buildMakkah(cam: Cam): { below: Prim[]; above: Prim[]; ghost: Prim[] } {
  const m = getModel();
  const ground: Prim[] = [{ t: 'poly', pts: plaza.map(([x, y]) => cam.P(x, y).map(f).join(',')).join(' '), fill: '#FAF8F4' }];
  const { below, ghost } = drawModel(cam, m);
  return { below: [...ground, ...below], above: [], ghost };
}

/** Ana ekranda sığdırılacak çekirdek alan: ana bina, Mes'a ve Kral Abdullah Kapısı. */
export const MAKKAH_CORE: Pt[] = [[-262, -345], [185, -345], [185, 212], [-262, 212]];

export const MAKKAH_LABELS = [
  { key: 'kaaba', pos: [0, 0] as Pt, h: 13.1, text: { tr: 'Kâbe · 13,1 m', en: 'Kaaba · 13.1 m', ar: 'الكعبة' } },
  { key: 'masa', pos: [112, -110] as Pt, h: 30, text: { tr: "Mes'a · Safâ–Merve", en: "Mas'a · Safa–Marwah", ar: 'المسعى' } },
  { key: 'tower', pos: [-66, 486] as Pt, h: 601, text: { tr: 'Saat Kulesi · 601 m', en: 'Clock Tower · 601 m', ar: 'برج الساعة' } },
];
