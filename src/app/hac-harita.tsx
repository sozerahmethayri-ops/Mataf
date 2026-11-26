// Hac yerleri haritası: Arafat (yaklaşık sınır), Mina, Müzdelife, cemreler, Nemire Mescidi, Cebel-i Rahme,
// Meş'ar-i Haram, Hayf Mescidi, Meşâir treni istasyonları, hastaneler ve Harem sınırı. Konumla "Arafat / Harem /
// Mina sınırları içinde misiniz?" denetimi; sınıra yakınken kesin söylemez, tabelalara yönlendirir.
// Veri © OpenStreetMap katkıcıları (ODbL), src/data/osm/hacSites.ts.
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Linking, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/Icon';
import { OnlineMap } from '@/components/OnlineMap';
import type { PlainArea, PlainPin } from '@/components/PlainMap';
import { Btn, Card, Chip, IconBtn, T } from '@/components/ui';
import { C, fs } from '@/constants/theme';
import { ARAFAT_AREA, HAC_PLACES, HARAM_BOUNDARY, JAMARAT_BRIDGE, MINA_AREA, NAMIRA_MOSQUE, type HacPlace, type HacPlaceKind, type LL2 } from '@/data/osm/hacSites';
import type { T3 } from '@/data/umre';
import { pick, useI18n } from '@/i18n';
import { getJson } from '@/services/cache';
import { arafatCheck, haramCheck, minaCheck, type ZoneCheck } from '@/services/hac';
import { useLocation } from '@/services/location';
import { directionsUrl } from '@/services/mosques';
import { fmtMinutes, meters, osrmUrl, parseOsrm, roughRoute, type StreetRoute } from '@/services/transport';

type Lang = 'tr' | 'en' | 'ar';
type Focus = 'hepsi' | 'arafat' | 'muzdelife' | 'mina' | 'cemerat' | 'istasyon' | 'hastane';

const L = {
  title: { tr: 'Hac yerleri', en: 'Hajj sites', ar: 'المشاعر المقدسة' },
  sub: { tr: 'Arafat · Müzdelife · Mina · Cemerat', en: 'Arafat · Muzdalifah · Mina · Jamarat', ar: 'عرفات · مزدلفة · منى · الجمرات' },
  where: { tr: 'Neredesiniz?', en: 'Where are you?', ar: 'أين أنت؟' },
  noFix: { tr: 'Konum bekleniyor…', en: 'Waiting for location…', ar: 'بانتظار الموقع…' },
  denied: { tr: 'Konum izni yok; sınır denetimi için izin verin.', en: 'No location permission; allow it to check the boundaries.', ar: 'لا إذن بالموقع.' },
  acc: { tr: 'GPS hassasiyeti ±{m} m', en: 'GPS accuracy ±{m} m', ar: 'دقة الموقع ±{m} م' },
  inside: { tr: '{z} sınırları içindesiniz (sınıra ~{d})', en: 'You are inside {z} (~{d} to the boundary)', ar: 'أنت داخل {z} (~{d} إلى الحد)' },
  near: { tr: '{z} sınırına çok yakınsınız (~{d}). Tabelalara bakın; emin olmak için içeri doğru ilerleyin.', en: 'You are very close to the {z} boundary (~{d}). Check the signs; move further in to be sure.', ar: 'أنت قريب جدًا من حد {z} (~{d}). انظر إلى اللوحات.' },
  outside: { tr: '{z} dışındasınız (en yakın sınır ~{d})', en: 'You are outside {z} (nearest boundary ~{d})', ar: 'أنت خارج {z} (أقرب حد ~{d})' },
  haram: { tr: 'Harem bölgesi', en: 'the Haram', ar: 'الحرم' },
  approx: { tr: 'Sınırlar OpenStreetMap’ten, yaklaşıktır. Vakfe ve diğer görevler için sahadaki sınır tabelalarını esas alın.', en: 'Boundaries come from OpenStreetMap and are approximate. Rely on the boundary signs on site.', ar: 'الحدود تقريبية من OpenStreetMap؛ اعتمد على اللوحات في الموقع.' },
  route: { tr: 'Yürüyüş rotası', en: 'Walking route', ar: 'مسار المشي' },
  open: { tr: 'Harita uygulamasında aç', en: 'Open in maps app', ar: 'افتح في الخرائط' },
  close: { tr: 'Kapat', en: 'Close', ar: 'إغلاق' },
  legend: { tr: 'Yeşil: Arafat · Mavi: Mina · Kırmızı kesikli: Harem sınırı · Turuncu: Nemire Mescidi', en: 'Green: Arafat · Blue: Mina · Red dashed: Haram boundary · Orange: Namirah Mosque', ar: 'أخضر: عرفات · أزرق: منى · أحمر متقطع: حد الحرم · برتقالي: مسجد نمرة' },
  osm: { tr: '© OpenStreetMap katkıcıları', en: '© OpenStreetMap contributors', ar: '© مساهمو OpenStreetMap' },
} satisfies Record<string, T3>;

const ZONE: Record<'arafat' | 'mina', T3> = {
  arafat: { tr: 'Arafat', en: 'Arafat', ar: 'عرفات' },
  mina: { tr: 'Mina', en: 'Mina', ar: 'منى' },
};

const FOCUS: { id: Focus; label: T3 }[] = [
  { id: 'hepsi', label: { tr: 'Hepsi', en: 'All', ar: 'الكل' } },
  { id: 'arafat', label: { tr: 'Arafat', en: 'Arafat', ar: 'عرفات' } },
  { id: 'muzdelife', label: { tr: 'Müzdelife', en: 'Muzdalifah', ar: 'مزدلفة' } },
  { id: 'mina', label: { tr: 'Mina', en: 'Mina', ar: 'منى' } },
  { id: 'cemerat', label: { tr: 'Cemerat', en: 'Jamarat', ar: 'الجمرات' } },
  { id: 'istasyon', label: { tr: 'Tren', en: 'Train', ar: 'القطار' } },
  { id: 'hastane', label: { tr: 'Hastane', en: 'Hospitals', ar: 'مستشفيات' } },
];

const KIND_COLOR: Record<HacPlaceKind, string> = {
  cemre: '#C2410C', mosque: '#277F4C', mount: '#8B5E34', area: '#0E7490', sign: '#6B7280', station: '#7C3AED', hospital: '#DC2626',
};

const ll = (p: LL2) => ({ lat: p[0], lng: p[1] });
const near = (pl: HacPlace, c: { lat: number; lng: number }, km: number) => meters(pl, c) <= km * 1000;
const CENTER = {
  arafat: { lat: 21.3545, lng: 39.9760 },
  muzdelife: { lat: 21.3860, lng: 39.9120 },
  mina: { lat: 21.4150, lng: 39.8890 },
  cemerat: { lat: 21.4208, lng: 39.8728 },
};

function placesFor(f: Focus): HacPlace[] {
  switch (f) {
    case 'arafat': return HAC_PLACES.filter((p) => near(p, CENTER.arafat, 3.5) && p.kind !== 'hospital');
    case 'muzdelife': return HAC_PLACES.filter((p) => near(p, CENTER.muzdelife, 2.2) && p.kind !== 'hospital');
    case 'mina': return HAC_PLACES.filter((p) => near(p, CENTER.mina, 2.5) && p.kind !== 'hospital');
    case 'cemerat': return HAC_PLACES.filter((p) => p.kind === 'cemre' || p.id === 'istasyon-6024783454' || p.id === 'hayf');
    case 'istasyon': return HAC_PLACES.filter((p) => p.kind === 'station');
    case 'hastane': return HAC_PLACES.filter((p) => p.kind === 'hospital');
    default: return HAC_PLACES.filter((p) => p.kind !== 'hospital' && p.kind !== 'station');
  }
}

const dist = (m: number) => (m >= 1000 ? `${(m / 1000).toFixed(1)} km` : `${Math.round(m / 10) * 10} m`);

function zoneText(z: ZoneCheck, name: string, lg: Lang) {
  const t = z.state === 'inside' ? L.inside : z.state === 'near' ? L.near : L.outside;
  return pick(t, lg).replace('{z}', name).replace('{d}', dist(z.edgeM));
}

export default function HacHaritaScreen() {
  const { lang } = useI18n();
  const lg = lang as Lang;
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ yer?: string }>();
  const [focus, setFocus] = useState<Focus>(() => (FOCUS.some((f) => f.id === params.yer) ? (params.yer as Focus) : 'hepsi'));
  const [sel, setSel] = useState<HacPlace | null>(null);
  const { fix, denied } = useLocation();
  const here = useMemo(() => (fix ? { lat: fix.lat, lng: fix.lng } : null), [fix]);
  const accuracy = fix?.accuracy ?? 0;

  const shown = useMemo(() => placesFor(focus), [focus]);
  const pins: PlainPin[] = useMemo(() => shown.map((p) => ({
    id: p.id, lat: p.lat, lng: p.lng, color: KIND_COLOR[p.kind], label: pick(p.name, lg), big: p.kind === 'area' || p.kind === 'mount',
  })), [shown, lg]);
  const areas: PlainArea[] = useMemo(() => [
    { coords: HARAM_BOUNDARY.map(ll), color: '#DC2626', opacity: 0, dashed: true },
    { coords: ARAFAT_AREA.map(ll), color: '#16A34A', opacity: 0.16 },
    { coords: MINA_AREA.map(ll), color: '#2563EB', opacity: 0.1 },
    { coords: NAMIRA_MOSQUE.map(ll), color: '#EA580C', opacity: 0.35 },
    { coords: JAMARAT_BRIDGE.map(ll), color: '#6B7280', opacity: 0.3, outline: false },
  ], []);

  // Seçilen yere yürüyüş rotası (OSRM; olmazsa düz çizgi)
  const [route, setRoute] = useState<{ key: string; r: StreetRoute } | null>(null);
  const fromKey = here ? `${here.lat.toFixed(4)},${here.lng.toFixed(4)}` : '';
  const routeKey = sel && here ? `${fromKey}>${sel.id}` : '';
  useEffect(() => {
    if (!sel || !here) return;
    let alive = true;
    const key = `${fromKey}>${sel.id}`;
    const to = { lat: sel.lat, lng: sel.lng };
    getJson<Parameters<typeof parseOsrm>[0]>(osrmUrl(here, to, 'foot'))
      .then((j) => parseOsrm(j) ?? roughRoute(here, to, 'foot'))
      .catch(() => roughRoute(here, to, 'foot'))
      .then((r) => alive && setRoute({ key, r }));
    return () => { alive = false; };
  }, [routeKey]); // eslint-disable-line react-hooks/exhaustive-deps
  const r = route && route.key === routeKey ? route.r : null;
  const lines = r ? [{ coords: r.coords, color: C.route, width: 6, dashed: r.approximate }] : [];

  const fitTo = useMemo(() => {
    if (focus === 'arafat') return ARAFAT_AREA.map(ll);
    if (focus === 'mina') return MINA_AREA.map(ll);
    return shown.map((p) => ({ lat: p.lat, lng: p.lng }));
  }, [focus, shown]);

  const z = here ? { arafat: arafatCheck(here, accuracy), haram: haramCheck(here, accuracy), mina: minaCheck(here, accuracy) } : null;

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <View style={{ paddingTop: insets.top + 6, paddingHorizontal: 12, paddingBottom: 8, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <IconBtn name="back" label="Geri" onPress={() => router.back()} />
        <View style={{ flex: 1 }}>
          <Text style={T.h2} numberOfLines={1}>{pick(L.title, lg)}</Text>
          <Text style={T.small} numberOfLines={1}>{pick(L.sub, lg)}</Text>
        </View>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }} contentContainerStyle={{ gap: 8, paddingHorizontal: 12, paddingBottom: 8 }}>
        {FOCUS.map((f) => <Chip key={f.id} label={pick(f.label, lg)} active={focus === f.id} onPress={() => { setFocus(f.id); setSel(null); }} />)}
      </ScrollView>
      <View style={{ flex: 1 }}>
        <OnlineMap pins={pins} lines={lines} areas={areas} user={here} selectedId={sel?.id} fitTo={fitTo} fitKey={focus}
          onPin={(id) => setSel(HAC_PLACES.find((p) => p.id === id) ?? null)} center={CENTER.mina}
          padding={{ top: 30, bottom: 40, left: 30, right: 30 }} />
      </View>
      <View style={{ padding: 12, paddingBottom: insets.bottom + 12, gap: 8, borderTopWidth: 1, borderColor: C.border, backgroundColor: C.bg }}>
        {sel ? (
          <Card style={{ gap: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: KIND_COLOR[sel.kind] }} />
              <Text style={{ flex: 1, fontSize: fs(16), fontWeight: '700', color: C.ink }}>{pick(sel.name, lg)}</Text>
              <Pressable onPress={() => setSel(null)} accessibilityRole="button" accessibilityLabel={pick(L.close, lg)} hitSlop={10}>
                <Icon name="close" size={18} color={C.muted} />
              </Pressable>
            </View>
            {here && (
              <Text style={T.small}>
                {pick(L.route, lg)}: {r ? `${dist(r.meters)} · ${fmtMinutes(Math.max(1, Math.round(r.seconds / 60)), lg)}` : dist(meters(here, sel))}
              </Text>
            )}
            <Btn title={pick(L.open, lg)} kind="secondary" icon="nav" onPress={() => Linking.openURL(directionsUrl(sel, Platform.OS))} />
          </Card>
        ) : (
          <Card style={{ gap: 6 }}>
            <Text style={{ fontSize: fs(15), fontWeight: '700', color: C.ink }}>{pick(L.where, lg)}</Text>
            {!z && <Text style={T.small}>{pick(denied ? L.denied : L.noFix, lg)}</Text>}
            {z && (
              <>
                <ZoneRow z={z.arafat} text={zoneText(z.arafat, pick(ZONE.arafat, lg), lg)} />
                <ZoneRow z={z.mina} text={zoneText(z.mina, pick(ZONE.mina, lg), lg)} />
                <ZoneRow z={z.haram} text={zoneText(z.haram, pick(L.haram, lg), lg)} />
                {accuracy > 0 && <Text style={[T.small, { color: C.muted }]}>{pick(L.acc, lg).replace('{m}', String(Math.round(accuracy)))}</Text>}
              </>
            )}
            <Text style={[T.small, { color: C.muted }]}>{pick(L.approx, lg)}</Text>
            <Text style={[T.small, { color: C.muted }]}>{pick(L.legend, lg)} · {pick(L.osm, lg)}</Text>
          </Card>
        )}
      </View>
    </View>
  );
}

function ZoneRow({ z, text }: { z: ZoneCheck; text: string }) {
  const color = z.state === 'inside' ? C.open : z.state === 'near' ? C.limited : C.muted;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}>
      <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: color, marginTop: 5 }} />
      <Text style={[T.body, { flex: 1, color: z.state === 'outside' ? C.muted : C.ink }]}>{text}</Text>
    </View>
  );
}
