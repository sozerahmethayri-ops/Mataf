-- MATAF canlı bildirim sunucusu (Supabase / PostgreSQL)
-- Supabase SQL Editor'da çalıştırın. Ardından Authentication > Anonymous sign-ins'i açın.

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
