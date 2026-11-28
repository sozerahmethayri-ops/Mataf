# MATAF — Mescid-i Haram ve Mescid-i Nebevî navigasyon uygulaması

Mekke ve Medine'deki ziyaretçiler için iOS ve Android uygulaması:

- **Sade Kur'an sayfası, Nüzul sırası, değiştirilebilir sekmeler, uygulama içi yol tarifi (0.25.0)** — Mushaf artık çerçevesiz, yalnız Kur'an: sayfa numarası ekranın en altında; birkaç saniye dokunulmayınca, uzun basınca ya da boş bir yere dokununca üst çubuk gizlenir, bir dokunuş geri getirir; okurken ekran kararmaz. Üstteki kitap düğmesinden okuma biçimi seçilir: sayfa (tecvid renkli ya da tecvidsiz), mealli, tefsirli (her âyetin altında tefsir), yalnız Arapça, yalnız meal; yazı boyu da orada. Büyüteç düğmesi “Git” penceresini açar: sûreye, cüze, sayfaya ya da ayraca gidilir. Kur'an sekmesinde yeni “Nüzul sırası”: 114 sûre indiği sırayla, vahyin dönemleri ve “İlk vahiy: Alak 1–5” kartı. Alttaki sekmeler değiştirilebilir: Ayarlar → Alt sekmeler'den 1., 2. ve 4. sekmeye Harita, Kur'an, Ulaşım, Hac ve umre, Namaz vakitleri, Kıble, Zikirmatik ya da Hadis konur. Yol tarifi artık uygulamanın içinde: Google Haritalar'a gitmeden haritada rota, “120 m · Sola dönün” gibi talimatlar ve sesli yönlendirme; toplu taşımada hangi hatta binileceği, kaç durak gidileceği, nerede ve saat kaçta inileceği.
- **Haritalar açılıyor ve yakınlaşıyor, Konumum, kapı numaraları (0.24.0)** — 2D haritalar bazı telefonlarda boş kalıyor ve kıpırdamıyordu: haritayı çizen kütüphane artık uygulamayla birlikte geliyor, açılırken internetten indirilmiyor. iPhone ve bilgisayardaki web sürümünde de gerçek harita açılıyor. Bütün haritalar parmakla kaydırılır, iki parmakla ya da sağdaki + / − düğmeleriyle yakınlaşıp uzaklaşır; harita yine de açılamazsa yedek harita da kaydırılıp yakınlaştırılabiliyor. Harita sekmesi Mekke ya da Medine'de değilseniz bulunduğunuz yerin haritasıyla açılır: yakındaki camiler, en yakın caminin uzaklığı ve uygulama içinde yol tarifi; Mekke ve Medine üstteki “Konumum · Mekke · Medine” seçicisinden açılır. 3B Harem haritasında kapı numaraları açılışta da görünüyor (yaklaştıkça çoğalıyor), harita Kâbe'ye daha yakın açılıyor; Saat Kulesi ve çevresindeki kuleler soluk çiziliyor, göz Kâbe'ye gidiyor. Koyu temada tecvid renkleri daha canlı, normal yazıdan kolayca ayırt ediliyor.
- **Kur'an ekranı, 151 kapı, geniş harita, kalıcı vakit kutusu, yeni simge (0.23.0)** — Kur'an ana ekranı yenilendi: en üstte kaldığınız yer (sûre, âyet, sayfa, cüz; mushafta ya da mealli açılır); arama kutusuna “2:255”, “bakara 255”, “s 300” ya da “c 15” yazınca doğrudan oraya gidilir; sûreler, 30 cüz ve ayraçlar ayrı sekmelerde. Okurken her âyet 3, 5, 10 kez ya da sürekli tekrarlanabilir (ezber), okuma hızı değiştirilebilir; mushafta sayfa dinlenir, sayfa bitince sonrakine geçilir; “Sayfaya git” ile istenen sayfa açılır. Mescid-i Haram'da 129, Mescid-i Nebevî'de 22 kapı numarasıyla kapı listesinde ve haritada (yakınlaşınca); Medine'de kadınlar girişleri işaretli; ana kapı numaraları Genel Kurum'un duyurusuna göre. 3B harita mescidin 1,3 km çevresindeki sokakları ve binaları da gösteriyor, daha çok uzaklaşıp yakınlaşıyor. Android'de bildirim panelinde sürekli duran vakit kutusu: sıradaki vakit, saniye saniye geri sayım, açınca günün vakitleri; ses çıkarmaz, Bildirimler'den kapatılır. Uygulamanın simgesi artık ışıklı, gölgeli bir Kâbe görüntüsü.
- **Mushaf sayfa sayfa, Medine hattı, dönen 3B harita, yeni kutular (0.22.0)** — Mushaf artık kâğıt mushaf gibi sayfa sayfa: 604 sayfa, parmağı soldan sağa kaydırınca sonraki sayfa gelir; tecvid renkleri açılıp kapanır, kaldığınız sayfa hatırlanır (Kur'an listesinde “Mushaf · sayfa sayfa”). Yeni hat “Medine Mushafı” varsayılan oldu (DigitalKhatt, açık lisans): Medine mushafının yazısı, âyet sonlarında numaralı daire; cihazın yazısı bazı telefonlarda harekeleri bozuyordu, isteyen Okuma ayarlarından yine seçebilir. Okuma ekranında yazı büyütme ve küçültme artık takılmıyor. 3B Harem haritası döndürülebiliyor: sol alttaki ↺ ↻ ile 45°'lik adımlarla, pusulaya basınca kuzey yukarı; daha çok uzaklaştırılabiliyor, açılışta daha geniş alan görünüyor ve yakınlaştırma daha akıcı.
- **Yeni kutu görünümü (0.22.0)** — Ana ekran kutuları yenilendi. Sıradaki vakte kalan süre büyük ve saniye saniye işleyen bir sayaçla gösteriliyor (“Akşam vaktine kalan 01:23:45”); üstte yer, miladi ve hicrî tarih; altı vakit yan yana, sıradaki renkli dolu hapta. İnce şerit tek satırda “Akşam 17:37 01:23:45 kaldı” gösterir (dar kutuda yalnız sayaç); yatsıdan sonra saatin yanında küçük “yarın”. Kutular seçtiğiniz renk paletinin tonlarını taşır: Vakitler ya da Ayarlar'daki kutu satırından renk (koyu, açık ya da uygulamanın teması) ve şeffaflık (yok, %20–80) seçilir; varsayılan koyu ve %40 şeffaf, duvar kâğıdı görünür. Namaz takibi kutusu da aynı görünümde.
- **Namaz takibi kutusu daha okunaklı (0.21.1)** — Kutudaki vakit işaretleri büyüdü: kılınan vakit vurgu renginde dolu daire içinde ✓, kılınmayan açık renkli daire; önceki ○ işareti telefonda çok küçük görünüyordu. Acil durum numaraları ve temsilcilik telefonları yeniden denetlendi, değişiklik yok.
- **Arapça düzen (0.21.0)** — Web sürümünde (iPhone) Arapça seçilince sayfa artık sağdan sola: satırlar, sekmeler ve alt çubuk dönüyor; önceden yalnız yazı sağa yaslanıyordu. Liste okları ve geri düğmesi Arapçada ters yöne bakıyor (telefonda da). Arapça arayüzde İngilizce kalan 93 metin (kıble, yönlendirme, kapı bildirimleri, Ravza, arama, ayarlar…) Arapçaya çevrildi; Kur'an listesinde Mekkî/Medenî ve âyet sayısı, ayraçlarda sûre adı ve âyet numarası seçili dilde.
- **“Kıldım” uygulamayı açmadan (0.20.0)** — Android'de vakit bildirimindeki “Kıldım”a dokununca uygulama artık açılmıyor: vakit Namaz takibine işleniyor, bildirim kapanıyor, ana ekrandaki namaz takibi kutusu da güncelleniyor. Uygulama kapalıyken de çalışır. Bildirimler ekranındaki deneme bildiriminde de “Kıldım” görünür; dokununca yalnız bildirim kapanır, namaz işlenmez.
- **Namaz takibi kutusu (0.19.0)** — Android'de telefonun ana ekranına “Bugünkü namazlarım” kutusu eklenebilir: bugün kıldığınız vakitler ✓, kalanlar ○ ile görünür; üstte kaç vaktin tamam olduğu (“3/5”, beşi de kılınınca “Beş vakit tamam”), hatim planınız varsa altta hatim yüzdesi. Uygulamada işaretlediğiniz anda kutu da güncellenir; gece yarısından sonra uygulamayı açmasanız da yeni gün boş başlar. Namaz takibi ekranındaki “Telefonun ana ekranına ekle” satırıyla ya da başlatıcının kutu listesinden (“MATAF · Namaz takibi”) eklenir; dokununca uygulama açılır.
- **Kur’an sayfa numaraları (0.18.0)** — Medine Mushafı düzeninde (604 sayfa) sayfa numaraları: mushaf görünümü artık sayfa sayfa, her sayfanın başında “Sayfa 297 · 15. cüz” işareti var; Arapça ve mealli görünümde de yeni sayfanın başladığı âyetin üstünde aynı işaret. Okuma ekranının başlığında sûrenin sayfaları (“2. sûre · s. 2–49”), Kur’an listesinde her sûrenin ilk sayfası, ayraçlarda kalınan sayfa yazıyor. Hatim planında bugünün bölümü kesin sayfa aralığıyla gösteriliyor (“s. 298–304 · ≈ 7 sayfa”).
- **Kur’an için hat seçimi (0.17.0)** — Okuma ayarlarının başında “Hat (yazı stili)”: cihazın yazısı, Amiri Kur’an (klasik nesih, eski Kahire baskıları üslubu), Scheherazade (iri ve açık nesih), Noto Nesih (her telefonda aynı) ve Lateef (Hint alt kıtası mushaflarının üslubu); her birinde besmele önizlemesi var. Seçilen hat mushaf, Arapça, mealli ve tecvid görünümlerinde ve tecvid kuralları sayfasında kullanılır; satır aralığı yazıya göre ayarlanır, harekeler kesilmez. Yazı tipleri uygulamanın içinde, internet gerekmez. Kûfî, rik’a ve nestâlik yazılar Kur’an’daki işaretlerin bir kısmını çizemediği için eklenmedi.
- **Mushaf, tecvid ve secde âyetleri (0.16.0)** — Mushaf görünümü sayfa gibi: çerçeve, sûre başlığı ve her âyetin sonunda palet renginde belirgin ﴿١٢﴾ işareti. Okuma ekranının üstündeki − ve + ile yazı büyür ve küçülür (Arapça ve meal; okuma yeri kaybolmaz). Secde âyetleri (Hanefî mezhebine göre 14 yer) ۩ işareti ve yeşil zeminle gösterilir, altta tilâvet secdesi notu var. Yeni “Tecvid” görünümü: Kur’an tecvid kurallarına göre renkli (ğunne, ihfâ, iklâb, idğamlar, kalkale, medler…); üstteki renk şeridinden “Tecvid kuralları” sayfası açılır: 17 renkli kural sırayla, tanımı, harfleri ve renkli örneğiyle, ayrıca izhar, ra ve lafzatullah. Tecvidli metin internetsiz pakete de girer.
- **Paletler ve her gün dönülecek yerler (0.15.0)** — Renk paleti artık bütün ekranı değiştiriyor: Zümrüt'te zemin yeşile, Gece mavisi'nde maviye, Gül'de pembeye çalıyor; simgeler, bölüm başlıkları, seçili düğmeler ve ilerleme çubukları paletin renginde. Hatim planı: 30, 60, 90 ya da 180 gün seçin; her günün bölümü Hatim ayracınızdan hesaplanır ve günlere eşit sayfa düşer (“Bugün: Kehf 45 → Kehf 98, ≈ 5 sayfa”); ana sayfada kart, istenirse yatsıdan sonra hatırlatma. Cuma günü ana sayfada “Hayırlı cumalar” kartı ve Kehf sûresine kısayol; cuma sabahı hatırlatması. Zikirmatik'te günlük hedef (100, 300, 1000) ana sayfada görünür. Namaz takibinde son 7 günün özeti (namaz, zikir, hatim). Ezan bildiriminde “Kıldım” düğmesi: uygulama açılır, vakit işlenir. Menü → Yolculuk: hac ve umre hazırlık listesi (belgeler, sağlık, ihram, telefon) ve temel Arapça ifadeler (büyük yazıyla göster, telefona okut).
- **Namaz takibi ve günün duası (0.14.0)** — Ana sayfada “Bugünkü namazlarım”: kıldığınız vakte bir kez dokunun, yeşil tik çıkar (vakti girmeyen işaretlenmez). Namaz takibi ekranında bugünün beş vakti, son 7 günün tablosu (geçmiş günler düzeltilebilir), kaç gündür beş vaktin tam olduğu ve kaza takibine geçiş var; kart istenirse gizlenir. Kayıt yalnız telefonda durur ve yedeğe girer. Ana sayfada her gün başka bir kısa dua: Arapçası, okunuşu, anlamı ve kaynağı; paylaşılabilir. “Çok büyük” yazı boyutunda ana sayfadaki vakitler kesiliyordu (“02:…”), artık iki satırda tam görünüyor. Veri kaynaklarında demo ve bekleyen kaynaklar “Canlı” görünmüyor; bildirim olmayan kapıda “Henüz bildirim yok” yazıyor.
- **Daha sade görünüm (0.13.5)** — Ana sayfanın kısayolları iki sütunlu, yazısı daha büyük düğmeler oldu; simgelerin altındaki renkli kutular kalktı. Menü gruplu bir liste oldu: her satırda simge, ad ve ok. Bölüm başlıkları normal yazımla çıkıyor; büyük harf dönüşümü Türkçe “i”yi “I” yapıyordu (“SUUDI ARABISTAN”). Alt sekmelerin hepsi aynı görünüyor. Kapı Durumu sunucu bağlı değilken “Yerel demo (bu cihaz)” yazıyor ve onayı olmayan kapıda “0 onay” göstermiyor. Kısa uyarılardaki uzun tireler virgül, iki nokta ya da noktaya döndü.
- **0.13.4** — Tarif adımlarında durak sayısı İngilizcede tekil (“1 stop”), Arapçada sayı kuralına göre (محطة واحدة، محطتان، محطات).
- **Düzeltmeler (0.13.3)** — Ulaşım'da konum hedef seçildikten sonra gelirse (uygulama yeni açılmışken) yol türü artık konum gelince kendiliğinden seçiliyor; önceden yürüyüşte kalıyordu. İnce şerit kutusu yatsıdan sonra “İmsak 05:21 · yarın” gibi tek satıra sığan kısa yazı gösterir.
- **Haritadan yol tarifi (0.13.2)** — Haritadaki “Nasıl giderim” Ulaşım'ı artık boş açmıyor: hedef Mescid-i Haram ya da Mescid-i Nebevî olarak seçili gelir (Mekke'de otobüs tarifiyle). Başka ekranlar ve paylaşılan bağlantılar için `mataf://ulasim?to=enlem,boylam&name=Ad`.
- **Tam vaktinde uyarı izni (0.13.1)** — Android 14 yeni kurulumda “Alarmlar ve hatırlatıcılar” iznini kapalı veriyor; o zaman sistem ezan bildirimini ve ana ekran kutusunun vakit yenilemesini 10 dakikaya kadar geciktirebiliyor (duman testinde alarm penceresi +10 dk görüldü). Bildirimler ekranı ve vakit kutusu satırı izin kapalıysa bunu söyler, “İzni aç” ile ayar sayfası açılır; dönünce bildirimler ve kutu alarmları tam zamanlı yeniden kurulur.
- **Mekke otobüsleri, internetsiz (0.13.0)** — Ulaşım → Toplu taşıma Mekke'de Makkah Bus hatlarıyla adım adım tarif verir: “7A otobüsüne binin (Al-Shabeka 439 yönü) · Al-Shabeka 439 durağında inin · Varış noktasına yürüyün”. 12 hat ve 392 durak OpenStreetMap'ten gelir; tarif telefonda hesaplanır, süreler yaklaşıktır. Arapça arayüzde durak adları Arapça, öbür dillerde İngilizce (duraktaki tabelalarla aynı). Canlı varış saati ve bilet için Makkah Bus uygulaması. Mekke ve Medine çevresinde Transitous'a istek gönderilmez (orada verisi yok).
- **Liste kutusu düzeltmesi (0.12.1)** — Uzun (liste) vakit kutusunda Akşam ve Yatsı görünmüyordu: Android'in kutu çizicisi (Glance) bir sütunda en çok 10 öğe çiziyor, fazlasını sessizce kesiyordu. Altı satır artık ayrı bir sütunda. Yatsı geçince ana sayfadaki vakit kartı ve Vakitler ekranı yarının vakitlerini gösterir (“Yarının vakitleri”); vurgulanan imsak geri sayımın saatiyle aynı olur. Kutu seçiminde “2×2, 4×2” gibi hücre sayıları kalktı (başlatıcıya göre değişiyordu); yerine kare, geniş, uzun, tek satır yazıyor.
- **Toplu taşıma tarifi ve dört boy küçük uygulama (0.12.0)** — Ulaşım → Toplu taşıma artık adım adım, gündelik dille anlatır: “Taksim istasyonuna yürüyün · M2 metrosuna binin (Yenikapı yönü) · Yenikapı istasyonunda inin · M1B metrosuna binin (Kirazlı yönü) · 11 durak · Bağcılar Meydan istasyonunda inin”. İstanbul’da metro, tramvay, Marmaray ve füniküler tarifi OpenStreetMap verisiyle telefonda, internetsiz hesaplanır (süreler yaklaşık); otobüsler (İETT) ve başka şehirler (Ankara, İzmir, Konya, yurt dışı) Transitous’tan gelir. Depo MIT lisanslı oldu. Ana ekrana dört boy vakit kutusu: küçük (sıradaki vakit büyük yazıyla), orta (günün vakitleri), liste (alt alta) ve ince şerit; hepsi sade ve büyük yazılı, vakit girdiği anda kendini yeniler.
- **Sıcak arayüz ve resimli gökyüzü (0.11.0)** — Uygulamanın renkleri sıcak tonlara geçti: krem zemin, kum rengi yüzeyler, kahveye çalan yazı, kiremit vurgu rengi; koyu tema da kahve tonlarında. Ana sayfanın üstünde resimli, hareketli bir gökyüzü sahnesi var: gökyüzünün rengi güneşin gerçek yüksekliğine göre değişir (gece, şafak, gün doğumu, öğle, gün batımı; sabah ve akşam tonları ayrı), güneş ve ay (evresiyle) gerçek yerlerinde durur. Mekke’de Kâbe, Saat Kulesi ve Harem’in kemerleri, Kâbe’nin çevresinde tavaf eden kalabalık; Medine’de Yeşil Kubbe, minareler, hurmalar ve gündüz açılıp gece kapanan şemsiyeler; başka yerlerde kurşun kubbeli bir cami, serviler ve kiremit çatılı evler. Gece pencereler, kemerler ve şerefeler yanar. Hareketler: güneş ışınları döner ve parıldar, bulutlar süzülür, gündüz kuşlar geçer, gece yıldızlar göz kırpar, tavaf akar; “Hareketleri azalt” açıkken ve ekran görünmezken durur. Sahnenin üstünde yer seçimi ve hicrî/miladî tarih (koyu, yarı saydam çiplerde; sığmazsa tarih alt satıra iner); altında sahneye binen vakit kartı (sonraki vakte geri sayım ve günün altı vakti). Eski gökyüzü yayı kaldırıldı.
- **Hatırlatmalar (0.10.3)** — Kurban Bayramı’nda (Arefe sabahından bayramın 4. günü ikindisine, 23 vakit) ana sayfada ve vakitlerde teşrik tekbiri kartı; o günlerin ezan bildirimlerine “farzdan sonra teşrik tekbiri” notu. İsteğe bağlı mübarek gün hatırlatması: Üç Aylar, kandiller, Ramazan, Arefe ve bayramlardan bir önceki akşam (Regaib, Recep’in ilk cumasına göre). Hac rehberinde “Hac günleri hatırlatmaları”: Terviye sabahı, Arafat vakfesinin başlaması (Arafat’ta öğle), Müzdelife’ye hareket (Arafat’ta akşam), Akabe taşlaması ve 11–13 Zilhicce taşlama vakitleri (Mina’da öğle), nefr-i evvel uyarısı; bildirime dokununca ilgili ekran açılır. Yaşlı ve engelli ziyaretçiler için “Tekerlekli sandalye ve araba” sayfası (Harem’de ücretsiz sandalye noktaları, golf arabası ve itici ile sandalye rezervasyonu, engellilere ücretsiz golf arabası, otelden alma; Ulaşım, Menü araması ve umre rehberinden açılır). Cami ekranında eksik camiyi OpenStreetMap’e bildirme bağlantısı; web sürümünde ilk açılışta iPhone için “Ana Ekrana Ekle” ve Android için uygulama indirme yönlendirmesi.
- **Haremeyn treni (0.10.2)** — Mekke, Cidde (Süleymaniye), Cidde Havalimanı, Kral Abdullah Ekonomik Şehri ve Medine istasyonları haritada ve listede (size uzaklığı, yol tarifi), yaklaşık süreler, bilet ve bagaj bilgisi; sefer saatleri ve bilet için resmî siteye bağlantı. Ulaşım ekranından açılır.
- **Yerlerim (0.10.1)** — bulunduğunuz yeri tek dokunuşla kaydedin (Mina'daki çadır, buluşma noktası, kafile otobüsü, otopark); haritada görün, yürüyüş rotasıyla dönün, konumu WhatsApp'la paylaşın. Ana haritada "Otelim ve yerlerim" katmanında görünür. Kayıtlar yalnız telefonda.
- **Gökyüzü bilgisi (0.10.0; 0.11.0'da resimli sahneye dönüştü)** — güneşin ve ayın şu an gökyüzünde nerede olduğu; ayın evresi ve aydınlık yüzdesi. Vakitler ekranında güneşin ve ayın yüksekliği, yönü, doğuş/batış saatleri ve konumun koordinatları. Hesap telefonda (suncalc), internet gerekmez.
- **Sade arayüz (0.10.0)** — ilk açılışta tek sayfalık "Hoş geldiniz" (dil, konum izni, ezan bildirimi); ana sayfada tek dokunuşla yer seçimi; altışarlı gruplanmış ve aranabilir Menü; Ayarlar'da uzun listeler katlanır satırda; yeni sürüm çıkınca ana sayfada "İndir" şeridi (Android); beklenmeyen hatada sade hata sayfası ve paylaşılabilir hata kaydı.
- **Hac modu (0.9.0)** — gün gün hac rehberi (Terviye, Arafat, Müzdelife, bayramın 1. günü, ziyaret tavafı, üç cemre, veda), hac türüne göre (temettu, kıran, ifrad) adımlar; her adımda yapılacaklar, dualar, sık hatalar, cezası ve dayanağı (Diyanet Hac İlmihali, Hanefî; diğer mezhepler yerinde belirtildi). Hac günlerinin tarihleri Ümmü’l-Kurâ takviminden; hac günlerinde ana sayfada o günün kartı.
- **Şeytan taşlama sayacı (0.9.0)** — bayram günü seçimi, Mina için hesaplanan Hanefî atış vakti (1. gün imsaktan, 2.–3. gün öğleden; 4. gün Ebû Hanîfe’ye göre öğleden önce de), cemre cemre 7 taş, sıra uyarısı, küçük ve orta cemreden sonra dua hatırlatması, vekâlet için ayrı sayaç, toplam 49/70.
- **Hac yerleri haritası (0.9.0)** — Arafat, Mina, Müzdelife, cemreler, Nemire Mescidi, Cebel-i Rahme, Meş’ar-i Harâm, Hayf Mescidi, Meşâir treni istasyonları, hastaneler ve Harem sınırı (OpenStreetMap). Konumla “Arafat / Mina / Harem sınırı içinde misiniz?” denetimi; sınıra yakınken kesin söylemez, tabelalara yönlendirir.
- **Tek harita, katmanlar (0.9.0)** — ana haritanın gerçek (2D) görünümünde otelim, camiler, hastane ve eczaneler, hac yerleri ve Harem sınırı katmanları.
- **Aile ve grup konumu (0.9.0)** — davet koduyla grup; üyeler haritada ve listede (ne kadar önce, ne kadar uzakta), seçilen üyeye yürüyüş rotası. Konum yalnız gruptakilere görünür, geçmiş tutulmaz. Sunucu (Supabase, `docs/SUPABASE.md`) bağlanana kadar yalnız önizleme.
- **Ana ekran küçük uygulaması (0.8.0, Android)** — telefonun ana ekranında bugünün altı vakti ve sıradaki namaz; dokununca uygulama açılır. 30 günlük vakit yazılır, Android en geç 30 dakikada bir yeniler, uygulama açılmasa da gün ve sıradaki vakit ilerler. Vakitler ekranında ve Ayarlar'da "Ana ekrana vakit kutusu ekle" satırı (başlatıcı onay penceresi açar).
- **Çevrimdışı paket (0.8.0)** — internet yokken de çalışsın diye: Mekke (Mina, Müzdelife, Arafat dahil) ve Medine haritaları (vektör karolar, yazı tipleri, simgeler, çizim kütüphanesi), Kur'an metni ve mealler, dua ayetlerinin sesleri. Ayarlar → Çevrimdışı paket; indirilen parça silinebilir.
- **Kaza namazı ve oruç takibi (0.8.0)** — borç hesaplayıcı (yıl/ay/gün ya da doğrudan sayı), vakit vakit "kıldım" sayacı (vitir isteğe bağlı), günlük hedef ve bitiş tahmini, haftalık grafik.
- **Sesli rehber (0.8.0)** — tavafta köşelere gelince kısa bilgi ve dua (Kâbe kapısı ve Mültezem, Rükn-i Irâkî, Hatîm, Rükn-i Şâmî, Rükn-i Yemânî ve iki rükün arası dua), şavt başında istilâm ve remel hatırlatması, bitince Makam-ı İbrâhîm ve Zemzem, zayıf GPS uyarısı; sa'yda Safâ/Merve zikri ve yol duası. Kapalı / kısa / ayrıntılı.
- **Zikir istatistikleri ve yedek (0.8.0)** — bugün, bu hafta, bu ay, toplam, seri (gün), en çok çekilen zikirler, 7 günlük grafik. Tüm kayıtlar (zikirler, ayraçlar, kaza, ayarlar) tek dosyaya yedeklenip başka telefona aktarılabilir.
- **Umre rehberi (0.7.0)** — mîkattan tıraşa 7 adım: her adımda yapılacaklar, dualar, sık yapılan hatalar ve Hanefî mezhebine göre cezaları; ihram yasakları listesi, özel durumlar. İlerleme kaydedilir; tavaf ve sa'y asistanları bitince ilgili adımı kendiliğinden işaretler.
- **Sa'y sayacı (0.7.0)** — Safâ–Merve arası 7 şavt; Mes'a'daysanız GPS ile kendiliğinden sayar (Merve'den başlanan ilk yolu saymaz, uyarır), her zaman elle düzeltilir; Safâ/Merve'de ve yolda okunacak dualar, sesli bildirim, ekran kilidi, önizleme.
- **Otelime dön (0.7.0)** — oteli bir kez kaydedin (bulunduğunuz yer, isimle arama ya da haritada uzun basma); tek dokunuşla yürüyüş rotası, uzaksa Uber ve şoföre gösterilecek Arapça/Urduca/İngilizce kart; oda, telefon, Arapça ad.
- **Acil durum (0.7.0)** — 911/997/999/998/993'ü tek dokunuşla arama, konumu WhatsApp'la gönderme, en yakın hastaneler, Türkiye temsilcilikleri (Cidde Başkonsolosluğu acil hattı, Mekke Din Hizmetleri Ataşeliği), sağlık kartı (Arapça başlıklı) ve görevliye gösterilecek Arapça cümleler. Mekke/Medine'deyken ana sayfada Umre, Tavaf, Otelim ve Acil kısayolları çıkar.
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

> Durum: **0.25.0 — geliştirme sürümü.** Bina biçimleri ve kapı yerleri OpenStreetMap'ten gelir (doğruluğu bu veri kadardır); mescit içi hizmet noktaları örnektir. Ayrıntı: [docs/VERI-KAYNAKLARI.md](docs/VERI-KAYNAKLARI.md), [scripts/osm-3d.md](scripts/osm-3d.md).

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

Ayrıntılı adımlar: [`docs/SUPABASE.md`](docs/SUPABASE.md). Kısaca:

1. Supabase'de yeni proje → **SQL Editor** → [`supabase/schema.sql`](supabase/schema.sql) dosyasını çalıştırın.
2. **Authentication → Sign In / Providers → Allow anonymous sign-ins**'i açın.
3. Proje kök klasöründe `.env` dosyası oluşturun (örnek: [`.env.example`](.env.example)):

```
EXPO_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

4. `npx expo start` ile yeniden başlatın. Ayarlar ekranında "Canlı sunucu (Supabase)" yazmalı.
   GitHub derlemeleri için aynı iki değer `SUPABASE_URL` ve `SUPABASE_PUBLISHABLE_KEY` gizli değerleri olarak girilir.

## Ulaşım ve toplu taşıma

| İş | Kaynak | Koşul |
|---|---|---|
| Yer arama, adres | [Photon](https://photon.komoot.io) (OpenStreetMap) | Makul kullanım; yoğun kullanımda kendi Photon sunucunuz |
| Yürüme / araç rotası | [FOSSGIS OSRM](https://routing.openstreetmap.de) | Makul kullanım; ulaşılamazsa kaba tahmin gösterilir |
| Toplu taşıma (otobüs, metro, tren) | [Transitous](https://transitous.org) (MOTIS 2, dünya geneli açık GTFS verisi) | **Yalnız açık kaynak + ticari olmayan projeler**, günde ~720 istek altı, uygulamayı tanıtan User-Agent, [kaynak listesine](https://transitous.org/sources/) bağlantı |
| İstanbul metro, tramvay, Marmaray, füniküler | OpenStreetMap hat ilişkileri → `src/data/istanbulRail.json` (`scripts/ist_rail.py`) | ODbL atfı; tarif telefonda, internetsiz hesaplanır (süreler yaklaşık) |
| Mekke otobüsleri (Makkah Bus) | OpenStreetMap hat ilişkileri → `src/data/makkahBus.json` (`scripts/makkah_bus.py`) | ODbL atfı; tarif telefonda, internetsiz (süreler yaklaşık, canlı saat yok) |

Depo MIT lisanslıdır; Transitous GitHub derlemelerinde açıktır (`EXPO_PUBLIC_TRANSITOUS_CONTACT` iş akışlarında depo adresi). Yerelde açmak için `.env` içine yazın:

```
EXPO_PUBLIC_TRANSITOUS_CONTACT=https://github.com/sozerahmethayri-ops/Mataf
```

Uygulama her isteğe `User-Agent: MATAF/<sürüm> (<iletişim>)` ekler. Transitous'ta İstanbul için yalnız İETT otobüsleri var (metro/tramvay yok); bu yüzden İstanbul'da raylı sistem tarifi OpenStreetMap verisiyle uygulamanın içinde yapılır ("M1B metrosuna binin, Kirazlı yönü · Bağcılar Meydan istasyonunda inin") ve otobüs seçenekleriyle birlikte gösterilir. Suudi Arabistan için Transitous'ta veri yok: Mekke'de otobüs tarifi OpenStreetMap'teki Makkah Bus hatlarından uygulamanın içinde yapılır, Medine'de harita uygulaması açılır. Kullanıcı sayısı artınca günlük istek sınırı için Transitous ile görüşülmeli. Ticari yayında kendi [MOTIS](https://github.com/motis-project/motis) sunucunuzu kurun ya da ticari bir tarif servisi kullanın. Mekke–Medine arası Haremeyn treni ve şehir otobüsleri, ilgili açık veri yayımlandığı ölçüde görünür.

## Ezan bildirimleri

- Bildirimler telefonda kurulur (sunucu yok): seçilen konum ve hesaplama yöntemine göre önümüzdeki ~5 gün; uygulama her açıldığında yenilenir (iOS en çok 64 bekleyen bildirime izin verir).
- Sesler (`assets/sounds/*.wav`) bu projede sentezlenmiştir, telif içermez: `python3 scripts/make-sounds.py assets/sounds`.
- Tam ezan bildirim sesi olamaz (iOS'ta bildirim sesi en çok 30 sn). Kullanıcı kendi ezan kaydını (mp3/m4a) seçerse, vakit girdiğinde uygulama açıksa ya da bildirime dokununca tamamı çalar; üstte "Durdur" çubuğu çıkar. Uygulamaya hazır ezan kaydı eklemek isterseniz, dağıtım izni olan bir kayıt kullanın.
- Android'de kesin zamanlı bildirim için `SCHEDULE_EXACT_ALARM` istenir; kullanıcı "Alarmlar ve hatırlatıcılar" iznini kapatırsa bildirim birkaç dakika gecikebilir.

## Proje yapısı

```
src/
  app/            Rotalar (Expo Router): (tabs)/ harita, Kur'an, ana sayfa (orta), ulaşım, menü
                  umre · say · otel · acil · vakitler · zikir · hadis-dua · kapilar · kapi/[id] · bildir · navigasyon · arama · sehir · cami
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
tools/            Geliştirme araçları: web ekran görüntüsü (web-shots), Supabase kurallarını yerelde deneme
```

## Geliştirme komutları

```bash
npm run typecheck   # TypeScript kontrolü
npm run check       # mantık testleri (230'u aşkın): kapı kuralları, rota, tavaf sayacı, harita döndürme,
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
- Toplu taşıma: Transitous ve [veri kaynakları](https://transitous.org/sources/) — uygulamada bağlantı gösterilir. İstanbul raylı sistem ve Mekke otobüs hatları: © OpenStreetMap katkıcıları (ODbL).
- Bildirim sesleri: bu projede sentezlendi (`scripts/make-sounds.py`).
- Kur'an metni ve meal: alquran.cloud (Tanzil). Meal hakları sahiplerine aittir; mağazaya yüklemeden önce kullanılan mealin lisansını kontrol edin.
- Hadis: fawazahmed0/hadith-api (açık veri). Çevirileri yayından önce bir ilahiyatçıya kontrol ettirin.
- Resmî kapı/kapanma verisi için İki Kutsal Mescid İşleri Genel Kurumu ile veri anlaşması gerekir (docs/VERI-KAYNAKLARI.md).
- Yazılım lisansı: [MIT](LICENSE). Uygulamadaki ve uygulamanın çektiği veriler kendi lisanslarını korur (OpenStreetMap: ODbL).

---

### English summary

MATAF is an Expo (React Native) app for visitors to Masjid al-Haram and the Prophet's Mosque: true-scale 3D maps built from OpenStreetMap's 3D building data (real outlines, minarets, domes, Clock Tower; pinch to zoom, two-finger rotate), crowd-sourced gate closures with automatic rerouting, turn-by-turn walking guidance, a worldwide transport tab (walk, transit via Transitous plus offline Istanbul metro/tram/Marmaray and Makkah Bus directions, car/taxi, "show the driver" card), nearest mosque anywhere, on-device prayer times, Qibla and adhan notifications (custom sounds, your own adhan recording), light/dark themes with 5 palettes, Quran with audio/translations/tafsir, Sahih al-Bukhari, duas, a 3D tawaf assistant and a Rawdah guide. Run with `npm install && npx expo start` and open in Expo Go. Optional live backend: Supabase (`supabase/schema.sql`, `.env`). Licence: MIT.
