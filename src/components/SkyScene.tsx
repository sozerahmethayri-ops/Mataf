// Resimli, hareketli gökyüzü sahnesi. Gökyüzünün rengi güneşin gerçek yüksekliğine göre değişir; güneş ve ay
// (evresiyle) gerçek yükseklik ve yönlerine göre yerleşir. Hareketler: güneş ışınları döner ve parıldar,
// bulutlar süzülür, gündüz kuşlar geçer, gece yıldızlar göz kırpar, Mekke'de Kâbe'nin çevresinde tavaf akar.
// Hepsi yerel sürücüyle (useNativeDriver) çalışır; ekran görünmezken ya da "Hareketleri azalt" açıkken durur.
import { useIsFocused } from 'expo-router';
import { useEffect, useId, useMemo, useState, type ReactNode } from 'react';
import { Animated, AppState, Easing, StyleSheet, View, type LayoutChangeEvent, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Circle, Defs, Ellipse, LinearGradient, Path, RadialGradient, Rect, Stop } from 'react-native-svg';

import { Kaaba, Land, VBH, VBW } from '@/components/sceneArt';
import { mix } from '@/constants/theme';
import { useTheme } from '@/services/ThemeContext';
import { moonLitPath, skyNow } from '@/services/sky';
import { bodyPos, horizonGlow, scenePalette, type SceneKind, type ScenePalette } from '@/services/skyScene';

type Props = {
  now: Date;
  lat: number;
  lng: number;
  kind: SceneKind;
  height: number;
  style?: StyleProp<ViewStyle>;
  /** Ekran okuyucu için sahnenin özeti */
  label?: string;
  /** Sahnenin üstüne çizilen içerik; gökyüzü renklerini alır */
  children?: (p: ScenePalette) => ReactNode;
};

// Güneş ve ayın yolu (çizim birimi): ufuk y = 236, tepe noktası y = 74
const HORIZON = 236;
const ZENITH = 74;
const SLICE = 'xMidYMax slice';
const VIEWBOX = `0 0 ${VBW} ${VBH}`;
const fill = StyleSheet.absoluteFill;

// Sabit yıldızlar (çizim biriminde), üç grup ayrı göz kırpar
const STARS: [number, number, number][] = (() => {
  const out: [number, number, number][] = [];
  let k = 17;
  const rnd = () => ((k = (k * 9301 + 49297) % 233280) / 233280);
  for (let i = 0; i < 42; i++) out.push([rnd() * VBW, 8 + rnd() * 190, 0.45 + rnd() * 0.9]);
  return out;
})();
const SPARKLES: [number, number][] = [[48, 122], [160, 94], [232, 140], [372, 108], [118, 172]];
const sparkle = (x: number, y: number, r: number) => `M${x} ${y - r}Q${x + r * 0.18} ${y - r * 0.18} ${x + r} ${y}Q${x + r * 0.18} ${y + r * 0.18} ${x} ${y + r}Q${x - r * 0.18} ${y + r * 0.18} ${x - r} ${y}Q${x - r * 0.18} ${y - r * 0.18} ${x} ${y - r}Z`;

const CLOUD = 'M12 30C3 30 1 21 9 18C8 10 17 5 25 9C30 1 44 0 50 8C56 2 69 3 72 13C81 11 90 17 88 25C96 26 98 30 91 30Z';
const CLOUD_SHADE = 'M12 30C6 30 4 26 8 24C20 27 40 25 56 26C70 27 84 24 92 27C96 29 95 30 91 30Z';
const CLOUDS = [{ y: 150, sc: 1, ph: 0.15, dur: 150000 }, { y: 112, sc: 0.62, ph: 0.62, dur: 230000 }, { y: 176, sc: 0.78, ph: 0.85, dur: 190000 }];
const BIRD = 'M0 3Q3.5 0 7 3.2Q10.5 0 14 3Q10.5 1.4 7 4.6Q3.5 1.4 0 3Z';

// Tavaf: Kâbe'nin çevresinde (merkez 142, 307) elips üzerinde dönen kalabalık
const KAABA = { x: 142, y: 307, rx: 66, ry: 15.5 };
const CROWD = (() => {
  const out: { r: number; a: number; d: number; c: string; inner: boolean }[] = [];
  const colors = ['#FFFFFF', '#FFFFFF', '#FFFFFF', '#F1ECE3', '#8A847C', '#5E5A55', '#A39582'];
  let k = 5;
  const rnd = () => ((k = (k * 9301 + 49297) % 233280) / 233280);
  for (let i = 0; i < 44; i++) {
    const r = 0.42 + rnd() * 0.58;
    out.push({ r, a: rnd() * Math.PI * 2, d: 1.7 + rnd() * 1.1, c: colors[Math.floor(rnd() * colors.length)], inner: r < 0.72 });
  }
  return out;
})();
const STEPS = 24;

export function SkyScene({ now, lat, lng, kind, height, style, label, children }: Props) {
  const { prefs } = useTheme();
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const minute = Math.floor(now.getTime() / 60e3);
  const sky = useMemo(() => skyNow(new Date(minute * 60e3), lat, lng), [minute, lat, lng]);
  const morning = sky.sun.az < 180;
  const p = useMemo(() => scenePalette(sky.sun.alt, morning), [sky.sun.alt, morning]);

  const [box, setBox] = useState({ w: 0, h: height });
  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height: h } = e.nativeEvent.layout;
    if (Math.abs(width - box.w) > 0.5 || Math.abs(h - box.h) > 0.5) setBox({ w: width, h });
  };
  const s = box.w ? Math.max(box.w / VBW, box.h / VBH) : 1;
  const ox = (box.w - VBW * s) / 2;
  const oy = box.h - VBH * s;
  const X = (x: number) => ox + x * s;
  const Y = (y: number) => oy + y * s;

  // Hareket: ekran öndeyken, uygulama açıkken ve "Hareketleri azalt" kapalıyken
  const focused = useIsFocused();
  const [fg, setFg] = useState(AppState.currentState !== 'background');
  useEffect(() => { const sub = AppState.addEventListener('change', (st) => setFg(st === 'active')); return () => sub.remove(); }, []);
  const still = prefs.reduceMotion;
  const active = focused && fg && !still;
  const [v] = useState(() => ({
    intro: new Animated.Value(0),
    twinkle: [new Animated.Value(0), new Animated.Value(0.5), new Animated.Value(1)],
    pulse: new Animated.Value(0),
    rays: new Animated.Value(0),
    clouds: CLOUDS.map(() => new Animated.Value(0)),
    birds: new Animated.Value(0),
    flap: new Animated.Value(0),
    tawafIn: new Animated.Value(0),
    tawafOut: new Animated.Value(0),
  }));

  useEffect(() => {
    if (still) { v.intro.setValue(1); v.twinkle.forEach((t) => t.setValue(1)); return; }
    Animated.timing(v.intro, { toValue: 1, duration: 1100, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  }, [still, v]);

  useEffect(() => {
    if (!active) return;
    const lin = (val: Animated.Value, duration: number) => Animated.loop(Animated.timing(val, { toValue: 1, duration, easing: Easing.linear, useNativeDriver: true }));
    const wave = (val: Animated.Value, duration: number) => Animated.loop(Animated.sequence([
      Animated.timing(val, { toValue: 1, duration, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      Animated.timing(val, { toValue: 0, duration, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
    ]));
    const loops = [
      ...v.twinkle.map((t, i) => wave(t, 1500 + i * 700)),
      wave(v.pulse, 2800),
      lin(v.rays, 70000),
      ...v.clouds.map((c, i) => lin(c, CLOUDS[i].dur)),
      lin(v.birds, 32000),
      wave(v.flap, 210),
      lin(v.tawafIn, 46000),
      lin(v.tawafOut, 64000),
    ];
    loops.forEach((l) => l.start());
    return () => loops.forEach((l) => l.stop());
  }, [active, v]);

  // Gök cisimleri (çizim birimi). Alçak kutuda gökyüzünün üstü kesilir: tepe noktası görünen alana iner.
  const zenith = Math.max(ZENITH, (box.w ? -oy / s : 0) + 22);
  const sp = bodyPos(sky.sun.alt, sky.sun.az);
  const sun = { x: 20 + sp.x * 360, y: HORIZON - sp.h * (HORIZON - zenith) };
  const mp = bodyPos(sky.moon.alt, sky.moon.az);
  const moon = { x: 20 + mp.x * 360, y: HORIZON - mp.h * (HORIZON - zenith) };
  const glow = horizonGlow(sky.sun.alt);
  const showSun = sky.sun.alt > -4;
  const showMoon = sky.moon.alt > -2;
  const dayish = sky.sun.alt > 4;

  const sunPx = 150 * s;
  const moonPx = 64 * s;
  const introY = v.intro.interpolate({ inputRange: [0, 1], outputRange: [26 * s, 0] });
  const pulse = v.pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.12] });
  const rot = v.rays.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  // Tavaf eden kalabalık: her nokta elips üzerinde (yukarıdan bakınca saat yönünün tersine) döner
  const crowd = useMemo(() => {
    if (kind !== 'makkah' || !box.w) return [];
    const input = Array.from({ length: STEPS + 1 }, (_, i) => i / STEPS);
    return CROWD.map((d, i) => {
      const val = d.inner ? v.tawafIn : v.tawafOut;
      const ang = input.map((t) => d.a - t * Math.PI * 2);
      const size = d.d * s;
      return {
        key: i, size, c: d.c,
        tx: val.interpolate({ inputRange: input, outputRange: ang.map((a) => ox + (KAABA.x + KAABA.rx * d.r * Math.cos(a)) * s - size / 2) }),
        ty: val.interpolate({ inputRange: input, outputRange: ang.map((a) => oy + (KAABA.y + KAABA.ry * d.r * Math.sin(a)) * s - size / 2) }),
        sc: val.interpolate({ inputRange: input, outputRange: ang.map((a) => 0.78 + 0.32 * (Math.sin(a) + 1) / 2) }),
      };
    });
  }, [kind, box.w, s, ox, oy, v]);

  const lit = showMoon ? moonLitPath(0, 0, 9, sky.moon.fraction, sky.moon.waxing, lat < 0) : '';
  const cloudOpacity = 0.3 + 0.65 * (1 - p.dark);

  return (
    <View onLayout={onLayout} style={[{ height, overflow: 'hidden', backgroundColor: p.skyMid }, style]}>
      {/* Gökyüzü ve ufuk kızıllığı */}
      <Svg style={fill} width="100%" height="100%" viewBox={VIEWBOX} preserveAspectRatio={SLICE} accessible={!!label} accessibilityLabel={label}>
        <Defs>
          <LinearGradient id={`sky${uid}`} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={p.skyTop} />
            <Stop offset="0.5" stopColor={p.skyMid} />
            <Stop offset="0.72" stopColor={p.skyLow} />
            <Stop offset="1" stopColor={p.skyLow} />
          </LinearGradient>
          <RadialGradient id={`hz${uid}`} cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor={p.glow} stopOpacity={0.95} />
            <Stop offset="1" stopColor={p.glow} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Rect x={-20} y={-40} width={VBW + 40} height={VBH + 40} fill={`url(#sky${uid})`} />
        {glow > 0.02 && <Ellipse cx={sun.x} cy={HORIZON + 6} rx={230} ry={120} fill={`url(#hz${uid})`} opacity={glow * 0.85} />}
      </Svg>

      {/* Yıldızlar */}
      {p.stars > 0.02 && v.twinkle.map((t, g) => (
        <Animated.View key={g} pointerEvents="none" style={[fill, { opacity: Animated.multiply(t.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] }), p.stars) }]}>
          <Svg style={fill} width="100%" height="100%" viewBox={VIEWBOX} preserveAspectRatio={SLICE}>
            {STARS.filter((_, i) => i % 3 === g).map(([x, y, r], i) => <Circle key={i} cx={x} cy={y} r={r} fill="#FFFFFF" />)}
            {SPARKLES.filter((_, i) => i % 3 === g).map(([x, y], i) => <Path key={`s${i}`} d={sparkle(x, y, 3.4)} fill="#FFF7E0" />)}
          </Svg>
        </Animated.View>
      ))}

      {box.w > 0 && (
        <>
          {/* Ay */}
          {showMoon && (
            <View pointerEvents="none" style={{ position: 'absolute', left: X(moon.x) - moonPx / 2, top: Y(moon.y) - moonPx / 2, width: moonPx, height: moonPx, opacity: dayish ? 0.7 : 1 }}>
              <Svg style={fill} width="100%" height="100%" viewBox="-32 -32 64 64">
                <Defs>
                  <RadialGradient id={`mg${uid}`} cx="50%" cy="50%" r="50%">
                    <Stop offset="0" stopColor="#FFF6DE" stopOpacity={dayish ? 0.15 : 0.45} />
                    <Stop offset="1" stopColor="#FFF6DE" stopOpacity={0} />
                  </RadialGradient>
                </Defs>
                <Circle r={30} fill={`url(#mg${uid})`} />
                <Circle r={9} fill={mix(p.skyTop, '#FFFFFF', 0.16)} opacity={dayish ? 0.25 : 0.9} />
                {!!lit && <Path d={lit} fill="#FFF4D6" />}
              </Svg>
            </View>
          )}

          {/* Güneş: parıldayan hale, dönen ışınlar, disk */}
          {showSun && (
            <Animated.View pointerEvents="none" style={{ position: 'absolute', left: X(sun.x) - sunPx / 2, top: Y(sun.y) - sunPx / 2, width: sunPx, height: sunPx, opacity: v.intro, transform: [{ translateY: introY }] }}>
              <Animated.View style={[fill, { transform: [{ scale: pulse }] }]}>
                <Svg style={fill} width="100%" height="100%" viewBox="-75 -75 150 150">
                  <Defs>
                    <RadialGradient id={`sg${uid}`} cx="50%" cy="50%" r="50%">
                      <Stop offset="0" stopColor={p.glow} stopOpacity={0.85} />
                      <Stop offset="0.35" stopColor={p.glow} stopOpacity={0.35} />
                      <Stop offset="1" stopColor={p.glow} stopOpacity={0} />
                    </RadialGradient>
                  </Defs>
                  <Circle r={74} fill={`url(#sg${uid})`} />
                </Svg>
              </Animated.View>
              <Animated.View style={[fill, { transform: [{ rotate: rot }] }]}>
                <Svg style={fill} width="100%" height="100%" viewBox="-75 -75 150 150">
                  {Array.from({ length: 12 }, (_, i) => {
                    const a = (i * Math.PI) / 6;
                    const r0 = 19, r1 = i % 2 ? 36 : 46, w = 0.09;
                    return <Path key={i} d={`M${r0 * Math.cos(a - w)} ${r0 * Math.sin(a - w)}L${r1 * Math.cos(a)} ${r1 * Math.sin(a)}L${r0 * Math.cos(a + w)} ${r0 * Math.sin(a + w)}Z`} fill={p.glow} opacity={0.35 + glow * 0.2} />;
                  })}
                </Svg>
              </Animated.View>
              <Svg style={fill} width="100%" height="100%" viewBox="-75 -75 150 150">
                <Circle r={13 + glow * 2.5} fill={p.sun} />
                <Circle r={8} cx={-2.5} cy={-2.5} fill="#FFFFFF" opacity={0.35} />
              </Svg>
            </Animated.View>
          )}

          {/* Bulutlar */}
          {CLOUDS.map((c, i) => {
            const w = 100 * c.sc * s, h = 32 * c.sc * s;
            const from = X(-110), to = X(VBW + 10), at = from + (to - from) * c.ph;
            const tx = v.clouds[i].interpolate({ inputRange: [0, 1 - c.ph, 1 - c.ph + 1e-4, 1], outputRange: [at, to, from, at] });
            return (
              <Animated.View key={i} pointerEvents="none" style={{ position: 'absolute', left: 0, top: Y(c.y) - h / 2, width: w, height: h, opacity: cloudOpacity, transform: [{ translateX: tx }] }}>
                <Svg style={fill} width="100%" height="100%" viewBox="0 0 100 32">
                  <Path d={CLOUD} fill={p.cloud} />
                  <Path d={CLOUD_SHADE} fill={p.cloudShade} opacity={0.8} />
                </Svg>
              </Animated.View>
            );
          })}

          {/* Kuşlar (gündüz) */}
          {dayish && (
            <Animated.View pointerEvents="none" style={{
              position: 'absolute', left: 0, top: Y(140), width: 60 * s, height: 30 * s,
              transform: [
                { translateX: v.birds.interpolate({ inputRange: [0, 0.72, 1], outputRange: [X(-70), X(VBW + 20), X(VBW + 20)] }) },
                { translateY: v.birds.interpolate({ inputRange: [0, 0.18, 0.36, 0.54, 0.72, 1], outputRange: [0, -7 * s, 0, 6 * s, -3 * s, -3 * s] }) },
              ],
            }}>
              {[[0, 10, 1], [18, 2, 0.85], [24, 16, 0.75]].map(([bx, by, sc], i) => (
                <Animated.View key={i} style={{ position: 'absolute', left: bx * s, top: by * s, width: 14 * sc * s, height: 6 * sc * s, transform: [{ scaleY: v.flap.interpolate({ inputRange: [0, 1], outputRange: i === 1 ? [0.35, 1] : [1, 0.35] }) }] }}>
                  <Svg style={fill} width="100%" height="100%" viewBox="0 0 14 6"><Path d={BIRD} fill={mix('#3B3A48', p.skyTop, 0.2)} opacity={0.75} /></Svg>
                </Animated.View>
              ))}
            </Animated.View>
          )}
        </>
      )}

      {/* Dağlar, şehir ve meydan */}
      <Svg style={fill} width="100%" height="100%" viewBox={VIEWBOX} preserveAspectRatio={SLICE} pointerEvents="none">
        <Land kind={kind} p={p} open={sky.sun.alt > -4} />
      </Svg>

      {/* Mekke: tavaf eden kalabalık ve Kâbe */}
      {kind === 'makkah' && (
        <>
          {crowd.map((d) => (
            <Animated.View key={d.key} pointerEvents="none" style={{ position: 'absolute', left: 0, top: 0, width: d.size, height: d.size, borderRadius: d.size / 2, backgroundColor: d.c, transform: [{ translateX: d.tx }, { translateY: d.ty }, { scale: d.sc }] }} />
          ))}
          <Svg style={fill} width="100%" height="100%" viewBox={VIEWBOX} preserveAspectRatio={SLICE} pointerEvents="none">
            <Kaaba p={p} />
          </Svg>
        </>
      )}

      {children && <View style={fill} pointerEvents="box-none">{children(p)}</View>}
    </View>
  );
}
