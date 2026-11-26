// Aile / grup konumu: grup kur ya da davet koduyla katıl; üyeler haritada ve listede (ne kadar önce, ne kadar
// uzakta), seçilen üyeye yürüyüş rotası, paylaşımı aç/kapat, davet kodunu paylaş, gruptan çık.
// Sunucu yapılandırılmadıysa yalnız bu cihazda çalışan önizleme kullanılabilir.
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Linking, Platform, Pressable, ScrollView, Share, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/Icon';
import { OnlineMap } from '@/components/OnlineMap';
import type { PlainPin } from '@/components/PlainMap';
import { Btn, Card, IconBtn, SectionTitle, T, Toggle } from '@/components/ui';
import { C, fs } from '@/constants/theme';
import type { T3 } from '@/data/umre';
import { pick, useI18n } from '@/i18n';
import { getJson } from '@/services/cache';
import { groupBackend } from '@/services/group';
import { useGroup } from '@/services/GroupContext';
import { freshness, inviteText, isValidCode, metersBetween, normalizeCode, sortMembers, type GroupMember } from '@/services/groupLogic';
import { useLocation } from '@/services/location';
import { directionsUrl } from '@/services/mosques';
import { fmtMinutes, osrmUrl, parseOsrm, roughRoute, type StreetRoute } from '@/services/transport';

type Lang = 'tr' | 'en' | 'ar';
const nowMs = () => Date.now();

const L = {
  title: { tr: 'Aile ve grup konumu', en: 'Family & group location', ar: 'موقع العائلة والمجموعة' },
  sub: { tr: 'Kalabalıkta birbirinizi kaybetmeyin', en: 'Don’t lose each other in the crowd', ar: 'لا تفقدوا بعضكم في الزحام' },
  noServer: { tr: 'Gerçek grup için sunucu henüz bağlanmadı. Şimdilik yalnız bu cihazda çalışan önizlemeyi deneyebilirsiniz.', en: 'The server for real groups is not connected yet. For now you can try a preview that runs only on this device.', ar: 'لم يتم ربط الخادم بعد. يمكنك تجربة معاينة على هذا الجهاز فقط.' },
  create: { tr: 'Grup kur', en: 'Create a group', ar: 'أنشئ مجموعة' },
  join: { tr: 'Gruba katıl', en: 'Join a group', ar: 'انضم إلى مجموعة' },
  groupName: { tr: 'Grup adı (ör. Ailem)', en: 'Group name (e.g. My family)', ar: 'اسم المجموعة' },
  myName: { tr: 'Adınız (diğerleri böyle görecek)', en: 'Your name (as others will see it)', ar: 'اسمك' },
  code: { tr: 'Davet kodu (6 harf)', en: 'Invite code (6 characters)', ar: 'رمز الدعوة' },
  preview: { tr: 'Önizlemeyi dene', en: 'Try the preview', ar: 'جرّب المعاينة' },
  previewTag: { tr: 'ÖNİZLEME · örnek üyeler, yalnız bu cihaz', en: 'PREVIEW · sample members, this device only', ar: 'معاينة · أعضاء تجريبيون' },
  invite: { tr: 'Davet kodu', en: 'Invite code', ar: 'رمز الدعوة' },
  shareCode: { tr: 'Kodu paylaş', en: 'Share code', ar: 'مشاركة الرمز' },
  sharing: { tr: 'Konumumu bu grupla paylaş', en: 'Share my location with this group', ar: 'شارك موقعي مع المجموعة' },
  sharingSub: { tr: 'Uygulama açıkken paylaşılır; geçmiş tutulmaz. Kapatınca son konumunuz da silinir.', en: 'Shared while the app is open; no history is kept. Turning it off also removes your last position.', ar: 'تتم المشاركة أثناء فتح التطبيق؛ لا يُحفظ سجل.' },
  members: { tr: 'Üyeler', en: 'Members', ar: 'الأعضاء' },
  me: { tr: 'Ben', en: 'Me', ar: 'أنا' },
  live: { tr: 'şimdi', en: 'now', ar: 'الآن' },
  ago: { tr: '{n} dk önce', en: '{n} min ago', ar: 'قبل {n} د' },
  agoH: { tr: '{n} sa önce', en: '{n} h ago', ar: 'قبل {n} س' },
  noPos: { tr: 'konum yok', en: 'no location', ar: 'لا موقع' },
  off: { tr: 'paylaşmıyor', en: 'not sharing', ar: 'لا يشارك' },
  route: { tr: 'Yürüyüş', en: 'Walk', ar: 'مشي' },
  open: { tr: 'Harita uygulamasında aç', en: 'Open in maps app', ar: 'افتح في الخرائط' },
  leave: { tr: 'Gruptan çık', en: 'Leave group', ar: 'غادر المجموعة' },
  leaveQ: { tr: 'Gruptan çıkılsın mı? Konumunuz artık paylaşılmaz.', en: 'Leave the group? Your location will no longer be shared.', ar: 'مغادرة المجموعة؟' },
  cancel: { tr: 'Vazgeç', en: 'Cancel', ar: 'إلغاء' },
  err: { tr: 'Olmadı', en: 'Failed', ar: 'فشل' },
  privacy: { tr: 'Konumunuzu yalnız bu gruptakiler görür. Kodu yalnız tanıdıklarınızla paylaşın.', en: 'Only members of this group see your location. Share the code only with people you know.', ar: 'لا يرى موقعك إلا أعضاء المجموعة.' },
  sent: { tr: 'Son gönderim: {t}', en: 'Last sent: {t}', ar: 'آخر إرسال: {t}' },
} satisfies Record<string, T3>;

function agoText(at: number | null | undefined, now: number, lg: Lang) {
  if (!at) return pick(L.noPos, lg);
  const m = Math.round((now - at) / 60e3);
  if (m < 2) return pick(L.live, lg);
  if (m < 90) return pick(L.ago, lg).replace('{n}', String(m));
  return pick(L.agoH, lg).replace('{n}', String(Math.round(m / 60)));
}
const dist = (m: number) => (m >= 1000 ? `${(m / 1000).toFixed(1)} km` : `${Math.round(m / 10) * 10} m`);

export default function GrupScreen() {
  const { lang } = useI18n();
  const lg = lang as Lang;
  const insets = useSafeAreaInsets();
  const grp = useGroup();
  const g = grp.st.group;

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <View style={{ paddingTop: insets.top + 6, paddingHorizontal: 12, paddingBottom: 8, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <IconBtn name="back" label="Geri" onPress={() => router.back()} />
        <View style={{ flex: 1 }}>
          <Text style={T.h2} numberOfLines={1}>{g ? g.name : pick(L.title, lg)}</Text>
          <Text style={T.small} numberOfLines={1}>{g ? pick(L.title, lg) : pick(L.sub, lg)}</Text>
        </View>
      </View>
      {grp.ready && (g ? <GroupView lg={lg} /> : <Setup lg={lg} />)}
    </View>
  );
}

function Setup({ lg }: { lg: Lang }) {
  const insets = useSafeAreaInsets();
  const grp = useGroup();
  const [groupName, setGroupName] = useState('');
  const [myName, setMyName] = useState(grp.st.name);
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    try { await fn(); } catch (e) { Alert.alert(pick(L.err, lg), e instanceof Error ? e.message : String(e)); }
    setBusy(false);
  };
  const nameOk = myName.trim().length >= 2;
  const input = { height: 46, borderRadius: 12, borderWidth: 1, borderColor: C.borderStrong, paddingHorizontal: 12, color: C.ink, fontSize: fs(15) } as const;
  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: insets.bottom + 24 }} keyboardShouldPersistTaps="handled">
      {!grp.server && (
        <Card tint={C.limitedTint} style={{ gap: 8 }}>
          <Text style={[T.body, { color: C.ink }]}>{pick(L.noServer, lg)}</Text>
          <Btn title={pick(L.preview, lg)} kind="secondary" icon="users" disabled={busy}
            onPress={() => run(() => grp.create('Ailem', myName.trim() || 'Ben', true))} />
        </Card>
      )}
      <TextInput value={myName} onChangeText={setMyName} placeholder={pick(L.myName, lg)} placeholderTextColor={C.muted} style={input} maxLength={30} />
      <Card style={{ gap: 10 }}>
        <Text style={T.h3}>{pick(L.create, lg)}</Text>
        <TextInput value={groupName} onChangeText={setGroupName} placeholder={pick(L.groupName, lg)} placeholderTextColor={C.muted} style={input} maxLength={40} />
        <Btn title={pick(L.create, lg)} icon="plus" disabled={busy || !nameOk || groupName.trim().length < 2 || !grp.server}
          onPress={() => run(() => grp.create(groupName, myName))} />
      </Card>
      <Card style={{ gap: 10 }}>
        <Text style={T.h3}>{pick(L.join, lg)}</Text>
        <TextInput value={code} onChangeText={(v) => setCode(normalizeCode(v))} placeholder={pick(L.code, lg)} placeholderTextColor={C.muted}
          autoCapitalize="characters" autoCorrect={false} style={[input, code ? { letterSpacing: 4, fontWeight: '700' } : null]} maxLength={6} />
        <Btn title={pick(L.join, lg)} icon="users" disabled={busy || !nameOk || !isValidCode(code) || !grp.server}
          onPress={() => run(() => grp.join(code, myName))} />
      </Card>
      <Text style={T.small}>{pick(L.privacy, lg)}</Text>
    </ScrollView>
  );
}

function GroupView({ lg }: { lg: Lang }) {
  const insets = useSafeAreaInsets();
  const grp = useGroup();
  const g = grp.st.group!;
  const { fix } = useLocation();
  const here = useMemo(() => (fix ? { lat: fix.lat, lng: fix.lng } : null), [fix]);
  const [list, setList] = useState<GroupMember[]>([]);
  const [now, setNow] = useState(nowMs);
  const [sel, setSel] = useState<string | null>(null);

  // Ekran öndeyken: canlı abonelik + 20 sn'de bir yenileme (abonelik kaçarsa)
  const reload = useRef<() => void>(() => undefined);
  useFocusEffect(useCallback(() => {
    const be = groupBackend(g.kind);
    let alive = true;
    const load = () => { be.members(g).then((m) => { if (alive) { setList(m); setNow(nowMs()); } }).catch(() => undefined); };
    reload.current = load;
    load();
    const unsub = be.subscribe(g, load);
    const id = setInterval(load, 20000);
    return () => { alive = false; reload.current = () => undefined; unsub(); clearInterval(id); };
  }, [g]));
  // Kendi konumum gönderilince listeyi de tazele (kendi satırım "konum yok" kalmasın)
  useEffect(() => { reload.current(); }, [grp.lastSent]);
  // Önizlemede kendi konumumu hemen göster
  useEffect(() => {
    if (g.kind === 'demo' && here && grp.st.sharing) groupBackend('demo').update(g, here, true).then(() => reload.current()).catch(() => undefined);
  }, [g, here, grp.st.sharing]);

  const sorted = useMemo(() => sortMembers(list, here), [list, here]);
  const others = sorted.filter((m) => !m.me && m.lat != null && m.lng != null);
  const pins: PlainPin[] = others.map((m) => ({ id: m.userId, lat: m.lat!, lng: m.lng!, color: m.color, label: m.name, big: true }));
  const selM = sorted.find((m) => m.userId === sel && m.lat != null) ?? null;

  const [route, setRoute] = useState<{ key: string; r: StreetRoute } | null>(null);
  const routeKey = selM && here ? `${here.lat.toFixed(4)},${here.lng.toFixed(4)}>${selM.lat!.toFixed(4)},${selM.lng!.toFixed(4)}` : '';
  useEffect(() => {
    if (!selM || !here) return;
    let alive = true;
    const to = { lat: selM.lat!, lng: selM.lng! };
    getJson<Parameters<typeof parseOsrm>[0]>(osrmUrl(here, to, 'foot'))
      .then((j) => parseOsrm(j) ?? roughRoute(here, to, 'foot'))
      .catch(() => roughRoute(here, to, 'foot'))
      .then((r) => alive && setRoute({ key: routeKey, r }));
    return () => { alive = false; };
  }, [routeKey]); // eslint-disable-line react-hooks/exhaustive-deps
  const r = route && route.key === routeKey ? route.r : null;

  const share = () => Share.share({ message: inviteText(g.code, g.name, lg) }).catch(() => undefined);
  const leave = () => Alert.alert(pick(L.leave, lg), pick(L.leaveQ, lg), [
    { text: pick(L.cancel, lg), style: 'cancel' },
    { text: pick(L.leave, lg), style: 'destructive', onPress: () => { grp.leave().catch(() => undefined); } },
  ]);

  return (
    <View style={{ flex: 1 }}>
      <View style={{ height: 300 }}>
        <OnlineMap pins={pins} user={here} selectedId={sel ?? undefined} onPin={(id) => setSel(id)} fitUser
          lines={r ? [{ coords: r.coords, color: C.route, width: 6, dashed: r.approximate }] : []}
          fitKey={`${others.length}:${sel ?? ''}`} fitTo={selM && here ? [here, { lat: selM.lat!, lng: selM.lng! }] : undefined}
          center={here ?? { lat: 21.4225, lng: 39.8262 }} padding={{ top: 30, bottom: 30, left: 30, right: 30 }} />
      </View>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: insets.bottom + 24 }}>
        {g.kind === 'demo' && <Text style={{ fontSize: fs(11.5), fontWeight: '800', color: C.limited, letterSpacing: 0.4 }}>{pick(L.previewTag, lg)}</Text>}
        <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={{ flex: 1 }}>
            <Text style={T.small}>{pick(L.invite, lg)}</Text>
            <Text style={{ fontSize: fs(24), fontWeight: '800', color: C.ink, letterSpacing: 4 }} selectable>{g.code}</Text>
          </View>
          <Btn title={pick(L.shareCode, lg)} icon="share" kind="secondary" onPress={share} />
        </Card>
        <Card style={{ gap: 6 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Text style={[T.body, { flex: 1, fontWeight: '600' }]}>{pick(L.sharing, lg)}</Text>
            <Toggle value={grp.st.sharing} onChange={grp.setSharing} label={pick(L.sharing, lg)} />
          </View>
          <Text style={T.small}>{pick(L.sharingSub, lg)}</Text>
          {grp.lastSent && <Text style={[T.small, { color: C.muted }]}>{pick(L.sent, lg).replace('{t}', agoText(grp.lastSent, now, lg))}</Text>}
          {grp.error && <Text style={[T.small, { color: C.closed }]}>{grp.error}</Text>}
        </Card>

        <SectionTitle>{pick(L.members, lg)} · {sorted.length}</SectionTitle>
        {sorted.map((m) => {
          const has = m.lat != null && m.lng != null;
          const fr = freshness(m.updatedAt, now);
          const d = has && here && !m.me ? metersBetween(here, { lat: m.lat!, lng: m.lng! }) : null;
          const active = sel === m.userId;
          return (
            <Pressable key={m.userId} onPress={() => has && !m.me && setSel(active ? null : m.userId)} accessibilityRole="button"
              style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 14, borderWidth: active ? 1.5 : 1, borderColor: active ? C.accent : C.border }}>
              <View style={{ width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: m.color }}>
                <Text style={{ color: '#FFFFFF', fontWeight: '800', fontSize: fs(15) }}>{m.name.slice(0, 1).toUpperCase()}</Text>
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={{ fontSize: fs(15), fontWeight: '700', color: C.ink }}>{m.name}{m.me ? ` (${pick(L.me, lg)})` : ''}</Text>
                <Text style={[T.small, { color: fr === 'live' ? C.open : fr === 'recent' ? C.ink2 : C.muted }]}>
                  {!m.sharing ? pick(L.off, lg) : agoText(m.updatedAt, now, lg)}
                  {active && r ? ` · ${pick(L.route, lg)} ${dist(r.meters)}, ${fmtMinutes(Math.max(1, Math.round(r.seconds / 60)), lg)}` : ''}
                </Text>
              </View>
              {d != null && <Text style={{ fontSize: fs(14), fontWeight: '700', color: C.accent }}>{dist(d)}</Text>}
            </Pressable>
          );
        })}
        {selM && (
          <Btn title={pick(L.open, lg)} kind="secondary" icon="nav" onPress={() => Linking.openURL(directionsUrl({ lat: selM.lat!, lng: selM.lng! }, Platform.OS))} />
        )}
        <Text style={T.small}>{pick(L.privacy, lg)}</Text>
        <Pressable onPress={leave} accessibilityRole="button" style={{ alignSelf: 'center', padding: 10, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Icon name="close" size={16} color={C.closed} />
          <Text style={{ fontSize: fs(14), fontWeight: '700', color: C.closed }}>{pick(L.leave, lg)}</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}
