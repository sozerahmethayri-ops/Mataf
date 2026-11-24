// Sade harita: Google Haritalar anahtarı olmadan derlenen Android uygulamasında (ve web önizlemesinde)
// yerel harita yerine kullanılır. Noktalar, rota çizgileri ve konumunuz gerçek oranlarıyla çizilir;
// noktaya dokununca seçilir, uzun basınca o nokta hedef olur, "Haritada aç" telefonun harita uygulamasını açar.
import { useState } from 'react';
import { Linking, Pressable, Text, View, type GestureResponderEvent, type LayoutChangeEvent } from 'react-native';
import Svg, { Circle, G, Path, Text as SvgText } from 'react-native-svg';

import { C } from '@/constants/theme';
import { niceScale } from '@/scene/layout';

export type PlainLL = { lat: number; lng: number };
export type PlainPin = PlainLL & { id: string; color: string; label?: string; big?: boolean };
export type PlainLine = { coords: PlainLL[]; color: string; dashed?: boolean; width?: number };

type Props = {
  pins: PlainPin[];
  lines?: PlainLine[];
  user?: PlainLL | null;
  selectedId?: string;
  onPin?: (id: string) => void;
  onLongPress?: (p: PlainLL) => void;
  /** Hiç nokta yokken gösterilecek merkez (≈600 m çevresi). */
  center?: PlainLL;
};

const M = 111320;

export function PlainMap({ pins, lines = [], user, selectedId, onPin, onLongPress, center }: Props) {
  const [box, setBox] = useState({ w: 0, h: 0 });
  const onLayout = (e: LayoutChangeEvent) => setBox({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height });
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
  const k = box.w ? Math.min((box.w - 2 * pad) / (x1 - x0), (box.h - 2 * pad - 24) / (y1 - y0)) : 0;
  const ox = box.w / 2 - (k * (x0 + x1)) / 2;
  const oy = (box.h - 24) / 2 - (k * (y0 + y1)) / 2;
  const S = (p: PlainLL): [number, number] => [ox + k * X(p), oy + k * Y(p)];
  const unS = (sx: number, sy: number): PlainLL => ({ lat: -((sy - oy) / k) / M, lng: (sx - ox) / k / (M * kx) });
  const step = niceScale(k, 90);
  const focus = pins.find((p) => p.id === selectedId) ?? pins[0] ?? user ?? center;

  const grid: string[] = [];
  if (k > 0) {
    const g = step * 2;
    for (let gx = Math.ceil((x0 - 2000) / g) * g; gx < x1 + 2000; gx += g) { const sx = ox + k * gx; if (sx > -1 && sx < box.w + 1) grid.push(`M${sx.toFixed(1)} 0 L${sx.toFixed(1)} ${box.h}`); }
    for (let gy = Math.ceil((y0 - 2000) / g) * g; gy < y1 + 2000; gy += g) { const sy = oy + k * gy; if (sy > -1 && sy < box.h + 1) grid.push(`M0 ${sy.toFixed(1)} L${box.w} ${sy.toFixed(1)}`); }
  }
  const onLong = (e: GestureResponderEvent) => { if (k > 0) onLongPress?.(unS(e.nativeEvent.locationX, e.nativeEvent.locationY)); };
  const sel = pins.find((p) => p.id === selectedId);

  return (
    <View style={{ flex: 1, backgroundColor: C.mapGround }} onLayout={onLayout}>
      {k > 0 && (
        <Pressable style={{ flex: 1 }} onLongPress={onLongPress ? onLong : undefined} delayLongPress={450}>
          <Svg width={box.w} height={box.h}>
            <Path d={grid.join(' ')} stroke={C.border} strokeWidth={1} opacity={0.7} />
            {lines.map((l, i) => l.coords.length > 1 && (
              <Path key={i} d={l.coords.map((p, j) => { const [a, b] = S(p); return `${j ? 'L' : 'M'}${a.toFixed(1)} ${b.toFixed(1)}`; }).join(' ')}
                stroke={l.color} strokeWidth={l.width ?? 5} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={l.dashed ? '2 8' : undefined} fill="none" />
            ))}
            {pins.map((p) => {
              const [a, b] = S(p);
              const r = p.big || p.id === selectedId ? 9 : 6.5;
              return (
                <G key={p.id} onPress={onPin ? () => onPin(p.id) : undefined}>
                  <Circle cx={a} cy={b} r={r + 7} fill="transparent" />
                  <Circle cx={a} cy={b} r={r} fill={p.color} stroke="#FFFFFF" strokeWidth={2} />
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
      )}
      <View pointerEvents="none" style={{ position: 'absolute', left: 10, bottom: 10, backgroundColor: C.overlay, borderRadius: 8, paddingHorizontal: 7, paddingVertical: 4 }}>
        <Text style={{ fontSize: 10, fontWeight: '700', color: C.ink2 }}>{step} m</Text>
        <View style={{ width: step * k, height: 4, borderWidth: 1.5, borderTopWidth: 0, borderColor: C.ink }} />
      </View>
      {focus && (
        <Pressable onPress={() => Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${focus.lat},${focus.lng}`)}
          style={{ position: 'absolute', right: 10, bottom: 10, backgroundColor: C.overlay, borderRadius: 8, paddingHorizontal: 9, paddingVertical: 5 }}>
          <Text style={{ fontSize: 11, fontWeight: '700', color: C.accent }}>Haritada aç ↗</Text>
        </Pressable>
      )}
    </View>
  );
}
