// En yakın cami / mescit: dünyanın her yerinde OpenStreetMap verisiyle (Overpass API).
// Lisans: © OpenStreetMap katkıcıları, ODbL — ekranda atıf gösterilir.
// Hız ve dayanıklılık: yarıçap kademeli büyür (1,5 → 60 km), sunucu yanıt vermezse yedek sunucuya geçilir,
// son başarılı sonuç cihazda saklanır (internet yokken gösterilir).
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
  'https://overpass.kumi.systems/api/interpreter',
  'https://overpass.private.coffee/api/interpreter',
];
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

export type Fetcher = (url: string, init: { method: string; headers: Record<string, string>; body: string; signal?: AbortSignal }) => Promise<{ ok: boolean; status: number; json: () => Promise<unknown> }>;

async function queryOnce(o: LatLng, radius: number, fetcher: Fetcher, timeoutMs: number) {
  let lastErr: unknown = new Error('no endpoint');
  for (const url of OVERPASS_ENDPOINTS) {
    const ctrl = typeof AbortController !== 'undefined' ? new AbortController() : undefined;
    const timer = setTimeout(() => ctrl?.abort(), timeoutMs);
    try {
      const res = await fetcher(url, {
        method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `data=${encodeURIComponent(buildQuery(o, radius))}`, signal: ctrl?.signal,
      });
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
    for (const radius of RADII) {
      used = radius;
      found = parseOverpass(await queryOnce(o, radius, fetcher, opts.timeoutMs ?? 12000), o, lang);
      if (found.length >= minCount) break;
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
