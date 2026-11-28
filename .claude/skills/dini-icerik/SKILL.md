---
name: dini-icerik
description: MATAF'ta dinî içeriğe dokunan her değişiklikte kullan. Kapsam - âyet, meal, hadis, dua ve okunuşları, umre ve hac adımları, tavaf ve sa'y duaları, secde âyetleri, tecvid, kaza, namaz vakti ve ikindi hesabı, hicrî takvim ve mübarek günler, Kur'an hattı ve mushaf düzeni. Hanefî ve Diyanet ilkesini, kaynak yazma zorunluluğunu, "ilahiyatçı kontrolü" notunu, metnin hangi durumda değişebileceğini ve lisansları anlatır. Dua ya da âyet eklerken, rehber adımı yazarken, bir dinî hükmü ya da tarihi gösterirken, yazı tipi ya da meal kaynağı seçerken önce bu skilli oku.
---

# Dinî içerik

Kullanıcılar bu uygulamayla ibadet ediyor. Yanlış bir dua metni, eksik bir hareke ya da hatalı bir hüküm sessizce ibadete geçer. Bu yüzden dinî içerik kaynağa sadık kalır ve her zaman kaynağını gösterir.

## İlkeler

- **Fıkıh:** Hanefî mezhebi, Diyanet İşleri Başkanlığı kaynakları. Başka mezhepte farklı hüküm varsa ana metin Hanefî görüşüdür; diğeri yerinde not olarak yazılır ("Şâfiîlere göre …").
- **Kaynak:** Her adımın, duanın ve hükmün yanında kaynağı yazar ("Kaynak: Diyanet İşleri Başkanlığı, Hac ve Umre İlmihali (Hanefî)", "Müslim, 1218"). Hadis numaraları sunnah.com numaralandırmasıyla verilir.
- **Kontrol notu:** Rehber ekranlarında "henüz bir ilahiyatçı kontrolünden geçmedi" notu durur; örnekleri `umre.tsx`, `hac.tsx`, `tecvid.tsx`, `kaza.tsx`, `HadithScreen.tsx`. Notu, proje sahibi hoca kontrolünün bittiğini söyleyene dek kaldırma. Yeni rehber ekranına da koy.
- **Fetva yok:** Uygulama kişisel durum için hüküm vermez. "Kendi durumunuz için kafilenizdeki din görevlisine danışın" yönlendirmesi kalır.

## Metin değiştirme kuralı

- Âyet, hadis ve dua metni yalnız şu iki durumda değişir: kaynağın kendisine göre düzeltme ya da hocanın düzeltmesi. Üslup güzelleştirmek, kısaltmak ya da "daha anlaşılır" yapmak için değiştirme.
- Arapça dinî metni ezberden ya da tahminle yazma. Kaynaktan kopyala ve kaynağı aynı kayda yaz. Harekeler ve özel işaretler (۩, ۝, sûre başı) aynen kalır.
- Okunuş Diyanet yazımıyla yazılır (â, î, û, ’): "Allâhümme’ftah lî ebvâbe rahmetik". Anlam yazarken kaynağın anlamını aktar; kendi yorumunu katma.
- Bir dua ya da adım için kaynak bulamıyorsan ekleme. Bunu proje sahibine söyle.

## Nerede ne var

| İçerik | Yer | Kaynak |
|---|---|---|
| Âyet metni, meal, ses, tefsir | API'den gelir, gömülü değil: `services/quran.ts`, `data/quranEditions.ts` | alquran.cloud; varsayılan meal `tr.diyanet`, kâri `ar.alafasy`, meal sesi `tr.vakfi-audio`, tefsir `turkish-mokhtasar` |
| Tecvid renkleri ve kurallar | `services/tajweed.ts`, `data/tajweed.ts`, `app/tecvid.tsx` | alquran.cloud `quran-tajweed` işaretlemesi |
| Hadis duaları | `data/duas.ts` (`ar`, okunuş `tr`, anlam `mean`, kaynak `ref`) | Buhârî, Müslim, Ebû Dâvûd, Tirmizî |
| Tavaf ve sa'y duaları | `data/tawaf.ts` | kayıttaki `ref` alanı |
| Umre ve hac adımları | `data/umre.ts`, `data/hac.ts` | Diyanet Hac ve Umre İlmihali (Hanefî); hac adımlarında ceza ve dayanak da yazar |
| Secde âyetleri | `data/sajdah.ts` | Hanefî 14 yer; Hac 77 Şâfiîlere göre secdedir, listede yok |
| Sahîh-i Buhârî | `screens/HadithScreen.tsx` | fawazahmed0/hadith-api (açık veri) |
| Günün duası | `services/daily.ts` | kaynaklı kısa dualardan |
| Kaza | `app/kaza.tsx` | Diyanet (Hanefî) |
| Namaz vakti | `services/prayer.ts` | Suudi saat dilimlerinde Ümmü'l-Kurâ, Türkiye'de Diyanet (`CalculationMethod.Turkey`) |
| Hicrî takvim, mübarek günler, hac günleri | `services/hijri.ts` | Ümmü'l-Kurâ takvimi; Regaib Recep'in ilk cumasına göre |

- **İkindi:** İkindi hesabında mezhep ayarı yok; adhan kütüphanesinin varsayılanı kullanılıyor. Resmî takvimlerle (Diyanet, Ümmü'l-Kurâ) karşılaştırmadan değiştirme.
- **Hicrî tarih:** Takvimden hesaplanır. Suudi Arabistan'ın hilal ilanıyla bir gün kayabilir. Hac rehberi bunu yazar (`hac.tsx`, `calNote`); tarih gösteren yeni ekrana da aynı notu koy.

## Kur'an hattı ve mushaf

- **Varsayılan hat:** Medine Mushafı. DigitalKhatt New Madina'dan üretilmiş TrueType (`assets/fonts/MatafMadina.ttf`, OFL; üretim `tools/fonts/digitalkhatt_ttf.py`).
- **Diğer hatlar:** Amiri Quran, Scheherazade New, Noto Naskh Arabic ve Lateef (OFL, `@expo-google-fonts`).
- **İzinsiz kullanılmaz:** Diyanet'in mushaf hattı ve sayfaları ile KFGQPC (Kral Fahd) yazıları serbest lisanslı değil. Diyanet'ten (Mushafları İnceleme ve Kıraat Kurulu) izin gelirse eklenir.
- **Yeni hat şartı:** Uthmani Kur'an işaretlerini (küçük elif, sıla, secde ve durak işaretleri) tam çizmeli. Kûfî, rik'a ve nestâlik bu yüzden eklenmedi.
- **Sayfa düzeni:** Medine Mushafı, 604 sayfa (`data/quranPages.ts`, quran-meta, MIT).

## Yeni veri ya da kaynak eklerken

1. Kaynağı ve lisansını `docs/VERI-KAYNAKLARI.md`'ye ilgili bölüme yaz.
2. Lisansı serbest değilse ya da belirsizse ekleme; proje sahibine sor.
3. Mantığı React'sız bir `src/services/*.ts` dosyasına koy ve testini `scripts/check-logic.ts`'e ekle. Örnek: secde âyetleri, sayfa tablosu, besmele tanıma.
4. Ekranda kaynak satırını ve gerekiyorsa kontrol notunu göster. Metinler üç dilde olur (`metin-ekle` skilli).

## Proje sahibine bildirme

Dinî içerik değiştiyse özette ayrıca belirt: hangi metin değişti, kaynağı ne, hoca kontrolü gerekiyor mu. Hocanın bakacağı gözden geçirme belgesi CLAUDE.md "Şu anki durum"da bağlantılı; yeni içeriğin oraya eklenmesini öner.
