// Web önizlemesi: yerel harita yok; rota basit bir çizimle gösterilir (telefonda gerçek harita açılır).
import { Linking, Pressable, Text, View, type LayoutChangeEvent } from 'react-native';
import { useState } from 'react';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

import { C } from '@/constants/theme';
import type { TransportMapProps } from './TransportMap.types';

export function TransportMap({ user, dest, segments }: TransportMapProps) {
  const [box, setBox] = useState({ w: 0, h: 0 });
  const pts = [...(user ? [user] : []), ...(dest ? [dest] : []), ...segments.flatMap((s) => s.coords)];
  const onLayout = (e: LayoutChangeEvent) => setBox({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height });
  let proj: ((p: { lat: number; lng: number }) => [number, number]) | null = null;
  if (pts.length && box.w) {
    const lat0 = pts.reduce((a, p) => a + p.lat, 0) / pts.length;
    const kx = Math.cos((lat0 * Math.PI) / 180);
    const xs = pts.map((p) => p.lng * kx);
    const ys = pts.map((p) => -p.lat);
    const [x0, x1, y0, y1] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
    const pad = 36;
    const k = Math.min((box.w - 2 * pad) / Math.max(1e-6, x1 - x0), (box.h - 2 * pad) / Math.max(1e-6, y1 - y0), 4e5);
    const cx = box.w / 2 - (k * (x0 + x1)) / 2;
    const cy = box.h / 2 - (k * (y0 + y1)) / 2;
    proj = (p) => [cx + k * p.lng * kx, cy - k * p.lat];
  }
  const P = proj;
  const p = dest ?? user;
  return (
    <View style={{ flex: 1, backgroundColor: C.mapGround }} onLayout={onLayout}>
      {P && (
        <Svg width={box.w} height={box.h} style={{ position: 'absolute' }}>
          <Rect x={0} y={0} width={box.w} height={box.h} fill={C.mapGround} />
          {segments.map((s, i) => (
            <Path key={i} d={s.coords.map((c, j) => `${j ? 'L' : 'M'}${P(c)[0].toFixed(1)},${P(c)[1].toFixed(1)}`).join('')}
              stroke={s.color} strokeWidth={s.dashed ? 4 : 6} strokeDasharray={s.dashed ? '2 8' : undefined} strokeLinecap="round" strokeLinejoin="round" fill="none" />
          ))}
          {dest && <Circle cx={P(dest)[0]} cy={P(dest)[1]} r={9} fill={C.accent} stroke="#FFFFFF" strokeWidth={3} />}
          {user && <Circle cx={P(user)[0]} cy={P(user)[1]} r={8} fill={C.user} stroke="#FFFFFF" strokeWidth={3} />}
        </Svg>
      )}
      {p && (
        <Pressable onPress={() => Linking.openURL(`https://www.openstreetmap.org/?mlat=${p.lat}&mlon=${p.lng}#map=16/${p.lat}/${p.lng}`)}
          style={{ position: 'absolute', right: 8, bottom: 8, backgroundColor: C.overlay, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 }}>
          <Text style={{ fontSize: 11, color: C.ink2 }}>Önizleme · © OpenStreetMap ↗</Text>
        </Pressable>
      )}
    </View>
  );
}
