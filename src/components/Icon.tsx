import Svg, { Circle, Path } from 'react-native-svg';

const P: Record<string, string> = {
  map: 'M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2zM9 4v14M15 6v14',
  gate: 'M6 21V9a6 6 0 0 1 12 0v12M3 21h18M14 14h.01',
  book: 'M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5v14zM6.5 17A2.5 2.5 0 0 0 4 19.5 2.5 2.5 0 0 0 6.5 22H20v-5',
  clock: 'M12 7v5l3 2',
  moon: 'M20 12.8A8 8 0 1 1 11.2 4a6.2 6.2 0 0 0 8.8 8.8z',
  search: 'm20 20-3.5-3.5',
  back: 'M19 12H5M12 19l-7-7 7-7',
  close: 'M18 6 6 18M6 6l12 12',
  check: 'm5 12 5 5L20 7',
  alert: 'M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0zM12 9v4M12 17h.01',
  chevron: 'm9 6 6 6-6 6',
  nav: 'M3 11 22 2l-9 19-2-8-8-2z',
  locate: 'M12 2v3M12 19v3M2 12h3M19 12h3',
  layers: 'm12 3 9 5-9 5-9-5 9-5zM3 13l9 5 9-5',
  plus: 'M12 5v14M5 12h14',
  minus: 'M5 12h14',
  bell: 'M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0',
  camera: 'M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z',
  send: 'M22 2 11 13M22 2l-7 20-4-9-9-4 20-7z',
  share: 'M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8M16 6l-4-4-4 4M12 2v13',
  bookmark: 'M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z',
  up: 'M12 19V5M5 12l7-7 7 7',
  left: 'M17 20v-7a4 4 0 0 0-4-4H5M9 13 5 9l4-4',
  right: 'M7 20v-7a4 4 0 0 1 4-4h8M15 13l4-4-4-4',
  flag: 'M4 22V4M4 4h13l-2 4 2 4H4',
  globe: 'M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18',
  settings: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1A1.7 1.7 0 0 0 4.6 9a1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z',
  data: 'M4 6c0-1.7 3.6-3 8-3s8 1.3 8 3-3.6 3-8 3-8-1.3-8-3zM4 6v6c0 1.7 3.6 3 8 3s8-1.3 8-3V6M4 12v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6',
  pin: 'M12 22s7-6.2 7-12a7 7 0 0 0-14 0c0 5.8 7 12 7 12z',
  external: 'M7 17 17 7M8 7h9v9',
  speaker: 'M11 5 6 9H2v6h4l5 4V5zM15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14',
  water: 'M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z',
  wc: 'M5 21v-7H4l1.5-6h3L10 14H9v7M15 8h4v6h-1v7h-2v-7h-1z',
  lift: 'M5 3h14v18H5zM9 9l3-3 3 3M9 15l3 3 3-3',
  wheel: 'M10 8v6h6l2 5M10 11h5M8.5 10.5a6 6 0 1 0 8 8',
  aid: 'M12 5v14M5 12h14',
  lost: 'M4 7h16v13H4zM9 7V5h6v2M12 11v4M12 17h.01',
  hotel: 'M3 18v-6h18v6M3 12V7M21 18v2M3 18v2M11 12h8a2 2 0 0 0-2-2h-6z',
  food: 'M7 3v8M5 3v4a2 2 0 0 0 4 0V3M7 11v10M16 3c-2 1-3 3-3 6v3h3v9',
  pharmacy: 'M10 4h4v6h6v4h-6v6h-4v-6H4v-4h6z',
  bus: 'M5 4h14v12H5zM5 11h14M7 16v3M17 16v3',
  taxi: 'M5 13l2-5h10l2 5v5H5zM7 18v2M17 18v2M8 13h8',
  hospital: 'M4 4h16v16H4zM12 8v8M8 12h8',
  tour: 'M12 2v3M12 19v3M8 12h8m1-3 3 3-3 3',
};

const CIRCLES: Record<string, [number, number, number][]> = {
  clock: [[12, 12, 9]],
  search: [[11, 11, 7]],
  locate: [[12, 12, 3], [12, 12, 7]],
  camera: [[12, 13, 4]],
  globe: [[12, 12, 9]],
  pin: [[12, 10, 2.5]],
  tour: [[12, 12, 10]],
  wheel: [[12, 4, 1.5]],
};

export type IconName = keyof typeof P;

export function Icon({ name, size = 20, color = '#17181C', width = 2, fill = 'none' }: { name: IconName; size?: number; color?: string; width?: number; fill?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={color} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round">
      {(CIRCLES[name] ?? []).map(([cx, cy, r], i) => <Circle key={i} cx={cx} cy={cy} r={r} />)}
      <Path d={P[name]} />
    </Svg>
  );
}
