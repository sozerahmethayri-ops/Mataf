#!/usr/bin/env python3
"""MATAF sürüm numarasını yükseltir; dosyaların biçimine dokunmaz, yalnız ilgili satırları değiştirir.

Değişen yerler:
  package.json        "version"
  package-lock.json   en üstteki iki "version" (kök ve packages[""])
  app.json            expo.version ve expo.android.versionCode (+1)
  README.md           "> Durum: **X.Y.Z — …" satırı
  CLAUDE.md           "Sürüm X.Y.Z (versionCode N)" ve "## Tamamlanan özellikler (X.Y.Z)"

Kullanım (depo kökünden):
  python3 -I .claude/skills/surum-cikar/scripts/bump_version.py 0.22.1 --dry-run   # yalnız göster
  python3 -I .claude/skills/surum-cikar/scripts/bump_version.py 0.22.1
"""
import json
import re
import sys

VER = r'\d+\.\d+\.\d+'


def load(path):
    with open(path, encoding='utf-8') as f:
        return f.read()


def sub(text, pattern, repl, count, label):
    new, n = re.subn(pattern, repl, text, count=count)
    if n != count:
        raise SystemExit('%s: %d yer bekleniyordu, %d bulundu' % (label, count, n))
    return new


def main():
    args = [a for a in sys.argv[1:] if a != '--dry-run']
    dry = '--dry-run' in sys.argv[1:]
    if len(args) != 1 or not re.fullmatch(VER, args[0]):
        raise SystemExit('kullanım: bump_version.py X.Y.Z [--dry-run]')
    new = args[0]

    pkg = load('package.json')
    old = json.loads(pkg)['version']
    if tuple(map(int, new.split('.'))) <= tuple(map(int, old.split('.'))):
        raise SystemExit('yeni sürüm (%s) eskisinden (%s) büyük olmalı' % (new, old))
    files = {}
    files['package.json'] = sub(pkg, r'("version":\s*")' + VER + '"', r'\g<1>' + new + '"', 1, 'package.json')

    lock = sub(load('package-lock.json'), r'("version":\s*")' + VER + '"', r'\g<1>' + new + '"', 2, 'package-lock.json')
    lj = json.loads(lock)
    if lj['version'] != new or lj['packages']['']['version'] != new:
        raise SystemExit('package-lock.json: ilk iki "version" kök ve packages[""] değil; elle bak')
    files['package-lock.json'] = lock

    app = load('app.json')
    code = json.loads(app)['expo']['android']['versionCode']
    app = sub(app, r'("version":\s*")' + VER + '"', r'\g<1>' + new + '"', 1, 'app.json version')
    app = sub(app, r'("versionCode":\s*)\d+', r'\g<1>' + str(code + 1), 1, 'app.json versionCode')
    aj = json.loads(app)['expo']
    if aj['version'] != new or aj['android']['versionCode'] != code + 1:
        raise SystemExit('app.json: değişiklik expo.version/versionCode alanına düşmedi; elle bak')
    files['app.json'] = app

    notes = []
    readme = load('README.md')
    r2, n = re.subn(r'(> Durum: \*\*)' + VER, r'\g<1>' + new, readme, count=1)
    files['README.md'] = r2
    if n != 1:
        notes.append('README.md: "> Durum: **X.Y.Z" satırı bulunamadı; elle güncelle')
    cl = load('CLAUDE.md')
    cl, n1 = re.subn(r'Sürüm ' + VER + r' \(versionCode \d+\)', 'Sürüm %s (versionCode %d)' % (new, code + 1), cl, count=1)
    cl, n2 = re.subn(r'(## Tamamlanan özellikler \()' + VER + r'\)', r'\g<1>' + new + ')', cl, count=1)
    files['CLAUDE.md'] = cl
    if n1 != 1:
        notes.append('CLAUDE.md: "Sürüm X.Y.Z (versionCode N)" bulunamadı; elle güncelle')
    if n2 != 1:
        notes.append('CLAUDE.md: "## Tamamlanan özellikler (X.Y.Z)" bulunamadı; elle güncelle')

    print('sürüm %s → %s, versionCode %d → %d%s' % (old, new, code, code + 1, ' (deneme, yazılmadı)' if dry else ''))
    for path, text in files.items():
        changed = text != load(path)
        print('  %-18s %s' % (path, 'değişti' if changed else 'aynı'))
        if changed and not dry:
            with open(path, 'w', encoding='utf-8') as f:
                f.write(text)
    for n in notes:
        print('UYARI: ' + n)
    print('Sırada: README değişiklik günlüğüne madde, CLAUDE.md ayrıntıları, commit "%s: …".' % new)


if __name__ == '__main__':
    main()
