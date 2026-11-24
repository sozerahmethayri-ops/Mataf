import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HaramScene } from '@/components/HaramScene';
import { Icon, type IconName } from '@/components/Icon';
import { IconBtn, T } from '@/components/ui';
import { C, shadow } from '@/constants/theme';
import { DESTINATIONS, GATES, dist, type Pt } from '@/data/sites';
import { pick, useI18n } from '@/i18n';
import { useApp } from '@/services/AppContext';
import { localPosition, useLocation } from '@/services/location';
import { useReports } from '@/services/ReportsContext';
import { nextStep, planRoute, pointAlong } from '@/services/routing';

export default function Navigation() {
  const { t, lang } = useI18n();
  const insets = useSafeAreaInsets();
  const { city, destId } = useApp();
  const { summaries, statusOf } = useReports();
  const { fix } = useLocation();
  const [size, setSize] = useState({ w: 390, h: 800 });
  const [voice, setVoice] = useState(true);
  const [walked, setWalked] = useState(0);
  const [dismissed, setDismissed] = useState(false);
  const live = localPosition(city, fix);
  const demo = live.demo;
  const dest = DESTINATIONS.find((d) => d.id === destId && d.city === city) ?? DESTINATIONS.find((d) => d.city === city)!;

  // Rota başlangıçta canlı konumdan (ya da demo başlangıcından) planlanır; durum değişince yeniden planlanır.
  const [start] = useState<Pt>(() => live.pos);
  const basePlan = useMemo(() => planRoute(city, start, dest.id, statusOf), [city, start, dest.id, statusOf]);
  const pos: Pt = demo && basePlan ? pointAlong(basePlan.points, walked) : live.pos;
  const plan = useMemo(() => (demo ? basePlan : planRoute(city, pos, dest.id, statusOf)), [demo, basePlan, city, pos[0], pos[1], dest.id, statusOf]); // eslint-disable-line react-hooks/exhaustive-deps

  // Demo: rota boyunca 1,3 m/sn yürüyüş
  useEffect(() => {
    if (!demo || !basePlan) return;
    const id = setInterval(() => setWalked((w) => Math.min(basePlan.lengthM, w + 1.3 * 3)), 1000);
    return () => clearInterval(id);
  }, [demo, basePlan]);

  // Kapı kapalıysa yeniden rota uyarısı (rota planlayıcı kapalı kapıları zaten atlar)
  const closedGate = GATES.find((g) => g.city === city && summaries[g.id]?.status === 'closed');
  const banner = !dismissed && closedGate ? t('nav.rerouted', { gate: `${pick(closedGate.name, lang)} (${closedGate.no})` }) : null;

  if (!plan) return null;
  const step = nextStep(plan, pos);
  const remaining = demo ? Math.max(0, plan.lengthM - walked) : plan.lengthM;
  const arrived = dist(pos, dest.pos) < 8;
  const icon: IconName = arrived ? 'check' : step.turn === 'left' ? 'left' : step.turn === 'right' ? 'right' : 'up';
  const instruction = arrived ? t('nav.arrive') : step.atGate ? t('nav.enter', { gate: `${pick(step.atGate.name, lang)} (${step.atGate.no})` })
    : step.turn === 'left' ? t('nav.left') : step.turn === 'right' ? t('nav.right') : t('nav.straight');
  const traveled = demo && basePlan ? [...basePlan.points.slice(0, step.segment + 1), pos] : undefined;
  const ahead = [pos, ...plan.points.slice(step.segment + 1)];

  return (
    <View style={{ flex: 1, backgroundColor: C.mapGround }} onLayout={(e) => setSize({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}>
      <HaramScene city={city} width={size.w} height={size.h} zoom={1.9} focus={pos} focusAt={[0.4, 0.62]}
        viewport={{ top: insets.top + 92, bottom: insets.bottom + 108, left: 0, right: 0 }}
        route={ahead} traveled={traveled} user={pos} dest={dest.pos} summaries={summaries} routeGateId={plan.gate?.id} labels={false} pannable={false}
        onGatePress={(id) => router.push({ pathname: '/kapi/[id]', params: { id } })} />

      <View style={[{ position: 'absolute', left: 12, right: 12, top: insets.top + 8, minHeight: 76, borderRadius: 20, backgroundColor: C.ink, padding: 10, flexDirection: 'row', alignItems: 'center', gap: 12 }, shadow]}>
        <View style={{ width: 56, height: 56, borderRadius: 14, backgroundColor: C.route, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name={icon} size={30} color={C.ink} width={2.6} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ color: '#FFFFFF', fontSize: 26, fontWeight: '700' }}>{arrived ? '✓' : `${step.distM} m`}</Text>
          <Text style={{ color: '#D5D7DC', fontSize: 13 }}>{instruction}</Text>
        </View>
      </View>

      {banner && (
        <View style={[{ position: 'absolute', left: 12, right: 12, top: insets.top + 94, borderRadius: 16, backgroundColor: C.bg, padding: 10, flexDirection: 'row', alignItems: 'center', gap: 10 }, shadow]}>
          <Icon name="alert" color={C.closed} />
          <Text style={{ flex: 1, fontSize: 13, fontWeight: '700', color: C.ink }}>{banner}</Text>
          <IconBtn name="close" label={t('common.close')} size={36} onPress={() => setDismissed(true)} />
        </View>
      )}

      {demo && (
        <View style={{ position: 'absolute', left: 12, top: insets.top + (banner ? 156 : 94), paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, backgroundColor: C.userTint }}>
          <Text style={{ fontSize: 12, fontWeight: '700', color: '#1D4ED8' }}>{t('nav.demo')} · {t('map.demoLocation')}</Text>
        </View>
      )}

      <View style={[{ position: 'absolute', left: 12, right: 12, bottom: insets.bottom + 16, height: 84, borderRadius: 24, backgroundColor: C.bg, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 12 }, shadow]}>
        <IconBtn name="close" label={t('nav.end')} tint={C.closedTint} color={C.closed} onPress={() => router.back()} />
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 15, fontWeight: '700', color: C.ink }}>{t(dest.label).split(' · ')[0]} · <Text style={{ color: C.accent }}>{Math.max(1, Math.round(remaining / 60))} {t('common.min')}</Text></Text>
          <Text style={T.small}>{Math.round(remaining)} m{plan.gate ? ` · ${pick(plan.gate.name, lang)} (${plan.gate.no})` : ''}</Text>
        </View>
        <Pressable onPress={() => setVoice((v) => !v)} accessibilityRole="switch" accessibilityState={{ checked: voice }} accessibilityLabel={t('nav.voice')}
          style={{ width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: voice ? C.accentTint : C.surface }}>
          <Icon name="speaker" color={voice ? C.accent : C.muted} />
        </Pressable>
      </View>
    </View>
  );
}
