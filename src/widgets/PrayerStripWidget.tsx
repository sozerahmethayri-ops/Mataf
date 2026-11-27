// İnce şerit (4×1) ana ekran küçük uygulaması: tek satırda sıradaki vakit ve saniye saniye geri sayım.
// PrayerWidget ile aynı veriyi alır; görünüm ayrı JS ortamında çizilir ('widget' yönergesi), bu yüzden gövde
// dosyadaki başka değere erişemez. Görünüm ve geri sayım için PrayerWidget.tsx başındaki nota bakın.
import type * as UI from '@expo/ui/jetpack-compose';
import type * as M from '@expo/ui/jetpack-compose/modifiers';
import { createWidget } from 'expo-widgets';
import type { ReactElement } from 'react';

import type { CountdownProps, PrayerWidgetProps } from './PrayerWidget';

declare const Row: typeof UI.Row;
declare const Text: typeof UI.Text;
declare const Spacer: typeof UI.Spacer;
declare const fillMaxSize: typeof M.fillMaxSize;
declare const background: typeof M.background;
declare const cornerRadius: typeof M.cornerRadius;
declare const padding: typeof M.padding;
declare const width: typeof M.width;

function stripLayout(props: PrayerWidgetProps, env: { colorScheme?: 'light' | 'dark' }) {
  'widget';
  let c = props.mode === 'glass' ? props.glass : undefined;
  if (!c) {
    const dk = props.mode === 'dark' || (props.mode !== 'light' && env.colorScheme === 'dark');
    c = dk ? props.dark : props.light;
  }
  if (!c) c = { bg: '#0000009E', ink: '#FFFFFF', muted: '#FFFFFFB8', accent: '#F7934F', tint: '#FFFFFF2E', fill: '#B4420F', onFill: '#FFFFFF' };
  const Countdown = Text as unknown as (p: CountdownProps) => ReactElement;
  const days = props.days || [];
  const names = props.names && props.names.length === 6 ? props.names : ['İmsak', 'Güneş', 'Öğle', 'İkindi', 'Akşam', 'Yatsı'];
  const root = [fillMaxSize(), background(c.bg), cornerRadius(22), padding(16, 8, 16, 8)];

  const now = Date.now();
  let di = -1;
  let pi = -1;
  for (let i = 0; i < days.length && di < 0; i++) {
    const a = days[i].a;
    for (let j = 0; j < a.length; j++) {
      if (Number(a[j]) > now) {
        di = i;
        pi = j;
        break;
      }
    }
  }
  if (di < 0) {
    const msg = days.length === 0 ? props.empty || 'Vakitler için MATAF uygulamasını bir kez açın' : props.stale || 'MATAF';
    return (
      <Row modifiers={root} verticalAlignment="center">
        <Text color={c.muted} maxLines={1} style={{ fontSize: 12 }}>{msg}</Text>
      </Row>
    );
  }
  const day = days[di];
  const tomorrow = Number(day.s) > now;
  const target = Number(day.a[pi]);
  const mins = Math.max(0, Math.ceil((target - now) / 60000));
  const fallback = Math.floor(mins / 60) + ':' + (mins % 60 < 10 ? '0' : '') + (mins % 60);
  // Yatsıdan sonra saatin yanına "yarın" (tek satıra sığsın)
  const when = day.t[pi] + (tomorrow && props.tomorrow ? ' ' + props.tomorrow : '');

  return (
    <Row modifiers={root} verticalAlignment="center">
      <Text color={c.accent} maxLines={1} style={{ fontSize: 17, fontWeight: 'bold' }}>{names[pi]}</Text>
      <Spacer modifiers={[width(6)]} />
      <Text color={c.ink} maxLines={1} style={{ fontSize: 17, fontWeight: 'bold' }}>{when}</Text>
      <Spacer modifiers={[width(14)]} />
      <Countdown countdownTo={target} color={c.ink} maxLines={1} style={{ fontSize: 17, fontWeight: 'bold' }}>{fallback}</Countdown>
      <Spacer modifiers={[width(4)]} />
      <Text color={c.muted} maxLines={1} style={{ fontSize: 13 }}>{props.remain || ''}</Text>
    </Row>
  );
}

const PrayerStripWidget = createWidget<PrayerWidgetProps>('PrayerStripWidget', stripLayout, {
  empty: 'Vakitler için MATAF uygulamasını bir kez açın · Open MATAF once',
});

export default PrayerStripWidget;
