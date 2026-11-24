import { memo } from 'react';
import { Circle, Ellipse, Path, Polygon, Rect } from 'react-native-svg';

import { nightColor as n } from '@/constants/theme';
import type { Prim } from '@/scene/oblique';

/** Sahne ilkel şekillerini react-native-svg ile çizer (koyu temada gece tonlarına çevrilir). */
export const Prims = memo(function Prims({ prims }: { prims: Prim[] }) {
  return (
    <>
      {prims.map((p, i) => {
        switch (p.t) {
          case 'poly': return <Polygon key={i} points={p.pts} fill={n(p.fill)} stroke={n(p.stroke)} strokeWidth={p.sw} opacity={p.op} />;
          case 'path': return <Path key={i} d={p.d} fill={n(p.fill) ?? 'none'} stroke={n(p.stroke)} strokeWidth={p.sw} opacity={p.op} fillRule={p.rule} />;
          case 'ell': return <Ellipse key={i} cx={p.cx} cy={p.cy} rx={p.rx} ry={p.ry} fill={n(p.fill)} stroke={n(p.stroke)} strokeWidth={p.sw} />;
          case 'circ': return <Circle key={i} cx={p.cx} cy={p.cy} r={p.r} fill={n(p.fill)} stroke={n(p.stroke)} strokeWidth={p.sw} />;
          case 'rect': return <Rect key={i} x={p.x} y={p.y} width={p.w} height={p.h} fill={n(p.fill)} stroke={n(p.stroke)} strokeWidth={p.sw} />;
        }
      })}
    </>
  );
});
