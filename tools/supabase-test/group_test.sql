-- Aile/grup konumu: grup kurma, davet koduyla katılma, yalnız gruptakilerin okuması, kendi satırını güncelleme.
\set ON_ERROR_STOP 0
set role authenticated;
select set_config('request.jwt.claim.sub', '11111111-1111-1111-1111-111111111111', false);
select code as gcode, id as gid from public.create_group('Ailem', 'Ahmet', '#C2410C') \gset
\echo kod: :gcode
select 'A grup sayısı' as t, count(*) from public.groups;
select 'A üye sayısı' as t, count(*) from public.group_members;
update public.group_members set lat = 21.42, lng = 39.82, accuracy = 8, updated_at = now() where group_id = :'gid' and user_id = auth.uid();
select set_config('request.jwt.claim.sub', '22222222-2222-2222-2222-222222222222', false);
select 'B (üye değil) grup' as t, count(*) from public.groups;
select 'B (üye değil) üye' as t, count(*) from public.group_members;
\echo B doğrudan eklemeyi dener (hata beklenir):
insert into public.group_members (group_id, name) values (:'gid', 'Sızma');
\echo B yanlış kodla katılmayı dener (hata beklenir):
select public.join_group('ZZZZZZ', 'Zeynep', '#2563EB');
select (public.join_group(:'gcode', 'Zeynep', '#2563EB')).name as katildi;
select 'B şimdi üye satırları' as t, count(*), max(lat) as a_lat from public.group_members;
\echo B, A'nın satırını değiştirmeyi dener (0 satır beklenir):
update public.group_members set lat = 0 where user_id = '11111111-1111-1111-1111-111111111111';
\echo B kendi satırının grubunu değiştirmeyi dener (yetki hatası beklenir):
update public.group_members set group_id = gen_random_uuid() where user_id = auth.uid();
\echo B kendi konumunu yazar:
update public.group_members set lat = 21.43, lng = 39.83, updated_at = now() where group_id = :'gid' and user_id = auth.uid();
\echo B gruptan çıkar:
delete from public.group_members where group_id = :'gid' and user_id = auth.uid();
select 'B çıktıktan sonra görünen' as t, count(*) from public.group_members;
reset role;
set role anon;
\echo anon grup kurmayı dener (yetki hatası beklenir):
select public.create_group('x', 'y', '#000000');
reset role;
select 'son durum (yönetici)' as t, count(*) as uyeler, (select count(*) from public.groups) as gruplar from public.group_members;
