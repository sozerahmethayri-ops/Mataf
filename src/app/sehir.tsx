import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CityMap, POI_COLORS } from '@/components/CityMap';
import { Btn, Chip, IconBtn, T } from '@/components/ui';
import { C, shadow } from '@/constants/theme';
import { ANCHORS, GATES, toLatLng } from '@/data/sites';
import { pick, useI18n } from '@/i18n';
import type { Key } from '@/i18n/strings';
import { useApp } from '@/services/AppContext';
import { useLocation } from '@/services/location';
import { haversine, nearbyPois, walkRoute, type PoiCat } from '@/services/osm';
import { useAsync } from '@/services/useAsync';
import { useReports } from '@/services/ReportsContext';

const CATS: { id: PoiCat; key: Key }[] = [
  { id: 'hotel', key: 'city.hotel' }, { id: 'food', key: 'city.food' }, { id: 'pharmacy', key: 'city.pharmacy' },
  { id: 'bus', key: 'city.bus' }, { id: 'taxi', key: 'city.taxi' }, { id: 'hospital', key: 'city.hospital' },
];
type Mode = 'walk' | 'accessible' | 'taxi';

export default function CityScreen() {
  const { t, lang } = useI18n();
  const insets = useSafeAreaInsets();
  const { city } = useApp();
  const { statusOf } = useReports();
  const { fix } = useLocation();
  const center = { lat: ANCHORS[city].lat, lng: ANCHORS[city].lng };
  const [cat, setCat] = useState<PoiCat | null>(null);
  const [hotel, setHotel] = useState<{ lat: number; lng: number } | null>(null);
  const [mode, setMode] = useState<Mode>('walk');
  const poisRes = useAsync(() => nearbyPois(center.lat, center.lng), [city]);
  const pois = poisRes.data ?? [];
  const loading = poisRes.loading;
  const error = !!poisRes.error;

  useEffect(() => {
    let alive = true;
    AsyncStorage.getItem(`mataf.hotel.${city}`).then((v) => alive && setHotel(v ? JSON.parse(v) : null));
    return () => { alive = false; };
  }, [city]);

  const gates = useMemo(() => GATES.filter((g) => g.city === city).map((g) => {
    const ll = toLatLng(city, g.pos);
    return { id: g.id, no: g.no, lat: ll.latitude, lng: ll.longitude, closed: statusOf(g.id) === 'closed', name: pick(g.name, lang) };
  }), [city, statusOf, lang]);

  const origin = hotel ?? (fix ? { lat: fix.lat, lng: fix.lng } : null);
  const target = useMemo(() => {
    if (!origin) return null;
    return gates.filter((g) => !g.closed).sort((a, b) => haversine(origin, a) - haversine(origin, b))[0] ?? null;
  }, [origin?.lat, origin?.lng, gates]); // eslint-disable-line react-hooks/exhaustive-deps

  const routeRes = useAsync(() => (origin && target ? walkRoute(origin, target) : Promise.resolve(null)), [origin?.lat, origin?.lng, target?.id]);
  const route = routeRes.data ?? null;

  const saveHotel = (p: { lat: number; lng: number }) => {
    setHotel(p);
    AsyncStorage.setItem(`mataf.hotel.${city}`, JSON.stringify(p));
  };
  const nearestTaxi = origin ? pois.filter((p) => p.cat === 'taxi').sort((a, b) => haversine(origin, a) - haversine(origin, b))[0] : undefined;
  const minutes = route ? Math.max(1, Math.round(route.meters / (mode === 'accessible' ? 55 : 70))) : 0;

  return (
    <View style={{ flex: 1, backgroundColor: C.mapGround }}>
      <CityMap center={center} pois={pois.filter((p) => !cat || p.cat === cat)} hotel={hotel} gates={gates}
        route={mode === 'taxi' ? undefined : route?.coords} onLongPress={saveHotel}
        onGatePress={(id) => router.push({ pathname: '/kapi/[id]', params: { id } })} />

      <View style={{ position: 'absolute', left: 12, right: 12, top: insets.top + 8, gap: 10 }}>
        <View style={[{ flexDirection: 'row', alignItems: 'center', gap: 8, height: 52, borderRadius: 26, backgroundColor: C.bg, paddingHorizontal: 6 }, shadow]}>
          <IconBtn name="back" label={t('common.back')} size={40} onPress={() => router.back()} />
          <Text style={{ flex: 1, fontSize: 15, color: C.muted }}>{t('city.searchPh')}</Text>
          {loading && <ActivityIndicator color={C.accent} style={{ marginRight: 10 }} />}
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          {CATS.map((c) => <Chip key={c.id} label={t(c.key)} dot={POI_COLORS[c.id]} active={cat === c.id} onPress={() => setCat(cat === c.id ? null : c.id)} />)}
        </ScrollView>
        {error && <Text style={[T.small, { backgroundColor: C.bg, padding: 8, borderRadius: 10, overflow: 'hidden' }]}>{t('city.offline')}</Text>}
      </View>

      <View style={[{ position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: C.bg, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 16, paddingBottom: insets.bottom + 16, gap: 10 }, shadow]}>
        {!origin ? (
          <Text style={T.body}>{t('city.setHotel')}</Text>
        ) : (
          <>
            <Text style={T.h2}>{hotel ? t('city.myHotel') : 'Konumum'} → {target ? `${target.name} (${target.no})` : '—'}</Text>
            <Text style={T.small}>
              {mode === 'taxi' ? `${t('city.taxiNote')}${nearestTaxi ? ` · ${Math.round(haversine(origin, nearestTaxi))} m` : ''}`
                : route ? `${Math.round(route.meters)} m${route.approximate ? ' · kuş uçuşu (çevrimdışı)' : ''}${mode === 'accessible' ? ' · rampalı yolları tercih edin' : ''}` : '…'}
            </Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {(['walk', 'accessible', 'taxi'] as Mode[]).map((m) => {
                const on = m === mode;
                return (
                  <Pressable key={m} onPress={() => setMode(m)} accessibilityRole="tab" accessibilityState={{ selected: on }}
                    style={{ flex: 1, height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center', borderWidth: on ? 2 : 1, borderColor: on ? C.accent : C.borderStrong, backgroundColor: on ? C.accentTint : C.bg }}>
                    <Text style={{ fontSize: 12, fontWeight: '600', color: on ? C.accent : C.ink }}>{t(m === 'walk' ? 'city.walk' : m === 'accessible' ? 'city.accessible' : 'city.taxi')}</Text>
                    <Text style={{ fontSize: 15, fontWeight: '700', color: on ? C.accent : C.ink }}>{m === 'taxi' ? '—' : `${m === 'accessible' ? Math.round(minutes * 1.25) : minutes} ${t('common.min')}`}</Text>
                  </Pressable>
                );
              })}
            </View>
            <Btn title={t('city.route')} icon="nav" onPress={() => router.push('/navigasyon')} />
          </>
        )}
        <Text style={[T.small, { fontSize: 10 }]}>© OpenStreetMap katkıcıları (ODbL) · rota: FOSSGIS OSRM · harita: {`Apple/Google`}</Text>
      </View>
    </View>
  );
}
