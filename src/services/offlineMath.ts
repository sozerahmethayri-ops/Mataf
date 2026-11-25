// Çevrimdışı harita paketi için saf hesaplar: hangi karolar indirilecek, stil dosyası yerel adreslere nasıl
// çevrilecek, hangi yazı tipi dilimleri gerekir. React'e ve dosya sistemine bağlı değil; testlerde kullanılır.

export type BBox = { s: number; w: number; n: number; e: number };
export type Area = { id: 'makkah' | 'madinah'; name: { tr: string; en: string; ar: string }; zooms: { from: number; to: number; bbox: BBox }[] };

/** Kapsama: düşük yakınlıkta geniş çevre, yakında Harem + ziyaret yerleri (Mekke'de Mina, Müzdelife, Arafat dahil). */
export const AREAS: Area[] = [
  {
    id: 'makkah',
    name: { tr: 'Mekke (Harem, Aziziye, Mina, Müzdelife, Arafat)', en: 'Makkah (Haram, Aziziyah, Mina, Muzdalifah, Arafat)', ar: 'مكة (الحرم، العزيزية، منى، مزدلفة، عرفات)' },
    zooms: [
      { from: 0, to: 10, bbox: { s: 21.0, w: 39.4, n: 21.8, e: 40.3 } },
      { from: 11, to: 12, bbox: { s: 21.3, w: 39.7, n: 21.52, e: 40.05 } },
      { from: 13, to: 14, bbox: { s: 21.35, w: 39.78, n: 21.47, e: 39.99 } },
    ],
  },
  {
    id: 'madinah',
    name: { tr: 'Medine (Nebevî, Kuba, Uhud, Bakî)', en: 'Madinah (Nabawi, Quba, Uhud, Baqi)', ar: 'المدينة (النبوي، قباء، أحد، البقيع)' },
    zooms: [
      { from: 0, to: 10, bbox: { s: 24.2, w: 39.3, n: 24.8, e: 39.9 } },
      { from: 11, to: 12, bbox: { s: 24.38, w: 39.5, n: 24.56, e: 39.72 } },
      { from: 13, to: 14, bbox: { s: 24.42, w: 39.56, n: 24.51, e: 39.66 } },
    ],
  },
];

export const lon2tile = (lon: number, z: number) => Math.floor(((lon + 180) / 360) * 2 ** z);
export function lat2tile(lat: number, z: number) {
  const r = (lat * Math.PI) / 180;
  return Math.floor(((1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2) * 2 ** z);
}

/** Alandaki tüm karolar (z/x/y), tekrar etmeden. */
export function tilesFor(area: Area): { z: number; x: number; y: number }[] {
  const out: { z: number; x: number; y: number }[] = [];
  const seen = new Set<string>();
  for (const zr of area.zooms) {
    for (let z = zr.from; z <= zr.to; z++) {
      const x0 = lon2tile(zr.bbox.w, z);
      const x1 = lon2tile(zr.bbox.e, z);
      const y0 = lat2tile(zr.bbox.n, z); // kuzey = küçük y
      const y1 = lat2tile(zr.bbox.s, z);
      for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) {
        const k = `${z}/${x}/${y}`;
        if (!seen.has(k)) { seen.add(k); out.push({ z, x, y }); }
      }
    }
  }
  return out;
}

/** Arapça ve Latin harfler için gereken yazı tipi dilimleri (256'lık). */
export const GLYPH_RANGES = [0, 256, 512, 768, 1536, 1792, 8192, 64256, 64512, 64768, 65024].map((a) => `${a}-${a + 255}`);

type StyleJson = {
  sprite?: string | { id: string; url: string }[];
  glyphs?: string;
  sources: Record<string, { type: string; url?: string; tiles?: string[]; [k: string]: unknown }>;
  layers: { id: string; source?: string; layout?: Record<string, unknown>; [k: string]: unknown }[];
  [k: string]: unknown;
};

/** Stilde kullanılan yazı tipi aileleri (text-font değerleri). */
export function fontStacks(style: StyleJson): string[] {
  const out = new Set<string>();
  const walk = (v: unknown) => {
    if (Array.isArray(v)) {
      if (v.length && v.every((x) => typeof x === 'string') && v.some((x) => /Noto|Sans|Regular|Bold|Italic/.test(x))) out.add(v.join(','));
      else v.forEach(walk);
    }
  };
  for (const l of style.layers) walk(l.layout?.['text-font']);
  return [...out];
}

/**
 * Stili yerel adreslere çevirir: vektör kaynak `mataf://tiles/{z}/{x}/{y}`, yazı tipleri `mataf://fonts/...`,
 * simgeler `mataf://sprites/<ad>`. Raster (gölgeli kabartma) kaynak ve katmanları çıkarılır.
 */
export function rewriteStyle(style: StyleJson, attribution: string): StyleJson {
  const sources: StyleJson['sources'] = {};
  const dropped = new Set<string>();
  for (const [id, src] of Object.entries(style.sources)) {
    if (src.type === 'vector') sources[id] = { type: 'vector', tiles: ['mataf://tiles/{z}/{x}/{y}'], minzoom: 0, maxzoom: 14, attribution };
    else dropped.add(id);
  }
  // Simge seti adı klasörüyle birlikte tutulur (ör. ofm_f384~ofm): iki stil farklı sürüm kullanırsa karışmasın
  const sprite = typeof style.sprite === 'string' ? `mataf://sprites/${style.sprite.split('/').slice(-2).join('~')}` : style.sprite;
  return {
    ...style,
    sources,
    glyphs: 'mataf://fonts/{fontstack}/{range}.pbf',
    sprite,
    layers: style.layers.filter((l) => !l.source || !dropped.has(l.source)),
  };
}

/** Simge setinin kök adresi: https://…/sprites/ofm_f384/ofm → https://…/sprites */
export const spriteRoot = (sprite: string) => sprite.split('/').slice(0, -2).join('/');

/** Yerel `mataf://` adresinin dosya yolu ve ağdaki asıl adresi. */
export type Remote = { tiles: string; glyphs: string; spriteRoot: string };
export function resolveMataf(url: string, remote: Remote): { path: string; remote: string } | null {
  const m = url.replace(/^mataf:\/\//, '');
  const [kind, ...rest] = m.split('/');
  if (kind === 'tiles' && rest.length === 3) {
    const [z, x, y] = rest;
    return { path: `tiles/${z}/${x}/${y}.pbf`, remote: remote.tiles.replace('{z}', z).replace('{x}', x).replace('{y}', y) };
  }
  if (kind === 'fonts' && rest.length === 2) {
    const stack = decodeURIComponent(rest[0]);
    return { path: `fonts/${stack}/${rest[1]}`, remote: remote.glyphs.replace('{fontstack}', encodeURIComponent(stack)).replace('{range}', rest[1].replace('.pbf', '')) };
  }
  if (kind === 'sprites' && rest.length === 1) {
    const file = rest[0];
    return { path: `sprites/${file}`, remote: `${remote.spriteRoot}/${file.replace('~', '/')}` };
  }
  return null;
}
