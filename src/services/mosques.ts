// En yakın cami / mescit: dünyanın her yerinde OpenStreetMap verisiyle.
// Lisans: © OpenStreetMap katkıcıları, ODbL — ekranda atıf gösterilir.
// Önce Photon (hızlı, kararlı): yakındaki ibadet yerleri + "cami/mosque/moschee/مسجد" adlı yerler; kilise vb.
// adlar elenir. Photon yanıt vermezse Overpass sunucuları (ve aynası) sırayla denenir.
// Yarıçap kademeli büyür (1,5 → 60 km); son başarılı sonuç cihazda saklanır (internet yokken gösterilir).
// Bu dosya saf TypeScript'tir (React Native'e bağlı değil); testler doğrudan çalıştırır.
// Cihazda saklama için `src/services/mosqueStore.ts` kullanılır.

export type LatLng = { lat: number; lng: number };
export type MosqueKind = 'mosque' | 'musalla' | 'multifaith';
export type Mosque = {
  id: string;
  name: string; // boş olabilir (isimsiz)
  kind: MosqueKind;
  lat: number;
  lng: number;
  dist: number; // m, kuş uçuşu
  bearing: number; // ° (kuzey = 0, saat yönü)
  wheelchair?: boolean;
  hours?: string;
  women?: boolean;
  denomination?: string;
};

export const OVERPASS_ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://overpass.private.coffee/api/interpreter',
];
export const PHOTON = 'https://photon.komoot.io';
export const UA = 'MATAF/0.6 (Android; https://github.com/sozerahmethayri-ops/Mataf)';
const ua = (): Record<string, string> => (typeof navigator !== 'undefined' && navigator.product === 'ReactNative' ? { 'User-Agent': UA } : {});

/** Adından cami olduğu anlaşılanlar (birçok dilde). */
export const MOSQUE_NAME = /(cami|mescid|mescit|mosque|masjid|masjed|mesjid|moschee|mosqu[eé]e|mezquita|moskee|moskeija|meczet|me[cč]et|d[žz]amija|jami|jamia|jama'?at|musall?a|mussal+ah|namazg[aâ]h|islamic cent|islamisch|islamique|islamitisch|tekke|dergah|مسجد|جامع|مصلى|مصلّى)/i;
/** Başka dinlere ait ibadet yerleri (ada göre elenir). */
export const NOT_MOSQUE = /(church|kilise|chapel|şapel|kapelle|kapel|cathedral|katedral|kathedrale|dom |dómkirkj|synagog|sinagog|havra|temple|tapınak|kirche|[ée]glise|iglesia|chiesa|ko[śs]ci[óo]ł|cerkiew|monastery|manast[ıi]r|kloster|gurdwara|mandir|pagoda|kingdom hall|cemevi|ermita|basilic|bazilik|parish|abbey|chappel|kirkj|templo|igreja|kerk|kyrka|kirke)/i;
export const RADII = [1500, 4000, 10000, 25000, 60000];

const R = 6371000;
const rad = (d: number) => (d * Math.PI) / 180;
export function distanceM(a: LatLng, b: LatLng) {
  const s = Math.sin(rad(b.lat - a.lat) / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(rad(b.lng - a.lng) / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}
/** a'dan b'ye ilk yön (pusula açısı). */
export function bearingDeg(a: LatLng, b: LatLng) {
  const y = Math.sin(rad(b.lng - a.lng)) * Math.cos(rad(b.lat));
  const x = Math.cos(rad(a.lat)) * Math.sin(rad(b.lat)) - Math.sin(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.cos(rad(b.lng - a.lng));
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

export function buildQuery(o: LatLng, radius: number) {
  const a = `(around:${Math.round(radius)},${o.lat.toFixed(6)},${o.lng.toFixed(6)})`;
  return `[out:json][timeout:20];(
nwr["amenity"="place_of_worship"]["religion"="muslim"]${a};
nwr["building"="mosque"]${a};
nwr["amenity"="place_of_worship"]["religion"="multifaith"]${a};
);out center 300;`;
}

export type El = { type: string; id: number; lat?: number; lon?: number; center?: { lat: number; lon: number }; tags?: Record<string, string> };

/** Overpass yanıtını mesafeye göre sıralı listeye çevirir; aynı caminin nokta+bina kayıtlarını birleştirir. */
export function parseOverpass(json: { elements?: El[] }, o: LatLng, lang: 'tr' | 'en' | 'ar'): Mosque[] {
  const out: (Mosque & { raw: string })[] = [];
  for (const e of json.elements ?? []) {
    const t = e.tags ?? {};
    const lat = e.lat ?? e.center?.lat;
    const lng = e.lon ?? e.center?.lon;
    if (lat == null || lng == null) continue;
    // Başka dine ait bina etiketi (ör. kiliseye dönüştürülmüş eski cami) hariç
    if (t.religion && t.religion !== 'muslim' && t.religion !== 'multifaith') continue;
    if (t.disused === 'yes' || t['disused:amenity'] || t.abandoned === 'yes' || t.ruins === 'yes') continue;
    const pow = (t.place_of_worship ?? t['place_of_worship:type'] ?? '').toLowerCase();
    const kind: MosqueKind = t.religion === 'multifaith' ? 'multifaith' : /musalla|prayer_room|masjid_room|mescit/.test(pow) ? 'musalla' : 'mosque';
    const name = t[`name:${lang}`] ?? t.name ?? t['name:en'] ?? t['name:tr'] ?? t['name:ar'] ?? '';
    out.push({
      id: `${e.type}/${e.id}`, name, raw: t.name ?? '', kind, lat, lng,
      dist: distanceM(o, { lat, lng }), bearing: bearingDeg(o, { lat, lng }),
      wheelchair: t.wheelchair === 'yes' ? true : t.wheelchair === 'no' ? false : undefined,
      hours: t.opening_hours,
      women: t.female === 'yes' || t['women'] === 'yes' ? true : undefined,
      denomination: t.denomination,
    });
  }
  out.sort((a, b) => a.dist - b.dist);
  // Aynı caminin nokta + bina kayıtlarını birleştir: 40 m içindekiler ya da 80 m içinde
  // özgün adı aynı (veya biri isimsiz) olanlar tek cami sayılır.
  const keep: (Mosque & { raw: string })[] = [];
  for (const m of out) {
    const dup = keep.find((k) => {
      const d = distanceM(k, m);
      return d < 40 || (d < 80 && (k.raw === m.raw || !k.raw || !m.raw));
    });
    if (dup) {
      if (!dup.name && m.name) dup.name = m.name;
      dup.wheelchair ??= m.wheelchair;
      dup.hours ??= m.hours;
      continue;
    }
    keep.push(m);
  }
  return keep.map(({ raw: _raw, ...m }) => m);
}

export type Fetcher = (url: string, init: { method: string; headers: Record<string, string>; body?: string; signal?: AbortSignal }) => Promise<{ ok: boolean; status: number; json: () => Promise<unknown> }>;

type PhotonJson = { features?: { geometry?: { coordinates?: [number, number] }; properties?: Record<string, string | number | undefined> }[] };
type Cand = Mosque & { named: boolean; other: boolean };

/** Photon yanıtı → aday camiler (başka dinlerin ibadet yerleri elenir). */
export function parsePhotonMosques(json: PhotonJson, o: LatLng): Cand[] {
  const out: Cand[] = [];
  for (const f of json.features ?? []) {
    const p = f.properties ?? {};
    const [lng, lat] = f.geometry?.coordinates ?? [];
    if (lat == null || lng == null) continue;
    const name = String(p.name ?? '');
    const named = MOSQUE_NAME.test(name) || (p.osm_key === 'building' && p.osm_value === 'mosque');
    const other = !named && !!name && NOT_MOSQUE.test(` ${name} `);
    const kind: MosqueKind = /musall?a|mescit|mescid|مصلى|prayer/i.test(name) ? 'musalla' : 'mosque';
    out.push({ id: `${String(p.osm_type ?? 'N').toLowerCase()}/${p.osm_id ?? `${lat},${lng}`}`, name, kind, lat, lng, dist: distanceM(o, { lat, lng }), bearing: bearingDeg(o, { lat, lng }), named, other });
  }
  return out;
}

/** Adaylardan camileri seçer: adı cami olanlar her zaman; adsız/başka adlılar yalnız çoğunluğu cami olan bölgede. */
export function pickMosques(near: Cand[], named: Cand[], radiusM: number): Mosque[] {
  // Bölge: adı belli ibadet yerlerinin en az yarısı cami ise adsız/genel adlı yerler de cami sayılır
  const withName = near.filter((c) => c.name);
  const share = withName.length ? withName.filter((c) => c.named).length / withName.length : 0;
  const muslimArea = share >= 0.5;
  const all = [...near.filter((c) => !c.other && (c.named || muslimArea)), ...named.filter((c) => c.named)]
    .filter((c) => c.dist <= radiusM)
    .sort((a, b) => a.dist - b.dist);
  const keep: Cand[] = [];
  for (const m of all) {
    const dup = keep.find((k) => k.id === m.id || distanceM(k, m) < 40);
    if (dup) { if (!dup.name && m.name) dup.name = m.name; continue; }
    keep.push(m);
  }
  return keep.map(({ named: _n, other: _o, ...m }) => m);
}

async function getJson(fetcher: Fetcher, url: string, timeoutMs: number) {
  const ctrl = typeof AbortController !== 'undefined' ? new AbortController() : undefined;
  const timer = setTimeout(() => ctrl?.abort(), timeoutMs);
  try {
    const res = await fetcher(url, { method: 'GET', headers: { ...ua(), Accept: 'application/json' }, signal: ctrl?.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

const KEYWORDS = ['mosque', 'cami', 'moschee', 'مسجد'];

/** Photon ile arama: yakındaki ibadet yerleri (yarıçap başına) + anahtar kelimeli aramalar (bir kez). */
async function photonSearch(o: LatLng, fetcher: Fetcher, minCount: number, timeoutMs: number): Promise<{ mosques: Mosque[]; radius: number }> {
  const ll = `lat=${o.lat.toFixed(5)}&lon=${o.lng.toFixed(5)}`;
  const named = (await Promise.allSettled(KEYWORDS.map((q) => getJson(fetcher, `${PHOTON}/api/?q=${encodeURIComponent(q)}&${ll}&limit=40&osm_tag=amenity:place_of_worship&location_bias_scale=0.1&zoom=13`, timeoutMs))))
    .flatMap((r) => (r.status === 'fulfilled' ? parsePhotonMosques(r.value as PhotonJson, o) : []));
  let last: Mosque[] = [];
  let used = RADII[0];
  let anyOk = named.length > 0;
  for (const radius of RADII) {
    used = radius;
    let near: Cand[] = [];
    try {
      near = parsePhotonMosques(await getJson(fetcher, `${PHOTON}/reverse?${ll}&radius=${radius / 1000}&limit=50&osm_tag=amenity:place_of_worship&osm_tag=building:mosque`, timeoutMs) as PhotonJson, o);
      anyOk = true;
    } catch { /* anahtar kelimeli sonuçlarla devam */ }
    last = pickMosques(near, named, radius);
    if (last.length >= minCount) break;
  }
  if (!anyOk) throw new Error('photon unreachable');
  return { mosques: last, radius: used };
}

async function queryOnce(o: LatLng, radius: number, fetcher: Fetcher, timeoutMs: number) {
  let lastErr: unknown = new Error('no endpoint');
  for (const url of OVERPASS_ENDPOINTS) {
    const ctrl = typeof AbortController !== 'undefined' ? new AbortController() : undefined;
    const timer = setTimeout(() => ctrl?.abort(), timeoutMs);
    try {
      // Ayna sunucu yalnız GET kabul ediyor
      const get = url.includes('mail.ru');
      const q = encodeURIComponent(buildQuery(o, radius));
      const res = await fetcher(get ? `${url}?data=${q}` : url, get
        ? { method: 'GET', headers: ua(), signal: ctrl?.signal }
        : { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded', ...ua() }, body: `data=${q}`, signal: ctrl?.signal });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return (await res.json()) as { elements?: El[] };
    } catch (e) {
      lastErr = e; // sıradaki sunucuyu dene
    } finally {
      clearTimeout(timer);
    }
  }
  throw lastErr;
}

export type SearchResult = { mosques: Mosque[]; radius: number; origin: LatLng; at: number; offline?: boolean };
export type Cache = { get: () => Promise<string | null>; set: (v: string) => Promise<void> };

/**
 * En yakın camileri bulur. `minCount` kadar sonuç bulunana ya da en büyük yarıçapa gelinene kadar yarıçapı büyütür.
 * İnternet yoksa son başarılı aramayı (konuma göre mesafeleri yeniden hesaplayarak) döndürür.
 */
export async function findMosques(o: LatLng, lang: 'tr' | 'en' | 'ar', opts: { fetcher?: Fetcher; minCount?: number; timeoutMs?: number; cache?: Cache } = {}): Promise<SearchResult> {
  const fetcher = opts.fetcher ?? (fetch as unknown as Fetcher);
  const minCount = opts.minCount ?? 3;
  let found: Mosque[] = [];
  let used = RADII[0];
  try {
    try {
      const r = await photonSearch(o, fetcher, minCount, opts.timeoutMs ?? 9000);
      found = r.mosques;
      used = r.radius;
    } catch {
      // Photon'a ulaşılamadı: Overpass sunucuları
      for (const radius of RADII) {
        used = radius;
        found = parseOverpass(await queryOnce(o, radius, fetcher, opts.timeoutMs ?? 12000), o, lang);
        if (found.length >= minCount) break;
      }
    }
    const result: SearchResult = { mosques: found.slice(0, 40), radius: used, origin: o, at: Date.now() };
    opts.cache?.set(JSON.stringify(result)).catch(() => undefined);
    return result;
  } catch (e) {
    const raw = opts.cache ? await opts.cache.get().catch(() => null) : null;
    if (raw) {
      const last = JSON.parse(raw) as SearchResult;
      const mosques = last.mosques.map((m) => ({ ...m, dist: distanceM(o, m), bearing: bearingDeg(o, m) })).sort((a, b) => a.dist - b.dist);
      return { ...last, mosques, origin: o, offline: true };
    }
    throw e;
  }
}

/** Mesafeleri yeni konuma göre günceller (yürürken). */
export const relocate = (list: Mosque[], o: LatLng) =>
  list.map((m) => ({ ...m, dist: distanceM(o, m), bearing: bearingDeg(o, m) })).sort((a, b) => a.dist - b.dist);

/** Yürüme süresi tahmini (dk): kuş uçuşu × 1,3 sokak payı, 1,25 m/sn. */
export const walkMinutes = (m: number) => Math.max(1, Math.round((m * 1.3) / 1.25 / 60));

export function fmtDistance(m: number, lang: 'tr' | 'en' | 'ar') {
  if (m < 1000) return `${Math.round(m / 10) * 10} m`;
  const km = m / 1000;
  const s = km < 10 ? km.toFixed(1) : String(Math.round(km));
  return `${lang === 'tr' ? s.replace('.', ',') : s} km`;
}

/** Telefonun harita uygulamasında yürüyüş tarifi (Google Haritalar her yerde açılır). */
export function directionsUrl(to: LatLng, platform: string) {
  if (platform === 'ios') return `http://maps.apple.com/?daddr=${to.lat},${to.lng}&dirflg=w`;
  return `https://www.google.com/maps/dir/?api=1&destination=${to.lat},${to.lng}&travelmode=walking`;
}
