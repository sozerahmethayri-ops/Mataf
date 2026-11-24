#!/usr/bin/env python3
"""OpenStreetMap 3D bina verisini (Overpass JSON, `out geom`) uygulamanın sıkıştırılmış biçimine çevirir.

Kullanım:
  python3 scripts/osm3d_encode.py girdi.json --lat 21.4225165 --lon 39.826182 [--outline REL_ID] > cikti.txt

Biçim için src/data/osm/haram3d.ts başlığına, ayrıntılar için scripts/osm-3d.md'ye bakın.
Veri: © OpenStreetMap katkıcıları, ODbL 1.0.
"""
import argparse
import json
import math
import sys

ROOF = {'flat': 'F', 'dome': 'D', 'skillion': 'S', 'pyramidal': 'P', 'gabled': 'G', 'hipped': 'H', 'onion': 'O',
        'round': 'R', 'cone': 'C', 'mansard': 'M', 'gambrel': 'B'}


def num(v, default=None):
    if v is None:
        return default
    try:
        return float(str(v).replace('m', '').replace(',', '.').split(';')[0].strip())
    except ValueError:
        return default


def area(p):
    return sum(p[i][0] * p[(i + 1) % len(p)][1] - p[(i + 1) % len(p)][0] * p[i][1] for i in range(len(p))) / 2


def local(lat0, lon0):
    kx = 111320 * math.cos(math.radians(lat0))
    return lambda g: (round((g['lon'] - lon0) * kx * 10), round(-(g['lat'] - lat0) * 110574 * 10))


def ring_of(geom, to_dm):
    pts = [to_dm(g) for g in geom]
    if len(pts) > 1 and pts[0] == pts[-1]:
        pts = pts[:-1]
    out = []
    for p in pts:  # ardışık tekrarları at
        if not out or out[-1] != p:
            out.append(p)
    return out


def delta(pts):
    v = [pts[0][0], pts[0][1]]
    for a, b in zip(pts, pts[1:]):
        v += [b[0] - a[0], b[1] - a[1]]
    return ' '.join(str(x) for x in v)


def as_circle(pts):
    """Düzgün çokgense (≥6 köşe, yarıçap ve açı aralığı sabit) (cx, cy, r, n, açı°) döndürür."""
    n = len(pts)
    if n < 6:
        return None
    cx = sum(p[0] for p in pts) / n
    cy = sum(p[1] for p in pts) / n
    rs = [math.hypot(p[0] - cx, p[1] - cy) for p in pts]
    r = sum(rs) / n
    if r < 5 or max(abs(x - r) for x in rs) > 0.04 * r:
        return None
    angs = [math.atan2(p[1] - cy, p[0] - cx) for p in pts]
    step = 2 * math.pi / n
    sign = 1 if area(pts) > 0 else -1
    for a, b in zip(angs, angs[1:]):
        d = (b - a) * sign % (2 * math.pi)
        if abs(d - step) > 0.08:
            return None
    if sign < 0:
        return None  # çözücü pozitif yönde üretir; ters yönlüyü çokgen olarak bırak
    return round(cx), round(cy), round(r), n, round(math.degrees(angs[0]))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('json')
    ap.add_argument('--lat', type=float, required=True)
    ap.add_argument('--lon', type=float, required=True)
    ap.add_argument('--outline', type=int, help='dış hat ilişkisi (relation) kimliği: o/i satırları')
    a = ap.parse_args()
    to_dm = local(a.lat, a.lon)
    els = json.load(open(a.json))['elements']
    pal = []

    def col(c):
        if not c:
            return '-'
        c = c.strip().lower()
        if c not in pal:
            pal.append(c)
        return str(pal.index(c))

    lines = []
    for e in els:
        if e['type'] == 'relation' and a.outline and e['id'] == a.outline:
            for m in e.get('members', []):
                if m.get('geometry') and m['role'] in ('outer', 'inner'):
                    lines.append(('o' if m['role'] == 'outer' else 'i') + ' ' + delta(ring_of(m['geometry'], to_dm)))
    for e in els:
        t = e.get('tags', {})
        if e['type'] != 'way' or not e.get('geometry'):
            continue
        if t.get('man_made') == 'minaret' or (t.get('building') == 'minaret' and not t.get('building:part')):
            pts = ring_of(e['geometry'], to_dm)
            cx = round(sum(p[0] for p in pts) / len(pts))
            cy = round(sum(p[1] for p in pts) / len(pts))
            lines.append(f"m {cx} {cy} {round(num(t.get('height'), 70) * 10)}")
            continue
        if not (t.get('building:part') or t.get('building')):
            continue
        pts = ring_of(e['geometry'], to_dm)
        if len(pts) < 3:
            continue
        a_m2 = abs(area(pts)) / 100
        levels = num(t.get('building:levels'))
        h1 = num(t.get('height'), levels * 3.3 if levels else (6 if a_m2 < 300 else 33))
        h0 = num(t.get('min_height'), (num(t.get('building:min_level'), 0) or 0) * 3.3)
        shape = ROOF.get(t.get('roof:shape', 'flat'), 'F')
        rh = num(t.get('roof:height'), 0)
        rd = num(t.get('roof:direction'))
        head = f"{round(h0 * 10)} {round(h1 * 10)} {shape} {round(rh * 10)} {'-' if rd is None else round(rd)} " \
               f"{col(t.get('building:colour'))} {col(t.get('roof:colour'))}"
        if area(pts) < 0:
            pts = pts[::-1]
        c = as_circle(pts)
        lines.append(head + (f" c {c[0]} {c[1]} {c[2]} {c[3]} {c[4]}" if c else f" p {delta(pts)}"))
    print('pal ' + ' '.join(pal))
    print('\n'.join(lines))


if __name__ == '__main__':
    sys.exit(main())
