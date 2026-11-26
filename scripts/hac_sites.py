"""Hac yerleri (Arafat, Mina, Müzdelife, cemreler, Harem sınırı) — OSM'den uygulama verisine.

Kullanım: python3 scripts/hac_sites.py out.json > src/data/osm/hacSites.ts
Girdi: scripts/osm-3d.md'deki "Hac yerleri" Overpass sorgusunun çıktısı (osm-fetch.yml ile alınabilir).
Veri © OpenStreetMap katkıcıları, ODbL 1.0.
"""
import json, math, sys

d = json.load(open(sys.argv[1]))
by = {(e['type'], e['id']): e for e in d['elements']}

def way(i):
    return [(p['lat'], p['lon']) for p in by[('way', i)]['geometry']]

def ring_from_relation(rid):
    rel = by[('relation', rid)]
    segs = [[(p['lat'], p['lon']) for p in m['geometry']] for m in rel['members'] if m['type'] == 'way' and m['role'] == 'outer']
    ring = segs.pop(0)
    while segs:
        end = ring[-1]
        for k, s in enumerate(segs):
            if s[0] == end: ring += s[1:]; segs.pop(k); break
            if s[-1] == end: ring += list(reversed(s))[1:]; segs.pop(k); break
        else:
            raise SystemExit('halka birleşmedi')
    return ring

def simplify(pts, tol_m):
    if len(pts) > 3 and pts[0] == pts[-1]:
        # kapalı halka: başlangıca en uzak noktadan ikiye böl, ayrı ayrı sadeleştir
        far = max(range(len(pts)), key=lambda i: (pts[i][0] - pts[0][0]) ** 2 + (pts[i][1] - pts[0][1]) ** 2)
        a = _dp(pts[: far + 1], tol_m)
        b = _dp(pts[far:], tol_m)
        return a + b[1:]
    return _dp(pts, tol_m)

def _dp(pts, tol_m):
    lat0 = math.radians(sum(p[0] for p in pts) / len(pts))
    kx, ky = 111320 * math.cos(lat0), 110540
    xy = [(p[1] * kx, p[0] * ky) for p in pts]
    keep = [False] * len(pts); keep[0] = keep[-1] = True
    stack = [(0, len(pts) - 1)]
    while stack:
        a, b = stack.pop()
        ax, ay = xy[a]; bx, by_ = xy[b]; dx, dy = bx - ax, by_ - ay; L = math.hypot(dx, dy) or 1
        best, idx = 0, -1
        for i in range(a + 1, b):
            px, py = xy[i]
            dist = abs(dy * (px - ax) - dx * (py - ay)) / L if L > 1e-9 else math.hypot(px - ax, py - ay)
            if dist > best: best, idx = dist, i
        if best > tol_m and idx > 0:
            keep[idx] = True; stack += [(a, idx), (idx, b)]
    return [p for p, k in zip(pts, keep) if k]

def centroid(pts):
    return (sum(p[0] for p in pts) / len(pts), sum(p[1] for p in pts) / len(pts))

def node(i):
    e = by[('node', i)]; return (e['lat'], e['lon'])

def fmt(poly):
    return '[' + ','.join(f'[{a:.6f},{b:.6f}]' for a, b in poly) + ']'

def openring(poly):
    return poly[:-1] if poly[0] == poly[-1] else poly

ARAFAT = openring(way(1377422823))
MINA = openring(simplify(way(1249259763), 8))
NAMIRA = openring(simplify(way(112317307), 2))
BRIDGE = openring(simplify(way(440922995), 3))
HARAM = openring(simplify(ring_from_relation(19590020), 25))

P = []
def add(id_, kind, ll, tr, en, ar):
    P.append((id_, kind, ll, tr, en, ar))

add('cemre-kucuk', 'cemre', node(4144223248), 'Küçük cemre (Cemre-i Ûlâ)', 'Small Jamrah (al-Ula)', 'الجمرة الصغرى')
add('cemre-orta', 'cemre', node(4144223249), 'Orta cemre (Cemre-i Vüstâ)', 'Middle Jamrah (al-Wusta)', 'الجمرة الوسطى')
add('cemre-akabe', 'cemre', node(4144223250), 'Büyük cemre (Cemre-i Akabe)', 'Big Jamrah (al-Aqabah)', 'جمرة العقبة')
add('namira', 'mosque', centroid(way(112317307)), 'Nemire Mescidi', 'Namirah Mosque', 'مسجد نمرة')
add('rahme', 'mount', node(1236463804), 'Cebel-i Rahme', 'Jabal al-Rahmah', 'جبل الرحمة')
add('mesar', 'mosque', centroid(way(457318293)), "Meş'ar-i Haram Mescidi", "Al-Mash'ar al-Haram Mosque", 'مسجد المشعر الحرام')
add('hayf', 'mosque', centroid(way(372402102)), 'Hayf Mescidi', 'Al-Khayf Mosque', 'مسجد الخيف')
add('muzdelife', 'area', node(4543956102), 'Müzdelife', 'Muzdalifah', 'مزدلفة')
add('mina', 'area', node(7758270150), 'Mina', 'Mina', 'منى')
add('arafat', 'area', centroid(ARAFAT), 'Arafat', 'Arafat', 'عرفات')
add('muzdelife-siniri', 'sign', node(11007975028), 'Müzdelife sınırı (tabela)', 'Muzdalifah boundary sign', 'حد مزدلفة')
for i, (tr, en, ar) in {
    4534861100: ('Arafat 1 istasyonu', 'Arafat Station 1', 'محطة عرفات 1'),
    4534861099: ('Arafat 2 istasyonu', 'Arafat Station 2', 'محطة عرفات 2'),
    4534861098: ('Arafat 3 istasyonu', 'Arafat Station 3', 'محطة عرفات 3'),
    4534838647: ('Müzdelife 1 istasyonu', 'Muzdalifah Station 1', 'محطة مزدلفة 1'),
    4534834974: ('Müzdelife 2 istasyonu', 'Muzdalifah Station 2', 'محطة مزدلفة 2'),
    4534824625: ('Müzdelife 3 istasyonu', 'Muzdalifah Station 3', 'محطة مزدلفة 3'),
    4534822206: ('Mina 1 istasyonu', 'Mina Station 1', 'محطة منى 1'),
    4534822205: ('Mina 2 istasyonu', 'Mina Station 2', 'محطة منى 2'),
    6024783454: ('Mina 3 (Cemerat) istasyonu', 'Mina 3 (Jamarat) Station', 'محطة منى 3 (الجمرات)'),
}.items():
    add(f'istasyon-{i}', 'station', node(i), tr, en, ar)
for kind, ref, tr, en, ar in [
    ('w', 520141095, 'Mina Acil Hastanesi', 'Mina Emergency Hospital', 'مستشفى الطوارئ بمنى'),
    ('w', 136525017, 'Mina el-Vâdî Hastanesi', 'Mina Al-Wadi Hospital', 'مستشفى منى الوادي'),
    ('n', 4853503310, 'Mina el-Cisr Hastanesi', 'Mina Al-Jisr Hospital', 'مستشفى منى الجسر'),
    ('w', 133219649, 'Mina eş-Şâriü’l-Cedîd Hastanesi', 'Mina Al-Share’a Al-Jadeed Hospital', 'مستشفى منى الشارع الجديد'),
    ('w', 131655352, 'Arafat Genel Hastanesi', 'Arafat General Hospital', 'مستشفى عرفات العام'),
    ('w', 132325101, 'Cebel-i Rahme Hastanesi', 'Jabal Al-Rahmah Hospital', 'مستشفى جبل الرحمة'),
    ('n', 4534849994, 'Nemire Hastanesi', 'Namirah Hospital', 'مستشفى نمرة'),
    ('w', 457321838, 'Doğu Arafat Hastanesi', 'Eastern Arafat Hospital', 'مستشفى شرق عرفات'),
]:
    ll = centroid(way(ref)) if kind == 'w' else node(ref)
    add(f'hastane-{ref}', 'hospital', ll, tr, en, ar)

out = []
out.append('// Hac yerleri: OpenStreetMap verisinden üretildi (scripts/hac_sites.py). © OpenStreetMap katkıcıları, ODbL 1.0.')
out.append('// Arafat alanı (way 1377422823) sahadaki sınır işaretlerinden çizilmiş; yine de yaklaşık kabul edilmeli.')
out.append('// Harem sınırı: ilişki 19590020 (kaynak: Hadrân es-Sübeytî ve Suûd es-Sübeytî, A‘lâm ve hudûdü’l-Harem el-Mekkî, 1433/2012), 25 m sadeleştirildi.')
out.append(f"export const HAC_OSM_DATE = '2026-11-26';")
out.append('export type LL2 = [number, number];')
out.append(f'export const ARAFAT_AREA: LL2[] = {fmt(ARAFAT)};')
out.append(f'export const MINA_AREA: LL2[] = {fmt(MINA)};')
out.append(f'export const NAMIRA_MOSQUE: LL2[] = {fmt(NAMIRA)};')
out.append(f'export const JAMARAT_BRIDGE: LL2[] = {fmt(BRIDGE)};')
out.append(f'export const HARAM_BOUNDARY: LL2[] = {fmt(HARAM)};')
out.append("export type HacPlaceKind = 'cemre' | 'mosque' | 'mount' | 'area' | 'sign' | 'station' | 'hospital';")
out.append('export type HacPlace = { id: string; kind: HacPlaceKind; lat: number; lng: number; name: { tr: string; en: string; ar: string } };')
out.append('export const HAC_PLACES: HacPlace[] = [')
for id_, kind, (la, lo), tr, en, ar in P:
    out.append(f"  {{ id: '{id_}', kind: '{kind}', lat: {la:.6f}, lng: {lo:.6f}, name: {{ tr: {json.dumps(tr, ensure_ascii=False)}, en: {json.dumps(en, ensure_ascii=False)}, ar: {json.dumps(ar, ensure_ascii=False)} }} }},")
out.append('];')
print('\n'.join(out))
print(f'// noktalar: Arafat {len(ARAFAT)}, Mina {len(MINA)}, Nemire {len(NAMIRA)}, köprü {len(BRIDGE)}, Harem {len(HARAM)}', file=sys.stderr)
