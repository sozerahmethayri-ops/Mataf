# Sunucu kurulumu (Supabase): aile/grup konumu ve canlı kapı bildirimleri

Uygulama sunucusuz da çalışır; bu durumda aile/grup konumu yalnız **önizleme** (bu cihazda, örnek üyelerle),
kapı bildirimleri de **yerel demo** olur. Gerçek kullanım için ücretsiz bir Supabase projesi yeter.

## 1. Proje
1. supabase.com → oturum aç → **New project**. Ad: `mataf`, bölge: **Frankfurt (eu-central-1)**. Veritabanı şifresini
   bir yere not edin (uygulamaya gerekmez).
2. Proje açılınca **SQL Editor** → **New query** → bu depodaki `supabase/schema.sql` dosyasının tamamını yapıştırıp **Run**.
   Hata vermemeli. (İkinci kez çalıştırılırsa yalnız `create policy` / `alter publication` satırları "zaten var" diyebilir.)
3. **Authentication → Sign In / Providers** → **Allow anonymous sign-ins** açık olsun. Kullanıcılar e-posta vermeden,
   cihazda saklanan anonim bir oturumla girer.

## 2. Anahtarlar
**Project Settings → API Keys** sayfasından iki değer:
- **Project URL** (ör. `https://abcd1234.supabase.co`; "Data API" bölümünde de yazar)
- **Publishable key** (`sb_publishable_` ile başlar). Herkese açık anahtardır; veriyi satır güvenliği (RLS) korur.
  Eski projelerde bunun yerine "anon public" anahtarı (`eyJ…`) olabilir; o da çalışır.

**Secret key** (`sb_secret_…`) ve eski **service_role** anahtarını kimseyle paylaşmayın, uygulamaya koymayın.

## 3. Uygulamaya bağlama
GitHub deposunda **Settings → Secrets and variables → Actions → New repository secret**:
- `SUPABASE_URL` = Project URL
- `SUPABASE_PUBLISHABLE_KEY` = Publishable key

(Ya da bu iki değeri Claude'a verin; `gh secret set` ile o ekler.) Sonraki derlemede APK ve web sürümü sunucuya bağlanır;
Ayarlar'da "Canlı sunucu (Supabase)" yazar. Yerelde denemek için `.env` dosyasına `EXPO_PUBLIC_SUPABASE_URL=...` ve
`EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...` yazın.

## Ücretsiz planda bilinmesi gerekenler
- **Duraklatma:** Bir hafta az kullanılan ücretsiz proje duraklatılır (veriler silinmez; Dashboard → projeyi seç →
  **Resume project**). Hac/umre dönemleri arasında bu olmasın diye depodaki `supabase-keepalive.yml` iş akışı 3 günde bir
  küçük bir okuma isteği atar; gizli değerler girilince kendiliğinden çalışır.
- **Anonim giriş sınırı:** Supabase aynı IP adresinden saatte 30 anonim girişe izin verir (Authentication → Rate Limits'ten
  artırılabilir). Her telefon yalnız ilk açılışta bir kez giriş yapar; kalabalık bir grup aynı Wi-Fi'den aynı anda ilk
  kez açarsa sınıra takılabilir.

## Güvenlik özeti (aile/grup konumu)
- Grup yalnız 6 harfli davet koduyla kurulur/katılınır (`create_group`, `join_group` işlevleri); tabloya doğrudan ekleme yok.
- Bir üyenin konumunu yalnız aynı gruptakiler okur; herkes yalnız kendi satırını günceller, grubu ve sahibi değiştiremez.
- Konum geçmişi tutulmaz (satır üzerine yazılır); paylaşım kapatılınca son konum da silinir.
- Grup en çok 30 kişi; bir kişi günde en çok 10 grup kurabilir.
- Bu kurallar yerel bir PostgreSQL 16 üzerinde Supabase rolleri taklit edilerek denendi (üye olmayan göremez, yanlış kod
  reddedilir, başkasının satırı değişmez, grup kimliği değiştirilemez, oturumsuz kullanıcı grup kuramaz).
