-- MATAF canlı bildirim sunucusu (Supabase / PostgreSQL)
-- Supabase SQL Editor'da çalıştırın. Ardından Authentication > Sign In / Providers > "Allow anonymous sign-ins"'i açın.

create table if not exists public.reports (
  id          uuid primary key default gen_random_uuid(),
  gate_id     text not null,                       -- ör. 'mk-79', 'md-37'
  kind        text not null check (kind in ('report', 'comment')),
  status      text check (status in ('open','closed','crowded','exitOnly','entryOnly','women','noAccess')),
  floor       text check (floor in ('basement','ground','first','roof')),
  comment     text check (char_length(comment) <= 500),
  photo_url   text,
  user_id     uuid not null default auth.uid(),
  user_name   text not null default 'Ziyaretçi',
  country     text,
  lang        text,
  official    boolean not null default false,      -- yalnızca yönetici (service role) true yapabilir
  verified    boolean not null default false,      -- kapıya ≤150 m konumdan gönderildi
  created_at  timestamptz not null default now()
);

create index if not exists reports_gate_time on public.reports (gate_id, created_at desc);

alter table public.reports enable row level security;

-- Açık yetkiler: 30 Mayıs 2026'dan sonra açılan Supabase projelerinde yeni tablolar Data API'ye kendiliğinden
-- açılmaz ("Automatically expose new tables" kapalı); eski projelerde bu satırlar zararsızdır. Satırları RLS süzer.
grant usage on schema public to anon, authenticated;
grant select on public.reports to anon, authenticated;
grant insert on public.reports to authenticated;

-- Herkes son 24 saatin bildirimlerini okuyabilir
create policy "reports read" on public.reports
  for select using (created_at > now() - interval '24 hours');

-- Oturum açmış (anonim dahil) kullanıcı yalnızca kendi adına ve resmî olmayan kayıt ekleyebilir
create policy "reports insert own" on public.reports
  for insert to authenticated
  with check (user_id = auth.uid() and official = false);

-- Spam koruması: aynı kullanıcı aynı kapıya 2 dakikada en fazla 1 kayıt
create or replace function public.reports_rate_limit() returns trigger language plpgsql as $$
begin
  if exists (
    select 1 from public.reports
    where user_id = new.user_id and gate_id = new.gate_id and kind = new.kind
      and created_at > now() - interval '2 minutes'
  ) then
    raise exception 'Çok sık bildirim: lütfen biraz bekleyin';
  end if;
  return new;
end $$;

drop trigger if exists reports_rate_limit on public.reports;
create trigger reports_rate_limit before insert on public.reports
  for each row execute function public.reports_rate_limit();

-- Gerçek zamanlı yayın
alter publication supabase_realtime add table public.reports;

-- Resmî duyuru eklemek (yalnızca sunucu tarafında, service role anahtarıyla):
-- insert into public.reports (gate_id, kind, status, comment, user_id, user_name, official)
-- values ('mk-1', 'report', 'closed', 'Bakım çalışması', '00000000-0000-0000-0000-000000000000', 'Genel Kurum', true);

-- ════════════════════════════════════════════════════════════════════════════
-- Aile / grup konumu (0.9.0)
-- Davet koduyla gruplar; konumu yalnız aynı gruptakiler görür; geçmiş tutulmaz (satır üzerine yazılır).
-- Gerekenler: Authentication > Sign In / Providers > "Allow anonymous sign-ins" açık.
-- ════════════════════════════════════════════════════════════════════════════

create table if not exists public.groups (
  id          uuid primary key default gen_random_uuid(),
  code        text not null unique check (code ~ '^[A-HJ-NP-Z2-9]{6}$'),
  name        text not null check (char_length(name) between 1 and 40),
  created_by  uuid not null default auth.uid(),
  created_at  timestamptz not null default now()
);

create table if not exists public.group_members (
  group_id    uuid not null references public.groups(id) on delete cascade,
  user_id     uuid not null default auth.uid(),
  name        text not null check (char_length(name) between 1 and 30),
  color       text not null default '#C2410C' check (color ~ '^#[0-9A-Fa-f]{6}$'),
  sharing     boolean not null default true,
  lat         double precision check (lat between -90 and 90),
  lng         double precision check (lng between -180 and 180),
  accuracy    real check (accuracy >= 0),
  updated_at  timestamptz,
  joined_at   timestamptz not null default now(),
  primary key (group_id, user_id)
);

alter table public.groups enable row level security;
alter table public.group_members enable row level security;

-- Üyelik denetimi (RLS içinde kendi tablosuna bakarken döngü olmasın diye security definer)
create or replace function public.is_group_member(g uuid) returns boolean
language sql security definer set search_path = public stable as $$
  select exists (select 1 from public.group_members where group_id = g and user_id = auth.uid());
$$;

drop policy if exists "groups read" on public.groups;
create policy "groups read" on public.groups
  for select to authenticated using (public.is_group_member(id));

drop policy if exists "members read" on public.group_members;
create policy "members read" on public.group_members
  for select to authenticated using (public.is_group_member(group_id));

-- Herkes yalnız kendi satırını günceller (konum, paylaşım, ad) ve gruptan kendisi çıkar
drop policy if exists "members update own" on public.group_members;
create policy "members update own" on public.group_members
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Satırın grubu ve sahibi değiştirilemez: yalnız bu sütunlar güncellenebilir
revoke update on public.group_members from anon, authenticated;
grant update (name, color, sharing, lat, lng, accuracy, updated_at) on public.group_members to authenticated;
-- Okuma ve çıkma (satırları RLS süzer); doğrudan ekleme yetkisi yok, üyelik yalnız işlevlerle
grant select on public.groups to authenticated;
grant select, delete on public.group_members to authenticated;

drop policy if exists "members leave" on public.group_members;
create policy "members leave" on public.group_members
  for delete to authenticated using (user_id = auth.uid());

-- Grup kurma ve katılma yalnız bu işlevlerle (kodu bilmeyen katılamaz; doğrudan insert izni yok)
create or replace function public.create_group(p_name text, p_member text, p_color text)
returns public.groups language plpgsql security definer set search_path = public as $$
declare g public.groups; c text; tries int := 0;
begin
  if auth.uid() is null then raise exception 'Oturum yok'; end if;
  if (select count(*) from public.groups where created_by = auth.uid() and created_at > now() - interval '1 day') >= 10 then
    raise exception 'Bugün çok fazla grup kuruldu';
  end if;
  loop
    c := (select string_agg(substr('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', 1 + floor(random() * 32)::int, 1), '') from generate_series(1, 6));
    begin
      insert into public.groups (code, name, created_by) values (c, p_name, auth.uid()) returning * into g;
      exit;
    exception when unique_violation then
      tries := tries + 1;
      if tries > 5 then raise; end if;
    end;
  end loop;
  insert into public.group_members (group_id, user_id, name, color) values (g.id, auth.uid(), p_member, p_color);
  return g;
end $$;

create or replace function public.join_group(p_code text, p_member text, p_color text)
returns public.groups language plpgsql security definer set search_path = public as $$
declare g public.groups;
begin
  if auth.uid() is null then raise exception 'Oturum yok'; end if;
  select * into g from public.groups where code = upper(p_code);
  if not found then raise exception 'Grup bulunamadı: kodu kontrol edin'; end if;
  if not exists (select 1 from public.group_members where group_id = g.id and user_id = auth.uid())
     and (select count(*) from public.group_members where group_id = g.id) >= 30 then
    raise exception 'Grup dolu (en çok 30 kişi)';
  end if;
  insert into public.group_members (group_id, user_id, name, color) values (g.id, auth.uid(), p_member, p_color)
  on conflict (group_id, user_id) do update set name = excluded.name, color = excluded.color;
  return g;
end $$;

revoke all on function public.create_group(text, text, text) from public, anon;
revoke all on function public.join_group(text, text, text) from public, anon;
revoke all on function public.is_group_member(uuid) from public, anon;
grant execute on function public.create_group(text, text, text) to authenticated;
grant execute on function public.join_group(text, text, text) to authenticated;
grant execute on function public.is_group_member(uuid) to authenticated;

-- Canlı güncelleme
alter publication supabase_realtime add table public.group_members;

-- İsteğe bağlı temizlik (pg_cron açıksa): 24 saatten eski konumları sil
-- select cron.schedule('group-clean', '17 * * * *', $$update public.group_members set lat = null, lng = null, accuracy = null where updated_at < now() - interval '24 hours'$$);
