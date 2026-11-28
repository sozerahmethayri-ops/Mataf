// OpenStreetMap kapı verisini (osm-fetch.yml çıktısı, sorgu scripts/osm-3d.md "Kapılar") uygulama verisine çevirir.
// Kullanım: npx tsx scripts/gates_osm.ts out.json > src/data/gatesExtra.ts
//
// - Mekke: numaralı (ref) girişler. Ana kapılar (1, 45, 62, 79, 100) sites.ts'te elle yazılıdır, burada atlanır.
//   OSM'de Fetih Kapısı 30, Umre Kapısı 40 numaralı; Genel Kurum'un 2025 duyurusu 45 ve 62 diyor. Bu yüzden
//   kuzeydeki 30–41 aralığı tabela doğrulanana dek alınmaz.
// - Medine: adında numara geçen kapılar (ör. "باب العقّيق - 10, 11"); ana kapı grupları sites.ts'te.
// - out (18 m dışarıda) ve inner (25 m içeride): kapının çevresinde 10°'lik adımlarla, dış noktası bina dışında ve
//   iç noktası bina içinde kalan yönlerin ortalaması. Bulunamazsa mescit merkezinden dışa doğru.
// Node türleri projede yok: fs'yi require ile al
declare const require: (m: 'fs') => { readFileSync(p: string, enc: 'utf8'): string };
const { readFileSync } = require('fs');

import { toLocal, type City, type Pt } from '../src/data/sites';
import { isInsideBuilding } from '../src/services/routing';

type El = { type: string; id: number; lat?: number; lon?: number; center?: { lat: number; lon: number }; tags?: Record<string, string> };
const els: El[] = JSON.parse(readFileSync(process.argv[2], 'utf8')).elements;

const MAIN_MK = new Set(['1', '30', '40', '79']); // 30 ve 40 OSM'de Fetih ve Umre: ana kapı olarak sites.ts'te (45, 62)
const SKIP_MK = (n: number) => n >= 30 && n <= 41;
const MAIN_MD = new Set(['1', '41', '37', '20', '7', '33']);
const NAMES_MK: Record<string, string> = { '3': 'ajyad', '14': 'nabi', '16': 'arqam', '17': 'ali', '21': 'shaibaBridge', '22': 'shaiba', '25': 'marwa', '28': 'quraish' };

function pos(e: El) {
  return { lat: e.lat ?? e.center?.lat ?? 0, lon: e.lon ?? e.center?.lon ?? 0 };
}

/** Dış ve iç nokta: bina hattına dik yön (dış nokta dışarıda, iç nokta içeride kalan yönlerin ortalaması) */
function sides(city: City, p: Pt, center: Pt): { out: Pt; inner: Pt; ok: boolean } {
  let sx = 0;
  let sy = 0;
  let n = 0;
  for (let a = 0; a < 360; a += 10) {
    const r = (a * Math.PI) / 180;
    const d: Pt = [Math.cos(r), Math.sin(r)];
    const o: Pt = [p[0] + 18 * d[0], p[1] + 18 * d[1]];
    const i: Pt = [p[0] - 25 * d[0], p[1] - 25 * d[1]];
    if (!isInsideBuilding(city, o) && isInsideBuilding(city, i)) { sx += d[0]; sy += d[1]; n++; }
  }
  let d: Pt;
  if (n && Math.hypot(sx, sy) > 0.01) d = [sx / Math.hypot(sx, sy), sy / Math.hypot(sx, sy)];
  else {
    const l = Math.hypot(p[0] - center[0], p[1] - center[1]) || 1;
    d = [(p[0] - center[0]) / l, (p[1] - center[1]) / l];
  }
  const r = (v: number) => Math.round(v);
  return { out: [r(p[0] + 18 * d[0]), r(p[1] + 18 * d[1])], inner: [r(p[0] - 25 * d[0]), r(p[1] - 25 * d[1])], ok: n > 0 };
}

type Row = { city: 'mk' | 'md'; no: string; p: Pt; women: boolean; name: string };
const rows: Row[] = [];

// Mekke: aynı numaralı birden çok düğüm (kat farkı) 30 m içindeyse ortalanır
const byRef = new Map<string, Pt[]>();
for (const e of els) {
  const t = e.tags ?? {};
  const { lat, lon } = pos(e);
  if (lat > 23 || !/^\d+$/.test(t.ref ?? '')) continue;
  const no = t.ref;
  if (MAIN_MK.has(no) || SKIP_MK(Number(no))) continue;
  const p = toLocal('makkah', lat, lon);
  const list = byRef.get(no) ?? [];
  list.push(p);
  byRef.set(no, list);
}
for (const [no, ps] of byRef) {
  const near = ps.filter((q) => Math.hypot(q[0] - ps[0][0], q[1] - ps[0][1]) < 30);
  const p: Pt = [near.reduce((s, q) => s + q[0], 0) / near.length, near.reduce((s, q) => s + q[1], 0) / near.length];
  rows.push({ city: 'mk', no, p, women: false, name: NAMES_MK[no] ?? '' });
}

// Medine: adındaki numara grubu ("10, 11" → "10–11")
const MD_NAMES: [RegExp, string][] = [
  [/الرحمة/, 'rahma'], [/الهجرة/, 'hijra'], [/قباء/, 'quba'], [/العق/, 'aqiq'], [/باب المجيدي/, 'majidi'],
  [/عمر بن الخطاب/, 'omar'], [/بدر/, 'badr'], [/أحد/, 'uhud'], [/عثمان/, 'othman'], [/علي بن/, 'ali'],
  [/Abu Dhar/, 'abudhar'], [/بلال/, 'bilal'], [/النساء - 39/, 'nisa'], [/جبريل - 40/, 'jibril'], [/^Door 42$/, 'door42'],
];
for (const e of els) {
  const t = e.tags ?? {};
  const { lat, lon } = pos(e);
  if (lat < 23 || e.type !== 'node') continue;
  const label = t.name ?? '';
  const hit = MD_NAMES.find(([re]) => re.test(label));
  if (!hit) continue;
  const nums = (label.match(/\d+/g) ?? []).map(Number).filter((x) => x > 0 && x < 60);
  if (!nums.length || MAIN_MD.has(String(nums[0]))) continue;
  const no = nums.length > 1 ? `${nums[0]}–${nums[nums.length - 1]}` : String(nums[0]);
  if (rows.some((r) => r.city === 'md' && r.no === no)) continue;
  rows.push({ city: 'md', no, p: toLocal('madinah', lat, lon), women: /مدخل النساء|Women Entrance/.test(label + (t['name:en'] ?? '')), name: hit[1] });
}

const num = (s: string) => parseInt(s, 10);
rows.sort((a, b) => (a.city === b.city ? num(a.no) - num(b.no) : a.city < b.city ? 1 : -1));
const out: string[] = [];
let weak = 0;
for (const r of rows) {
  const city: City = r.city === 'mk' ? 'makkah' : 'madinah';
  const center: Pt = r.city === 'mk' ? (num(r.no) > 100 ? [-150, -260] : [0, 0]) : [0, -110];
  const p: Pt = [Math.round(r.p[0]), Math.round(r.p[1])];
  const s = sides(city, p, center);
  if (!s.ok) weak++;
  out.push(`  ['${r.city}', '${r.no}', ${p[0]}, ${p[1]}, ${s.out[0]}, ${s.out[1]}, ${s.inner[0]}, ${s.inner[1]}, ${r.women ? 1 : 0}, '${r.name}'],`);
}
console.log(`// Ana kapılar dışındaki kapılar: OpenStreetMap (© OpenStreetMap katkıcıları, ODbL), ${new Date().toISOString().slice(0, 10)}.
// scripts/gates_osm.ts üretir; elle değiştirme. Alanlar: şehir, numara, konum x/y, dış nokta, iç nokta (m), kadınlar girişi, ad anahtarı.
// Konumlar sites.ts'teki yerel düzlemde (x doğu, y güney). Dış/iç yönü bina hattından bulunamayan: ${weak}.
export type ExtraGate = [city: 'mk' | 'md', no: string, x: number, y: number, ox: number, oy: number, ix: number, iy: number, women: 0 | 1, name: string];
export const EXTRA_GATES: ExtraGate[] = [
${out.join('\n')}
];`);
