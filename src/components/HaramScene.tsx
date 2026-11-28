import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, PanResponder, Platform, Pressable, Text, View, type ViewStyle } from 'react-native';
import Svg, { G, Path } from 'react-native-svg';
import { useIsFocused } from 'expo-router';

import { C, fs } from '@/constants/theme';
import { GATES, type City, type Pt } from '@/data/sites';
import { pick, useI18n } from '@/i18n';
import type { GateSummary } from '@/services/reports';
import { useTheme } from '@/services/ThemeContext';
import { fitCamera, NO_INSETS, niceScale, overlaps, placeLabels, textWidth, type Box, type Viewport } from '@/scene/layout';
import { buildMadinah, MADINAH_LABELS } from '@/scene/madinah';
import { buildMakkah, MAKKAH_LABELS } from '@/scene/makkah';
import { Cam, pathD } from '@/scene/oblique';
import { Prims } from './SvgPrims';
import { Icon } from './Icon';

const BASE_K: Record<City, number> = { makkah: 0.6, madinah: 0.56 };

/** Son kurulan sahneler (şehir, ölçek adımı, açı): geri dönüşlerde anında. */
const sceneCache = new Map<string, ReturnType<typeof buildMakkah>>();
function sceneFor(city: City, kq: number, rotDeg: number, ground: string) {
  // Zemin rengi anahtarda: şehir dokusu temaya göre çizilir
  const key = `${city}|${kq.toFixed(4)}|${rotDeg}|${ground}`;
  let s = sceneCache.get(key);
  if (!s) {
    const cam = new Cam(kq, 0, 0, rotDeg);
    s = city === 'makkah' ? buildMakkah(cam) : buildMadinah(cam);
    // Döndürme (45°'lik 8 açı) ve birkaç ölçek adımı önbellekte kalsın
    if (sceneCache.size >= 12) sceneCache.delete(sceneCache.keys().next().value as string);
    sceneCache.set(key, s);
  }
  return s;
}
const AnimatedPath = Animated.createAnimatedComponent(Path);

// İşaret ölçüleri (px)
const PIN = 28; // kapı dairesi
const STEM = 10;
const MINOR = 18; // diğer kapıların dairesi
const MINOR_K = 1.0; // diğer kapılar bu yakınlıktan (piksel/metre) sonra görünür
const LABEL_H = 18;
const DEST_H = 24;
const PIN_CLOSED = '#B42318';
const PIN_OPEN = '#0F766E';
const PIN_LIMITED = '#F5A524';

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
  /** Haritanın dönüşü (°, saat yönü). Varsayılan -35 (eğik kuzey). */
  rotDeg?: number;
  /** İki parmak hareketi bitince: yakınlaştırma çarpanı ve dönüş farkı (°). */
  onTransform?: (scale: number, rotDelta: number) => void;
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

const WEB_NO_TOUCH = (Platform.OS === 'web' ? { touchAction: 'none' } : null) as ViewStyle | null;

export function HaramScene(props: SceneProps) {
  const {
    city, width, height, zoom = 1, focus = [0, 0], focusAt = [0.5, 0.45], fit, viewport = NO_INSETS, avoid = [], recenterKey = 0, xray = true,
    route, traveled, user, dest, destLabel, summaries, routeGateId, onGatePress, labels = true, pannable = true,
    rotDeg = -35, onTransform,
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
      return fitCamera(pts, width, height, { top: vt, bottom: vb, left: vl, right: vr }, { zoom, headroom: 28, kMin: 0.18, kMax: 2.4, rotDeg });
    }
    return Cam.centeredOn(BASE_K[city] * zoom, [fx, fy], width * ax, height * ay, rotDeg);
  }, [fitKey, city, zoom, fx, fy, width, height, ax, ay, vt, vb, vl, vr, rotDeg]);
  const k = cam.k;
  // Sahne ölçeği %20'lik adımlara yuvarlanıp orijinde kurulur; kaydırma ve aradaki ölçek farkı SVG dönüşümüyle
  // uygulanır. Böylece konum güncellemeleri ve yakınlaştırma düğmeleri sahneyi çoğu zaman yeniden kurdurmaz
  // (önceden %6'lık adımlarla her basışta binlerce şekil yeniden hesaplanıyordu).
  const kq = Math.pow(1.2, Math.round(Math.log(k) / Math.log(1.2)));
  const ground = C.mapGround;
  const scene = useMemo(() => sceneFor(city, kq, rotDeg, ground), [city, kq, rotDeg, ground]);
  const sceneTf = `translate(${cam.ox.toFixed(2)} ${cam.oy.toFixed(2)}) scale(${(k / kq).toFixed(4)})`;

  // Kaydırma (tek parmak) ve iki parmakla büyütme/döndürme. Hareket sırasında görüntü 2D dönüşümle
  // anında izler; parmaklar kalkınca sahne yeni ölçek ve açıyla gerçek 3D olarak yeniden çizilir.
  const [pan] = useState(() => new Animated.ValueXY({ x: 0, y: 0 }));
  const [pinch] = useState(() => new Animated.Value(1));
  const [twist] = useState(() => new Animated.Value(0));
  const transformCb = useRef(onTransform);
  useEffect(() => { transformCb.current = onTransform; });
  useEffect(() => { pan.setValue({ x: 0, y: 0 }); pan.setOffset({ x: 0, y: 0 }); }, [pan, cam, recenterKey]);
  const responder = useMemo(() => {
    const g = { mode: 'none' as 'none' | 'pinch', d0: 1, a0: 0, scale: 1, rot: 0 }; // hareket boyunca geçici durum
    // transformCb yalnız dokunma olayında (parmak kalkınca) okunur, çizim sırasında değil.
    // eslint-disable-next-line react-hooks/refs
    return PanResponder.create({
    onStartShouldSetPanResponder: (e) => pannable && e.nativeEvent.touches.length >= 2,
    onMoveShouldSetPanResponder: (e, s) => pannable && (e.nativeEvent.touches.length >= 2 || Math.abs(s.dx) > 6 || Math.abs(s.dy) > 6),
    onPanResponderGrant: () => pan.extractOffset(),
    onPanResponderMove: (e, s) => {
      const t = e.nativeEvent.touches;
      if (t.length >= 2) {
        const dx = t[1].pageX - t[0].pageX;
        const dy = t[1].pageY - t[0].pageY;
        const d = Math.max(1, Math.hypot(dx, dy));
        const a = (Math.atan2(dy, dx) * 180) / Math.PI;
        if (g.mode !== 'pinch') { g.mode = 'pinch'; g.d0 = d; g.a0 = a; }
        g.scale = Math.min(3, Math.max(0.35, d / g.d0));
        g.rot = ((a - g.a0 + 540) % 360) - 180;
        pinch.setValue(g.scale);
        twist.setValue(g.rot);
      } else if (g.mode === 'none') {
        pan.setValue({ x: s.dx, y: s.dy });
      }
    },
    onPanResponderRelease: () => {
      pan.flattenOffset();
      if (g.mode === 'pinch') {
        // Küçük titremeleri yok say: %4'ten az ölçek, 4°'den az dönüş
        const sc = Math.abs(g.scale - 1) < 0.04 ? 1 : g.scale;
        const rt = Math.abs(g.rot) < 4 ? 0 : g.rot;
        if (sc !== 1 || rt !== 0) transformCb.current?.(sc, rt);
        pinch.setValue(1);
        twist.setValue(0);
      }
      g.mode = 'none';
    },
    onPanResponderTerminationRequest: () => false,
    });
  }, [pan, pinch, twist, pannable]);
  const twistDeg = twist.interpolate({ inputRange: [-360, 360], outputRange: ['-360deg', '360deg'] });

  // Akan turuncu iz: SVG çizgisi yerel sürücüyle canlandırılamaz, her karede JS iş parçacığını meşgul eder.
  // Bu yüzden yalnız ekran öndeyken, rota varken ve "hareketi azalt" kapalıyken akar; arka plandaki sekme
  // (ör. Harita açık kalıp Kur'an'a geçince) uygulamanın geri kalanını yavaşlatmaz.
  const focused = useIsFocused();
  const { prefs } = useTheme();
  const hasRoute = !!route && route.length > 1;
  const [dash] = useState(() => new Animated.Value(0));
  useEffect(() => {
    if (!focused || !hasRoute || prefs.reduceMotion) return;
    const loop = Animated.loop(Animated.timing(dash, { toValue: -30, duration: 1400, easing: Easing.linear, useNativeDriver: false }));
    loop.start();
    return () => loop.stop();
  }, [dash, focused, hasRoute, prefs.reduceMotion]);

  const routeD = route && route.length > 1 ? pathD(cam, route) : undefined;
  const doneD = traveled && traveled.length > 1 ? pathD(cam, traveled) : undefined;
  const P = (p: Pt, h = 0) => cam.P(p[0], p[1], h);
  const scaleM = niceScale(k);

  // Sabit işaretler (kapı, hedef, kullanıcı) önce; yapı etiketleri bunlarla çakışmayacak yere yerleşir.
  // Ana kapılar (ve rotadaki kapı) iğneyle; diğer kapılar yakınlaşınca küçük numaralı daireyle, çakışmadan
  const gates = GATES.filter((g) => g.city === city && (g.main || g.id === routeGateId)).map((g) => {
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
      const [x, y] = city === 'makkah' ? P([0, 0], 7) : P(MADINAH_LABELS[0].pos, 16);
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
  const taken: Box[] = [...fixed, ...Object.values(placed).filter((x): x is Box => !!x)];
  const minor: { g: (typeof GATES)[number]; x: number; y: number }[] = [];
  if (k >= MINOR_K) {
    for (const g of GATES) {
      if (g.city !== city || g.main || g.id === routeGateId) continue;
      const [x, y] = P(g.pos);
      if (x < 0 || x > width || y < 0 || y > height) continue;
      const b: Box = { x: x - MINOR / 2 - 1, y: y - MINOR / 2 - 1, w: MINOR + 2, h: MINOR + 2 };
      if (taken.some((o) => overlaps(o, b))) continue;
      taken.push(b);
      minor.push({ g, x, y });
    }
  }
  // Etiket noktanın tam üstündeyse kısa bir sap çizilir.
  const destStem = destXY && destBox && Math.abs(destBox.x + destBox.w / 2 - destXY[0]) < 1 && destBox.y + destBox.h <= destXY[1] - 6;

  return (
    // Web önizlemesinde tarayıcının kendi sayfa yakınlaştırması iki parmak hareketini yutmasın
    <View style={[{ width, height, overflow: 'hidden', backgroundColor: C.mapGround }, WEB_NO_TOUCH]} {...responder.panHandlers}>
      <Animated.View style={{ position: 'absolute', left: 0, top: 0, width, height, transform: [...pan.getTranslateTransform(), { scale: pinch }, { rotate: twistDeg }] }}>
        <Svg width={width} height={height} accessibilityLabel="3D harita">
          <G transform={sceneTf}>
            <Prims prims={scene.below} />
            <Prims prims={scene.above} />
            {scene.ghost.length > 0 && (
              <G opacity={xray ? 0.42 : 1}>
                <Prims prims={scene.ghost} />
              </G>
            )}
          </G>
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
            <View key={l.key} pointerEvents="none" style={{ position: 'absolute', left: b.x, top: b.y, width: b.w, height: b.h, borderRadius: 9, backgroundColor: C.overlay, alignItems: 'center', justifyContent: 'center' }}>
              <Text numberOfLines={1} style={{ fontSize: fs(10), fontWeight: '700', color: C.ink2 }}>{pick(l.text, lang)}</Text>
            </View>
          );
        })}

        {minor.map(({ g, x, y }) => {
          const s = summaries[g.id]?.status ?? 'open';
          const bg = s === 'closed' ? PIN_CLOSED : s === 'open' ? PIN_OPEN : PIN_LIMITED;
          return (
            <Pressable key={g.id} accessibilityRole="button" accessibilityLabel={`${pick(g.name, lang)} · ${s}`} onPress={() => onGatePress?.(g.id)} hitSlop={8}
              style={{ position: 'absolute', left: x - MINOR / 2, top: y - MINOR / 2, width: MINOR, height: MINOR, borderRadius: MINOR / 2, backgroundColor: bg, borderWidth: 1.5, borderColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ color: s !== 'open' && s !== 'closed' ? '#17181C' : '#FFFFFF', fontSize: g.no.length > 2 ? 7 : 8, fontWeight: '700' }}>{g.no.split('–')[0]}</Text>
            </Pressable>
          );
        })}

        {gates.map(({ g, x, y }) => {
          if (x < -20 || x > width + 20 || y < -10 || y > height + 50) return null;
          const s = summaries[g.id]?.status ?? 'open';
          const isRoute = g.id === routeGateId;
          // İşaret renkleri temadan bağımsız (koyu haritada da doygun kalsın); rota kapısı palet rengini alır
          const bg = isRoute ? C.accent : s === 'closed' ? PIN_CLOSED : s === 'open' ? PIN_OPEN : PIN_LIMITED;
          const fg = isRoute ? C.onAccent : s !== 'open' && s !== 'closed' ? '#17181C' : '#FFFFFF';
          return (
            <Pressable key={g.id} accessibilityRole="button" accessibilityLabel={`${pick(g.name, lang)} · ${s}`} onPress={() => onGatePress?.(g.id)} hitSlop={6}
              style={{ position: 'absolute', left: x - PIN / 2, top: y - PIN - STEM, width: PIN, height: PIN + STEM, alignItems: 'center' }}>
              <View style={{ width: PIN, height: PIN, borderRadius: PIN / 2, backgroundColor: bg, borderWidth: 2, borderColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ color: fg, fontSize: g.no.length > 2 ? 9 : 11, fontWeight: '700' }}>{g.no}</Text>
                {s === 'closed' && (
                  <View style={{ position: 'absolute', right: -6, top: -6, width: 14, height: 14, borderRadius: 7, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon name="close" size={9} color={PIN_CLOSED} width={4} />
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
                <Icon name="flag" size={12} color={C.onAccent} width={2.4} />
                <Text numberOfLines={1} style={{ fontSize: fs(11), fontWeight: '700', color: C.onAccent }}>{destLabel}</Text>
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

      <View pointerEvents="none" style={{ position: 'absolute', left: vl + 12, bottom: vb + 10, backgroundColor: C.overlay, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 5 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: Math.max(44, scaleM * k) }}>
          <Text style={{ fontSize: fs(10), fontWeight: '700', color: C.ink2 }}>0</Text>
          <Text style={{ fontSize: fs(10), fontWeight: '700', color: C.ink2 }}>{scaleM} m</Text>
        </View>
        <View style={{ width: scaleM * k, height: 5, borderWidth: 1.5, borderTopWidth: 0, borderColor: C.ink }} />
        {/* 3D bina verisi OpenStreetMap'ten (ODbL): atıf haritada görünür olmalı */}
        <Text style={{ fontSize: fs(8), color: C.ink2, marginTop: 3 }}>© OpenStreetMap</Text>
      </View>
    </View>
  );
}
