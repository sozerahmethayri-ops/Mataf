-- Kapı bildirimleri: anon okur, ekleyemez; oturumlu kullanıcı bildirim ekler ama resmî (official) kayıt ekleyemez, silemez.
\set ON_ERROR_STOP 0
set role anon;
select set_config('request.jwt.claim.sub', '', false);
select 'anon okur' as t, count(*) from public.reports;
\echo anon eklemeyi dener (yetki hatası beklenir):
insert into public.reports (gate_id, kind, status) values ('mk-1', 'report', 'closed');
reset role;
set role authenticated;
select set_config('request.jwt.claim.sub', '33333333-3333-3333-3333-333333333333', false);
insert into public.reports (gate_id, kind, status) values ('mk-1', 'report', 'closed');
select 'kayıt sonrası okunan' as t, count(*) from public.reports;
\echo resmî kayıt eklemeyi dener (RLS hatası beklenir):
insert into public.reports (gate_id, kind, status, official) values ('mk-2', 'report', 'open', true);
\echo silmeyi dener (yetki hatası beklenir):
delete from public.reports;
reset role;
