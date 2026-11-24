# MATAF — Mescid-i Haram ve Mescid-i Nebevî navigasyon uygulaması

Mekke ve Medine'deki ziyaretçiler için iOS ve Android uygulaması:

- **Gerçek ölçekli 3D harita** — Mescid-i Haram (Kâbe, Mataf, Mes'a, Saat Kulesi) ve Mescid-i Nebevî (Yeşil Kubbe, şemsiyeler, minareler), metre cinsinden; 100 m ölçek çubuğu.
- **Kapı kapanmalarına göre rota** — ziyaretçiler kapı durumunu bildirir, yorum yazar, onaylar; kapalı kapılar rotadan otomatik çıkar. Resmî duyuru her zaman önceliklidir.
- **Turuncu izle navigasyon** — sıradaki dönüş, kalan mesafe, kapı kapanınca "rota güncellendi" uyarısı. Mescid çevresinde değilseniz demo yürüyüş.
- **Şehir haritası** — oteller, yemek, eczane, otobüs, taksi, hastane (OpenStreetMap); otelinizi kaydedip mescide yaya rotası.
- **Namaz vakitleri ve kıble pusulası** — telefonda hesaplanır (Ümmü'l-Kurâ, Diyanet, MWL…), internet gerekmez.
- **3D tavaf asistanı** — Kâbe gerçek ölçü ve yönüyle (Hacerü'l-Esved, Rükn-i Irâkî/Şâmî/Yemânî, kapı, Hatîm, Makam-ı İbrâhîm); konumunuz ve bu şavtta yürüdüğünüz yay; Hacerü'l-Esved hizasından başlayan **şavt sayacı** (GPS ile otomatik + elle düzeltme); köşelere geldikçe istilam/selamlama ve dua; **sesli asistan** (şavt duyurusu, "Rabbenâ âtinâ…" kâri sesiyle); tavaf sonrası adımlar (Makam, 2 rekât, Zemzem, sa'y). Ekran açık kalır, cep kilidi vardır.
- **Kur'an-ı Kerim** — 114 sûre; **12 kâriden ayet ayet sesli okuma**, **9 dilde sesli meal** (Türkçe Diyanet Vakfı dahil), 50+ dilde 100'ü aşkın meal, Latin harfli okunuş, **30+ dilde tefsir** (Türkçe: Muhtasar, Sa'dî, İbn Kesîr); okunan ayet vurgulanır.
- **Dua kütüphanesi** — 20 kategori, 100'ü aşkın kayıt (sabah-akşam, namaz sonrası, tavaf, sa'y, hac, Medine, sıkıntı, şifa, tövbe, yolculuk, Kur'an'daki dualar…), arama, kaynak numarası, sesli dinleme. Kur'an'daki dualar seçtiğiniz meal dilinde gelir.
- **Sahîh-i Buhârî ve günün hadisi.**
- **Ravza rehberi** — ziyaret saatleri, Nusuk izni, resmî 360° sanal tur bağlantısı.
- **Türkçe, İngilizce, Arapça** (Arapça sağdan sola).

> Durum: **0.1.0 — geliştirme sürümü.** Harita dış hatları yayımlanmış ölçülerden oranlanmıştır; kapı yerleri ve mescit içi hizmet noktaları yaklaşıktır / örnektir. Ayrıntı: [docs/VERI-KAYNAKLARI.md](docs/VERI-KAYNAKLARI.md).

## Hızlı başlangıç

Gerekenler: [Node.js 20+](https://nodejs.org) ve telefonda **Expo Go** uygulaması.

```bash
git clone https://github.com/<kullanici-adiniz>/mataf.git
cd mataf
npm install
npx expo start
```

Terminalde çıkan QR kodu telefonunuzdaki Expo Go ile okutun. Uygulama birkaç saniyede açılır.

### Telefona kurulabilir dosya (APK / iOS) üretmek

Expo'nun bulut derleme hizmetiyle (ücretsiz katman yeterli):

```bash
npx eas-cli@latest login
npx eas-cli@latest build -p android --profile preview   # paylaşılabilir .apk
npx eas-cli@latest build -p ios --profile preview       # Apple geliştirici hesabı gerekir
```

Derleme bitince verilen bağlantıdan dosyayı indirip GitHub'da **Releases** bölümüne ekleyebilirsiniz.

## Canlı bildirim sunucusu (isteğe bağlı)

Kurulumsuz çalıştırdığınızda kapı bildirimleri **yalnızca o telefonda** tutulur (yerel demo, örnek bildirimlerle). Herkesin bildirimini herkesin görmesi için ücretsiz bir [Supabase](https://supabase.com) projesi açın:

1. Supabase'de yeni proje → **SQL Editor** → [`supabase/schema.sql`](supabase/schema.sql) dosyasını çalıştırın.
2. **Authentication → Providers → Anonymous sign-ins**'i açın.
3. Proje kök klasöründe `.env` dosyası oluşturun (örnek: [`.env.example`](.env.example)):

```
EXPO_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

4. `npx expo start` ile yeniden başlatın. Ayarlar ekranında "Canlı sunucu (Supabase)" yazmalı.

## Proje yapısı

```
src/
  app/            Ekranlar (Expo Router): (tabs)/ harita, kapılar, Kur'an, vakitler, hadis
                  kapi/[id] · bildir · navigasyon · arama · sehir · kible · ravza · medine-rehber · veriler · ayarlar
  scene/          Gerçek ölçekli 3D çizim motoru (eğik izdüşüm) ve Mekke/Medine sahneleri
  services/       Bildirim kuralları + Supabase, rota planlama, konum, namaz vakti, Kur'an, hadis, OSM
  data/           Kapılar, hedefler, hizmet noktaları, Ravza saatleri, dualar
  i18n/           TR / EN / AR metinleri
supabase/         Veritabanı şeması
docs/             Mimari, veri kaynakları, otomatik güncelleme
scripts/          Mantık kontrolü (npm run check)
```

## Geliştirme komutları

```bash
npm run typecheck   # TypeScript kontrolü
npm run check       # bildirim kuralları ve kapı kapanınca yeniden rota testleri
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

- Harita: © OpenStreetMap katkıcıları (ODbL) — uygulamada atıf gösterilir. Yaya rotası: FOSSGIS OSRM.
- Kur'an metni ve meal: alquran.cloud (Tanzil). Meal hakları sahiplerine aittir; mağazaya yüklemeden önce kullanılan mealin lisansını kontrol edin.
- Hadis: fawazahmed0/hadith-api (açık veri). Çevirileri yayından önce bir ilahiyatçıya kontrol ettirin.
- Resmî kapı/kapanma verisi için İki Kutsal Mescid İşleri Genel Kurumu ile veri anlaşması gerekir (docs/VERI-KAYNAKLARI.md).
- Bu depo için henüz bir yazılım lisansı seçilmedi. Açık kaynak yapmak isterseniz `LICENSE` dosyası ekleyin (ör. MIT).

---

### English summary

MATAF is an Expo (React Native) app for visitors to Masjid al-Haram and the Prophet's Mosque: true-scale 3D maps, crowd-sourced gate closures with automatic rerouting, turn-by-turn walking guidance, a city map (OpenStreetMap), on-device prayer times and Qibla, Quran, Sahih al-Bukhari and duas, and a Rawdah guide. Run with `npm install && npx expo start` and open in Expo Go. Optional live backend: Supabase (`supabase/schema.sql`, `.env`).
