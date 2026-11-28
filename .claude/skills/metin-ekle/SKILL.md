---
name: metin-ekle
description: MATAF'ta kullanıcıya görünen her yazıyı eklerken ya da değiştirirken kullan. Kapsam - Türkçe, İngilizce ve Arapça üçlüsü (ekrana özel const L + pick, ortak src/i18n/strings.ts + t()), Türkçe yazım ve ek kuralı, kısa ve gündelik dil, sayı ve birim biçimi, Arapça ve sağdan sola düzen, yön simgeleri. Yeni ekran, düğme, uyarı, bildirim, kutu yazısı, hata iletisi, README dışındaki her arayüz metni ya da çeviri işinde önce bu skilli oku. Eksik Arapça ya da İngilizce metin testte ve ekranda sorun çıkarır.
---

# Arayüz metni (tr / en / ar)

Hedef kullanıcı Türkiye'den hac ve umreye giden, çoğu teknolojiye uzak, yaşlı olabilen ziyaretçi. Metin kısa, gündelik ve tek anlamlı olmalı. Türkçe ana dildir; İngilizce ve Arapça da tam olmalı. Arapça seçen kullanıcı İngilizce yazı görmemeli.

## Metin nereye yazılır

- **Ekrana özel metin:** Dosyanın başında `const L = { anahtar: { tr, en, ar } }` tanımla, çizimde `pick(L.anahtar, lg)` ile kullan.
  ```tsx
  const L = {
    title: { tr: 'Namaz takibi', en: 'Prayer log', ar: 'سجل الصلاة' },
    left: { tr: '{p} vaktine kalan', en: 'Time until {p}', ar: 'المتبقي على {p}' },
  };
  const { lang } = useI18n();
  const lg = lang as Lang;
  pick(L.left, lg).replace('{p}', name)
  ```
  `pick` en ve ar'ı isteğe bağlı kabul eder: eksik Arapça sessizce İngilizceye düşer, tür denetimi bunu yakalamaz. Üçünü de sen yaz.
- **Birden çok ekranda kullanılan metin:** `src/i18n/strings.ts`'te `tr`, `en`, `ar` sözlüklerine aynı anahtarı ekle; `const { t } = useI18n();` ile `t('anahtar', { p: ad })` yaz. `npm run check` üç sözlüğün aynı anahtarları ve aynı `{değişken}`leri taşıdığını denetler.
- **React dışındaki metin:** Bildirim, kutu, servis metinleri `src/services/*` içinde aynı `{ tr, en, ar }` biçimiyle durur ve dil parametre olarak verilir; örnek: `widgetProps.ts` içindeki `L`. Kutu çizimi ayrı ortamda çalıştığı için metin kutuya props olarak gider.
- **Dinî metin:** Âyet, hadis ve dua metni arayüz metni değildir. Onlar için `dini-icerik` skilline bak.

## Türkçe

- **Ek kuralı:** Eki cins isim taşır, özel ad yalın kalır. "Yenikapı istasyonunda inin", "Al-Shabeka 439 durağında inin", "{p} vaktine kalan". Değişkenli metinde eki değişkene ekleme ("{p}'e" ünlü uyumunda bozulur); arkasına bir cins isim koy.
- **Dil:** Kısa ve gündelik yaz: "Kıldım", "Otelime dön", "İzni aç". Edilgen ve resmî dilden kaçın ("işlem gerçekleştirildi" yerine "kaydedildi").
- **Sayı ve birim:** Sayıyı birimiyle yaz: "≈ 27 dk", "560 m", "%40". Saat "05:12" biçiminde.
- **Büyük harf:** Cümle düzeninde yaz; `textTransform: 'uppercase'` kullanma, Türkçe "i" harfi "I" oluyordu.
- **Noktalama:** Kısa arayüz metninde uzun tire (—) kullanma; virgül, iki nokta ya da nokta yeter.
- **Dürüstlük:** Veri canlı değilse "canlı" yazma. Demo ve önizleme olduğunu söyle ("Yerel demo (bu cihaz)").
- **Dinî terimler:** Diyanet yazımını kullan: âyet, sûre, Kur'an, hicrî, Ümmü'l-Kurâ, sa'y, ihram, cemre.

## İngilizce

Kısa, cümle düzeninde, gündelik dil: "Time until {p}", "Bookmark this verse". Terimlerde yaygın İngilizce karşılığı kullan (Fajr, Dhuhr, Tawaf, Sa'i). Arayüzde Türkçe kelime bırakma.

## Arapça

- Modern standart Arapça, kısa ve açık yaz: "المتبقي على {p}". Namaz vakitlerinin ve ibadetlerin Arapça adlarını kullan: الفجر، الظهر، الطواف، السعي.
- Rakamlar arayüzde Batı rakamıyla yazılır (05:12). Doğu Arap rakamı (`AR_DIGITS`) yalnız Kur'an ekranlarında sayfa ve âyet numarasında kullanılır.
- Çoğul ve sayı uyumuna dikkat et (محطة واحدة، محطتان، محطات). Gerekirse sayıya göre ayrı metin seç; örnek: `transitText.ts`.
- Yön:
  - Telefonda Arapça seçilince `I18nManager.forceRTL` düzeni çevirir; değişiklik uygulama yeniden başlayınca görünür.
  - Web'de `<html dir="rtl">` düzeni hemen çevirir.
  - `flexDirection: 'row'` RTL'de kendiliğinden döner. Elle `left/right` yerine `start/end` kullan.
  - Yön simgeleri (`chevron`, `back`) `Icon.tsx` içinde `useLayoutRtl` ile aynalanır; dönüş okları (`rotl`, `rotr`) aynalanmaz.
  - Web'de sekme kaydırıcısı yön bilmez: soldan sağa kalır, sayfaların içi ve alt çubuk sağdan sola çizilir (`(tabs)/_layout.tsx`).

## Denetim listesi

1. Her yeni metnin `tr`, `en` ve `ar` karşılığı var; değişkenler (`{p}`) üçünde aynı.
2. Metin dar ekrana ve büyük yazı ölçeğine (`fs`) sığıyor; sığmıyorsa satır kırılabiliyor ya da daha kısa bir karşılık var.
3. `npm run typecheck`, `npm run lint` ve `npm run check` temiz.
4. Görünür bir değişiklikse Arapça düzeni de gör. Web görüntüsünde Arapça için spec'e `"extra": "localStorage.setItem('mataf.lang','ar');"` ekle (`web-goruntu` skilli).
