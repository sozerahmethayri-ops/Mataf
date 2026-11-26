#!/usr/bin/env python3
"""İstanbul raylı sistem ağını OpenStreetMap'ten src/data/istanbulRail.json'a dönüştürür.

Girdi: osm-fetch iş akışının out.json'u (sorgu scripts/osm-3d.md → "İstanbul raylı sistem").
Kullanım: python3 scripts/ist_rail.py out.json src/data/istanbulRail.json
Veri © OpenStreetMap katkıcıları, ODbL.
"""
import json, math, re, sys, datetime

src, dst = sys.argv[1], sys.argv[2]
els = json.load(open(src, encoding='utf-8'))['elements']
nodes = {e['id']: e for e in els if e['type'] == 'node'}
rels = [e for e in els if e['type'] == 'relation']

MODE = [('TF', 'cable'), ('M', 'metro'), ('T', 'tram'), ('F', 'funicular'), ('B', 'train')]
COLOR = {'metro': '#e32119', 'tram': '#004f7d', 'funicular': '#7c7358', 'train': '#5c6b73', 'cable': '#68bcb0'}
KEEP_TRAIN = {'B1', 'B2', 'T6'}

def mode_of(ref):
    for p, m in MODE:
        if ref.startswith(p):
            return m
    return None

def dist(a, b):
    r = math.pi / 180
    x = (b[1] - a[1]) * r * math.cos((a[0] + b[0]) / 2 * r)
    y = (b[0] - a[0]) * r
    return 6371000 * math.hypot(x, y)

def norm(n):
    n = n.lower().replace('i̇', 'i').replace('ı', 'i')
    return re.sub(r'[^a-z0-9çğöşü]', '', n)

stations = []  # [name, lat, lng, key, count]
def station(name, lat, lng):
    k = norm(name)
    for i, s in enumerate(stations):
        if s[3] == k and dist((s[1], s[2]), (lat, lng)) < 450:
            c = s[4]
            s[1] = (s[1] * c + lat) / (c + 1); s[2] = (s[2] * c + lng) / (c + 1); s[4] = c + 1
            return i
    stations.append([name, lat, lng, k, 1])
    return len(stations) - 1

lines = {}
for r in rels:
    t = r['tags']
    ref = (t.get('ref') or '').strip()
    route = t.get('route')
    if not ref or route not in ('subway', 'light_rail', 'tram', 'train', 'funicular', 'monorail'):
        continue
    if route == 'train' and ref not in KEEP_TRAIN:
        continue
    if t.get('state') in ('proposed', 'construction'):
        continue
    m = mode_of(ref)
    if not m or m == 'cable':
        continue
    pat = []
    for mem in r['members']:
        if mem['type'] != 'node' or not mem.get('role', '').startswith('stop'):
            continue
        n = nodes.get(mem['ref'])
        if not n or not n.get('tags', {}).get('name'):
            continue
        i = station(n['tags']['name'].strip(), n['lat'], n['lon'])
        if not pat or pat[-1] != i:
            pat.append(i)
    if len(pat) < 2:
        continue
    ln = lines.setdefault(ref, {'r': ref, 'm': 'tram' if ref == 'T6' else m, 'c': (t.get('colour') or COLOR[m]).lower(), 'p': []})
    if pat not in ln['p']:
        ln['p'].append(pat)

# Her hattın tek yönü varsa ve halka değilse ters yönü de ekle
for ln in lines.values():
    if len(ln['p']) == 1 and ln['p'][0][0] != ln['p'][0][-1]:
        ln['p'].append(list(reversed(ln['p'][0])))

out = {
    'v': 1,
    'src': '© OpenStreetMap katkıcıları (ODbL), ' + datetime.date.today().isoformat(),
    's': [[s[0], round(s[1], 5), round(s[2], 5)] for s in stations],
    'l': sorted(lines.values(), key=lambda l: (l['m'], l['r'])),
}
json.dump(out, open(dst, 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
print('istasyon', len(stations), 'hat', len(lines), ' '.join(sorted(lines)))
