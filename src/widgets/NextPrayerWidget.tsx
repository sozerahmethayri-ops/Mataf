// Küçük (2×2) ana ekran küçük uygulaması: sıradaki namaz, saniye saniye geri sayım, ondan sonraki vakit ve
// hicrî tarih. PrayerWidget ile aynı veriyi alır; görünüm ayrı JS ortamında çizilir ('widget' yönergesi), bu yüzden
// gövde dosyadaki başka hiçbir değere erişemez ve derleyici yardımcısı gerektiren sözdizimi kullanmaz.
// Görünüm ve geri sayım için PrayerWidget.tsx başındaki nota bakın.
import type * as UI from '@expo/ui/jetpack-compose';
import type * as M from '@expo/ui/jetpack-compose/modifiers';
import { createWidget } from 'expo-widgets';
import type { ReactElement } from 'react';

import type { CountdownProps, PrayerWidgetProps } from './PrayerWidget';

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

function nextLayout(props: PrayerWidgetProps, env: { colorScheme?: 'light' | 'dark'; width?: number; height?: number }) {
  'widget';
  const dk = props.mode === 'dark' || (props.mode !== 'light' && env.colorScheme === 'dark');
  let c = dk ? props.dark : props.light;
  if (!c) c = { bg: '#17120E99', ink: '#F6EFE7', muted: '#B3A393', accent: '#F7934F', tint: '#3A2214', fill: '#F7934F', onFill: '#1F0F05' };
  const Countdown = Text as unknown as (p: CountdownProps) => ReactElement;
  const days = props.days || [];
  const names = props.names && props.names.length === 6 ? props.names : ['İmsak', 'Güneş', 'Öğle', 'İkindi', 'Akşam', 'Yatsı'];
  const root = [fillMaxSize(), background(c.bg), cornerRadius(22), padding(14, 10, 12, 10)];

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
  const big = env.width && env.width < 140 ? 26 : 30;
  // Ondan sonraki vakit (gün biterse ertesi günün imsakı)
  let ni = di;
  let nj = pi + 1;
  if (nj > 5) {
    ni = di + 1;
    nj = 0;
  }
  let then = '';
  if (ni < days.length) then = (props.after ? props.after + ' ' : '') + names[nj] + ' ' + days[ni].t[nj];

  return (
    <Column modifiers={root} verticalAlignment="center">
      <Text color={c.muted} maxLines={1} style={{ fontSize: 11 }}>{props.place || 'MATAF'}</Text>
      <Spacer modifiers={[height(2)]} />
      {/* Sayaç kendi Column'unun son çocuğu (kalan alana yayılıp sonraki satırları gizlemesin); Column tam genişlikte,
          yoksa en geniş kardeşi kadar daralır ve kısa vakit adında sayaç "1:0…" diye kesilir */}
      <Column modifiers={[fillMaxWidth()]}>
        {/* Yatsıdan sonra "yarın" ayrı ve küçük: dar kutuda kesilen o olsun, saat değil */}
        <Row verticalAlignment="center">
          <Text color={c.accent} maxLines={1} style={{ fontSize: 16, fontWeight: 'bold' }}>{names[pi]}</Text>
          <Spacer modifiers={[width(6)]} />
          <Text color={c.ink} maxLines={1} style={{ fontSize: 16, fontWeight: 'bold' }}>{day.t[pi]}</Text>
          {tomorrow && props.tomorrow ? <Spacer modifiers={[width(4)]} /> : null}
          {tomorrow && props.tomorrow ? <Text color={c.muted} maxLines={1} style={{ fontSize: 11 }}>{props.tomorrow}</Text> : null}
        </Row>
        <Countdown countdownTo={target} color={c.ink} maxLines={1} style={{ fontSize: big, fontWeight: 'bold' }}>{fallback}</Countdown>
      </Column>
      <Spacer modifiers={[height(2)]} />
      <Text color={c.muted} maxLines={1} style={{ fontSize: 11 }}>{then}</Text>
      <Text color={c.muted} maxLines={1} style={{ fontSize: 11 }}>{day.h || day.d}</Text>
    </Column>
  );
}

const NextPrayerWidget = createWidget<PrayerWidgetProps>('NextPrayerWidget', nextLayout, {
  empty: 'Vakitler için MATAF uygulamasını bir kez açın · Open MATAF once',
});

export default NextPrayerWidget;
