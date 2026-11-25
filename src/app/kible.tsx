// Kıble pusulası: kadran yalnız döner (yerel animasyon sürücüsü, 60 fps); yön yumuşatılmış sensörden gelir.
import * as Haptics from 'expo-haptics';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Text, View } from 'react-native';
import Svg, { Circle, G, Path, Text as SvgText } from 'react-native-svg';

import { Header, Screen, T } from '@/components/ui';
import { C } from '@/constants/theme';
import { pick, useI18n } from '@/i18n';
import { kmTo, useCoarseLocation, useHeading } from '@/services/location';
import { qiblaDeg } from '@/services/prayer';
import { useTheme } from '@/services/ThemeContext';

const L = {
  perm: { tr: 'Konum izni gerekli', en: 'Location permission needed', ar: 'يلزم إذن الموقع' },
  dist: { tr: 'Kâbe’ye uzaklık', en: 'Distance to the Kaaba', ar: 'المسافة إلى الكعبة' },
  calib: { tr: 'Pusulayı kalibre etmek için telefonu havada 8 çizerek hareket ettirin. Metal ve mıknatıslardan uzak tutun.', en: 'To calibrate, move the phone in a figure 8. Keep away from metal and magnets.', ar: 'للمعايرة حرّك الهاتف على شكل الرقم 8، وأبعده عن المعادن.' },
};

export default function Qibla() {
  const { t, lang } = useI18n();
  const { prefs } = useTheme();
  const { fix, denied } = useCoarseLocation();
  const heading = useHeading();
  const q = fix ? qiblaDeg(fix.lat, fix.lng) : null;
  const rel = q != null && heading != null ? (q - heading + 360) % 360 : null;
  const aligned = rel != null && (rel < 4 || rel > 356);
  const km = fix ? Math.round(kmTo('makkah', fix)) : null;

  // Kadranın dönüşü: açı sarılmadan (359° → 1° tam tur atmasın) sürekli bir değere çevrilir
  const [rot] = useState(() => new Animated.Value(0));
  const cont = useRef<number | null>(null);
  useEffect(() => {
    if (heading == null) return;
    const target = -heading;
    const prev = cont.current ?? target;
    const next = prev + ((((target - prev) % 360) + 540) % 360) - 180;
    cont.current = next;
    Animated.timing(rot, { toValue: next, duration: prefs.reduceMotion ? 0 : 140, easing: Easing.out(Easing.quad), useNativeDriver: true }).start();
  }, [heading, rot, prefs.reduceMotion]);
  const spin = rot.interpolate({ inputRange: [-36000, 36000], outputRange: ['-36000deg', '36000deg'] });

  const wasAligned = useRef(false);
  useEffect(() => {
    if (aligned && !wasAligned.current && prefs.haptics) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
    wasAligned.current = aligned;
  }, [aligned, prefs.haptics]);

  const dial = useMemo(() => (
    <Svg width={300} height={300} viewBox="0 0 300 300">
      <Circle cx={150} cy={150} r={140} fill={C.bg} stroke={C.borderStrong} strokeWidth={2} />
      {Array.from({ length: 72 }, (_, i) => {
        const a = (i * 5 * Math.PI) / 180;
        const r0 = i % 6 === 0 ? 124 : 130;
        return <Path key={i} d={`M${150 + r0 * Math.sin(a)} ${150 - r0 * Math.cos(a)} L${150 + 138 * Math.sin(a)} ${150 - 138 * Math.cos(a)}`} stroke={C.border} strokeWidth={i % 6 === 0 ? 2 : 1} />;
      })}
      {(lang === 'en' ? ['N', 'E', 'S', 'W'] : lang === 'ar' ? ['ش', 'ق', 'ج', 'غ'] : ['K', 'D', 'G', 'B']).map((l, i) => (
        <SvgText key={i} x={150 + 106 * Math.sin((i * Math.PI) / 2)} y={156 - 106 * Math.cos((i * Math.PI) / 2)} fontSize={16} fontWeight="700" fill={i === 0 ? C.accent : C.muted} textAnchor="middle">{l}</SvgText>
      ))}
      {q != null && (
        <G rotation={q} origin="150, 150">
          <Path d="M150 34 L163 150 L137 150 Z" fill={C.accent} />
          <Path d="M150 266 L137 150 L163 150 Z" fill={C.borderStrong} />
          <Path d="M142 18 h16 v14 h-16 z" fill="#1A1A1A" />
          <Path d="M142 22 h16" stroke="#C9A227" strokeWidth={2} />
        </G>
      )}
    </Svg>
  ), [q, lang]);

  return (
    <Screen>
      <Header back title={t('qibla.title')} subtitle={q != null ? t('qibla.dir', { d: Math.round(q) }) : denied ? pick(L.perm, lang) : '…'} />
      <View style={{ alignItems: 'center', marginTop: 24 }}>
        <View style={{ width: 300, height: 300 }}>
          <Animated.View style={{ width: 300, height: 300, transform: [{ rotate: spin }] }}>{dial}</Animated.View>
          <Svg width={300} height={300} style={{ position: 'absolute' }} pointerEvents="none">
            <Path d="M150 2 L159 20 L141 20 Z" fill={aligned ? C.open : C.ink} />
            <Circle cx={150} cy={150} r={10} fill={aligned ? C.open : C.ink} />
          </Svg>
        </View>
      </View>
      <Text style={[T.h2, { textAlign: 'center', color: aligned ? C.open : C.ink }]}>
        {heading == null ? t('qibla.noSensor') : aligned ? t('qibla.aligned') : t('qibla.turn')}
      </Text>
      {km != null && <Text style={[T.muted, { textAlign: 'center' }]}>{pick(L.dist, lang)}: {km.toLocaleString(lang)} km</Text>}
      <Text style={[T.small, { textAlign: 'center' }]}>{pick(L.calib, lang)}</Text>
    </Screen>
  );
}
