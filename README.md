# MATAF — Mescid-i Haram ve Mescid-i Nebevî navigasyon uygulaması

Mekke ve Medine'deki ziyaretçiler için iOS ve Android uygulaması:

- **Sade açılış: ezan vakitleri** — bir sonraki vakte geri sayım halkası, günün altı vakti, Hicrî tarih ve yaklaşan mübarek gün (Kandiller, Ramazan, Bayramlar); konumunuza, Mekke'ye ya da Medine'ye göre. Ana sayfa olarak başka ekran da seçilebilir (Vakitler, Kur'an, Harita, Tavaf, Zikir, Hadis).
- **Alt çubuk ve Menü** — ortada Ana sayfa; Harita, Kur'an, Ulaşım ve tüm ekranların toplandığı Menü. Sekmeler arasında kaydırarak geçilir.
- **Uygulama içi online harita** — şehir, ulaşım ve en yakın cami haritaları OpenStreetMap verisiyle (OpenFreeMap) uygulamanın içinde açılır: binalar, sokaklar, mezarlıklar, yer adları; 2D/3D düğmesi binaları yükseltir. İnternet yoksa sade haritaya geçer.
- **Zikirmatik** — hazır zikirler ya da kendi zikriniz, hedef (33, 99, 100, 500, 1000, sınırsız), namaz sonrası 33-33-34 tesbihat sırası, titreşim; biten zikirler notla deftere kaydedilir.
- **Ayrıntılı ayarlar** — yazı boyutu ve Arapça yazı boyutu (önizlemeli), ana sayfa seçimi, harita 2D/3D, kaydırarak geçiş, hareketleri azalt, titreşim.
- **Beytullah'ın ayrıntılı 3D modeli** — gerçek ölçü ve yönde Kâbe: ışıkla gölgelenen kisve ve dokusu, altın işlemeli kuşak (hizâm) ve kandiller, kapı ve kapı perdesi (sitâre), gümüş çerçeveli Hacerü'l-Esved, Şâzervân mermer eteği, mermer çatı, altın oluk (Mîzâb), Hatîm duvarı ve Makam-ı İbrâhîm; yere düşen gölge. Harita hangi yöne döndürülürse döndürülsün doğru çizilir, uzakta sadeleşir, yakında ayrıntılanır; koyu temada altın ve örtü gerçek renginde kalır.
- **Gerçek 3D silüet (OpenStreetMap)** — Mescid-i Haram ve Mescid-i Nebevî, OpenStreetMap'in 3D bina verisinden birebir yer, yükseklik ve çatı biçimiyle çizilir: Haram'ın dış hattı ve Mataf avlusu, Mataf halkası, Mes'a, Kral Abdullah genişlemesi, 13 minare (katları, şerefeleri ve kameriye sütunlarıyla), kubbeler ve Ebrâcü'l-Beyt (Saat Kulesi, 601 m; dört kadran ve hilâl). Nebevî'de gerçek dış hat, 10 minare (104 m ve 70 m), Yeşil Kubbe, meydandaki şemsiyeler, çevredeki oteller ve Cennetü'l-Bakî. Cephelerde kemer dizileri; koyu temada pencereler içeriden aydınlanır.
- **Gerçek ölçekli 3D harita** — metre cinsinden, 100 m ölçek çubuğu. **İki parmakla büyütülür ve döndürülür**; her açıdan doğru ön–arka sırası; pusula düğmesi kuzeyi yukarı alır / eğik görünüme döner. Kapılar OSM'deki gerçek giriş noktalarında; yürüme rotası binaların içinden değil çevresinden geçer.
- **Kapı kapanmalarına göre rota** — ziyaretçiler kapı durumunu bildirir, yorum yazar, onaylar; kapalı kapılar rotadan otomatik çıkar. Resmî duyuru her zaman önceliklidir.
- **Turuncu izle navigasyon** — sıradaki dönüş, kalan mesafe, kapı kapanınca "rota güncellendi" uyarısı. Mescid çevresinde değilseniz uygulama kendi kendine yürümez: uzaklığı gösterir, "Önizleme" ile örnek rota izlenebilir.
- **Haram/Nebevî haritasında 2D/3D** — 3D: kendi çizimimiz; 2D: gerçek OSM haritası (Cennetü'l-Bakî, sokaklar, oteller) üzerinde aynı kapılar ve rota.
- **Şehir haritası** — oteller, yemek, eczane, otobüs, taksi, hastane (OpenStreetMap); otelinizi kaydedip mescide yaya rotası.
- **En yakın cami (dünyanın her yerinde)** — tek dokunuşta: konumunuza en yakın cami/mescit, mesafe, yürüme süresi, yönü gösteren ok (telefonun pusulasıyla döner), uygulama içi haritada yürüyüş rotası ve sıradaki namaz vakti. Veri OpenStreetMap'ten gelir (önce Photon, sonra Overpass sunucuları); 1,5 km'den başlayıp 60 km'ye kadar arar, internet yokken son aramayı gösterir.
- **Ulaşım (her ülkede)** — "Buradasınız" adresi ve konum paylaşma; adres/otel/istasyon arama ya da haritaya uzun basarak hedef; **yürüme**, **toplu taşıma** (metro, otobüs, tramvay, tren — hat renkleri, aktarmalar, duraklar) ve **araç/taksi** (süre, mesafe, Uber, telefonun haritasında yol tarifi). "Şoföre göster" kartı hedefi Arapça, Urduca ve İngilizce ricayla büyük yazar. Haram, Nebevî, otel ve en yakın cami hızlı hedeflerdir.
- **Namaz vakitleri ve kıble pusulası** — telefonda hesaplanır (Ümmü'l-Kurâ, Diyanet, MWL…; Türkiye'de Diyanet kendiliğinden), internet gerekmez. Pusula titremez: yön yumuşatılır ve kadran telefonun kendi animasyon katmanında döner.
- **Ezan bildirimleri** — ezandan 5–45 dk önce ve/veya vaktinde; vakit vakit seçim (güneş: sabahın çıkış uyarısı); Zil, Çan, Nağme (Hicaz), Damla ya da telefonun sesi; **kendi ezan kaydınızı** seçip vakit girince tamamını dinleme. Telefon kilitliyken de gelir, internet gerekmez.
- **Tema** — açık, koyu ya da sistem; 5 renk paleti (Turuncu, Zümrüt, Gece mavisi, Altın, Gül). Tüm paletler WCAG AA kontrastını sağlar (testli).
- **3D tavaf asistanı** — Kâbe gerçek ölçü ve yönüyle (Hacerü'l-Esved, Rükn-i Irâkî/Şâmî/Yemânî, kapı, Hatîm, Makam-ı İbrâhîm); konumunuz ve bu şavtta yürüdüğünüz yay; Hacerü'l-Esved hizasından başlayan **şavt sayacı** (GPS ile otomatik + elle düzeltme); köşelere geldikçe istilam/selamlama ve dua; **sesli asistan** (şavt duyurusu, "Rabbenâ âtinâ…" kâri sesiyle); tavaf sonrası adımlar (Makam, 2 rekât, Zemzem, sa'y). Ekran açık kalır, cep kilidi vardır.
- **Kur'an-ı Kerim** — 114 sûre; **dört görünüm** (Mealli, yalnız Arapça, yalnız meal, kesintisiz Mushaf); **birden fazla ayraç** (Hatim ayracı yüzde ilerlemesiyle, diğerleri adlarıyla; okudukça yer kendiliğinden kaydedilir); **12 kâriden ayet ayet sesli okuma**, **9 dilde sesli meal** (Türkçe Diyanet Vakfı dahil), 50+ dilde 100'ü aşkın meal, Latin harfli okunuş, **30+ dilde tefsir** (Türkçe: Muhtasar, Sa'dî, İbn Kesîr); okunan ayet vurgulanır.
- **Dua kütüphanesi** — 20 kategori, 100'ü aşkın kayıt (sabah-akşam, namaz sonrası, tavaf, sa'y, hac, Medine, sıkıntı, şifa, tövbe, yolculuk, Kur'an'daki dualar…), arama, kaynak numarası, sesli dinleme. Kur'an'daki dualar seçtiğiniz meal dilinde gelir.
- **Sahîh-i Buhârî ve günün hadisi.**
- **Ravza rehberi** — ziyaret saatleri, Nusuk izni, resmî 360° sanal tur bağlantısı.
- **Türkçe, İngilizce, Arapça** (Arapça sağdan sola).

> Durum: **0.6.0 — geliştirme sürümü.** Bina biçimleri ve kapı yerleri OpenStreetMap'ten gelir (doğruluğu bu veri kadardır); mescit içi hizmet noktaları örnektir. Ayrıntı: [docs/VERI-KAYNAKLARI.md](docs/VERI-KAYNAKLARI.md), [scripts/osm-3d.md](scripts/osm-3d.md).

## Hızlı başlangıç

Gerekenler: [Node.js 20+](https://nodejs.org) ve telefonda **Expo Go** uygulaması.

```bash
git clone https://github.com/<kullanici-adiniz>/mataf.git
cd mataf
npm install
npx expo start
```

Terminalde çıkan QR kodu telefonunuzdaki Expo Go ile okutun. Uygulama birkaç saniyede açılır.

> Expo Go'da ezan bildirimleri çalışır ama uygulamaya özel sesler (Zil, Çan…) ve "Alarmlar ve hatırlatıcılar" ayarı yalnız kendi derlemenizde (aşağıdaki APK / iOS) geçerlidir; Expo Go'da telefonun varsayılan bildirim sesi duyulur.

### Telefona kurulabilir dosya (APK / iOS) üretmek

**En kolayı — GitHub Actions (bilgisayar gerekmez):** depo GitHub'dayken her `main` gönderiminde
`.github/workflows/android-apk.yml` APK'yı GitHub'ın sunucularında derler (~15–25 dk). İndirmek için:
depo → **Releases → apk-latest → mataf-x.y.z.apk** (ya da Actions → son çalışma → `mataf-apk`).
Telefonda dosyayı açın; "bilinmeyen kaynaklardan yükleme" izni istenirse verin. Elle başlatmak için
Actions → *Android APK* → *Run workflow*.

- APK, Expo şablonunun hata ayıklama anahtarıyla imzalıdır: yan yükleme için yeterli, Play Store için kendi anahtarınızla imzalayın.
- Google Haritalar anahtarı isteğe bağlıdır (depo **Settings → Secrets → GOOGLE_MAPS_API_KEY**). Anahtar yoksa ulaşım, şehir ve cami ekranları uygulamanın kendi sade haritasını gösterir; 3D Haram/Nebevî haritası anahtar gerektirmez.

**Expo'nun bulut derleme hizmetiyle** (ücretsiz katman yeterli; bilgisayarda terminal gerekir):

```bash
npx eas-cli@latest login
npx eas-cli@latest build -p android --profile preview   # paylaşılabilir .apk
npx eas-cli@latest build -p ios --profile preview       # Apple geliştirici hesabı gerekir
```

Derleme bitince verilen bağlantıdan dosyayı indirip GitHub'da **Releases** bölümüne ekleyebilirsiniz.

## Canlı bildirim sunucusu (isteğe bağlı)

Kurulumsuz çalıştırdığınızda kapı bildirimleri **yalnızca o telefonda** tutulur (yerel demo, örnek bildirimlerle). Herkesin bildirimini herkesin görmesi için ücretsiz bir [Supabase](https://supabase.com) projesi açın:

1. Supabase'de yeni proje → **SQL Editor** → [`supabase/schema.sql`](supabase/schema.sql) dosyasını çalıştırın.
2. **Authentication → Providers → Anonymous sign-ins**'i açın.
3. Proje kök klasöründe `.env` dosyası oluşturun (örnek: [`.env.example`](.env.example)):

```
EXPO_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

4. `npx expo start` ile yeniden başlatın. Ayarlar ekranında "Canlı sunucu (Supabase)" yazmalı.

## Ulaşım ve toplu taşıma

| İş | Kaynak | Koşul |
|---|---|---|
| Yer arama, adres | [Photon](https://photon.komoot.io) (OpenStreetMap) | Makul kullanım; yoğun kullanımda kendi Photon sunucunuz |
| Yürüme / araç rotası | [FOSSGIS OSRM](https://routing.openstreetmap.de) | Makul kullanım; ulaşılamazsa kaba tahmin gösterilir |
| Toplu taşıma | [Transitous](https://transitous.org) (MOTIS 2, dünya geneli açık GTFS verisi) | **Yalnız açık kaynak + ticari olmayan projeler**, günde ~720 istek altı, uygulamayı tanıtan User-Agent, [kaynak listesine](https://transitous.org/sources/) bağlantı |

Transitous varsayılan olarak **kapalıdır**; kapalıyken metro/otobüs tarifi telefonun harita uygulamasında (Google Haritalar / Apple Haritalar, güncel sefer saatleriyle) açılır. Açmak için depoyu açık kaynak lisansla yayımlayın ve `.env` içine bir iletişim adresi yazın:

```
EXPO_PUBLIC_TRANSITOUS_CONTACT=ad@ornek.org
```

Uygulama her isteğe `User-Agent: MATAF/<sürüm> (<iletişim>)` ekler. Ticari yayında kendi [MOTIS](https://github.com/motis-project/motis) sunucunuzu kurun ya da ticari bir tarif servisi kullanın. Mekke–Medine arası Haremeyn treni ve şehir otobüsleri, ilgili açık veri yayımlandığı ölçüde görünür.

## Ezan bildirimleri

- Bildirimler telefonda kurulur (sunucu yok): seçilen konum ve hesaplama yöntemine göre önümüzdeki ~5 gün; uygulama her açıldığında yenilenir (iOS en çok 64 bekleyen bildirime izin verir).
- Sesler (`assets/sounds/*.wav`) bu projede sentezlenmiştir, telif içermez: `python3 scripts/make-sounds.py assets/sounds`.
- Tam ezan bildirim sesi olamaz (iOS'ta bildirim sesi en çok 30 sn). Kullanıcı kendi ezan kaydını (mp3/m4a) seçerse, vakit girdiğinde uygulama açıksa ya da bildirime dokununca tamamı çalar; üstte "Durdur" çubuğu çıkar. Uygulamaya hazır ezan kaydı eklemek isterseniz, dağıtım izni olan bir kayıt kullanın.
- Android'de kesin zamanlı bildirim için `SCHEDULE_EXACT_ALARM` istenir; kullanıcı "Alarmlar ve hatırlatıcılar" iznini kapatırsa bildirim birkaç dakika gecikebilir.

## Proje yapısı

```
src/
  app/            Rotalar (Expo Router): (tabs)/ harita, Kur'an, ana sayfa (orta), ulaşım, menü
                  vakitler · zikir · hadis-dua · kapilar · kapi/[id] · bildir · navigasyon · arama · sehir · cami
                  kible · tavaf · ravza · medine-rehber · veriler · ayarlar · bildirimler (ezan) · kuran-ayarlar · tefsir
  screens/        Ekran gövdeleri (ana sayfa seçimi bunları paylaşır): HomePrayer, PrayerTimes, MapScreen,
                  QuranList, Tawaf, Zikir, Menu, HadithScreen
  components/     Ortak parçalar; OnlineMap (WebView + MapLibre), PlainMap (çevrimdışı yedek), HaramScene
  scene/          Gerçek ölçekli 3D çizim motoru (eğik izdüşüm) ve Mekke/Medine sahneleri
  services/       Kapı bildirim kuralları + Supabase, rota planlama, konum, namaz vakti, ezan bildirimleri,
                  ulaşım (Photon/OSRM/Transitous), cami arama, Kur'an, hadis, tema, OSM
  data/           Kapılar, hedefler, hizmet noktaları, Ravza saatleri, dualar
  i18n/           TR / EN / AR metinleri
supabase/         Veritabanı şeması
docs/             Mimari, veri kaynakları, otomatik güncelleme
scripts/          Mantık kontrolü (npm run check)
```

## Geliştirme komutları

```bash
npm run typecheck   # TypeScript kontrolü
npm run check       # 80'e yakın mantık testi: kapı kuralları, rota, tavaf sayacı, harita döndürme,
                    # tema kontrastı, ezan bildirim planı, ulaşım (Photon/OSRM/MOTIS) ayrıştırma
npm run lint
```

## Tavaf asistanı nasıl sayar?

`src/services/tawaf.ts` — saf fonksiyonlar, `npm run check` gürültülü GPS benzetimleriyle test eder.

- Konum, Kâbe merkezine göre açıya çevrilir; ilerleme Hacerü'l-Esved hizasından saatin tersine ölçülür.
- Açı son 5 ölçümün medyanıdır; Kâbe'ye uzaklığı birden değişen ölçümler atılır.
- Şavt, başlangıç çizgisi en az 15° (gürültüyle artan pay) geçilince sayılır; **sayaç hiçbir zaman fazla ya da çizgiden önce saymaz** (168 rastgele iz, %3 sıçrayan ölçümle test edildi).
- Kâbe'ye çok yakın ve GPS zayıfken (açısal hata ~17°'den büyük) otomatik sayım durur, ekran "elle sayın" der.
- Fıkhî içerik Diyanet Hac İlmihali'ne (Hanefî) göredir; her şavt için Sünnet'te belirli bir dua olmadığı belirtilir ve yalnız sahih kaynaklı dualar önerilir.

## Veri ve lisans notları

- Harita ve 3D binalar (Mescid-i Haram, Mescid-i Nebevî, Saat Kulesi, çevre): © OpenStreetMap katkıcıları (ODbL) — haritada ve Ayarlar'da atıf gösterilir; veri `src/data/osm/` altında, güncelleme adımları `scripts/osm-3d.md`. Yaya/araç rotası: FOSSGIS OSRM. Yer arama: Photon.
- Toplu taşıma (açıksa): Transitous ve [veri kaynakları](https://transitous.org/sources/) — uygulamada bağlantı gösterilir.
- Bildirim sesleri: bu projede sentezlendi (`scripts/make-sounds.py`).
- Kur'an metni ve meal: alquran.cloud (Tanzil). Meal hakları sahiplerine aittir; mağazaya yüklemeden önce kullanılan mealin lisansını kontrol edin.
- Hadis: fawazahmed0/hadith-api (açık veri). Çevirileri yayından önce bir ilahiyatçıya kontrol ettirin.
- Resmî kapı/kapanma verisi için İki Kutsal Mescid İşleri Genel Kurumu ile veri anlaşması gerekir (docs/VERI-KAYNAKLARI.md).
- Bu depo için henüz bir yazılım lisansı seçilmedi. Açık kaynak yapmak isterseniz `LICENSE` dosyası ekleyin (ör. MIT).

---

### English summary

MATAF is an Expo (React Native) app for visitors to Masjid al-Haram and the Prophet's Mosque: true-scale 3D maps built from OpenStreetMap's 3D building data (real outlines, minarets, domes, Clock Tower; pinch to zoom, two-finger rotate), crowd-sourced gate closures with automatic rerouting, turn-by-turn walking guidance, a worldwide transport tab (walk, transit via Transitous when enabled, car/taxi, "show the driver" card), nearest mosque anywhere, on-device prayer times, Qibla and adhan notifications (custom sounds, your own adhan recording), light/dark themes with 5 palettes, Quran with audio/translations/tafsir, Sahih al-Bukhari, duas, a 3D tawaf assistant and a Rawdah guide. Run with `npm install && npx expo start` and open in Expo Go. Optional live backend: Supabase (`supabase/schema.sql`, `.env`).
