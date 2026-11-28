// MapLibre GL JS'i uygulamaya gömülecek tek parçaya (<style> + <script>) çevirir: assets/maplibre/maplibre-gl-<sürüm>.html
// Harita sayfası bu parçayı satır içi yükler; kütüphane için CDN'e (unpkg, jsdelivr) gerek kalmaz.
// Kullanım:
//   cd "$(mktemp -d)" && npm pack maplibre-gl@5.24.1 && tar xzf maplibre-gl-5.24.1.tgz
//   node tools/maplibre/build.mjs <o klasör>/package
// Sürüm src/components/onlineMapHtml.ts'teki MAPLIBRE_VERSION ile aynı olmalı. Lisans: BSD-3-Clause (dosya başında).
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const pkg = process.argv[2];
if (!pkg) {
  console.error('kullanım: node tools/maplibre/build.mjs <maplibre-gl paket klasörü>');
  process.exit(1);
}
const { version } = JSON.parse(readFileSync(join(pkg, 'package.json'), 'utf8'));
const js = readFileSync(join(pkg, 'dist', 'maplibre-gl.js'), 'utf8');
const css = readFileSync(join(pkg, 'dist', 'maplibre-gl.css'), 'utf8');
// Satır içi betikte HTML ayrıştırıcısını şaşırtacak diziler olmamalı
for (const bad of ['</script', '<!--', '<script']) if (js.toLowerCase().includes(bad)) throw new Error(`maplibre-gl.js içinde ${bad}`);
if (css.toLowerCase().includes('</style')) throw new Error('maplibre-gl.css içinde </style');
const out = join(process.cwd(), 'assets', 'maplibre', `maplibre-gl-${version}.html`);
writeFileSync(out, `<style>${css}</style>\n<script>${js}</script>\n`);
console.log(out, Math.round((js.length + css.length) / 1024), 'KB');
