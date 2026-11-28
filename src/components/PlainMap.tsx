// Sade harita: online harita açılamadığında (internet ya da WebGL yok) ve web'de harita yüklenemezse kullanılır.
// Noktalar, rota çizgileri ve konumunuz gerçek oranlarıyla çizilir; noktaya dokununca seçilir, uzun basınca o nokta
// hedef olur. Tek parmakla kaydırılır, iki parmakla ya da +/− düğmeleriyle yakınlaştırılır (0.24.0).
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Animated, PanResponder, Platform, Pressable, Text, View, type GestureResponderEvent, type LayoutChangeEvent, type ViewStyle } from 'react-native';
import Svg, { Circle, G, Path, Text as SvgText } from 'react-native-svg';

import { C, fs, shadow } from '@/constants/theme';
import { pick, useI18n } from '@/i18n';
import { niceScale } from '@/scene/layout';
import { Icon } from './Icon';

export type PlainLL = { lat: number; lng: number };
export type PlainPin = PlainLL & { id: string; color: string; label?: string; big?: boolean; minor?: boolean; num?: string };
export type PlainLine = { coords: PlainLL[]; color: string; dashed?: boolean; width?: number };
/** Dolgulu alan (ör. Arafat sınırı). Çerçevelemeye katılmaz. */
export type PlainArea = { coords: PlainLL[]; color: string; opacity?: number; outline?: boolean; dashed?: boolean };

type Props = {
  pins: PlainPin[];
  lines?: PlainLine[];
  areas?: PlainArea[];
  user?: PlainLL | null;
  selectedId?: string;
  onPin?: (id: string) => void;
  onLongPress?: (p: PlainLL) => void;
  /** Hiç nokta yokken gösterilecek merkez (≈600 m çevresi). */
  center?: PlainLL;
  /** Dışarıdaki +/− düğmelerinin toplam adımı (her adım ×1,6). */
  zoomLevel?: number;
  /** Haritanın kendi +/− düğmeleri (sağ ortada). */
  buttons?: boolean;
};

const M = 111320;
const STEP = 1.6;
const clampZ = (z: number) => Math.min(60, Math.max(0.2, z));
const WEB_NO_TOUCH = (Platform.OS === 'web' ? { touchAction: 'none' } : null) as ViewStyle | null;
const L = {
  zin: { tr: 'Yakınlaştır', en: 'Zoom in', ar: 'تكبير' },
  zout: { tr: 'Uzaklaştır', en: 'Zoom out', ar: 'تصغير' },
};

export function PlainMap({ pins, lines = [], areas = [], user, selectedId, onPin, onLongPress, center, zoomLevel = 0, buttons = false }: Props) {
  const { lang } = useI18n();
  const [box, setBox] = useState({ w: 0, h: 0 });
  const onLayout = (e: LayoutChangeEvent) => setBox({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height });
  // Kullanıcının görünümü: z = iki parmak çarpanı, x/y = kaydırma (yakınlaştırmasız px; böylece +/− ekran ortasını
  // sabit tutar). Hareket sırasında görüntü Animated dönüşümle izler; parmaklar kalkınca yeni görünümle yeniden çizilir.
  const [view, setView] = useState({ z: 1, x: 0, y: 0 });
  const zNow = useRef(1);
  const [own, setOwn] = useState(0);
  const [anim] = useState(() => ({ t: new Animated.ValueXY({ x: 0, y: 0 }), s: new Animated.Value(1) }));
  useLayoutEffect(() => {
    anim.t.setValue({ x: 0, y: 0 });
    anim.s.setValue(1);
  }, [anim, view]);
  const responder = useMemo(() => {
    const g = { pinch: false, d0: 1, m0: [0, 0], b: [0, 0], ds: 1, t: [0, 0] };
    const commit = () => {
      const { ds, t } = g;
      const zz = zNow.current * ds;
      if (ds !== 1 || t[0] || t[1]) setView((v) => ({ z: clampZ(v.z * ds), x: v.x + t[0] / zz, y: v.y + t[1] / zz }));
      g.pinch = false;
      g.ds = 1;
      g.t = [0, 0];
    };
    // zNow yalnız dokunma olayında (parmak kalkınca) okunur, çizim sırasında değil.
    return PanResponder.create({
      onStartShouldSetPanResponder: (e) => e.nativeEvent.touches.length >= 2,
      onMoveShouldSetPanResponder: (e, s) => e.nativeEvent.touches.length >= 2 || Math.abs(s.dx) > 6 || Math.abs(s.dy) > 6,
      onPanResponderGrant: () => { g.pinch = false; g.ds = 1; g.t = [0, 0]; },
      onPanResponderMove: (e, s) => {
        const t = e.nativeEvent.touches;
        if (t.length >= 2) {
          const d = Math.max(1, Math.hypot(t[1].pageX - t[0].pageX, t[1].pageY - t[0].pageY));
          const mx = (t[0].pageX + t[1].pageX) / 2;
          const my = (t[0].pageY + t[1].pageY) / 2;
          if (!g.pinch) { g.pinch = true; g.d0 = d / g.ds; g.m0 = [mx, my]; g.b = [g.t[0], g.t[1]]; }
          g.ds = Math.min(8, Math.max(0.15, d / g.d0));
          g.t = [g.b[0] + mx - g.m0[0], g.b[1] + my - g.m0[1]];
        } else if (!g.pinch) {
          g.t = [s.dx, s.dy];
        }
        anim.t.setValue({ x: g.t[0], y: g.t[1] });
        anim.s.setValue(g.ds);
      },
      onPanResponderRelease: commit,
      onPanResponderTerminate: commit,
      onPanResponderTerminationRequest: () => false,
    });
  }, [anim]);

  const all: PlainLL[] = [...pins, ...lines.flatMap((l) => l.coords), ...(user ? [user] : [])];
  if (!all.length && center) all.push(center);
  const lat0 = all.length ? all.reduce((a, p) => a + p.lat, 0) / all.length : 0;
  const kx = Math.cos((lat0 * Math.PI) / 180);
  const X = (p: PlainLL) => p.lng * M * kx;
  const Y = (p: PlainLL) => -p.lat * M;
  let x0 = Math.min(...all.map(X)), x1 = Math.max(...all.map(X));
  let y0 = Math.min(...all.map(Y)), y1 = Math.max(...all.map(Y));
  // En az ~600 m'lik alan göster (tek nokta, yakın noktalar)
  const minSpan = 600;
  if (x1 - x0 < minSpan) { const c = (x0 + x1) / 2; x0 = c - minSpan / 2; x1 = c + minSpan / 2; }
  if (y1 - y0 < minSpan) { const c = (y0 + y1) / 2; y0 = c - minSpan / 2; y1 = c + minSpan / 2; }
  const pad = 34;
  const k0 = box.w ? Math.min((box.w - 2 * pad) / (x1 - x0), (box.h - 2 * pad - 24) / (y1 - y0)) : 0;
  // Kullanıcı görünümü: ekran ortası çevresinde z kat, sonra kaydırma
  const z = clampZ(view.z * Math.pow(STEP, zoomLevel + own));
  useEffect(() => { zNow.current = z; });
  const k = k0 * z;
  const cx = box.w / 2;
  const cy = box.h / 2;
  const ox = cx + (box.w / 2 - (k0 * (x0 + x1)) / 2 - cx + view.x) * z;
  const oy = cy + ((box.h - 24) / 2 - (k0 * (y0 + y1)) / 2 - cy + view.y) * z;
  const S = (p: PlainLL): [number, number] => [ox + k * X(p), oy + k * Y(p)];
  const unS = (sx: number, sy: number): PlainLL => ({ lat: -((sy - oy) / k) / M, lng: (sx - ox) / k / (M * kx) });
  const step = niceScale(k, 90);

  // Izgara görünen alanın tamamını kaplar (kaydırınca boş kenar kalmasın)
  const grid: string[] = [];
  if (k > 0) {
    const g = step * 2;
    const gx0 = (0 - ox) / k, gx1 = (box.w - ox) / k, gy0 = (0 - oy) / k, gy1 = (box.h - oy) / k;
    if ((gx1 - gx0) / g < 80 && (gy1 - gy0) / g < 160) {
      for (let gx = Math.ceil(gx0 / g) * g; gx < gx1; gx += g) { const sx = ox + k * gx; grid.push(`M${sx.toFixed(1)} 0 L${sx.toFixed(1)} ${box.h}`); }
      for (let gy = Math.ceil(gy0 / g) * g; gy < gy1; gy += g) { const sy = oy + k * gy; grid.push(`M0 ${sy.toFixed(1)} L${box.w} ${sy.toFixed(1)}`); }
    }
  }
  const onLong = (e: GestureResponderEvent) => { if (k > 0) onLongPress?.(unS(e.nativeEvent.locationX, e.nativeEvent.locationY)); };
  const sel = pins.find((p) => p.id === selectedId);

  return (
    <View style={[{ flex: 1, backgroundColor: C.mapGround, overflow: 'hidden' }, WEB_NO_TOUCH]} onLayout={onLayout} {...responder.panHandlers}>
      {k > 0 && (
        <Animated.View style={{ flex: 1, transform: [...anim.t.getTranslateTransform(), { scale: anim.s }] }}>
          <Pressable style={{ flex: 1 }} onLongPress={onLongPress ? onLong : undefined} delayLongPress={450}>
            <Svg width={box.w} height={box.h}>
              <Path d={grid.join(' ')} stroke={C.border} strokeWidth={1} opacity={0.7} />
              {areas.map((a, i) => a.coords.length > 2 && (
                <Path key={`a${i}`} d={a.coords.map((p, j) => { const [x, y] = S(p); return `${j ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`; }).join(' ') + 'Z'}
                  fill={a.color} fillOpacity={a.opacity ?? 0.15} stroke={a.outline === false ? 'none' : a.color} strokeWidth={2} strokeDasharray={a.dashed ? '2 6' : undefined} />
              ))}
              {lines.map((l, i) => l.coords.length > 1 && (
                <Path key={i} d={l.coords.map((p, j) => { const [a, b] = S(p); return `${j ? 'L' : 'M'}${a.toFixed(1)} ${b.toFixed(1)}`; }).join(' ')}
                  stroke={l.color} strokeWidth={l.width ?? 5} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={l.dashed ? '2 8' : undefined} fill="none" />
              ))}
              {pins.map((p) => {
                const [a, b] = S(p);
                if (a < -30 || b < -30 || a > box.w + 30 || b > box.h + 30) return null;
                const r = p.big || p.id === selectedId ? 9 : p.minor ? 4 : 6.5;
                return (
                  <G key={p.id} onPress={onPin ? () => onPin(p.id) : undefined}>
                    <Circle cx={a} cy={b} r={r + 7} fill="transparent" />
                    <Circle cx={a} cy={b} r={r} fill={p.color} stroke="#FFFFFF" strokeWidth={2} />
                    {p.num && z >= 2.5 ? <SvgText x={a} y={b - 8} fontSize={10} fontWeight="700" fill={C.ink} textAnchor="middle">{p.num}</SvgText> : null}
                  </G>
                );
              })}
              {sel?.label && (() => {
                const [a, b] = S(sel);
                return <SvgText x={a} y={b - 15} fontSize={12} fontWeight="700" fill={C.ink} textAnchor="middle">{sel.label}</SvgText>;
              })()}
              {user && (() => {
                const [a, b] = S(user);
                return (
                  <G>
                    <Circle cx={a} cy={b} r={16} fill={C.user} opacity={0.16} />
                    <Circle cx={a} cy={b} r={7} fill={C.user} stroke="#FFFFFF" strokeWidth={2.5} />
                  </G>
                );
              })()}
            </Svg>
          </Pressable>
        </Animated.View>
      )}
      {buttons && (
        <View style={[{ position: 'absolute', right: 12, top: '42%', width: 44, borderRadius: 22, backgroundColor: C.bg, overflow: 'hidden' }, shadow]}>
          <Pressable onPress={() => setOwn((n) => n + 1)} accessibilityRole="button" accessibilityLabel={pick(L.zin, lang)} style={{ height: 44, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="plus" color={C.ink} />
          </Pressable>
          <View style={{ height: 1, marginHorizontal: 10, backgroundColor: C.border }} />
          <Pressable onPress={() => setOwn((n) => n - 1)} accessibilityRole="button" accessibilityLabel={pick(L.zout, lang)} style={{ height: 44, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="minus" color={C.ink} />
          </Pressable>
        </View>
      )}
      <View pointerEvents="none" style={{ position: 'absolute', left: 10, bottom: 10, backgroundColor: C.overlay, borderRadius: 8, paddingHorizontal: 7, paddingVertical: 4 }}>
        <Text style={{ fontSize: fs(10), fontWeight: '700', color: C.ink2 }}>{step >= 1000 ? `${step / 1000} km` : `${step} m`}</Text>
        <View style={{ width: step * k, height: 4, borderWidth: 1.5, borderTopWidth: 0, borderColor: C.ink }} />
      </View>
    </View>
  );
}
