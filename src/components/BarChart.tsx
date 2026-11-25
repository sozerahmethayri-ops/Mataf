// Küçük çubuk grafik (son günler): tek renk, değer çubuğun üstünde, gün adı altta. Bugün koyu, diğerleri açık.
import { Platform } from 'react-native';
import Svg, { G, Line, Rect, Text as SvgText } from 'react-native-svg';

import { C } from '@/constants/theme';

const FONT = Platform.OS === 'web' ? 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif' : undefined;

export function BarChart({ data, width, height = 150, color = C.accent, highlightLast = true }: {
  data: { label: string; value: number }[]; width: number; height?: number; color?: string; highlightLast?: boolean;
}) {
  const top = 18;
  const bottom = 22;
  const h = height - top - bottom;
  const max = Math.max(1, ...data.map((d) => d.value));
  const slot = width / Math.max(1, data.length);
  const bw = Math.min(34, slot * 0.62);
  return (
    <Svg width={width} height={height}>
      <Line x1={0} y1={top + h} x2={width} y2={top + h} stroke={C.border} strokeWidth={1} />
      {data.map((d, i) => {
        const bh = d.value ? Math.max(3, (h * d.value) / max) : 0;
        const x = i * slot + (slot - bw) / 2;
        const last = highlightLast && i === data.length - 1;
        return (
          <G key={i}>
            {bh > 0 && <Rect x={x} y={top + h - bh} width={bw} height={bh} rx={4} fill={color} opacity={last ? 1 : 0.45} />}
            {d.value > 0 && (
              <SvgText x={x + bw / 2} y={top + h - bh - 5} fontSize={11} fontWeight="700" fill={C.ink} textAnchor="middle" fontFamily={FONT}>
                {d.value >= 10000 ? `${Math.round(d.value / 1000)}k` : String(d.value)}
              </SvgText>
            )}
            <SvgText x={x + bw / 2} y={height - 6} fontSize={11} fill={last ? C.ink : C.muted} fontWeight={last ? '700' : '400'} textAnchor="middle" fontFamily={FONT}>
              {d.label}
            </SvgText>
          </G>
        );
      })}
    </Svg>
  );
}
