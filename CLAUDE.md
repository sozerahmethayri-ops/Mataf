# MATAF — Claude Code çalışma rehberi

Projenin kararları ve çalışma kuralları burada; bir karar değişince bu dosyayı güncelle. Kullanıcıya dönük değişiklik günlüğü README.md'nin başında.

## Amaç ve kullanıcı
- MATAF: Mescid-i Haram ve Mescid-i Nebevî'de yol bulma, hac ve umre rehberi, günlük ibadet yardımcısı (namaz vakti, ezan bildirimi, kıble, Kur'an, dua, zikir). Android uygulaması (APK) ve iPhone için web sürümü.
- Hedef kullanıcı: Türkiye'den hac ve umreye giden, çoğu teknolojiye uzak, yaşlı olabilen ziyaretçi; kalabalıkta ve zayıf internetle. İkincil: Türkiye'de ve dünyada günlük kullanıcı (vakit, kıble, en yakın cami, toplu taşıma).
- Diller: Türkçe (ana), İngilizce, Arapça (sağdan sola). Fıkıh: Hanefî, Diyanet kaynaklı.
- Ürün ilkesi: sade, büyük yazı, tek dokunuş; internetsiz ve sunucusuz da çalışır (Supabase isteğe bağlı).
- Proje sahibiyle çalışma: Türkçe ve kısa yaz. Sahibi "onay beklemeden eksikleri tamamla, uygulamayı sade ve kullanıcı dostu yap" dedi: küçük, geri alınabilir işleri sormadan yap, bitince kısaca özetle.
- Lisans: MIT (Transitous koşulu). Veriler kendi lisansında (OpenStreetMap: ODbL, atıf zorunlu).

## Teknoloji yığını
- Expo SDK 58, React Native 0.88, React 19.3, TypeScript 6.0; Expo Router (`typedRoutes`), React Compiler açık (`app.json` → `experiments`).
- CNG: `android/` ve `ios/` depoda yok; yerel ayar `app.json`, `app.config.js`, `plugins/` ile. Paket eklerken `npx expo install`. Expo API'leri her SDK'da değişir: yazmadan önce SDK 58 belgesine bak (https://docs.expo.dev/versions/v58.0.0/, düzeltmeler için https://docs.expo.dev/llms.txt).
- Başlıca kütüphaneler:
  - Namaz vakti `adhan`; güneş ve ay `suncalc`.
  - Çizim `react-native-svg` (3D Harem sahnesi, gökyüzü, simgeler); animasyon RN `Animated` (yerel sürücü) ve `react-native-reanimated`.
  - Harita: `react-native-webview` içinde MapLibre GL JS 5.24.1 (uygulamaya gömülü: `assets/maplibre`, `tools/maplibre/build.mjs`, `services/mapLib`; yedek unpkg/jsdelivr) + OpenFreeMap karoları; web'de aynı sayfa iframe'de (`OnlineMap.web.tsx`); açılmazsa `PlainMap` (kaydırılır, iki parmakla ve +/− ile yakınlaşır). `react-native-maps` yalnız `GOOGLE_MAPS_API_KEY` verilirse.
  - `expo-notifications` (ezan), `expo-task-manager` (bildirimdeki "Kıldım" arka planda), `expo-audio` ve `expo-speech` (ses), `expo-location`.
  - Ana ekran kutuları: `expo-widgets` + `@expo/ui` (Android Glance), `patch-package` yamasıyla.
  - Kayıt `@react-native-async-storage/async-storage`; sunucu `@supabase/supabase-js`.
- Dış servisler: Photon (adres ve yer arama), OSRM (yürüme ve araç rotası), Transitous/MOTIS (toplu taşıma), api.alquran.cloud ve cdn.islamic.network (Kur'an metni ve sesi), OpenFreeMap (karo), Overpass (yalnız yedek), Supabase.
- Ortam değişkenleri (`.env.example`): `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `EXPO_PUBLIC_TRANSITOUS_CONTACT`, `EXPO_PUBLIC_TRANSITOUS_WEB` (web'de Transitous), `GOOGLE_MAPS_API_KEY`, `WEB_BASE_URL` (Pages alt klasörü `/Mataf`). İş akışları bunları GitHub secrets'tan okur (`SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `GOOGLE_MAPS_API_KEY`; henüz girilmedi).
- Yazı tipi: arayüz sistem yazı tipinde. Kur'an metni için seçilebilir hatlar (varsayılan Medine Mushafı, `assets/fonts/MatafMadina.ttf`, OFL; ayrıca Amiri Quran, Scheherazade New, Noto Naskh Arabic, Lateef); lisans ve ekleme kuralı `dini-icerik` skillinde. Diyanet'in mushaf hattı ve KFGQPC yazıları serbest lisanslı değil, izinsiz kullanılmaz.

## Komutlar
- `npm install`: postinstall `patches/expo-widgets+58.0.29.patch`'i uygular.
- Her değişiklikten sonra üçü de temiz olmalı: `npm run typecheck`, `npm run lint`, `npm run check` (342 test, her satır `OK`). CI typecheck ve check çalıştırır.
- `npx expo start`: Expo Go'da kutular, özel ezan sesleri ve tam zamanlı alarm yok; yerel davranışı APK ya da duman testinde gör.
- Web görüntüsü: `web-goruntu` skilli (`npx expo export -p web`, `tools/web-shots/shoot.py` + spec).
- Emülatör duman testi (~25 dk): `duman-testi` skilli. Tek komut, arka planda: `python3 -I .claude/skills/duman-testi/scripts/smoke_check.py --start main` (başlatır, bekler, ölçütleri denetler, görüntüleri birleştirir).
- OSM verisi: `gh workflow run osm-fetch.yml -R sozerahmethayri-ops/Mataf --ref main -f query='…'`. Sonuç "osm-data" sürümünde `out.json`; `scripts/*.py` uygulama verisine çevirir. Sorgular `scripts/osm-3d.md`'de.

## Proje skilleri (`.claude/skills/`)
İlgili işe başlamadan önce skilli yükle; ayrıntılı adımlar ve kurallar orada.
- `surum-cikar`: kullanıcıya görünen değişiklik bitince; sürüm numarası (`bump_version.py`), README, commit, gönderim, iş akışları, `version.json`.
- `duman-testi`: yerel davranış (kutu, bildirim, alarm, yama, izin, derin bağlantı, yazı tipi) değişince; bitti ölçütleri orada.
- `kutu-gelistir`: `src/widgets/`, kutu verisi (`widgetProps`, `widgetSync`) ya da expo-widgets yaması.
- `metin-ekle`: kullanıcıya görünen her metin (tr/en/ar, Türkçe yazım, sağdan sola).
- `web-goruntu`: arayüz değişikliğini görmek; Arapça, tema ve palet denetimi.
- `dini-icerik`: âyet, meal, dua, hadis, rehber adımı, vakit ve takvim hesabı, Kur'an hattı.
- `arayuz-tasarim`: yeni ekran, renk, tema, palet, yazı boyu, düzen, ana sayfa, harita ya da kutu görünümü.
- Expo eklentisi de açık (`expo:*`): SDK yükseltmesinde `expo-upgrade`, `@expo/ui` için `expo-ui`, yerel modül için `expo-module`. Sürüme özel Expo belgesi Expo bağlayıcısıyla aranır (`search_documentation`).

## Kod haritası
| Yer | İçerik |
|---|---|
| `src/app/` | Rotalar. `(tabs)/`: `s1`, `s2` (yuva), `index` (Ana sayfa), `s4` (yuva), `menu`; yuvalarda Ayarlar'da seçilen bölüm (`screens/TabSlot`, `services/tabs`). Diğerleri yığın ekranı; dosya adı yoldur (`harita`, `kuran`, `ulasim` her zaman kendi bölümü; `rota` uygulama içi navigasyon, `nuzul`, `hac-umre`, `vakitler`, `mushaf`, `umre`, `hac`, `tavaf`, …) |
| `src/screens/` | Birden çok rotanın paylaştığı ekran gövdeleri: `HomePrayer`, `PrayerTimes`, `MapScreen` (+ `NearbyMap`: "Konumum" görünümü), `Transport`, `Kible`, `HacUmre`, `TabSlot`, `Tawaf`, `Zikir`, `Menu`, `QuranList`, `HadithScreen` |
| `src/components/` | `ui.tsx` (Screen, Header, Card, Btn, Chip, Segmented, ListRow, SelectRow, Toggle, StatusPill, `T` yazı stilleri), `Icon.tsx`, haritalar (`OnlineMap` + `onlineMapHtml.ts`, `PlainMap`, `TransportMap`, `CityMap`, `MosqueMap`), `HaramScene`, `SkyScene` + `sceneArt`, `WidgetPinRow`, `AdhanHost` |
| `src/services/` | Mantık ve bağlamlar; React'sız olanlar testli: `prayer`, `adhanPlan`, `adhanNotify`, `prayedTask`, `location`, `transport`, `navigation` (uygulama içi yol tarifi), `railRouter`, `transitText`, `routing`, `tabs`, `mapLib`, `reports`, `tawaf`, `say`, `hac`, `kaza`, `offline`, `widgetProps`, `widgetSync`, `update`, `errorLog`, `ThemeContext`, … |
| `src/scene/` | Kendi 3D motorumuz: eğik izdüşüm (`oblique.ts`), Mekke ve Medine sahneleri, Kâbe modeli, tavaf sahnesi |
| `src/data/` | Gömülü veri: kapılar, dualar, umre ve hac adımları, tren, erişim, `osm/` (3D binalar, hac yerleri), `istanbulRail.json`, `makkahBus.json` |
| `src/widgets/` | Ana ekran kutuları ve kalıcı vakit bildirimi (`PrayerNotification`; her biri `'widget'` yönergeli, ayrı JS ortamı) |
| `src/i18n/` | `strings.ts` (ortak metinler, `t('…')`), dil seçimi ve RTL |
| `src/constants/theme.ts` | Renkler, paletler, yazı ölçeği, aralıklar |
| `scripts/` | `check-logic.ts` (testler), `smoke.sh` (emülatör), OSM dönüştürücüleri (`ist_rail.py`, `makkah_bus.py`, `hac_sites.py`, `osm3d_encode.py`), `make-sounds.py` |
| `tools/` | `web-shots/` (web ekran görüntüsü), `icon/` (simge: three.js ile işlenmiş Kâbe), `supabase-test/` (RLS kurallarını yerel Postgres'te deneme) |
| `supabase/schema.sql`, `docs/` | Veritabanı şeması; `MIMARI.md` (katmanlar, kapı durumu kuralları), `SUPABASE.md` (kurulum), `VERI-KAYNAKLARI.md` (her verinin kaynağı ve lisansı), `OZELLIKLER.md` (özellik envanteri ve dosya yerleri) |
| `.github/workflows/` | `android-apk`, `ci`, `web-pages` (main'e her gönderimde); `android-smoke`, `osm-fetch` (elle); `supabase-keepalive` (3 günde bir) |

Platforma özel dosyalar: `X.web.tsx`, `X.android.ts`, `X.types.ts`. Giriş `index.ts`: önce `expo-router/entry`, sonra uygulama kapalıyken de tanımlı olması gereken arka plan görevi (`services/prayedTask`).

## Kodlama kuralları
- **Metin:** Kullanıcıya görünen her yazının `tr`, `en`, `ar` karşılığı olur: ekrana özel `const L = { anahtar: { tr, en, ar } }` + `pick(L.anahtar, lg)`, ortak olanlar `src/i18n/strings.ts` + `t('…')` (üç sözlük aynı anahtar ve `{değişken}`leri taşır, test var). Arapçada düzen sağdan sola döner. Ayrıntı: `metin-ekle` skilli.
- **Türkçe yazım:** Kısa, gündelik dil; eki cins isim taşır, özel ad yalın kalır ("Yenikapı istasyonunda inin", "{p} vaktine kalan"); sayı birimiyle ("≈ 27 dk").
- **Tema:** Renkleri `C` nesnesinden çizim anında oku (tema değişince `applyTheme` aynı nesneyi günceller, ekranlar yeniden kurulur); modül düzeyinde renkten türeyen stil varsa `onThemeChange` ile yenile. Yazı boyutu `fs(n)`, Arapça `fsAr(n)`, ortak stiller `T`. Ayrıntı: `arayuz-tasarim` skilli.
- **Kayıt:** `usePersisted(anahtar, başlangıç)` ya da AsyncStorage. Var olan anahtar adları kalıcıdır (`theme:prefs`, `adhan:prefs`, `mataf.city`, `mataf.lang`, `mataf.hotel.<şehir>`, `prayer:log`, `prayer:logHidden`, `quran:plan`, `zikir:goal`, `trip:checklist`, `widget:logCtx` …); adı değişirse kullanıcının kaydı kaybolur.
- **React Compiler (lint):** Çizimde `ref.current` okunmaz. Effect içinde `setState` yerine türetilmiş değer ya da `setTimeout(…, 0)`. `Animated.Value` için `useState(() => new Animated.Value(0))`.
- **Kutular (`src/widgets/`):** Ayrı Hermes ortamında çalışır: dosya dışındaki değerlere erişmez, `?.`, `??`, yayma ve `for…of` yok; Glance satırda en çok 10 çocuk çizer, sığmayanı sıkıştırır. Kod yazmadan önce `kutu-gelistir` skilli; görünümü duman testinin görüntüsünde gör.
- **expo-widgets yaması** (`patches/expo-widgets+58.0.29.patch`): sabitleme, dokununca açma, 30 dk yenileme, vakit alarmları (`scheduleWidgetTicks`), canlı geri sayım (`countdownTo` → Chronometer), `env.width/height`. Yeniden üretme: `node_modules`'te düzenle, `npx patch-package expo-widgets` (`kutu-gelistir`).
- **Arka plan görevi:** `TaskManager.defineTask` giriş dosyasından (`index.ts`) yüklenen modülde, modül düzeyinde çağrılır. Ekran ya da `_layout` içinde tanımlanan görev uygulama kapalıyken bulunmaz; expo-task-manager bulamadığı görevin kaydını siler. Görev sonucu beklenir (kutu yazımı dahil); yoksa görünmeden açılan JS iş bitmeden kapanır.
- **Simgeler:** `Icon.tsx`'teki yol tablosu. Olmayan ad tür denetiminde yakalanmaz, boş çizilir; yeni simgeyi tabloya ekle.
- **Ağ:** Her istek uygulamayı tanıtan User-Agent taşır. Yer ve cami araması Photon'la (Overpass yalnız yedek). Transitous koşulları: açık kaynak, ticari değil, iletişimli User-Agent, ekranda `transitous.org/sources` bağlantısı; günde ~720 `/plan` isteği aşılırsa onlarla konuşulur. Mekke ve Medine'nin 90 km çevresinde Transitous'a istek gitmez (Suudi Arabistan verisi yok).
- **Test:** Mantığı React'sız `src/services/*.ts` dosyasına koy, `scripts/check-logic.ts`'e `ok(koşul, 'açıklama')` ekle.
- **Dinî içerik:** Hanefî, Diyanet kaynaklı; her adım ve duanın yanında kaynağı yazar; rehber ekranlarında "henüz bir ilahiyatçı kontrolünden geçmedi" notu durur; âyet, hadis ve dua metni yalnız kaynağa ya da hocanın düzeltmesine göre değişir. Âyet metinleri API'den gelir (gömülü değil); hadis duaları `src/data/duas.ts`'te. Ayrıntı: `dini-icerik` skilli.
- Yorumlar Türkçe, tanımlayıcılar İngilizce.

## Sürüm çıkarma
`main`'e her gönderim APK'yı ve web'i yeniden yayınlar; kullanıcıya görünen her değişiklik sürüm alır (yalnız belge, test ya da araç değişikliği almaz; commit `belgeler:`/`araçlar:` ile başlar). Adımlar `surum-cikar` skillinde: üç denetim; `python3 -I .claude/skills/surum-cikar/scripts/bump_version.py X.Y.Z` (package.json, package-lock.json, app.json version ve versionCode +1, README "Durum", CLAUDE.md sürüm satırları); README günlüğüne madde; Türkçe commit, ilk satır `X.Y.Z: kısa özet`, altında madde madde ne ve neden; `main`'e gönder; CI, APK ve web yeşil, `version.json` yeni sürüm (uygulama 6 saatte bir bakar, "İndir" şeridi çıkarır); yerel davranış değiştiyse `duman-testi` (bitti ölçütleri orada).

## Tasarım kuralları
Ayrıntı (renk tablosu, paletler, yazı ölçeği, aralıklar, hazır parçalar, ana sayfa, harita, kutular): `arayuz-tasarim` skilli. Özü:
- Sıcak tonlar (krem zemin, kum yüzey, kahve yazı); kullanıcının seçtiği vurgu paleti (Kiremit varsayılan, Zümrüt, Gece mavisi, Altın, Gül) ekranın her yerinde. Renk `C`'den okunur; her renk çifti açık ve koyuda WCAG AA.
- Anlamlar sabit: kırmızı + X kapalı, amber kısıtlı, deniz yeşili açık, turuncu rota, mavi yalnız "siz".
- Sade: büyük yazı (`T`, `fs`, `fsAr`), dokunma alanı en az 44 px, ekranda bir ana eylem, hazır parçalar (`ui.tsx`); şablon (yapay zeka) görünümünden kaçın.

## Mimari kararlar
1. **Hesap telefonda:** namaz vakti (Suudi saat dilimlerinde Ümmü'l-Kurâ, Türkiye'de Diyanet), kıble, güneş ve ay, toplu taşıma tarifi. İnternetsiz ve sunucusuz çalışsın diye.
2. **Önbellek ve çevrimdışı:** ağdan gelen içerik `cachedJson` ile cihazda; ağ yoksa son kayıt. Çevrimdışı paket (`/cevrimdisi`): Mekke ve Medine harita karoları, stil, yazı tipleri, MapLibre, Kur'an baskıları, dua sesleri.
3. **Harita:** Google yerine MapLibre + OpenFreeMap (anahtarsız, ücretsiz), WebView içinde (web'de iframe); kütüphane uygulamaya gömülü, CDN'e bağlı değil (bazı ağlar unpkg/jsdelivr'i açmıyor; 0.24.0). Açılmazsa sade harita. Harita sekmesi Mekke/Medine'nin 30 km dışında "Konumum" görünümüyle açılır (bulunulan yer + yakındaki camiler); Mekke ve Medine üstteki seçiciden. Haremlerin 3D görünümü kendi SVG motorumuzla, gömülü OSM "Simple 3D Buildings" verisinden; Ebrâcü'l-Beyt (Saat Kulesi) soluk çizilir, göz Kâbe'ye gitsin.
4. **Overpass yerine Photon:** Overpass kullanıcının ağından açılmıyor; uygulama içi arama Photon'la, veri çıkarımı `osm-fetch.yml` ile GitHub'da.
5. **Sunucu isteğe bağlı:** Supabase yoksa kapı bildirimleri yerel demo, aile konumu önizleme. Yetki RLS'de (`supabase/schema.sql`). Kapı durumu kuralları (resmî duyuru önce, 3 farklı kişi, 2 saat, kapıya ≤150 m) `docs/MIMARI.md`'de.
6. **Tema:** tek değiştirilebilir `C` nesnesi; tema değişince yalnız ekranlar yeniden kurulur (`ScreenRemount`). Kök gezgini yeniden kurmak çöküyordu (0.6.0).
7. **Dağıtım:** mağaza yok. APK GitHub Releases'te ("apk-latest"; hata ayıklama anahtarıyla imzalı, yan yükleme için), iPhone için GitHub Pages web sürümü. R8 küçültme kapalı (WorkManager/Room açılışta çöküyordu). Gradle'a 6 GB bellek (`plugins/withGradleMemory.js`; D8 bellek hatası).
8. **Bildirim planı:** yerelde 7 gün, en çok 60 bildirim (iOS 64 sınırı); önce hatırlatmalar (mübarek gün, hac), kalan yere ezanlar. Android 12+ tam zamanlı alarm izni yoksa uyarı ve "İzni aç". Vakit bildirimindeki "Kıldım" Android'de uygulamayı açmaz: expo-notifications düğmeye dokununca arka plan görevini çalıştırır (uygulama kapalıysa JS görünmeden yüklenir), görev vakti işler, bildirimi kapatır, kutuyu yeniler. Görev kurulamazsa düğme uygulamayı açar ve AdhanHost işler (0.20.0).
9. **Kutu yenileme:** sıradaki vakti kutu her çizimde `Date.now()` ile kendisi bulur (30 günlük veri). Uygulama her eşitlemede sonraki 24 vakit ve gün başını `scheduleWidgetTicks` ile AlarmManager'a verir (izin varsa tam zamanlı, yoksa 10 dk pencere); ayrıca 30 dk'da bir yenileme. Aynı alarm kalıcı vakit bildirimini de yeniden çizer (0.23.0, yama: `ExpoWidgetsAppWidgetProvider`); bildirim de sıradaki vakti kendisi bulur.
10. **Toplu taşıma:** Transitous'ta olmayan yerler için OSM'den çevrimdışı ağ (İstanbul raylı sistem, Mekke otobüsü) ve RAPTOR benzeri tarif (`railRouter.ts`). Sefer saati yok; süre ortalama hız ve bekleme süresinden, ekranda "≈". Transitous sonuçları aynı listeye süreye göre girer. Medine'de veri yok; harita uygulaması açılır.
11. **Yatsıdan sonra yarın:** ekranlar ve kutular yarının vakitlerini gösterir (`shownDay`); vurgulanan imsak geri sayımla aynı olsun diye.
12. **İç mekân:** çizilmiş iç mekân modelleri kaldırıldı (gerçek görüntü yok). Hedef: Canlı Görünüm (AR) ve resmî veri (alharamain.gov.sa akıllı harita, sütun kodları). Resmî planlar izinsiz kopyalanmaz.
13. **Gizlilik:** aile konumu yalnız uygulama açıkken paylaşılır, geçmiş tutulmaz. Fotoğraflarda yüz bulanıklaştırma cihazda yapılacak. Kişisel veri URL'ye konmaz.
14. **Veriden bilinçli sapmalar:** OSM'de turuncu işaretli kubbeler mermer tonunda; Yeşil Kubbe kasnak + sivri kubbe (~26 m); Medine çatısındaki 27 sürgülü kubbe çizilmez (yerleri bilinmiyor). Ana kapılar: Mekke 1, 79, 62, 45, 100 (Genel Kurum'un 2025 duyurusu); Medine 1, 41, 37, 20–22, 7–9, 33–35. Diğer kapılar OSM'den (0.23.0); OSM'nin Mekke kuzeyindeki 30–41 numaraları resmî duyuruyla çeliştiği için alınmadı. Rota ana kapıyı tercih eder (diğeri ancak 120 m'den fazla kısaysa).
15. **Doğrulama üç katlı:** saf mantık testleri (Node), web ekran görüntüsü (Playwright), emülatör duman testi (API 34). Gerçek cihaz denemesi henüz yapılmadı.
16. **Alt sekmeler değiştirilebilir (0.25.0):** 1., 2. ve 4. sekme yuvadır (`s1`, `s2`, `s4`); bölüm `theme:prefs.tabs`'ta, Ana sayfa ve Menü sabit. Bölümlerin yığın rotaları (`/harita`, `/kuran`, `/ulasim`, …) her zaman o bölümü açar, böylece eski bağlantılar kırılmaz; Menü bölüm sekmedeyse sekmeye gider.
17. **Navigasyon uygulamanın içinde (0.25.0):** telefonun harita uygulamasına yönlendirme yok (proje sahibinin isteği); yürüme ve araçta OSRM adımları, toplu taşımada seçilen tarifin bacakları (`/rota`). Uber ve şoföre gösterme kartı kalır.

## Tamamlanan özellikler (0.25.0)
Envanter, dosya yerleri ve özellik başına kararlar `docs/OZELLIKLER.md`'de; bir özelliğe dokunmadan önce oradaki maddesine bak, değişince güncelle. Sürüm sırasıyla kullanıcıya dönük ayrıntı README.md'nin başında. Gruplar: ana sayfa ve vakitler; namaz takibi, hatim, cuma, zikir (bağlılık); bildirimler ve "Kıldım"; ana ekran kutuları (Android); Harem haritası (3D/2D) ve navigasyon; hac ve umre; ulaşım (yürüme, araç, toplu taşıma, tren); yer (cami, şehir, otel, acil, aile); Kur'an okuma (mushaf, tecvid, hatlar, sayfa numaraları); ibadet içerikleri; genel (dil, tema, çevrimdışı, yedek, güncelleme, web).

## Şu anki durum
- Sürüm 0.25.0 (versionCode 36). CI, APK ve web yeşil. APK: https://github.com/sozerahmethayri-ops/Mataf/releases/download/apk-latest/mataf.apk; web: https://sozerahmethayri-ops.github.io/Mataf/.
- Doğrulandı: 342 mantık testi; web görüntüleri (Arapça sağdan sola dahil; 0.24.0'da web'de gerçek harita iframe'de açılıyor, +/− çalışıyor, 3D'de kapı numaraları ve "Konumum" görünümü); emülatörde çökme yok, beş kutu eklendi ve çizildi (namaz takibi kutusu 0.19.0, daireler 0.21.1; 0.22.0'da sayaç saniye saniye işliyor, varsayılan koyu ve %40 şeffaf zemin), Medine Mushafı hattı telefonda doğru çiziliyor (besmele tek, âyet sonu daireli), mushafta kaydırınca sonraki sayfa geliyor, 24 vakit alarmı kurulu (24 farklı an), bildirimdeki "Kıldım" uygulama kapalıyken arka planda işliyor (deneme bildirimi kapandı, görev çalıştı; 0.20.0), Mekke otobüs tarifi (7A) doğru. 0.23.0 emülatörde: kalıcı vakit bildirimi panelde (geri sayım işliyor, açınca altı vakit), yeni Kâbe simgesi başlatıcıda, Kur'an sekmesi ve mushaf düğmeleri doğru, kutu sayaçları kısa vakit adında da tam. 0.24.0 emülatörde: 2D harita gömülü kütüphaneyle 2–4 sn'de açılıyor (CDN'siz), duman testi temiz.
- Doğrulanmadı: gerçek telefon, Mekke ve Medine'de saha, Samsung ve Xiaomi başlatıcıları.
- Proje sahibinden beklenenler: Supabase URL ve Publishable key (GitHub secrets'a), sahada deneme, hoca kontrolü (gözden geçirme belgesi: https://claude.ai/artifact/BZSU1wpF6vLspLDwDCGiGc), dağıtım izni olan bir ezan kaydı.
- Sürüm sürüm ayrıntılı notlar: claude.ai'deki "MATAF uygulama" projesinde `eksikler-ve-yol-haritasi.md`.

## Yapılacaklar (öncelik sırasıyla)
1. Saha denemesi: kapı numaralarının tabelayla karşılaştırılması (özellikle Mekke kuzeyi 30–41), kalıcı vakit bildirimi; haritanın akıcılığı ve Suudi mobil ağında açılış süresi; tavaf ve sa'y sayacı (zemin, 1. kat, çatı); Arafat ve Mina sınır denetimi; kutular Samsung ve Xiaomi'de; bildirimlerin pil tasarrufunda gelmesi; Mekke otobüs sürelerinin Makkah Bus uygulamasıyla karşılaştırılması; çevrimdışı paketin boyutu ve süresi.
2. Supabase'i bağla (canlı kapı bildirimleri, aile konumu): `docs/SUPABASE.md`.
3. Dinî metinleri hocanın düzeltmeleriyle güncelle (tecvid kuralları sayfası ve secde notu dahil). Diyanet'in mushaf hattı/sayfaları için Diyanet'ten (Mushafları İnceleme ve Kıraat Kurulu) izin: izin gelirse hat olarak eklenir.
4. Bağlılık (ilke: suçlama yok, yarış ve sıralama yok, veri telefonda): Kur'an dışı günlük içerik (hadis) seçeneği.
4a. Proje sahibinin istekleri, kaynak ya da izin bekleyenler (0.25.0): kelime kelime Türkçe meal (açık lisanslı kaynak yok; quran.com/Quran Foundation API'si anahtar istiyor ya da Diyanet izni); Türk kâriler (Fatih Çolak, İsmail Biçer, İsmail Coşar ve “Osman Hoca”, tam adı sorulacak: kayıtların izni); ana sayfada konuma göre İslam yapılarının gerçek fotoğrafları, gece/gündüz, hikâye ve belge (Wikimedia Commons; bulut ortamının ağ izni gerekli); hutbe bölümü (resmî haftalık hutbe metni; canlı çeviri için mikrofon izni, konuşma tanıma ve çeviri modülü).
5. Ezan sesi: izinli kayıt; uygulama kapalıyken tam ezan için ön plan servisi.
6. Toplu taşıma: Medine otobüs verisi; İstanbul vapurları (OSM'de durak üyeleri eksik); sefer saatli veri (GTFS); kullanıcı artarsa kendi MOTIS sunucusu.
7. Kur'an dışı tavaf ve sa'y dualarına kâri kaydı (şimdi cihaz sesi okuyor).
8. En yakın cami: Cuma camisi ve kadınlar bölümü bilgisi.
9. Herkesin gördüğü harita işaretleri; resmî kapı duyurusu (alharamain.gov.sa API'si); hesap doğrulama ve güven puanı.
10. Aile konumu arka planda (arka plan konum izni, ön plan servisi).
11. Fotoğraf yükleme ve cihazda yüz bulanıklaştırma; iç mekân konumu ve AR.
12. Kur'an ayraçları ve zikir defterinin cihazlar arası eşitlenmesi.
13. Mağaza: Play Store için kendi imza anahtarı; iPhone için Apple Developer hesabı ve TestFlight; iOS kutuları (şimdilik yalnız Android).
14. Acil numaralarını ve temsilcilik telefonlarını her sürümde yeniden kontrol et (son: 27.11.2026, Cidde Başkonsolosluğu iletişim sayfası ve duyuruları, my.gov.sa ve stc listeleri, NCSO haberleri; uygulamadakilerle aynı. 911 Mekke, Medine, Riyad ve Doğu Bölgesi'nde).

## Bilinen hatalar ve sınırlar
- Android 14'te "Alarmlar ve hatırlatıcılar" izni kapalı gelir; verilmezse ezan bildirimi ve kutu yenilemesi 10 dk'ya kadar gecikebilir (uygulama uyarıyor).
- Telefon yeniden başlayınca kutu alarmları ve kalıcı vakit bildirimi silinir; uygulama açılınca geri gelir (kutularda o zamana dek 30 dk'lık yenileme sürer).
- Mekke'nin kuzeyindeki 30–41 numaralı kapılar haritada yok (OSM numarası resmî duyuruyla çelişiyor); sahada tabelayla doğrulanmalı.
- Kutuların görünüm sınırları (sayaç vakitten sonra eksiye düşer, Pixel'de geniş kutu 5×3) `kutu-gelistir`, duman testinin bilinen aksaklıkları `duman-testi` skillinde.
- Toplu taşıma süreleri yaklaşık (sefer saati yok). Transitous'un günlük sınırı ~720 istek. Medine'de veri yok. OSM'de durağı işlenmemiş yeni hatlar çıkmaz.
- Hicrî tarih ve hac günleri Ümmü'l-Kurâ takviminden; Suudi Arabistan'ın ilanıyla bir gün kayabilir.
- Mushaf sayfalarında âyetler Medine Mushafı'nın sayfasındadır ama satır kırılımları yazıya ve büyütmeye göre değişir (15 satır sabit değil); uzun sayfalar kendi içinde kayar.
- Bildirimdeki "Kıldım" yalnız Android'de uygulamayı açmadan işler; duman testinde deneme bildirimiyle (vakit işlenmeden) denendi, gerçek vakit bildirimiyle ve pil tasarrufu kipinde telefonda bakılmalı. Web: ezan bildirimi ve kutu yok, pusula kısıtlı, bulut oturumunda karolar gelmez (web görüntülerinde harita yalnız zemin ve işaretlerle çizilir); Arapçada sekmeler arasında kaydırarak geçiş kapalı (kaydırıcı yön bilmiyor, düğmeler çalışır).
- Kapı bildirimleri ve aile konumu Supabase bağlanana dek demo ve önizleme.
- APK hata ayıklama anahtarıyla imzalı; Play Store'a yüklenemez.
- Harem 3D modeli OSM kadar doğru; mescit içi hizmet noktaları örnek veri.
- Tecvid renkleri alquran.cloud `quran-tajweed` işaretlemesine dayanır (`[kural[metin]`); bulut oturumundan servis açılmadığı için gerçek metinle görülmedi, telefonda bakılmalı. Ayrıştırıcı tanınmayan işareti renksiz bırakır.
- GitHub'da kullanılmayan `probe`, `smoke-run`, `widget-test` (0.22.0) ve `surum-023` (0.23.0; ikisi de `main`'e tek commit olarak alındı) dalları duruyor; bulut oturumundan silinemedi, elle silinebilir.
- Uygulama içi navigasyon (0.25.0) gerçek cihazda ve sahada denenmedi; bulut oturumundan rota sunucusu açılmadığı için web görüntüsünde kuş uçuşu yedeği görüldü. Sesli yönlendirme cihazın metin okuma sesiyle.
- Kalıcı vakit bildiriminin açık görünümünde çok dar ekranda (320 dp) ilk ve son vakit hücresinin kenarı kesilir; 360 dp ve üstünde sığar.

## Ortam notları
- Bulut ortamı "Mataf": ağ sınırlı (paket kayıtları + `mcp.expo.dev`); kurulum betiği `npm ci` çalıştırır. Expo erişim anahtarı yok: `eas` komutları burada çalışmaz (proje sahibi anahtar vermedi, 28.11.2026).
- Kullanıcının ağından Overpass açılmıyor; OSM sorgusu `osm-fetch.yml` ile GitHub'da çalışır.
- Bulut oturumunda `gh` GraphQL çalışmıyordu: `gh workflow run` için `--ref main` ver, sürüm dosyalarını `curl -L https://github.com/sozerahmethayri-ops/Mataf/releases/download/<etiket>/<dosya>` ile indir.
