// Mescid-i Haram gerçek ölçekli sahnesi (metre). Ölçüler: Kâbe 12,86×11,03×13,1 m;
// Osmanlı revakı 192×132 m; Mes'a 394×40 m; Saat Kulesi 601 m; minareler 92–139 m.
// Genişleme bloklarının dış hatları yayımlanmış alanlardan oranlanmış tahminlerdir.
import { KAABA_POLY } from '@/services/tawaf';
import { Cam, ellipsePl, extrude, flat, line, minaret, rect, rrect, type Prim } from './oblique';
import type { Pt } from '@/data/sites';

/** `ghost`: Haram'ın önünde yükselen Saat Kulesi kompleksi — harita bunu yarı saydam çizer ki rota ve kapılar örtülmesin. */
/** Kameraya en yakın köşenin derinliği (ressam sıralaması için; harita dönünce de doğru). */
const front = (cam: Cam, poly: Pt[]) => Math.max(...poly.map(([x, y]) => cam.depthOf(x, y)));

export function buildMakkah(cam: Cam): { below: Prim[]; above: Prim[]; ghost: Prim[] } {
  const P = cam.P.bind(cam);
  const below: Prim[] = [];
  const above: Prim[] = [];
  const ghost: Prim[] = [];
  const k = cam.k;

  for (const [a, b] of [
    [[-700, 205], [700, 205]], [[-300, -900], [-300, 900]], [[170, -900], [170, 900]], [[-700, -600], [700, -600]],
  ] as [Pt, Pt][]) below.push(line(cam, a, b, '#FFFFFF', 16 * k));
  below.push(flat(cam, rect(-285, -590, 150, 235), '#FAF8F4'));

  type Obj = { d: number; prims: Prim[]; main?: boolean; ghost?: boolean };
  const objs: Obj[] = [];
  const ka: Pt[] = [[-240, -555], [70, -555], [70, -240], [-240, -240]];
  objs.push({ d: front(cam, ka), prims: extrude(cam, ka, 0, 35, '#F4F1EB', '#DCD5C8', '#CEC6B7') });
  const masa: Pt[] = [[72, -290], [118, -290], [118, 104], [72, 104]];
  objs.push({ d: front(cam, masa), prims: extrude(cam, masa, 0, 30, '#EDE6D9', '#D9D1C3', '#CBC2B2') });
  const main: Pt[] = [[-235, -200], [72, -200], [72, 130], [60, 165], [-235, 165]];
  const ottoOuter = rrect(-66, -96, 66, 96, 6);
  const mainD = front(cam, main);
  objs.push({ d: mainD, prims: extrude(cam, main, 0, 22, '#F7F4EF', '#DDD6CA', '#CFC6B6', [ottoOuter]), main: true });
  objs.push({ d: front(cam, rect(-150, 250, 85, 410)), ghost: true, prims: extrude(cam, rect(-150, 250, 85, 410), 0, 70, '#EFEAE2', '#D8D0C2', '#C8BFAF') });
  // Saat Kulesi ve yan kuleler
  objs.push({ d: front(cam, rect(-58, 298, -2, 354)), ghost: true, prims: extrude(cam, rect(-58, 298, -2, 354), 70, 450, '#E9E3D8', '#D6CEBF', '#C4BBAA') });
  objs.push({ d: front(cam, rect(-58, 298, -2, 354)) + 0.1, ghost: true, prims: extrude(cam, rect(-50, 306, -10, 346), 450, 530, '#EFE9DF', '#DDD5C7', '#CBC2B1') });
  for (const [x0, y0, x1, y1, h] of [[25, 262, 70, 300, 250], [-140, 262, -95, 300, 240], [25, 362, 70, 402, 230], [-140, 362, -95, 402, 220]])
    objs.push({ d: front(cam, rect(x0, y0, x1, y1)), ghost: true, prims: extrude(cam, rect(x0, y0, x1, y1), 70, h, '#ECE6DC', '#D8D0C2', '#C6BDAD') });
  for (const [x, y, h] of [[-235, -40, 92], [-235, 5, 92], [-80, 165, 92], [-40, 165, 92], [-185, -200, 92], [-150, -200, 92], [108, 104, 92], [100, -290, 92], [-105, -555, 139], [-65, -555, 139]])
    objs.push({ d: cam.depthOf(x, y) + 0.05, prims: minaret(cam, x, y, h) });
  objs.sort((a, b) => a.d - b.d);

  // Osmanlı revakı ve açık avlu (Mataf)
  const inner: Prim[] = [];
  inner.push(flat(cam, ottoOuter, '#FFFFFF'));
  for (const r of [22, 36, 50]) {
    const pts = ellipsePl(0, 0, r, r, 48).map(([x, y]) => P(x, y));
    inner.push({ t: 'poly', pts: pts.map(([a, b]) => `${a.toFixed(1)},${b.toFixed(1)}`).join(' '), fill: 'none', stroke: '#ECE6DC', sw: 0.8 });
  }
  const sahn = rrect(-52, -82, 52, 82, 10);
  inner.push(...extrude(cam, ottoOuter, 0, 12, '#ECE5D7', '#DAD2C4', '#CDC4B4', [sahn]));
  for (let dx = -60; dx <= 63; dx += 9)
    for (let dy = -90; dy <= 93; dy += 9) {
      if (Math.abs(dx) < 56 && Math.abs(dy) < 86) continue;
      if (Math.abs(dx) > 62 || Math.abs(dy) > 92) continue;
      const [cx, cy] = P(dx, dy, 12);
      inner.push({ t: 'ell', cx, cy: cy - 0.8, rx: 3.1 * k, ry: 1.9 * k, fill: '#BDB8AE' });
    }

  // Kâbe: gerçek ölçü ve yön (tavaf asistanıyla aynı geometri)
  const kb = KAABA_POLY;
  const kaaba = [
    ...extrude(cam, kb, 0, 13.1, '#2F3036', '#202126', '#131418', [], '#131418'),
    ...extrude(cam, kb, 8.6, 9.6, '#2F3036', '#C9A227', '#B08B1C', [], 'none'),
    flat(cam, kb, '#2F3036', 13.1),
  ];

  for (const o of objs) if (o.d < mainD && !o.main) below.push(...o.prims);
  below.push(...inner);
  below.push(...(objs.find((o) => o.main)?.prims ?? []));
  below.push(...kaaba);
  for (const o of objs) if (o.d > mainD) (o.ghost ? ghost : above).push(...o.prims);
  const [c1x, c1y] = P(-30, 354, 420);
  const [c2x, c2y] = P(-2, 326, 420);
  const [sbx, sby] = P(-30, 326, 530);
  const [stx, sty] = P(-30, 326, 601);
  ghost.push({ t: 'circ', cx: c1x, cy: c1y, r: 20 * k, fill: '#FFFFFF', stroke: '#C9A227', sw: 1.4 });
  ghost.push({ t: 'circ', cx: c2x, cy: c2y, r: 20 * k, fill: '#FFFFFF', stroke: '#C9A227', sw: 1.4 });
  ghost.push({ t: 'path', d: `M${sbx.toFixed(1)} ${sby.toFixed(1)} L${stx.toFixed(1)} ${sty.toFixed(1)}`, stroke: '#B9AD95', sw: 2.4 });
  ghost.push({ t: 'circ', cx: stx, cy: sty - 1, r: 2.6, fill: '#C9A227' });
  return { below, above, ghost };
}

/** Ana ekranda sığdırılacak çekirdek alan: revak + Mes'a + çevre yolu. */
export const MAKKAH_CORE: Pt[] = [[-262, -222], [140, -222], [140, 195], [-262, 195]];

export const MAKKAH_LABELS = [
  { key: 'kaaba', pos: [0, 0] as Pt, h: 13.1, text: { tr: 'Kâbe · 13,1 m', en: 'Kaaba · 13.1 m', ar: 'الكعبة' } },
  { key: 'masa', pos: [118, -220] as Pt, h: 30, text: { tr: "Mes'a · 394 m", en: "Mas'a · 394 m", ar: 'المسعى' } },
  { key: 'tower', pos: [-30, 326] as Pt, h: 601, text: { tr: 'Saat Kulesi · 601 m', en: 'Clock Tower · 601 m', ar: 'برج الساعة' } },
];
