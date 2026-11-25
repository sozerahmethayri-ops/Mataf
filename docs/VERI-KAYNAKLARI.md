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
| Supabase (isteğe bağlı) | Canlı kapı bildirimleri | Kendi projeniz |

## Tavaf asistanı ve dualar

- Kâbe ölçüleri: 12,86 × 11,03 × 13,1 m. Uzun eksen pusulada ~151° (Kanopus doğuşu / yaz gündönümü hizası); köşe yönleri buna göre hesaplanır. Kapı, Hatîm ve Makam-ı İbrâhîm konumları yaklaşıktır.
- Fıkıh: Diyanet İşleri Başkanlığı Hac İlmihali (istilam, Rükn-i Yemânî, remel/ıztıba, tavaf namazı). Başlangıçtaki yeşil ışıklar: Suudi Hac ve Umre Bakanlığı (haj.gov.sa).
- Tavaf hadisleri sunnah.com ile karşılaştırıldı: Buhârî 1604 (remel), 1609 (iki Yemânî rükün), 1613 (tekbir), 1637 (Zemzem); Ebû Dâvûd 1892 (iki rükün arası dua); Müslim 1218 (Makam, iki rekât, sa'y).
- Dua kütüphanesindeki hadis numaraları sunnah.com numaralandırmasıdır. Yayından önce bir ilahiyatçıya kontrol ettirin.
- Cihaz sesi (metin okuma) bir hafız tilaveti değildir; ayetler her zaman kâri kaydıyla çalınır, bağlantı yoksa cihaz sesine düşer.
