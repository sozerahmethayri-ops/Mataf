// Hızlı mantık kontrolü: npx tsx scripts/check-logic.ts
import { planRoute } from '../src/services/routing';
import { summarize, type Report, type GateStatus } from '../src/services/reports';
import { DEMO_START } from '../src/data/sites';
import { fitCamera, overlaps, placeLabels } from '../src/scene/layout';
import { MAKKAH_CORE } from '../src/scene/makkah';
import { CORNERS, KAABA_POLY, adjustLap, bearingOf, initialLap, pointAt, startManual, stepLap, zoneOf, type Fix, type LapState } from '../src/services/tawaf';
import { globalAyah, surahLength } from '../src/services/quranIndex';
import { DUA_LIB, isQuranRef } from '../src/data/duas';

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

process.exit(fails ? 1 : 0);
