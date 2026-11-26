// Uzun (2×3) ana ekran küçük uygulaması: altı vakit alt alta, sıradaki vurgulu, geçenler soluk.
// PrayerWidget ile aynı veriyi alır; görünüm ayrı JS ortamında çizilir ('widget' yönergesi).
import type * as UI from '@expo/ui/jetpack-compose';
import type * as M from '@expo/ui/jetpack-compose/modifiers';
import { createWidget } from 'expo-widgets';

import type { PrayerWidgetProps } from './PrayerWidget';

declare const Box: typeof UI.Box;
declare const Column: typeof UI.Column;
declare const Text: typeof UI.Text;
declare const Spacer: typeof UI.Spacer;
declare const fillMaxSize: typeof M.fillMaxSize;
declare const fillMaxWidth: typeof M.fillMaxWidth;
declare const background: typeof M.background;
declare const cornerRadius: typeof M.cornerRadius;
declare const padding: typeof M.padding;
declare const height: typeof M.height;

function listLayout(props: PrayerWidgetProps, env: { colorScheme?: 'light' | 'dark' }) {
  'widget';
  const dk = props.mode === 'dark' || (props.mode !== 'light' && env.colorScheme === 'dark');
  let c = dk ? props.dark : props.light;
  if (!c) {
    c = dk
      ? { bg: '#17120E', ink: '#F6EFE7', muted: '#B3A393', accent: '#F7934F', tint: '#3A2214' }
      : { bg: '#FBF7F1', ink: '#2A2018', muted: '#6F5D4C', accent: '#B4420F', tint: '#FBE4D3' };
  }
  const days = props.days || [];
  const names = props.names && props.names.length === 6 ? props.names : ['İmsak', 'Güneş', 'Öğle', 'İkindi', 'Akşam', 'Yatsı'];
  const root = [fillMaxSize(), background(c.bg), cornerRadius(22), padding(10, 10, 10, 10)];

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
      <Column modifiers={root} verticalAlignment="center" horizontalAlignment="center">
        <Text color={c.accent} style={{ fontSize: 15, fontWeight: 'bold' }}>MATAF</Text>
        <Text color={c.muted} maxLines={3} style={{ fontSize: 11, textAlign: 'center' }}>{msg}</Text>
      </Column>
    );
  }
  const day = days[di];
  const tomorrow = Number(day.s) > now;
  const head = (props.place ? props.place + ' · ' : '') + (tomorrow && props.tomorrow ? props.tomorrow : day.d);

  const rows = [];
  for (let k = 0; k < day.t.length && k < 6; k++) {
    const on = k === pi;
    const past = !tomorrow && k < pi;
    const col = on ? c.accent : past ? c.muted : c.ink;
    rows.push(
      <Box key={'r' + k} modifiers={on ? [fillMaxWidth(), height(26), background(c.tint), cornerRadius(10)] : [fillMaxWidth(), height(26)]}>
        <Box contentAlignment="centerStart" modifiers={[fillMaxWidth(), height(26), padding(8, 0, 8, 0)]}>
          <Text color={col} maxLines={1} style={{ fontSize: 14, fontWeight: on ? 'bold' : 'normal' }}>{names[k]}</Text>
        </Box>
        <Box contentAlignment="centerEnd" modifiers={[fillMaxWidth(), height(26), padding(8, 0, 8, 0)]}>
          <Text color={col} maxLines={1} style={{ fontSize: 15, fontWeight: 'bold' }}>{day.t[k]}</Text>
        </Box>
      </Box>,
    );
    rows.push(<Spacer key={'s' + k} modifiers={[height(2)]} />);
  }

  return (
    <Column modifiers={root} verticalAlignment="center">
      <Text color={c.muted} maxLines={1} style={{ fontSize: 12 }}>{head}</Text>
      <Spacer modifiers={[height(6)]} />
      {rows}
    </Column>
  );
}

const PrayerListWidget = createWidget<PrayerWidgetProps>('PrayerListWidget', listLayout, {
  empty: 'Vakitler için MATAF uygulamasını bir kez açın · Open MATAF once',
});

export default PrayerListWidget;
