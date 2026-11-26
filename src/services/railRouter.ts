// Çevrimdışı raylı sistem tarifi (şimdilik İstanbul): metro, tramvay, Marmaray ve füniküler.
// Veri: src/data/istanbulRail.json (OpenStreetMap, scripts/ist_rail.py). Sefer saati yok; süreler ortalama
// hız ve bekleme süresinden yaklaşık hesaplanır. Yöntem RAPTOR benzeri tur taraması: her turda bir binişe
// daha izin verilir, istasyonlar arası yürüyerek aktarma yapılabilir. Saf TypeScript, testlerde de çalışır.
import type { Itinerary, LatLng, LegKind, TransitLeg } from './transport';

type Mode = 'metro' | 'tram' | 'train' | 'funicular';
export type RailData = { v: number; src: string; s: [string, number, number][]; l: { r: string; m: Mode; c: string; p: number[][] }[] };

// Ortalama hız (km/sa, duraklar dahil değil), ortalama bekleme (dk; sefer aralığının yarısı)
const MODE: Record<Mode, { kmh: number; wait: number; kind: LegKind }> = {
  metro: { kmh: 36, wait: 2.5, kind: 'metro' },
  tram: { kmh: 18, wait: 3.5, kind: 'tram' },
  train: { kmh: 48, wait: 5, kind: 'train' },
  funicular: { kmh: 12, wait: 2.5, kind: 'tram' },
};
// Hatta özel ortalama hız (km/sa): M11 hızlı metro, Marmaray banliyö treni
const LINE_KMH: Record<string, number> = { M11: 68, B1: 52, B2: 45, M1A: 34, M1B: 34, T6: 35, F1: 10, F4: 10, F3: 20 };
const DWELL = 0.5; // durak başına dk
const WALK_M_PER_MIN = 72; // 1,2 m/sn
const DETOUR = 1.3; // kuş uçuşu → yürüme yolu
const ACCESS_M = 2200;
const TRANSFER_M = 650;
const TRANSFER_PENALTY = 2;
const MAX_RIDES = 4;

const R = Math.PI / 180;
function meters(a: LatLng, b: LatLng) {
  const x = (b.lng - a.lng) * R * Math.cos(((a.lat + b.lat) / 2) * R);
  const y = (b.lat - a.lat) * R;
  return 6371000 * Math.hypot(x, y);
}
export const walkMinutes = (m: number) => (m * DETOUR) / WALK_M_PER_MIN;

type Pattern = { line: number; stops: number[]; cum: number[]; wait: number };
export type RailNet = {
  data: RailData;
  pos: LatLng[];
  patterns: Pattern[];
  foot: { to: number; min: number }[][];
};

/** Ağı hazırla: yönler (desenler), birikimli yolculuk süreleri, yürüyerek aktarma komşulukları. */
export function railNetwork(data: RailData): RailNet {
  const pos = data.s.map(([, lat, lng]) => ({ lat, lng }));
  const patterns: Pattern[] = [];
  data.l.forEach((ln, li) => {
    const md = MODE[ln.m];
    const kmh = LINE_KMH[ln.r] ?? md.kmh;
    for (const stops of ln.p) {
      const cum = [0];
      for (let i = 1; i < stops.length; i++) cum.push(cum[i - 1] + (meters(pos[stops[i - 1]], pos[stops[i]]) / 1000 / kmh) * 60 + DWELL);
      patterns.push({ line: li, stops, cum, wait: md.wait });
    }
  });
  const foot = pos.map((p, i) => {
    const out: { to: number; min: number }[] = [];
    pos.forEach((q, j) => {
      if (i === j) return;
      const d = meters(p, q);
      if (d <= TRANSFER_M) out.push({ to: j, min: walkMinutes(d) + TRANSFER_PENALTY });
    });
    return out;
  });
  return { data, pos, patterns, foot };
}

/** Ağın kapsadığı yerde mi (en yakın istasyon erişim mesafesi içinde)? */
export function nearestStation(net: RailNet, p: LatLng) {
  let best = -1, bd = Infinity;
  net.pos.forEach((q, i) => {
    const d = meters(p, q);
    if (d < bd) { bd = d; best = i; }
  });
  return { index: best, meters: bd };
}

type Ride = { pat: number; from: number; to: number };
type Foot = { from: number };

export type RailResult = { itineraries: Itinerary[]; walkOnly: number };

/** İki nokta arası raylı sistem tarifleri (en çok 3, en hızlıdan). walkOnly: doğrudan yürüme süresi (dk). */
export function planRail(net: RailNet, from: LatLng, to: LatLng, now = new Date()): RailResult {
  const n = net.pos.length;
  const direct = walkMinutes(meters(from, to));
  const access = net.pos.map((p, i) => ({ i, d: meters(from, p) })).filter((x) => x.d <= ACCESS_M).sort((a, b) => a.d - b.d).slice(0, 12);
  const egress = net.pos.map((p, i) => ({ i, d: meters(p, to) })).filter((x) => x.d <= ACCESS_M).sort((a, b) => a.d - b.d).slice(0, 12);
  if (!access.length || !egress.length) return { itineraries: [], walkOnly: direct };

  const arr: number[][] = [new Array(n).fill(Infinity)];
  const rideP: (Ride | undefined)[][] = [[]];
  const footP: (Foot | undefined)[][] = [[]];
  for (const a of access) arr[0][a.i] = walkMinutes(a.d);

  for (let k = 1; k <= MAX_RIDES; k++) {
    // Bu turda binilebilecek istasyonlar: bir önceki turda (tam k−1 binişle) varılanlar
    const prev = arr[k - 1];
    const rides: (Ride | undefined)[] = new Array(n);
    const rideArr = new Array(n).fill(Infinity);
    net.patterns.forEach((p, pi) => {
      let board = -1, boardT = Infinity;
      for (let i = 0; i < p.stops.length; i++) {
        const s = p.stops[i];
        if (board >= 0) {
          const t = boardT + p.cum[i] - p.cum[board];
          if (t < rideArr[s]) { rideArr[s] = t; rides[s] = { pat: pi, from: board, to: i }; }
        }
        const tb = prev[s] + p.wait + (k > 1 ? TRANSFER_PENALTY : 0);
        if (prev[s] < Infinity && (board < 0 || tb < boardT + p.cum[i] - p.cum[board])) { board = i; boardT = tb; }
      }
    });
    const foot: (Foot | undefined)[] = new Array(n);
    const best = new Array(n).fill(Infinity);
    for (let s = 0; s < n; s++) best[s] = rideArr[s];
    for (let s = 0; s < n; s++) {
      if (rideArr[s] === Infinity) continue;
      for (const f of net.foot[s]) {
        const t = rideArr[s] + f.min;
        if (t < best[f.to] && t < rideArr[f.to]) { best[f.to] = t; foot[f.to] = { from: s }; }
      }
    }
    arr.push(best);
    rideP.push(rides);
    footP.push(foot);
  }

  // Her biniş sayısı için en iyi bitiş
  const cands: { k: number; e: number; total: number }[] = [];
  for (let k = 1; k <= MAX_RIDES; k++) {
    let bestE = -1, bestT = Infinity;
    for (const e of egress) {
      const t = arr[k][e.i] + walkMinutes(e.d);
      if (t < bestT) { bestT = t; bestE = e.i; }
    }
    if (bestE >= 0 && bestT < Infinity) cands.push({ k, e: bestE, total: bestT });
  }
  // Daha çok aktarma ancak belirgin biçimde hızlıysa
  const chosen: typeof cands = [];
  for (const c of cands) {
    const fewer = chosen.length ? chosen[chosen.length - 1] : null;
    if (!fewer || c.total < fewer.total - 4) chosen.push(c);
  }
  const itins = chosen
    .filter((c) => c.total < direct - 5) // toplu taşıma en az 5 dk kazandırmıyorsa yürümek önerilir
    .map((c) => build(net, c.k, c.e, from, to, arr, rideP, footP, now))
    .filter((x): x is Itinerary => !!x)
    .sort((a, b) => a.minutes - b.minutes);
  // En iyisinden çok uzun süren seçenekleri gösterme (aktarmasız ama 40 dk yürümeli gibi)
  const top = itins.length ? itins[0].minutes : 0;
  return { itineraries: itins.filter((it) => it.minutes <= top * 1.35 + 5).slice(0, 3), walkOnly: direct };
}

function build(net: RailNet, k: number, e: number, from: LatLng, to: LatLng, arr: number[][],
  rideP: (Ride | undefined)[][], footP: (Foot | undefined)[][], now: Date): Itinerary | null {
  type Seg = { kind: 'walk'; a: number | 'from'; b: number | 'to' } | { kind: 'ride'; pat: number; from: number; to: number };
  const segs: Seg[] = [{ kind: 'walk', a: e, b: 'to' }];
  let cur = e;
  for (let r = k; r >= 1; r--) {
    const f = footP[r][cur];
    if (f && arr[r][cur] < Infinity) {
      // bu turda yürüyerek gelindiyse önce yürüme, sonra biniş
      segs.unshift({ kind: 'walk', a: f.from, b: cur });
      cur = f.from;
    }
    const ride = rideP[r][cur];
    if (!ride) {
      // bu turda biniş yok: önceki turdan aynen gelmiş (daha az binişle)
      continue;
    }
    segs.unshift({ kind: 'ride', pat: ride.pat, from: ride.from, to: ride.to });
    cur = net.patterns[ride.pat].stops[ride.from];
  }
  segs.unshift({ kind: 'walk', a: 'from', b: cur });

  const names = net.data.s;
  const pt = (x: number | 'from' | 'to') => (x === 'from' ? from : x === 'to' ? to : net.pos[x]);
  const nm = (x: number | 'from' | 'to') => (x === 'from' || x === 'to' ? '' : names[x][0]);
  let t = 0;
  const iso = (min: number) => new Date(now.getTime() + min * 60e3).toISOString();
  const legs: TransitLeg[] = [];
  let rides = 0;
  for (const sg of segs) {
    if (sg.kind === 'walk') {
      const a = pt(sg.a), b = pt(sg.b);
      const m = meters(a, b);
      if (m < 30) continue;
      const min = walkMinutes(m);
      const prev = legs[legs.length - 1];
      if (prev && prev.kind === 'walk') {
        // art arda yürümeleri birleştir
        prev.minutes = Math.max(1, Math.round(prev.minutes + min));
        prev.meters = (prev.meters ?? 0) + m;
        prev.to = { name: nm(sg.b), time: iso(t + min) };
        prev.coords.push(b);
      } else {
        legs.push({ kind: 'walk', mode: 'WALK', line: '', from: { name: nm(sg.a), time: iso(t) }, to: { name: nm(sg.b), time: iso(t + min) }, minutes: Math.max(1, Math.round(min)), stops: 0, meters: m, coords: [a, b] });
      }
      t += min;
    } else {
      const p = net.patterns[sg.pat];
      const ln = net.data.l[p.line];
      const md = MODE[ln.m];
      const wait = p.wait + (rides > 0 ? TRANSFER_PENALTY : 0);
      t += wait;
      const ride = p.cum[sg.to] - p.cum[sg.from];
      const stops = p.stops.slice(sg.from, sg.to + 1);
      legs.push({
        kind: md.kind, mode: ln.m.toUpperCase(), line: ln.r, headsign: names[p.stops[p.stops.length - 1]][0],
        from: { name: names[stops[0]][0], time: iso(t) }, to: { name: names[stops[stops.length - 1]][0], time: iso(t + ride) },
        minutes: Math.max(1, Math.round(ride)), stops: stops.length - 2, color: ln.c, textColor: textOn(ln.c),
        coords: stops.map((s) => net.pos[s]),
      });
      t += ride;
      rides++;
    }
  }
  if (!rides) return null;
  return { minutes: Math.round(t), start: iso(0), end: iso(t), transfers: rides - 1, legs, approx: true, source: 'osm' };
}

/** Hat rengi üstünde okunur yazı rengi. */
export function textOn(hex: string) {
  const v = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  const lum = 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2];
  return lum > 0.4 ? '#1D1D1F' : '#FFFFFF';
}

/** İstanbul ağının yaklaşık sınırı (raylı sistem tarifi yalnız burada denenir). */
export const inIstanbul = (p: LatLng) => p.lat > 40.78 && p.lat < 41.35 && p.lng > 28.35 && p.lng < 29.55;
