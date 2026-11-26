// Yerlerim: bulunduğunuz yeri tek dokunuşla kaydedin (Mina'daki çadır, buluşma noktası, otopark…), sonra haritada
// görün, yürüyüş rotasıyla dönün ya da konumu WhatsApp'la paylaşın. Kayıtlar yalnız bu telefonda.
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Alert, Linking, Platform, Pressable, ScrollView, Share, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon, type IconName } from '@/components/Icon';
import { OnlineMap } from '@/components/OnlineMap';
import type { PlainPin } from '@/components/PlainMap';
import { Btn, Card, Header, IconBtn, SectionTitle, T } from '@/components/ui';
import { C, fs } from '@/constants/theme';
import type { T3 } from '@/data/umre';
import { pick, useI18n } from '@/i18n';
import { getJson } from '@/services/cache';
import { useLocation } from '@/services/location';
import { directionsUrl } from '@/services/mosques';
import { shareLink, useMyPlaces, type MyPlace, type PlaceKind } from '@/services/myPlaces';
import { fmtMinutes, meters, osrmUrl, parseOsrm, roughRoute, type StreetRoute } from '@/services/transport';

type Lang = 'tr' | 'en' | 'ar';
const L = {
  title: { tr: 'Yerlerim', en: 'My places', ar: 'أماكني' },
  sub: { tr: 'Çadırınız, buluşma noktanız, otoparkınız', en: 'Your tent, meeting point, parking', ar: 'خيمتك ونقطة اللقاء والموقف' },
  save: { tr: 'Bulunduğum yeri kaydet', en: 'Save where I am', ar: 'احفظ مكاني الحالي' },
  name: { tr: 'Ad (ör. Mina çadırı)', en: 'Name (e.g. Mina tent)', ar: 'الاسم (مثل: خيمة منى)' },
  note: { tr: 'Not (ör. çadır 34/B, kapı 12) — isteğe bağlı', en: 'Note (e.g. tent 34/B, gate 12) — optional', ar: 'ملاحظة (اختياري)' },
  ok: { tr: 'Kaydet', en: 'Save', ar: 'حفظ' },
  cancel: { tr: 'Vazgeç', en: 'Cancel', ar: 'إلغاء' },
  waitLoc: { tr: 'Konum bekleniyor…', en: 'Waiting for location…', ar: 'في انتظار الموقع…' },
  weak: { tr: 'Konum zayıf (±{m} m); açık alanda biraz bekleyip kaydedin.', en: 'Weak location (±{m} m); wait a moment in the open.', ar: 'الموقع ضعيف (±{m} م)' },
  empty: { tr: 'Henüz kayıtlı yer yok. Çadırınızda, buluşma noktanızda ya da aracınızın yanındayken “Bulunduğum yeri kaydet”e dokunun.', en: 'No places yet. At your tent, meeting point or car, tap “Save where I am”.', ar: 'لا أماكن بعد. اضغط «احفظ مكاني الحالي» عند خيمتك أو نقطة اللقاء.' },
  walk: { tr: 'yürüyerek', en: 'on foot', ar: 'مشيًا' },
  approx: { tr: 'yaklaşık', en: 'approximate', ar: 'تقريبي' },
  open: { tr: 'Harita uygulamasında aç', en: 'Open in maps', ar: 'افتح في الخرائط' },
  share: { tr: 'Konumu paylaş', en: 'Share location', ar: 'شارك الموقع' },
  del: { tr: 'Sil', en: 'Delete', ar: 'حذف' },
  delQ: { tr: '“{n}” silinsin mi?', en: 'Delete “{n}”?', ar: 'حذف «{n}»؟' },
  hotel: { tr: 'Otelim', en: 'My hotel', ar: 'فندقي' },
  hotelSub: { tr: 'Otel, oda ve şoför kartı ayrı ekranda', en: 'Hotel, room and driver card on their own screen', ar: 'الفندق في شاشة منفصلة' },
  saved: { tr: 'Kaydedildi', en: 'Saved', ar: 'تم الحفظ' },
  here: { tr: 'Buradasınız', en: 'You are here', ar: 'أنت هنا' },
} satisfies Record<string, T3>;

const QUICK: { tr: string; en: string; ar: string }[] = [
  { tr: 'Çadırım', en: 'My tent', ar: 'خيمتي' },
  { tr: 'Buluşma noktası', en: 'Meeting point', ar: 'نقطة اللقاء' },
  { tr: 'Kafile otobüsü', en: 'Group bus', ar: 'حافلة المجموعة' },
  { tr: 'Otopark', en: 'Parking', ar: 'الموقف' },
];
const KIND: Record<PlaceKind, { icon: IconName; color: string }> = {
  tent: { icon: 'home', color: '#C2410C' },
  meet: { icon: 'users', color: '#16A34A' },
  car: { icon: 'bus', color: '#9333EA' },
  pin: { icon: 'pin', color: '#0E7490' },
};
const fmtDist = (m: number) => (m < 1000 ? `${Math.round(m / 10) * 10} m` : `${(m / 1000).toFixed(1).replace('.', ',')} km`);

export default function MyPlacesScreen() {
  const { lang } = useI18n();
  const lg = lang as Lang;
  const insets = useSafeAreaInsets();
  const { id: focusId } = useLocalSearchParams<{ id?: string }>();
  const { places, add, remove } = useMyPlaces();
  const { fix } = useLocation();
  const here = useMemo(() => (fix ? { lat: fix.lat, lng: fix.lng } : null), [fix]);
  const [sel, setSel] = useState<string | null>(focusId ?? null);
  const [form, setForm] = useState(false);
  const [name, setName] = useState('');
  const [note, setNote] = useState('');

  const selP = places.find((p) => p.id === sel) ?? null;
  const pins: PlainPin[] = places.map((p) => ({ id: p.id, lat: p.lat, lng: p.lng, color: KIND[p.kind].color, label: p.name, big: p.id === sel }));

  // Seçilen yere yürüyüş rotası (sunucuya ulaşılamazsa düz çizgi)
  const [route, setRoute] = useState<{ key: string; r: StreetRoute } | null>(null);
  const routeKey = selP && here ? `${here.lat.toFixed(4)},${here.lng.toFixed(4)}>${selP.id}` : '';
  useEffect(() => {
    if (!selP || !here) return;
    let alive = true;
    const to = { lat: selP.lat, lng: selP.lng };
    getJson<Parameters<typeof parseOsrm>[0]>(osrmUrl(here, to, 'foot'))
      .then((j) => parseOsrm(j) ?? roughRoute(here, to, 'foot'))
      .catch(() => roughRoute(here, to, 'foot'))
      .then((r) => alive && setRoute({ key: routeKey, r }));
    return () => { alive = false; };
  }, [routeKey]); // eslint-disable-line react-hooks/exhaustive-deps
  const r = route && route.key === routeKey ? route.r : null;

  const doSave = () => {
    if (!fix) return;
    const n = name.trim() || pick(QUICK[0], lg);
    const p = add({ name: n, note, lat: fix.lat, lng: fix.lng });
    setForm(false); setName(''); setNote(''); setSel(p.id);
  };
  const share = (p: MyPlace) => Share.share({ message: `${p.name}${p.note ? ` (${p.note})` : ''}\n${shareLink(p)}` }).catch(() => undefined);
  const del = (p: MyPlace) => Alert.alert(pick(L.delQ, lg).replace('{n}', p.name), '', [
    { text: pick(L.cancel, lg), style: 'cancel' },
    { text: pick(L.del, lg), style: 'destructive', onPress: () => { remove(p.id); if (sel === p.id) setSel(null); } },
  ]);

  const weak = fix && (fix.accuracy ?? 0) > 35;
  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <View style={{ paddingTop: insets.top, paddingHorizontal: 16 }}>
        <Header back title={pick(L.title, lg)} subtitle={pick(L.sub, lg)} />
      </View>
      <View style={{ height: 260 }}>
        <OnlineMap pins={pins} user={here} selectedId={sel ?? undefined} onPin={(id) => setSel(id === sel ? null : id)} fitUser
          lines={r ? [{ coords: r.coords, color: C.route, width: 6, dashed: r.approximate }] : []}
          fitKey={`${places.length}:${sel ?? ''}`} fitTo={selP && here ? [here, { lat: selP.lat, lng: selP.lng }] : places.length ? places.map((p) => ({ lat: p.lat, lng: p.lng })) : undefined}
          center={here ?? { lat: 21.4225, lng: 39.8262 }} padding={{ top: 30, bottom: 30, left: 30, right: 30 }} />
      </View>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: insets.bottom + 24 }} keyboardShouldPersistTaps="handled">
        {!form ? (
          <Btn title={fix ? pick(L.save, lg) : pick(L.waitLoc, lg)} icon="pin" disabled={!fix} onPress={() => setForm(true)} />
        ) : (
          <Card style={{ gap: 10 }}>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
              {QUICK.map((q) => {
                const v = pick(q, lg);
                const on = name === v;
                return (
                  <Pressable key={q.tr} onPress={() => setName(v)} accessibilityRole="button"
                    style={{ height: 32, paddingHorizontal: 12, borderRadius: 16, justifyContent: 'center', backgroundColor: on ? C.accentTint : C.surface }}>
                    <Text style={{ fontSize: fs(13), fontWeight: on ? '700' : '500', color: on ? C.accent : C.ink2 }}>{v}</Text>
                  </Pressable>
                );
              })}
            </View>
            <TextInput value={name} onChangeText={setName} placeholder={pick(L.name, lg)} placeholderTextColor={C.muted} maxLength={60}
              style={{ height: 46, borderRadius: 14, borderWidth: 1, borderColor: C.border, paddingHorizontal: 14, fontSize: fs(15), color: C.ink }} />
            <TextInput value={note} onChangeText={setNote} placeholder={pick(L.note, lg)} placeholderTextColor={C.muted} maxLength={120}
              style={{ height: 46, borderRadius: 14, borderWidth: 1, borderColor: C.border, paddingHorizontal: 14, fontSize: fs(15), color: C.ink }} />
            {weak && <Text style={[T.small, { color: C.limited }]}>{pick(L.weak, lg).replace('{m}', String(Math.round(fix?.accuracy ?? 0)))}</Text>}
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <Btn title={pick(L.cancel, lg)} kind="secondary" style={{ flex: 1 }} onPress={() => setForm(false)} />
              <Btn title={pick(L.ok, lg)} icon="check" style={{ flex: 1 }} disabled={!fix} onPress={doSave} />
            </View>
          </Card>
        )}

        {selP && (
          <Card style={{ gap: 10, borderWidth: 1, borderColor: C.accent }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Icon name={KIND[selP.kind].icon} size={22} color={KIND[selP.kind].color} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: fs(17), fontWeight: '700', color: C.ink }}>{selP.name}</Text>
                {!!selP.note && <Text style={T.small}>{selP.note}</Text>}
              </View>
              <IconBtn name="close" label="✕" size={36} tint={C.surface} onPress={() => setSel(null)} />
            </View>
            {here && (
              <Text style={{ fontSize: fs(15), fontWeight: '700', color: C.accent }}>
                {r ? `${fmtDist(r.meters)} · ${fmtMinutes(Math.max(1, Math.round(r.seconds / 60)), lg)} ${pick(L.walk, lg)}${r.approximate ? ` (${pick(L.approx, lg)})` : ''}` : fmtDist(meters(here, selP))}
              </Text>
            )}
            <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
              <Btn title={pick(L.open, lg)} icon="nav" kind="secondary" onPress={() => Linking.openURL(directionsUrl({ lat: selP.lat, lng: selP.lng }, Platform.OS))} />
              <Btn title={pick(L.share, lg)} icon="share" kind="secondary" onPress={() => share(selP)} />
              <Btn title={pick(L.del, lg)} icon="trash" kind="secondary" onPress={() => del(selP)} />
            </View>
          </Card>
        )}

        <SectionTitle>{pick(L.title, lg)}</SectionTitle>
        <Pressable onPress={() => router.push('/otel')} accessibilityRole="button"
          style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: C.border, opacity: pressed ? 0.7 : 1 })}>
          <Icon name="hotel" size={20} color={C.accent} />
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: fs(15), fontWeight: '600', color: C.ink }}>{pick(L.hotel, lg)}</Text>
            <Text style={T.small}>{pick(L.hotelSub, lg)}</Text>
          </View>
          <Icon name="chevron" size={16} color={C.muted} />
        </Pressable>
        {places.length === 0 && <Text style={[T.small, { paddingVertical: 6 }]}>{pick(L.empty, lg)}</Text>}
        {places.map((p) => (
          <Pressable key={p.id} onPress={() => setSel(p.id)} onLongPress={() => del(p)} accessibilityRole="button"
            style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: C.border, opacity: pressed ? 0.7 : 1 })}>
            <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: C.surface, alignItems: 'center', justifyContent: 'center' }}>
              <Icon name={KIND[p.kind].icon} size={18} color={KIND[p.kind].color} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: fs(15), fontWeight: '600', color: C.ink }} numberOfLines={1}>{p.name}</Text>
              <Text style={T.small} numberOfLines={1}>{[p.note, new Intl.DateTimeFormat(lang, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(p.at))].filter(Boolean).join(' · ')}</Text>
            </View>
            {here && <Text style={{ fontSize: fs(13), fontWeight: '700', color: C.ink2 }}>{fmtDist(meters(here, p))}</Text>}
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}
