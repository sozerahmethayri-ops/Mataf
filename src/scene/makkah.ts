// Mescid-i Haram gerçek ölçekli sahnesi (metre). Ölçüler: Kâbe 12,86×11,03×13,1 m;
// Osmanlı revakı 192×132 m; Mes'a 394×40 m; Saat Kulesi 601 m; minareler 92–139 m.
// Genişleme bloklarının dış hatları yayımlanmış alanlardan oranlanmış tahminlerdir.
import { clockTower, dome, domeField, facade, nearestEdgeFaces, portal, roofGrid, wallPrims } from './haramArch';
import { buildKaaba } from './kaaba';
import { Cam, ellipsePl, extrude, flat, line, minaret, rect, rrect, visibleWalls, type Prim } from './oblique';
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

  type Obj = { d: number; prims: Prim[]; ghost?: boolean };
  const objs: Obj[] = [];
  const ka: Pt[] = [[-240, -555], [70, -555], [70, -240], [-240, -240]];
  const masa: Pt[] = [[72, -290], [118, -290], [118, 104], [72, 104]];
  const main: Pt[] = [[-235, -200], [72, -200], [72, 130], [60, 165], [-235, 165]];
  const ottoOuter = rrect(-66, -96, 66, 96, 6);
  const hosts = { main, ka, masa };
  type Host = keyof typeof hosts;

  // Kapı portalları (iki minare arasında) ve minareler — bağlı oldukları binaya göre önde/arkada çizilir
  type Att = { host: Host; at: Pt; prims: Prim[] };
  const att: Att[] = [];
  const PORTALS: { host: Host; a: Pt; b: Pt; out: Pt; h: number }[] = [
    { host: 'main', a: [-235, -32], b: [-235, -3], out: [-1, 0], h: 31 }, // Kral Fahd Kapısı (79)
    { host: 'main', a: [-44, 165], b: [-76, 165], out: [0, 1], h: 31 }, // Kral Abdülaziz Kapısı (1)
    { host: 'main', a: [-154, -200], b: [-181, -200], out: [0, -1], h: 29 }, // kuzey kapısı
    { host: 'ka', a: [-69, -555], b: [-101, -555], out: [0, -1], h: 47 }, // Kral Abdullah Kapısı (100)
  ];
  for (const g of PORTALS) att.push({ host: g.host, at: [(g.a[0] + g.b[0]) / 2, (g.a[1] + g.b[1]) / 2], prims: portal(cam, g.a, g.b, g.out, 7, g.h) });
  const MINARETS: [number, number, number, Host][] = [
    [-235, -40, 92, 'main'], [-235, 5, 92, 'main'], [-80, 165, 92, 'main'], [-40, 165, 92, 'main'], [-185, -200, 92, 'main'], [-150, -200, 92, 'main'],
    [108, 104, 92, 'masa'], [100, -290, 92, 'masa'], [-105, -555, 139, 'ka'], [-65, -555, 139, 'ka'],
  ];
  for (const [x, y, h, host] of MINARETS) att.push({ host, at: [x, y], prims: minaret(cam, x, y, h) });
  const attOf = (host: Host, front: boolean) => att
    .filter((a) => a.host === host && nearestEdgeFaces(cam, hosts[host], a.at) === front)
    .sort((p, q) => cam.depthOf(...p.at) - cam.depthOf(...q.at))
    .flatMap((a) => a.prims);
  const busy = (p: Pt) => PORTALS.some((g) => Math.hypot(p[0] - (g.a[0] + g.b[0]) / 2, p[1] - (g.a[1] + g.b[1]) / 2) < 20) || MINARETS.some(([x, y]) => Math.hypot(p[0] - x, p[1] - y) < 6);

  // Kral Abdullah genişlemesi
  objs.push({ d: front(cam, ka), prims: [
    ...attOf('ka', false),
    ...extrude(cam, ka, 0, 35, '#F4F1EB', '#E6E0D5', '#C9C0B0', [], '#DCD4C6', { grad: true }),
    ...[roofGrid(cam, -237, -552, 67, -243, 35, 16)].filter((x): x is Prim => !!x),
    ...facade(cam, visibleWalls(cam, ka), 35, [{ h0: 1.5, h1: 11, w: 4, step: 8 }, { h0: 15, h1: 23, w: 3, step: 8 }, { h0: 26, h1: 32, w: 2.4, step: 8 }], { skipNear: busy }),
    ...attOf('ka', true),
  ] });
  // Mes'a (Safâ–Merve): iki katlı galeri, Safâ ve Merve kubbeleri
  objs.push({ d: front(cam, masa), prims: [
    ...attOf('masa', false),
    ...extrude(cam, masa, 0, 30, '#EDE6D9', '#E2DACC', '#C6BCAB', [], '#DCD4C6', { grad: true }),
    ...facade(cam, visibleWalls(cam, masa), 30, [{ h0: 1.5, h1: 10, w: 3.4, step: 6 }, { h0: 15, h1: 25, w: 3.4, step: 6 }], { skipNear: busy }),
    ...dome(cam, 95, 82, 30, 10.5, 'marble'),
    ...dome(cam, 95, -270, 30, 8, 'marble'),
    ...attOf('masa', true),
  ] });
  // Saat Kulesi kompleksi (yarı saydam): kaide, yan kuleler ve ana kule
  objs.push({ d: front(cam, rect(-150, 250, 85, 410)), ghost: true, prims: extrude(cam, rect(-150, 250, 85, 410), 0, 70, '#EFEAE2', '#DED6C9', '#C2B9A8', [], '#DCD4C6', { grad: true }) });
  for (const [x0, y0, x1, y1, h] of [[25, 262, 70, 300, 250], [-140, 262, -95, 300, 240], [25, 362, 70, 402, 230], [-140, 362, -95, 402, 220]]) {
    const pl = rect(x0, y0, x1, y1);
    const [cx, cy] = [(x0 + x1) / 2, (y0 + y1) / 2];
    objs.push({ d: front(cam, pl), ghost: true, prims: [
      ...extrude(cam, pl, 70, h, '#ECE6DC', '#DDD5C8', '#C3BAA9', [], '#DCD4C6', { grad: true }),
      ...dome(cam, cx, cy, h, 12, 'marble'),
    ] });
  }
  for (const t of clockTower(cam)) objs.push({ ...t, ghost: true });
  objs.sort((a, b) => a.d - b.d);
  const mainD = front(cam, main);

  // Osmanlı revakı (kurşun kubbeli) ve açık avlu (Mataf)
  const inner: Prim[] = [];
  inner.push(flat(cam, ottoOuter, '#FFFFFF'));
  for (const r of [22, 36, 50]) {
    const pts = ellipsePl(0, 0, r, r, 48).map(([x, y]) => P(x, y));
    inner.push({ t: 'poly', pts: pts.map(([a, b]) => `${a.toFixed(1)},${b.toFixed(1)}`).join(' '), fill: 'none', stroke: '#ECE6DC', sw: 0.8 });
  }
  const sahn = rrect(-52, -82, 52, 82, 10);
  inner.push(...extrude(cam, ottoOuter, 0, 12, '#ECE5D7', '#E2DACC', '#C8BFAF', [sahn], '#DCD4C6', { grad: k >= 1 }));
  if (k >= 1.2) inner.push(...facade(cam, visibleWalls(cam, [], [sahn]), 12, [{ h0: 0.5, h1: 7.5, w: 3.6, step: 4.5 }]));
  const domes: Pt[] = [];
  for (let dx = -60; dx <= 63; dx += 9)
    for (let dy = -90; dy <= 93; dy += 9) {
      if (Math.abs(dx) < 56 && Math.abs(dy) < 86) continue;
      if (Math.abs(dx) > 62 || Math.abs(dy) > 92) continue;
      domes.push([dx, dy]);
    }
  inner.push(...domeField(cam, domes, 12, 3.1));

  // Kâbe: gerçek ölçü ve yön, Hatîm ve Makam'la (tavaf asistanıyla aynı model)
  const kaaba = buildKaaba(cam, { shadow: k >= 2 });

  // Ana bina (Suudi genişlemeleri): iç avlu duvarları → revak → Kâbe → çatı → dış cepheler
  const sub = (pl: Pt[]) => pl.map(([x, y], i) => { const [a, b] = P(x, y, 22); return `${i ? 'L' : 'M'}${a.toFixed(1)} ${b.toFixed(1)}`; }).join(' ') + ' Z';
  const outerWalls = visibleWalls(cam, main);
  const mainGroup: Prim[] = [
    ...attOf('main', false),
    ...wallPrims(cam, visibleWalls(cam, [], [ottoOuter]), 0, 22, '#EFEAE1', '#CBC2B2'),
    ...inner,
    ...kaaba.under, ...kaaba.body,
    { t: 'path', d: [main, ottoOuter].map(sub).join(' '), fill: '#F7F4EF', stroke: '#DCD4C6', sw: 0.8, rule: 'evenodd' },
    ...[roofGrid(cam, -232, -197, 69, 162, 22, 16, [[-70, -100, 70, 100], [60, 130, 75, 170]])].filter((x): x is Prim => !!x),
    ...(k >= 0.9 ? [{ t: 'path', d: sub(offsetRect(main, 3)), fill: 'none', stroke: '#E6E0D5', sw: Math.max(0.5, 0.6 * k) } as Prim] : []),
    ...wallPrims(cam, outerWalls, 0, 22, '#F3EEE6', '#CBC2B2'),
    ...facade(cam, outerWalls, 22, [{ h0: 1.2, h1: 8.5, w: 3.4, step: 6.8 }, { h0: 12, h1: 18.5, w: 2.6, step: 6.8 }], { skipNear: busy }),
    ...attOf('main', true),
  ];

  for (const o of objs) if (o.d < mainD) (o.ghost ? ghost : below).push(...o.prims);
  below.push(...mainGroup);
  for (const o of objs) if (o.d >= mainD) (o.ghost ? ghost : above).push(...o.prims);
  return { below, above, ghost };
}

/** Çatı kenarındaki korkuluk çizgisi için çokgeni içe kaydırır (yaklaşık). */
function offsetRect(pl: Pt[], d: number): Pt[] {
  const cx = pl.reduce((s, p) => s + p[0], 0) / pl.length;
  const cy = pl.reduce((s, p) => s + p[1], 0) / pl.length;
  return pl.map(([x, y]) => [x + Math.sign(cx - x) * d, y + Math.sign(cy - y) * d]);
}

/** Ana ekranda sığdırılacak çekirdek alan: revak + Mes'a + çevre yolu. */
export const MAKKAH_CORE: Pt[] = [[-262, -222], [140, -222], [140, 195], [-262, 195]];

export const MAKKAH_LABELS = [
  { key: 'kaaba', pos: [0, 0] as Pt, h: 13.1, text: { tr: 'Kâbe · 13,1 m', en: 'Kaaba · 13.1 m', ar: 'الكعبة' } },
  { key: 'masa', pos: [118, -220] as Pt, h: 30, text: { tr: "Mes'a · 394 m", en: "Mas'a · 394 m", ar: 'المسعى' } },
  { key: 'tower', pos: [-30, 326] as Pt, h: 601, text: { tr: 'Saat Kulesi · 601 m', en: 'Clock Tower · 601 m', ar: 'برج الساعة' } },
];
