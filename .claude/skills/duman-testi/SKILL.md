---
name: duman-testi
description: MATAF'ın Android emülatör duman testini (android-smoke.yml, scripts/smoke.sh) başlatır, bitmesini bekler, smoke-latest sonuçlarını indirip bitti ölçütlerini denetler ve ekran görüntülerini tek sayfada birleştirir. Kutular (widget), ezan bildirimi ve "Kıldım", vakit alarmları, expo-widgets yaması, izin, derin bağlantı, yazı tipi ya da başka yerel (native) davranış değiştiğinde; bir deneme dalını main'e almadan önce ya da sürüm çıkardıktan sonra; "duman testi", "smoke test", "emülatörde dene", "telefonda nasıl görünüyor" denince bu skilli kullan.
---

# Duman testi (Android emülatör)

GitHub Actions'ta API 34 emülatörü kurulur, APK yüklenir, `scripts/smoke.sh` uygulamayı gezer: sekmeler, 25 ekran, beş kutunun eklenmesi, vakit alarmları, bildirimdeki "Kıldım". Bir tur yaklaşık 25–30 dakika sürer. Sonuçlar "smoke-latest" sürüm sayfasına yüklenir; her tur öncekinin üstüne yazar.

Gerçek telefon denemesi henüz yok; yerel davranışın tek kanıtı bu test. Bu yüzden kutu, bildirim, alarm, yama, izin ya da derin bağlantı değiştiyse "bitti" demeden önce çalıştır.

## Çalıştırma

Tek komut başlatır, bekler ve denetler. Arka planda çalıştır (Bash `run_in_background`); bitince bildirim gelir, ön planda bekleme:

```bash
python3 -I .claude/skills/duman-testi/scripts/smoke_check.py --start main
```

- Deneme dalında: `--start <dal>`. Önce dalı gönder (`git push origin <dal>`); test GitHub'daki son commit'i dener.
- Başlamış bir tur için: `--run <run_id>`. Yalnız son sonuçları yeniden denetlemek için seçeneksiz çalıştır.
- Çıktı klasörü `--out` ile değişir (varsayılan `$TMPDIR/duman-testi`). Kullanıcıya gösterilecek görüntüler için scratchpad klasörünü ver.

Betik sonuçları indirir. Yüklenen dosyaların bu turdan olduğunu tarihleriyle doğrular. Her ölçüt için `OK` ya da `HATA` yazar ve kutu, Kur'an, Kıldım görüntülerinden birleşik resimler üretir. Çıkış kodları: 0 temiz, 1 ölçüt tutmadı, 2 iş akışı başarısız ya da sonuç bulunamadı.

Elle yapmak gerekirse:

```bash
gh workflow run android-smoke.yml -R sozerahmethayri-ops/Mataf --ref main
curl -sSL -o status.txt https://github.com/sozerahmethayri-ops/Mataf/releases/download/smoke-latest/status.txt
```

## Bitti ölçütleri

- `crash.txt` "çökme kaydı yok" ile başlar.
- `status.txt`'te beş kutu satırı da eklendi gösterir: `widget`, `NextPrayerWidget`, `PrayerListWidget`, `PrayerStripWidget`, `PrayerLogWidget`. Değer `1` ya da `dokunma x y` olabilir, `0` olmamalı.
- `vakit alarmı: 24 (farklı an: 24)`
- `kıldım: süreç kapatıldı evet, bildirim önce 1, düğme 1, sonra 0, görev 1`
- `dokununca öndeki` satırında `app.mataf.navigator` geçer: kutuya dokununca uygulama açılır.
- Hiçbir satırda `NOT RUNNING after …` yok.
- Değişen ekranın görüntüsü gözle doğru. Ölçütler geçse de görüntülere mutlaka bak: kutu düzeni, kesilen yazı ve boş çizim yalnız görüntüde görünür.

## Görüntüler

Emülatör ekranı 320×640 dp; gerçek telefonlar daha geniş olduğu için yazılar burada daha erken kesilir. Adlar `screen-<no>-<ad>.png`:

| No | Ekran |
|---|---|
| 01 | ilk açılış (Hoş geldiniz) |
| 02a–02c | Ulaşım haritasının açılışı (10/25/45 sn) |
| 02–06 | alt sekmeler; 07–08 kaydırarak sekme geçişi |
| 11 | Kur'an okuma (Kehf, hatim ayracı): hat ve âyet işaretleri burada görünür |
| 12–35 | sırayla zikir, vakitler, kıble, cami, şehir, ulaşım, tavaf, umre, hac, cemerat, hac-harita, grup, sa'y, otel, acil, kaza, çevrimdışı, navigasyon, ayarlar, hadis-dua, bildirimler, yerlerim, tren, erişim (`-2` ve `-kaydir` ekleri ikinci görüntü) |
| 30–33 | koyu tema, Zümrüt paleti, açık tema, harita teması |
| 36–37 | Mekke otobüs tarifi ve adımları |
| 38–39 | mushaf 2. sayfa, kaydırınca 3. sayfa (yön denetimi) |
| 40–43 | kutu ekleme onayı, ana ekran, kutuya dokununca |
| 44–47 | kare, uzun, tek satır, namaz takibi kutuları eklendikten sonra |
| 48-ana-ekran-0…4 | bütün kutular eklendikten sonra ana ekranın sayfaları |
| 60–61 | "Kıldım" bildirimi ve dokunduktan sonra |

`logcat.txt`, `widget-log.txt` (Glance/kutu günlüğü), `alarm.txt`, `alarm-all.txt`, `alarm-sections.txt` (AlarmManager dökümü) ve `map-log.txt` de aynı sayfada.

## Bilinen aksaklıklar

- **`widget eklendi: 0`:** Başlatıcının ekleme penceresi bazen arkada kalıyor. Bu kod hatası değil, otomasyon aksaklığı; testi yeniden çalıştır. O kutunun kodu son başarılı turdan beri değişmediyse bunu not et.
- **Ana ekran tuşu:** Kutunun konduğu sayfayı her zaman açmıyor. 44–47 boş görünürse `48-ana-ekran-*` sayfalarına bak; `logcat.txt`'te `AddWorkspaceItemsTask` satırı kutunun konduğu sayfayı (`screen=`) gösterir.
- **`vakit alarmı: 34`:** 0.21.0'da bir kez görüldü, yeniden üretilemedi. Tekrarlarsa `alarm-all.txt` ve `alarm-sections.txt` dosyalarında aynı vakte kurulmuş ikinci alarmı (`origWhen`) ara.
- **Yarım kalan tur:** `status.txt` yalnız `running` içeriyorsa tur yarıda kesilmiştir; iş akışının günlüğüne bak (`gh run view <id> --log-failed`).

## Sonucu kaydetme

Temiz turdan sonra CLAUDE.md "Şu anki durum → Doğrulandı" satırına bu turda ilk kez görülen şeyi ekle (ör. "0.22.0'da sayaç saniye saniye işliyor"). Proje sahibine kısa yaz: çökme yok, beş kutu, alarm 24/24, Kıldım, görüntüde ne görüldü. Kullanıcının görmesi gereken birleşik resmi `SendUserFile` ile gönder.

## Akışa adım eklemek

Adımlar `scripts/smoke.sh`'te:
- Yardımcılar: `open "rota?param"` (derin bağlantı `mataf://…`), `step "NN-ad" bekleme_sn` (görüntü alır, uygulama ölmüşse `NOT RUNNING` yazar), `shot "ad"`, `tap x y` (binde birlik konum), `tapText "Metin|Diğer"` (uiautomator ile bul, dokun).
- Yeni ekran görüntüsüne boş bir numara ver. `status.txt`'e yazdığın yeni ölçütü bu skilldeki listeye ve `smoke_check.py`'ye de ekle.
- RN ekranı sürekli güncellendiği için uiautomator çoğu zaman "idle" bekler; metinle dokunma tutmazsa binde birlik konumla dene.
