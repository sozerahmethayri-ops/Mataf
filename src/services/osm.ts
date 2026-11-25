// Şehir haritası verisi: OpenStreetMap (Overpass API) + yaya rotası (FOSSGIS OSRM).
// Lisans: © OpenStreetMap katkıcıları, ODbL. Haritada atıf gösterilmelidir.
import { cachedJson } from './cache';

export type PoiCat = 'hotel' | 'food' | 'pharmacy' | 'bus' | 'taxi' | 'hospital';
export type Poi = { id: string; cat: PoiCat; name: string; lat: number; lng: number };

// Yakındaki yerler Photon'dan (OSM etiketiyle, kategori başına en yakın 25); kararsız Overpass sunucularına bağlı değil.
const CATS: { cat: PoiCat; tags: string[] }[] = [
  { cat: 'hotel', tags: ['tourism:hotel', 'tourism:guest_house', 'tourism:hostel'] },
  { cat: 'food', tags: ['amenity:restaurant', 'amenity:fast_food', 'amenity:cafe'] },
  { cat: 'pharmacy', tags: ['amenity:pharmacy'] },
  { cat: 'bus', tags: ['highway:bus_stop', 'amenity:bus_station'] },
  { cat: 'taxi', tags: ['amenity:taxi'] },
  { cat: 'hospital', tags: ['amenity:hospital', 'amenity:clinic'] },
];

export async function nearbyPois(lat: number, lng: number, radius = 1200): Promise<Poi[]> {
  type F = { geometry?: { coordinates?: [number, number] }; properties?: Record<string, string | number | undefined> };
  const results = await Promise.allSettled(CATS.map(async ({ cat, tags }) => {
    const url = `https://photon.komoot.io/reverse?lat=${lat.toFixed(5)}&lon=${lng.toFixed(5)}&radius=${radius / 1000}&limit=25&${tags.map((t) => `osm_tag=${t}`).join('&')}`;
    const r = await cachedJson<{ features?: F[] }>(`poi:${cat}:${lat.toFixed(3)},${lng.toFixed(3)},${radius}`, url, 3 * 24 * 3600 * 1000);
    return (r.data.features ?? []).flatMap((f) => {
      const [lo, la] = f.geometry?.coordinates ?? [];
      if (la == null || lo == null) return [];
      const p = f.properties ?? {};
      return [{ id: `${String(p.osm_type ?? 'N').toLowerCase()}/${p.osm_id}`, cat, name: String(p.name ?? ''), lat: la, lng: lo } as Poi];
    });
  }));
  const ok = results.filter((r): r is PromiseFulfilledResult<Poi[]> => r.status === 'fulfilled');
  if (!ok.length) throw (results[0] as PromiseRejectedResult).reason;
  return ok.flatMap((r) => r.value);
}

export type WalkRoute = { coords: { latitude: number; longitude: number }[]; meters: number; seconds: number; approximate: boolean };

export async function walkRoute(from: { lat: number; lng: number }, to: { lat: number; lng: number }): Promise<WalkRoute> {
  const url = `https://routing.openstreetmap.de/routed-foot/route/v1/driving/${from.lng},${from.lat};${to.lng},${to.lat}?overview=full&geometries=geojson`;
  try {
    const r = await cachedJson<{ routes: { distance: number; duration: number; geometry: { coordinates: [number, number][] } }[] }>(
      `route:${url}`, url, 6 * 3600 * 1000,
    );
    const rt = r.data.routes[0];
    return {
      coords: rt.geometry.coordinates.map(([lo, la]) => ({ latitude: la, longitude: lo })),
      meters: rt.distance,
      seconds: rt.duration,
      approximate: false,
    };
  } catch {
    // Ağ yoksa düz çizgi + kuş uçuşu mesafe
    const m = haversine(from, to);
    return { coords: [{ latitude: from.lat, longitude: from.lng }, { latitude: to.lat, longitude: to.lng }], meters: m, seconds: m / 1.1, approximate: true };
  }
}

export function haversine(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371000;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const s = Math.sin(dLat / 2) ** 2 + Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}
