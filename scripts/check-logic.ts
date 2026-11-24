// Hızlı mantık kontrolü: npx tsx scripts/check-logic.ts
import { planRoute } from '../src/services/routing';
import { summarize, type Report, type GateStatus } from '../src/services/reports';
import { DEMO_START } from '../src/data/sites';
import { fitCamera, overlaps, placeLabels } from '../src/scene/layout';
import { MAKKAH_CORE, buildMakkah } from '../src/scene/makkah';
import { CORNERS, KAABA_POLY, adjustLap, bearingOf, initialLap, pointAt, startManual, stepLap, zoneOf, type Fix, type LapState } from '../src/services/tawaf';
import { globalAyah, surahLength } from '../src/services/quranIndex';
import { DUA_LIB, isQuranRef } from '../src/data/duas';
import { OVERPASS_ENDPOINTS, bearingDeg, distanceM, findMosques, parseOverpass, type El, type Fetcher } from '../src/services/mosques';
import { PALETTES, colorsFor, contrast, type PaletteId } from '../src/constants/theme';
import { DEFAULT_NOTIF, notifText, planNotifications } from '../src/services/adhanPlan';
import type { PrayerKey } from '../src/services/prayer';
import { Cam } from '../src/scene/oblique';
import { nearestEdgeFaces } from '../src/scene/haramArch';
import { buildKaaba } from '../src/scene/kaaba';
import { buildTawafView } from '../src/scene/tawafScene';
import { buildMadinah } from '../src/scene/madinah';
import { decodePolyline, legKind, mapsUrl, parseMotis, parseOsrm, parsePhoton, planTransit, roughRoute, transitUserAgent, uberUrl, meters } from '../src/services/transport';

const now = Date.now();
const r = (gateId: string, status: GateStatus, user: string, minsAgo: number, official = false): Report =>
  ({ id: `${gateId}-${user}-${minsAgo}`, gateId, kind: 'report', status, userId: user, userName: user, official, createdAt: now - minsAgo * 60000 });

let fails = 0;
const ok = (cond: boolean, msg: string) => { console.log(`${cond ? 'OK  ' : 'FAIL'} ${msg}`); if (!cond) fails++; };

// Bildirim kuralları
ok(summarize([r('g', 'closed', 'a', 5), r('g', 'closed', 'b', 5)], 'g').status === 'open', '2 kişi yetmez → varsayılan açık');
ok(summarize([r('g', 'closed', 'a', 5), r('g', 'closed', 'b', 5), r('g', 'closed', 'c', 5)], 'g').status === 'closed', '3 farklı kişi → kapalı');
ok(summarize([r('g', 'closed', 'a', 5), r('g', 'closed', 'a', 6), r('g', 'closed', 'a', 7)], 'g').status === 'open', 'aynı kişi 3 kez → sayılmaz');
ok(summarize([r('g', 'closed', 'a', 130), r('g', 'closed', 'b', 130), r('g', 'closed', 'c', 130)], 'g').status === 'open', '2 saatten eski → düşer');
ok(summarize([r('g', 'closed', 'off', 60, true)], 'g').status === 'closed', 'resmî kapalı → kapalı');
ok(summarize([r('g', 'closed', 'off', 60, true), r('g', 'open', 'a', 1), r('g', 'open', 'b', 1), r('g', 'open', 'c', 1)], 'g').status === 'open', 'resmî kapalı + 3 kişi açıldı → açık');

// Rota: kapı 79 kapalıysa başka kapı seçilmeli
const all = () => 'open' as GateStatus;
const p1 = planRoute('makkah', DEMO_START.makkah, 'mataf', all)!;
ok(p1.gate?.id === 'mk-79', `batıdan Mataf'a en kısa kapı 79 (seçilen: ${p1.gate?.id}, ${Math.round(p1.lengthM)} m)`);
const p2 = planRoute('makkah', DEMO_START.makkah, 'mataf', (id) => (id === 'mk-79' ? 'closed' : 'open'))!;
ok(!!p2.gate && p2.gate.id !== 'mk-79', `79 kapalı → yeni kapı ${p2.gate?.id} (${Math.round(p2.lengthM)} m)`);
const p3 = planRoute('madinah', DEMO_START.madinah, 'rawdah', all)!;
ok(p3.lengthM > 300 && p3.lengthM < 1500, `Medine kuzeyden Ravza girişine ${Math.round(p3.lengthM)} m`);

// Harita yerleşimi: çekirdek alan + rota, üst/alt arayüz arasında kalan bölgeye sığmalı
const vp = { top: 160, bottom: 200, left: 0, right: 0 };
const pts = [...MAKKAH_CORE, ...p1.points];
const cam = fitCamera(pts, 390, 844, vp, { headroom: 28 });
const inView = pts.every((q) => { const [x, y] = cam.P(q[0], q[1]); return x >= 0 && x <= 390 && y >= vp.top && y <= 844 - vp.bottom; });
ok(inView, `Mekke çekirdeği ve rota görünür alanda (ölçek ${cam.k.toFixed(2)} px/m)`);
const lab = placeLabels(
  [{ id: 'a', ax: 200, ay: 400, w: 80, h: 18 }, { id: 'b', ax: 205, ay: 402, w: 80, h: 18 }, { id: 'c', ax: 200, ay: 401, w: 80, h: 18, required: true }],
  [{ x: 230, y: 360, w: 28, h: 38 }], 390, 844, vp,
);
const pin = { x: 230, y: 360, w: 28, h: 38 };
ok(!!lab.a && !!lab.b && !overlaps(lab.a, lab.b, 0) && !overlaps(lab.a, pin, 0) && !overlaps(lab.b, pin, 0), 'etiketler birbirine ve kapı işaretine binmiyor');
ok(!!lab.c, 'zorunlu etiket (hedef) yer olmasa da gösteriliyor');

// ── Tavaf şavt sayacı: gürültülü GPS benzetimleri ──
function rng(seed: number) { return () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
function gauss(r: () => number) { return Math.sqrt(-2 * Math.log(r() + 1e-12)) * Math.cos(2 * Math.PI * r()); }
type Sim = { radius: number; sigma: number; acc: number; fromDeg: number; toDeg: number; outliers?: number; speed?: number; seed?: number; dir?: 1 | -1; linger?: { atDeg: number; seconds: number } };
const simulateAcc = (o: Sim) => simulate(o);
function simulate(o: Sim, st0: LapState = initialLap()) {
  const r = rng(o.seed ?? 7);
  const v = o.speed ?? 0.8; // m/s
  const step = ((v / o.radius) * 180) / Math.PI; // °/s
  let st = st0; let t = 0; const events: string[] = []; const lapAt: number[] = [];
  const feed = (deg: number) => {
    let p = pointAt(deg, o.radius);
    let acc = o.acc;
    if (o.outliers && r() < o.outliers) { p = [(r() - 0.5) * 300, (r() - 0.5) * 300]; acc = o.acc; }
    else p = [p[0] + gauss(r) * o.sigma, p[1] + gauss(r) * o.sigma];
    const f: Fix = { p, acc, t: (t += 1000) };
    const res = stepLap(st, f); st = res.st;
    for (const e of res.events) { events.push(e.type); if (e.type !== 'start') lapAt.push(deg); }
  };
  const dir = o.dir ?? 1;
  for (let deg = o.fromDeg; dir > 0 ? deg <= o.toDeg : deg >= o.toDeg; deg += step * dir) {
    feed(deg);
    if (o.linger && Math.abs(deg - o.linger.atDeg) < step / 2) for (let i = 0; i < o.linger.seconds; i++) feed(deg);
  }
  return { st, events, lapAt };
}
{
  const a = simulate({ radius: 25, sigma: 0, acc: 5, fromDeg: -25, toDeg: 7 * 360 + 40 });
  ok(a.st.laps === 7 && a.events.filter((e) => e === 'start').length === 1 && a.events.at(-1) === 'done', `tavaf: temiz iz → 7 şavt (${a.st.laps})`);
  const b = simulate({ radius: 25, sigma: 6, acc: 8, fromDeg: -25, toDeg: 7 * 360 + 40, seed: 3 });
  const early = b.lapAt.some((deg, i) => deg < 360 * (i + 1));
  ok(b.st.laps === 7 && !early, `tavaf: σ=6 m gürültü → 7 şavt, erken sayım yok (${b.st.laps}; ${b.lapAt.map((d) => Math.round(d)).join(',')})`);
  const c = simulate({ radius: 30, sigma: 5, acc: 8, fromDeg: -25, toDeg: 7 * 360 + 40, outliers: 0.06, seed: 11 });
  ok(c.st.laps === 7, `tavaf: %6 sıçrayan ölçüm → yine 7 şavt (${c.st.laps})`);
  const d = simulate({ radius: 25, sigma: 6, acc: 8, fromDeg: -25, toDeg: 3 * 360 - 40, linger: { atDeg: 360, seconds: 120 }, seed: 5 });
  ok(d.st.laps === 2, `tavaf: başlangıç çizgisinde 2 dk bekleme fazladan saymıyor (${d.st.laps}/2)`);
  const e = simulate({ radius: 25, sigma: 3, acc: 6, fromDeg: 2 * 360, toDeg: 0, dir: -1 }, startManual(initialLap()));
  ok(e.st.laps === 0, `tavaf: ters yönde (Kâbe sağda) yürüyüş sayılmıyor (${e.st.laps})`);
  const f = simulate({ radius: 20, sigma: 25, acc: 50, fromDeg: -25, toDeg: 2 * 360 });
  ok(f.st.laps === 0 && f.st.quality !== 'good', `tavaf: GPS zayıfken otomatik sayım yapılmıyor (${f.st.quality})`);
  const g = simulate({ radius: 95, sigma: 10, acc: 12, fromDeg: -10, toDeg: 7 * 360 + 40, seed: 9, speed: 1.1 });
  ok(g.st.laps === 7, `tavaf: çatı katı (r=95 m) → 7 şavt (${g.st.laps})`);
  // Rastgele izler: doğruluk ≈ 1,5σ. Kural: hiçbir koşulda fazla ya da çizgiden önce sayma.
  let over = 0, earlyN = 0, runs = 0;
  for (const radius of [12, 15, 20, 25, 35, 50, 75]) for (const sigma of [3, 5, 8, 10]) for (let seed = 1; seed <= 6; seed++) {
    runs++;
    const x = simulateAcc({ radius, sigma, acc: sigma * 1.5, fromDeg: -25, toDeg: 7 * 360 + 90, outliers: 0.03, seed: seed * 31 + radius });
    if (x.st.laps > 7) over++;
    if (x.lapAt.some((deg, i) => deg < 360 * (i + 1))) { earlyN++; if (process.env.DEBUG) console.log('early', radius, sigma, seed, x.lapAt.map((d, i) => (((d - 360 * (i + 1)) * Math.PI) / 180 * radius).toFixed(1)).join(',')); }
  }
  ok(over === 0 && earlyN === 0, `tavaf: ${runs} rastgele iz (r 12–75 m, σ 3–10 m) → fazla sayım ${over}, erken sayım ${earlyN}`);
  const h = adjustLap(adjustLap(startManual(initialLap()), 1), 1);
  ok(h.laps === 2 && adjustLap(h, -1).laps === 1, 'tavaf: elle +1/−1 düzeltme');
}

// ── Kâbe geometrisi ve bölgeler ──
{
  const b = (k: keyof typeof CORNERS) => Math.round(bearingOf(CORNERS[k]));
  const side = (i: number) => Math.hypot(KAABA_POLY[i][0] - KAABA_POLY[(i + 1) % 4][0], KAABA_POLY[i][1] - KAABA_POLY[(i + 1) % 4][1]);
  ok(b('aswad') > 95 && b('aswad') < 125 && b('iraqi') < 25 && b('yamani') > 180 && b('yamani') < 200 && Math.abs(side(0) - 12.86) < 0.01 && Math.abs(side(1) - 11.03) < 0.01,
    `Kâbe: Hacerü'l-Esved ${b('aswad')}°, Irâkî ${b('iraqi')}°, Şâmî ${b('shami')}°, Yemânî ${b('yamani')}°; duvarlar 12,86 / 11,03 m`);
  const order = [2, 50, 99, 140, 180, 230, 279, 320].map(zoneOf).join('>');
  ok(order === 'start>door>iraqi>hijr>shami>west>yamani>rabbana', `tavaf bölgeleri sırası (${order})`);
}
// ── Kur'an numaralandırması ve dua kütüphanesi ──
{
  let total = 0; for (let i = 1; i <= 114; i++) total += surahLength(i);
  ok(total === 6236 && globalAyah(2, 201) === 208 && globalAyah(36, 1) === 3706, `Mushaf: 6236 ayet; Bakara 201 → 208 (API ile aynı)`);
  const refs = DUA_LIB.flatMap((c) => c.items).filter(isQuranRef);
  const bad = refs.filter((r) => { const [s, a, to = a] = r.quran; return s < 1 || s > 114 || a < 1 || to < a || to > surahLength(s); });
  const texts = DUA_LIB.flatMap((c) => c.items).filter((d) => !isQuranRef(d)) as { ar: string; tr: string; ref: string }[];
  ok(bad.length === 0 && texts.every((d) => d.ar && d.tr && d.ref), `dua kütüphanesi: ${DUA_LIB.length} kategori, ${refs.length} ayet + ${texts.length} metin kaydı; geçersiz ayet referansı ${bad.length}`);
}

// ── En yakın cami (Overpass yanıtı benzetimi) ──
async function mosqueChecks() {
  const o = { lat: 41.0082, lng: 28.9784 }; // İstanbul, Sultanahmet
  const at = (dn: number, de: number) => ({ lat: o.lat + dn / 111320, lon: o.lng + de / (111320 * Math.cos((o.lat * Math.PI) / 180)) });
  const sample: { elements: El[] } = { elements: [
    { type: 'node', id: 1, ...at(300, 0), tags: { amenity: 'place_of_worship', religion: 'muslim', name: 'Sultan Ahmet Camii', 'name:en': 'Blue Mosque', wheelchair: 'yes' } },
    { type: 'way', id: 2, center: at(320, 15), tags: { building: 'mosque', name: 'Sultan Ahmet Camii' } },
    { type: 'node', id: 3, ...at(0, 800), tags: { amenity: 'place_of_worship', religion: 'muslim', place_of_worship: 'musalla' } },
    { type: 'node', id: 4, ...at(-1200, 0), tags: { amenity: 'place_of_worship', religion: 'multifaith', name: 'Prayer room' } },
    { type: 'way', id: 5, center: at(100, 100), tags: { building: 'mosque', religion: 'christian', name: 'Eski cami (kilise)' } },
    { type: 'node', id: 6, ...at(50, 50), tags: { amenity: 'place_of_worship', religion: 'muslim', disused: 'yes', name: 'Kapalı' } },
    { type: 'relation', id: 7, tags: { amenity: 'place_of_worship', religion: 'muslim' } },
  ] };
  const list = parseOverpass(sample, o, 'en');
  ok(list.length === 3 && list[0].name === 'Blue Mosque' && list[0].wheelchair === true && list[1].kind === 'musalla' && list[2].kind === 'multifaith' && Math.abs(list[0].dist - 300) < 5,
    `cami listesi: ${list.map((m) => `${m.name || '(isimsiz)'}/${m.kind}/${Math.round(m.dist)}m`).join(', ')} (kilise, kapalı ve konumsuz kayıt elendi, bina+nokta birleşti)`);

  // Yarıçap büyütme ve yedek sunucu
  const calls: string[] = [];
  const fetcher: Fetcher = async (url, init) => {
    const radius = Number(/around:(\d+)/.exec(decodeURIComponent(init.body))![1]);
    calls.push(`${OVERPASS_ENDPOINTS.indexOf(url)}:${radius}`);
    if (url === OVERPASS_ENDPOINTS[0]) return { ok: false, status: 504, json: async () => ({}) };
    return { ok: true, status: 200, json: async () => (radius >= 10000 ? sample : { elements: [] }) };
  };
  const r = await findMosques(o, 'tr', { fetcher, minCount: 3 });
  ok(r.radius === 10000 && r.mosques.length === 3 && calls.join(' ') === '0:1500 1:1500 0:4000 1:4000 0:10000 1:10000',
    `cami arama: 1,5 → 4 → 10 km büyüdü, çöken sunucudan yedeğe geçti (${calls.join(' ')})`);

  // İnternet yok: son sonuç gösterilir, mesafeler yeni konuma göre
  let stored = '';
  const cache = { get: async () => stored || null, set: async (v: string) => { stored = v; } };
  await findMosques(o, 'tr', { fetcher: async () => ({ ok: true, status: 200, json: async () => sample }), cache });
  const moved = { lat: o.lat + 300 / 111320, lng: o.lng };
  const off = await findMosques(moved, 'tr', { fetcher: async () => { throw new Error('offline'); }, cache });
  ok(!!off.offline && off.mosques[0].dist < 30, `internet yokken son arama gösteriliyor, mesafe yeni konuma göre (${Math.round(off.mosques[0].dist)} m)`);
  let threw = false;
  try { await findMosques(o, 'tr', { fetcher: async () => { throw new Error('offline'); } }); } catch { threw = true; }
  ok(threw, 'internet ve kayıt yoksa hata gösteriliyor (sessizce boş liste değil)');

  const kaaba = { lat: 21.42252, lng: 39.82621 };
  const b = bearingDeg(o, kaaba);
  const d = distanceM(o, kaaba) / 1000;
  ok(b > 150 && b < 153 && d > 2350 && d < 2450, `yön/mesafe: İstanbul → Kâbe ${b.toFixed(1)}° (kıble), ${Math.round(d)} km`);
}


// ── Tema: her palet açık/koyu kipte WCAG AA (4.5:1) kontrastı sağlamalı ──
for (const dark of [false, true]) for (const p of Object.keys(PALETTES) as PaletteId[]) {
  const c = colorsFor(dark, p);
  const pairs: [string, number][] = [
    ['onAccent/accent', contrast(c.onAccent, c.accent)], ['accent/bg', contrast(c.accent, c.bg)],
    ['accent/accentSoft', contrast(c.accent, c.accentSoft)], ['accent/accentTint', contrast(c.accent, c.accentTint)],
    ['ink/surface', contrast(c.ink, c.surface)], ['muted/bg', contrast(c.muted, c.bg)], ['muted/surface', contrast(c.muted, c.surface)],
    ['onInk/ink', contrast(c.onInk, c.ink)], ['closed/closedTint', contrast(c.closed, c.closedTint)], ['open/openTint', contrast(c.open, c.openTint)],
    ['limited/limitedTint', contrast(c.limited, c.limitedTint)], ['user/userTint', contrast(c.user, c.userTint)],
    ['white/green', contrast('#FFFFFF', c.green)], ['ink/limitedFill', contrast('#17181C', c.limitedFill)],
    ...(dark ? [] : [['green/bg', contrast(c.green, c.bg)] as [string, number]]),
  ];
  const bad = pairs.filter(([, v]) => v < 4.5);
  ok(!bad.length, `kontrast ${dark ? 'koyu' : 'açık'}/${p}${bad.length ? ': ' + bad.map(([k, v]) => `${k}=${v.toFixed(2)}`).join(' ') : ''}`);
}

// ── Harita döndürme: derinlik sırası ekrandaki konumla aynı olmalı, sahne her açıda kurulmalı ──
{
  const rnd = rng(7);
  let mism = 0;
  for (const rot of [-35, 0, 45, 90, 180, 270, 333]) {
    const cam = new Cam(1.3, 200, 300, rot);
    for (let i = 0; i < 200; i++) {
      const a: [number, number] = [rnd() * 600 - 300, rnd() * 600 - 300];
      const b: [number, number] = [rnd() * 600 - 300, rnd() * 600 - 300];
      const dd = cam.depthOf(a[0], a[1]) - cam.depthOf(b[0], b[1]);
      const dy = cam.P(a[0], a[1])[1] - cam.P(b[0], b[1])[1];
      if (Math.abs(dd) > 1e-6 && Math.sign(dd) !== Math.sign(dy)) mism++;
    }
  }
  ok(mism === 0, `dönen kamerada önde olan nokta ekranda aşağıda (${mism} uyumsuz)`);
  const lens = [0, 90, 180, 270].map((rot) => { const m = buildMakkah(new Cam(1, 0, 0, rot)); return m.below.length + m.above.length + m.ghost.length; });
  // Arka yüzler gizlendiği için parça sayısı açıya göre birkaç adet oynar
  ok(lens.every((n) => Math.abs(n - lens[0]) <= lens[0] * 0.05 && n > 20), `Mekke sahnesi her açıda kurulur (${lens.join(',')})`);
  const md = [0, 135, 225].map((rot) => { const m = buildMadinah(new Cam(1, 0, 0, rot)); return Object.values(m).flat().length; });
  ok(md.every((n) => Math.abs(n - md[0]) <= md[0] * 0.05 && n > 10), `Medine sahnesi her açıda kurulur (${md.join(',')})`);
  // Kuzey oku: ana yönlerde dönüş açısıyla aynı; ara açılarda eğik izdüşüm nedeniyle yatıklaşır
  const needle = (rot: number) => { const c = new Cam(1, 0, 0, rot); const [x0, y0] = c.P(0, 0); const [x1, y1] = c.P(0, -100); return (Math.atan2(x1 - x0, -(y1 - y0)) * 180) / Math.PI; };
  ok([0, 90, 180, -90].every((r) => Math.abs(((needle(r) - r + 540) % 360) - 180) < 0.01), 'pusula: 0/90/180/-90° dönüşte iğne aynı açıda');
  ok(needle(-35) < -35 && needle(-35) > -90, `pusula: varsayılan eğik görünümde kuzey sola yatık (${needle(-35).toFixed(1)}°)`);
}

// ── Beytullah modeli: her açıdan sağlam çizim, ayrıntı ölçeğe göre ──
{
  let bad = 0, minParts = Infinity, maxParts = 0;
  for (let rot = 0; rot < 360; rot += 15) for (const k of [1, 4, 10, 16]) {
    const kb = buildKaaba(new Cam(k, 300, 300, rot));
    const txt = JSON.stringify([...kb.under, ...kb.body]);
    if (/NaN|Infinity/.test(txt)) bad++;
    if (k === 10) { minParts = Math.min(minParts, kb.body.length); maxParts = Math.max(maxParts, kb.body.length); }
  }
  ok(bad === 0, `Kâbe modeli 24 açı × 4 ölçekte geçersiz koordinat üretmez (${bad})`);
  ok(minParts > 60, `yakın planda ayrıntılı (en az ${minParts}, en çok ${maxParts} parça)`);
  ok(buildKaaba(new Cam(1, 0, 0, 0)).body.length < buildKaaba(new Cam(10, 0, 0, 0)).body.length / 2, 'uzak ölçekte ayrıntı azalır (harita hızlı kalır)');
  // Altın ve örtü koyu temada gerçek rengini korur
  ok(buildKaaba(new Cam(10, 0, 0, 0)).body.filter((p) => p.keep).length > 40, 'örtü/altın/gümüş koyu temada korunur');
  // Tavaf görünümü: Kâbe büyük (uzaktaki izleyiciyi sığdırmak için en az %25), izleyici ekranda
  for (const [r, bearing] of [[6, 110], [24, 20], [45, 250]] as const) {
    const v = buildTawafView({ width: 390, height: 360, viewerBearing: bearing, radius: r });
    const w = v.kaabaBox.w + 8;
    const front = v.cam.P(Math.sin((bearing * Math.PI) / 180) * r, -Math.cos((bearing * Math.PI) / 180) * r);
    ok(w / 390 > (r > 30 ? 0.25 : 0.38) && w / 390 < 0.6 && front[1] < 360 && front[1] > 0, `tavaf görünümü r=${r} m: Kâbe %${Math.round((w / 390) * 100)} genişlik, izleyici ekranda (y=${Math.round(front[1])})`);
  }
}

// ── Mescid-i Haram silüeti: her açı ve ölçekte geçerli çizim, ayrıntı düzeyi, gece ışıkları ──
{
  let bad = 0;
  for (let rot = 0; rot < 360; rot += 30) for (const k of [0.4, 0.8, 1.6, 4]) {
    const m = buildMakkah(new Cam(k, 200, 300, rot));
    if (/NaN|Infinity/.test(JSON.stringify(m))) bad++;
  }
  ok(bad === 0, `Haram sahnesi 12 açı × 4 ölçekte geçersiz koordinat üretmez (${bad})`);
  const near = buildMakkah(new Cam(1.6, 200, 300, -35));
  const all = [...near.below, ...near.above, ...near.ghost];
  ok(all.filter((p) => p.nfill).length >= 8, 'gece temasında pencereler ve kapılar aydınlık');
  ok(all.length < 450, `yakın görünümde şekil sayısı makul (${all.length})`);
  // Bitişik minare/portal: cephesi izleyiciye bakıyorsa binadan sonra (önde), bakmıyorsa önce çizilir
  const mainPoly: [number, number][] = [[-235, -200], [72, -200], [72, 130], [60, 165], [-235, 165]];
  ok(nearestEdgeFaces(new Cam(1, 0, 0, -35), mainPoly, [-80, 165]) && !nearestEdgeFaces(new Cam(1, 0, 0, 145), mainPoly, [-80, 165]),
    'güney kapısı minaresi: güneyden bakınca önde, kuzeyden bakınca binanın arkasında');
  ok(nearestEdgeFaces(new Cam(1, 0, 0, -35), mainPoly, [-235, -40]) === (cam0WestFaces()), 'batı kapısı minaresi cepheyle tutarlı');
}

function cam0WestFaces() { const c = new Cam(1, 0, 0, -35); return c.depthOf(-1, 0) > 0; }

// ── Ezan bildirimleri planı ──
{
  // Sahte vakitler: her gün 05:00, 06:20, 12:10, 15:30, 18:00, 19:30 (yerel)
  const fake = (d: Date): Record<PrayerKey, Date> => {
    const at = (h: number, m: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), h, m);
    return { fajr: at(5, 0), sunrise: at(6, 20), dhuhr: at(12, 10), asr: at(15, 30), maghrib: at(18, 0), isha: at(19, 30) };
  };
  const now0 = new Date(2026, 10, 24, 12, 5); // 12:05 — öğleye 5 dk var
  const on = { ...DEFAULT_NOTIF, enabled: true };
  ok(planNotifications(fake, now0, DEFAULT_NOTIF).length === 0, 'bildirim kapalıyken plan boş');
  const p = planNotifications(fake, now0, on);
  ok(p.length === 60, `iOS sınırı: en çok 60 bildirim (${p.length})`);
  ok(p.every((x, i) => i === 0 || x.at >= p[i - 1].at), 'plan zamana göre sıralı');
  ok(p.every((x) => x.at.getTime() > now0.getTime()), 'geçmiş zamana bildirim kurulmaz');
  ok(p[0].prayer === 'dhuhr' && p[0].kind === 'at', `11:55'teki "10 dk önce" geçti; ilk bildirim öğle vakti (${p[0].prayer}/${p[0].kind})`);
  ok(new Set(p.map((x) => x.id)).size === p.length, 'kimlikler benzersiz');
  ok(!p.some((x) => x.prayer === 'sunrise'), 'güneş varsayılan kapalı');
  const sun = planNotifications(fake, now0, { ...on, prayers: { ...on.prayers, sunrise: true } });
  ok(sun.some((x) => x.prayer === 'sunrise' && x.kind === 'before') && !sun.some((x) => x.prayer === 'sunrise' && x.kind === 'at'), 'güneş için yalnız "önce" uyarısı');
  const b = p.find((x) => x.kind === 'before')!;
  ok(b.prayerAt.getTime() - b.at.getTime() === 10 * 60000, '"10 dk önce" doğru zamanda');
  const only = planNotifications(fake, now0, { ...on, before: 0, prayers: { fajr: true, sunrise: false, dhuhr: false, asr: false, maghrib: false, isha: false } }, { days: 3 });
  ok(only.length === 2 && only.every((x) => x.prayer === 'fajr' && x.kind === 'at'), `yalnız sabah, vaktinde: bugünkü geçti → 3 günde 2 bildirim (${only.length})`);
  const nan = planNotifications((d) => ({ ...fake(d), isha: new Date(NaN) }), now0, on, { days: 2 });
  ok(!nan.some((x) => x.prayer === 'isha'), 'hesaplanamayan vakit (kutup) atlanır');
  const tx = notifText(b, 'tr', '15:30', 10);
  ok(/10 dk/.test(tx.title) && /15:30/.test(tx.body), `bildirim metni: "${tx.title}" / "${tx.body}"`);
  const fx = notifText({ ...p[0], prayer: 'fajr', kind: 'at' }, 'en', '05:00', 0);
  ok(/better than sleep/.test(fx.body), 'sabah ezanı metni');
}

// ── Ulaşım: yer arama, yürüme/araç, toplu taşıma ayrıştırma ──
{
  const ph = parsePhoton({ features: [
    { geometry: { coordinates: [39.8262, 21.4225] }, properties: { osm_type: 'W', osm_id: 1, name: 'المسجد الحرام', city: 'مكة', country: 'السعودية', osm_value: 'mosque' } },
    { geometry: { coordinates: [29.0, 41.0] }, properties: { osm_type: 'N', osm_id: 2, street: 'İstiklal Caddesi', housenumber: '12', city: 'İstanbul', country: 'Türkiye' } },
  ] });
  ok(ph.length === 2 && ph[0].lat === 21.4225 && ph[0].lng === 39.8262 && ph[0].sub === 'مكة, السعودية', 'Photon: ad, alt satır, koordinat sırası (lon,lat)');
  ok(ph[1].name === 'İstiklal Caddesi 12' && ph[1].sub === 'İstanbul, Türkiye', `Photon: adı olmayan adres sokak+numara (${ph[1].name})`);
  const os = parseOsrm({ routes: [{ distance: 1234, duration: 900, geometry: { coordinates: [[39.82, 21.42], [39.83, 21.43]] } }] });
  ok(!!os && os.meters === 1234 && os.coords[1].lat === 21.43, 'OSRM: mesafe/süre/geometri');
  ok(parseOsrm({ routes: [] }) === null, 'OSRM: rota yoksa null');
  const rr = roughRoute({ lat: 21.4225, lng: 39.8262 }, { lat: 21.4325, lng: 39.8262 }, 'foot');
  ok(rr.approximate && Math.abs(rr.meters - 1.3 * 1112) < 15, `yedek tahmin: kuş uçuşu×1.3 (${Math.round(rr.meters)} m)`);
  ok(Math.abs(meters({ lat: 41.0082, lng: 28.9784 }, { lat: 21.4225, lng: 39.8262 }) - distanceM({ lat: 41.0082, lng: 28.9784 }, { lat: 21.4225, lng: 39.8262 })) < 1, 'iki mesafe fonksiyonu aynı sonucu verir');
  // Google kodlama örneği (precision 5): "_p~iF~ps|U_ulLnnqC_mqNvxq`@" → (38.5,-120.2),(40.7,-120.95),(43.252,-126.453)
  const dp = decodePolyline('_p~iF~ps|U_ulLnnqC_mqNvxq`@', 5);
  ok(dp.length === 3 && Math.abs(dp[0].lat - 38.5) < 1e-9 && Math.abs(dp[2].lng + 126.453) < 1e-9, 'çoklu çizgi çözücü (Google örneği)');
  ok(legKind('SUBWAY') === 'metro' && legKind('BUS') === 'bus' && legKind('HIGHSPEED_RAIL') === 'train' && legKind('WALK') === 'walk' && legKind('FERRY') === 'ferry' && legKind('AIRPLANE') === 'other', 'ulaşım türü sınıflandırma');
  const motis = {
    itineraries: [{
      duration: 1980, startTime: '2026-11-24T10:00:00Z', endTime: '2026-11-24T10:33:00Z', transfers: 1,
      legs: [
        { mode: 'WALK', startTime: '2026-11-24T10:00:00Z', endTime: '2026-11-24T10:05:00Z', duration: 300, distance: 380, from: { name: 'START', lat: 41, lon: 29 }, to: { name: 'Taksim', lat: 41.01, lon: 29 } },
        { mode: 'SUBWAY', routeShortName: 'M2', headsign: 'Yenikapı', agencyName: 'Metro İstanbul', routeColor: '009845', routeTextColor: 'FFFFFF', startTime: '2026-11-24T10:05:00Z', endTime: '2026-11-24T10:20:00Z', duration: 900, intermediateStops: [{}, {}, {}], from: { name: 'Taksim', lat: 41.01, lon: 29 }, to: { name: 'Vezneciler', lat: 41.0, lon: 28.96 }, legGeometry: { points: '_p~iF~ps|U_ulLnnqC', precision: 5 } },
        { mode: 'BUS', displayName: '28', startTime: '2026-11-24T10:22:00Z', endTime: '2026-11-24T10:33:00Z', duration: 660, routeColor: 'nope', from: { name: 'Vezneciler', lat: 41.0, lon: 28.96 }, to: { name: 'END', lat: 41.02, lon: 28.94 } },
      ],
    }],
  };
  const it = parseMotis(motis);
  ok(it.length === 1 && it[0].minutes === 33 && it[0].transfers === 1, 'MOTIS: süre ve aktarma');
  const [w, m2, bus] = it[0].legs;
  ok(w.kind === 'walk' && w.minutes === 5 && w.meters === 380, 'MOTIS: yürüme bacağı');
  ok(m2.kind === 'metro' && m2.line === 'M2' && m2.color === '#009845' && m2.stops === 3 && m2.coords.length === 2, 'MOTIS: metro hattı, renk, durak, geometri');
  ok(bus.kind === 'bus' && bus.line === '28' && bus.color === undefined && bus.coords.length === 2, 'MOTIS: geçersiz renk yok sayılır, geometri yoksa iki uç');
  ok(parseMotis({}).length === 0, 'MOTIS: boş yanıt');
  ok(transitUserAgent('0.4.0', 'mail@example.org') === 'MATAF/0.4.0 (mail@example.org)', 'Transitous User-Agent biçimi');
  const g = mapsUrl({ lat: 21.4, lng: 39.8 }, 'transit', 'android', { lat: 21.5, lng: 39.9 });
  ok(g.includes('travelmode=transit') && g.includes('origin=21.5,39.9') && g.includes('destination=21.4,39.8'), 'Google Haritalar toplu taşıma bağlantısı');
  ok(mapsUrl({ lat: 21.4, lng: 39.8 }, 'walk', 'ios').includes('dirflg=w'), 'Apple Haritalar yürüme bağlantısı');
  ok(uberUrl({ lat: 21.4, lng: 39.8 }, 'Mescid-i Haram').includes('dropoff[nickname]=Mescid-i%20Haram'), 'Uber bağlantısı');
}

async function transitChecks() {
  let seen: { url: string; ua?: string } | null = null;
  const f = async (url: string, init?: { headers?: Record<string, string> }) => {
    seen = { url, ua: init?.headers?.['User-Agent'] };
    return { ok: true, status: 200, json: async () => ({ itineraries: [] }) };
  };
  const r1 = await planTransit({ lat: 41, lng: 29 }, { lat: 41.02, lng: 28.94 }, { lang: 'tr', contact: 'a@b.c', version: '0.4.0', fetcher: f, time: new Date('2026-11-24T10:00:00Z') });
  const s1 = seen as { url: string; ua?: string } | null;
  ok(r1.length === 0 && !!s1 && s1.url.includes('/api/v6/plan?fromPlace=41.000000,29.000000') && s1.url.includes('time=2026-11-24T10%3A00%3A00.000Z') && s1.ua === 'MATAF/0.4.0 (a@b.c)', 'Transitous isteği: uç nokta, zaman, User-Agent');
  let threw = false;
  try { await planTransit({ lat: 0, lng: 0 }, { lat: 1, lng: 1 }, { lang: 'en', contact: 'x', version: '1', fetcher: async () => ({ ok: false, status: 429, json: async () => ({}) }) }); } catch { threw = true; }
  ok(threw, 'Transitous hata kodu (429) yakalanır');
}

mosqueChecks().then(transitChecks).then(() => process.exit(fails ? 1 : 0));
