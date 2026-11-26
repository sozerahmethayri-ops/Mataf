// Ulaşım: dünya genelinde yer arama, yürüme/araç rotası ve toplu taşıma.
// Saf TypeScript (React Native'e bağlı değil) — scripts/check-logic.ts sahte yanıtlarla test eder.
//
// Kaynaklar ve koşullar:
//  • Yer arama: Photon (photon.komoot.io, OpenStreetMap) — makul kullanım; yoğun kullanımda kendi sunucunuz.
//  • Yürüme / araç: FOSSGIS OSRM (routing.openstreetmap.de) — OpenStreetMap, ODbL.
//  • Toplu taşıma: Transitous (api.transitous.org, MOTIS 2; /api/v5). Koşullar: açık kaynak (MATAF: MIT) + ticari olmayan proje,
//    her istekte uygulama adı/sürümü/iletişim içeren User-Agent, transitous.org/sources bağlantısı,
//    günde ~720 /plan isteğini aşmamak. Bu yüzden yalnız EXPO_PUBLIC_TRANSITOUS_CONTACT tanımlıysa açılır;
//    değilse metro/otobüs tarifi telefonun harita uygulamasında (Google/Apple) açılır.

export type LatLng = { lat: number; lng: number };
export type Fetcher = (url: string, init?: { headers?: Record<string, string>; signal?: AbortSignal }) => Promise<{ ok: boolean; status: number; json: () => Promise<unknown> }>;

/** `local`: yerel dildeki ad (ör. المسجد الحرام) — şoföre gösterilen kartta en büyük yazı. */
export type Place = { id: string; name: string; sub: string; lat: number; lng: number; kind?: string; local?: string };

// ── Yer arama (Photon) ──
type PhotonFeature = { geometry: { coordinates: [number, number] }; properties: Record<string, string | number | undefined> };
export function parsePhoton(json: { features?: PhotonFeature[] }): Place[] {
  const out: Place[] = [];
  for (const f of json.features ?? []) {
    const p = f.properties;
    const [lng, lat] = f.geometry?.coordinates ?? [];
    if (lat == null || lng == null) continue;
    const street = [p.street, p.housenumber].filter(Boolean).join(' ');
    const name = String(p.name ?? street ?? '') || street || String(p.city ?? '');
    if (!name) continue;
    const sub = [p.name ? street : '', p.district, p.city, p.state, p.country].filter((x) => x && x !== name).join(', ');
    out.push({ id: `${p.osm_type ?? ''}${p.osm_id ?? out.length}`, name, sub, lat, lng, kind: p.osm_value ? String(p.osm_value) : undefined });
  }
  return out;
}
export function photonUrl(q: string, near: LatLng | null, lang: string) {
  const l = ['en', 'de', 'fr', 'it'].includes(lang) ? `&lang=${lang}` : ''; // diğer dillerde yerel ad döner
  const bias = near ? `&lat=${near.lat.toFixed(4)}&lon=${near.lng.toFixed(4)}` : '';
  return `https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&limit=8${bias}${l}`;
}

export const photonReverseUrl = (p: LatLng) => `https://photon.komoot.io/reverse?lat=${p.lat.toFixed(6)}&lon=${p.lng.toFixed(6)}&limit=1`;
export const placeLine = (p: Place) => [p.name, p.sub].filter(Boolean).join(', ');

/** Kuş uçuşu mesafe (m). */
export function meters(a: LatLng, b: LatLng) {
  const R = 6371000;
  const r = Math.PI / 180;
  const dLat = (b.lat - a.lat) * r;
  const dLng = (b.lng - a.lng) * r;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}
/** Rota sunucusuna ulaşılamazsa kaba tahmin: yollar kuş uçuşundan ~%30 uzun. */
export function roughRoute(from: LatLng, to: LatLng, mode: 'foot' | 'car'): StreetRoute {
  const m = meters(from, to) * 1.3;
  return { coords: [from, to], meters: m, seconds: mode === 'foot' ? m / 1.25 : m / 8.3 + 120, approximate: true };
}

// ── Yürüme / araç (OSRM) ──
export type StreetRoute = { coords: LatLng[]; meters: number; seconds: number; approximate: boolean };
export function osrmUrl(from: LatLng, to: LatLng, profile: 'foot' | 'car') {
  return `https://routing.openstreetmap.de/routed-${profile}/route/v1/driving/${from.lng},${from.lat};${to.lng},${to.lat}?overview=full&geometries=geojson`;
}
export function parseOsrm(json: { routes?: { distance: number; duration: number; geometry: { coordinates: [number, number][] } }[] }): StreetRoute | null {
  const r = json.routes?.[0];
  if (!r) return null;
  return { coords: r.geometry.coordinates.map(([lng, lat]) => ({ lat, lng })), meters: r.distance, seconds: r.duration, approximate: false };
}

// ── Toplu taşıma (Transitous / MOTIS 2) ──
export type LegKind = 'walk' | 'bus' | 'metro' | 'tram' | 'train' | 'ferry' | 'other';
export type TransitLeg = {
  kind: LegKind; mode: string; line: string; headsign?: string; agency?: string;
  from: { name: string; time: string }; to: { name: string; time: string };
  minutes: number; stops: number; meters?: number; color?: string; textColor?: string; coords: LatLng[];
};
export type Itinerary = {
  minutes: number; start: string; end: string; transfers: number; legs: TransitLeg[];
  /** Sefer saati yok, süre yaklaşık (çevrimdışı raylı sistem tarifi) */
  approx?: boolean;
  source?: 'osm' | 'transitous';
};

export function legKind(mode: string): LegKind {
  const m = mode.toUpperCase();
  if (m === 'WALK') return 'walk';
  if (m === 'BUS' || m === 'COACH') return 'bus';
  if (m === 'SUBWAY' || m === 'METRO') return 'metro';
  if (m === 'TRAM' || m === 'CABLE_CAR' || m === 'FUNICULAR') return 'tram';
  if (['RAIL', 'SUBURBAN', 'REGIONAL_RAIL', 'REGIONAL_FAST_RAIL', 'HIGHSPEED_RAIL', 'LONG_DISTANCE', 'NIGHT_RAIL'].includes(m)) return 'train';
  if (m === 'FERRY') return 'ferry';
  return 'other';
}

/** Google kodlu çoklu çizgi çözücü (MOTIS: precision 6 ya da 7). */
export function decodePolyline(str: string, precision = 6): LatLng[] {
  const f = 10 ** precision;
  const out: LatLng[] = [];
  let i = 0, lat = 0, lng = 0;
  while (i < str.length) {
    for (const which of [0, 1]) {
      let shift = 0, result = 0, b: number;
      do { b = str.charCodeAt(i++) - 63; result |= (b & 0x1f) << shift; shift += 5; } while (b >= 0x20 && i < str.length + 1);
      const d = result & 1 ? ~(result >> 1) : result >> 1;
      if (which === 0) lat += d; else lng += d;
    }
    out.push({ lat: lat / f, lng: lng / f });
  }
  return out;
}

type MotisPlace = { name: string; lat: number; lon: number };
type MotisLeg = {
  mode: string; startTime: string; endTime: string; duration: number; from: MotisPlace; to: MotisPlace;
  routeShortName?: string; displayName?: string; headsign?: string; agencyName?: string; routeColor?: string; routeTextColor?: string;
  distance?: number; intermediateStops?: unknown[]; legGeometry?: { points: string; precision: number };
};
type MotisItin = { duration: number; startTime: string; endTime: string; transfers: number; legs: MotisLeg[] };

export function parseMotis(json: { itineraries?: MotisItin[] }): Itinerary[] {
  const hex = (c?: string) => (c && /^[0-9a-f]{6}$/i.test(c) ? `#${c}` : undefined);
  return (json.itineraries ?? []).map((it) => ({
    minutes: Math.round(it.duration / 60),
    start: it.startTime,
    end: it.endTime,
    transfers: it.transfers,
    legs: it.legs.map((l) => ({
      kind: legKind(l.mode), mode: l.mode,
      line: l.routeShortName || l.displayName || '',
      headsign: l.headsign, agency: l.agencyName,
      from: { name: l.from.name, time: l.startTime }, to: { name: l.to.name, time: l.endTime },
      minutes: Math.max(1, Math.round(l.duration / 60)),
      stops: l.intermediateStops?.length ?? 0,
      meters: l.distance,
      color: hex(l.routeColor), textColor: hex(l.routeTextColor),
      coords: l.legGeometry ? decodePolyline(l.legGeometry.points, l.legGeometry.precision) : [{ lat: l.from.lat, lng: l.from.lon }, { lat: l.to.lat, lng: l.to.lon }],
    })),
  }));
}

export const TRANSITOUS = 'https://api.transitous.org';
export function transitUrl(from: LatLng, to: LatLng, time: Date, lang: string) {
  const p = (x: LatLng) => `${x.lat.toFixed(6)},${x.lng.toFixed(6)}`;
  return `${TRANSITOUS}/api/v5/plan?fromPlace=${p(from)}&toPlace=${p(to)}&time=${encodeURIComponent(time.toISOString())}&language=${lang}&detailedTransfers=false`;
}
export const transitUserAgent = (version: string, contact: string) => `MATAF/${version} (${contact})`;

export async function planTransit(from: LatLng, to: LatLng, opts: { time?: Date; lang: string; contact: string; version: string; fetcher?: Fetcher; timeoutMs?: number }): Promise<Itinerary[]> {
  const fetcher = opts.fetcher ?? (fetch as unknown as Fetcher);
  const ctrl = typeof AbortController !== 'undefined' ? new AbortController() : undefined;
  const timer = setTimeout(() => ctrl?.abort(), opts.timeoutMs ?? 15000);
  try {
    const res = await fetcher(transitUrl(from, to, opts.time ?? new Date(), opts.lang), {
      headers: { 'User-Agent': transitUserAgent(opts.version, opts.contact), Accept: 'application/json' }, signal: ctrl?.signal,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return parseMotis((await res.json()) as { itineraries?: MotisItin[] });
  } finally {
    clearTimeout(timer);
  }
}

// ── Telefonun harita / taksi uygulamaları ──
export type Travel = 'walk' | 'transit' | 'car';
export function mapsUrl(to: LatLng, mode: Travel, platform: string, from?: LatLng) {
  if (platform === 'ios') {
    const flg = mode === 'walk' ? 'w' : mode === 'transit' ? 'r' : 'd';
    return `http://maps.apple.com/?${from ? `saddr=${from.lat},${from.lng}&` : ''}daddr=${to.lat},${to.lng}&dirflg=${flg}`;
  }
  const tm = mode === 'walk' ? 'walking' : mode === 'transit' ? 'transit' : 'driving';
  return `https://www.google.com/maps/dir/?api=1${from ? `&origin=${from.lat},${from.lng}` : ''}&destination=${to.lat},${to.lng}&travelmode=${tm}`;
}
/** Uber evrensel bağlantısı (uygulama yoksa web'de açılır). */
export function uberUrl(to: LatLng, name: string) {
  return `https://m.uber.com/ul/?action=setPickup&pickup=my_location&dropoff[latitude]=${to.lat}&dropoff[longitude]=${to.lng}&dropoff[nickname]=${encodeURIComponent(name)}`;
}
export const shareText = (here: LatLng, address: string) =>
  `${address ? `${address}\n` : ''}https://www.google.com/maps/search/?api=1&query=${here.lat.toFixed(6)},${here.lng.toFixed(6)}`;

export const fmtMinutes = (min: number, lang: string) => {
  const h = Math.floor(min / 60);
  const m = min % 60;
  const u = lang === 'en' ? ['h', 'min'] : lang === 'ar' ? ['س', 'د'] : ['sa', 'dk'];
  return h ? `${h} ${u[0]} ${m} ${u[1]}` : `${m} ${u[1]}`;
};
