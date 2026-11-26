# Sunucu kurulumu (Supabase): aile/grup konumu ve canlı kapı bildirimleri

Uygulama sunucusuz da çalışır; bu durumda aile/grup konumu yalnız **önizleme** (bu cihazda, örnek üyelerle),
kapı bildirimleri de **yerel demo** olur. Gerçek kullanım için ücretsiz bir Supabase projesi yeter.

## 1. Proje
1. supabase.com → oturum aç → **New project**. Ad: `mataf`, bölge: **Frankfurt (eu-central-1)**, veritabanı şifresini bir yere not edin.
2. Proje açılınca **SQL Editor** → **New query** → bu depodaki `supabase/schema.sql` dosyasının tamamını yapıştırıp **Run**.
   Hata vermemeli (aynı betiği ikinci kez çalıştırmak da sorun çıkarmaz; yalnız `alter publication` satırları "zaten var" diyebilir).
3. **Authentication → Sign In / Providers** → **Allow anonymous sign-ins** açık olsun. (Kullanıcılar e-posta vermeden, cihaz kimliğiyle girer.)

## 2. Anahtarlar
**Project Settings → Data API** (ya da **API Keys**) sayfasından:
- **Project URL** (ör. `https://abcd1234.supabase.co`)
- **anon public** anahtarı (`eyJ...` ile başlar; herkese açık anahtardır, veriyi satır güvenliği (RLS) korur)

**service_role** anahtarını kimseyle paylaşmayın, uygulamaya koymayın.

## 3. Uygulamaya bağlama
GitHub deposunda **Settings → Secrets and variables → Actions → New repository secret**:
- `SUPABASE_URL` = Project URL
- `SUPABASE_ANON_KEY` = anon public anahtarı

Sonraki derlemede (APK, web) uygulama sunucuya bağlanır. Yerelde denemek için `.env` dosyasına
`EXPO_PUBLIC_SUPABASE_URL=...` ve `EXPO_PUBLIC_SUPABASE_ANON_KEY=...` yazın.

## Güvenlik özeti (aile/grup konumu)
- Grup yalnız 6 harfli davet koduyla kurulur/katılınır (`create_group`, `join_group` işlevleri); tabloya doğrudan ekleme yok.
- Bir üyenin konumunu yalnız aynı gruptakiler okur; herkes yalnız kendi satırını günceller, grubu ve sahibi değiştiremez.
- Konum geçmişi tutulmaz (satır üzerine yazılır); paylaşım kapatılınca son konum da silinir.
- Grup en çok 30 kişi; bir kişi günde en çok 10 grup kurabilir.
- Bu kurallar yerel bir PostgreSQL 16 üzerinde Supabase rolleri taklit edilerek denendi (üye olmayan göremez, yanlış kod reddedilir, başkasının satırı değişmez, anonim rol grup kuramaz).
