---
name: arayuz-tasarim
description: MATAF'ın görsel tasarım kuralları - renk belirteçleri ve paletler, anlam renkleri, WCAG AA, yazı ölçeği (T, fs, fsAr), aralık ve köşe, hazır parçalar (ui.tsx), sadelik, şablon görünümünden kaçınma, ana sayfa gökyüzü, harita etiketleri, kutu görünümü. Yeni ekran ya da kart kurarken; renk, tema, palet, yazı boyu, düzen, simge, ana sayfa, harita ya da kutu görünümünü değiştirirken; "tasarım", "görünüm", "renk", "daha güzel", "sade yap" denince kod yazmadan önce bu skilli oku.
---

# Arayüz tasarımı

Hedef kullanıcı çoğu teknolojiye uzak, yaşlı olabilen bir hacı ya da umreci; kalabalıkta, güneşte, tek elle kullanıyor. Her karar buna göre: büyük yazı, yüksek kontrast, tek dokunuş, ekranda bir ana eylem.

## Renkler (`src/constants/theme.ts`)

Renkleri `C` nesnesinden çizim anında oku. Tema değişince `applyTheme` aynı nesneyi günceller ve ekranlar yeniden kurulur. Modül düzeyinde renkten türeyen stil varsa `onThemeChange` ile yenile. Kod içine sabit renk yazma.

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

- **Vurgu paleti:** Kullanıcı seçer: Kiremit (`kabe`, varsayılan), Zümrüt (`zumrut`), Gece mavisi (`gece`), Altın (`altin`), Gül (`gul`).
  - Kiremit'te `accent` #B4420F, `route` #F26A1B; koyuda `accent` #F7934F.
  - Her palette `accent`, `onAccent`, `accentTint`, `accentSoft` ve `route` var.
  - Kiremit dışındaki paletler zemin, yüzey, çizgi ve yazı tonlarını da değiştirir (`PALETTES.*.light/dark`). Tablo Kiremit'in değerleridir.
- **Kontrast:** Her yeni renk çifti açık ve koyu temada WCAG AA'yı geçmeli. `scripts/check-logic.ts`'teki kontrast testleri bütün paletleri dener; yeni çifti oraya ekle.
- **Anlam renkleri sabit:**
  - kırmızı kapalı; yanında X simgesi olur, renk tek başına anlam taşımaz;
  - amber kısıtlı, deniz yeşili açık, turuncu rota;
  - mavi yalnız "siz" (kullanıcının konumu); aile üyesi renklerinde mavi yok.
- **Palet her yerde:** Proje sahibinin isteğiyle (0.15.0) palet ekranın her yerinde hissedilir. Zemin, yüzey, çizgi ve yazı paletin tonunu taşır. Simgeler, bölüm başlıkları, seçili çip ve sekme, ilerleme çubukları vurgu rengindedir.
- **Renkli zeminli kart:** Yalnız anlam taşıyınca kullanılır: durum renkleri, uyarı, seçili öğe, bugünkü adım, cuma.
- **Gölge:** Sıcak kahve (#4A3424, opaklık 0,12); koyuda siyah, opaklık 0,45.

## Yazı

- **Yazı tipi:** Arayüzde sistem yazı tipi. Kur'an hatları için `dini-icerik` skilline bak.
- **Ölçek:** Ortak stiller `T`:

  | Stil | Boy/kalınlık | Not |
  |---|---|---|
  | `T.h1` | 26/700 | |
  | `T.h2` | 18/700 | |
  | `T.h3` | 16/700 | |
  | `T.body` | 15 | satır 22 |
  | `T.muted` | 13 | |
  | `T.small` | 12 | |
  | `T.section` | 14/700 | vurgu renginde, cümle düzeninde |
  | `T.arabic` | 24 | satır 40, sağa yaslı |

- **Büyütme:** Hepsi kullanıcının yazı ölçeğiyle büyür. Yeni boyları `fs(n)`, Arapça boyları `fsAr(n)` ile yaz. Düzeni "Çok büyük" yazı boyunda da dene; sığmayan yazı alt satıra inmeli, kesilmemeli.
- **Büyük harf:** Büyük harf dönüşümü yok; Türkçe "i" harfi "I" oluyordu.

## Biçim ve davranış

- **Ölçüler:** Aralık `S`: 4/8/12/16/20/24. Köşe `R`: 10/14/18/24/hap. Kart: `surface` zemin, ince `border`. Dokunma alanı en az 44 px.
- **Hazır parçalar** (`src/components/ui.tsx`): `Screen`, `Header`, `Card`, `Btn`, `Chip`, `Segmented`, `ListRow`, `SelectRow`, `Toggle`, `StatusPill` ve `T` stilleri. Yeni ekran `Screen` + `Header` ile kurulur. Simgeler `Icon.tsx`'teki yol tablosundadır; tabloda olmayan simge adı boş çizilir.
- **Sadelik:** Ekranda bir ana eylem olur. İkincil seçenek katlanır satıra (`SelectRow`) ya da Menü aramasına gider.
- **Şablon (yapay zeka) görünümünden kaçın (0.13.5):**
  - simge renkli kare ya da daire zemine oturmaz, yazının yanında durur;
  - başlıkta büyük harf ve harf aralığı yok;
  - alt sekmeler eşit, ortada büyütülmüş düğme yok;
  - kısa arayüz metninde uzun tire (—) yok;
  - veri canlı değilse "canlı" yazılmaz;
  - Menü gruplu liste, ana sayfa kısayolları iki sütun.
- **Ana sayfa:** Üstte resimli, hareketli gökyüzü: Mekke'de Kâbe, Saat Kulesi ve tavaf eden kalabalık; Medine'de Yeşil Kubbe; başka yerde cami.
  - Gökyüzünün rengi güneşin yüksekliğine göre değişir; güneş ve ay gerçek yerinde durur.
  - Animasyon yerel sürücüyle çalışır; yalnız ekran öndeyken ve "Hareketleri azalt" kapalıyken oynar.
- **Harita:**
  - Etiketler çakışmaz; yer yoksa gizlenir, hedef etiketi hep görünür.
  - Saat Kulesi yarı saydam çizilir.
  - Ölçek çubuğu ve "© OpenStreetMap" atfı her zaman durur.
- **Kutular (0.22.0, proje sahibinin isteği: "Ezan Vakti Pro'ya benzesin"):**
  - Zemin seçili paletin koyu ya da açık tonudur, ya da uygulamanın temasını izler. Şeffaflık ayrı ayarlanır (varsayılan koyu ve %40 şeffaf).
  - Büyük, saniye saniye işleyen geri sayım; yer, miladi ve hicrî tarih.
  - Sıradaki vakit paletin vurgusunda dolu hapta ve `onAccent` yazıyla; geçen vakitler soluk.
  - Başka uygulamanın adı, simgesi ya da çizimi kullanılmaz; yalnız düzen ve özellikler benzer.
  - Adlarda hücre sayısı geçmez (başlatıcıya göre değişir): kare, geniş, uzun, tek satır, namaz takibi.
  - Kod kuralları için `kutu-gelistir` skilline bak.
- **İlk ekran taslakları:** https://claude.ai/artifact/ANqaTkraeKbHq1RJ6kE4yA. Oradaki beyaz zemin ve #C2410C eskidir; geçerli olan bu skill.

## Bitirirken

Görünür her değişikliği web görüntüsünde gör: açık ve koyu tema, en az bir başka palet, Arapça. Bunun için `web-goruntu` skilline bak. Telefona özgü görünüm (kutular, bildirim) emülatörde görülür; bunun için `duman-testi` skilline bak.
