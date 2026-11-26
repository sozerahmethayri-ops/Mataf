# Gerçek 3D bina verisi (OpenStreetMap)

Ana haritadaki Mescid-i Haram, Mescid-i Nebevî ve çevresi OpenStreetMap'in "Simple 3D Buildings" verisinden
çizilir: her `building:part` için `min_height`, `height`, `roof:shape`, `roof:height`, `roof:direction`,
`building:colour`, `roof:colour`. Veri **© OpenStreetMap katkıcıları**, **ODbL 1.0**; haritada ve Ayarlar'da atıf vardır.

| Dosya | İçerik |
|---|---|
| `src/data/osm/haram3d.ts` | Mescid-i Haram dış hattı (ilişki 1472531: 3 dış halka + Mataf avlusu), 823 bina parçası (13 minare, kubbeler, Mes'a, Kral Abdullah genişlemesi, Ebrâcü'l-Beyt / Saat Kulesi). Orijin: OSM'deki Kâbe'nin merkezi 21.4225165, 39.8261820 |
| `src/data/osm/nabawi3d.ts` | Mescid-i Nebevî dış hattı, Yeşil Kubbe, 10 minarenin yeri ve yüksekliği, çevredeki yapılar; Cennetü'l-Bakî sınırı (way 65541621). Orijin: 24.4675, 39.6114 |

Veri 25 Kasım 2026'da Overpass'tan alındı. Güncellemek için:

```
[out:json][timeout:180];
rel(1472531); out geom;                                   // Haram dış hattı (o/i satırları)
(way["building:part"](around:700,21.4225,39.8262);
 way[building][height](around:700,21.4225,39.8262););
out geom;
```

Medine için aynı sorgu `around:600,24.4675,39.6114` ile; minareler `man_made=minaret` (m satırları).
Çıktıyı uygulama biçimine çevirmek:

```
python3 scripts/osm3d_encode.py haram.json --lat 21.4225165 --lon 39.826182 --outline 1472531 > haram.txt
```

`haram.txt` içeriğini `HARAM_3D` dizgesine koyun; `npm run check` parça/minare sayılarını ve çizim
sırasını doğrular (sayılar değişirse testteki beklentiyi güncelleyin).

## Çizim (src/scene/osm3d.ts)

- İçbükey parçalar dışbükey parçalara bölünür (kulak kırpma + Hertel–Mehlhorn); hafif içbükeyler bütün kalır.
- Ressam sırası: dışbükey parça çiftleri arasında ayırıcı eksen (SAT) → "hangisi önde" kısıtı → topolojik
  sıralama. Planda üst üste duranlarda alttaki önce. Sonuç dönüş açısı başına önbelleklenir.
- Ana kütle (dış hat + avlu) tek parça: önce görünen duvarlar, sonra avludakiler (Kâbe, Mataf halkası), en son çatı.
- Minareler OSM katlarından (gövde, şerefe, kameriye sütunları, külah, alem) tek basamaklı silüet olarak çizilir.
- Aynı renkli ve ekranda örtüşmeyen şekiller tek SVG yoluna toplanır (sıra korunur).

## Bilinen sınırlar

- Doğruluk OSM verisi kadardır. OSM'de kubbeler turuncu işaretli; uygulamada açık mermer tonunda çizilir.
- Kral Abdullah genişlemesinin üst döşemesi OSM'de 35,5 m'den başlar; çatıya (21 m) oturtulur.
- Yeşil Kubbe OSM'de 13–19 m basık kubbe; fotoğraflardaki biçime göre kasnak + sivri kubbe + alemle (≈26 m) çizilir.
- Kâbe, Hicr ve Makam OSM parçaları yerine ayrıntılı kendi modelimiz kullanılır.
- Medine'deki 250 şemsiye 26 m aralıklı düzenle yerleştirilir (gerçek düzene yakın, birebir değil);
  yüksekliği OSM'de olmayan oteller tahmini yüksekliktedir.

## Hac yerleri (src/data/osm/hacSites.ts)

Arafat ve Mina alanları, Harem sınırı, cemreler, Nemire / Meş'ar-i Haram / Hayf mescitleri, Cebel-i Rahme,
Meşâir treni istasyonları ve Mina–Arafat hastaneleri. Veri **© OpenStreetMap katkıcıları, ODbL 1.0**.

Sorgu (GitHub'da çalıştırmak için: `gh workflow run osm-fetch.yml -f query="$(cat sorgu.overpassql)"`,
sonuç "osm-data" sürümündeki `out.json`):

```
[out:json][timeout:200];
(
  nwr["name:en"~"Jamara|Jamra|Namira|Namirah|Mash.?ar|Khayf|Kheef|Rahma|Muhassir|Arafat|Arafah|Muzdalif|Mina",i](21.33,39.84,21.45,40.00);
  nwr["name"~"جمر|نمرة|المشعر|الخيف|الرحمة|محسر|عرفات|عرفة|مزدلفة|منى"](21.33,39.84,21.45,40.00);
  nwr["name:tr"](21.33,39.84,21.45,40.00);
  nwr[railway=station](21.33,39.84,21.45,40.00);
  nwr[boundary](21.33,39.84,21.45,40.00);
);
out geom;
```

Dönüştürme: `python3 -I scripts/hac_sites.py out.json > src/data/osm/hacSites.ts`. Betik öğeleri OSM kimliğiyle seçer
(Arafat way 1377422823, Mina way 1249259763, Harem sınırı ilişki 19590020, cemreler node 4144223248–50 …);
kimlik değişirse betik hata verir, yeni kimlik elle bakılıp yazılır. Kapalı halkalar sadeleştirilir
(Mina 8 m, Nemire 2 m, Cemerat köprüsü 3 m, Harem sınırı 25 m).

Bilinen sınırlar: Arafat hattı sahadaki sınır işaretlerinden çizilmiştir ama yaklaşıktır; Nemire Mescidi'nin
ön (kıble) kısmı Arafat dışındadır (Urene vadisi). Uygulama sınıra 75–100 m'den yakınken "içindesiniz" demez,
tabelalara bakmayı söyler.

## İstanbul raylı sistem (src/data/istanbulRail.json)

Ulaşım ekranındaki çevrimdışı metro/tramvay/Marmaray tarifinin verisi. Sorgu (osm-fetch iş akışı):

```
[out:json][timeout:240];area["name"="İstanbul"]["admin_level"="4"]->.ist;
rel["type"="route"]["route"~"^(subway|light_rail|tram|train|funicular|monorail|ferry|aerialway)$"](area.ist)->.r;
.r out body;node(r.r);out body qt;
```

Sonra `python3 scripts/ist_rail.py out.json src/data/istanbulRail.json`. Betik `ref`'i olan hatları alır (trenlerden yalnız
B1 Marmaray, B2 ve T6), durak rolündeki düğümleri sırasıyla istasyona çevirir; aynı adlı ve 450 m'den yakın duraklar tek
istasyon olur. Vapur ilişkilerinde durak üyeleri eksik olduğu için vapurlar şimdilik yok. Yeni hat açılınca sorguyu
yeniden çalıştırın.

