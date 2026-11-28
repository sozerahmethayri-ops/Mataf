#!/usr/bin/env python3
"""MATAF duman testi: başlat, bitmesini bekle, smoke-latest sonuçlarını indir, ölçütleri denetle,
kutu, Kur'an ve Kıldım görüntülerini birleştir.

Kullanım (depo kökünden; uzun sürer, arka planda çalıştır):
  python3 -I .claude/skills/duman-testi/scripts/smoke_check.py --start main       # başlat + bekle + denetle
  python3 -I .claude/skills/duman-testi/scripts/smoke_check.py --run 46070162034  # bekle + denetle
  python3 -I .claude/skills/duman-testi/scripts/smoke_check.py                    # yalnız son sonuçları denetle
Seçenek: --out KLASÖR (varsayılan $TMPDIR/duman-testi)

Çıkış kodu: 0 temiz, 1 ölçüt tutmadı, 2 iş akışı başarısız ya da sonuç bulunamadı.
Gerekenler: gh (oturum açık), curl; birleşik resim için Pillow (yoksa atlanır).
"""
import argparse
import datetime
import json
import os
import subprocess
import sys
import tempfile
import time

REPO = 'sozerahmethayri-ops/Mataf'
WORKFLOW = 'android-smoke.yml'
BASE = 'https://github.com/' + REPO + '/releases/download/smoke-latest/'
WIDGETS = ['widget', 'NextPrayerWidget', 'PrayerListWidget', 'PrayerStripWidget', 'PrayerLogWidget']
ALARM = 'vakit alarmı: 24 (farklı an: 24)'
KILDIM = 'kıldım: süreç kapatıldı evet, bildirim önce 1, düğme 1, sonra 0, görev 1'
SHEETS = {
    'kutular.png': ['screen-41-widget-ana-ekran'] + ['screen-48-ana-ekran-%d' % i for i in range(5)],
    'kuran.png': ['screen-11-kuran-18', 'screen-38-mushaf-2', 'screen-39-mushaf-cevir'],
    'kildim.png': ['screen-60-kildim-bildirim', 'screen-61-kildim-sonra'],
}
WAIT_LIMIT_S = 75 * 60


def gh(*args):
    r = subprocess.run(['gh'] + list(args), capture_output=True, text=True)
    if r.returncode != 0:
        raise RuntimeError('gh %s: %s' % (' '.join(args[:3]), (r.stderr or r.stdout).strip()[:300]))
    return r.stdout


def when(s):
    return datetime.datetime.fromisoformat(s.replace('Z', '+00:00'))


def start(ref):
    t0 = datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(seconds=10)
    gh('workflow', 'run', WORKFLOW, '-R', REPO, '--ref', ref)
    for _ in range(36):
        time.sleep(5)
        runs = json.loads(gh('run', 'list', '-R', REPO, '--workflow', WORKFLOW, '-L', '5',
                             '--json', 'databaseId,createdAt,headBranch,event'))
        for r in runs:
            if r['event'] == 'workflow_dispatch' and r['headBranch'] == ref and when(r['createdAt']) >= t0:
                return r['databaseId']
    raise RuntimeError('başlatılan tur bulunamadı (ref %s)' % ref)


def wait(run_id):
    t0 = time.time()
    while True:
        d = json.loads(gh('run', 'view', str(run_id), '-R', REPO, '--json', 'status,conclusion,createdAt,headSha,url'))
        if d['status'] == 'completed':
            return d
        if time.time() - t0 > WAIT_LIMIT_S:
            raise RuntimeError('tur %d dakikada bitmedi: %s' % (WAIT_LIMIT_S // 60, d['url']))
        time.sleep(60)


def assets():
    out = gh('api', 'repos/%s/releases/tags/smoke-latest' % REPO, '--jq', '.assets[] | [.name, .updated_at] | @tsv')
    res = {}
    for line in out.splitlines():
        parts = line.split('\t')
        if len(parts) == 2:
            res[parts[0]] = when(parts[1])
    return res


def fetch(name, out):
    path = os.path.join(out, name)
    r = subprocess.run(['curl', '-sSLf', '-m', '120', '-o', path, BASE + name], capture_output=True, text=True)
    return path if r.returncode == 0 and os.path.exists(path) else None


def read(path):
    with open(path, encoding='utf-8', errors='replace') as f:
        return f.read()


def sheet(out, name, files):
    try:
        from PIL import Image
    except ImportError:
        return None
    ims = [Image.open(f).convert('RGB') for f in files if f]
    if not ims:
        return None
    w = 320
    ims = [im.resize((w, int(im.height * w / im.width))) for im in ims]
    h = max(im.height for im in ims)
    s = Image.new('RGB', (w * len(ims) + 8 * (len(ims) - 1), h), (255, 255, 255))
    for i, im in enumerate(ims):
        s.paste(im, (i * (w + 8), 0))
    path = os.path.join(out, name)
    s.save(path)
    return path


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--start', metavar='REF')
    ap.add_argument('--run', type=int)
    ap.add_argument('--out', default=os.path.join(tempfile.gettempdir(), 'duman-testi'))
    a = ap.parse_args()
    os.makedirs(a.out, exist_ok=True)

    run_id, since = a.run, None
    if a.start:
        run_id = start(a.start)
        print('başlatıldı: https://github.com/%s/actions/runs/%d' % (REPO, run_id), flush=True)
    if run_id:
        d = wait(run_id)
        since = when(d['createdAt'])
        print('tur %d: %s (%s, commit %s)' % (run_id, d['conclusion'], d['url'], d['headSha'][:7]))
        if d['conclusion'] != 'success':
            print('SONUÇ: İŞ AKIŞI BAŞARISIZ. Günlük: gh run view %d -R %s --log-failed' % (run_id, REPO))
            return 2

    stamps = assets()
    if 'status.txt' not in stamps:
        print('SONUÇ: smoke-latest sayfasında status.txt yok')
        return 2
    if since and stamps['status.txt'] < since:
        print('SONUÇ: status.txt bu turdan eski (%s < %s); yükleme adımı başarısız olmuş olabilir'
              % (stamps['status.txt'].isoformat(), since.isoformat()))
        return 2
    print('sonuç dosyaları: %s (status.txt yüklenme anı)' % stamps['status.txt'].isoformat())

    crash_p, status_p = fetch('crash.txt', a.out), fetch('status.txt', a.out)
    if not crash_p or not status_p:
        print('SONUÇ: crash.txt ya da status.txt indirilemedi')
        return 2
    crash, status = read(crash_p), read(status_p)
    lines = [x.strip() for x in status.splitlines()]

    results = []

    def ok(cond, label, detail=''):
        results.append(cond)
        print(('OK    ' if cond else 'HATA  ') + label + (('  [' + detail + ']') if detail else ''))

    first = crash.strip().splitlines()[0] if crash.strip() else ''
    ok(first.startswith('çökme kaydı yok'), 'çökme yok', first[:120])
    for w in WIDGETS:
        line = next((x for x in lines if x.startswith(w + ' eklendi: ')), '')
        val = line.split(': ', 1)[1] if line else ''
        ok(val not in ('', '0'), (w + ' eklendi'), val or 'satır yok')
        if val == '0':
            print('      bilinen aksaklık olabilir: başlatıcı penceresi arkada kaldı; testi yeniden çalıştır')
    alarm = next((x for x in lines if x.startswith('vakit alarmı')), 'satır yok')
    ok(ALARM in lines, 'vakit alarmı 24 (farklı an 24)', alarm)
    kildim = next((x for x in lines if x.startswith('kıldım')), 'satır yok')
    ok(KILDIM in lines, 'Kıldım arka planda işliyor', kildim)
    tap = next((x for x in lines if x.startswith('dokununca öndeki')), '')
    ok('app.mataf.navigator' in tap, 'kutuya dokununca uygulama açılıyor', ' '.join(tap.split()[-3:]) or 'satır yok')
    dead = [x for x in lines if x.startswith('NOT RUNNING')]
    ok(not dead, 'uygulama tur boyunca açık', '; '.join(dead))

    print('görüntüler (%s):' % a.out)
    for name, shots in SHEETS.items():
        files = [fetch(s + '.png', a.out) for s in shots if (s + '.png') in stamps]
        p = sheet(a.out, name, files)
        print('  ' + (p or name + ': birleştirilemedi (Pillow yok ya da görüntü yok)'))
    print('Görüntülere bak: ölçütler geçse de kesilen yazı ve boş çizim yalnız görüntüde görünür.')
    clean = all(results)
    print('SONUÇ: ' + ('TEMİZ' if clean else 'SORUNLU'))
    return 0 if clean else 1


if __name__ == '__main__':
    try:
        sys.exit(main())
    except RuntimeError as e:
        print('SONUÇ: HATA: %s' % e)
        sys.exit(2)
