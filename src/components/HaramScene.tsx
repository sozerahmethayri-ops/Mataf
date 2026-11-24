import { memo, useEffect, useMemo, useState } from 'react';
import { Animated, Easing, PanResponder, Pressable, Text, View } from 'react-native';
import Svg, { Circle, Ellipse, G, Path, Polygon, Rect } from 'react-native-svg';

import { C } from '@/constants/theme';
import { GATES, type City, type Pt } from '@/data/sites';
import { pick, useI18n } from '@/i18n';
import type { GateSummary } from '@/services/reports';
import { buildMadinah, MADINAH_LABELS } from '@/scene/madinah';
import { buildMakkah, MAKKAH_LABELS } from '@/scene/makkah';
import { Cam, pathD, type Prim } from '@/scene/oblique';
import { Icon } from './Icon';

const BASE_K: Record<City, number> = { makkah: 0.6, madinah: 0.56 };
const AnimatedPath = Animated.createAnimatedComponent(Path);

const Prims = memo(function Prims({ prims }: { prims: Prim[] }) {
  return (
    <>
      {prims.map((p, i) => {
        switch (p.t) {
          case 'poly': return <Polygon key={i} points={p.pts} fill={p.fill} stroke={p.stroke} strokeWidth={p.sw} opacity={p.op} />;
          case 'path': return <Path key={i} d={p.d} fill={p.fill ?? 'none'} stroke={p.stroke} strokeWidth={p.sw} opacity={p.op} fillRule={p.rule} />;
          case 'ell': return <Ellipse key={i} cx={p.cx} cy={p.cy} rx={p.rx} ry={p.ry} fill={p.fill} stroke={p.stroke} strokeWidth={p.sw} />;
          case 'circ': return <Circle key={i} cx={p.cx} cy={p.cy} r={p.r} fill={p.fill} stroke={p.stroke} strokeWidth={p.sw} />;
          case 'rect': return <Rect key={i} x={p.x} y={p.y} width={p.w} height={p.h} fill={p.fill} stroke={p.stroke} strokeWidth={p.sw} />;
        }
      })}
    </>
  );
});

export type SceneProps = {
  city: City;
  width: number;
  height: number;
  zoom?: number;
  focus?: Pt; // ekranın odak noktasına gelecek yerel nokta
  focusAt?: [number, number]; // odak noktasının ekrandaki oranı (0–1)
  route?: Pt[];
  traveled?: Pt[];
  user?: Pt;
  heading?: number | null;
  dest?: Pt;
  destLabel?: string;
  summaries: Record<string, GateSummary>;
  routeGateId?: string;
  onGatePress?: (gateId: string) => void;
  labels?: boolean;
  pannable?: boolean;
};

export function HaramScene(props: SceneProps) {
  const { city, width, height, zoom = 1, focus = [0, 0], focusAt = [0.5, 0.45], route, traveled, user, dest, destLabel, summaries, routeGateId, onGatePress, labels = true, pannable = true } = props;
  const { lang } = useI18n();
  const k = BASE_K[city] * zoom;
  const [fx, fy] = focus;
  const [ax, ay] = focusAt;
  const cam = useMemo(() => Cam.centeredOn(k, [fx, fy], width * ax, height * ay), [k, fx, fy, width, height, ax, ay]);
  const scene = useMemo(() => (city === 'makkah' ? buildMakkah(cam) : buildMadinah(cam)), [city, cam]);

  // Kaydırma (pan): React durumu yerine Animated değer — kaydırırken sahne yeniden çizilmez.
  const [pan] = useState(() => new Animated.ValueXY({ x: 0, y: 0 }));
  useEffect(() => { pan.setValue({ x: 0, y: 0 }); pan.setOffset({ x: 0, y: 0 }); }, [pan, city, zoom, fx, fy]);
  const responder = useMemo(() => PanResponder.create({
    onMoveShouldSetPanResponder: (_, g) => pannable && (Math.abs(g.dx) > 6 || Math.abs(g.dy) > 6),
    onPanResponderGrant: () => pan.extractOffset(),
    onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], { useNativeDriver: false }),
    onPanResponderRelease: () => pan.flattenOffset(),
  }), [pan, pannable]);

  // Akan turuncu iz
  const [dash] = useState(() => new Animated.Value(0));
  useEffect(() => {
    const loop = Animated.loop(Animated.timing(dash, { toValue: -30, duration: 1100, easing: Easing.linear, useNativeDriver: false }));
    loop.start();
    return () => loop.stop();
  }, [dash]);

  const routeD = route && route.length > 1 ? pathD(cam, route) : undefined;
  const doneD = traveled && traveled.length > 1 ? pathD(cam, traveled) : undefined;
  const P = (p: Pt, h = 0) => cam.P(p[0], p[1], h);
  const labelDefs = city === 'makkah' ? MAKKAH_LABELS : MADINAH_LABELS;
  const scaleBarM = zoom >= 2 ? 50 : 100;

  return (
    <View style={{ width, height, overflow: 'hidden', backgroundColor: C.mapGround }} {...responder.panHandlers}>
      <Animated.View style={{ position: 'absolute', left: 0, top: 0, width, height, transform: pan.getTranslateTransform() }}>
        <Svg width={width} height={height} accessibilityLabel="3D harita">
          <Prims prims={scene.below} />
          {doneD && <Path d={doneD} stroke="#B8BCC4" strokeWidth={8} strokeLinecap="round" fill="none" />}
          {routeD && (
            <G>
              <Path d={routeD} stroke="#FFFFFF" strokeWidth={11} strokeLinecap="round" strokeLinejoin="round" fill="none" />
              <Path d={routeD} stroke={C.route} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" fill="none" />
              <AnimatedPath d={routeD} stroke="#FFFFFF" strokeWidth={2.2} strokeLinecap="round" strokeDasharray="3 12" strokeDashoffset={dash} fill="none" />
            </G>
          )}
          <Prims prims={scene.above} />
        </Svg>

        {labels && labelDefs.map((l) => {
          const [x, y] = P(l.pos, l.h);
          if (x < -40 || x > width + 40 || y < -20 || y > height + 20) return null;
          return (
            <View key={l.key} pointerEvents="none" style={{ position: 'absolute', left: x - 50, top: y - 24, width: 100, alignItems: 'center' }}>
              <Text style={{ fontSize: 10, fontWeight: '700', color: C.ink2, backgroundColor: 'rgba(255,255,255,0.92)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 7, overflow: 'hidden' }}>{pick(l.text, lang)}</Text>
            </View>
          );
        })}

        {GATES.filter((g) => g.city === city).map((g) => {
          const [x, y] = P(g.pos);
          if (x < -20 || x > width + 20 || y < -10 || y > height + 50) return null;
          const s = summaries[g.id]?.status ?? 'open';
          const isRoute = g.id === routeGateId;
          const bg = isRoute ? C.accent : s === 'closed' ? C.closed : s === 'open' ? C.open : C.limitedFill;
          const fg = s !== 'open' && s !== 'closed' && !isRoute ? C.ink : '#FFFFFF';
          return (
            <Pressable key={g.id} accessibilityRole="button" accessibilityLabel={`${pick(g.name, lang)} · ${s}`} onPress={() => onGatePress?.(g.id)}
              style={{ position: 'absolute', left: x - 16, top: y - 44, width: 32, height: 44, alignItems: 'center' }}>
              <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: bg, borderWidth: 2, borderColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ color: fg, fontSize: g.no.length > 2 ? 10 : 12, fontWeight: '700' }}>{g.no}</Text>
                {s === 'closed' && (
                  <View style={{ position: 'absolute', right: -7, top: -7, width: 16, height: 16, borderRadius: 8, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon name="close" size={10} color={C.closed} width={4} />
                  </View>
                )}
              </View>
              <View style={{ width: 2, height: 12, backgroundColor: bg }} />
            </Pressable>
          );
        })}

        {dest && (() => {
          const [x, y] = P(dest);
          return (
            <View pointerEvents="none" style={{ position: 'absolute', left: x - 11, top: y - 11, alignItems: 'center' }}>
              <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: C.accent, borderWidth: 3, borderColor: '#FFFFFF' }} />
              {destLabel ? <Text style={{ marginTop: 2, fontSize: 11, fontWeight: '700', color: C.accent, backgroundColor: '#FFFFFF', paddingHorizontal: 6, borderRadius: 8, overflow: 'hidden' }}>{destLabel}</Text> : null}
            </View>
          );
        })()}

        {user && (() => {
          const [x, y] = P(user);
          return (
            <View pointerEvents="none" style={{ position: 'absolute', left: x - 22, top: y - 22, width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(37,99,235,0.16)', alignItems: 'center', justifyContent: 'center' }}>
              <View style={{ width: 18, height: 18, borderRadius: 9, backgroundColor: C.user, borderWidth: 3, borderColor: '#FFFFFF' }} />
            </View>
          );
        })()}
      </Animated.View>

      <View pointerEvents="none" style={{ position: 'absolute', left: 12, bottom: 12, backgroundColor: 'rgba(255,255,255,0.92)', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 5 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: scaleBarM * k }}>
          <Text style={{ fontSize: 10, fontWeight: '700', color: C.ink2 }}>0</Text>
          <Text style={{ fontSize: 10, fontWeight: '700', color: C.ink2 }}>{scaleBarM} m</Text>
        </View>
        <View style={{ width: scaleBarM * k, height: 5, borderWidth: 1.5, borderTopWidth: 0, borderColor: C.ink }} />
      </View>
    </View>
  );
}
