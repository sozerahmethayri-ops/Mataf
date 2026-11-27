-- Supabase RLS kurallarını yerel PostgreSQL'de (16) denemek için.
-- Kullanım (boş veritabanı):
--   createdb mataf_test
--   psql -d mataf_test -f tools/supabase-test/stub-eski-proje.sql -f supabase/schema.sql
--   psql -d mataf_test -f tools/supabase-test/reports_test.sql -f tools/supabase-test/group_test.sql
-- stub-eski-proje.sql: 30 Mayıs 2026'dan önce açılan projeler (tablolar Data API'ye kendiliğinden açık).
-- stub-yeni-proje.sql: sonra açılanlar (tablolara yetki yok; schema.sql'deki açık grant satırları gerekir).
-- Supabase ortamının küçük taklidi: roller, auth.uid(), yayın
create role anon nologin;
create role authenticated nologin;
create schema auth;
create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
grant usage on schema auth to anon, authenticated;
grant usage on schema public to anon, authenticated;
alter default privileges in schema public grant all on tables to anon, authenticated;
alter default privileges in schema public grant all on functions to anon, authenticated;
create publication supabase_realtime;
