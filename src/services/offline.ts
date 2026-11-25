// Çevrimdışı paket (telefon): Kur'an metni ve mealler, dua ayetlerinin kâri sesleri, Mekke ve Medine harita
// karoları (yazı tipleri, simgeler, stil ve MapLibre kütüphanesiyle) cihaza indirilir. Dosyalar belgeler
// klasöründe `offline/` altında durur; dizin dosyası (index.json) senkron okunabilsin diye dosyadadır.
// Web sürümünde offline.web.ts kullanılır (paket yok).
import { Directory, File, Paths } from 'expo-file-system';

import { MAPLIBRE_VERSION } from '@/components/onlineMapHtml';
import { DUA_LIB } from '@/data/duas';
import { uaHeaders } from './cache';
import { AREAS, GLYPH_RANGES, fontStacks, rewriteStyle, spriteRoot, tilesFor, type Area, type Remote } from './offlineMath';
import { ayahAudioUrl, globalAyah } from './quranIndex';

export const OFFLINE_SUPPORTED = true;
const QURAN_API = 'https://api.alquran.cloud/v1';
const OFM = 'https://tiles.openfreemap.org';

export type OfflineIndex = {
  quran?: { editions: string[]; at: number; bytes: number };
  audio?: { reciter: string; count: number; at: number; bytes: number };
  maps?: { areas: Area['id'][]; at: number; bytes: number; tiles: number; remote: Remote };
  lib?: { version: string; at: number };
};
export type Progress = (done: number, total: number, label: string) => void;
export type Cancel = { cancelled: boolean };

const base = () => new Directory(Paths.document, 'offline');
const dir = (...parts: string[]) => new Directory(base(), ...parts);
const file = (...parts: string[]) => new File(base(), ...parts);
function ensureDir(d: Directory) { if (!d.exists) d.create({ intermediates: true, idempotent: true }); }

let indexCache: OfflineIndex | null = null;
export function getIndex(): OfflineIndex {
  if (indexCache) return indexCache;
  try {
    const f = file('index.json');
    indexCache = f.exists ? (JSON.parse(f.textSync()) as OfflineIndex) : {};
  } catch {
    indexCache = {};
  }
  return indexCache;
}
function saveIndex(next: OfflineIndex) {
  ensureDir(base());
  const f = file('index.json');
  if (f.exists) f.delete();
  f.create();
  f.write(JSON.stringify(next));
  indexCache = next;
}

async function getJson<T>(url: string): Promise<T> {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), 60000);
  try {
    const r = await fetch(url, { headers: { Accept: 'application/json', ...uaHeaders() }, signal: ctl.signal });
    if (!r.ok) throw new Error(`HTTP ${r.status} ${url}`);
    return (await r.json()) as T;
  } finally {
    clearTimeout(t);
  }
}
function writeText(f: File, text: string) {
  ensureDir(f.parentDirectory);
  if (f.exists) f.delete();
  f.create();
  f.write(text);
}
/** Dosyayı indirir (varsa atlar); başarısızsa bir kez daha dener. Boyutu döner. */
async function fetchTo(url: string, f: File, skipExisting = true): Promise<number> {
  if (skipExisting && f.exists && (f.size ?? 0) > 0) return f.size ?? 0;
  ensureDir(f.parentDirectory);
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      if (f.exists) f.delete();
      const out = await File.downloadFileAsync(url, f, { idempotent: true, headers: uaHeaders() });
      return out.size ?? 0;
    } catch (e) {
      if (attempt === 1) throw e;
    }
  }
  return 0;
}
/** Sınırlı eşzamanlılıkla iş kuyruğu. */
async function pool<T>(items: T[], n: number, work: (x: T) => Promise<void>, cancel: Cancel) {
  let i = 0;
  const run = async () => {
    while (i < items.length && !cancel.cancelled) {
      const x = items[i++];
      await work(x);
    }
  };
  await Promise.all(Array.from({ length: Math.min(n, items.length) }, run));
}
function dirSize(d: Directory): number {
  if (!d.exists) return 0;
  let n = 0;
  for (const it of d.list()) n += it instanceof Directory ? dirSize(it) : (it.size ?? 0);
  return n;
}

// ── Kur'an ───────────────────────────────────────────────
type QuranAll = { data: { surahs: { number: number; ayahs: { text: string }[] }[] } };
/** Seçili sürümleri (Arapça + meal + okunuş) bütün olarak indirir: her biri 114 sûrelik metin dizisi. */
export async function downloadQuran(editions: string[], onProgress: Progress, cancel: Cancel) {
  const eds = ['quran-uthmani', ...editions.filter((e) => e && e !== 'quran-uthmani')];
  let bytes = 0;
  for (let i = 0; i < eds.length && !cancel.cancelled; i++) {
    onProgress(i, eds.length, eds[i]);
    const j = await getJson<QuranAll>(`${QURAN_API}/quran/${eds[i]}`);
    const texts = j.data.surahs.sort((a, b) => a.number - b.number).map((s) => s.ayahs.map((a) => a.text));
    if (texts.length !== 114) throw new Error(`eksik sûre: ${eds[i]}`);
    const json = JSON.stringify(texts);
    writeText(file('quran', `${eds[i]}.json`), json);
    bytes += json.length;
    quranMem.delete(eds[i]);
  }
  if (cancel.cancelled) return;
  onProgress(eds.length, eds.length, '');
  const prev = getIndex().quran?.editions ?? [];
  saveIndex({ ...getIndex(), quran: { editions: [...new Set([...prev, ...eds])], at: Date.now(), bytes: dirSize(dir('quran')) || bytes } });
}

const quranMem = new Map<string, string[][]>();
function loadEdition(ed: string): string[][] | null {
  const hit = quranMem.get(ed);
  if (hit) return hit;
  try {
    const f = file('quran', `${ed}.json`);
    if (!f.exists) return null;
    const t = JSON.parse(f.textSync()) as string[][];
    quranMem.set(ed, t);
    return t;
  } catch {
    return null;
  }
}
/** Sûrenin istenen sürümlerdeki metinleri; hepsi indirilmişse döner, yoksa null. */
export function offlineSurah(n: number, editions: string[]): Record<string, string[]> | null {
  if (!getIndex().quran) return null;
  const out: Record<string, string[]> = {};
  for (const ed of editions) {
    const all = loadEdition(ed);
    if (!all) return null;
    out[ed] = all[n - 1];
  }
  return out;
}

// ── Dua sesleri ──────────────────────────────────────────
/** Dua kütüphanesindeki (tavaf, sa'y, günlük…) bütün ayetlerin genel numaraları. */
export function duaAyahs(): number[] {
  const set = new Set<number>();
  for (const c of DUA_LIB) for (const d of c.items) {
    const q = (d as { quran?: [number, number, number?] }).quran;
    if (!q) continue;
    const [s, a, to = a] = q;
    for (let k = a; k <= to; k++) set.add(globalAyah(s, k));
  }
  return [...set].sort((x, y) => x - y);
}
export async function downloadDuaAudio(reciter: string, onProgress: Progress, cancel: Cancel) {
  const list = duaAyahs();
  let done = 0;
  await pool(list, 4, async (g) => {
    await fetchTo(ayahAudioUrl(g, reciter), file('audio', reciter, `${g}.mp3`));
    onProgress(++done, list.length, String(g));
  }, cancel);
  if (cancel.cancelled) return;
  saveIndex({ ...getIndex(), audio: { reciter, count: list.length, at: Date.now(), bytes: dirSize(dir('audio')) } });
}
/** Ayetin yerel ses dosyası (indirilmişse). */
export function localAyahAudio(global: number, reciter: string): string | null {
  const idx = getIndex().audio;
  if (!idx || idx.reciter !== reciter) return null;
  try {
    const f = file('audio', reciter, `${global}.mp3`);
    return f.exists ? f.uri : null;
  } catch {
    return null;
  }
}

// ── Harita ───────────────────────────────────────────────
type Style = Parameters<typeof rewriteStyle>[0];
export async function downloadMaps(areaIds: Area['id'][], onProgress: Progress, cancel: Cancel) {
  onProgress(0, 1, 'stil');
  const tj = await getJson<{ tiles: string[]; attribution?: string }>(`${OFM}/planet`);
  const remote: Remote = { tiles: tj.tiles[0], glyphs: `${OFM}/fonts/{fontstack}/{range}.pbf`, spriteRoot: `${OFM}/sprites` };
  const styles: Record<string, Style> = {};
  for (const name of ['liberty', 'dark']) styles[name] = await getJson<Style>(`${OFM}/styles/${name}`);
  for (const [name, st] of Object.entries(styles)) {
    if (typeof st.glyphs === 'string') remote.glyphs = st.glyphs;
    if (typeof st.sprite === 'string') remote.spriteRoot = spriteRoot(st.sprite);
    writeText(file('maps', `style-${name}.json`), JSON.stringify(rewriteStyle(st, tj.attribution ?? '© OpenStreetMap')));
  }
  // İş listesi: simgeler, yazı tipleri, karolar, kütüphane
  const jobs: { url: string; f: File }[] = [];
  const sprites = new Set(Object.values(styles).map((st) => (typeof st.sprite === 'string' ? st.sprite : '')).filter(Boolean));
  for (const sp of sprites) {
    const key = sp.split('/').slice(-2).join('~');
    for (const suf of ['.json', '.png', '@2x.json', '@2x.png']) jobs.push({ url: `${sp}${suf}`, f: file('maps', 'sprites', `${key}${suf}`) });
  }
  const stacks = new Set(Object.values(styles).flatMap((st) => fontStacks(st)));
  for (const stack of stacks) for (const r of GLYPH_RANGES) {
    jobs.push({ url: remote.glyphs.replace('{fontstack}', encodeURIComponent(stack)).replace('{range}', r), f: file('maps', 'fonts', stack, `${r}.pbf`) });
  }
  const areas = AREAS.filter((a) => areaIds.includes(a.id));
  const seen = new Set<string>();
  for (const a of areas) for (const t of tilesFor(a)) {
    const k = `${t.z}/${t.x}/${t.y}`;
    if (seen.has(k)) continue;
    seen.add(k);
    jobs.push({ url: remote.tiles.replace('{z}', String(t.z)).replace('{x}', String(t.x)).replace('{y}', String(t.y)), f: file('maps', 'tiles', String(t.z), String(t.x), `${t.y}.pbf`) });
  }
  const cdn = `https://unpkg.com/maplibre-gl@${MAPLIBRE_VERSION}/dist/`;
  jobs.push({ url: `${cdn}maplibre-gl.js`, f: file('lib', MAPLIBRE_VERSION, 'maplibre-gl.js') }, { url: `${cdn}maplibre-gl.css`, f: file('lib', MAPLIBRE_VERSION, 'maplibre-gl.css') });

  let done = 0;
  const failed: string[] = [];
  await pool(jobs, 6, async (j) => {
    try { await fetchTo(j.url, j.f); } catch { failed.push(j.url); }
    onProgress(++done, jobs.length, '');
  }, cancel);
  if (cancel.cancelled) return;
  // Kütüphane jsdelivr'dan yeniden denenir
  const lib = file('lib', MAPLIBRE_VERSION, 'maplibre-gl.js');
  if (!lib.exists) {
    const alt = `https://cdn.jsdelivr.net/npm/maplibre-gl@${MAPLIBRE_VERSION}/dist/`;
    await fetchTo(`${alt}maplibre-gl.js`, lib).catch(() => undefined);
    await fetchTo(`${alt}maplibre-gl.css`, file('lib', MAPLIBRE_VERSION, 'maplibre-gl.css')).catch(() => undefined);
  }
  const tilesFailed = failed.filter((u) => u.endsWith('.pbf') && u.includes('/planet/')).length;
  if (tilesFailed > seen.size * 0.2) throw new Error(`${tilesFailed} karo indirilemedi`);
  const prev = getIndex().maps?.areas ?? [];
  saveIndex({
    ...getIndex(),
    maps: { areas: [...new Set([...prev, ...areaIds])], at: Date.now(), bytes: dirSize(dir('maps')), tiles: seen.size, remote },
    ...(lib.exists ? { lib: { version: MAPLIBRE_VERSION, at: Date.now() } } : {}),
  });
}

/** Online haritanın çevrimdışı ayarı: yerel stil, ağ yedek adresleri ve kütüphane klasörü. */
export function offlineMapConfig(dark: boolean): { style: object; remote: Remote; libBase?: string } | null {
  const idx = getIndex();
  if (!idx.maps) return null;
  try {
    const f = file('maps', `style-${dark ? 'dark' : 'liberty'}.json`);
    if (!f.exists) return null;
    const libDir = dir('lib', MAPLIBRE_VERSION);
    const libOk = idx.lib?.version === MAPLIBRE_VERSION && new File(libDir, 'maplibre-gl.js').exists;
    return { style: JSON.parse(f.textSync()) as object, remote: idx.maps.remote, libBase: libOk ? `${libDir.uri.replace(/\/?$/, '/')}` : undefined };
  } catch {
    return null;
  }
}

/** Harita sayfasının istediği yerel dosya (base64); yoksa null. */
export async function readMapFile(path: string): Promise<string | null> {
  try {
    const f = new File(dir('maps'), path);
    return f.exists ? await f.base64() : null;
  } catch {
    return null;
  }
}

export async function deleteOffline(part: 'quran' | 'audio' | 'maps') {
  const d = dir(part);
  if (d.exists) d.delete();
  if (part === 'maps') { const l = dir('lib'); if (l.exists) l.delete(); }
  if (part === 'quran') quranMem.clear();
  const next = { ...getIndex() };
  delete next[part];
  if (part === 'maps') delete next.lib;
  saveIndex(next);
}
