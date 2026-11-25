// Ağdan JSON indirir, AsyncStorage'da saklar. Ağ yoksa son kaydı döner (çevrimdışı çalışma).
import AsyncStorage from '@react-native-async-storage/async-storage';

/** Açık veri sunucuları (Photon, OSRM, Overpass) uygulamanın kendini tanıtmasını ister. */
export const UA = 'MATAF/0.6 (Android; https://github.com/sozerahmethayri-ops/Mataf)';
/** Yalnız telefonda eklenir (tarayıcıda bu başlık CORS ön denetimine yol açar). */
export const uaHeaders = (): Record<string, string> =>
  typeof navigator !== 'undefined' && navigator.product === 'ReactNative' ? { 'User-Agent': UA } : {};

export type Cached<T> = { data: T; fetchedAt: number; fromCache: boolean };

export async function cachedJson<T>(key: string, url: string, ttlMs: number, init?: RequestInit): Promise<Cached<T>> {
  const raw = await AsyncStorage.getItem(`cache:${key}`);
  const hit = raw ? (JSON.parse(raw) as { data: T; at: number }) : null;
  if (hit && Date.now() - hit.at < ttlMs) return { data: hit.data, fetchedAt: hit.at, fromCache: true };
  try {
    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), 20000);
    const res = await fetch(url, { ...init, headers: { ...uaHeaders(), ...(init?.headers as Record<string, string> | undefined) }, signal: ctl.signal });
    clearTimeout(timer);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = (await res.json()) as T;
    await AsyncStorage.setItem(`cache:${key}`, JSON.stringify({ data, at: Date.now() }));
    return { data, fetchedAt: Date.now(), fromCache: false };
  } catch (e) {
    if (hit) return { data: hit.data, fetchedAt: hit.at, fromCache: true };
    throw e;
  }
}

export async function cacheAge(key: string) {
  const raw = await AsyncStorage.getItem(`cache:${key}`);
  return raw ? (JSON.parse(raw) as { at: number }).at : undefined;
}

export async function clearCache(prefix: string) {
  const keys = await AsyncStorage.getAllKeys();
  await AsyncStorage.multiRemove(keys.filter((k) => k.startsWith(`cache:${prefix}`)));
}

/** Önbelleksiz JSON isteği (zaman aşımıyla); rota ve arama gibi her seferinde değişen istekler için. */
export async function getJson<T = unknown>(url: string, ms = 12000): Promise<T> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  try {
    const r = await fetch(url, { signal: ctrl.signal, headers: { Accept: 'application/json', ...uaHeaders() } });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return (await r.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}
