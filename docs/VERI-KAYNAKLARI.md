# Veri kaynakları ve doğruluk

## Yayımlanmış ölçülerden alınanlar

- **Kâbe:** 12,86 × 11,03 m taban, 13,1 m yükseklik (Wikipedia).
- **Osmanlı revakı:** dış ölçü 192 × 132 m (Archnet).
- **Mes'a:** 394 m uzunluk, 40 m genişlik, 4 kat (İki Kutsal Mescid İşleri Genel Kurumu). Safa, Kâbe'nin ≈130 m güneydoğusunda.
- **Saat Kulesi:** 601 m. **Mescid-i Haram minareleri:** en yüksek 139 m.
- **Mescid-i Nebevî:** bina ≈ 98.500 m², avlular 235.000 m² (Saudipedia); zemin kat 12,55 m; 18 m çaplı 27 sürgülü kubbe; yeni minareler ≈105 m; 250 şemsiye, 143.000 m² gölge.
- **Ravza:** ziyaret saatleri Suudi Basın Ajansı, 20 Ekim 2026 duyurusu; Nusuk izni, içeride 20 dk, yeni izin 365 gün sonra.

## Tahmin / örnek olanlar (değiştirilmeli)

- Genişleme bloklarının dış hatları ve Kâbe'ye göre konumları, Mescid-i Nebevî bina oranı, Yeşil Kubbe yüksekliği (~27 m), eski minareler (~72 m), Bakî sınırı.
- **Kapı konumları** yaklaşık; kapı numaraları gerçektir (Mekke: 1, 19, 45, 62, 79, 100; Medine: 1, 21, 37, 41).
- Mescit içi hizmet noktaları (`src/data/content.ts → PLACES`) **örnek veridir**.
- Yerel demo modundaki bildirim ve yorumlar örnek veridir.
- Mescit merkez koordinatları (`ANCHORS`) yaklaşıktır.

## Gerçek veriye geçiş

1. **Resmî kaynak:** İki Kutsal Mescid İşleri Genel Kurumu'nun akıllı haritası (950+ ilgi noktası, 650+ QR, canlı kapanma/rota). Veri paylaşımı veya lisans görüşmesi gerekir. Web: alharamain.gov.sa
2. **OpenStreetMap:** bina ayak izleri ve girişler (ODbL). Overpass ile çekilip `src/scene/*` dış hatları güncellenebilir.
3. **Sütun kod tabelaları** (350 adet; renk + numara + harf): iç mekânda konum düzeltme için.
4. **3D model:** Google Photorealistic 3D Tiles (Mekke/Medine kapsamı ayrıca kontrol edilmeli) veya lisanslı modeller.
5. **Mescid-i Nebevî resmî 360° tur:** vr.qurancomplex.gov.sa/msq/ (Kral Fahd Mushaf-ı Şerif Basım Kompleksi). Uygulama içine gömmek için izin gerekir.

## Çalışma anında kullanılan servisler

| Servis | Amaç | Lisans / not |
|---|---|---|
| api.alquran.cloud | Kur'an metni + meal | Arapça metin Tanzil; meal hakları sahiplerine aittir |
| cdn.jsdelivr.net/gh/fawazahmed0/hadith-api | Sahîh-i Buhârî | Açık veri |
| overpass-api.de | Şehir yerleri | © OpenStreetMap katkıcıları, ODbL — atıf zorunlu |
| routing.openstreetmap.de | Yaya rotası | FOSSGIS kullanım koşulları; yoğun kullanımda kendi OSRM sunucunuzu kurun |
| Supabase (isteğe bağlı) | Canlı kapı bildirimleri | Kendi projeniz |
