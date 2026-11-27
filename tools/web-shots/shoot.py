"""Web sürümünden telefon boyutunda ekran görüntüsü alır (Playwright + Chromium, 390×844, 2x).

Kullanım:
  npx expo export -p web --output-dir /tmp/web
  python3 tools/web-shots/shoot.py /tmp/web /tmp/shots tools/web-shots/ornek-spec.json
  python3 tools/web-shots/sheet.py /tmp/shots/s.png 1000 /tmp/shots/a.png /tmp/shots/b.png   # yan yana

Gerekenler: pip install playwright pillow && playwright install chromium
(CHROME_PATH verilirse o tarayıcı kullanılır.)

Spec: JSON dizi; her öğe bir görüntü:
  name    dosya adı (name.png)
  route   açılacak yol, ör. "/", "/vakitler", "/ulasim?to=21.4225,39.8262&name=Harem"
  here    konum: haram | ist | nabawi | masa | tren (Haremeyn treni Mekke istasyonu)
  time    saat taklidi, ISO (ör. "2026-11-26T19:40:00+03:00")
  city    mataf.city (makkah | madinah)
  theme   theme:prefs nesnesi (ör. {"mode": "dark", "palette": "kabe"})
  extra   açılıştan önce çalışacak JS (ör. "localStorage.setItem('mataf.lang','ar');")
  ua      User-Agent (ör. iPhone Safari)
  wait    açılıştan sonra bekleme, ms
  full    tam sayfa görüntü (uygulamanın kendi kaydırması olduğundan çoğu ekranda işe yaramaz)
  actions [["fill", "yer tutucu metni", "yazı", ms], ["click_text", "metin", tam_eşleşme?, ms],
           ["click_role", "düğme adı"], ["scroll", px], ["wait", ms]]
Ağ: Photon (arama, ters arama), alquran listesi taklit edilir; Overpass ve sûre içerikleri kapalıdır.
Arama taklidi: "bagc" → Bağcılar Meydan, "harem" → Mescid-i Haram, "aise" → Ayşe Camii (Ten'im).
İlk açılış ekranı (Hoş geldiniz) çıkmaz: kayıtlı bir ayar (quran:bookmarks) yazılı başlar.
Çıktının sonunda ekran başına sayfa hataları (JS) ve başarısız eylemler yazılır.
"""
import asyncio
import datetime
import json
import os
import subprocess
import sys
import time

from playwright.async_api import async_playwright

WEB, OUT, SPEC_PATH = sys.argv[1], sys.argv[2], sys.argv[3]
PORT = 8771
CORS = {'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*', 'Content-Type': 'application/json'}

HARAM = (21.42295, 39.82625)
NABAWI = (24.4672, 39.6111)
IST = (41.0369, 28.9850)
MASA = (21.4240, 39.8272)
TREN = (21.4164, 39.7896)
PLACES = {'haram': HARAM, 'ist': IST, 'nabawi': NABAWI, 'masa': MASA, 'tren': TREN}

# Sûrelerin ayet sayıları (Kur'an listesi taklidi için)
AY = [7,286,200,176,120,165,206,75,129,109,123,111,43,52,99,128,111,110,98,135,112,78,118,64,77,227,93,88,69,60,34,30,73,54,45,83,182,88,75,85,54,53,89,59,37,35,38,29,18,45,60,49,62,55,78,96,29,22,24,13,14,11,11,18,12,12,30,52,52,44,28,28,20,56,40,31,50,40,46,42,29,19,36,25,22,17,19,26,30,20,15,21,11,8,8,19,5,8,8,11,11,8,3,9,5,4,7,3,6,3,5,4,5,6]
BOOK = {'items': [{'id': 'hatim', 'name': 'Hatim', 'surah': 18, 'ayah': 45, 'at': 0, 'hatim': True}, {'id': 'b1', 'name': 'Cuma okuması', 'surah': 1, 'ayah': 4, 'at': 1}]}

SEARCH = [  # (anahtar parçalar, lng, lat, ad, osm_key, osm_value, şehir)
    (('bagc', 'ba%c4%9fc'), 28.8567, 41.0397, 'Bağcılar Meydan', 'railway', 'station', 'İstanbul'),
    (('harem',), 39.8262, 21.4225, 'Mescid-i Haram', 'amenity', 'place_of_worship', 'Makkah'),
    (('aise', 'a%c4%b1%c5%9fe', 'aisha'), 39.8007, 21.4676, "Ayşe Camii (Ten'im)", 'amenity', 'place_of_worship', 'Makkah'),
]


async def fulfill(route, feats):
    await route.fulfill(status=200, headers=CORS, body=json.dumps({'features': feats}))


async def mocks(pg, here):
    async def photon_rev(route):
        url = route.request.url
        if 'osm_tag' in url:
            feats = []
            if 'hospital' in url:
                for i, (dl, dn, nm) in enumerate([(0.004, 0.003, 'Ajyad Emergency Hospital'), (-0.01, 0.006, 'King Abdulaziz Hospital'), (0.012, -0.008, 'Al Noor Specialist Hospital')]):
                    feats.append({'geometry': {'coordinates': [here[1] + dn, here[0] + dl]}, 'properties': {'osm_type': 'W', 'osm_id': 200 + i, 'name': nm, 'osm_key': 'amenity', 'osm_value': 'hospital', 'city': 'Makkah'}})
            if 'place_of_worship' in url:
                for i, (dl, dn, nm) in enumerate([(0.002, 0.001, 'Kılıç Ali Paşa Camii'), (-0.003, 0.002, 'Ağa Hamamı Mescidi'), (0.004, -0.003, 'Cihangir Camii'), (0.006, 0.004, 'Firuz Ağa Camii')]):
                    feats.append({'geometry': {'coordinates': [here[1] + dn, here[0] + dl]}, 'properties': {'osm_type': 'N', 'osm_id': 100 + i, 'name': nm, 'osm_key': 'amenity', 'osm_value': 'place_of_worship', 'religion': 'muslim'}})
            await fulfill(route, feats)
            return
        await fulfill(route, [{'geometry': {'coordinates': [here[1], here[0]]}, 'properties': {'osm_type': 'N', 'osm_id': 9, 'name': 'Swissôtel Al Maqam', 'street': 'Ibrahim Al Khalil', 'district': 'Ajyad', 'city': 'Makkah', 'country': 'Saudi Arabia'}}])

    async def photon(route):
        u = route.request.url.lower()
        for keys, lng, lat, name, key, value, city in SEARCH:
            if any(k in u for k in keys):
                await fulfill(route, [{'geometry': {'coordinates': [lng, lat]}, 'properties': {'osm_type': 'W', 'osm_id': 70, 'name': name, 'osm_key': key, 'osm_value': value, 'religion': 'muslim', 'city': city}}])
                return
        await fulfill(route, [{'geometry': {'coordinates': [here[1] + 0.0015, here[0] + 0.001]}, 'properties': {'osm_type': 'W', 'osm_id': 1, 'name': 'Kılıç Ali Paşa Camii', 'osm_key': 'amenity', 'osm_value': 'place_of_worship', 'religion': 'muslim'}}])

    async def quran_list(route):
        data = [{'number': i + 1, 'name': 'سُورَةُ', 'englishName': f'Surah {i + 1}', 'numberOfAyahs': AY[i], 'revelationType': 'Meccan' if i % 3 else 'Medinan'} for i in range(114)]
        await route.fulfill(status=200, headers=CORS, body=json.dumps({'data': data}))

    async def fail(route):
        await route.abort()

    await pg.route('**/photon.komoot.io/reverse*', photon_rev)
    await pg.route('**/photon.komoot.io/api/*', photon)
    await pg.route('**/api.alquran.cloud/v1/surah', quran_list)
    await pg.route('**/api.alquran.cloud/v1/surah/**', fail)
    await pg.route('**/overpass**', fail)


async def nav(pg, route, wait):
    await pg.goto(f'http://localhost:{PORT}/', wait_until='networkidle')
    if route != '/':
        await pg.evaluate(f"window.history.pushState(null,'', '{route}'); window.dispatchEvent(new PopStateEvent('popstate'))")
    await pg.wait_for_timeout(wait)


async def context(browser, sh):
    here = PLACES.get(sh.get('here', 'haram'), HARAM)
    ua = sh.get('ua')
    c = await browser.new_context(viewport={'width': 390, 'height': 844}, device_scale_factor=2, has_touch=True,
                                  **({'user_agent': ua} if ua else {}),
                                  geolocation={'latitude': here[0], 'longitude': here[1], 'accuracy': 8}, permissions=['geolocation'])
    init = (f"localStorage.setItem('mataf.city','{sh.get('city', 'makkah')}');localStorage.setItem('mataf.lang','tr');"
            f"localStorage.setItem('quran:bookmarks', {json.dumps(json.dumps(BOOK))});" + sh.get('extra', ''))
    if sh.get('theme'):
        init += f"localStorage.setItem('theme:prefs', JSON.stringify({json.dumps(sh['theme'])}));"
    await c.add_init_script(init)
    pg = await c.new_page()
    errs = []
    pg.on('pageerror', lambda e: errs.append(str(e)))
    await mocks(pg, here)
    return c, pg, errs


async def act(pg, a):
    if a[0] == 'click_text':
        await pg.get_by_text(a[1], exact=a[2] if len(a) > 2 and isinstance(a[2], bool) else False).first.click()
    elif a[0] == 'click_role':
        await pg.get_by_role('button', name=a[1]).first.click()
    elif a[0] == 'fill':
        await pg.get_by_placeholder(a[1]).fill(a[2])
    elif a[0] == 'scroll':
        await pg.mouse.move(195, 600)
        await pg.mouse.wheel(0, a[1])
    wait = a[-1] if isinstance(a[-1], int) and not isinstance(a[-1], bool) and a[0] != 'scroll' else 900
    await pg.wait_for_timeout(wait)


async def main():
    spec = json.load(open(SPEC_PATH, encoding='utf-8'))
    os.makedirs(OUT, exist_ok=True)
    async with async_playwright() as p:
        browser = await p.chromium.launch(executable_path=os.environ.get('CHROME_PATH') or None, args=['--no-sandbox'])
        problems = {}
        for sh in spec:
            c, pg, errs = await context(browser, sh)
            if sh.get('time'):
                await pg.clock.install(time=datetime.datetime.fromisoformat(sh['time']))
            await nav(pg, sh.get('route', '/'), sh.get('wait', 2500))
            for a in sh.get('actions', []):
                try:
                    await act(pg, a)
                except Exception as e:  # eylem başarısızsa görüntü yine alınır
                    errs.append(f'eylem {a}: {str(e)[:120]}')
            await pg.screenshot(path=f"{OUT}/{sh['name']}.png", full_page=sh.get('full', False))
            if errs:
                problems[sh['name']] = errs[:4]
            await c.close()
        print(json.dumps(problems, ensure_ascii=False, indent=1)[:3000])
        await browser.close()


server = subprocess.Popen([sys.executable, '-m', 'http.server', str(PORT), '--directory', WEB], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
time.sleep(1)
try:
    asyncio.run(main())
finally:
    server.terminate()
