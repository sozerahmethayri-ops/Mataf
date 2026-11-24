// Şehir haritası verisi: OpenStreetMap (Overpass API) + yaya rotası (FOSSGIS OSRM).
// Lisans: © OpenStreetMap katkıcıları, ODbL. Haritada atıf gösterilmelidir.
import { cachedJson } from './cache';

export type PoiCat = 'hotel' | 'food' | 'pharmacy' | 'bus' | 'taxi' | 'hospital';
export type Poi = { id: string; cat: PoiCat; name: string; lat: number; lng: number };

const OVERPASS = 'https://overpass-api.de/api/interpreter';

export async function nearbyPois(lat: number, lng: number, radius = 1200): Promise<Poi[]> {
  const a = `(around:${radius},${lat},${lng})`;
  const q = `[out:json][timeout:25];(
    nwr["tourism"="hotel"]${a};
    nwr["amenity"~"^(restaurant|fast_food|cafe)$"]${a};
    nwr["amenity"="pharmacy"]${a};
    node["highway"="bus_stop"]${a};
    nwr["amenity"="taxi"]${a};
    nwr["amenity"~"^(hospital|clinic)$"]${a};
  );out center 500;`;
  type El = { type: string; id: number; lat?: number; lon?: number; center?: { lat: number; lon: number }; tags?: Record<string, string> };
  const key = `osm:${lat.toFixed(3)},${lng.toFixed(3)},${radius}`;
  const r = await cachedJson<{ elements: El[] }>(key, OVERPASS, 7 * 24 * 3600 * 1000, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `data=${encodeURIComponent(q)}`,
  });
  const out: Poi[] = [];
  for (const e of r.data.elements) {
    const t = e.tags ?? {};
    const la = e.lat ?? e.center?.lat;
    const lo = e.lon ?? e.center?.lon;
    if (la == null || lo == null) continue;
    let cat: PoiCat | null = null;
    if (t.tourism === 'hotel') cat = 'hotel';
    else if (['restaurant', 'fast_food', 'cafe'].includes(t.amenity)) cat = 'food';
    else if (t.amenity === 'pharmacy') cat = 'pharmacy';
    else if (t.highway === 'bus_stop') cat = 'bus';
    else if (t.amenity === 'taxi') cat = 'taxi';
    else if (t.amenity === 'hospital' || t.amenity === 'clinic') cat = 'hospital';
    if (!cat) continue;
    out.push({ id: `${e.type}/${e.id}`, cat, name: t['name:tr'] ?? t['name:en'] ?? t.name ?? '', lat: la, lng: lo });
  }
  return out;
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
