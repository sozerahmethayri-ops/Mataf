# Veri kaynakları ve doğruluk

## Yayımlanmış ölçülerden alınanlar

- **Kâbe:** 12,86 × 11,03 m taban, 13,1 m yükseklik (Wikipedia).
- **Osmanlı revakı:** dış ölçü 192 × 132 m (Archnet).
- **Mes'a:** 394 m uzunluk, 40 m genişlik, 4 kat (İki Kutsal Mescid İşleri Genel Kurumu). Safa, Kâbe'nin ≈150 m güneydoğusunda.
- **Saat Kulesi:** 601 m. **Mescid-i Haram minareleri:** en yüksek 139 m.
- **Mescid-i Nebevî:** bina ≈ 98.500 m², avlular 235.000 m² (Saudipedia); zemin kat 12,55 m; 18 m çaplı 27 sürgülü kubbe; yeni minareler ≈105 m; 250 şemsiye, 143.000 m² gölge.
- **Ravza:** ziyaret saatleri Suudi Basın Ajansı, 20 Ekim 2026 duyurusu; Nusuk izni, içeride 20 dk, yeni izin 365 gün sonra.

## OpenStreetMap'ten alınanlar (© OpenStreetMap katkıcıları, ODbL)

- **3D binalar:** Mescid-i Haram'ın dış hattı ve Mataf avlusu, Mes'a, Kral Abdullah genişlemesi, 13 minare,
  kubbeler ve Ebrâcü'l-Beyt (Saat Kulesi, 601 m); Mescid-i Nebevî'nin dış hattı, 10 minare (6 × 104 m, 4 × 70 m),
  Yeşil Kubbe'nin yeri ve çapı, çevredeki yapılar ve Cennetü'l-Bakî sınırı. Ayrıntı: `scripts/osm-3d.md`.
- **Kapı konumları:** OSM giriş noktaları. Mekke: Kral Abdülaziz (1), Kral Fahd (79), Umre (62), Fetih (45),
  Kral Abdullah (100). Medine: Bab-üs Selam (1), Bab el-Bakî (41), Bab Mekke (37), Kral Fahd (20–22),
  Kral Suud (7–9), Kral Abdülaziz (33–35). Mekke kapı numaraları yaygın kullanılan numaralardır
  (OSM'de Umre ve Fetih kapıları 40 ve 30 olarak işli; kaynaklar arasında fark var).
- **Yürüme rotası:** gerçek dış hatların çevresinden en kısa yol (görünürlük ağı).

## Tahmin / örnek olanlar (değiştirilmeli)

- Yeşil Kubbe'nin yüksekliği (≈26 m, fotoğraflara göre), Medine'deki şemsiyelerin dizilişi, yüksekliği OSM'de olmayan otellerin yüksekliği.
- Mescit içi hizmet noktaları (`src/data/content.ts → PLACES`) **örnek veridir**.
- Yerel demo modundaki bildirim ve yorumlar örnek veridir.
- Mescit merkez koordinatları (`ANCHORS`) yaklaşıktır.

## Gerçek veriye geçiş

1. **Resmî kaynak:** İki Kutsal Mescid İşleri Genel Kurumu'nun akıllı haritası (950+ ilgi noktası, 650+ QR, canlı kapanma/rota). Veri paylaşımı veya lisans görüşmesi gerekir. Web: alharamain.gov.sa
2. **OpenStreetMap:** 3D bina parçaları ve girişler (ODbL) — kullanılıyor; güncelleme adımları `scripts/osm-3d.md`.
3. **Sütun kod tabelaları** (350 adet; renk + numara + harf): iç mekânda konum düzeltme için.
4. **3D model:** Google Photorealistic 3D Tiles (Mekke/Medine kapsamı ayrıca kontrol edilmeli) veya lisanslı modeller.
5. **Mescid-i Nebevî resmî 360° tur:** vr.qurancomplex.gov.sa/msq/ (Kral Fahd Mushaf-ı Şerif Basım Kompleksi). Uygulama içine gömmek için izin gerekir.

## Çalışma anında kullanılan servisler

| Servis | Amaç | Lisans / not |
|---|---|---|
| api.alquran.cloud | Kur'an metni + meal | Arapça metin Tanzil; meal hakları sahiplerine aittir |
| api.alquran.cloud (`quran-tajweed`) | Tecvidli renkli Kur'an | Tanzil metni, tecvid işaretlemesi alquran.cloud |
| cdn.islamic.network/quran/audio | Ayet ayet tilavet ve sesli meal (alquran.cloud) | Kayıt hakları kâri/yayıncılara aittir |
| cdn.jsdelivr.net/gh/spa5k/tafsir_api | Tefsir (30+ dil) | Depo MIT; tefsir metinlerinin hakları yayıncılarına aittir |
| cdn.jsdelivr.net/gh/fawazahmed0/hadith-api | Sahîh-i Buhârî | Açık veri |
| photon.komoot.io | Şehir yerleri (otel, yemek, eczane, durak, taksi, hastane) ve en yakın cami — OSM etiketine göre ters arama; konum adı | © OpenStreetMap katkıcıları, ODbL — atıf zorunlu; adil kullanım, uygulama kendini `User-Agent` ile tanıtır |
| overpass-api.de, overpass.kumi.systems, overpass.private.coffee, maps.mail.ru | En yakın cami için yedek (Photon yanıt vermezse) | ODbL; bazı ağlarda Overpass sunucularına hiç ulaşılamıyor — bu yüzden ilk tercih Photon |
| Suudi Arabistan acil numaraları (911 birleşik hat Mekke, Medine, Riyad, Doğu Bölgesi; 997, 998, 999, 993) | Acil durum ekranı (uygulamaya gömülü) | Kamuya açık bilgi; Kasım 2026'da kontrol edildi (saudilifeguide.com, expatica, gov.uk); her sürümde yeniden bakılmalı |
| T.C. Cidde Başkonsolosluğu (cidde-bk.mfa.gov.tr) | Acil durum: başkonsolosluk santrali, acil hattı, Mekke Din Hizmetleri Ataşeliği, Konsolosluk Çağrı Merkezi | Resmî site; Kasım 2026'da kontrol edildi |
| photon.komoot.io (amenity:hospital/clinic) | Acil durum: en yakın hastaneler | ODbL |
| tiles.openfreemap.org | Uygulama içi online harita (vektör karolar, liberty/dark stilleri) | Ücretsiz, anahtarsız; © OpenMapTiles © OpenStreetMap — haritanın köşesinde atıf |
| unpkg.com / cdn.jsdelivr.net (maplibre-gl 5.24.1) | Harita çizim kütüphanesi (WebView içinde) | BSD-3; biri açılmazsa diğeri denenir |
| routing.openstreetmap.de | Yaya rotası | FOSSGIS kullanım koşulları; yoğun kullanımda kendi OSRM sunucunuzu kurun |
| Çevrimdışı paket: tiles.openfreemap.org (planet TileJSON, vektör karolar z0–14, liberty/dark stilleri, yazı tipleri, simgeler) | Mekke/Medine haritası internetsiz | © OpenMapTiles © OpenStreetMap; karolar telefona bir kez indirilir (Mekke ~130, Medine ~80 karo) |
| Çevrimdışı paket: api.alquran.cloud/v1/quran/<baskı> | Kur'an metni ve seçili mealler internetsiz | Arapça metin Tanzil; meal hakları sahiplerine aittir |
| Çevrimdışı paket: cdn.islamic.network/quran/audio | Dua kütüphanesindeki Kur'an ayetlerinin sesleri | Kayıt hakları kâri/yayıncılara aittir |
| Kaza takibi | Hesap telefonda yapılır, veri gönderilmez | Bilgi notları: Diyanet İşleri Başkanlığı (kaza namazı ve oruç) |
| Ana ekran küçük uygulaması (expo-widgets, Android) | Vakitler telefonda hesaplanıp küçük uygulamaya yazılır | Ağ kullanmaz |
| Hac rehberi ve şeytan taşlama | Fıkhî bilgiler ve vakitler | Diyanet İşleri Başkanlığı, Hac İlmihali (Hanefî); Diyanet Fetva Kurulu (Akabe cemresi, izdiham); TDV İslâm Ansiklopedisi “Cemre”, “Vakfe”; Buhârî 1549, 1751; Tirmizî 3585 |
| Hac yerleri (`src/data/osm/hacSites.ts`) | Arafat ve Mina alanı, Harem sınırı, cemreler, mescitler, istasyonlar, hastaneler | © OpenStreetMap katkıcıları, ODbL 1.0 (26 Kasım 2026, `scripts/hac_sites.py`); Harem sınırı ilişkisinin kaynağı: Hadrân es-Sübeytî ve Suûd es-Sübeytî, A‘lâm ve hudûdü’l-Harem (2012). Sınırlar yaklaşıktır |
| Güneş ve ayın konumu, ay evresi | Resimli gökyüzü sahnesi, Vakitler ayrıntısı | suncalc 2 (V. Agafonkin, BSD-2), telefonda hesap |
| Haremeyn treni (`src/data/train.ts`) | İstasyon yerleri; yaklaşık süreler | © OpenStreetMap katkıcıları, ODbL (26 Kasım 2026); süreler Suudi Basın Ajansı haberleri (Mayıs 2026); bilet ve sefer: sar.hhr.sa |
| İstanbul raylı sistem (`src/data/istanbulRail.json`) | M1A–M11, T1–T6, Marmaray (B1), B2, füniküler hatları ve istasyonları; çevrimdışı tarif | © OpenStreetMap katkıcıları, ODbL (26 Kasım 2026; `scripts/ist_rail.py`). Sefer saati yok: süreler ortalama hız ve bekleme süresinden yaklaşık |
| Mekke otobüsleri (`src/data/makkahBus.json`) | Makkah Bus (حافلات مكة) 12 hat (1–12, 7A), 392 durak, Arapça ve İngilizce adlar; çevrimdışı tarif | © OpenStreetMap katkıcıları, ODbL (26 Kasım 2026; `scripts/makkah_bus.py`). Sefer saati yok: durakta bekleme 5–7 dk (Saudipedia), ortalama 20 km/sa varsayılır. Canlı varış saatleri Makkah Bus uygulamasında |
| Otobüs ve diğer şehirlerin toplu taşıması | Ulaşım → Toplu taşıma | Transitous (MOTIS, açık GTFS); koşul: açık kaynak (MIT) ve ticari olmayan kullanım, User-Agent'ta depo adresi, kaynak listesine bağlantı. Türkiye: İETT otobüsleri, Ankara, İzmir, Konya ve başka şehirler, TCDD; Suudi Arabistan için veri yok (Mekke ve Medine çevresinde istek gönderilmez) |
| Hac günlerinin tarihi | Ümmü’l-Kurâ takvimi (cihazda, Intl) | Suudi Arabistan’ın ilanıyla bir gün kayabilir |
| Supabase (isteğe bağlı) | Canlı kapı bildirimleri ve aile/grup konumu | Kendi projeniz (`docs/SUPABASE.md`); konum geçmişi tutulmaz |

## Tavaf asistanı ve dualar

- Kâbe ölçüleri: 12,86 × 11,03 × 13,1 m. Uzun eksen pusulada ~151° (Kanopus doğuşu / yaz gündönümü hizası); köşe yönleri buna göre hesaplanır. Kapı, Hatîm ve Makam-ı İbrâhîm konumları yaklaşıktır.
- Fıkıh: Diyanet İşleri Başkanlığı Hac İlmihali (istilam, Rükn-i Yemânî, remel/ıztıba, tavaf namazı). Başlangıçtaki yeşil ışıklar: Suudi Hac ve Umre Bakanlığı (haj.gov.sa).
- Tavaf hadisleri sunnah.com ile karşılaştırıldı: Buhârî 1604 (remel), 1609 (iki Yemânî rükün), 1613 (tekbir), 1637 (Zemzem); Ebû Dâvûd 1892 (iki rükün arası dua); Müslim 1218 (Makam, iki rekât, sa'y).
- Dua kütüphanesindeki hadis numaraları sunnah.com numaralandırmasıdır. Yayından önce bir ilahiyatçıya kontrol ettirin.
- Cihaz sesi (metin okuma) bir hafız tilaveti değildir; ayetler her zaman kâri kaydıyla çalınır, bağlantı yoksa cihaz sesine düşer.

## Uygulamaya gömülü yazı tipleri (yalnız Kur'an metni)

| Yazı tipi | Paket | Lisans |
|---|---|---|
| MATAF Madina: DigitalKhatt New Madina'nın değiştirilmiş sürümü (© Amine Anane, Tarteel Inc.; github.com/DigitalKhatt/madinafont) | `assets/fonts/MatafMadina.ttf` (+ `MatafMadina-OFL.txt`) | SIL Open Font License 1.1 |
| Amiri Quran (Khaled Hosny) | `@expo-google-fonts/amiri-quran` | SIL Open Font License 1.1 |
| Scheherazade New (SIL International) | `@expo-google-fonts/scheherazade-new` | SIL Open Font License 1.1 |
| Noto Naskh Arabic (Google) | `@expo-google-fonts/noto-naskh-arabic` | SIL Open Font License 1.1 |
| Lateef (SIL International) | `@expo-google-fonts/lateef` | SIL Open Font License 1.1 |

Seçim ölçütü: Uthmani metnin bütün Kur'an işaretlerini (U+06D6–U+06ED, ﴿﴾, ۩) çizmesi; fontTools ile ölçüldü. Reem Kufi, Aref Ruqaa ve Noto Nastaliq Urdu 19–23 işaret eksik olduğu için alınmadı. OFL yazı tiplerinin yazılımla dağıtılmasına izin verir; paket yazıları değiştirilmeden kullanılır. MATAF Madina (0.22.0, varsayılan): Medine mushafı hattı; değişken CFF2 dosyası Android'de güvenli olsun diye varsayılan örneğiyle sabit TrueType'a çevrildi, kelime arası 0,10 em'den 0,26 em'e açıldı (sade dizgide kelimeler yapışıyordu), ad değişti; üretim `tools/fonts/digitalkhatt_ttf.py`, lisans dosyası yanında. Kur'an metninde kullanılan işaretlerden yalnız U+06EA ve U+06EB (Kur'an'da birer yer) yok; telefon onları yedek yazıyla çizer. Diyanet'in mushaf yazısı ve King Fahd (KFGQPC) yazıları serbest lisanslı değil (yazılı izin gerekir); kullanılmadı.

## Mushaf sayfa numaraları

Medine Mushafı (Hafs) düzeni, 604 sayfa: her sayfanın ilk âyeti `src/data/quranPages.ts`'te. Kaynak: [quran-meta](https://github.com/quran-center/quran-meta) 7.0.0 (MIT, Huseyn Guliyev). Paketin kodu çalıştırılmadan dosyasından okundu; bilinen sayfalarla denetlendi (Bakara 1 = s. 2, Bakara 142 = s. 22, Kehf 45 = s. 298, Nebe 1 = s. 582, İhlâs 1 = s. 604). Türkiye baskılarının (ör. Hafız Osman hattı) sayfa düzeni bundan farklı olabilir.
