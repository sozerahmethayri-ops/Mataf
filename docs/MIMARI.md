# Mimari ve kendini güncel tutma

## Katmanlar

| Katman | Dosyalar | Not |
|---|---|---|
| Ekranlar | `src/app/**` | Expo Router; sekmeler `(tabs)/` altında |
| 3D harita motoru | `src/scene/oblique.ts`, `makkah.ts`, `madinah.ts`, `src/components/HaramScene.tsx` | Metre cinsinden plan → eğik izdüşüm (yatay k px/m, derinlik k·0,58, yükseklik k·0,81). react-native-svg ile çizilir |
| Harita yerleşimi | `src/scene/layout.ts` | Kamera; Haram çekirdeğini, rotayı ve hedefi üst arayüz ile alt panel arasındaki boş alana sığdırır (`fitCamera`). Etiketler kapı işaretleriyle, hedefle ve Kâbe'yle çakışmayacak yere konur; yer yoksa gizlenir (`placeLabels`). Saat Kulesi kompleksi yarı saydam çizilir |
| Tavaf asistanı | `src/services/tawaf.ts`, `tawafFeed.ts`, `src/scene/tawafScene.ts`, `src/app/tavaf.tsx`, `src/data/tawaf.ts` | Kâbe geometrisi, bölgeler, şavt sayacı (medyan açı + sıçrama eleme + gürültüye göre pay), gerçek GPS/demo akışı, kullanıcının tarafından bakan 3D sahne |
| Ses | `src/services/voice.ts`, `quranIndex.ts` | Ayet: kâri kaydı (cdn.islamic.network); dua/yönlendirme: cihaz sesi (expo-speech); sıralı okuma kuyruğu |
| Kur'an | `src/services/quran.ts`, `tafsir.ts`, `QuranPrefs.tsx`, `src/data/quranEditions.ts` | Çok dilli meal/okunuş, ayet ayet ses, sesli meal, tefsir; tercihler cihazda |
| Dualar | `src/data/duas.ts`, `src/components/DuaBlock.tsx` | Metin kayıtları (hadis) + ayet kayıtları (API'den, seçili meal dilinde) |
| En yakın cami | `src/services/mosques.ts` (saf, testli), `mosqueStore.ts`, `src/app/cami.tsx`, `src/components/MosqueMap.tsx` | Overpass sorgusu (cami, mescit, çok inançlı ibadet odası), kademeli yarıçap, yedek sunucular, aynı caminin kayıtlarını birleştirme, çevrimdışı son sonuç, yön/mesafe, harita uygulamasında tarif |
| Rota | `src/services/routing.ts` | Mescidin dış halkası üzerinden kısa yön + açık kapı seçimi. Kapı `closed` / `exitOnly` ise atlanır |
| Kapı bildirimleri | `src/services/reports.ts`, `ReportsContext.tsx` | Yerel demo (AsyncStorage) ya da Supabase (gerçek zamanlı) |
| İçerik | `quran.ts`, `hadith.ts`, `osm.ts`, `cache.ts` | Ağdan indirilir, cihazda saklanır, çevrimdışı çalışır |
| Namaz / kıble | `prayer.ts`, `location.ts` | adhan kütüphanesi; telefonda hesaplanır |

## Kapı durumu kuralları (`summarize`)

1. Resmî duyuru (son 12 saat) önceliklidir.
2. Ziyaretçi bildirimi **3 farklı kişi** aynı durumu bildirince görünür.
3. **2 saatten** eski bildirim düşer (uygulama her dakika yeniden hesaplar).
4. Resmî "kapalı" bilgisine rağmen ≥3 kişi "açıldı" derse açık gösterilir (resmî kaynak güncellenene kadar).
5. Bildirim için kapıya ≤150 m uzaklık istenir; konum yoksa "doğrulanmamış" işaretlenir.

`npm run check` bu kuralları ve kapı kapanınca yeniden rotalamayı test eder.

## Üç güncelleme hızı

| Hız | Veri | Nasıl |
|---|---|---|
| Saniyeler | Kapı bildirimleri, resmî kapanmalar | Supabase Realtime aboneliği; ayrıca 5 dakikada bir tam yenileme |
| Gün / hafta | Kur'an, hadis, şehir yerleri | `cachedJson` — süresi dolunca yeniden indirir, ağ yoksa son kaydı kullanır. "Veri kaynakları" ekranında elle eşitleme |
| Sürüm | Arayüz, kurallar, harita geometrisi | `eas update` ile mağaza beklemeden OTA güncelleme (planlanan) |

## Planlanan

- Resmî kurum API'si: kapanma ve rota verisi → `reports` tablosuna `official=true` yazan sunucu görevi.
- Ses ve titreşimle yönlendirme (expo-speech, expo-haptics).
- Kur'an ses kaydı (expo-audio).
- İç mekân: sütun kodu / QR ile konum düzeltme, Bluetooth işaretçileri, barometre ile kat tespiti; Canlı Görünüm (AR).
- Fotoğraf yükleme (Supabase Storage) — yüz bulanıklaştırma cihazda yapılmalı.
