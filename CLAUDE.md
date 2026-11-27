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
  - Harita: `react-native-webview` içinde MapLibre GL JS 5.24.1 (unpkg, yedek jsdelivr) + OpenFreeMap karoları; açılmazsa `PlainMap`. `react-native-maps` yalnız `GOOGLE_MAPS_API_KEY` verilirse.
  - `expo-notifications` (ezan), `expo-task-manager` (bildirimdeki "Kıldım" arka planda), `expo-audio` ve `expo-speech` (ses), `expo-location`.
  - Ana ekran kutuları: `expo-widgets` + `@expo/ui` (Android Glance), `patch-package` yamasıyla.
  - Kayıt `@react-native-async-storage/async-storage`; sunucu `@supabase/supabase-js`.
- Dış servisler: Photon (adres ve yer arama), OSRM (yürüme ve araç rotası), Transitous/MOTIS (toplu taşıma), api.alquran.cloud ve cdn.islamic.network (Kur'an metni ve sesi), OpenFreeMap (karo), Overpass (yalnız yedek), Supabase.
- Ortam değişkenleri (`.env.example`): `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `EXPO_PUBLIC_TRANSITOUS_CONTACT`, `EXPO_PUBLIC_TRANSITOUS_WEB` (web'de Transitous), `GOOGLE_MAPS_API_KEY`, `WEB_BASE_URL` (Pages alt klasörü `/Mataf`). İş akışları bunları GitHub secrets'tan okur (`SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `GOOGLE_MAPS_API_KEY`; henüz girilmedi).
- Yazı tipi: arayüz sistem yazı tipinde. Yalnız Kur'an metni için seçilebilir hatlar (0.17.0, proje sahibinin isteği): Amiri Quran, Scheherazade New, Noto Naskh Arabic, Lateef (`@expo-google-fonts/*`, OFL; seçilince `Font.loadAsync`, dosyalar uygulamanın içinde). Yeni hat ancak Uthmani Kur'an işaretlerini tam çiziyorsa eklenir (`docs/VERI-KAYNAKLARI.md`).

## Komutlar
- `npm install`: postinstall `patches/expo-widgets+58.0.29.patch`'i uygular.
- Her değişiklikten sonra üçü de temiz olmalı: `npm run typecheck`, `npm run lint`, `npm run check` (291 test, her satır `OK`). CI typecheck ve check çalıştırır.
- `npx expo start`: Expo Go'da kutular, özel ezan sesleri ve tam zamanlı alarm yok; yerel davranışı APK ya da duman testinde gör.
- Web görüntüsü: `npx expo export -p web --output-dir /tmp/web`, sonra `python3 tools/web-shots/shoot.py /tmp/web /tmp/shots tools/web-shots/ornek-spec.json`. Spec biçimi dosyanın başında.
- Emülatör (duman testi, ~25 dk): `gh workflow run android-smoke.yml -R sozerahmethayri-ops/Mataf --ref main`. Sonuçlar "smoke-latest" sürüm sayfasında: `crash.txt`, `status.txt`, `screen-*.png`, `logcat.txt`, `widget-log.txt`, `alarm.txt`. Akış `scripts/smoke.sh`'te.
- OSM verisi: `gh workflow run osm-fetch.yml -R sozerahmethayri-ops/Mataf --ref main -f query='…'`. Sonuç "osm-data" sürümünde `out.json`; `scripts/*.py` uygulama verisine çevirir. Sorgular `scripts/osm-3d.md`'de.

## Kod haritası
| Yer | İçerik |
|---|---|
| `src/app/` | Rotalar. `(tabs)/`: `harita`, `kuran`, `index` (Ana sayfa), `ulasim`, `menu`. Diğerleri yığın ekranı; dosya adı yoldur (`vakitler`, `umre`, `hac`, `tavaf`, `say`, `cemerat`, `erisim`, `tren`, …) |
| `src/screens/` | Birden çok rotanın paylaştığı ekran gövdeleri: `HomePrayer`, `PrayerTimes`, `MapScreen`, `Tawaf`, `Zikir`, `Menu`, `QuranList`, `HadithScreen` |
| `src/components/` | `ui.tsx` (Screen, Header, Card, Btn, Chip, Segmented, ListRow, SelectRow, Toggle, StatusPill, `T` yazı stilleri), `Icon.tsx`, haritalar (`OnlineMap` + `onlineMapHtml.ts`, `PlainMap`, `TransportMap`, `CityMap`, `MosqueMap`), `HaramScene`, `SkyScene` + `sceneArt`, `WidgetPinRow`, `AdhanHost` |
| `src/services/` | Mantık ve bağlamlar; React'sız olanlar testli: `prayer`, `adhanPlan`, `adhanNotify`, `prayedTask`, `location`, `transport`, `railRouter`, `transitText`, `routing`, `reports`, `tawaf`, `say`, `hac`, `kaza`, `offline`, `widgetProps`, `widgetSync`, `update`, `errorLog`, `ThemeContext`, … |
| `src/scene/` | Kendi 3D motorumuz: eğik izdüşüm (`oblique.ts`), Mekke ve Medine sahneleri, Kâbe modeli, tavaf sahnesi |
| `src/data/` | Gömülü veri: kapılar, dualar, umre ve hac adımları, tren, erişim, `osm/` (3D binalar, hac yerleri), `istanbulRail.json`, `makkahBus.json` |
| `src/widgets/` | Ana ekran kutuları (her biri `'widget'` yönergeli, ayrı JS ortamı) |
| `src/i18n/` | `strings.ts` (ortak metinler, `t('…')`), dil seçimi ve RTL |
| `src/constants/theme.ts` | Renkler, paletler, yazı ölçeği, aralıklar |
| `scripts/` | `check-logic.ts` (testler), `smoke.sh` (emülatör), OSM dönüştürücüleri (`ist_rail.py`, `makkah_bus.py`, `hac_sites.py`, `osm3d_encode.py`), `make-sounds.py` |
| `tools/` | `web-shots/` (web ekran görüntüsü), `supabase-test/` (RLS kurallarını yerel Postgres'te deneme) |
| `supabase/schema.sql`, `docs/` | Veritabanı şeması; `MIMARI.md` (katmanlar, kapı durumu kuralları), `SUPABASE.md` (kurulum), `VERI-KAYNAKLARI.md` (her verinin kaynağı ve lisansı) |
| `.github/workflows/` | `android-apk`, `ci`, `web-pages` (main'e her gönderimde); `android-smoke`, `osm-fetch` (elle); `supabase-keepalive` (3 günde bir) |

Platforma özel dosyalar: `X.web.tsx`, `X.android.ts`, `X.types.ts`. Giriş `index.ts`: önce `expo-router/entry`, sonra uygulama kapalıyken de tanımlı olması gereken arka plan görevi (`services/prayedTask`).

## Kodlama kuralları
- **Metin:** Kullanıcıya görünen her yazının `tr`, `en`, `ar` karşılığı olur. Ekrana özel yazılar dosyada `const L = { anahtar: { tr, en, ar } }` ve `pick(L.anahtar, lg)`; ortak olanlar `src/i18n/strings.ts` ve `t('…')`; üç sözlük aynı anahtarları ve `{değişken}`leri taşır (test var; eksik Arapça anahtar İngilizceye düşüyordu). Arapça seçilince telefonda `I18nManager.forceRTL` (yeniden başlatınca), web'de `<html dir="rtl">` ile yön döner. Web'de sekme kaydırıcısı yön bilmez: soldan sağa kalır, sayfaların içi ve alt çubuk sağdan sola (`(tabs)/_layout.tsx`). Yön simgeleri (`chevron`, `back`) sağdan sola düzende aynalanır (`Icon.tsx`, `useLayoutRtl`); dönüş okları aynalanmaz.
- **Türkçe yazım:** Eki cins isim taşır, özel ad yalın kalır: "Yenikapı istasyonunda inin", "Al-Shabeka 439 durağında inin", "{p} vaktine kalan". Kısa, gündelik dil; sayı birimiyle ("≈ 27 dk", "560 m").
- **Tema:** Renkleri `C` nesnesinden çizim anında oku; tema değişince `applyTheme` aynı nesneyi günceller, ekranlar yeniden kurulur. Modül düzeyinde renkten türeyen stil varsa `onThemeChange` ile yenile. Yazı boyutu `fs(n)`, Arapça `fsAr(n)`, ortak stiller `T`. Yeni renk çifti WCAG AA'yı geçmeli (`check-logic.ts` kontrast testleri).
- **Kayıt:** `usePersisted(anahtar, başlangıç)` ya da AsyncStorage. Var olan anahtar adları kalıcıdır (`theme:prefs`, `adhan:prefs`, `mataf.city`, `mataf.lang`, `mataf.hotel.<şehir>`, `prayer:log`, `prayer:logHidden`, `quran:plan`, `zikir:goal`, `trip:checklist`, `widget:logCtx` …); adı değişirse kullanıcının kaydı kaybolur.
- **React Compiler (lint):** Çizimde `ref.current` okunmaz. Effect içinde `setState` yerine türetilmiş değer ya da `setTimeout(…, 0)`. `Animated.Value` için `useState(() => new Animated.Value(0))`.
- **Kutu dosyaları (`src/widgets/`):** Ayrı Hermes ortamında çalışır, dosya dışındaki değerlere erişmez. Babel yardımcısı istemeyen sözdizimi yaz: `a && a.b`, üçlü işleç, klasik `for` (`?.`, `??`, yayma `...` ve `for…of` çalışmaz). Glance'te bir `Row`/`Column` en çok 10 çocuk çizer, fazlasını sessizce keser; `weight` yok, sağa yaslamak için `Box contentAlignment`. Değişen kutuyu duman testinin görüntüsünde gör.
- **expo-widgets yaması** (`patches/expo-widgets+58.0.29.patch`): sabitleme, kurulu kutu sayısı, dokununca açma, 30 dk yenileme, `scheduleWidgetTicks` + `WidgetTicks.kt`. expo-widgets sürümü değişirse `node_modules`'te yeniden uygula ve `npx patch-package expo-widgets` ile yamayı üret.
- **Arka plan görevi:** `TaskManager.defineTask` giriş dosyasından (`index.ts`) yüklenen modülde, modül düzeyinde çağrılır. Ekran ya da `_layout` içinde tanımlanan görev uygulama kapalıyken bulunmaz; expo-task-manager bulamadığı görevin kaydını siler. Görev sonucu beklenir (kutu yazımı dahil); yoksa görünmeden açılan JS iş bitmeden kapanır.
- **Simgeler:** `Icon.tsx`'teki yol tablosu. Olmayan ad tür denetiminde yakalanmaz, boş çizilir; yeni simgeyi tabloya ekle.
- **Ağ:** Her istek uygulamayı tanıtan User-Agent taşır. Yer ve cami araması Photon'la (Overpass yalnız yedek). Transitous koşulları: açık kaynak, ticari değil, iletişimli User-Agent, ekranda `transitous.org/sources` bağlantısı; günde ~720 `/plan` isteği aşılırsa onlarla konuşulur. Mekke ve Medine'nin 90 km çevresinde Transitous'a istek gitmez (Suudi Arabistan verisi yok).
- **Test:** Mantığı React'sız `src/services/*.ts` dosyasına koy, `scripts/check-logic.ts`'e `ok(koşul, 'açıklama')` ekle.
- **Dinî içerik:** Hanefî, Diyanet kaynaklı; her adım ve duanın yanında kaynağı yazar. Rehber ekranlarında "henüz bir ilahiyatçı kontrolünden geçmedi" notu durur. Ayet, hadis ve dua metni yalnız kaynağa ya da hocanın düzeltmesine göre değişir. Ayet metinleri API'den gelir (gömülü değil); hadis duaları `src/data/duas.ts`'te.
- Yorumlar Türkçe, tanımlayıcılar İngilizce.

## Sürüm çıkarma
`main`'e her gönderim APK'yı ve web'i yeniden yayınlar; kullanıcıya görünen her değişiklik sürüm alır.
1. `npm run typecheck`, `npm run lint`, `npm run check` temiz.
2. Sürümü yükselt: `package.json` `version`; `package-lock.json` en üstteki iki `version`; `app.json` `expo.version` ve `android.versionCode` (+1).
3. README: değişiklik günlüğünün başına bir madde; "Durum" satırında sürüm.
4. Commit: Türkçe, ilk satır `0.13.5: kısa özet`, altında madde madde ne ve neden. `main`'e gönder.
5. "Android APK" iş akışı bitince `https://github.com/sozerahmethayri-ops/Mataf/releases/download/apk-latest/version.json` yeni sürümü gösterir. Uygulama buna 6 saatte bir bakar, yeni sürümde "İndir" şeridi çıkarır.
6. Yerel davranış değiştiyse (kutular, bildirim, yama, izin, derin bağlantı) duman testini çalıştır. Bitti sayılması için: `crash.txt` "çökme kaydı yok" ile başlar; `status.txt`'te beş "eklendi: 1" satırı, "vakit alarmı: 24 (farklı an: 24)" ve "kıldım: süreç kapatıldı evet, bildirim önce 1, düğme 1, sonra 0, görev 1" var; ilgili `screen-*.png` gözle doğru.

## Tasarım kuralları
### Renkler (`src/constants/theme.ts`)
| Belirteç | Açık | Koyu |
|---|---|---|
| `bg` | #FBF7F1 (krem) | #17120E |
| `surface` | #F3EBDF (kum) | #231C16 |
| `border` / `borderStrong` | #E9DFD1 / #DCCFBE | #30271F / #40352B |
| `ink` / `ink2` / `muted` | #2A2018 / #4A3D33 / #6F5D4C | #F6EFE7 / #E2D7CA / #B3A393 |
| `closed` (kapalı) | #B42318 | #FF8A80 |
| `limited` (kısıtlı) | #92400E, dolgu #F5A524 | #F7C55A |
| `open` (açık) | #0F766E | #4FD1BB |
| `user` (sizin konumunuz) | #2563EB | #6EA0FF |
| `green` / `gold` | #26754A / #C9A227 | #2A8550 / #D9B440 |

- Vurgu paletini kullanıcı seçer: Kiremit (varsayılan; `accent` #B4420F, `route` #F26A1B; koyuda `accent` #F7934F), Zümrüt, Gece mavisi, Altın, Gül. Her palette `accent`, `onAccent`, `accentTint`, `accentSoft`, `route` var; hepsi açık ve koyuda WCAG AA. Kiremit dışındaki paletler zemin, yüzey, çizgi ve yazı tonlarını da değiştirir (`theme.ts`, `PALETTES.*.light/dark`); tablo Kiremit'in değerleridir.
- Anlamlar sabit: kırmızı kapalı (X simgesiyle; renk tek başına anlam taşımaz), amber kısıtlı, deniz yeşili açık, turuncu rota, mavi yalnız "siz" (aile üyesi renklerinde mavi yok).
- Gölge sıcak kahve (#4A3424, opaklık 0,12; koyuda siyah 0,45).

### Yazı
- Sistem yazı tipi. `T.h1` 26/700, `T.h2` 18/700, `T.h3` 16/700, `T.body` 15 (satır 22), `T.muted` 13, `T.small` 12, `T.section` 14/700 vurgu renginde, cümle düzeninde (büyük harf dönüşümü yok: Türkçe "i" → "I" oluyordu); Arapça `T.arabic` 24 (satır 40), sağa yaslı. Hepsi kullanıcının yazı ölçeğiyle büyür (`fs`, `fsAr`).

### Biçim ve davranış
- Aralık `S`: 4/8/12/16/20/24. Köşe `R`: 10/14/18/24/hap. Kart: `surface` zemin, ince `border`. Dokunma alanı en az 44 px.
- Hazır parçaları kullan (`ui.tsx`); yeni ekran `Screen` + `Header` ile kurulur.
- Sadelik: ekranda bir ana eylem; ikincil seçenek katlanır satırda (`SelectRow`) ya da Menü aramasında.
- Şablon (yapay zeka) görünümünden kaçın (0.13.5): simge renkli kare ya da daire zemine oturmaz, yazının yanında durur; başlıkta büyük harf ve harf aralığı yok; alt sekmeler eşit, ortada büyütülmüş düğme yok; kısa arayüz metninde uzun tire (—) yok; veri canlı değilse "canlı" yazılmaz. Menü gruplu liste, ana sayfa kısayolları iki sütun.
- Palet ekranın her yerinde hissedilir (0.15.0, proje sahibinin isteği): zemin, yüzey, çizgi ve yazı paletin tonunu taşır; simgeler, bölüm başlıkları, seçili çip ve sekme, ilerleme çubukları vurgu renginde. Renkli zeminli kart yalnız anlam taşıyınca (durum renkleri, uyarı, seçili, bugünkü adım, cuma).
- Ana sayfa: üstte resimli, hareketli gökyüzü (Mekke'de Kâbe, Saat Kulesi ve tavaf eden kalabalık; Medine'de Yeşil Kubbe; başka yerde cami). Gökyüzü rengi güneşin yüksekliğine göre değişir, güneş ve ay gerçek yerinde durur. Animasyon yerel sürücüyle, yalnız ekran öndeyken ve "Hareketleri azalt" kapalıyken.
- Harita: etiketler çakışmaz (yer yoksa gizlenir), hedef etiketi hep görünür; Saat Kulesi yarı saydam; ölçek çubuğu; "© OpenStreetMap" atfı.
- Kutular: krem ve kum zemin; sıradaki vakit vurgu renginde ve açık zeminde, geçenler soluk. Adlarda hücre sayısı yok (başlatıcıya göre değişir): kare, geniş, uzun, tek satır, namaz takibi.
- İlk ekran taslakları: https://claude.ai/artifact/ANqaTkraeKbHq1RJ6kE4yA. Oradaki beyaz zemin ve #C2410C eskidir; geçerli olan bu bölüm.

## Mimari kararlar
1. **Hesap telefonda:** namaz vakti (Suudi saat dilimlerinde Ümmü'l-Kurâ, Türkiye'de Diyanet), kıble, güneş ve ay, toplu taşıma tarifi. İnternetsiz ve sunucusuz çalışsın diye.
2. **Önbellek ve çevrimdışı:** ağdan gelen içerik `cachedJson` ile cihazda; ağ yoksa son kayıt. Çevrimdışı paket (`/cevrimdisi`): Mekke ve Medine harita karoları, stil, yazı tipleri, MapLibre, Kur'an baskıları, dua sesleri.
3. **Harita:** Google yerine MapLibre + OpenFreeMap (anahtarsız, ücretsiz), WebView içinde; açılmazsa sade harita. Haremlerin 3D görünümü kendi SVG motorumuzla, gömülü OSM "Simple 3D Buildings" verisinden.
4. **Overpass yerine Photon:** Overpass kullanıcının ağından açılmıyor; uygulama içi arama Photon'la, veri çıkarımı `osm-fetch.yml` ile GitHub'da.
5. **Sunucu isteğe bağlı:** Supabase yoksa kapı bildirimleri yerel demo, aile konumu önizleme. Yetki RLS'de (`supabase/schema.sql`). Kapı durumu kuralları (resmî duyuru önce, 3 farklı kişi, 2 saat, kapıya ≤150 m) `docs/MIMARI.md`'de.
6. **Tema:** tek değiştirilebilir `C` nesnesi; tema değişince yalnız ekranlar yeniden kurulur (`ScreenRemount`). Kök gezgini yeniden kurmak çöküyordu (0.6.0).
7. **Dağıtım:** mağaza yok. APK GitHub Releases'te ("apk-latest"; hata ayıklama anahtarıyla imzalı, yan yükleme için), iPhone için GitHub Pages web sürümü. R8 küçültme kapalı (WorkManager/Room açılışta çöküyordu). Gradle'a 6 GB bellek (`plugins/withGradleMemory.js`; D8 bellek hatası).
8. **Bildirim planı:** yerelde 7 gün, en çok 60 bildirim (iOS 64 sınırı); önce hatırlatmalar (mübarek gün, hac), kalan yere ezanlar. Android 12+ tam zamanlı alarm izni yoksa uyarı ve "İzni aç". Vakit bildirimindeki "Kıldım" Android'de uygulamayı açmaz: expo-notifications düğmeye dokununca arka plan görevini çalıştırır (uygulama kapalıysa JS görünmeden yüklenir), görev vakti işler, bildirimi kapatır, kutuyu yeniler. Görev kurulamazsa düğme uygulamayı açar ve AdhanHost işler (0.20.0).
9. **Kutu yenileme:** sıradaki vakti kutu her çizimde `Date.now()` ile kendisi bulur (30 günlük veri). Uygulama her eşitlemede sonraki 24 vakit ve gün başını `scheduleWidgetTicks` ile AlarmManager'a verir (izin varsa tam zamanlı, yoksa 10 dk pencere); ayrıca 30 dk'da bir yenileme.
10. **Toplu taşıma:** Transitous'ta olmayan yerler için OSM'den çevrimdışı ağ (İstanbul raylı sistem, Mekke otobüsü) ve RAPTOR benzeri tarif (`railRouter.ts`). Sefer saati yok; süre ortalama hız ve bekleme süresinden, ekranda "≈". Transitous sonuçları aynı listeye süreye göre girer. Medine'de veri yok; harita uygulaması açılır.
11. **Yatsıdan sonra yarın:** ekranlar ve kutular yarının vakitlerini gösterir (`shownDay`); vurgulanan imsak geri sayımla aynı olsun diye.
12. **İç mekân:** çizilmiş iç mekân modelleri kaldırıldı (gerçek görüntü yok). Hedef: Canlı Görünüm (AR) ve resmî veri (alharamain.gov.sa akıllı harita, sütun kodları). Resmî planlar izinsiz kopyalanmaz.
13. **Gizlilik:** aile konumu yalnız uygulama açıkken paylaşılır, geçmiş tutulmaz. Fotoğraflarda yüz bulanıklaştırma cihazda yapılacak. Kişisel veri URL'ye konmaz.
14. **Veriden bilinçli sapmalar:** OSM'de turuncu işaretli kubbeler mermer tonunda; Yeşil Kubbe kasnak + sivri kubbe (~26 m); Medine çatısındaki 27 sürgülü kubbe çizilmez (yerleri bilinmiyor). Ana kapılar: Mekke 1, 79, 62, 45, 100; Medine 1, 41, 37, 20–22, 7–9, 33–35.
15. **Doğrulama üç katlı:** saf mantık testleri (Node), web ekran görüntüsü (Playwright), emülatör duman testi (API 34). Gerçek cihaz denemesi henüz yapılmadı.

## Tamamlanan özellikler (0.21.1)
Sürüm sırasıyla ayrıntı README.md'nin başında.
- **Ana sayfa ve vakitler:** resimli gökyüzü, geri sayım, altı vakit, hicrî tarih, yaklaşan mübarek gün, teşrik tekbiri; Vakitler ekranı (haftalık tablo, güneş ve ay bilgisi); hesaplama yöntemi; ana sayfa seçimi (sade vakit, Kur'an, harita, tavaf, zikir, hadis). `screens/HomePrayer.tsx`, `PrayerTimes.tsx`, `services/prayer.ts`.
- **Her gün dönülen yerler (0.14.0):** namaz takibi (ana sayfada bugünkü beş vakit tek dokunuşla; ekranda son 7 gün, seri, kaza bağlantısı; kayıt telefonda, yedeğe girer), günün duası (kaynaklı kısa dualardan güne göre). `app/namaz-takibi.tsx`, `components/PrayerLogCard.tsx`, `DailyDuaCard.tsx`, `services/prayerLog.ts`, `usePrayerLog.ts`, `daily.ts`.
- **Bağlılık (0.15.0):** hatim planı (30–180 gün, bölüm cüze göre eşit, Hatim ayracından; ana sayfa kartı, yatsıdan sonra hatırlatma), cuma kartı ve hatırlatması (Kehf), günlük zikir hedefi (ana sayfada), son 7 günün özeti (namaz, zikir, hatim), ezan bildiriminde "Kıldım" düğmesi (0.20.0'dan beri Android'de uygulamayı açmadan vakti işler, bildirimi kapatır, kutuyu yeniler; `services/prayedTask.android.ts`, `index.ts`), hac-umre hazırlık listesi, temel Arapça ifadeler (göster, dinlet). `app/hatim.tsx`, `hazirlik.tsx`, `arapca.tsx`, `components/HatimCard.tsx`, `ZikirCard.tsx`, `FridayCard.tsx`, `services/hatim.ts`, `sharedPersisted.ts`, `data/checklist.ts`, `phrases.ts`.
- **Bildirimler:** ezandan önce ve vaktinde; 4 ses ve kendi kaydın; mübarek gün ve hac hatırlatmaları; tam zamanlı alarm uyarısı. `app/bildirimler.tsx`, `services/adhanPlan.ts`, `adhanNotify.ts`.
- **Ana ekran kutuları (Android):** kare, geniş, uzun, tek satır; Vakitler ve Ayarlar'dan eklenir; `mataf://vakitler?widget=<Ad>`. Namaz takibi kutusu (0.19.0, `PrayerLogWidget`): bugün kılınan vakitler vurgu renginde dolu daire ve ✓, kalanlar açık daire (0.21.1; ○ harfi küçük çiziliyordu), "3/5" ya da "Beş vakit tamam", hatim planı varsa "Hatim %N"; işaret değişince uygulama yazar (`services/logWidget.android.ts`, `useLogWidgetSync.ts`), "bugün"ü kutu kendisi bulur (yeni gün boş başlar); Namaz takibi ekranından eklenir.
- **Harem haritası ve navigasyon:** gerçek ölçekli 3D (OSM) ve 2D gerçek harita, katmanlar, kapı bildirimleri ve onayları, kapalı kapıya göre rota, adım adım yönlendirme. `screens/MapScreen.tsx`, `scene/`, `app/kapilar.tsx`, `bildir.tsx`, `navigasyon.tsx`.
- **Hac ve umre:** umre rehberi (7 adım), hac rehberi (tür seçimi, gün gün), cemerat sayacı ve atış vakti, hac yerleri haritası (Arafat, Mina, Harem içinde mi), tavaf asistanı (3D, GPS sayacı, sesli rehber), sa'y sayacı, tekerlekli sandalye ve araba bilgisi. `app/umre.tsx`, `hac.tsx`, `cemerat.tsx`, `hac-harita.tsx`, `tavaf.tsx`, `say.tsx`, `erisim.tsx`.
- **Ulaşım:** yürüme ve araç (OSRM); toplu taşıma adım adım (İstanbul raylı ve Mekke otobüsü çevrimdışı, gerisi Transitous); taksi ve şoföre gösterme kartı; Haremeyn treni; `mataf://ulasim?to=enlem,boylam&name=Ad`. `app/(tabs)/ulasim.tsx`, `services/transport.ts`, `railRouter.ts`, `transitText.ts`, `app/tren.tsx`.
- **Yer:** en yakın cami (dünyada), şehir haritası, otelime dön, Yerlerim, acil durum (numaralar, konum gönderme, hastaneler, temsilcilikler), aile ve grup konumu (Supabase'le).
- **Kur'an okuma (0.16.0):** beş görünüm (mealli, Arapça, meal, mushaf, tecvid); mushaf sayfası (çerçeve, sûre başlığı, palet renginde ﴿n﴾ âyet işareti); okuma ekranında yazı büyütme (A−/A+, `quran:prefs.zoom`, 0,8–2); secde âyetleri (Hanefî 14 yer, ۩ ve yeşil vurgu, tilâvet secdesi notu; kaynak metindeki ۩ ayrılır); tecvidli renkli görünüm (alquran.cloud `quran-tajweed`, çevrimdışı pakette de) ve kurallar sayfası (`/tecvid`, 17 renkli + 4 renksiz kural, renkli örnekler); hat seçimi (0.17.0: cihaz yazısı, Amiri Kur'an, Scheherazade, Noto Nesih, Lateef; okuma ayarlarında besmeleli önizleme; `quran:prefs.font`, satır yüksekliği yazının doğal yüksekliğinden kısa olmaz). `data/quranFonts.ts`, `services/useQuranFont.ts`. Sayfa numaraları (0.18.0): Medine Mushafı düzeni, 604 sayfa (`data/quranPages.ts`, quran-meta MIT); mushaf görünümü sayfa sayfa, her sayfa başında "Sayfa N · K. cüz", başlıkta sûrenin sayfaları, Kur'an listesinde ve ayraçlarda sayfa, hatim bölümünde kesin sayfa aralığı. Dört cüz bu düzende sayfa ortasında başlar (4, 7, 11, 26). `app/kuran/[sure].tsx`, `app/tecvid.tsx`, `services/tajweed.ts`, `data/tajweed.ts`, `data/sajdah.ts`.
- **İbadet içerikleri:** Kur'an (ayraçlar, kâriler, meal, tefsir), dualar, Sahîh-i Buhârî, zikirmatik ve istatistik, kaza namazı ve oruç takibi, Ravza ve Medine rehberi, kıble pusulası.
- **Genel:** ilk açılış, TR/EN/AR, açık/koyu tema ve 5 palet, yazı ölçeği, çevrimdışı paket, yedek ve geri yükleme, güncelleme uyarısı, hata ekranı ve kaydı, uygulamayı paylaşma, web sürümü.

## Şu anki durum
- Sürüm 0.21.1 (versionCode 32). CI, APK ve web yeşil. APK: https://github.com/sozerahmethayri-ops/Mataf/releases/download/apk-latest/mataf.apk; web: https://sozerahmethayri-ops.github.io/Mataf/.
- Doğrulandı: 291 mantık testi; web görüntüleri (Arapça sağdan sola dahil); emülatörde çökme yok, beş kutu eklendi ve çizildi (namaz takibi kutusu 0.19.0), 24 vakit alarmı kurulu, Mekke otobüs tarifi (7A) doğru.
- Doğrulanmadı: gerçek telefon, Mekke ve Medine'de saha, Samsung ve Xiaomi başlatıcıları.
- Proje sahibinden beklenenler: Supabase URL ve Publishable key (GitHub secrets'a), sahada deneme, hoca kontrolü (gözden geçirme belgesi: https://claude.ai/artifact/BZSU1wpF6vLspLDwDCGiGc), dağıtım izni olan bir ezan kaydı.
- Sürüm sürüm ayrıntılı notlar: claude.ai'deki "MATAF uygulama" projesinde `eksikler-ve-yol-haritasi.md`.

## Yapılacaklar (öncelik sırasıyla)
1. Saha denemesi: haritanın akıcılığı ve Suudi mobil ağında açılış süresi; tavaf ve sa'y sayacı (zemin, 1. kat, çatı); Arafat ve Mina sınır denetimi; kutular Samsung ve Xiaomi'de; bildirimlerin pil tasarrufunda gelmesi; Mekke otobüs sürelerinin Makkah Bus uygulamasıyla karşılaştırılması; çevrimdışı paketin boyutu ve süresi.
2. Supabase'i bağla (canlı kapı bildirimleri, aile konumu): `docs/SUPABASE.md`.
3. Dinî metinleri hocanın düzeltmeleriyle güncelle (tecvid kuralları sayfası ve secde notu dahil).
4. Bağlılık (ilke: suçlama yok, yarış ve sıralama yok, veri telefonda): Kur'an dışı günlük içerik (hadis) seçeneği.
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
- Telefon yeniden başlayınca kutu alarmları silinir; uygulama açılana dek 30 dk'lık yenileme sürer.
- Toplu taşıma süreleri yaklaşık (sefer saati yok). Transitous'un günlük sınırı ~720 istek. Medine'de veri yok. OSM'de durağı işlenmemiş yeni hatlar çıkmaz.
- Hicrî tarih ve hac günleri Ümmü'l-Kurâ takviminden; Suudi Arabistan'ın ilanıyla bir gün kayabilir.
- Pixel başlatıcısında geniş kutu 5×3 açılıyor; içerik ortada, altında ve üstünde boşluk kalıyor (görsel).
- Duman testinde başlatıcının ekleme penceresi ara sıra arkada kalıyor ("widget eklendi: 0"). Kod değil otomasyon; testi yeniden çalıştır.
- Bildirimdeki "Kıldım" yalnız Android'de uygulamayı açmadan işler; duman testinde deneme bildirimiyle (vakit işlenmeden) denendi, gerçek vakit bildirimiyle ve pil tasarrufu kipinde telefonda bakılmalı. Web: ezan bildirimi ve kutu yok, pusula kısıtlı; Arapçada sekmeler arasında kaydırarak geçiş kapalı (kaydırıcı yön bilmiyor, düğmeler çalışır).
- Kapı bildirimleri ve aile konumu Supabase bağlanana dek demo ve önizleme.
- APK hata ayıklama anahtarıyla imzalı; Play Store'a yüklenemez.
- Harem 3D modeli OSM kadar doğru; mescit içi hizmet noktaları örnek veri.
- Tecvid renkleri alquran.cloud `quran-tajweed` işaretlemesine dayanır (`[kural[metin]`); bulut oturumundan servis açılmadığı için gerçek metinle görülmedi, telefonda bakılmalı. Ayrıştırıcı tanınmayan işareti renksiz bırakır.
- GitHub'da kullanılmayan `probe` ve `smoke-run` dalları duruyor (bulut oturumundan silinemedi); elle silinebilir.

## Ortam notları
- Kullanıcının ağından Overpass açılmıyor; OSM sorgusu `osm-fetch.yml` ile GitHub'da çalışır.
- Bulut oturumunda `gh` GraphQL çalışmıyordu: `gh workflow run` için `--ref main` ver, sürüm dosyalarını `curl -L https://github.com/sozerahmethayri-ops/Mataf/releases/download/<etiket>/<dosya>` ile indir.
