---
name: web-goruntu
description: MATAF'ın web sürümünü dışa aktarıp Playwright ile telefon boyutunda ekran görüntüsü alır (tools/web-shots/shoot.py ve spec JSON), görüntüleri yan yana birleştirir ve gösterir. Ekran, düzen, renk ya da metin değişikliğini görmek; Arapça sağdan sola düzeni, koyu temayı ya da bir paleti denetlemek; iPhone kullanıcılarının gördüğü web sürümünü kontrol etmek; "ekran görüntüsü al", "web'de nasıl görünüyor", "göster" denince bu skilli kullan. Arayüzde görünür bir değişiklik yaptıysan bitti demeden önce de kullan.
---

# Web ekran görüntüsü

iPhone kullanıcıları uygulamayı web sürümünden (GitHub Pages) kullanır. Arayüz değişiklikleri en hızlı burada görülür: dışa aktarma ve çekim birkaç dakika sürer, emülatörün yarım saatini beklemek gerekmez. Telefona özgü şeyler web'de yoktur (kutular, ezan bildirimi, tam pusula); onlar için `duman-testi` skilli.

## Adımlar

1. **Dışa aktar:**
   ```bash
   npx expo export -p web --output-dir /tmp/web
   ```
2. **Spec yaz:** Görüntü başına bir JSON öğesi. Dosyayı scratchpad klasörüne yaz, depoya değil. `tools/web-shots/ornek-spec.json` örnek ve kalıptır.
   ```json
   [
     { "name": "vakitler", "route": "/vakitler", "here": "haram", "wait": 3000 },
     { "name": "vakitler-ar", "route": "/vakitler", "here": "haram", "wait": 3000,
       "extra": "localStorage.setItem('mataf.lang','ar');" }
   ]
   ```
3. **Çek:** Görüntüler `<çıktı>/<name>.png` olur (390×844, 2x).
   ```bash
   python3 tools/web-shots/shoot.py /tmp/web <çıktı-klasörü> <spec.json>
   ```
   Çıktının sonunda her ekran için sayfa hataları (JS) ve tutmayan eylemler yazılır. Bunları oku: tutmayan bir tıklama, görüntünün yanlış ekranı gösterdiği anlamına gelir.
4. **Birleştir:** Karşılaştırma için görüntüleri yan yana koy:
   ```bash
   python3 tools/web-shots/sheet.py <çıktı>/s.png 1000 <çıktı>/a.png <çıktı>/b.png
   ```
5. **Bak:** Görüntüyü Read ile aç ve gerçekten incele: kesilen yazı, taşan kutu, boş alan, yanlış renk, sağdan sola düzende ters duran öğe. Proje sahibinin görmesi gerekiyorsa `SendUserFile` ile gönder.

## Spec alanları

Tam liste `tools/web-shots/shoot.py`'nin başında.

| Alan | Anlamı |
|---|---|
| `name` | dosya adı |
| `route` | açılacak yol: `/`, `/vakitler`, `/mushaf?p=2`, `/ulasim?to=21.4225,39.8262&name=Harem` |
| `here` | taklit konum: `haram`, `nabawi`, `ist` (İstanbul), `masa`, `tren` |
| `city` | `makkah` ya da `madinah` |
| `time` | saat taklidi, ISO: `"2026-11-26T19:40:00+03:00"` (yatsı sonrası gibi durumlar için) |
| `theme` | `theme:prefs` nesnesi. Bütün alanlarıyla ver; `ornek-spec.json`'daki `ana-koyu` öğesinden kopyala. Palet adları: `kabe` (Kiremit), `zumrut`, `gece`, `altin`, `gul`. |
| `extra` | açılıştan önce çalışan JS. Arapça için `localStorage.setItem('mataf.lang','ar');`, İngilizce için `'en'` |
| `wait` | açılıştan sonra bekleme (ms). Gökyüzü ve harita için 3000–3500 |
| `actions` | `["click_text", "metin"]`, `["click_role", "düğme adı"]`, `["fill", "yer tutucu", "yazı", ms]`, `["scroll", px]`, `["wait", ms]` |
| `ua`, `full` | User-Agent; tam sayfa görüntü (uygulamanın kendi kaydırması olduğundan çoğu ekranda işe yaramaz) |

## Taklitler ve sınırlar

- **Photon (yer arama):** Taklit edilir. Arama kutusuna `bagc` yazılırsa Bağcılar Meydan, `harem` yazılırsa Mescid-i Haram, `aise` yazılırsa Ayşe Camii döner.
- **Kur'an:** Sûre listesi taklit edilir, sûre içeriği kapalıdır. Kur'an okuma ve mushaf ekranlarında âyet metni görünmez. Hattın ve âyet işaretlerinin çizimini emülatörde gör (`duman-testi`, görüntü 11 ve 38–39).
- **Overpass:** Kapalıdır. Harita karoları ağa bağlıdır; bulut oturumunda gelmeyebilir.
- **İlk açılış:** Hoş geldiniz ekranı çıkmaz; kayıtlı bir ayraçla başlanır.
- **Arapça:** Web'de sayfa hemen sağdan sola döner. Telefonda yön ancak uygulama yeniden başlayınca döner; telefondaki ters düzen ayrıca emülatörde görülür.

## Hızlı tek ekran

Tek bir ekranı tasarlarken her seferinde dışa aktarmak yavaştır. Bunun yerine `npx expo start --web --port 8081` komutunu arka planda çalıştır. `curl -sf http://localhost:8081` cevap verene dek bekle, sonra Playwright ile aç: viewport 390×844, `deviceScaleFactor: 2`. Bu yolda taklitler yoktur. Son görüntüyü yine `shoot.py` ile al.
