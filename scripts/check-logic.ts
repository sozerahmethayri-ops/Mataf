// Hızlı mantık kontrolü: npx tsx scripts/check-logic.ts
import { isInsideBuilding, planRoute, walkPath } from '../src/services/routing';
import { summarize, type Report, type GateStatus } from '../src/services/reports';
import { DEMO_START, DESTINATIONS, GATES } from '../src/data/sites';
import { fitCamera, overlaps, placeLabels } from '../src/scene/layout';
import { MAKKAH_CORE, buildMakkah } from '../src/scene/makkah';
import { CORNERS, KAABA_POLY, adjustLap, bearingOf, initialLap, pointAt, startManual, stepLap, zoneOf, type Fix, type LapState } from '../src/services/tawaf';
import { globalAyah, surahLength } from '../src/services/quranIndex';
import { DUA_LIB, isQuranRef } from '../src/data/duas';
import { TAWAF_DHIKR, type DuaText } from '../src/data/tawaf';
import { OVERPASS_ENDPOINTS, bearingDeg, distanceM, findMosques, parseOverpass, parsePhotonMosques, pickMosques, type El, type Fetcher } from '../src/services/mosques';
import { PALETTES, colorsFor, contrast, type PaletteId } from '../src/constants/theme';
import { WIDGET_DAYS, buildLogWidgetProps, buildWidgetProps, widgetMode, widgetNext, withAlpha, widgetPlace, widgetTicks } from '../src/services/widgetProps';
import { hijriText } from '../src/services/hijri';
import { ARAFAT_AREA, HAC_PLACES, NAMIRA_MOSQUE } from '../src/data/osm/hacSites';
import { MEMBER_COLORS, colorFor, freshness, inviteText, isValidCode, makeCode, normalizeCode, shouldSend, sortMembers, type GroupMember } from '../src/services/groupLogic';
import { AREFE_DUA, CEMRE_TEKBIR, HAC_STEPS, MESAR_AYAH, TESRIK_TEKBIR } from '../src/data/hac';
import { CEMRE_IDS, arafatCheck, dayThrown, eidDayAt, emptyCount, hajjCalendar, hajjPhase, hajjSoon, haramCheck, insidePoly, pebblesTotal, throwPebble, throwWindow, undoPebble, windowState, type ThrowResult } from '../src/services/hac';
import { CalculationMethod, Coordinates, PrayerTimes } from 'adhan';
import { DEFAULT_NOTIF, isTesrik, notifText, planExtras, planNotifications } from '../src/services/adhanPlan';
import type { PrayerKey } from '../src/services/prayer';
import { Cam } from '../src/scene/oblique';
import { buildModel, convexPieces, decodeOsm3d, drawModel, findTowers, mergePrims, signedArea } from '../src/scene/osm3d';
import { HARAM_3D } from '../src/data/osm/haram3d';
import { NABAWI_3D } from '../src/data/osm/nabawi3d';
import { buildKaaba } from '../src/scene/kaaba';
import { buildTawafView } from '../src/scene/tawafScene';
import { buildMadinah } from '../src/scene/madinah';
import { MASA_LENGTH, adjustSay, initialSay, nearMasa, pointOnMasa, project, startSayManual, stepSay, type SayState } from '../src/services/say';
import { UMRE_STEPS, IHRAM_RULES } from '../src/data/umre';
import { zikirStats } from '../src/services/zikirStats';
import { FULL_DAY, countDay, countDays, dayKey, isDone, lastDays as logDays, prune, sanitize, streak, toggle } from '../src/services/prayerLog';
import { dailyIndex, dayNumber } from '../src/services/daily';
import { stripBasmala } from '../src/services/basmala';
import { PRAYED_ACTION, prayedFromResponse } from '../src/services/prayedTask.types';
import { DICTS } from '../src/i18n/strings';
import { JUZ_STARTS, TOTAL_AYAH, cleanPlan, fromGlobal, hatimToday, juzOf, juzPos, readAtJuz, readFromMark, targetRead } from '../src/services/hatim';
import { PAGE_START, fromGlobalAyah, pageAyahs, pageGlobalRange, pageOf } from '../src/data/quranPages';
import { zikirToday } from '../src/services/zikirStats';
import { CHECKLIST } from '../src/data/checklist';
import { PHRASES } from '../src/data/phrases';
import { dropWords, parseTajweed, plainOf, stripTajweedBasmala } from '../src/services/tajweed';
import { SAJDAH, isSajdah, stripSajdahSign } from '../src/data/sajdah';
import { OTHER_RULES, TAJWEED_RULES } from '../src/data/tajweed';
import { QURAN_FONTS, ayahMark, lineFor, quranFont } from '../src/data/quranFonts';
// Node tür tanımları projede yok; dosya varlığına bakmak için düz require
const { existsSync } = require('fs') as { existsSync: (path: string) => boolean };
import { allTextDuas } from '../src/data/duas';
import { altitudeText, directionText, moonLitPath, moonPhaseName, skyDay, skyNow, skyPhase } from '../src/services/sky';
import { newer } from '../src/services/version';
import { guessKind, shareLink } from '../src/services/myPlaces';
import { HHR_STATIONS } from '../src/data/train';
import { nextPrayer, shownDay, times as prayerTimes } from '../src/services/prayer';
import { bodyPos, horizonGlow, sceneKind, scenePalette, textZone } from '../src/services/skyScene';
import istanbulRail from '../src/data/istanbulRail.json';
import makkahBus from '../src/data/makkahBus.json';
import { covers, inIstanbul, planRail, railNetwork, textOn, type RailData } from '../src/services/railRouter';
import { alightText, boardText, stopsText, tidyName, walkText } from '../src/services/transitText';
import { nextSpecial } from '../src/services/hijri';
import { SKIP, parseBackup } from '../src/services/backupFormat';
import { AREAS, GLYPH_RANGES, fontStacks, lat2tile, lon2tile, resolveMataf, rewriteStyle, spriteRoot, tilesFor } from '../src/services/offlineMath';
import { daysToFinish, initialKaza, lastDays, markKaza, prayersLeft, remaining, setOwedDays, toDays } from '../src/services/kaza';
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

// Rota: gerçek dış hatlar çevresinden; batıdan Mataf'a en yakın kapı Umre Kapısı (62), kapalıysa başka kapı
const all = () => 'open' as GateStatus;
const p1 = planRoute('makkah', DEMO_START.makkah, 'mataf', all)!;
ok(p1.gate?.id === 'mk-62', `batıdan Mataf'a en kısa kapı 62 (seçilen: ${p1.gate?.id}, ${Math.round(p1.lengthM)} m)`);
{
  // Kapılar: ana kapılar + OSM'den gelenler (0.23.0)
  const ids = new Set(GATES.map((g) => g.id));
  ok(ids.size === GATES.length, `kapı kimlikleri tekil (${GATES.length} kapı)`);
  const mk = GATES.filter((g) => g.city === 'makkah');
  const md = GATES.filter((g) => g.city === 'madinah');
  ok(mk.length >= 120 && md.length >= 20, `Mekke ${mk.length}, Medine ${md.length} kapı`);
  ok(['1', '45', '62', '79', '100'].every((n) => mk.some((g) => g.no === n && g.main)), 'Mekke ana kapıları 1, 45, 62, 79, 100 (Genel Kurum)');
  const good = GATES.filter((g) => !isInsideBuilding(g.city, g.out) && isInsideBuilding(g.city, g.inner)).length;
  ok(good / GATES.length > 0.9, `kapıların dış noktası dışarıda, iç noktası içeride (${good}/${GATES.length})`);
  ok(md.some((g) => g.women) && md.filter((g) => g.women).every((g) => g.side.tr.includes('kadınlar')), 'Medine kadınlar girişleri işaretli');
}
const p2 = planRoute('makkah', DEMO_START.makkah, 'mataf', (id) => (id === 'mk-62' ? 'closed' : 'open'))!;
ok(!!p2.gate && p2.gate.id !== 'mk-62', `62 kapalı → yeni kapı ${p2.gate?.id} (${Math.round(p2.lengthM)} m)`);
{
  // Kapıya kadarki yürüyüş hiçbir binanın içinden geçmez (her kapı için, dört yönden)
  let through = 0;
  const starts: Record<string, [number, number][]> = { makkah: [[-420, 0], [150, -450], [300, 0], [0, 600]], madinah: [[-420, -120], [0, -450], [300, -120], [0, 150]] };
  for (const g of GATES) for (const from of starts[g.city]) {
    const pts = walkPath(g.city, from, g.out);
    for (let i = 1; i < pts.length; i++) for (let t = 0.05; t < 1; t += 0.05) {
      const q: [number, number] = [pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * t, pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * t];
      if (isInsideBuilding(g.city, q)) through++;
    }
  }
  ok(through === 0, `yürüme yolları bina içinden geçmez (${through} örnek içeride)`);
  const gateOk = GATES.every((g) => isInsideBuilding(g.city, g.inner) && !isInsideBuilding(g.city, g.out));
  ok(gateOk, 'her kapının iç noktası binada, dış noktası meydanda');
  ok(DESTINATIONS.every((d) => isInsideBuilding(d.city, d.pos) === d.inside), 'hedefler: Mataf, Safâ ve Ravza bina içinde; Bakî dışarıda');
  const around = planRoute('makkah', [150, -450], 'mataf', all)!;
  ok(around.gate?.id === 'mk-45' || around.gate?.id === 'mk-100', `kuzeyden gelen kuzey kapısına yönlenir (${around.gate?.id}, ${Math.round(around.lengthM)} m)`);
}
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

// ── Sa'y sayacı: Safâ–Merve gidiş gelişleri, gürültülü GPS ──
{
  // Gidiş geliş izi: Safâ (s=0) ile Merve (s=L) arası; uçlarda dönüş için birkaç saniye bekleme
  const walkSay = (o: { legs: number; sigma: number; acc: number; seed: number; speed?: number; startAt?: 'safa' | 'marwa'; lateral?: number; outliers?: number; linger?: number }, st0: SayState = initialSay()) => {
    const rr = rng(o.seed); const v = o.speed ?? 1.1;
    let st = st0; let t = 0; const ev: string[] = []; const lapS: number[] = [];
    const feed = (s: number) => {
      let p = pointOnMasa(s);
      const side = (o.lateral ?? 0) * (rr() - 0.5);
      p = [p[0] + side + gauss(rr) * o.sigma, p[1] + gauss(rr) * o.sigma];
      if (o.outliers && rr() < o.outliers) p = [p[0] + (rr() - 0.5) * 400, p[1] + (rr() - 0.5) * 400];
      const res = stepSay(st, { p, acc: o.acc, t: (t += 1000) }); st = res.st;
      for (const e of res.events) { ev.push(e.type); if (e.type === 'lap' || e.type === 'done') lapS.push(s); }
    };
    let fromSafa = (o.startAt ?? 'safa') === 'safa';
    for (let i = 0; i < 10; i++) feed(fromSafa ? 3 : MASA_LENGTH - 3);
    for (let leg = 0; leg < o.legs; leg++) {
      for (let x = 3; x <= MASA_LENGTH - 3; x += v) feed(fromSafa ? x : MASA_LENGTH - x);
      for (let i = 0; i < (o.linger ?? 15); i++) feed(fromSafa ? MASA_LENGTH - 3 : 3);
      fromSafa = !fromSafa;
    }
    return { st, ev, lapS };
  };
  ok(Math.abs(MASA_LENGTH - 390) < 15, `sa'y: Safâ–Merve ekseni ≈390 m (${Math.round(MASA_LENGTH)})`);
  ok(nearMasa(pointOnMasa(200)) && !nearMasa([0, 0]) && project(pointOnMasa(100)).lat < 0.01, "sa'y: Mes'a içinde/dışında; izdüşüm");
  const a = walkSay({ legs: 7, sigma: 0, acc: 5, seed: 1 });
  ok(a.st.laps === 7 && a.ev[0] === 'start' && a.ev.at(-1) === 'done', `sa'y: temiz iz → 7 şavt, Merve'de biter (${a.st.laps}; ${a.ev.join(',')})`);
  const b = walkSay({ legs: 7, sigma: 8, acc: 12, seed: 4, lateral: 20 });
  const bEarly = b.lapS.some((s, i) => (i % 2 === 0 ? s < MASA_LENGTH - 60 : s > 60));
  ok(b.st.laps === 7 && !bEarly, `sa'y: σ=8 m gürültü, şerit değiştirme → 7 şavt, uca varmadan sayım yok (${b.st.laps}; ${b.lapS.map((s) => Math.round(s)).join(',')})`);
  const c = walkSay({ legs: 7, sigma: 6, acc: 10, seed: 9, outliers: 0.05 });
  ok(c.st.laps === 7, `sa'y: %5 sıçrayan ölçüm → yine 7 şavt (${c.st.laps})`);
  const d = walkSay({ legs: 3, sigma: 6, acc: 10, seed: 2, linger: 240 });
  ok(d.st.laps === 3, `sa'y: uçta 4 dk bekleme fazladan saymıyor (${d.st.laps}/3)`);
  const e = walkSay({ legs: 1, sigma: 4, acc: 8, seed: 5, startAt: 'marwa' });
  ok(e.st.laps === 0 && !e.st.started && e.ev.includes('wrongStart'), `sa'y: Merve'den başlanan ilk yol sayılmaz, uyarı verilir (${e.ev.join(',')})`);
  const e2 = walkSay({ legs: 2, sigma: 4, acc: 8, seed: 6, startAt: 'marwa' });
  ok(e2.st.laps === 1 && e2.st.started, `sa'y: Merve → Safâ (sayılmaz) sonra Safâ → Merve = 1 şavt (${e2.st.laps})`);
  const f = walkSay({ legs: 4, sigma: 30, acc: 55, seed: 3 });
  ok(f.st.laps === 0 && f.st.quality !== 'good', `sa'y: GPS zayıfken otomatik sayım yok (${f.st.quality})`);
  const g = walkSay({ legs: 7, sigma: 5, acc: 8, seed: 8, speed: 3.5 });
  ok(g.st.laps === 7, `sa'y: tekerlekli sandalye/araba hızı (3,5 m/sn) → 7 şavt (${g.st.laps})`);
  let over = 0, earlyN = 0, runs = 0;
  for (const sigma of [3, 6, 10, 15]) for (let seed = 1; seed <= 10; seed++) {
    runs++;
    const x = walkSay({ legs: 8, sigma, acc: sigma * 1.5, seed: seed * 17 + sigma, lateral: 25, outliers: 0.03 });
    if (x.st.laps > 7) over++;
    if (x.lapS.some((s, i) => (i % 2 === 0 ? s < MASA_LENGTH - 70 : s > 70))) earlyN++;
  }
  ok(over === 0 && earlyN === 0, `sa'y: ${runs} rastgele iz (σ 3–15 m) → fazla sayım ${over}, erken sayım ${earlyN}`);
  const h = adjustSay(adjustSay(startSayManual(initialSay()), 1), 1);
  ok(h.laps === 2 && h.toward === 'marwa' && adjustSay(h, -1).toward === 'safa', "sa'y: elle +1/−1 ve yön");
}

// ── Kaza takibi ──
{
  ok(toDays(1, 2, 3) === 365 + 60 + 3 && toDays(0.5, 0, 0) === 183, 'kaza: yıl/ay/gün → gün (yukarı yuvarlama)');
  let k = setOwedDays(initialKaza(), 400, 30, false);
  ok(prayersLeft(k) === 400 * 6 && remaining(k, 'oruc') === 30, `kaza: 400 gün → 2400 namaz (vitir dahil), 30 oruç (${prayersLeft(k)})`);
  ok(prayersLeft({ ...k, vitir: false }) === 2000, 'kaza: vitir kapalıyken 5 vakit');
  const d1 = new Date(2026, 10, 25, 10);
  k = markKaza(markKaza(markKaza(k, 'sabah', 1, d1), 'ogle', 1, d1), 'sabah', 1, new Date(2026, 10, 24, 9));
  ok(k.done.sabah === 2 && k.done.ogle === 1 && prayersLeft(k) === 2397, 'kaza: kıldım → kalan düşer');
  const w = lastDays(k, 7, d1);
  ok(w.length === 7 && w[6].count === 2 && w[5].count === 1 && w[0].count === 0, `kaza: son 7 gün (${w.map((x) => x.count).join(',')})`);
  k = markKaza(k, 'ogle', -1, d1);
  ok(k.done.ogle === 0 && (k.days['2026-11-25'].ogle ?? 0) === 0, 'kaza: geri al');
  const z = markKaza(setOwedDays(initialKaza(), 1, 0, false), 'yatsi', 1, d1);
  ok(markKaza(z, 'yatsi', 1, d1) === z, 'kaza: borçtan fazla ödenemez');
  ok(daysToFinish(setOwedDays(initialKaza(), 365, 0, false)) === 365 && daysToFinish({ ...setOwedDays(initialKaza(), 365, 0, false), dailyGoal: 2 }) === 183, 'kaza: bitiş süresi günlük hedefe göre');
  const add = setOwedDays(setOwedDays(initialKaza(), 10, 5, false), 5, 2, true);
  ok(add.owed.ogle === 15 && add.owed.oruc === 7, 'kaza: mevcut borca ekleme');
}

// ── Zikir istatistikleri ──
{
  const now = new Date(2026, 10, 25, 20);
  const at = (daysAgo: number, h = 9) => new Date(2026, 10, 25 - daysAgo, h).getTime();
  const items = [
    { at: at(0), name: 'Sübhânallah', count: 33 }, { at: at(0, 21), name: 'Elhamdülillah', count: 33 },
    { at: at(1), name: 'Sübhânallah', count: 100 }, { at: at(2), name: 'Salavat', count: 10 },
    { at: at(4), name: 'Salavat', count: 5 }, { at: at(30), name: 'Sübhânallah', count: 1000 },
  ];
  const z = zikirStats(items, now);
  ok(z.today === 66 && z.week.length === 7 && z.week[6].value === 66 && z.week[5].value === 100 && z.week[2].value === 5, `zikir: bugün ve son 7 gün (${z.week.map((x) => x.value).join(',')})`);
  ok(z.streak === 3 && z.weekTotal === 181 && z.month === 181 && z.all === 1181, `zikir: seri ${z.streak}, hafta ${z.weekTotal}, ay ${z.month}, toplam ${z.all}`);
  ok(z.top[0].name === 'Sübhânallah' && z.top[0].count === 1133, 'zikir: en çok çekilen');
  ok(zikirStats(items.filter((i) => i.at < at(0)), now).streak === 2, 'zikir: bugün kayıt yoksa seri dünden sayılır');
  ok(zikirStats([], now).streak === 0 && zikirStats([], now).all === 0, 'zikir: boş defter');
}

// ── Yedek dosyası ──
{
  ok(SKIP('cache:poi:x') && SKIP('tawaf:session') && !SKIP('zikir:log') && !SKIP('kaza:state'), 'yedek: önbellek ve yarım oturumlar yedeğe girmez');
  const b = parseBackup(JSON.stringify({ app: 'MATAF', version: '0.8.0', at: '2026-11-25T20:00:00Z', data: { 'zikir:log': '{"items":[]}' } }));
  ok(b.data['zikir:log'] === '{"items":[]}', 'yedek: geçerli dosya okunur');
  let bad = 0;
  for (const t of ['{}', '{"app":"X","data":{}}', '{"app":"MATAF","data":{"a":1}}', 'yok']) { try { parseBackup(t); } catch { bad++; } }
  ok(bad === 4, `yedek: yanlış ya da bozuk dosya reddedilir (${bad}/4)`);
}

// ── Çevrimdışı harita paketi ──
{
  ok(lon2tile(39.8262, 14) === 10004 && lat2tile(21.4225, 14) === 7193, `çevrimdışı: Kâbe karosu z14 (${lon2tile(39.8262, 14)}/${lat2tile(21.4225, 14)})`);
  const mk = tilesFor(AREAS[0]);
  const md = tilesFor(AREAS[1]);
  const z14 = mk.filter((t) => t.z === 14);
  const kaaba = z14.some((t) => t.x === 10004 && t.y === 7193);
  const arafat = z14.some((t) => t.x === lon2tile(39.984, 14) && t.y === lat2tile(21.355, 14));
  ok(kaaba && arafat && mk.length > 60 && mk.length < 400 && md.length > 40 && md.length < 300, `çevrimdışı: Mekke ${mk.length} karo (Kâbe ve Arafat dahil), Medine ${md.length}`);
  ok(new Set(mk.map((t) => `${t.z}/${t.x}/${t.y}`)).size === mk.length, 'çevrimdışı: karolar tekrar etmiyor');
  const style = {
    version: 8, sprite: 'https://tiles.openfreemap.org/sprites/ofm_f384/ofm', glyphs: 'https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf',
    sources: { ne2_shaded: { type: 'raster', tiles: ['x'] }, openmaptiles: { type: 'vector', url: 'https://tiles.openfreemap.org/planet' } },
    layers: [{ id: 'bg' }, { id: 'ne', source: 'ne2_shaded' }, { id: 'road', source: 'openmaptiles', layout: { 'text-font': ['Noto Sans Regular'] } }, { id: 'poi', source: 'openmaptiles', layout: { 'text-font': ['Noto Sans Bold'] } }],
  };
  const rs = rewriteStyle(style, 'OSM');
  ok(!rs.sources.ne2_shaded && rs.sources.openmaptiles.tiles?.[0] === 'mataf://tiles/{z}/{x}/{y}' && rs.layers.length === 3 && rs.sprite === 'mataf://sprites/ofm_f384~ofm' && rs.glyphs?.startsWith('mataf://fonts/'), 'çevrimdışı: stil yerel adreslere çevrildi, raster katman çıktı');
  ok(fontStacks(style).join('|') === 'Noto Sans Regular|Noto Sans Bold' && GLYPH_RANGES.includes('1536-1791'), 'çevrimdışı: yazı tipleri ve Arapça dilimi');
  const remote = { tiles: 'https://t/planet/v1/{z}/{x}/{y}.pbf', glyphs: 'https://t/fonts/{fontstack}/{range}.pbf', spriteRoot: spriteRoot('https://t/sprites/ofm_f384/ofm') };
  const a = resolveMataf('mataf://tiles/14/10004/7144', remote);
  const b = resolveMataf('mataf://fonts/Noto%20Sans%20Regular/0-255.pbf', remote);
  const c = resolveMataf('mataf://sprites/ofm_f384~ofm@2x.png', remote);
  ok(a?.path === 'tiles/14/10004/7144.pbf' && a.remote === 'https://t/planet/v1/14/10004/7144.pbf' && b?.path === 'fonts/Noto Sans Regular/0-255.pbf' && b.remote === 'https://t/fonts/Noto%20Sans%20Regular/0-255.pbf' && c?.remote === 'https://t/sprites/ofm_f384/ofm@2x.png' && resolveMataf('mataf://x', remote) === null,
    'çevrimdışı: yerel adres → dosya yolu ve ağ adresi');
}

// ── Ana ekran küçük uygulaması (Android) ──
{
  const mk = (d: Date) => {
    const p = new PrayerTimes(new Coordinates(21.4225, 39.8262), d, CalculationMethod.UmmAlQura());
    return { fajr: p.fajr, sunrise: p.sunrise, dhuhr: p.dhuhr, asr: p.asr, maghrib: p.maghrib, isha: p.isha };
  };
  const hm = (d: Date) => `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  const wp = buildWidgetProps({ start: new Date(2026, 10, 25, 9, 0), timesFor: mk, fmt: hm, dayLabel: (d) => String(d.getDate()), place: widgetPlace('makkah', 'tr'), names: ['İmsak', 'Güneş', 'Öğle', 'İkindi', 'Akşam', 'Yatsı'], lang: 'tr', palette: 'kabe', mode: 'system' });
  const wd = wp.days ?? [];
  ok(wd.length === WIDGET_DAYS && wd.every((d) => d.t.length === 6 && d.a.length === 6) && wp.place === 'Mekke' && wp.names?.length === 6, 'küçük uygulama: 30 gün × 6 vakit, yer adı');
  ok(JSON.stringify(wp).length < 12000, `küçük uygulama: veri küçük (${JSON.stringify(wp).length} bayt)`);
  ok(wd.every((d, i) => d.a.every((x, j) => (j === 0 ? i === 0 || Number(x) > Number(wd[i - 1].a[5]) : Number(x) > Number(d.a[j - 1])))), 'küçük uygulama: vakitler sıralı');
  const t1 = Number(wd[0].a[2]) - 60e3;
  const t2 = Number(wd[0].a[5]) + 60e3;
  // yatsı ile ertesi imsak arası; gün sınırı cihazın saat dilimine göre (Türkiye ve Suudi Arabistan aynı)
  const t3 = Math.round((Number(wd[0].a[5]) + Number(wd[1].a[0])) / 2);
  const n1 = widgetNext(wp, t1);
  const n2 = widgetNext(wp, t2);
  const n3 = widgetNext(wp, t3);
  ok(n1?.day === 0 && n1.prayer === 2 && !n1.tomorrow, 'küçük uygulama: öğleden önce → öğle');
  ok(n2?.day === 1 && n2.prayer === 0 && n2.tomorrow === Number(wd[1].s) > t2, 'küçük uygulama: yatsıdan sonra → (yarın) imsak');
  ok(n3?.day === 1 && n3.prayer === 0 && n3.tomorrow === Number(wd[1].s) > t3, 'küçük uygulama: gece → imsak, "yarın" etiketi gün sınırına göre');
  ok(widgetNext(wp, Number(wd[29].a[5]) + 1) === null, 'küçük uygulama: veri bitince güncelleme istenir');
  ok(wp.light?.accent === PALETTES.kabe.light.accent && wp.dark?.accent === PALETTES.kabe.dark.accent && wp.dark?.bg !== wp.light?.bg, 'küçük uygulama: tema renkleri');
}

// ── Küçük uygulama görünümü (0.22.0: palet tonları, şeffaflık, geri sayım, hicrî tarih) ──
{
  const base = { start: new Date(2026, 10, 27, 9, 0), timesFor: (d: Date) => prayerTimes(21.4225, 39.8262, 'UmmAlQura', d), fmt: (d: Date) => `${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`,
    dayLabel: (d: Date) => String(d.getDate()), place: 'Mekke', names: ['İmsak', 'Güneş', 'Öğle', 'İkindi', 'Akşam', 'Yatsı'], lang: 'tr' as const, palette: 'kabe' as PaletteId, mode: 'system' as const };
  const g = buildWidgetProps({ ...base, hijriLabel: (d) => hijriText(d, 'tr') });
  const kd = colorsFor(true, 'kabe');
  ok(g.mode === 'dark' && g.dark?.bg === kd.bg + '99' && g.dark.fill === kd.accent && g.dark.onFill === kd.onAccent,
    `kutu görünümü: varsayılan koyu, %40 şeffaf zemin (${g.dark?.bg}), dolu hap paletin vurgusu`);
  ok(withAlpha('#17120E', 1) === '#17120EFF' && withAlpha('#FBF7F1', 0.2) === '#FBF7F133' && withAlpha('#123456', 0) === '#12345600', 'kutu görünümü: saydamlık #RRGGBBAA');
  const z = buildWidgetProps({ ...base, palette: 'zumrut', style: 'light', clear: 0 });
  ok(z.mode === 'light' && z.light?.bg === colorsFor(false, 'zumrut').bg + 'FF' && z.light.accent === colorsFor(false, 'zumrut').accent && z.dark?.bg !== g.dark?.bg,
    'kutu görünümü: açık seçimi, opak zemin, palet tonları');
  ok(g.left === '{p} vaktine kalan' && g.remain === 'kaldı' && (g.days ?? []).every((d) => /^\d{1,2} \S.* \d{4}$/.test(d.h ?? '')), `kutu görünümü: geri sayım yazıları ve her günde hicrî tarih (${g.days?.[0]?.h})`);
  ok(JSON.stringify(g).length < 14000, `kutu görünümü: veri küçük kalır (${JSON.stringify(g).length} bayt)`);
  ok(widgetMode(undefined, 'dark') === 'dark' && widgetMode('theme', 'light') === 'light' && widgetMode('theme', 'system') === 'system' && widgetMode('light', 'dark') === 'light',
    'kutu görünümü: seçim → çizim kipi');
  ok(buildLogWidgetProps({ title: '', names: [], allDone: '', empty: '', palette: 'gul', mode: 'dark', style: 'theme', clear: 60, log: {}, today: new Date() }).dark?.bg === colorsFor(true, 'gul').bg + '66',
    'kutu görünümü: takip kutusunda tema ve şeffaflık');
  const weak: string[] = [];
  for (const dark of [false, true]) for (const pid of Object.keys(PALETTES) as PaletteId[]) {
    const c = colorsFor(dark, pid);
    if (contrast(c.accent, c.onAccent) < 4.5) weak.push(`${pid}/${dark ? 'koyu' : 'açık'}`);
  }
  ok(weak.length === 0, `kutu görünümü: her palette dolu hap yazısı AA (zayıf: ${weak.join(', ') || 'yok'})`);
}

// ── Hac modu ──
{
  const ymd = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const cal = hajjCalendar(new Date(2026, 10, 26, 9));
  ok(!!cal && ymd(cal.arefe) === '2027-05-15' && ymd(cal.days[0].date) === '2027-05-14' && ymd(cal.days[5].date) === '2027-05-19', `hac: 1448 Arefe 15 Mayıs 2027 (${cal && ymd(cal.arefe)})`);
  const calIn = hajjCalendar(new Date(2027, 4, 16, 20));
  ok(!!calIn && ymd(calIn.days[0].date) === '2027-05-14', 'hac: bayram günündeyken bu yılın takvimi');
  if (cal) {
    const p1 = hajjPhase(new Date(2027, 4, 15, 14), cal);
    const p2 = hajjPhase(new Date(2027, 4, 10, 9), cal);
    const p3 = hajjPhase(new Date(2027, 4, 21, 9), cal);
    ok(p1.kind === 'during' && p1.dh === 9 && p2.kind === 'before' && p2.days === 5 && p3.kind === 'after', 'hac: gün evresi (Arefe, 5 gün kala, sonra)');
    const fajr = (d: number, h = 4, m = 20) => new Date(2027, 4, d, h, m);
    ok(eidDayAt(new Date(2027, 4, 17, 3, 0), cal, fajr(17)) === 1 && eidDayAt(new Date(2027, 4, 17, 10, 0), cal, fajr(17)) === 2 && eidDayAt(new Date(2027, 4, 15, 10, 0), cal, fajr(15)) === null, 'hac: imsaktan önce önceki günün atışı sürer');
  }
  const s1 = hajjSoon(new Date(2027, 4, 10, 9));
  const s2 = hajjSoon(new Date(2027, 4, 15, 9));
  ok(!hajjSoon(new Date(2026, 10, 26, 9)) && s1?.phase.kind === 'before' && s1.phase.days === 5 && s2?.phase.kind === 'during' && !hajjSoon(new Date(2027, 4, 21, 9)), 'hac: ana sayfa kartı yalnız hac günlerine yakınken');
  const rahme = HAC_PLACES.find((x) => x.id === 'rahme')!;
  const kabe = { lat: 21.4225, lng: 39.8262 };
  ok(arafatCheck(rahme).state === 'inside' && arafatCheck(kabe).state === 'outside', 'hac: Cebel-i Rahme Arafat içinde, Kâbe dışında');
  ok(haramCheck(kabe).state === 'inside' && haramCheck(rahme).state === 'outside', 'hac: Kâbe Harem içinde, Arafat Harem dışında');
  const mina = HAC_PLACES.find((x) => x.id === 'mina')!;
  ok(haramCheck(mina).state === 'inside', 'hac: Mina Harem sınırları içinde');
  // Arafat batı sınırındaki bir işaretten 40 m ve 400 m dışarı (batıya)
  const edge = { lat: 21.3501, lng: 39.96094 };
  const west = (m: number) => ({ lat: edge.lat, lng: edge.lng - m / (111320 * Math.cos((edge.lat * Math.PI) / 180)) });
  ok(arafatCheck(west(40)).state === 'near' && arafatCheck(west(400)).state === 'outside', 'hac: sınıra yakınken "tabelaya bakın"');
  ok(arafatCheck(rahme, 2000).state === 'near', 'hac: GPS hatası büyükse kesin söylenmez');
  const nam = NAMIRA_MOSQUE.map(([lat, lng]) => insidePoly({ lat, lng }, ARAFAT_AREA));
  ok(nam.some((x) => x) && nam.some((x) => !x), 'hac: Nemire Mescidi sınırın üzerinde (bir kısmı dışarıda)');

  let c = emptyCount();
  let r = throwPebble(c, 1, 'kucuk');
  ok(r.event === 'not-today', 'cemre: 1. gün küçük cemre yok');
  for (let i = 0; i < 7; i++) { r = throwPebble(c, 1, 'akabe'); c = r.counts; }
  ok(r.event === 'day-done' && throwPebble(c, 1, 'akabe').event === 'full', 'cemre: 1. gün Akabe 7 taş');
  c = emptyCount();
  r = throwPebble(c, 2, 'orta');
  ok(r.orderWarn && r.event === 'ok', 'cemre: sıra uyarısı (Hanefî: sünnet, engellemez)');
  c = emptyCount();
  let last: ThrowResult = r;
  for (const id of CEMRE_IDS) for (let i = 0; i < 7; i++) { last = throwPebble(c, 2, id); c = last.counts; if (i === 6 && id !== 'akabe') ok(last.event === 'cemre-done', `cemre: ${id} bitti`); }
  ok(last.event === 'day-done' && dayThrown(c, 2) === 21 && !last.orderWarn, 'cemre: 2. gün 21 taş');
  ok(undoPebble(c, 'akabe').akabe === 6 && undoPebble(emptyCount(), 'akabe').akabe === 0, 'cemre: geri al');
  ok(pebblesTotal(true) === 70 && pebblesTotal(false) === 49, 'cemre: toplam 70 / 49');
  const t = (d: number) => ({ fajr: new Date(2027, 4, d, 4, 20), sunrise: new Date(2027, 4, d, 5, 40), dhuhr: new Date(2027, 4, d, 12, 20), maghrib: new Date(2027, 4, d, 19, 0) });
  const w1 = throwWindow(1, t(16), t(17));
  const w2 = throwWindow(2, t(17), t(18));
  const w4 = throwWindow(4, t(19), t(20));
  ok(windowState(new Date(2027, 4, 16, 3, 0), w1) === 'before' && windowState(new Date(2027, 4, 16, 23, 0), w1) === 'open' && windowState(new Date(2027, 4, 17, 4, 30), w1) === 'after', 'cemre: 1. gün imsaktan ertesi imsaka');
  ok(windowState(new Date(2027, 4, 17, 11, 0), w2) === 'before' && windowState(new Date(2027, 4, 17, 13, 0), w2) === 'open', 'cemre: 2. gün öğleden önce olmaz');
  ok(windowState(new Date(2027, 4, 19, 9, 0), w4) === 'early' && windowState(new Date(2027, 4, 19, 19, 30), w4) === 'after', 'cemre: 4. gün (Ebû Hanîfe: öğleden önce caiz), gün batımında biter');
}

// ── Dini içerik: her dua ve adımın dayanağı var ──
{
  const texts = [...DUA_LIB.flatMap((c) => c.items.filter((d): d is DuaText => 'ar' in d)), ...TAWAF_DHIKR, TESRIK_TEKBIR, CEMRE_TEKBIR, MESAR_AYAH, AREFE_DUA];
  const noRef = texts.filter((d) => !d.ref || d.ref.trim().length < 4).map((d) => d.id);
  ok(noRef.length === 0, `kaynak: her duada kaynak var (${texts.length} dua${noRef.length ? '; eksik: ' + noRef.join(',') : ''})`);
  const noSrc = HAC_STEPS.filter((s) => s.src.length === 0).map((s) => s.id);
  ok(noSrc.length === 0 && HAC_STEPS.length === 9, 'kaynak: her hac adımında dayanak var');
  const types = (['temettu', 'kiran', 'ifrad'] as const).map((ty) => HAC_STEPS.filter((s) => !s.types || s.types.includes(ty)).map((s) => s.id));
  ok(types.every((l) => l.includes('arafat') && l.includes('ziyaret') && l.length === 8) && types[0].includes('umre') && !types[2].includes('umre'), 'hac: her türde 8 adım (temettu umreyle, ifrad/kıran kudümle)');
  const arOk = texts.every((d) => /[\u0600-\u06FF]/.test(d.ar));
  ok(arOk, 'kaynak: her duanın Arapça metni var');
}

// ── Aile / grup konumu ──
{
  ok(normalizeCode(' ab-c2 3x9 ') === 'ABC23X' && isValidCode('ABC23X') && !isValidCode('ABC10X') && !isValidCode('ABC23'), 'grup: davet kodu biçimi (karışan harf yok)');
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const codes = Array.from({ length: 200 }, () => makeCode(rnd));
  ok(codes.every(isValidCode) && new Set(codes).size > 195, 'grup: üretilen kodlar geçerli ve çeşitli');
  ok(colorFor('Ahmet') === colorFor('Ahmet') && MEMBER_COLORS.includes(colorFor('Zeynep')), 'grup: ada göre kararlı renk');
  const now = 1_800_000_000_000;
  ok(freshness(now - 30e3, now) === 'live' && freshness(now - 10 * 60e3, now) === 'recent' && freshness(now - 60 * 60e3, now) === 'stale' && freshness(null, now) === 'none', 'grup: konum tazeliği');
  const me = { lat: 21.4225, lng: 39.8262 };
  const list: GroupMember[] = [
    { userId: 'z', name: 'Uzak', color: '#000000', sharing: true, lat: 21.43, lng: 39.83 },
    { userId: 'y', name: 'Konumsuz', color: '#000000', sharing: true },
    { userId: 'x', name: 'Yakın', color: '#000000', sharing: true, lat: 21.4228, lng: 39.8265 },
    { userId: 'm', name: 'Ben', color: '#000000', sharing: true, me: true },
  ];
  ok(sortMembers(list, me).map((m) => m.userId).join('') === 'mxzy', 'grup: ben, yakın, uzak, konumsuz sırası');
  const t0 = now;
  const last = { at: t0, lat: 21.4225, lng: 39.8262 };
  ok(shouldSend(null, me, t0) && !shouldSend(last, { lat: 21.4228, lng: 39.8262 }, t0 + 10e3) && shouldSend(last, { lat: 21.4228, lng: 39.8262 }, t0 + 20e3)
    && !shouldSend(last, { lat: 21.42252, lng: 39.8262 }, t0 + 60e3) && shouldSend(last, me, t0 + 121e3), 'grup: konum gönderme sıklığı (25 m / 2 dk)');
  ok(inviteText('ABC23X', 'Ailem', 'tr').includes('ABC23X') && inviteText('ABC23X', 'Ailem', 'en').includes('Ailem'), 'grup: davet metni');
}

// ── Umre rehberi içeriği ──
{
  const ids = UMRE_STEPS.map((x) => x.id);
  ok(new Set(ids).size === ids.length && ids[0] === 'mikat' && ids.at(-1) === 'tiras', `umre: adımlar sırayla ve tekil (${ids.join(' → ')})`);
  ok(UMRE_STEPS.every((x) => x.title.tr && x.title.en && x.todo.length > 0 && x.todo.every((t) => t.tr && t.en)), 'umre: her adımda TR/EN başlık ve yapılacaklar');
  ok(IHRAM_RULES.length >= 6 && IHRAM_RULES.every((x) => x.rule.tr && x.penalty.tr && x.rule.en && x.penalty.en), 'umre: ihram yasakları ve cezaları dolu');
  ok(UMRE_STEPS.find((x) => x.id === 'tavaf')?.action?.to === '/tavaf' && UMRE_STEPS.find((x) => x.id === 'say')?.action?.to === '/say', 'umre: tavaf ve sa’y adımları asistanlara bağlı');
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
  const fetcher: Fetcher = async (url0, init) => {
    if (url0.includes('photon')) throw new Error('photon down');
    const url = url0.split('?')[0];
    const radius = Number(/around:(\d+)/.exec(decodeURIComponent(init.body ?? url0))![1]);
    calls.push(`${OVERPASS_ENDPOINTS.indexOf(url)}:${radius}`);
    if (url === OVERPASS_ENDPOINTS[0]) return { ok: false, status: 504, json: async () => ({}) };
    return { ok: true, status: 200, json: async () => (radius >= 10000 ? sample : { elements: [] }) };
  };
  const r = await findMosques(o, 'tr', { fetcher, minCount: 3 });
  ok(r.radius === 10000 && r.mosques.length === 3 && calls.join(' ') === '0:1500 1:1500 0:4000 1:4000 0:10000 1:10000',
    `Photon yoksa Overpass: 1,5 → 4 → 10 km büyüdü, çöken sunucudan aynaya (GET) geçti (${calls.join(' ')})`);

  // Photon: kilise elenir; çoğunluğu cami olan bölgede adsız ibadet yerleri de alınır; uzaktaki adlı sonuç yarıçap dışında
  const pf = (name: string, dx: number, dy: number, id: number) => ({ geometry: { coordinates: [at(dx, dy).lon, at(dx, dy).lat] as [number, number] }, properties: { name, osm_type: 'N', osm_id: id, osm_key: 'amenity', osm_value: 'place_of_worship' } });
  const near = parsePhotonMosques({ features: [pf('Fatih Camii', 200, 0, 1), pf('St. Mary Church', 100, 0, 2), pf('', 0, 400, 3), pf('Ayasofya', -300, 0, 4), pf('Süleymaniye Camii', 0, -700, 5)] }, o);
  const far = parsePhotonMosques({ features: [pf('Moschee Berlin', 90000, 0, 9), pf('Fatih Camii', 200, 0, 1)] }, o);
  const picked = pickMosques(near, far, 1500);
  ok(picked.length === 4 && picked[0].name === 'Fatih Camii' && !picked.some((m) => /Church|Berlin/.test(m.name)), `Photon cami seçimi: ${picked.map((m) => m.name || '(adsız)').join(', ')}`);
  const nonMuslim = pickMosques(parsePhotonMosques({ features: [pf('Dom', 100, 0, 1), pf('Kapelle', 200, 0, 2), pf('', 300, 0, 3), pf('Al-Nur Moschee', 900, 0, 4)] }, o), [], 1500);
  ok(nonMuslim.length === 1 && nonMuslim[0].name === 'Al-Nur Moschee', 'Müslüman olmayan bölgede yalnız adı cami olanlar');

  // İnternet yok: son sonuç gösterilir, mesafeler yeni konuma göre
  let stored = '';
  const cache = { get: async () => stored || null, set: async (v: string) => { stored = v; } };
  await findMosques(o, 'tr', { fetcher: async (u) => { if (u.includes('photon')) throw new Error('x'); return { ok: true, status: 200, json: async () => sample }; }, cache });
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
    ['accent/surface', contrast(c.accent, c.surface)], ['ink2/surface', contrast(c.ink2, c.surface)],
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
  // Birleştirme (aynı renkli, örtüşmeyen şekiller tek yol) açıya göre farklı sayıda öğe verir
  ok(md.every((n) => n > 60), `Medine sahnesi her açıda kurulur (${md.join(',')})`);
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
  // OSM'nin ~820 parçası birleştirmeden sonra; Saat Kulesi yarı saydam katmanda
  ok(all.length < 900, `yakın görünümde şekil sayısı makul (${all.length}; yarı saydam ${near.ghost.length})`);
  const md = buildMadinah(new Cam(1.6, 200, 300, -35));
  ok(!/NaN|Infinity/.test(JSON.stringify(md)), 'Nebevî sahnesi geçerli');
}

// ── Gerçek 3D veri (OpenStreetMap): çözme, minareler, dışbükey bölme, çizim sırası, birleştirme ──
{
  const mk = decodeOsm3d(HARAM_3D);
  const md = decodeOsm3d(NABAWI_3D);
  ok(mk.parts.length === 823 && mk.outer.length === 3 && mk.inner.length === 1, `Haram verisi: ${mk.parts.length} parça, ${mk.outer.length} dış hat, ${mk.inner.length} avlu`);
  ok(md.marks.length === 10 && md.marks.filter((m) => m[2] > 100).length === 6, `Nebevî: 10 minare (6 × 104 m, 4 × 70 m)`);
  ok(mk.parts.every((p) => p.h1 > p.h0 || p.h1 === p.h0) && Math.max(...mk.parts.map((p) => p.h1)) === 601, 'Saat Kulesi alemi 601 m; ters yükseklik kalmadı');
  const { towers } = findTowers(mk.parts);
  ok(towers.length === 13 && towers.filter((t) => t.top > 130).length === 4, `Haram'da 13 minare bulundu (${towers.length}; 4'ü genişlemede ${towers.filter((t) => t.top > 130).map((t) => t.top).join('/')} m)`);
  const ring = mk.parts.find((p) => p.h0 === 0 && p.h1 === 9.5)!;
  const pcs = convexPieces(ring.pts);
  const areaSum = pcs.reduce((a, q) => a + Math.abs(signedArea(q.pts)), 0);
  ok(pcs.length > 1 && Math.abs(areaSum - Math.abs(signedArea(ring.pts))) < 1 && pcs.every((q) => q.pts.length >= 3), `Mataf halkası ${pcs.length} dışbükey parçaya bölündü (alan korunur)`);
  // İki kutu: önde (güneyde) olan sonra çizilir; dönünce sıra değişir
  const box = (y: number, c: string) => `0 100 F 0 - ${c} ${c} p 0 ${y} 100 0 0 100 -100 0`;
  const data = decodeOsm3d(`pal #ff0000 #0000ff\n${box(0, '0')}\n${box(300, '1')}`);
  const mdl = buildModel({ data, paint: (p) => ({ wall: p.wall!, roof: p.roof === 'F' ? p.wall! : '#000000' }) });
  const firstFill = (rot: number) => {
    const f0 = (drawModel(new Cam(1, 0, 0, rot), mdl).below[0] as { fill: string }).fill;
    return parseInt(f0.slice(1, 3), 16) > parseInt(f0.slice(5, 7), 16) ? 'red' : 'blue';
  };
  ok(firstFill(0) === 'red' && firstFill(180) === 'blue', 'ressam sırası: güneydeki kutu güneyden bakınca sonra, kuzeyden bakınca önce çizilir');
  // Birleştirme: araya giren farklı renkli örtüşen şekil sırayı korur
  const sq = (x: number, fill: string) => ({ t: 'poly' as const, pts: `${x},0 ${x + 10},0 ${x + 10},10 ${x},10`, fill });
  const merged = mergePrims([sq(0, '#ff0000'), sq(5, '#0000ff'), sq(9, '#ff0000'), sq(100, '#ff0000')]);
  ok(merged.length === 3 && merged[0].t === 'poly' && (merged[2] as { d?: string }).d?.split('M').length === 3, `birleştirme sırayı korur (${merged.length} öğe)`);
}

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
  ok(r1.length === 0 && !!s1 && s1.url.includes('/api/v5/plan?fromPlace=41.000000,29.000000') && s1.url.includes('time=2026-11-24T10%3A00%3A00.000Z') && s1.ua === 'MATAF/0.4.0 (a@b.c)', 'Transitous isteği: uç nokta, zaman, User-Agent');
  let threw = false;
  try { await planTransit({ lat: 0, lng: 0 }, { lat: 1, lng: 1 }, { lang: 'en', contact: 'x', version: '1', fetcher: async () => ({ ok: false, status: 429, json: async () => ({}) }) }); } catch { threw = true; }
  ok(threw, 'Transitous hata kodu (429) yakalanır');
}

// ── Gökyüzü: güneş ve ayın yeri ──
{
  ok(moonPhaseName(0, 'tr') === 'Yeni ay' && moonPhaseName(0.5, 'tr') === 'Dolunay' && moonPhaseName(0.25, 'tr') === 'İlk dördün' && moonPhaseName(0.75, 'tr') === 'Son dördün', 'ay: dört ana evrenin adı');
  ok(moonPhaseName(0.1, 'tr') === 'Hilal (büyüyen)' && moonPhaseName(0.9, 'tr') === 'Hilal (küçülen)' && moonPhaseName(0.99, 'en') === 'New moon', 'ay: hilal büyüyen/küçülen, sona yakın yeni ay');
  ok(directionText(0, 'tr') === 'kuzeyde' && directionText(180, 'tr') === 'güneyde' && directionText(225, 'tr') === 'güneybatıda' && directionText(359, 'tr') === 'kuzeyde' && directionText(-90, 'tr') === 'batıda', 'yön: sekiz yön, 360 ve eksi açı');
  ok(altitudeText(43.4, 'tr') === 'ufkun 43° üstünde' && altitudeText(-12.6, 'tr') === 'ufkun 13° altında', 'yükseklik yazısı');
  ok(moonLitPath(0, 0, 10, 0.005, true) === '', 'ay: yeni ayda aydınlık kısım çizilmez');
  ok(moonLitPath(0, 0, 10, 0.25, true).includes('A 10 10 0 0 1') && moonLitPath(0, 0, 10, 0.25, true).includes('A 5 10 0 0 0'), 'ay: büyüyen hilal sağda, uçbirleşim çizgisi sağa yakın');
  ok(moonLitPath(0, 0, 10, 0.75, true).includes('A 5 10 0 0 1'), 'ay: büyüyen şişkin ay, uçbirleşim sola taşar');
  ok(moonLitPath(0, 0, 10, 0.25, false).includes('A 10 10 0 0 0') && moonLitPath(0, 0, 10, 0.25, false).includes('A 5 10 0 0 1'), 'ay: küçülen hilal solda');
  ok(skyPhase(20) === 'day' && skyPhase(-3) === 'twilight' && skyPhase(-20) === 'night', 'gökyüzü rengi: gündüz/alacakaranlık/gece');
  // Mekke, 26 Kasım 2026 öğle: güneşin en yüksek açısı ≈ 90 − 21,42 − 21,1 ≈ 47,5°
  const MK = { lat: 21.4225, lng: 39.8262 };
  const noon = skyDay(new Date('2026-11-26T09:00:00Z'), MK.lat, MK.lng, 'UmmAlQura');
  ok(Math.abs(noon.sunMax - 47.5) < 1.2, `güneş: Mekke'de kasım sonu öğle yüksekliği (${noon.sunMax.toFixed(1)}°)`);
  ok(noon.sun.length === 145 && noon.end - noon.start === 24 * 3600e3, 'gökyüzü penceresi 24 saat, 10 dakikada bir örnek');
  // Sıradaki vakit pencerede her zaman var (Mekke ve İstanbul, günün her iki saatinde)
  let allIn = true;
  for (const P of [MK, { lat: 41.0369, lng: 28.985 }]) {
    for (let h = 0; h < 24; h += 2) {
      const now = new Date(Date.UTC(2026, 10, 26, h, 7));
      const d = skyDay(now, P.lat, P.lng, 'Turkey');
      const nx = nextPrayer(P.lat, P.lng, 'Turkey', now);
      const sorted = d.marks.every((m, i) => i === 0 || d.marks[i - 1].at.getTime() <= m.at.getTime());
      if (!sorted || !d.marks.some((m) => m.key === nx.key && Math.abs(m.at.getTime() - nx.at.getTime()) < 60e3) || now.getTime() < d.start || now.getTime() > d.end) allIn = false;
    }
  }
  ok(allIn, 'gökyüzü: şu an ve sıradaki vakit her saatte pencerenin içinde, işaretler sıralı');
  // Yatsıdan sonra ekranda yarının vakitleri: vurgulanan imsak geri sayımın saatiyle aynı
  {
    const before = new Date('2026-11-26T12:00:00Z');
    const after = new Date('2026-11-26T16:30:00Z');
    const a = shownDay(MK.lat, MK.lng, 'UmmAlQura', before);
    const b = shownDay(MK.lat, MK.lng, 'UmmAlQura', after);
    const nb = nextPrayer(MK.lat, MK.lng, 'UmmAlQura', after);
    ok(!a.tomorrow && a.t.isha > before, 'vakit kartı: yatsıdan önce bugünün vakitleri');
    ok(b.tomorrow && nb.key === 'fajr' && b.t.fajr.getTime() === nb.at.getTime(), 'vakit kartı: yatsıdan sonra yarının vakitleri, imsak geri sayımla aynı');
  }
  // 24 Kasım 2026 dolunay, 9 Aralık 2026 yeni ay
  ok(skyNow(new Date('2026-11-24T15:00:00Z'), MK.lat, MK.lng).moon.fraction > 0.98, 'ay: 24 Kasım 2026 dolunay');
  ok(skyNow(new Date('2026-12-09T03:00:00Z'), MK.lat, MK.lng).moon.fraction < 0.03, 'ay: 9 Aralık 2026 yeni ay');
}

// ── Güncelleme uyarısı: sürüm karşılaştırma ──
ok(newer('0.10.0', '0.9.0') && !newer('0.9.0', '0.9.0') && !newer('0.9.1', '0.10.0') && newer('1.0', '0.99.9'), 'güncelleme: sürüm karşılaştırma (0.10 > 0.9)');

// ── Yerlerim ──
ok(guessKind('Çadırım') === 'tent' && guessKind('Mina çadırı 34/B') === 'tent' && guessKind('Buluşma noktası') === 'meet' && guessKind('Kafile otobüsü') === 'car' && guessKind('Otopark') === 'car' && guessKind('Zemzem musluğu') === 'pin', 'yerlerim: türü addan tahmin (çadır, buluşma, araç, diğer)');
ok(shareLink({ lat: 21.4225, lng: 39.8262 }) === 'https://maps.google.com/?q=21.422500,39.826200', 'yerlerim: paylaşım bağlantısı');

// ── Haremeyn treni ──
{
  const st = (id: string) => HHR_STATIONS.find((x) => x.id === id)!;
  const dMk = meters(st('makkah'), { lat: 21.4225, lng: 39.8262 });
  const dMd = meters(st('madinah'), { lat: 24.4672, lng: 39.6111 });
  ok(HHR_STATIONS.length === 5 && dMk > 3000 && dMk < 5500 && dMd > 7000 && dMd < 11000, `tren: istasyonlar yerinde (Mekke–Harem ${Math.round(dMk)} m, Medine–Mescid ${Math.round(dMd)} m)`);
  ok(HHR_STATIONS.every((x, i) => i === 0 || x.lat >= HHR_STATIONS[i - 1].lat - 0.01), 'tren: istasyonlar hat sırasında (güneyden kuzeye)');
}

// ── Teşrik tekbiri, mübarek gün ve hac hatırlatmaları ──
{
  const MK = { lat: 21.4225, lng: 39.8262 };
  let n = 0;
  for (let d = 14; d <= 20; d++) {
    const t = prayerTimes(MK.lat, MK.lng, 'UmmAlQura', new Date(2027, 4, d, 12));
    for (const k of ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'] as const) if (isTesrik(k, t[k])) n++;
    if (isTesrik('sunrise', t.sunrise)) n += 100;
  }
  ok(n === 23, `teşrik tekbiri: Arefe sabahından bayramın 4. günü ikindisine 23 vakit (${n})`);
  const t15 = prayerTimes(MK.lat, MK.lng, 'UmmAlQura', new Date(2027, 4, 15, 12));
  const t19 = prayerTimes(MK.lat, MK.lng, 'UmmAlQura', new Date(2027, 4, 19, 12));
  ok(isTesrik('fajr', t15.fajr) && isTesrik('asr', t19.asr) && !isTesrik('maghrib', t19.maghrib), 'teşrik: ilk vakit Arefe sabahı, son vakit 13 Zilhicce ikindi');

  const tf = (day: Date) => prayerTimes(41.0369, 28.985, 'Turkey', day);
  const at = (lat: number, lng: number, day: Date) => prayerTimes(lat, lng, 'UmmAlQura', day);
  const ex = planExtras({ now: new Date(2026, 11, 8, 9), days: 7, lang: 'tr', special: true, hajj: false, timesFor: tf, timesAt: at });
  const titles = ex.map((x) => x.title);
  ok(titles.includes('Yarın Üç Ayların Başlangıcı') && titles.includes('Bu gece Regaib Kandili'), `mübarek gün: üç aylar ve Regaib hatırlatması (${titles.join(' | ')})`);
  const reg = ex.find((x) => x.title === 'Bu gece Regaib Kandili');
  ok(!!reg && reg.at.getDate() === 10 && reg.at.getMonth() === 11, 'Regaib: 10 Aralık 2026 perşembe akşamı (Diyanet ile aynı)');
  const nx = nextSpecial(new Date(2027, 0, 1, 9));
  ok(!!nx && nx.s.name.tr === 'Mîrac Kandili' && nx.date.getDate() === 5, 'Miraç: 27 Recep = 5 Ocak 2027 (kandil gecesi 4 Ocak akşamı)');
  const hx = planExtras({ now: new Date(2027, 4, 13, 9), days: 7, lang: 'tr', special: false, hajj: true, timesFor: tf, timesAt: at });
  const ids = hx.map((x) => x.id.split('-').slice(0, 2).join('-'));
  ok(['hac-8', 'hac-9a', 'hac-9b', 'hac-10', 'hac-11', 'hac-12', 'hac-12b', 'hac-13'].every((k) => ids.includes(k)) && hx.length === 8, `hac hatırlatmaları: 8 an (${ids.join(',')})`);
  const arafat = hx.find((x) => x.id.startsWith('hac-9a'))!;
  const ar = at(21.3549, 39.9841, new Date(2027, 4, 15, 12));
  ok(arafat.at.getTime() === ar.dhuhr.getTime(), 'hac: Arafat vakfesi bildirimi Arafat’ta öğle vaktinde');
  ok(planExtras({ now: new Date(2027, 4, 13, 9), days: 7, lang: 'tr', special: false, hajj: false, timesFor: tf, timesAt: at }).length === 0, 'hatırlatmalar kapalıyken bildirim yok');
  const fx = planExtras({ now: new Date(2026, 10, 26, 9), days: 7, lang: 'tr', special: false, hajj: false, friday: true, timesFor: tf, timesAt: at });
  const cuma = fx.filter((x) => x.id.startsWith('cuma-'));
  ok(cuma.length === 1 && cuma[0].at.getDay() === 5 && cuma[0].at > tf(cuma[0].at).sunrise && cuma[0].url === '/kuran/18', `cuma hatırlatması: haftada bir, cuma sabahı, Kehf açılır (${cuma.map((x) => x.at.toString().slice(0, 21)).join()})`);
  const qx = planExtras({ now: new Date(2026, 10, 26, 9), days: 7, lang: 'tr', special: false, hajj: false, quran: true, timesFor: tf, timesAt: at });
  ok(qx.length >= 7 && qx.every((x) => x.id.startsWith('hatim-') && x.url === '/hatim' && x.at > tf(x.at).isha), `hatim hatırlatması: her gün yatsıdan sonra (${qx.length})`);
}

// ── Resimli gökyüzü sahnesi ──
{
  const hex = /^#[0-9a-f]{6}$/i;
  const keys = ['skyTop', 'skyMid', 'skyLow', 'glow', 'sun', 'far', 'far2', 'wall', 'shade', 'ground', 'cloud', 'cloudShade'] as const;
  let badHex = 0, badText = 0, jump = 0, prev: ReturnType<typeof scenePalette> | null = null;
  const ch = (a: string, b: string) => Math.max(...[1, 3, 5].map((i) => Math.abs(parseInt(a.slice(i, i + 2), 16) - parseInt(b.slice(i, i + 2), 16))));
  for (const morning of [true, false]) {
    prev = null;
    for (let alt = -40; alt <= 90; alt += 0.5) {
      const p = scenePalette(alt, morning);
      if (keys.some((k) => !hex.test(p[k]))) badHex++;
      if (contrast(p.text, textZone(p)) < 3) badText++;
      if (prev && keys.some((k) => ch(p[k], prev![k]) > 14)) jump++;
      prev = p;
    }
  }
  ok(!badHex, `sahne: her yükseklikte geçerli renkler (${badHex} hata)`);
  ok(!badText, `sahne: üstteki çiplerin yazısı gökyüzü üstünde okunur, kontrast ≥ 3 (${badText} hata)`);
  ok(!jump, `sahne: renkler yarım derecede sıçramıyor, akıcı geçiş (${jump} sıçrama)`);
  const n = scenePalette(-30, true), d = scenePalette(40, false);
  ok(n.stars === 1 && n.lights === 1 && d.stars === 0 && d.lights === 0, 'sahne: gece yıldızlar ve ışıklar yanar, gündüz söner');
  const e = bodyPos(0, 90), w = bodyPos(0, 270), s = bodyPos(45, 180), z = bodyPos(90, 30);
  ok(e.x < 0.1 && w.x > 0.9 && Math.abs(s.x - 0.5) < 1e-9 && Math.abs(z.x - 0.5) < 1e-6 && Math.abs(z.h - 1) < 1e-9 && Math.abs(e.h) < 1e-9, 'sahne: doğu solda, batı sağda, güney ortada, tepe noktası en üstte');
  ok(horizonGlow(0) > 0.95 && horizonGlow(30) < 0.01 && horizonGlow(-25) < 0.01, 'sahne: ufuk kızıllığı yalnız güneş ufka yakınken');
  ok(sceneKind(21.4225, 39.8262) === 'makkah' && sceneKind(21.39, 39.86) === 'makkah' && sceneKind(21.54, 39.17) === 'mosque' && sceneKind(24.4672, 39.6111) === 'madinah' && sceneKind(41.0369, 28.985) === 'mosque', 'sahne: Mekke, Medine ve başka yer ayrımı');
}

// ── İstanbul raylı sistem tarifi (çevrimdışı) ve gündelik dille adımlar ──
{
  const data = istanbulRail as unknown as RailData;
  const refs = data.l.map((l) => l.r);
  ok(['M1A', 'M1B', 'M2', 'M4', 'M5', 'M11', 'T1', 'B1'].every((r) => refs.includes(r)), `raylı ağ: ana hatlar var (${refs.join(' ')})`);
  const net = railNetwork(data);
  const r1 = planRail(net, { lat: 41.0045, lng: 28.952 }, { lat: 41.0397, lng: 28.8567 }, new Date(2026, 10, 27, 9));
  const best = r1.itineraries[0];
  const ride = best?.legs.filter((g) => g.kind !== 'walk') ?? [];
  ok(!!best && ride.length === 1 && ride[0].line === 'M1B' && ride[0].headsign === 'Kirazlı' && ride[0].to.name === 'Bağcılar Meydan', `tarif: Yenikapı → Bağcılar Meydan = M1B (Kirazlı yönü), ${best?.minutes} dk`);
  ok(!!best && best.minutes > 20 && best.minutes < 60 && best.approx === true, 'tarif: süre makul ve "yaklaşık" işaretli');
  const r2 = planRail(net, { lat: 41.0369, lng: 28.985 }, { lat: 40.991, lng: 29.026 });
  const lines2 = r2.itineraries[0]?.legs.filter((g) => g.kind !== 'walk').map((g) => g.line) ?? [];
  ok(lines2.includes('B1') || lines2.includes('M4') || lines2.includes('M5'), `tarif: Taksim → Kadıköy kıta geçişi raylı (${lines2.join(' → ')})`);
  const r3 = planRail(net, { lat: 41.0054, lng: 28.9768 }, { lat: 41.0078, lng: 28.9800 });
  ok(r3.itineraries.length === 0 && r3.walkOnly < 10, 'tarif: kısa mesafede yürümek önerilir (toplu taşıma yok)');
  ok(!inIstanbul({ lat: 21.4225, lng: 39.8262 }) && inIstanbul({ lat: 41.0369, lng: 28.985 }), 'tarif: İstanbul sınırı (Mekke dışarıda)');
  ok(textOn('#f0e514') === '#1D1D1F' && textOn('#004f7d') === '#FFFFFF', 'hat rozeti: açık renkte koyu, koyu renkte beyaz yazı');
  const m1b = ride[0];
  if (m1b) {
    const b = boardText(m1b, 'tr');
    ok(b.head === 'M1B metrosuna binin' && b.dir === 'Kirazlı yönü' && alightText(m1b, 'tr') === 'Bağcılar Meydan istasyonunda inin', `dil: "${b.head} (${b.dir}) · ${alightText(m1b, 'tr')}"`);
    ok(boardText(m1b, 'en').head === 'Take metro M1B' && alightText(m1b, 'en') === 'Get off at Bağcılar Meydan', 'dil: İngilizce adımlar');
    ok(walkText(m1b, 'Yenikapı', 'tr') === 'Yenikapı istasyonuna yürüyün' && walkText(undefined, '', 'tr') === 'Varış noktasına yürüyün', 'dil: yürüme adımları');
  }
  const bus = { ...m1b!, kind: 'bus' as const, line: '129T', headsign: 'BOSTANCI PERONLAR', to: { name: 'KISIKLI', time: '' } };
  ok(boardText(bus, 'tr').head === '129T otobüsüne binin' && boardText(bus, 'tr').dir === 'Bostancı Peronlar yönü' && alightText(bus, 'tr') === 'Kısıklı durağında inin', 'dil: otobüs (büyük harfli İETT adları düzeltilir)');
  ok(stopsText(1, 'en') === '1 stop' && stopsText(4, 'en') === '4 stops' && stopsText(1, 'tr') === '1 durak' && stopsText(2, 'ar') === 'محطتان' && stopsText(5, 'ar') === '5 محطات' && stopsText(12, 'ar') === '12 محطة', 'dil: durak sayısı (İngilizce tekil, Arapça sayı kuralı)');
  ok(tidyName('GÜMÜŞSUYU PERON', 'tr') === 'Gümüşsuyu Peron' && tidyName('Bağcılar Meydan', 'tr') === 'Bağcılar Meydan', 'dil: büyük harfli durak adı');
  const marm = { ...m1b!, kind: 'train' as const, line: 'B1' };
  ok(boardText(marm, 'tr').head === 'Marmaray trenine binin', 'dil: Marmaray');
}

// ── Mekke otobüsleri (Makkah Bus, çevrimdışı) ──
{
  const data = makkahBus as unknown as RailData;
  const refs = data.l.map((l) => l.r);
  const withEn = data.s.filter((x) => !!x[3]).length;
  ok(refs.length >= 12 && ['1', '2', '4', '5', '6', '7A', '10', '12'].every((r) => refs.includes(r)) && data.s.length > 300 && withEn / data.s.length > 0.97 && data.l.every((l) => l.m === 'bus'),
    `otobüs ağı: ${refs.length} hat, ${data.s.length} durak, %${Math.round((withEn / data.s.length) * 100)} İngilizce adlı`);
  const KAABA = { lat: 21.4225, lng: 39.8262 };
  const TRAIN = { lat: 21.4164, lng: 39.7896 }; // Haremeyn treni Mekke istasyonu
  const AISHA = { lat: 21.4676, lng: 39.8007 }; // Ten'im, Ayşe Camii (umre mîkatı)
  ok(covers(data, KAABA) && covers(data, TRAIN) && !covers(data, { lat: 41.0369, lng: 28.985 }) && !covers(data, { lat: 21.5433, lng: 39.1728 }) && covers(istanbulRail as unknown as RailData, { lat: 41.0369, lng: 28.985 }),
    'otobüs ağı: kapsama (Mekke içi evet; İstanbul ve Cidde hayır)');
  const net = railNetwork(data);
  const now = new Date('2026-11-26T10:00:00Z');
  const t1 = planRail(net, TRAIN, KAABA, now, 'tr').itineraries[0];
  const b1 = t1?.legs.filter((g) => g.kind !== 'walk') ?? [];
  ok(!!t1 && b1.length === 1 && b1[0].line === '7A' && b1[0].kind === 'bus' && t1.minutes < 45 && boardText(b1[0], 'tr').head === '7A otobüsüne binin' && boardText(b1[0], 'tr').dir === 'Al-Shabeka 439 yönü',
    `otobüs: tren istasyonu → Harem = 7A (${b1[0] ? boardText(b1[0], 'tr').dir : '-'}), ≈${t1?.minutes} dk`);
  const a1 = planRail(net, TRAIN, KAABA, now, 'ar').itineraries[0]?.legs.find((g) => g.kind === 'bus');
  ok(!!a1 && a1.headsign === 'الشبيكة 439' && alightText(a1, 'ar') === 'انزل في موقف الشبيكة 439', 'otobüs: Arapça arayüzde durak adları Arapça');
  const t2 = planRail(net, KAABA, AISHA, now, 'en').itineraries[0];
  const b2 = t2?.legs.filter((g) => g.kind !== 'walk') ?? [];
  ok(!!t2 && b2.length === 1 && /Ayesha Mosque/.test(b2[0].to.name) && t2.minutes < 60 && planRail(net, KAABA, AISHA, now).walkOnly > t2.minutes,
    `otobüs: Harem → Ten'im (Ayşe Camii) tek otobüs (${b2.map((g) => g.line).join(' → ')}, ${b2[0]?.to.name}), ≈${t2?.minutes} dk`);
}

// ── Küçük uygulama yenileme anları ──
{
  const props = buildWidgetProps({
    start: new Date(2026, 10, 26), timesFor: (d) => prayerTimes(41.0369, 28.985, 'Turkey', d), fmt: (d) => `${d.getHours()}:${d.getMinutes()}`,
    dayLabel: (d) => String(d.getDate()), place: 'İstanbul', names: ['İmsak', 'Güneş', 'Öğle', 'İkindi', 'Akşam', 'Yatsı'], lang: 'tr', palette: 'kabe', mode: 'system', days: 5,
  });
  const now = new Date(2026, 10, 26, 13, 0).getTime();
  const ticks = widgetTicks(props, now);
  ok(ticks.length === 24 && ticks.every((t, i) => t > now && (i === 0 || t > ticks[i - 1])), `küçük uygulama: 24 yenileme anı, ileri ve sıralı (ilki ${new Date(ticks[0]).toTimeString().slice(0, 5)})`);
  ok(props.after === 'Sonra', 'küçük uygulama: "Sonra" etiketi');
}

// ── Namaz takibi ──
{
  const today = new Date(2026, 10, 27, 15, 0);
  const d0 = dayKey(today);
  ok(d0 === '2026-11-27' && dayKey(new Date(2026, 0, 5, 23, 59)) === '2026-01-05', 'namaz takibi: gün anahtarı yerel tarih, sıfır dolgulu');
  let log = toggle({}, d0, 'fajr');
  log = toggle(log, d0, 'asr');
  ok(isDone(log, d0, 'fajr') && isDone(log, d0, 'asr') && !isDone(log, d0, 'dhuhr') && countDay(log, d0) === 2, 'namaz takibi: işaretle, say (2 vakit)');
  log = toggle(toggle(log, d0, 'fajr'), d0, 'asr');
  ok(!(d0 in log), 'namaz takibi: iki işaret de kalkınca gün kayıttan silinir');
  const days = logDays(today, 7);
  ok(days.length === 7 && days[6] === d0 && days[0] === '2026-11-21', 'namaz takibi: son 7 gün eskiden yeniye, bugün sonda');
  const full: Record<string, number> = {};
  for (const k of logDays(today, 4).slice(0, 3)) full[k] = FULL_DAY; // 3 tam gün (dün dahil), bugün eksik
  ok(streak(full, today) === 3, `namaz takibi: bugün bitmeden seri bozulmaz (3 = ${streak(full, today)})`);
  ok(streak({ ...full, [d0]: FULL_DAY }, today) === 4, 'namaz takibi: bugün de tamamsa seri 4');
  ok(streak({ ...full, [days[5]]: 15 }, today) === 0, 'namaz takibi: dün eksikse seri sıfır (dün 4 vakit)');
  ok(countDays({ ...full, [d0]: 3 }, days) === 17, 'namaz takibi: son 7 günde 3×5 + 2 = 17 vakit');
  const old = { '2025-01-01': 31, [d0]: 1 };
  ok(Object.keys(prune(old, today)).join() === d0, 'namaz takibi: 400 günden eski kayıt atılır');
  const clean = sanitize({ [d0]: 5, 'x': 3, '2026-11-26': 99, '2026-11-25': 1.5, '2026-11-24': 0, '2026-11-23': '7' });
  ok(Object.keys(clean).join() === d0 && clean[d0] === 5 && Object.keys(sanitize(null)).length === 0, 'namaz takibi: bozuk kayıt temizlenir');
}

// ── Günün duası ──
{
  const a = new Date(2026, 10, 27, 0, 5);
  const b = new Date(2026, 10, 27, 23, 55);
  const c = new Date(2026, 10, 28, 0, 5);
  ok(dayNumber(a) === dayNumber(b) && dayNumber(c) === dayNumber(a) + 1, 'günün duası: gün numarası saatten bağımsız, ertesi gün +1');
  const n = allTextDuas().filter((x) => x.d.ar.length <= 200).length;
  const i = dailyIndex(a, n);
  ok(n >= 30 && i >= 0 && i < n && dailyIndex(b, n) === i && dailyIndex(c, n) === (i + 1) % n && dailyIndex(a, 0) === -1,
    `günün duası: ${n} kısa dua; aynı gün aynı, ertesi gün sıradaki`);
  ok(allTextDuas().every((x) => !!x.d.ref), 'günün duası: her duanın kaynağı yazılı');
}

// ── Hatim planı ──
{
  ok(JUZ_STARTS.length === 30 && JUZ_STARTS.every(([a, b], i) => i === 0 || readFromMark(a, b) > readFromMark(...JUZ_STARTS[i - 1])), 'hatim: 30 cüz başı, sıralı');
  ok(juzPos(0) === 0 && juzPos(readFromMark(2, 142)) === 1 && juzPos(readFromMark(78, 1)) === 29 && juzPos(TOTAL_AYAH) === 30, 'hatim: cüz konumu (Bakara 142 = 1, Nebe 1 = 29, son = 30)');
  ok(fromGlobal(1).join() === '1,1' && fromGlobal(8).join() === '2,1' && fromGlobal(TOTAL_AYAH).join() === '114,6' && fromGlobal(readFromMark(18, 45) + 1).join() === '18,45', 'hatim: Mushaf sırası → sûre ve âyet');
  const plan = { start: '2026-11-27', days: 30, from: 0 };
  const d0 = new Date(2026, 10, 27, 20);
  const t0 = hatimToday(plan, 0, d0);
  ok(t0.day === 1 && t0.left === readFromMark(2, 142) && Math.abs(t0.juzLeft - 1) < 0.01 && t0.pagesLeft === 21 && t0.pageFrom === 1 && t0.pageTo === 21 && t0.from.join() === '1,1' && t0.to.join() === '2,141', `hatim: 30 günlük planda ilk gün ≈ 1 cüz (${t0.juzLeft.toFixed(2)} cüz, ${t0.pagesLeft} sayfa)`);
  ok([0, 1, 7.5, 15, 29.25].every((j) => Math.abs(juzPos(readAtJuz(j)) - j) < 0.02), 'hatim: cüz konumu ↔ âyet sayısı karşılıklı');
  ok(targetRead(plan, new Date(2026, 11, 26, 12)) === TOTAL_AYAH && targetRead(plan, new Date(2027, 0, 30)) === TOTAL_AYAH, 'hatim: son gün ve sonrasında hedef Mushaf sonu');
  const done = hatimToday(plan, t0.target + 10, d0);
  ok(done.left === 0 && !done.finished && hatimToday(plan, TOTAL_AYAH, d0).finished, 'hatim: bugünkü bölüm bitince kalan 0; son âyette hatim tamam');
  ok(hatimToday(plan, 100, new Date(2027, 0, 10)).overdue && !hatimToday(plan, 100, d0).overdue, 'hatim: süre dolunca "süre doldu"');
  const late = hatimToday({ start: '2026-11-27', days: 60, from: readFromMark(18, 45) }, readFromMark(18, 45), d0);
  ok(late.from.join() === '18,45' && late.left > 0, 'hatim: kaldığı yerden başlayan plan ayraçtan başlar');
  ok(cleanPlan({ start: '2026-11-27', days: 30, from: 0 }) !== null && cleanPlan({ start: 'x', days: 30, from: 0 }) === null && cleanPlan({ start: '2026-11-27', days: 0, from: 0 }) === null && cleanPlan(null) === null, 'hatim: bozuk plan kaydı yok sayılır');
}

// ── Zikir, hazırlık listesi, Arapça ifadeler ──
{
  const now = new Date(2026, 10, 27, 15);
  const items = [{ at: new Date(2026, 10, 27, 8).getTime(), name: 'a', count: 33 }, { at: new Date(2026, 10, 26, 22).getTime(), name: 'b', count: 99 }];
  ok(zikirToday(items, { a: 10, b: 0 }, now) === 43, 'zikir: bugünkü toplam = bugün kaydedilen + sayaçta bekleyen (33 + 10)');
  const ids = CHECKLIST.flatMap((g) => g.items.map((i) => `${g.id}.${i.id}`));
  ok(new Set(ids).size === ids.length && CHECKLIST.every((g) => g.items.every((i) => i.text.tr && i.text.en && i.text.ar)), `hazırlık listesi: ${ids.length} madde, kimlikler tekil, üç dilde`);
  const ph = PHRASES.flatMap((g) => g.items);
  ok(new Set(ph.map((p) => p.id)).size === ph.length && ph.every((p) => /[\u0600-\u06FF]/.test(p.ar) && p.tr && p.mean.tr && p.mean.en), `Arapça ifadeler: ${ph.length} ifade, Arapça metin, okunuş ve anlam`);
}

// ── Tecvid ve secde âyetleri ──
{
  const b = parseTajweed('بِسْمِ [h:1[ٱ]للَّهِ [h:2[ٱ][l[ل]رَّحْمَ[n[ـٰ]نِ');
  ok(plainOf(b) === 'بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ' && b.filter((x) => x.r).map((x) => x.r).join('') === 'hhln', `tecvid: işaretleme parçalanır (${b.map((x) => x.r ?? '-').join('')})`);
  const bad = parseTajweed('قُلْ [z[هُوَ] ٱللَّهُ [h[ٱ');
  ok(!/[[\]]/.test(plainOf(bad)) && bad.every((x) => !x.r) && plainOf(bad).includes('هُوَ'), 'tecvid: tanınmayan ya da yarım işaret metne karışmaz');
  ok(plainOf(dropWords(parseTajweed('بِسْمِ [h[ٱ]للَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ [q[ٱ]لْحَمْدُ'), 4)) === 'ٱلْحَمْدُ', 'tecvid: baştaki dört kelime atılır, işaret korunur');
  ok(plainOf(stripTajweedBasmala(2, 1, parseTajweed('بِسْمِ [h[ٱ]للَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ الٓمٓ'))) === 'الٓمٓ' && plainOf(stripTajweedBasmala(1, 1, parseTajweed('بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ'))).startsWith('بِسْمِ'), 'tecvid: besmele 1. âyetten ayrılır (Fâtiha hariç)');
  ok(TAJWEED_RULES.length === 17 && TAJWEED_RULES.every((r) => parseTajweed(r.example).some((x) => x.r === r.id)) && OTHER_RULES.every((r) => !/\[/.test(r.example)),
    'tecvid: 17 renkli kural, her örnekte kendi rengi');
  const badColor: string[] = [];
  for (const dark of [false, true]) for (const p of Object.keys(PALETTES) as PaletteId[]) {
    const bg = colorsFor(dark, p).bg;
    for (const r of TAJWEED_RULES) if (contrast(dark ? r.dark : r.light, bg) < 3) badColor.push(`${r.id}/${p}/${dark ? 'koyu' : 'açık'}`);
  }
  ok(!badColor.length, `tecvid renkleri her palette okunur, kontrast ≥ 3${badColor.length ? ': ' + badColor.join(' ') : ''}`);
  ok(SAJDAH.length === 14 && SAJDAH.every(([s2, a2]) => a2 >= 1 && a2 <= surahLength(s2)) && isSajdah(32, 15) && isSajdah(96, 19) && !isSajdah(22, 77),
    'secde âyetleri: Hanefî 14 yer (Hac 77 yok), numaralar geçerli');
  ok(stripSajdahSign('كَلَّا لَا تُطِعْهُ وَٱسْجُدْ وَٱقْتَرِب ۩') === 'كَلَّا لَا تُطِعْهُ وَٱسْجُدْ وَٱقْتَرِب' && stripSajdahSign('قَالَ') === 'قَالَ', 'secde âyetleri: kaynak metindeki işaret ayrılır (çift görünmez)');
}

// ── Kur'an hatları ──
{
  const ids = QURAN_FONTS.map((f) => f.id);
  const pkg: Record<string, string> = { AmiriQuran: 'amiri-quran', ScheherazadeNew: 'scheherazade-new', NotoNaskhArabic: 'noto-naskh-arabic', Lateef: 'lateef' };
  const files = QURAN_FONTS.filter((f) => f.family).map((f) => (f.family === 'MatafMadina' ? 'assets/fonts/MatafMadina.ttf' : `node_modules/@expo-google-fonts/${pkg[f.family as string]}/400Regular/${f.family}_400Regular.ttf`));
  ok(new Set(ids).size === ids.length && ids[0] === 'system' && files.length === 5 && files.every((p2) => existsSync(p2)) && existsSync('assets/fonts/MatafMadina-OFL.txt'),
    `Kur’an hatları: ${ids.length} seçenek, yazı dosyaları ve lisans yerinde`);
  ok(quranFont(undefined).id === 'madina' && quranFont('yok').id === 'madina' && quranFont('system').id === 'system', 'Kur’an hatları: seçilmediyse Medine Mushafı, cihaz yazısı yalnız seçilince');
  ok(ayahMark(quranFont('madina'), 286) === '\u06DD٢٨٦' && ayahMark(quranFont('amiri'), 7) === '\uFD3F٧\uFD3E', 'Kur’an hatları: âyet sonu Medine hattında ۝, diğerlerinde ﴿﴾');
  ok(lineFor(quranFont('amiri'), 24, 40) === 60 && lineFor(quranFont('system'), 24, 40) === 40 && QURAN_FONTS.every((f) => f.id === 'system' || f.minLine >= 1.45),
    'Kur’an hatları: satır yüksekliği yazının doğal yüksekliğinden kısa olmaz');
}

// ── Mushaf sayfaları ──
{
  ok(PAGE_START.length === 604 && PAGE_START[0] === 1 && PAGE_START.every((x, i) => i === 0 || x > PAGE_START[i - 1]) && PAGE_START[603] <= 6236, 'sayfalar: 604 sayfa başı, sıralı');
  ok(pageOf(1, 1) === 1 && pageOf(2, 1) === 2 && pageOf(2, 142) === 22 && pageOf(18, 45) === 298 && pageOf(78, 1) === 582 && pageOf(112, 1) === 604 && pageOf(114, 6) === 604,
    'sayfalar: bilinen sayfalar (Bakara 1 = 2, Bakara 142 = 22, Nebe 1 = 582, Nâs = 604)');
  ok(JUZ_STARTS.map(([s2, a2]) => pageOf(s2, a2)).join() === '1,22,42,62,82,102,121,142,162,182,201,222,242,262,282,302,322,342,362,382,402,422,442,462,482,502,522,542,562,582',
    'sayfalar: cüz başlarının sayfaları Medine düzeninde');
  ok(juzOf(2, 141) === 1 && juzOf(2, 142) === 2 && juzOf(114, 6) === 30 && juzOf(1, 1) === 1, 'sayfalar: âyetin cüzü');
}

// ── Namaz takibi küçük uygulaması ──
{
  const lp = buildLogWidgetProps({ title: 'Bugünkü namazlarım', names: ['Sabah', 'Öğle', 'İkindi', 'Akşam', 'Yatsı'], allDone: 'Beş vakit tamam', empty: '-', palette: 'zumrut', mode: 'system',
    log: { '2026-11-27': 3, '2026-11-26': 31, '2026-11-01': 31 }, today: new Date(2026, 10, 27, 9) });
  ok(lp.days?.map((d) => `${d.k}:${d.m}`).join() === '2026-11-27:3,2026-11-26:31,2026-11-25:0' && lp.names?.length === 5 && !!lp.light?.accent && lp.dark?.bg !== lp.light?.bg,
    'takip kutusu: son üç gün, beş ad, palet renkleri');
}

// ── Bildirimdeki "Kıldım" (uygulama içi dinleyici ve Android arka plan görevi) ──
{
  const req = (content: object) => ({ actionIdentifier: PRAYED_ACTION, notification: { date: 1, request: { identifier: 'at-maghrib-1', content } } });
  const fg = prayedFromResponse(req({ data: { kind: 'adhan', type: 'at', prayer: 'maghrib', day: '2026-11-27' } }));
  ok(fg?.id === 'at-maghrib-1' && fg.day === '2026-11-27' && fg.prayer === 'maghrib', 'kıldım: dinleyici yanıtı (content.data) okunur');
  const bg = prayedFromResponse(req({ dataString: JSON.stringify({ kind: 'adhan', prayer: 'fajr', day: '2026-11-28' }) }));
  ok(bg?.prayer === 'fajr' && bg.day === '2026-11-28', 'kıldım: arka plan yanıtı (content.dataString) okunur');
  const bgEmpty = prayedFromResponse(req({ data: {}, dataString: JSON.stringify({ prayer: 'isha', day: '2026-11-28' }) }));
  ok(bgEmpty?.prayer === 'isha', 'kıldım: boş data yerine dataString');
  const test = prayedFromResponse(req({ data: { kind: 'adhan', type: 'at', test: true } }));
  ok(test?.id === 'at-maghrib-1' && test.day === null && test.prayer === null, 'kıldım: deneme bildirimi yalnız kapatılır');
  ok(prayedFromResponse(req({ data: { prayer: 'sunrise', day: '2026-11-27' } }))?.prayer === null, 'kıldım: güneş vakti işlenmez');
  ok(prayedFromResponse(req({ data: { prayer: 'asr', day: '27.11.2026' } }))?.day === null, 'kıldım: bozuk gün işlenmez');
  ok(prayedFromResponse(req({ dataString: '{bozuk' }))?.prayer === null, 'kıldım: bozuk JSON çökertmez');
  ok(prayedFromResponse({ ...req({ data: {} }), actionIdentifier: 'expo.modules.notifications.actions.DEFAULT' }) === null
    && prayedFromResponse(null) === null && prayedFromResponse({ actionIdentifier: PRAYED_ACTION, notification: null }) === null,
    'kıldım: başka düğme ve eksik yanıt yok sayılır');
}

// ── Ortak metinler: her anahtarın üç dilde karşılığı var (eksik Arapça anahtar İngilizceye düşüyordu) ──
{
  const trKeys = Object.keys(DICTS.tr);
  const miss = (l: 'en' | 'ar') => trKeys.filter((k) => !(DICTS[l] as Record<string, string | undefined>)[k]?.trim());
  ok(miss('en').length === 0 && miss('ar').length === 0, `sözlük: en ve ar eksiksiz (eksik: ${[...miss('en'), ...miss('ar')].slice(0, 5).join(', ') || 'yok'})`);
  const vars = (x?: string) => (x?.match(/\{\w+\}/g) ?? []).sort().join();
  const bad = trKeys.filter((k) => vars(DICTS.tr[k as keyof typeof DICTS.tr]) !== vars(DICTS.ar[k as keyof typeof DICTS.ar]) || vars(DICTS.tr[k as keyof typeof DICTS.tr]) !== vars(DICTS.en[k as keyof typeof DICTS.en]));
  ok(bad.length === 0, `sözlük: {değişken}ler üç dilde aynı (farklı: ${bad.slice(0, 5).join(', ') || 'yok'})`);
}

// ── Mushaf sayfaları (sayfa sayfa okuma) ──
{
  const key = (x: [number, number]) => x.join(':');
  const p1 = pageAyahs(1);
  const p2 = pageAyahs(2);
  const p604 = pageAyahs(604);
  ok(p1.length === 7 && key(p1[0]) === '1:1' && key(p1[6]) === '1:7', 'mushaf: 1. sayfa Fâtiha 1–7');
  ok(key(p2[0]) === '2:1' && key(p2[p2.length - 1]) === '2:5', `mushaf: 2. sayfa Bakara 1–5 (${key(p2[p2.length - 1])})`);
  ok(key(p604[0]) === '112:1' && key(p604[p604.length - 1]) === '114:6' && p604.length === 15, 'mushaf: 604. sayfa İhlâs, Felak, Nâs');
  let total = 0;
  let order = true;
  let prev = 0;
  for (let p = 1; p <= 604; p++) {
    const [g0, g1] = pageGlobalRange(p);
    if (g0 !== prev + 1 || g1 < g0) order = false;
    prev = g1;
    total += pageAyahs(p).length;
  }
  ok(order && prev === 6236 && total === 6236, 'mushaf: 604 sayfa boşluksuz, 6236 âyet');
  ok(key(fromGlobalAyah(8)) === '2:1' && key(fromGlobalAyah(6236)) === '114:6' && pageAyahs(pageOf(18, 10)).some((x) => key(x) === '18:10'),
    'mushaf: genel numara → sûre:âyet; âyetin sayfası onu içerir');
}

// ── Besmele ayırma (sûre ve sayfa uçları; hareke sırasından bağımsız) ──
{
  const alm = 'الٓمٓ';
  const b1 = 'بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ';
  // Aynı besmele: şedde ile fetha ters sırada, tatvilli rahmân ve başta BOM
  const b2 = '\uFEFFبِسْمِ ٱللَّهِ ٱلر\u064E\u0651حْمَـٰنِ ٱلر\u064E\u0651حِيمِ';
  ok(stripBasmala(2, 1, `${b1} ${alm}`) === alm && stripBasmala(2, 1, `${b2}  ${alm}`) === alm, 'besmele: 1. âyetin başındaki besmele ayrılır (hareke sırası, tatvil, BOM fark etmez)');
  ok(stripBasmala(1, 1, b1) === b1 && stripBasmala(9, 1, 'بَرَآءَةٌ مِّنَ ٱللَّهِ') === 'بَرَآءَةٌ مِّنَ ٱللَّهِ' && stripBasmala(2, 2, `${b1} ${alm}`) === `${b1} ${alm}`,
    'besmele: Fâtiha, Tevbe ve 2. âyet dokunulmaz');
  const neml30 = 'إِنَّهُۥ مِن سُلَيْمَٰنَ وَإِنَّهُۥ بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ';
  ok(stripBasmala(27, 30, neml30) === neml30, 'besmele: Neml 30 (âyet içindeki besmele) bozulmaz');
}

mosqueChecks().then(transitChecks).then(() => process.exit(fails ? 1 : 0));
