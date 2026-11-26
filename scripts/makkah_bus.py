#!/usr/bin/env python3
"""Mekke otobüs ağını (Makkah Bus, حافلات مكة) OpenStreetMap'ten src/data/makkahBus.json'a dönüştürür.

Girdi: osm-fetch iş akışının out.json'u (sorgu scripts/osm-3d.md → "Mekke otobüsleri").
Kullanım: python3 scripts/makkah_bus.py out.json src/data/makkahBus.json
Çıktı istanbulRail.json ile aynı biçimdedir; durak adları [Arapça, enlem, boylam, İngilizce].
Veri © OpenStreetMap katkıcıları, ODbL.
"""
import json, math, re, sys, datetime

src, dst = sys.argv[1], sys.argv[2]
els = json.load(open(src, encoding='utf-8'))['elements']
nodes = {e['id']: e for e in els if e['type'] == 'node'}
rels = [e for e in els if e['type'] == 'relation']

# OSM'de adla yazılmış renkler ve rengi eksik hatlar için yedek
NAMED = {'red': '#d32f2f', 'blue': '#1565c0', 'green': '#2e7d32', 'yellow': '#f1e60e', 'orange': '#f47c14', 'purple': '#7b1fa2'}
FALLBACK = '#8d6e3f'

def dist(a, b):
    r = math.pi / 180
    x = (b[1] - a[1]) * r * math.cos((a[0] + b[0]) / 2 * r)
    y = (b[0] - a[0]) * r
    return 6371000 * math.hypot(x, y)

def norm(n):
    return re.sub(r'[\s,.\-–_()،]+', '', n)

def colour(c):
    c = (c or '').strip().lower()
    if re.fullmatch(r'#[0-9a-f]{6}', c):
        return c
    return NAMED.get(c)

stations = []  # [ar, lat, lng, en, key, count]
def station(ar, en, lat, lng):
    k = norm(ar)
    for i, s in enumerate(stations):
        if s[4] == k and dist((s[1], s[2]), (lat, lng)) < 150:
            c = s[5]
            s[1] = (s[1] * c + lat) / (c + 1); s[2] = (s[2] * c + lng) / (c + 1); s[5] = c + 1
            if not s[3] and en:
                s[3] = en
            return i
    stations.append([ar, lat, lng, en, k, 1])
    return len(stations) - 1

lines = {}
for r in rels:
    t = r['tags']
    ref = (t.get('ref') or '').strip().upper()
    if t.get('route') != 'bus' or not ref or t.get('state') in ('proposed', 'construction'):
        continue
    pat = []
    for mem in r['members']:
        role = mem.get('role', '')
        if mem['type'] != 'node' or not (role.startswith('stop') or role.startswith('platform')):
            continue
        n = nodes.get(mem['ref'])
        tg = (n or {}).get('tags', {})
        ar = (tg.get('name:ar') or tg.get('name') or '').strip()
        if not n or not ar:
            continue
        i = station(ar, (tg.get('name:en') or '').strip(), n['lat'], n['lon'])
        if not pat or pat[-1] != i:
            pat.append(i)
    if len(pat) < 2:
        continue
    ln = lines.setdefault(ref, {'r': ref, 'm': 'bus', 'c': None, 'p': []})
    ln['c'] = ln['c'] or colour(t.get('colour'))
    if pat not in ln['p']:
        ln['p'].append(pat)

for ln in lines.values():
    ln['c'] = ln['c'] or FALLBACK
    # Tek yönü çizilmiş hatta ters yönü ekle (halka değilse)
    if len(ln['p']) == 1 and ln['p'][0][0] != ln['p'][0][-1]:
        ln['p'].append(list(reversed(ln['p'][0])))

def key(ref):
    m = re.match(r'(\d+)(.*)', ref)
    return (int(m.group(1)), m.group(2)) if m else (999, ref)

out = {
    'v': 1,
    'src': '© OpenStreetMap katkıcıları (ODbL), ' + datetime.date.today().isoformat(),
    's': [[s[0], round(s[1], 5), round(s[2], 5)] + ([s[3]] if s[3] else []) for s in stations],
    'l': [lines[k] for k in sorted(lines, key=key)],
}
json.dump(out, open(dst, 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
print('durak', len(stations), 'hat', len(lines), ' '.join(l['r'] for l in out['l']), 'desen', sum(len(l['p']) for l in out['l']))
