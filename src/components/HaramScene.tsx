import { memo, useEffect, useMemo, useState } from 'react';
import { Animated, Easing, PanResponder, Pressable, Text, View } from 'react-native';
import Svg, { Circle, Ellipse, G, Path, Polygon, Rect } from 'react-native-svg';

import { C } from '@/constants/theme';
import { GATES, type City, type Pt } from '@/data/sites';
import { pick, useI18n } from '@/i18n';
import type { GateSummary } from '@/services/reports';
import { fitCamera, NO_INSETS, niceScale, placeLabels, textWidth, type Box, type Viewport } from '@/scene/layout';
import { buildMadinah, MADINAH_LABELS } from '@/scene/madinah';
import { buildMakkah, MAKKAH_LABELS } from '@/scene/makkah';
import { Cam, pathD, type Prim } from '@/scene/oblique';
import { Icon } from './Icon';

const BASE_K: Record<City, number> = { makkah: 0.6, madinah: 0.56 };
const AnimatedPath = Animated.createAnimatedComponent(Path);

// İşaret ölçüleri (px)
const PIN = 28; // kapı dairesi
const STEM = 10;
const LABEL_H = 18;
const DEST_H = 24;

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
  focus?: Pt; // ekranın odak noktasına gelecek yerel nokta (fit verilmezse)
  focusAt?: [number, number]; // odak noktasının ekrandaki oranı (0–1)
  /** Verilirse kamera bu noktaları (yerel metre) görünür alana sığdırır; zoom bunun üzerine uygulanır. */
  fit?: Pt[];
  /** Arayüzün kapladığı kenar payları — sığdırma, etiketler ve ölçek çubuğu bunu dikkate alır. */
  viewport?: Viewport;
  /** Etiketlerin kaçınacağı ek alanlar (ör. harita butonları), ekran koordinatında. */
  avoid?: Box[];
  /** Değişince kaydırma sıfırlanır (konuma dön). */
  recenterKey?: number;
  /** Haram'ın önündeki yüksek yapıları (Saat Kulesi) yarı saydam çiz. */
  xray?: boolean;
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

const round5 = (p: Pt): Pt => [Math.round(p[0] / 5) * 5, Math.round(p[1] / 5) * 5];

export function HaramScene(props: SceneProps) {
  const {
    city, width, height, zoom = 1, focus = [0, 0], focusAt = [0.5, 0.45], fit, viewport = NO_INSETS, avoid = [], recenterKey = 0, xray = true,
    route, traveled, user, dest, destLabel, summaries, routeGateId, onGatePress, labels = true, pannable = true,
  } = props;
  const { lang } = useI18n();
  const [fx, fy] = focus;
  const [ax, ay] = focusAt;
  const { top: vt, bottom: vb, left: vl, right: vr } = viewport;
  // Konum her güncellendiğinde kamera titremesin diye sığdırma noktaları 5 m'ye yuvarlanır.
  const fitKey = fit ? JSON.stringify(fit.map(round5)) : '';
  const cam = useMemo(() => {
    if (fitKey) {
      const pts = JSON.parse(fitKey) as Pt[];
      return fitCamera(pts, width, height, { top: vt, bottom: vb, left: vl, right: vr }, { zoom, headroom: 28, kMin: 0.35, kMax: 1.6 });
    }
    return Cam.centeredOn(BASE_K[city] * zoom, [fx, fy], width * ax, height * ay);
  }, [fitKey, city, zoom, fx, fy, width, height, ax, ay, vt, vb, vl, vr]);
  const k = cam.k;
  const scene = useMemo(() => (city === 'makkah' ? buildMakkah(cam) : buildMadinah(cam)), [city, cam]);

  // Kaydırma (pan): React durumu yerine Animated değer — kaydırırken sahne yeniden çizilmez.
  const [pan] = useState(() => new Animated.ValueXY({ x: 0, y: 0 }));
  useEffect(() => { pan.setValue({ x: 0, y: 0 }); pan.setOffset({ x: 0, y: 0 }); }, [pan, cam, recenterKey]);
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
  const scaleM = niceScale(k);

  // Sabit işaretler (kapı, hedef, kullanıcı) önce; yapı etiketleri bunlarla çakışmayacak yere yerleşir.
  const gates = GATES.filter((g) => g.city === city).map((g) => {
    const [x, y] = P(g.pos);
    return { g, x, y };
  });
  const destXY = dest ? P(dest) : undefined;
  const destW = destLabel ? textWidth(destLabel, 11) + 34 : 0;
  const userXY = user ? P(user) : undefined;
  const fixed: Box[] = [
    ...avoid,
    ...gates.map(({ x, y }) => ({ x: x - PIN / 2, y: y - PIN - STEM, w: PIN, h: PIN + STEM })),
    ...(destXY ? [{ x: destXY[0] - 6, y: destXY[1] - 6, w: 12, h: 12, owner: '__dest' }] : []),
    ...(userXY ? [{ x: userXY[0] - 22, y: userXY[1] - 22, w: 44, h: 44 }] : []),
    // Kâbe / Yeşil Kubbe üzerine etiket binmesin
    ...(() => {
      const [x, y] = city === 'makkah' ? P([0, 0], 7) : P([30, 152], 14);
      const r = Math.max(9, 12 * k);
      return [{ x: x - r, y: y - r, w: 2 * r, h: 2 * r, owner: city === 'makkah' ? 'kaaba' : 'dome' }];
    })(),
  ];
  const labelDefs = city === 'makkah' ? MAKKAH_LABELS : MADINAH_LABELS;
  // Hedef etiketi önce (asla gizlenmez), sonra yapı etiketleri.
  const placed = placeLabels(
    [
      ...(destXY && destLabel ? [{ id: '__dest', ax: destXY[0], ay: destXY[1], w: destW, h: DEST_H, required: true, gap: 13 }] : []),
      ...(labels ? labelDefs.map((l) => {
        const [x, y] = P(l.pos, l.h);
        return { id: l.key, ax: x, ay: y, w: textWidth(pick(l.text, lang), 10) + 12, h: LABEL_H, slideDown: l.h > 200 };
      }) : []),
    ],
    fixed, width, height, viewport,
  );
  const destBox = placed.__dest;
  // Etiket noktanın tam üstündeyse kısa bir sap çizilir.
  const destStem = destXY && destBox && Math.abs(destBox.x + destBox.w / 2 - destXY[0]) < 1 && destBox.y + destBox.h <= destXY[1] - 6;

  return (
    <View style={{ width, height, overflow: 'hidden', backgroundColor: C.mapGround }} {...responder.panHandlers}>
      <Animated.View style={{ position: 'absolute', left: 0, top: 0, width, height, transform: pan.getTranslateTransform() }}>
        <Svg width={width} height={height} accessibilityLabel="3D harita">
          <Prims prims={scene.below} />
          <Prims prims={scene.above} />
          {scene.ghost.length > 0 && (
            <G opacity={xray ? 0.42 : 1}>
              <Prims prims={scene.ghost} />
            </G>
          )}
          {doneD && <Path d={doneD} stroke="#B8BCC4" strokeWidth={7} strokeLinecap="round" fill="none" />}
          {routeD && (
            <G>
              <Path d={routeD} stroke="#FFFFFF" strokeWidth={10} strokeLinecap="round" strokeLinejoin="round" fill="none" />
              <Path d={routeD} stroke={C.route} strokeWidth={5.5} strokeLinecap="round" strokeLinejoin="round" fill="none" />
              <AnimatedPath d={routeD} stroke="#FFFFFF" strokeWidth={2} strokeLinecap="round" strokeDasharray="3 12" strokeDashoffset={dash} fill="none" />
            </G>
          )}
        </Svg>

        {labels && labelDefs.map((l) => {
          const b = placed[l.key];
          if (!b) return null;
          return (
            <View key={l.key} pointerEvents="none" style={{ position: 'absolute', left: b.x, top: b.y, width: b.w, height: b.h, borderRadius: 9, backgroundColor: 'rgba(255,255,255,0.94)', alignItems: 'center', justifyContent: 'center' }}>
              <Text numberOfLines={1} style={{ fontSize: 10, fontWeight: '700', color: C.ink2 }}>{pick(l.text, lang)}</Text>
            </View>
          );
        })}

        {gates.map(({ g, x, y }) => {
          if (x < -20 || x > width + 20 || y < -10 || y > height + 50) return null;
          const s = summaries[g.id]?.status ?? 'open';
          const isRoute = g.id === routeGateId;
          const bg = isRoute ? C.accent : s === 'closed' ? C.closed : s === 'open' ? C.open : C.limitedFill;
          const fg = s !== 'open' && s !== 'closed' && !isRoute ? C.ink : '#FFFFFF';
          return (
            <Pressable key={g.id} accessibilityRole="button" accessibilityLabel={`${pick(g.name, lang)} · ${s}`} onPress={() => onGatePress?.(g.id)} hitSlop={6}
              style={{ position: 'absolute', left: x - PIN / 2, top: y - PIN - STEM, width: PIN, height: PIN + STEM, alignItems: 'center' }}>
              <View style={{ width: PIN, height: PIN, borderRadius: PIN / 2, backgroundColor: bg, borderWidth: 2, borderColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ color: fg, fontSize: g.no.length > 2 ? 9 : 11, fontWeight: '700' }}>{g.no}</Text>
                {s === 'closed' && (
                  <View style={{ position: 'absolute', right: -6, top: -6, width: 14, height: 14, borderRadius: 7, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon name="close" size={9} color={C.closed} width={4} />
                  </View>
                )}
              </View>
              <View style={{ width: 2, height: STEM, backgroundColor: bg }} />
            </Pressable>
          );
        })}

        {destXY && (
          <>
            {destStem && <View pointerEvents="none" style={{ position: 'absolute', left: destXY[0] - 1, top: destBox!.y + destBox!.h, width: 2, height: destXY[1] - 6 - destBox!.y - destBox!.h, backgroundColor: C.accent }} />}
            <View pointerEvents="none" style={{ position: 'absolute', left: destXY[0] - 6, top: destXY[1] - 6, width: 12, height: 12, borderRadius: 6, backgroundColor: C.accent, borderWidth: 2, borderColor: '#FFFFFF' }} />
            {destBox && destLabel ? (
              <View pointerEvents="none" style={{ position: 'absolute', left: destBox.x, top: destBox.y, width: destBox.w, height: DEST_H, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, borderRadius: DEST_H / 2, backgroundColor: C.accent, borderWidth: 2, borderColor: '#FFFFFF' }}>
                <Icon name="flag" size={12} color="#FFFFFF" width={2.4} />
                <Text numberOfLines={1} style={{ fontSize: 11, fontWeight: '700', color: '#FFFFFF' }}>{destLabel}</Text>
              </View>
            ) : null}
          </>
        )}

        {userXY && (
          <View pointerEvents="none" style={{ position: 'absolute', left: userXY[0] - 22, top: userXY[1] - 22, width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(37,99,235,0.16)', alignItems: 'center', justifyContent: 'center' }}>
            <View style={{ width: 18, height: 18, borderRadius: 9, backgroundColor: C.user, borderWidth: 3, borderColor: '#FFFFFF' }} />
          </View>
        )}
      </Animated.View>

      <View pointerEvents="none" style={{ position: 'absolute', left: vl + 12, bottom: vb + 10, backgroundColor: 'rgba(255,255,255,0.92)', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 5 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: Math.max(44, scaleM * k) }}>
          <Text style={{ fontSize: 10, fontWeight: '700', color: C.ink2 }}>0</Text>
          <Text style={{ fontSize: 10, fontWeight: '700', color: C.ink2 }}>{scaleM} m</Text>
        </View>
        <View style={{ width: scaleM * k, height: 5, borderWidth: 1.5, borderTopWidth: 0, borderColor: C.ink }} />
      </View>
    </View>
  );
}
