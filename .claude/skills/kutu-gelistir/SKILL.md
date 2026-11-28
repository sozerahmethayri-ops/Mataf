---
name: kutu-gelistir
description: MATAF'ın Android ana ekran kutularını (widget) geliştirme ve düzeltme rehberi. Kapsam - src/widgets/*, expo-widgets + @expo/ui Glance, patches/expo-widgets+58.0.29.patch, widgetProps.ts, widgetSync.android.ts, logWidget, WidgetPinRow, geri sayım (Chronometer), kutu rengi ve şeffaflığı, vakit alarmları (scheduleWidgetTicks). Kutunun görünümü, yeni kutu, kutuda kesilen yazı, sayaç, yama ya da kutu yenilemesiyle ilgili her işte, "widget", "kutu", "ana ekran" geçtiğinde kod yazmadan önce bu skilli oku. Kutu kodu ayrı bir JS ortamında çalışır; burada yazılı kurallar bilinmeden yazılan kod derlenir ama telefonda boş ya da kesik çizilir.
---

# Ana ekran kutuları (Android)

## Yapı

| Kutu | Dosya | Boy | Not |
|---|---|---|---|
| Geniş (günün vakitleri) | `src/widgets/PrayerWidget.tsx` | 4×2 | ortak türler burada: `PrayerWidgetProps`, `PrayerWidgetColors`, `PrayerWidgetDay`, `CountdownProps` |
| Kare (sıradaki vakit) | `NextPrayerWidget.tsx` | 2×2 | |
| Uzun (vakit listesi) | `PrayerListWidget.tsx` | 2×3 | altı satır ayrı `Column`'da |
| Tek satır (şerit) | `PrayerStripWidget.tsx` | 4×1 | dar kutuda "kaldı" yazılmaz |
| Namaz takibi | `PrayerLogWidget.tsx` | 4×2 | `PrayerLogWidgetProps`; "bugün"ü kutu kendisi bulur |
| Kalıcı vakit bildirimi | `PrayerNotification.tsx` | bildirim | `createCustomNotification`; kapalı/açık düzen; `setOngoingPrayer` (widgetSync.android.ts) koyar, vakit alarmı yeniden çizer |

- **Veri (React'sız, testli):** `src/services/widgetProps.ts`. `buildWidgetProps` 30 günlük vakti, yeri, dili, rengi ve şeffaflığı hazırlar. `buildLogWidgetProps` namaz takibi kutusunu hazırlar. `widgetTicks`/`widgetNext` sıradaki anları bulur. `withAlpha` ve `widgetMode` de burada.
- **Yazma:** `widgetSync.android.ts` yer, yöntem, dil ya da tema değişince bütün vakit kutularına `updateSnapshot` yapar ve sonraki 24 vakti `scheduleWidgetTicks` ile AlarmManager'a verir. Namaz takibi kutusu için `logWidget.android.ts` + `useLogWidgetSync.ts`. Web ve iOS'ta `.ts` boş eşleri var.
- **Ekleme:** `WidgetPinRow` (Vakitler, Ayarlar, Namaz takibi ekranları) `requestPinWidget(ad)` çağırır. Derin bağlantı `mataf://vakitler?widget=<Ad>`.
- **Kayıt:** `app.json` → `plugins` → `expo-widgets` → `widgets[]`: ad, görünen ad, açıklama, `minWidth/minHeight`, `targetCell*`, `initialLayout`.
- **Ayarlar:** `theme:prefs.widget` (`dark` varsayılan, `light`, `theme`) ve `theme:prefs.widgetClear` (%0–80, varsayılan 40). Anahtar adları kalıcıdır; değiştirme.

## Kutu dosyasında yazım kuralları

Her kutunun çizim işlevi `'widget'` yönergesiyle başlar. Gövde derlemede dizeye çevrilir ve uygulamadan ayrı, küçük bir Hermes ortamında çalışır. Bu yüzden:

- Gövde dosyadaki başka hiçbir değere, içe aktarmaya ya da yardımcıya erişemez. Sabitleri, yedek renkleri ve adları gövdenin içine yaz. Bileşenler (`Box`, `Row`, `Column`, `Text`, `Spacer`) ve değiştiriciler (`fillMaxSize`, `background`, `cornerRadius`, `padding`, `width`, `height`…) o ortamda küreseldir. Dosyada yalnız `declare const X: typeof UI.X` ile tür olarak bildirilir.
- Babel yardımcısı gerektiren sözdizimi çalışmaz: `?.`, `??`, yayma `...`, `for…of` ve dizi ayrıştırma. Bunların yerine `a && a.b`, üçlü işleç ve klasik `for` kullan.
- Gelen veri dizedir. Anları `Number(day.a[j])` ile sayıya çevir; sıradaki vakti her çizimde `Date.now()` ile kutu kendisi bulur.

## Glance sınırları

- Bir `Row` ya da `Column` en çok 10 çocuk çizer, fazlasını sessizce keser. Uzun listeleri iç içe `Column`'a böl.
- `weight` yok. Sağa ya da ortaya yaslamak için `Box contentAlignment="centerEnd"` gibi bir kap kullan.
- Satıra sığmayan son çocuk sıfır genişliğe sıkışır. Önemli olanı önce koy; dar kutuda isteğe bağlı yazıyı hiç çizme.
- `env.width` ve `env.height` kutunun gerçek boyudur (dp, yamadan gelir); `env.colorScheme` açık ya da koyu.
- `null` çocuk atlanır, dizi çocuklar düzleşir. Koşullu çizim için `{kosul ? <X/> : null}` yazılabilir.
- Yazı boyları sp, kenarlar dp'dir. Emülatör 320 dp genişliktedir; gerçek telefonda kutu daha geniştir. Düzeni dar ekrana göre kur.

## Geri sayım

- `Text`'e `countdownTo` (hedef an, ms) verince yerelde Android `Chronometer` olur ve saniye saniye kendiliğinden işler (yama: `WidgetCountdown.kt`). `Text`'in içindeki yazı yalnız yedektir.
- Türü: `const Countdown = Text as unknown as (p: CountdownProps) => ReactElement;` `color`, `maxLines` ve `style` (`fontSize`, `fontWeight`, `textAlign`) geçer; `textAlign` yerelde gravity olur.
- Sayaç bulunduğu kabın kalan alanına yayılır. Ya kendi `Column`'unun son çocuğu olsun ya da sabit genişlikli bir `Box` içinde dursun; yoksa yanındaki ve altındaki öğeleri gizler.
- Vakit girdikten sonra kutu yenilenene dek sayaç eksiye düşer ("−0:12"). Tam zamanlı alarm izni yoksa bu 10 dakikaya kadar sürebilir.

## Renk

- Renk `#RRGGBBAA` (alfa sonda) ya da `rgba()` olur. Zeminin şeffaflığını `withAlpha` verir; yazılar hep opaktır.
- Sıradaki vakit hapı paletin vurgusuyla dolu, üstündeki yazı `onAccent` rengindedir; her palette WCAG AA geçer (`check-logic.ts`'te kontrast testi). Geçen vakitler soluk (`muted`) yazılır.
- Her kutuda verinin gelmediği durum için gövde içinde yedek renk nesnesi olmalı.

## Yama (`patches/expo-widgets+58.0.29.patch`)

Yamanın içeriği:
- kutu sabitleme (`requestPinWidget`), kurulu kutu sayısı, dokununca uygulamanın açılması, 30 dk yenileme;
- `scheduleWidgetTicks` + `WidgetTicks.kt` (vakit anında yenileme);
- canlı geri sayım (`countdownTo` → `WidgetCountdown.kt` + `res/layout/expo_widgets_countdown.xml`);
- `env.width` ve `env.height`.

Glance'te internal olan `EmittableAndroidRemoteViews`, dosya başında `@file:Suppress("INVISIBLE_MEMBER", "INVISIBLE_REFERENCE", "RestrictedApiAndroidX")` ile kullanılır.

Yamayı değiştirme adımları:
1. `node_modules/expo-widgets/…` altındaki dosyaları düzenle.
2. `npx patch-package expo-widgets` ile yamayı yeniden üret.
3. `git diff patches/` ile yalnız istediğin değişikliğin girdiğini gör.
4. expo-widgets sürümü değişirse yamayı yeni sürüme elle uygula ve aynı komutla yeniden üret. Dosya adı sürümü taşır; CLAUDE.md'deki adı da güncelle.

`npm install` yamayı `postinstall` ile uygular. Kotlin hatası ancak APK derlenirken görünür; bunun için `android-apk` ya da `android-smoke` iş akışını çalıştır.

## Yeni kutu eklemek

1. `src/widgets/<Ad>.tsx`: yukarıdaki kurallarla `createWidget<Props>('<Ad>', layout, { empty: '…' })`.
2. `app.json` → `expo-widgets` → `widgets[]` kaydı.
3. Veri `widgetProps.ts`'te React'sız bir işlevle hazırlanır, testi `scripts/check-logic.ts`'e eklenir.
4. Yazma: `widgetSync.android.ts`'e ya da ayrı bir eşitleyiciye bağla; `WidgetPinRow`'a seçenek ekle; metinler üç dilde (`metin-ekle` skilli).
5. `scripts/smoke.sh`'teki kutu döngüsüne adı ekle; `duman-testi` skillindeki ölçüt listesini ve `smoke_check.py`'deki `WIDGETS`'i güncelle.

## Doğrulama

- Mantık: `npm run check`. Kutu görünümü testleri `widgetProps` üzerinden yürür.
- Görünüm yalnız emülatörde görülür; `duman-testi` skillini kullan. Kutu görüntüleri `screen-41`, `44–47` ve `48-ana-ekran-*`. Ölçütler geçse de görüntüye bak: kesilen yazı ("tom…"), gizlenen satır ve boş kutu ancak görüntüde görünür.
- Web ve Expo Go'da kutu yok.

## Bilinen sınırlar

- Telefon yeniden başlayınca vakit alarmları silinir; uygulama açılana dek 30 dk'lık yenileme sürer.
- Pixel başlatıcısında geniş kutu 5×3 açılıyor; içeriğin altında ve üstünde boşluk kalıyor.
- Samsung ve Xiaomi başlatıcılarında hiç denenmedi.
