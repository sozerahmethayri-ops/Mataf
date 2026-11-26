// Gökyüzü yayı: güneşin yolu (yükseklik–saat; 8 saat öncesinden 16 saat sonrasına), vakitler bu yol üzerinde
// işaretli; şu an güneş ve ay nerede, ay hangi evrede. Ufkun üstü gökyüzü rengini alır (gündüz, alacakaranlık, gece).
import { useMemo, useState } from 'react';
import { View, type LayoutChangeEvent } from 'react-native';
import Svg, { Circle, ClipPath, Defs, G, Line, LinearGradient, Path, Rect, Stop, Text as SvgText } from 'react-native-svg';

import { C, fs, isDark } from '@/constants/theme';
import { fmtTime, type MethodId, type PrayerKey } from '@/services/prayer';
import { altitudeText, directionText, moonLitPath, moonPhaseName, skyDay, skyNow, skyPhase, type SkySample } from '@/services/sky';

type Lang = 'tr' | 'en' | 'ar';
type Props = {
  now: Date;
  lat: number;
  lng: number;
  tz?: string;
  method: MethodId;
  nextKey?: PrayerKey;
  /** Sıradaki vaktin anı (aynı adlı dünkü/yarınki vakitle karışmasın) */
  nextAt?: Date;
  /** Vakit adları (kısa) */
  names: Record<PrayerKey, string>;
  lang: Lang;
  height?: number;
};

// Sabit "yıldız" yerleri (0–1 aralığında), gece görünür
const STARS = [[0.06, 0.18], [0.14, 0.42], [0.22, 0.12], [0.31, 0.3], [0.4, 0.08], [0.47, 0.36], [0.56, 0.16], [0.63, 0.44], [0.71, 0.1], [0.79, 0.28], [0.86, 0.14], [0.93, 0.38], [0.35, 0.52], [0.67, 0.56]];

function altAt(samples: SkySample[], t: number) {
  if (t <= samples[0].t) return samples[0].alt;
  for (let i = 1; i < samples.length; i++) {
    const b = samples[i];
    if (t <= b.t) {
      const a = samples[i - 1];
      return a.alt + ((b.alt - a.alt) * (t - a.t)) / (b.t - a.t);
    }
  }
  return samples[samples.length - 1].alt;
}

export function SkyArc({ now, lat, lng, tz, method, nextKey, nextAt, names, lang, height = 168 }: Props) {
  const [w, setW] = useState(0);
  const onLayout = (e: LayoutChangeEvent) => setW(Math.round(e.nativeEvent.layout.width));
  const minuteKey = Math.floor(now.getTime() / 60e3);
  const tenKey = Math.floor(now.getTime() / 600e3);
  // Yol 10 dakikada bir, anlık konum dakikada bir hesaplanır
  const day = useMemo(() => skyDay(new Date(tenKey * 600e3), lat, lng, method), [tenKey, lat, lng, method]);
  const sky = useMemo(() => skyNow(new Date(minuteKey * 60e3), lat, lng), [minuteKey, lat, lng]);

  const dark = isDark();
  const phase = skyPhase(sky.sun.alt);
  const G1 = {
    day: dark ? ['#16263C', '#1D3049'] : ['#D7E8FA', '#F3F8FD'],
    twilight: dark ? ['#151B33', '#3A2A25'] : ['#B9C6EC', '#FBDDBF'],
    night: dark ? ['#0A0F1E', '#141B33'] : ['#1A2346', '#2E3B68'],
  }[phase];
  const ground = dark ? '#191B1F' : '#EFEDE8';
  const lineCol = phase === 'night' || dark ? 'rgba(255,255,255,0.28)' : 'rgba(23,24,28,0.18)';
  const sunCol = '#F2A516';
  const labelCol = phase === 'night' ? '#E8ECF7' : C.ink;

  const H = height;
  const pad = 10;
  const horizonY = Math.round(H * 0.66);
  const top = 18;
  const below = H - horizonY - 8;
  const scale = Math.max(40, day.sunMax, day.moonMax);
  const span = day.end - day.start;
  const x = (t: number) => pad + ((t - day.start) / span) * (w - 2 * pad);
  const y = (alt: number) => (alt >= 0 ? horizonY - (alt / scale) * (horizonY - top) : horizonY + Math.min(1, -alt / 45) * below);
  const pathOf = (s: SkySample[]) => s.map((p, i) => `${i ? 'L' : 'M'}${x(p.t).toFixed(1)} ${y(p.alt).toFixed(1)}`).join(' ');

  const t = now.getTime();
  const nx = x(Math.min(day.end, Math.max(day.start, t)));
  const sunY = y(sky.sun.alt);
  const moonY = y(sky.moon.alt);
  const sunUp = sky.sun.alt > -0.83;
  const moonUp = sky.moon.alt > -0.5;
  // Güneşle üst üste binerse ay biraz yana kayar
  const moonX = Math.abs(moonY - sunY) < 20 ? nx + (nx > w - 30 ? -20 : 20) : nx;
  const nextMark = nextAt ? day.marks.find((m) => Math.abs(m.at.getTime() - nextAt.getTime()) < 60e3) : day.marks.find((m) => m.key === nextKey && m.at.getTime() > t);
  const south = lat < 0;

  const a11y = lang === 'en'
    ? `Sun ${altitudeText(sky.sun.alt, 'en')}, ${directionText(sky.sun.az, 'en')}. Moon: ${moonPhaseName(sky.moon.phase, 'en')}, ${Math.round(sky.moon.fraction * 100)}% lit, ${altitudeText(sky.moon.alt, 'en')}.`
    : lang === 'ar'
      ? `الشمس ${altitudeText(sky.sun.alt, 'ar')}. القمر ${moonPhaseName(sky.moon.phase, 'ar')}.`
      : `Güneş ${altitudeText(sky.sun.alt, 'tr')}, ${directionText(sky.sun.az, 'tr')}. Ay: ${moonPhaseName(sky.moon.phase, 'tr')}, yüzde ${Math.round(sky.moon.fraction * 100)} aydınlık, ${altitudeText(sky.moon.alt, 'tr')}.`;

  return (
    <View onLayout={onLayout} style={{ height: H, borderRadius: 22, overflow: 'hidden', backgroundColor: ground }}
      accessible accessibilityRole="image" accessibilityLabel={a11y}>
      {w > 0 && (
        <Svg width={w} height={H}>
          <Defs>
            <LinearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={G1[0]} />
              <Stop offset="1" stopColor={G1[1]} />
            </LinearGradient>
            <ClipPath id="up"><Rect x={0} y={0} width={w} height={horizonY} /></ClipPath>
            <ClipPath id="down"><Rect x={0} y={horizonY} width={w} height={H - horizonY} /></ClipPath>
          </Defs>
          <Rect x={0} y={0} width={w} height={horizonY} fill="url(#sky)" />
          {phase === 'night' && STARS.map(([sx, sy], i) => (
            <Circle key={i} cx={sx * w} cy={6 + sy * (horizonY - 12)} r={i % 3 === 0 ? 1.4 : 0.9} fill="#FFFFFF" opacity={0.75} />
          ))}
          <Line x1={0} y1={horizonY} x2={w} y2={horizonY} stroke={lineCol} strokeWidth={1.5} />

          {/* Ayın yolu (yalnız ufkun üstü) */}
          <Path d={pathOf(day.moon)} stroke={phase === 'day' && !dark ? 'rgba(80,96,130,0.45)' : 'rgba(225,230,245,0.55)'} strokeWidth={1.5}
            strokeDasharray="2 4" fill="none" clipPath="url(#up)" />
          {/* Güneşin yolu: ufkun üstü dolu, altı silik */}
          <Path d={pathOf(day.sun)} stroke={sunCol} strokeWidth={2.5} fill="none" clipPath="url(#up)" />
          <Path d={pathOf(day.sun)} stroke={dark ? 'rgba(255,255,255,0.22)' : 'rgba(23,24,28,0.2)'} strokeWidth={1.5} strokeDasharray="3 4" fill="none" clipPath="url(#down)" />

          {/* Vakit işaretleri */}
          {day.marks.map((m) => {
            const tk = m.at.getTime();
            const on = m === nextMark;
            const past = tk < t;
            return <Circle key={`${m.key}${tk}`} cx={x(tk)} cy={y(altAt(day.sun, tk))} r={on ? 5 : 3}
              fill={on ? C.accent : (phase === 'night' ? '#C9D1E6' : C.muted)} stroke={on ? '#FFFFFF' : 'none'} strokeWidth={on ? 1.5 : 0}
              opacity={on ? 1 : past ? 0.45 : 0.85} />;
          })}
          {nextMark && (() => {
            const tk = nextMark.at.getTime();
            const px = Math.min(w - 46, Math.max(46, x(tk)));
            const py = y(altAt(day.sun, tk));
            const inSky = py < horizonY - 4;
            let ly = inSky ? Math.max(12, py - 12) : Math.min(H - 6, py + 18);
            // Güneş yazının üstüne düşüyorsa yazıyı güneşin üstüne al
            if (Math.abs(px - nx) < 44 && Math.abs(ly - sunY) < 22) ly = sunY - 22 >= 12 ? sunY - 22 : sunY + 28;
            return (
              <SvgText x={px} y={ly} fontSize={fs(11)} fontWeight="700" fill={inSky ? labelCol : C.ink} textAnchor="middle">
                {`${names[nextMark.key]} ${fmtTime(nextMark.at, tz)}`}
              </SvgText>
            );
          })()}

          {/* Şu an */}
          <Line x1={nx} y1={4} x2={nx} y2={H - 4} stroke={lineCol} strokeWidth={1} strokeDasharray="2 3" />
          {/* Ay (yalnız ufkun üstündeyse) */}
          {moonUp && (
            <G>
              <Circle cx={moonX} cy={moonY} r={8.5} fill={phase === 'day' && !dark ? '#B8C3D9' : '#3A4466'} />
              <Path d={moonLitPath(moonX, moonY, 8.5, sky.moon.fraction, sky.moon.waxing, south)} fill="#FBF7EA" />
            </G>
          )}
          {/* Güneş */}
          {sunUp && <Circle cx={nx} cy={sunY} r={15} fill={sunCol} opacity={0.22} />}
          <Circle cx={nx} cy={sunY} r={sunUp ? 9 : 7} fill={sunCol} opacity={sunUp ? 1 : 0.5} stroke="#FFFFFF" strokeWidth={sunUp ? 1.5 : 0} />
        </Svg>
      )}
    </View>
  );
}
