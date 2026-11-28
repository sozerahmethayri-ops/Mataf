---
name: surum-cikar
description: MATAF'ın yeni sürümünü çıkarıp main'e gönderir. Denetimleri (typecheck, lint, check) yapar, sürüm numarasını betikle her yerde yükseltir, README değişiklik günlüğünü ve Türkçe commit'i yazar, gönderir. Ardından CI, APK ve web iş akışlarını ve version.json'u denetler, gerekiyorsa duman testini çalıştırır, proje sahibine özet yazar. Kullanıcıya görünen her değişiklik bittiğinde, bir deneme dalını main'e alırken, "sürüm çıkar", "yayınla", "main'e gönder", "APK'yı güncelle" denince bu skilli kullan. Yalnız belge ya da araç değişikliğinde sürüm gerekip gerekmediğine de buradan karar ver.
---

# Sürüm çıkarma

`main`'e her gönderim APK'yı (GitHub Releases, "apk-latest") ve web sürümünü (GitHub Pages) yeniden yayınlar. Telefondaki uygulama 6 saatte bir `version.json`'a bakar. Sürüm numarası artmışsa "İndir" şeridini gösterir; numara aynı kalırsa güncellemeyi görmez. Bu yüzden kullanıcıya görünen her değişiklik yeni bir sürüm numarası alır.

## Sürüm gerekir mi?

- **Evet:** Kullanıcıya görünen her değişiklik: ekran, metin, davranış, kutu, bildirim, veri.
- **Hayır:** Yalnız belge, test, CI, skill ya da betik değişikliği. Commit `belgeler: …` ya da `araçlar: …` ile başlar. Bu gönderim de APK'yı aynı numarayla yeniden derler; küçük belge düzeltmelerini biriktirip birlikte gönder.
- **Numara:** Düzeltme ya da küçük değişiklikte yama sürümü (0.22.0 → 0.22.1), yeni özellikte ara sürüm (0.23.0). `versionCode` her sürümde 1 artar.

## Adımlar

1. **Denetimler:** `npm run typecheck`, `npm run lint`, `npm run check`. Üçü de temiz olmalı; check'te her satır `OK`. Test eklediysen CLAUDE.md "Komutlar"daki test sayısını güncelle.
2. **Sürüm numarası:** Önce `--dry-run` ile dene, sonra asıl çalıştır:
   ```bash
   python3 -I .claude/skills/surum-cikar/scripts/bump_version.py X.Y.Z --dry-run
   python3 -I .claude/skills/surum-cikar/scripts/bump_version.py X.Y.Z
   ```
   Betik şu yerleri günceller: `package.json`, `package-lock.json` (en üstteki iki `version`), `app.json` (`expo.version`, `android.versionCode` +1), README "Durum" satırı, CLAUDE.md'deki sürüm satırları.
3. **README değişiklik günlüğü:** Listenin başına bir madde ekle: `- **Kısa başlık (X.Y.Z)** — …`. Madde proje sahibi ve kullanıcılar içindir. Gündelik Türkçeyle ne değiştiğini ve kullanıcının ne göreceğini yaz; teknik ad (Glance, FlatList, RAPTOR…) kullanma. Biçim için README'nin ilk maddelerine bak.
4. **Belgeler:** Yeni özelliği `docs/OZELLIKLER.md`'de ilgili maddeye işle; dosya yerlerini de yaz. CLAUDE.md'de yeni karar "Mimari kararlar"a, yeni sınır "Bilinen hatalar"a girer. Biten iş "Yapılacaklar"dan çıkar. "Şu anki durum"u güncelle.
5. **Acil numaraları:** CLAUDE.md "Yapılacaklar 14"teki kaynaklarla uygulamadakileri karşılaştır. Değişiklik yoksa o maddedeki tarihi güncelle; varsa numarayı düzelt ve günlüğe yaz.
6. **Commit:** Türkçe. İlk satır `X.Y.Z: kısa özet`, altında madde madde ne değişti ve neden. Oturumun istediği atıf satırlarını ekle; model adı yazma.
7. **Gönder:** `git push -u origin main`. Ağ hatasında 4 kez dene, her seferinde daha uzun bekle (2, 4, 8, 16 sn). Deneme dalından geliyorsan aşağıdaki "Deneme dalı" bölümüne bak.
8. **İş akışları:** Şu komutla bak:
   ```bash
   gh run list -R sozerahmethayri-ops/Mataf -L 6 --json databaseId,workflowName,headSha,status,conclusion
   ```
   Yeni commit için CI, Android APK ve Web (GitHub Pages) başarılı bitmeli. Arka planda bekle: Bash `run_in_background` ile bir döngü kur, ön planda `sleep` kullanma.
   APK ve Pages iş akışları `cancel-in-progress` ayarlı: arkadan gelen gönderim önceki derlemeyi iptal eder. Belge düzeltmesini aynı gönderime koy ya da derlemenin bitmesini bekle.
9. **Doğrula:** `version.json` yeni sürümü ve `versionCode`'u göstermeli:
   ```bash
   curl -sSL https://github.com/sozerahmethayri-ops/Mataf/releases/download/apk-latest/version.json
   ```
10. **Duman testi:** Yerel davranış değiştiyse çalıştır: kutular, bildirim, alarm, yama, izin, derin bağlantı, yazı tipi. Bunun için `duman-testi` skillini kullan, sonucu CLAUDE.md "Doğrulandı" satırına yaz.
11. **Özet:** Proje sahibine kısa Türkçe yaz. Ne değişti (kullanıcının diliyle), bağlantılar (APK, web), neyle doğrulandı (test, web görüntüsü, emülatör), ondan ne bekleniyor. Gerçek telefonda denenmediyse bunu söyle.

## Deneme dalı

Yerel kod ve yama gibi büyük ya da riskli işi önce bir dalda yap:

1. Dalı aç ve GitHub'a gönder:
   ```bash
   git checkout -b <dal>
   git push -u origin <dal>
   ```
2. Duman testini dalda çalıştır: `--start <dal>`.
3. Temizse dalı `main`'e tek commit olarak al:
   ```bash
   git checkout main && git pull --ff-only origin main
   git merge --squash <dal>
   git commit    # ilk satır "X.Y.Z: …"
   git push -u origin main
   ```
4. Uzaktaki dalı bulut oturumundan silemezsin; `git push origin --delete` bağlantıyı kesiyor. Yerel dalı sil (`git branch -D <dal>`) ve `git update-ref -d refs/remotes/origin/<dal>` çalıştır. Dalın adını CLAUDE.md "Bilinen hatalar"daki silinemeyen dallar notuna ekle.
5. Dal için fetch ayarı eklediysen kaldır: `git config --unset remote.origin.fetch '\+refs/heads/<dal>:refs/remotes/origin/<dal>'`.

## Bulut oturumu notları

- `gh` GraphQL çalışmayabilir. `gh workflow run` için `--ref main` ver; sürüm dosyalarını `curl -L https://github.com/sozerahmethayri-ops/Mataf/releases/download/<etiket>/<dosya>` ile indir.
- APK'nın sürüm sayfasına yüklenmesi ara sıra "Server Error" ile düşer. `gh run rerun <id> --failed` ile yeniden çalıştır ya da sonraki gönderimi bekle.
