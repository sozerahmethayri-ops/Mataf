// Otelime dön: oteli bir kez kaydet, tek dokunuşla yürüyüş rotası; uzaksa taksi ve şoföre gösterilecek Arapça kart.
import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Linking, Modal, Pressable, ScrollView, Share, Text, TextInput, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/Icon';
import { OnlineMap } from '@/components/OnlineMap';
import { Btn, Card, IconBtn, Segmented, SectionTitle, T } from '@/components/ui';
import { C, fs } from '@/constants/theme';
import { ANCHORS, type City } from '@/data/sites';
import type { T3 } from '@/data/umre';
import { pick, useI18n } from '@/i18n';
import { useApp } from '@/services/AppContext';
import { getJson } from '@/services/cache';
import { useHotel, type Hotel } from '@/services/hotel';
import { kmTo, useLocation } from '@/services/location';
import {
  fmtMinutes, meters, osrmUrl, parseOsrm, parsePhoton, photonReverseUrl, photonUrl, roughRoute, uberUrl, type Place, type StreetRoute,
} from '@/services/transport';

type Lang = 'tr' | 'en' | 'ar';
const L = {
  title: { tr: 'Otelime dön', en: 'Back to my hotel', ar: 'العودة إلى فندقي' },
  makkah: { tr: 'Mekke', en: 'Makkah', ar: 'مكة' },
  madinah: { tr: 'Medine', en: 'Madinah', ar: 'المدينة' },
  setup: { tr: 'Otelinizi kaydedin', en: 'Save your hotel', ar: 'احفظ فندقك' },
  setupText: { tr: 'Bir kez kaydedin; kalabalıkta tek dokunuşla eve dönüş rotası alırsınız. Bilgiler yalnız bu telefonda saklanır.', en: 'Save it once and get a route back with one tap, even in the crowds. Stored only on this phone.', ar: 'احفظه مرة واحدة لتحصل على طريق العودة بلمسة واحدة. يُحفظ على هاتفك فقط.' },
  hereNow: { tr: 'Şu an otelimdeyim', en: 'I’m at my hotel now', ar: 'أنا في فندقي الآن' },
  search: { tr: 'Otel adıyla ara…', en: 'Search by hotel name…', ar: 'ابحث باسم الفندق…' },
  orMap: { tr: 'ya da haritada otelinizin üstüne uzun basın', en: 'or long-press your hotel on the map', ar: 'أو اضغط مطولًا على فندقك في الخريطة' },
  waitLoc: { tr: 'Konum bekleniyor…', en: 'Waiting for location…', ar: 'في انتظار الموقع…' },
  walk: { tr: 'yürüyerek', en: 'on foot', ar: 'مشيًا' },
  approx: { tr: 'yaklaşık (rota sunucusuna ulaşılamadı)', en: 'approximate (route server unreachable)', ar: 'تقريبي' },
  far: { tr: 'Otel uzakta: taksi daha rahat olabilir. Şoföre aşağıdaki kartı gösterin.', en: 'The hotel is far: a taxi may be easier. Show the driver the card below.', ar: 'الفندق بعيد؛ قد تكون سيارة الأجرة أسهل. اعرض البطاقة على السائق.' },
  driver: { tr: 'Şoföre göster', en: 'Show the driver', ar: 'اعرضه على السائق' },
  call: { tr: 'Oteli ara', en: 'Call the hotel', ar: 'اتصل بالفندق' },
  share: { tr: 'Otel konumunu paylaş', en: 'Share hotel location', ar: 'شارك موقع الفندق' },
  taxi: { tr: 'Uber ile taksi', en: 'Taxi with Uber', ar: 'تاكسي عبر أوبر' },
  details: { tr: 'Otel bilgileri', en: 'Hotel details', ar: 'بيانات الفندق' },
  name: { tr: 'Otel adı', en: 'Hotel name', ar: 'اسم الفندق' },
  nameAr: { tr: 'Arapça adı (resepsiyondan isteyin)', en: 'Arabic name (ask reception)', ar: 'الاسم بالعربية' },
  address: { tr: 'Adres / yakın nokta', en: 'Address / landmark', ar: 'العنوان / معلم قريب' },
  room: { tr: 'Oda numarası', en: 'Room number', ar: 'رقم الغرفة' },
  phone: { tr: 'Otel telefonu', en: 'Hotel phone', ar: 'هاتف الفندق' },
  change: { tr: 'Oteli değiştir', en: 'Change hotel', ar: 'تغيير الفندق' },
  myHotel: { tr: 'Otelim', en: 'My hotel', ar: 'فندقي' },
  atHotel: { tr: 'Oteldesiniz', en: 'You are at your hotel', ar: 'أنت في فندقك' },
  takeMe: { tr: 'Lütfen beni bu otele götürün', en: 'Please take me to this hotel', ar: 'من فضلك، أوصلني إلى هذا الفندق' },
  roomL: { tr: 'Oda', en: 'Room', ar: 'الغرفة' },
  close: { tr: 'Kapat', en: 'Close', ar: 'إغلاق' },
  noResults: { tr: 'Sonuç yok; haritada uzun basmayı deneyin.', en: 'No results; try long-pressing on the map.', ar: 'لا نتائج؛ جرّب الضغط المطوّل على الخريطة.' },
} satisfies Record<string, T3>;

const fmtDist = (m: number) => (m < 1000 ? `${Math.round(m / 10) * 10} m` : `${(m / 1000).toFixed(1).replace('.', ',')} km`);

export default function HotelScreen() {
  const { lang } = useI18n();
  const lg = lang as Lang;
  const insets = useSafeAreaInsets();
  const app = useApp();
  const { fix, denied } = useLocation();
  const here = fix ? { lat: fix.lat, lng: fix.lng } : null;
  // Şehir: konum hangi şehre yakınsa o; yoksa uygulamada seçili şehir
  const [cityPick, setCityPick] = useState<City | null>(null);
  const autoCity: City = fix ? (kmTo('makkah', fix) < kmTo('madinah', fix) ? 'makkah' : 'madinah') : app.city;
  const city = cityPick ?? autoCity;
  const { hotel, loaded, save } = useHotel(city);
  const [driver, setDriver] = useState(false);

  // Otel arama (Photon, şehir merkezine yakın)
  const [q, setQ] = useState('');
  const [results, setResults] = useState<Place[] | null>(null);
  const [searching, setSearching] = useState(false);
  useEffect(() => {
    const s = q.trim();
    if (s.length < 3) return;
    let alive = true;
    const timer = setTimeout(() => {
      setSearching(true);
      getJson<{ features?: [] }>(photonUrl(s, ANCHORS[city], lg))
        .then((j) => alive && setResults(parsePhoton(j)))
        .catch(() => alive && setResults([]))
        .finally(() => alive && setSearching(false));
    }, 450);
    return () => { alive = false; clearTimeout(timer); };
  }, [q, city, lg]);

  const setFrom = (p: { lat: number; lng: number }, name?: string, address?: string) => {
    const h: Hotel = { lat: p.lat, lng: p.lng, name, address };
    save(h);
    setQ('');
    setResults(null);
    if (!name) {
      // Ad yoksa konumdan bul (Photon ters arama)
      getJson<{ features?: [] }>(photonReverseUrl(p))
        .then((j) => {
          const r = parsePhoton(j)[0];
          if (r) save({ ...h, name: r.name, address: r.sub });
        })
        .catch(() => undefined);
    }
  };
  const update = (patch: Partial<Hotel>) => hotel && save({ ...hotel, ...patch });

  // Yürüyüş rotası: konum ~50 m değişince yeniden hesaplanır
  const fromKey = here ? `${here.lat.toFixed(3)},${here.lng.toFixed(3)}` : '';
  const toKey = hotel ? `${hotel.lat.toFixed(5)},${hotel.lng.toFixed(5)}` : '';
  const [route, setRoute] = useState<{ key: string; r: StreetRoute } | null>(null);
  useEffect(() => {
    if (!here || !hotel) return;
    const key = `${fromKey}>${toKey}`;
    let alive = true;
    const from = { lat: here.lat, lng: here.lng };
    const to = { lat: hotel.lat, lng: hotel.lng };
    getJson<Parameters<typeof parseOsrm>[0]>(osrmUrl(from, to, 'foot'))
      .then((j) => parseOsrm(j) ?? roughRoute(from, to, 'foot'))
      .catch(() => roughRoute(from, to, 'foot'))
      .then((r) => alive && setRoute({ key, r }));
    return () => { alive = false; };
  }, [fromKey, toKey]); // eslint-disable-line react-hooks/exhaustive-deps
  const r = route && route.key === `${fromKey}>${toKey}` ? route.r : null;
  const straight = here && hotel ? meters(here, hotel) : null;
  const far = (r?.meters ?? straight ?? 0) > 3000;

  const pins = useMemo(() => (hotel ? [{ id: 'hotel', lat: hotel.lat, lng: hotel.lng, color: C.accent, label: hotel.name || pick(L.myHotel, lg), big: true }] : []), [hotel, lg]);
  const lines = r ? [{ coords: r.coords, color: C.route, width: 6, dashed: r.approximate }] : [];
  const hotelName = hotel?.name || pick(L.myHotel, lg);

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <View style={{ paddingTop: insets.top + 6, paddingHorizontal: 12, paddingBottom: 8, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <IconBtn name="back" label="Geri" onPress={() => router.back()} />
        <Text style={[T.h2, { flex: 1 }]} numberOfLines={1}>{pick(L.title, lg)}</Text>
      </View>
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 24, gap: 12 }} keyboardShouldPersistTaps="handled">
        <View style={{ paddingHorizontal: 16 }}>
          <Segmented value={city} onChange={(v) => setCityPick(v)} options={[{ value: 'makkah', label: pick(L.makkah, lg) }, { value: 'madinah', label: pick(L.madinah, lg) }]} />
        </View>

        <View style={{ height: 300, marginHorizontal: 16, borderRadius: 18, overflow: 'hidden', backgroundColor: C.mapGround }}>
          <OnlineMap pins={pins} lines={lines} user={here} center={hotel ?? ANCHORS[city]} fitUser={!far}
            fitKey={`${toKey}:${r ? 1 : 0}`} onLongPress={(p) => setFrom(p)} padding={{ top: 30, bottom: 30, left: 30, right: 60 }} />
        </View>

        {loaded && !hotel && (
          <View style={{ paddingHorizontal: 16, gap: 10 }}>
            <Text style={T.h2}>{pick(L.setup, lg)}</Text>
            <Text style={T.body}>{pick(L.setupText, lg)}</Text>
            <Btn title={here ? pick(L.hereNow, lg) : pick(L.waitLoc, lg)} icon="locate" disabled={!here} onPress={() => here && setFrom(here)} />
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, height: 46, borderRadius: 14, backgroundColor: C.surface, paddingHorizontal: 12 }}>
              <Icon name="search" size={18} color={C.muted} />
              <TextInput value={q} onChangeText={(v) => { setQ(v); if (v.trim().length < 3) setResults(null); }} placeholder={pick(L.search, lg)} placeholderTextColor={C.muted}
                style={{ flex: 1, fontSize: fs(15), color: C.ink }} returnKeyType="search" />
              {searching && <ActivityIndicator color={C.muted} />}
            </View>
            {results && results.length === 0 && !searching && <Text style={T.small}>{pick(L.noResults, lg)}</Text>}
            {results?.map((p) => (
              <Pressable key={p.id} onPress={() => setFrom(p, p.name, p.sub)} style={({ pressed }) => ({ flexDirection: 'row', gap: 10, alignItems: 'center', paddingVertical: 8, opacity: pressed ? 0.7 : 1 })}>
                <Icon name="hotel" size={18} color={C.accent} />
                <View style={{ flex: 1 }}>
                  <Text style={[T.body, { fontWeight: '600' }]} numberOfLines={1}>{p.name}</Text>
                  <Text style={T.small} numberOfLines={1}>{p.sub}</Text>
                </View>
              </Pressable>
            ))}
            <Text style={T.small}>{pick(L.orMap, lg)}</Text>
          </View>
        )}

        {hotel && (
          <View style={{ paddingHorizontal: 16, gap: 10 }}>
            <Card tint={C.accentSoft} style={{ gap: 6 }}>
              <Text style={{ fontSize: fs(18), fontWeight: '800', color: C.ink }}>{hotelName}</Text>
              {hotel.address ? <Text style={T.small}>{hotel.address}</Text> : null}
              {here && straight != null && straight < 40 ? (
                <Text style={{ fontSize: fs(16), fontWeight: '700', color: C.open }}>{pick(L.atHotel, lg)}</Text>
              ) : here ? (
                <Text style={{ fontSize: fs(16), fontWeight: '700', color: C.accent }}>
                  {r ? `${fmtDist(r.meters)} · ${fmtMinutes(Math.max(1, Math.round(r.seconds / 60)), lg)} ${pick(L.walk, lg)}` : straight != null ? fmtDist(straight) : '…'}
                </Text>
              ) : (
                <Text style={T.small}>{denied ? '—' : pick(L.waitLoc, lg)}</Text>
              )}
              {r?.approximate && (straight ?? 0) >= 40 && <Text style={T.small}>{pick(L.approx, lg)}</Text>}
            </Card>
            {far && <Text style={T.body}>{pick(L.far, lg)}</Text>}
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <Btn title={pick(L.driver, lg)} icon="taxi" style={{ flex: 1 }} onPress={() => setDriver(true)} />
              {hotel.phone ? <Btn title={pick(L.call, lg)} kind="secondary" icon="phone" style={{ flex: 1 }} onPress={() => Linking.openURL(`tel:${hotel.phone!.replace(/[^\d+]/g, '')}`)} /> : null}
            </View>
            {far && <Btn title={pick(L.taxi, lg)} kind="secondary" icon="car" onPress={() => Linking.openURL(uberUrl(hotel, hotelName))} />}
            <Btn title={pick(L.share, lg)} kind="secondary" icon="share"
              onPress={() => Share.share({ message: `${hotelName}${hotel.address ? `\n${hotel.address}` : ''}\nhttps://www.google.com/maps/search/?api=1&query=${hotel.lat.toFixed(6)},${hotel.lng.toFixed(6)}` })} />

            <SectionTitle>{pick(L.details, lg)}</SectionTitle>
            <Field label={pick(L.name, lg)} value={hotel.name} onSave={(v) => update({ name: v })} />
            <Field label={pick(L.nameAr, lg)} value={hotel.nameAr} onSave={(v) => update({ nameAr: v })} rtl />
            <Field label={pick(L.address, lg)} value={hotel.address} onSave={(v) => update({ address: v })} />
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ flex: 1 }}><Field label={pick(L.room, lg)} value={hotel.room} onSave={(v) => update({ room: v })} /></View>
              <View style={{ flex: 1.4 }}><Field label={pick(L.phone, lg)} value={hotel.phone} onSave={(v) => update({ phone: v })} phone /></View>
            </View>
            <Pressable onPress={() => save(null)} accessibilityRole="button" style={{ alignSelf: 'flex-start', paddingVertical: 6 }}>
              <Text style={{ fontSize: fs(14), fontWeight: '700', color: C.closed }}>{pick(L.change, lg)}</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>

      <Modal visible={driver && !!hotel} animationType="slide" onRequestClose={() => setDriver(false)} supportedOrientations={['portrait', 'landscape']}>
        <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
          <ScrollView contentContainerStyle={{ padding: 24, gap: 16, flexGrow: 1, justifyContent: 'center' }}>
            <Text style={{ fontSize: fs(24), color: C.ink2, textAlign: 'center', writingDirection: 'rtl' }}>{L.takeMe.ar}</Text>
            <Text style={{ fontSize: fs(20), color: C.ink2, textAlign: 'center', writingDirection: 'rtl' }}>براہ کرم مجھے اس ہوٹل لے چلیں</Text>
            <Text style={{ fontSize: fs(18), color: C.ink2, textAlign: 'center' }}>{L.takeMe.en}</Text>
            {hotel?.nameAr ? <Text style={{ fontSize: fs(40), fontWeight: '800', color: C.ink, textAlign: 'center', writingDirection: 'rtl' }}>{hotel.nameAr}</Text> : null}
            <Text style={{ fontSize: fs(hotel?.nameAr ? 26 : 36), fontWeight: '800', color: C.ink, textAlign: 'center' }}>{hotelName}</Text>
            {hotel?.address ? <Text style={{ fontSize: fs(20), color: C.ink, textAlign: 'center' }}>{hotel.address}</Text> : null}
            <Text style={{ fontSize: fs(18), color: C.ink, textAlign: 'center' }}>{city === 'makkah' ? 'مكة المكرمة · Makkah' : 'المدينة المنورة · Madinah'}</Text>
            {hotel?.room ? <Text style={{ fontSize: fs(18), color: C.ink2, textAlign: 'center' }}>{L.roomL.ar} / {pick(L.roomL, lg)}: {hotel.room}</Text> : null}
            {hotel?.phone ? <Text style={{ fontSize: fs(22), fontWeight: '700', color: C.ink, textAlign: 'center' }}>☎ {hotel.phone}</Text> : null}
            {hotel && <Text style={{ fontSize: fs(15), color: C.muted, textAlign: 'center' }}>{hotel.lat.toFixed(5)}, {hotel.lng.toFixed(5)}</Text>}
            <Btn title={pick(L.close, lg)} kind="secondary" onPress={() => setDriver(false)} />
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </View>
  );
}

/** Düzenlenebilir alan: yazarken yerelde tutulur, klavye kapanınca kaydedilir. */
function Field({ label, value, onSave, rtl, phone }: { label: string; value?: string; onSave: (v: string) => void; rtl?: boolean; phone?: boolean }) {
  const [v, setV] = useState(value ?? '');
  const [prev, setPrev] = useState(value);
  if (value !== prev) { setPrev(value); setV(value ?? ''); }
  return (
    <View style={{ gap: 4 }}>
      <Text style={T.small}>{label}</Text>
      <TextInput value={v} onChangeText={setV} onEndEditing={() => v !== (value ?? '') && onSave(v.trim())} onBlur={() => v !== (value ?? '') && onSave(v.trim())}
        keyboardType={phone ? 'phone-pad' : 'default'} textAlign={rtl ? 'right' : 'left'}
        style={{ height: 44, borderRadius: 12, backgroundColor: C.surface, paddingHorizontal: 12, fontSize: fs(15), color: C.ink, writingDirection: rtl ? 'rtl' : 'ltr' }} />
    </View>
  );
}
