"""Mescitlerin 1,3 km çevresindeki bina tabanlarını ve yolları (OSM) 3B sahnenin zemin katmanına çevirir.

Sorgu (scripts/osm-3d.md "Geniş çevre"), sonuç "osm-data" sürümündeki out.json:
  python3 -I scripts/osm_context.py out.json > src/data/osm/context.ts

- Binalar: kapalı yollar; 3B sahnede zaten olanlar (Mekke'de 700 m, Medine'de 600 m içinde ve yüksekliği olan)
  atlanır. Taban 1,2 m hoşgörüyle sadeleşir, 40 m²'den küçükler atılır. Sınıf: 0 alçak/bilinmiyor, 1 orta
  (15–45 m), 2 yüksek (45 m üstü); yükseklik `height` ya da kat × 3,2 m.
- Yollar: tünel olmayan araç ve yaya yolları; sınıf (genişlik) 0 ana (14 m), 1 ikincil (10 m), 2 üçüncül ve yaya
  (8 m), 3 mahalle (6 m), 4 servis (4 m). 1,5 m hoşgörüyle sadeleşir.
- Kodlama: her sınıf bir dizgi; öğeler ';', noktalar ' ', x ve y ',' ile ayrılır. Metre, sites.ts'teki yerel
  düzlem (x doğu, y güney).
Veri © OpenStreetMap katkıcıları, ODbL 1.0.
"""
import json
import math
import sys
from datetime import date

ANCHORS = {'makkah': (21.4225165, 39.826182), 'madinah': (24.4675, 39.6114)}
R3D = {'makkah': 700, 'madinah': 600}
M = 111320
ROAD = {'trunk': 0, 'primary': 0, 'secondary': 1, 'tertiary': 2, 'pedestrian': 2, 'residential': 3, 'unclassified': 3,
        'living_street': 3, 'service': 4}


def local(city, lat, lon):
    a = ANCHORS[city]
    return ((lon - a[1]) * M * math.cos(math.radians(a[0])), -(lat - a[0]) * M)


def dp(pts, tol):
    if len(pts) < 3:
        return pts
    (x0, y0), (x1, y1) = pts[0], pts[-1]
    dx, dy = x1 - x0, y1 - y0
    n = math.hypot(dx, dy) or 1e-9
    best, idx = 0.0, 0
    for i in range(1, len(pts) - 1):
        d = abs(dy * pts[i][0] - dx * pts[i][1] + x1 * y0 - y1 * x0) / n
        if d > best:
            best, idx = d, i
    if best <= tol:
        return [pts[0], pts[-1]]
    return dp(pts[: idx + 1], tol)[:-1] + dp(pts[idx:], tol)


def area(pts):
    return abs(sum(pts[i][0] * pts[i - 1][1] - pts[i - 1][0] * pts[i][1] for i in range(len(pts)))) / 2


def height(t):
    try:
        if 'height' in t:
            return float(t['height'].split()[0].replace(',', '.'))
        if 'building:levels' in t:
            return float(t['building:levels']) * 3.2
    except ValueError:
        pass
    return None


def enc(items):
    return ';'.join(' '.join(f'{round(x)},{round(y)}' for x, y in it) for it in items)


def main():
    els = json.load(open(sys.argv[1], encoding='utf-8'))['elements']
    out = {c: {'b': [[], [], []], 'r': [[], [], [], [], []]} for c in ANCHORS}
    for e in els:
        g, t = e.get('geometry') or [], e.get('tags') or {}
        if len(g) < 2:
            continue
        city = 'makkah' if g[0]['lat'] < 23 else 'madinah'
        pts = [local(city, p['lat'], p['lon']) for p in g]
        if 'building' in t:
            if len(pts) < 4 or pts[0] != pts[-1]:
                continue
            cx = sum(p[0] for p in pts) / len(pts)
            cy = sum(p[1] for p in pts) / len(pts)
            h = height(t)
            if h is not None and math.hypot(cx, cy) < R3D[city]:
                continue  # 3B sahnede var
            # Kapalı halkada uçlar aynı nokta: en uzak noktadan ikiye bölüp sadeleştir
            far = max(range(len(pts)), key=lambda i: math.hypot(pts[i][0] - pts[0][0], pts[i][1] - pts[0][1]))
            ring = (dp(pts[: far + 1], 1.2)[:-1] + dp(pts[far:], 1.2))[:-1]
            ring = [(round(x), round(y)) for x, y in ring]
            ring = [p for i, p in enumerate(ring) if i == 0 or p != ring[i - 1]]
            if len(ring) < 3 or area(ring) < 40:
                continue
            cls = 0 if h is None or h < 15 else 1 if h <= 45 else 2
            out[city]['b'][cls].append(ring)
        elif t.get('highway') in ROAD and t.get('area') != 'yes':
            line = [(round(x), round(y)) for x, y in dp(pts, 1.5)]
            line = [p for i, p in enumerate(line) if i == 0 or p != line[i - 1]]
            if len(line) >= 2:
                out[city]['r'][ROAD[t['highway']]].append(line)
    print(f"// Mescitlerin 1,3 km çevresindeki bina tabanları ve yollar: OpenStreetMap (© OpenStreetMap katkıcıları, ODbL), {date.today().isoformat()}.")
    print('// scripts/osm_context.py üretir; elle değiştirme. b: bina sınıfları (alçak, orta, yüksek), r: yol sınıfları (ana → servis).')
    print("export const CONTEXT: Record<'makkah' | 'madinah', { b: string[]; r: string[] }> = {")
    for c, d in out.items():
        print(f'  {c}: {{')
        print('    b: [' + ', '.join(json.dumps(enc(x)) for x in d['b']) + '],')
        print('    r: [' + ', '.join(json.dumps(enc(x)) for x in d['r']) + '],')
        print('  },')
    print('};')
    for c, d in out.items():
        print(f"{c}: binalar {[len(x) for x in d['b']]}, yollar {[len(x) for x in d['r']]}", file=sys.stderr)


if __name__ == '__main__':
    main()
