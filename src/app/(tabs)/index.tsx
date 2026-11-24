import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Linking, Pressable, ScrollView, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
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
import { MADINAH_CORE } from '@/scene/madinah';
import { Cam } from '@/scene/oblique';
import { MAKKAH_CORE } from '@/scene/makkah';

export default function MapScreen() {
  const { t, lang } = useI18n();
  const insets = useSafeAreaInsets();
  const { city, setCity, destId, setDestId } = useApp();
  const { summaries, statusOf } = useReports();
  const { fix } = useLocation();
  const [size, setSize] = useState({ w: 390, h: 600 });
  const [zoom, setZoom] = useState(1);
  const [rot, setRot] = useState(-35); // harita dönüşü (°); 0 = kuzey yukarı
  const [recenter, setRecenter] = useState(0);
  const [sheetH, setSheetH] = useState(150);

  const { pos: user, demo } = localPosition(city, fix);
  const dest = DESTINATIONS.find((d) => d.id === destId && d.city === city) ?? DESTINATIONS.find((d) => d.city === city)!;
  const plan = useMemo(() => planRoute(city, user, dest.id, statusOf), [city, user[0], user[1], dest.id, statusOf]); // eslint-disable-line react-hooks/exhaustive-deps

  const closed = GATES.filter((g) => g.city === city && summaries[g.id]?.status === 'closed')
    .sort((a, b) => dist(a.pos, user) - dist(b.pos, user))[0];
  const nearestGate = GATES.filter((g) => g.city === city).sort((a, b) => dist(a.pos, user) - dist(b.pos, user))[0];
  // Üstteki arama + çipler ve alttaki panel haritayı kaplar; harita kalan alana sığdırılır.
  const topH = insets.top + 8 + 52 + 10 + 40 + 6;
  const ctrl = { w: 44, h: 44 * 2 + 8 + 44 + 8 + 44, right: 12, bottom: sheetH + 12 };
  const fit = [...(city === 'makkah' ? MAKKAH_CORE : MADINAH_CORE), ...(plan?.points ?? [user]), dest.pos];

  return (
    <View style={{ flex: 1, backgroundColor: C.mapGround }} onLayout={(e) => setSize({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}>
      <HaramScene
        city={city}
        width={size.w}
        height={size.h}
        zoom={zoom}
        fit={fit}
        viewport={{ top: topH, bottom: sheetH, left: 0, right: 0 }}
        avoid={[{ x: size.w - ctrl.right - ctrl.w, y: size.h - ctrl.bottom - ctrl.h, w: ctrl.w, h: ctrl.h }]}
        recenterKey={recenter}
        rotDeg={rot}
        onTransform={(sc, dr) => { setZoom((z) => Math.min(4, Math.max(0.6, z * sc))); setRot((r) => r + dr); }}
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
            <Text style={{ fontSize: 15, color: C.muted }} numberOfLines={1}>{t('map.search')}</Text>
          </Pressable>
          <Pressable onPress={() => router.push('/cami')} accessibilityRole="button" accessibilityLabel={lang === 'en' ? 'Nearest mosque' : lang === 'ar' ? 'أقرب مسجد' : 'En yakın cami'}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 5, height: 40, paddingHorizontal: 12, borderRadius: 20, backgroundColor: C.green }}>
            <Icon name="pin" size={16} color="#FFFFFF" />
            <Text style={{ fontSize: 13, fontWeight: '700', color: '#FFFFFF' }}>{lang === 'en' ? 'Mosque' : lang === 'ar' ? 'مسجد' : 'Cami'}</Text>
          </Pressable>
          <IconBtn name="settings" label={t('settings.title')} tint={C.accentTint} color={C.accent} size={40} onPress={() => router.push('/ayarlar')} />
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, alignItems: 'center' }}>
          <View style={[{ flexDirection: 'row', padding: 3, borderRadius: 20, backgroundColor: C.bg }, shadow]}>
            {(['makkah', 'madinah'] as const).map((c) => (
              <Pressable key={c} onPress={() => setCity(c)} accessibilityRole="button" accessibilityState={{ selected: city === c }}
                style={{ height: 34, paddingHorizontal: 12, borderRadius: 17, justifyContent: 'center', backgroundColor: city === c ? C.ink : 'transparent' }}>
                <Text style={{ fontSize: 13, fontWeight: city === c ? '700' : '500', color: city === c ? C.onInk : C.muted }}>{t(c === 'makkah' ? 'city.makkah' : 'city.madinah')}</Text>
              </Pressable>
            ))}
          </View>
          {DESTINATIONS.filter((d) => d.city === city).map((d) => (
            <Chip key={d.id} label={t(d.label).split(' · ')[0]} active={d.id === dest.id} onPress={() => setDestId(d.id)} />
          ))}
          <Chip label={t('tab.gates')} dot={C.closed} onPress={() => router.push('/kapilar')} />
          {city === 'makkah' && <Chip label={lang === 'en' ? 'Tawaf assistant' : lang === 'ar' ? 'مساعد الطواف' : 'Tavaf asistanı'} dot={C.route} onPress={() => router.push('/tavaf')} />}
          <Chip label={t('map.city')} onPress={() => router.push('/sehir')} />
          {city === 'madinah' && <Chip label="Ravza" onPress={() => router.push('/ravza')} />}
          {city === 'madinah' && <Chip label="360°" onPress={() => Linking.openURL(RAWDAH.tourUrl)} />}
          {city === 'madinah' && <Chip label={t('guide.title')} onPress={() => router.push('/medine-rehber')} />}
        </ScrollView>
      </View>

      <View style={{ position: 'absolute', right: ctrl.right, bottom: ctrl.bottom, gap: 8, alignItems: 'center' }}>
        <View style={[{ width: ctrl.w, borderRadius: ctrl.w / 2, backgroundColor: C.bg, overflow: 'hidden' }, shadow]}>
          <IconBtn name="plus" label={t('map.zoomIn')} tint={C.bg} onPress={() => setZoom((z) => Math.min(3, z * 1.4))} />
          <View style={{ height: 1, marginHorizontal: 10, backgroundColor: C.border }} />
          <IconBtn name="minus" label={t('map.zoomOut')} tint={C.bg} onPress={() => setZoom((z) => Math.max(0.7, z / 1.4))} />
        </View>
        <CompassBtn rot={rot} label={lang === 'en' ? 'Rotate north up' : lang === 'ar' ? 'اتجاه الشمال للأعلى' : 'Kuzeyi yukarı al'}
          onPress={() => setRot((r) => (Math.abs(((r % 360) + 360) % 360) < 1 ? -35 : 0))} />
        <IconBtn name="locate" label={t('map.recenter')} tint={C.bg} color={C.user} elevated onPress={() => { setZoom(1); setRecenter((n) => n + 1); }} />
      </View>

      <View onLayout={(e) => setSheetH(Math.round(e.nativeEvent.layout.height))}
        style={[{ position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: C.bg, borderTopLeftRadius: 22, borderTopRightRadius: 22, paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12, gap: 10 }, shadow]}>
        <View style={{ alignSelf: 'center', width: 36, height: 4, borderRadius: 2, backgroundColor: C.borderStrong }} />
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={T.h2} numberOfLines={1}>{t(dest.label)}</Text>
            <Text style={T.muted} numberOfLines={1}>{plan?.gate ? t('map.via', { gate: `${pick(plan.gate.name, lang)} (${plan.gate.no})` }) : demo ? t('map.demoLocation') : ' '}</Text>
          </View>
          {plan && (
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={{ fontSize: 20, fontWeight: '700', color: C.accent }}>{plan.minutes} {t('common.min')}</Text>
              <Text style={T.small}>{Math.round(plan.lengthM / 10) * 10} m</Text>
            </View>
          )}
        </View>
        {closed && (
          <Pressable onPress={() => router.push({ pathname: '/kapi/[id]', params: { id: closed.id } })} accessibilityRole="button"
            style={{ flexDirection: 'row', alignItems: 'center', gap: 8, height: 40, paddingHorizontal: 10, borderRadius: 12, backgroundColor: C.closedTint }}>
            <Icon name="alert" color={C.closed} size={18} />
            <Text numberOfLines={1} style={{ flex: 1, fontSize: 13, fontWeight: '700', color: C.closed }}>{t('map.closedAlert', { gate: `${pick(closed.name, lang)} (${closed.no})` })}</Text>
            <Text style={T.small}>{t('map.confirmations', { n: summaries[closed.id]?.confirmations ?? 0 })}</Text>
            <Icon name="chevron" color={C.muted} size={16} />
          </Pressable>
        )}
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Btn title={t('map.start')} icon="nav" style={{ flex: 1 }} onPress={() => router.push('/navigasyon')} disabled={!plan} />
          <Btn title={t('map.report')} kind="secondary" onPress={() => router.push({ pathname: '/bildir', params: { gate: nearestGate.id } })} />
        </View>
      </View>
    </View>
  );
}

/** Pusula: iğne haritadaki kuzeyi gösterir; dokununca kuzey yukarı / eğik görünüm arasında geçer. */
function CompassBtn({ rot, label, onPress }: { rot: number; label: string; onPress: () => void }) {
  // Kuzeyin ekrandaki yönü: plan rot° döner, eğik izdüşüm derinliği SA kadar basar
  const c = new Cam(1, 0, 0, rot);
  const [x0, y0] = c.P(0, 0);
  const [x1, y1] = c.P(0, -100);
  const deg = (Math.atan2(x1 - x0, -(y1 - y0)) * 180) / Math.PI;
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={label}
      style={[{ width: 44, height: 44, borderRadius: 22, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center' }, shadow]}>
      <View style={{ transform: [{ rotate: `${Math.round(deg)}deg` }], alignItems: 'center' }}>
        <Svg width={16} height={30} viewBox="0 0 16 30">
          <Path d="M8 1 L14 15 L2 15 Z" fill={C.closed} />
          <Path d="M8 29 L14 15 L2 15 Z" fill={C.muted} />
        </Svg>
      </View>
    </Pressable>
  );
}
