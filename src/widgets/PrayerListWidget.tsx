// Uzun (2×3) ana ekran küçük uygulaması: yer ve hicrî tarih, saniye saniye geri sayım, altı vakit alt alta
// (sıradaki dolu renkli hapta). PrayerWidget ile aynı veriyi alır; görünüm ayrı JS ortamında çizilir ('widget'
// yönergesi), bu yüzden gövde dosyadaki başka değere erişemez ve derleyici yardımcısı gerektiren sözdizimi
// kullanmaz. Glance bir Column'da en çok 10 çocuk çizer: satırlar ayrı bir Column'da. Görünüm ve geri sayım için
// PrayerWidget.tsx başındaki nota bakın.
import type * as UI from '@expo/ui/jetpack-compose';
import type * as M from '@expo/ui/jetpack-compose/modifiers';
import { createWidget } from 'expo-widgets';
import type { ReactElement } from 'react';

import type { CountdownProps, PrayerWidgetProps } from './PrayerWidget';

declare const Box: typeof UI.Box;
declare const Column: typeof UI.Column;
declare const Row: typeof UI.Row;
declare const Text: typeof UI.Text;
declare const Spacer: typeof UI.Spacer;
declare const fillMaxSize: typeof M.fillMaxSize;
declare const fillMaxWidth: typeof M.fillMaxWidth;
declare const background: typeof M.background;
declare const cornerRadius: typeof M.cornerRadius;
declare const padding: typeof M.padding;
declare const width: typeof M.width;
declare const height: typeof M.height;

function listLayout(props: PrayerWidgetProps, env: { colorScheme?: 'light' | 'dark'; width?: number; height?: number }) {
  'widget';
  const dk = props.mode === 'dark' || (props.mode !== 'light' && env.colorScheme === 'dark');
  let c = dk ? props.dark : props.light;
  if (!c) c = { bg: '#17120E99', ink: '#F6EFE7', muted: '#B3A393', accent: '#F7934F', tint: '#3A2214', fill: '#F7934F', onFill: '#1F0F05' };
  const fill = c.fill || c.accent;
  const onFill = c.onFill || c.bg;
  const Countdown = Text as unknown as (p: CountdownProps) => ReactElement;
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
  const target = Number(day.a[pi]);
  const mins = Math.max(0, Math.ceil((target - now) / 60000));
  const fallback = Math.floor(mins / 60) + ':' + (mins % 60 < 10 ? '0' : '') + (mins % 60);
  const label = (props.left || '{p}').replace('{p}', names[pi]) + (tomorrow && props.tomorrow ? ' · ' + props.tomorrow : '');

  const rows = [];
  for (let k = 0; k < day.t.length && k < 6; k++) {
    const on = k === pi;
    const past = !tomorrow && k < pi;
    const col = on ? onFill : past ? c.muted : c.ink;
    rows.push(
      <Box key={'r' + k} modifiers={on ? [fillMaxWidth(), height(25), background(fill), cornerRadius(10)] : [fillMaxWidth(), height(25)]}>
        <Box contentAlignment="centerStart" modifiers={[fillMaxWidth(), height(25), padding(8, 0, 8, 0)]}>
          <Text color={col} maxLines={1} style={{ fontSize: 14, fontWeight: on ? 'bold' : 'normal' }}>{names[k]}</Text>
        </Box>
        <Box contentAlignment="centerEnd" modifiers={[fillMaxWidth(), height(25), padding(8, 0, 8, 0)]}>
          <Text color={col} maxLines={1} style={{ fontSize: 15, fontWeight: 'bold' }}>{day.t[k]}</Text>
        </Box>
      </Box>,
    );
  }

  return (
    <Column modifiers={root} verticalAlignment="center">
      <Row verticalAlignment="center" modifiers={[padding(4, 0, 4, 0)]}>
        <Text color={c.ink} maxLines={1} style={{ fontSize: 13, fontWeight: 'bold' }}>{props.place || 'MATAF'}</Text>
        <Spacer modifiers={[width(6)]} />
        <Text color={c.muted} maxLines={1} style={{ fontSize: 11 }}>{day.h || day.d}</Text>
      </Row>
      <Spacer modifiers={[height(4)]} />
      {/* Tam genişlik: yoksa sayaç üstündeki yazı kadar daralır ("1:01…") */}
      <Column modifiers={[fillMaxWidth(), padding(4, 0, 4, 0)]}>
        <Text color={c.accent} maxLines={1} style={{ fontSize: 11, fontWeight: 'bold' }}>{label}</Text>
        <Countdown countdownTo={target} color={c.ink} maxLines={1} style={{ fontSize: 26, fontWeight: 'bold' }}>{fallback}</Countdown>
      </Column>
      <Spacer modifiers={[height(6)]} />
      <Column modifiers={[fillMaxWidth()]}>{rows}</Column>
    </Column>
  );
}

const PrayerListWidget = createWidget<PrayerWidgetProps>('PrayerListWidget', listLayout, {
  empty: 'Vakitler için MATAF uygulamasını bir kez açın · Open MATAF once',
});

export default PrayerListWidget;
