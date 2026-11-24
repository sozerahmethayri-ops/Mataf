import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Linking, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HaramScene } from '@/components/HaramScene';
import { Icon } from '@/components/Icon';
import { Btn, Chip, IconBtn, T } from '@/components/ui';
import { C, shadow } from '@/constants/theme';
import { RAWDAH } from '@/data/content';
import { DESTINATIONS, GATES, dist } from '@/data/sites';
import { pick, useI18n } from '@/i18n';
import { useApp } from '@/services/AppContext';
import { localPosition, useLocation } from '@/services/location';
import { useReports } from '@/services/ReportsContext';
import { planRoute } from '@/services/routing';

export default function MapScreen() {
  const { t, lang } = useI18n();
  const insets = useSafeAreaInsets();
  const { city, setCity, destId, setDestId } = useApp();
  const { summaries, statusOf } = useReports();
  const { fix } = useLocation();
  const [size, setSize] = useState({ w: 390, h: 600 });
  const [zoom, setZoom] = useState(1);

  const { pos: user, demo } = localPosition(city, fix);
  const dest = DESTINATIONS.find((d) => d.id === destId && d.city === city) ?? DESTINATIONS.find((d) => d.city === city)!;
  const plan = useMemo(() => planRoute(city, user, dest.id, statusOf), [city, user[0], user[1], dest.id, statusOf]); // eslint-disable-line react-hooks/exhaustive-deps

  const closed = GATES.filter((g) => g.city === city && summaries[g.id]?.status === 'closed')
    .sort((a, b) => dist(a.pos, user) - dist(b.pos, user))[0];
  const nearestGate = GATES.filter((g) => g.city === city).sort((a, b) => dist(a.pos, user) - dist(b.pos, user))[0];
  const sheetH = 236;

  return (
    <View style={{ flex: 1, backgroundColor: C.mapGround }} onLayout={(e) => setSize({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}>
      <HaramScene
        city={city}
        width={size.w}
        height={size.h - sheetH + 24}
        zoom={zoom}
        focus={city === 'makkah' ? [-60, 20] : [0, 0]}
        focusAt={[0.5, 0.55]}
        route={plan?.points}
        user={user}
        dest={dest.pos}
        destLabel={t(dest.label).split(' · ')[0]}
        summaries={summaries}
        routeGateId={plan?.gate?.id}
        onGatePress={(id) => router.push({ pathname: '/kapi/[id]', params: { id } })}
      />

      <View style={{ position: 'absolute', left: 16, right: 16, top: insets.top + 8, gap: 10 }}>
        <View style={[{ flexDirection: 'row', alignItems: 'center', gap: 10, height: 52, paddingLeft: 16, paddingRight: 6, borderRadius: 26, backgroundColor: C.bg }, shadow]}>
          <Icon name="search" color={C.muted} />
          <Pressable style={{ flex: 1, height: 44, justifyContent: 'center' }} onPress={() => router.push('/arama')} accessibilityRole="search">
            <Text style={{ fontSize: 15, color: C.muted }}>{t('map.search')}</Text>
          </Pressable>
          <IconBtn name="settings" label={t('settings.title')} tint={C.accentTint} color={C.accent} size={40} onPress={() => router.push('/ayarlar')} />
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, alignItems: 'center' }}>
          <View style={[{ flexDirection: 'row', padding: 3, borderRadius: 20, backgroundColor: C.bg }, shadow]}>
            {(['makkah', 'madinah'] as const).map((c) => (
              <Pressable key={c} onPress={() => setCity(c)} accessibilityRole="button" accessibilityState={{ selected: city === c }}
                style={{ height: 34, paddingHorizontal: 12, borderRadius: 17, justifyContent: 'center', backgroundColor: city === c ? C.ink : 'transparent' }}>
                <Text style={{ fontSize: 13, fontWeight: city === c ? '700' : '500', color: city === c ? '#FFFFFF' : C.muted }}>{t(c === 'makkah' ? 'city.makkah' : 'city.madinah')}</Text>
              </Pressable>
            ))}
          </View>
          {DESTINATIONS.filter((d) => d.city === city).map((d) => (
            <Chip key={d.id} label={t(d.label).split(' · ')[0]} active={d.id === dest.id} onPress={() => setDestId(d.id)} />
          ))}
          <Chip label={t('map.city')} onPress={() => router.push('/sehir')} />
          {city === 'madinah' && <Chip label="Ravza" onPress={() => router.push('/ravza')} />}
          {city === 'madinah' && <Chip label="360°" onPress={() => Linking.openURL(RAWDAH.tourUrl)} />}
          {city === 'madinah' && <Chip label={t('guide.title')} onPress={() => router.push('/medine-rehber')} />}
        </ScrollView>
      </View>

      <View style={{ position: 'absolute', right: 12, top: insets.top + 122, gap: 8 }}>
        <IconBtn name="plus" label="+" tint={C.bg} elevated onPress={() => setZoom((z) => Math.min(4, z * 1.4))} />
        <IconBtn name="minus" label="−" tint={C.bg} elevated onPress={() => setZoom((z) => Math.max(0.6, z / 1.4))} />
        <IconBtn name="locate" label="Konum" tint={C.bg} color={C.user} elevated onPress={() => setZoom(1)} />
        <IconBtn name="data" label={t('data.title')} tint={C.bg} elevated onPress={() => router.push('/veriler')} />
      </View>

      <View style={[{ position: 'absolute', left: 0, right: 0, bottom: 0, height: sheetH, backgroundColor: C.bg, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 20, paddingTop: 10, gap: 10 }, shadow]}>
        <View style={{ alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: '#E2E0DC' }} />
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
          <View style={{ flex: 1, gap: 3 }}>
            <Text style={T.h2}>{t(dest.label)}</Text>
            <Text style={T.muted}>{plan?.gate ? t('map.via', { gate: `${pick(plan.gate.name, lang)} (${plan.gate.no})` }) : demo ? t('map.demoLocation') : ' '}</Text>
          </View>
          {plan && (
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={{ fontSize: 20, fontWeight: '700', color: C.accent }}>{plan.minutes} {t('common.min')}</Text>
              <Text style={T.small}>{Math.round(plan.lengthM / 10) * 10} m</Text>
            </View>
          )}
        </View>
        {closed ? (
          <Pressable onPress={() => router.push({ pathname: '/kapi/[id]', params: { id: closed.id } })}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 10, padding: 10, borderRadius: 14, backgroundColor: C.closedTint }}>
            <Icon name="alert" color={C.closed} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 13, fontWeight: '700', color: C.closed }}>{t('map.closedAlert', { gate: `${pick(closed.name, lang)} (${closed.no})` })}</Text>
              <Text style={T.small}>{t('map.rerouted', { n: summaries[closed.id]?.confirmations ?? 0 })}</Text>
            </View>
            <Icon name="chevron" color={C.muted} size={18} />
          </Pressable>
        ) : <View style={{ height: 8 }} />}
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Btn title={t('map.start')} icon="nav" style={{ flex: 1 }} onPress={() => router.push('/navigasyon')} disabled={!plan} />
          <Btn title={t('map.report')} kind="secondary" onPress={() => router.push({ pathname: '/bildir', params: { gate: nearestGate.id } })} />
        </View>
      </View>
    </View>
  );
}
