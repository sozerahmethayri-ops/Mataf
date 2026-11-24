import { memo, useId } from 'react';
import { Circle, Defs, Ellipse, LinearGradient, Path, Polygon, Rect, Stop } from 'react-native-svg';

import { isDark, nightColor } from '@/constants/theme';
import type { Prim } from '@/scene/oblique';

/** Sahne ilkel şekillerini react-native-svg ile çizer (koyu temada gece tonlarına çevrilir; `keep` olanlar hariç). */
export const Prims = memo(function Prims({ prims }: { prims: Prim[] }) {
  // Aynı sayfadaki başka SVG'lerle çakışmasın diye geçiş kimlikleri bileşene özgü
  const uid = `g${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const col = (p: Prim, c?: string) => (p.keep ? c : nightColor(c));
  const dark = isDark();
  const fillOf = (p: Prim, i: number, c?: string) => (p.grad ? `url(#${uid}_${i})` : dark && p.nfill ? p.nfill : col(p, c));
  const defs = prims.flatMap((p, i) => (p.grad ? [
    <LinearGradient key={i} id={`${uid}_${i}`} x1={p.grad.x1} y1={p.grad.y1} x2={p.grad.x2} y2={p.grad.y2} gradientUnits="userSpaceOnUse">
      {p.grad.stops.map(([o, c, a], j) => <Stop key={j} offset={o} stopColor={col(p, c)} stopOpacity={a ?? 1} />)}
    </LinearGradient>,
  ] : []));
  return (
    <>
      {defs.length ? <Defs>{defs}</Defs> : null}
      {prims.map((p, i) => {
        switch (p.t) {
          case 'poly': return <Polygon key={i} points={p.pts} fill={fillOf(p, i, p.fill)} stroke={col(p, p.stroke)} strokeWidth={p.sw} opacity={p.op} strokeLinejoin="round" />;
          case 'path': return <Path key={i} d={p.d} fill={fillOf(p, i, p.fill) ?? 'none'} stroke={col(p, p.stroke)} strokeWidth={p.sw} opacity={p.op} fillRule={p.rule} strokeLinecap={p.cap ?? 'round'} strokeLinejoin="round" />;
          case 'ell': return <Ellipse key={i} cx={p.cx} cy={p.cy} rx={p.rx} ry={p.ry} fill={fillOf(p, i, p.fill)} stroke={col(p, p.stroke)} strokeWidth={p.sw} opacity={p.op} />;
          case 'circ': return <Circle key={i} cx={p.cx} cy={p.cy} r={p.r} fill={fillOf(p, i, p.fill)} stroke={col(p, p.stroke)} strokeWidth={p.sw} opacity={p.op} />;
          case 'rect': return <Rect key={i} x={p.x} y={p.y} width={p.w} height={p.h} fill={fillOf(p, i, p.fill)} stroke={col(p, p.stroke)} strokeWidth={p.sw} opacity={p.op} />;
        }
      })}
    </>
  );
});
