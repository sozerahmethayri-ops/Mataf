// Kalıcı vakit bildirimi (Android): bildirim panelinde sürekli duran MATAF kutusu. Kapalıyken sıradaki vakit ve
// saniye saniye işleyen geri sayım; açınca günün altı vakti (sıradaki dolu hapta). Kutularla aynı veriyi
// (PrayerWidgetProps, 30 gün) alır ve sıradaki vakti her çizimde kendisi bulur; vakit anındaki alarm
// (WidgetTicks) bildirimi aynı verilerle yeniden çizer (yama: ExpoWidgetsAppWidgetProvider).
// Görünüm ayrı JS ortamında çizilir ('widget' yönergesi): dosya dışındaki değerlere erişmez, ?. ?? ... ve for…of yok.
// Bildirimin zemini sistemindir (açık/koyu); yazı renkleri temadan, vurgu paletten gelir.
import type * as UI from '@expo/ui/jetpack-compose';
import type * as M from '@expo/ui/jetpack-compose/modifiers';
import { createCustomNotification } from 'expo-widgets';
import type { ReactElement } from 'react';

import type { CountdownProps, PrayerWidgetProps } from './PrayerWidget';

declare const Box: typeof UI.Box;
declare const Column: typeof UI.Column;
declare const Row: typeof UI.Row;
declare const Text: typeof UI.Text;
declare const Spacer: typeof UI.Spacer;
declare const fillMaxWidth: typeof M.fillMaxWidth;
declare const background: typeof M.background;
declare const cornerRadius: typeof M.cornerRadius;
declare const padding: typeof M.padding;
declare const width: typeof M.width;
declare const height: typeof M.height;

const PrayerNotification = createCustomNotification<PrayerWidgetProps>('PrayerNotification', (props, env) => {
  'widget';
  const dk = env.colorScheme === 'dark';
  const pal = dk ? props.dark : props.light;
  const ink = dk ? '#F6EFE7' : '#2A2018';
  const muted = dk ? '#B3A393' : '#6F5D4C';
  const accent = pal ? pal.accent : dk ? '#F7934F' : '#B4420F';
  const fill = pal && pal.fill ? pal.fill : accent;
  const onFill = pal && pal.onFill ? pal.onFill : '#FFFFFF';
  const Countdown = Text as unknown as (p: CountdownProps) => ReactElement;
  const days = props.days || [];
  const names = props.names && props.names.length === 6 ? props.names : ['İmsak', 'Güneş', 'Öğle', 'İkindi', 'Akşam', 'Yatsı'];

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
    const msg = days.length === 0 ? props.empty || 'Vakitler için MATAF uygulamasını açın' : props.stale || 'MATAF';
    return { collapsed: <Text color={muted} maxLines={2} style={{ fontSize: 13 }}>{msg}</Text> };
  }
  const day = days[di];
  const tomorrow = Number(day.s) > now;
  const target = Number(day.a[pi]);
  const mins = Math.max(0, Math.ceil((target - now) / 60000));
  const fallback = Math.floor(mins / 60) + ':' + (mins % 60 < 10 ? '0' : '') + (mins % 60);
  const label = (props.left || '{p}').replace('{p}', names[pi]);

  // Üst satır: "Akşam vaktine kalan" + yer; altında ad ve saat; sağda büyük sayaç
  const head = (
    <Row verticalAlignment="center" modifiers={[fillMaxWidth()]}>
      <Column>
        <Text color={accent} maxLines={1} style={{ fontSize: 12, fontWeight: 'bold' }}>{label}</Text>
        <Row verticalAlignment="center">
          <Text color={ink} maxLines={1} style={{ fontSize: 16, fontWeight: 'bold' }}>{names[pi] + ' ' + day.t[pi]}</Text>
          {tomorrow && props.tomorrow ? <Spacer modifiers={[width(4)]} /> : null}
          {tomorrow && props.tomorrow ? <Text color={muted} maxLines={1} style={{ fontSize: 11 }}>{props.tomorrow}</Text> : null}
        </Row>
      </Column>
      <Spacer modifiers={[width(8)]} />
      <Box contentAlignment="centerEnd" modifiers={[fillMaxWidth()]}>
        <Countdown countdownTo={target} color={ink} maxLines={1} style={{ fontSize: 24, fontWeight: 'bold', textAlign: 'end' }}>{fallback}</Countdown>
      </Box>
    </Row>
  );

  // Açılınca: günün altı vakti, sıradaki dolu hapta, geçenler soluk; altta yer ve hicrî tarih
  const cells = [];
  for (let k = 0; k < day.t.length && k < 6; k++) {
    const on = k === pi;
    const past = !tomorrow && k < pi;
    cells.push(
      <Column key={'c' + k} horizontalAlignment="center"
        modifiers={on ? [width(41), background(fill), cornerRadius(10), padding(0, 3, 0, 3)] : [width(41), padding(0, 3, 0, 3)]}>
        <Text color={on ? onFill : muted} maxLines={1} style={{ fontSize: 9 }}>{names[k]}</Text>
        <Text color={on ? onFill : past ? muted : ink} maxLines={1} style={{ fontSize: 12, fontWeight: 'bold' }}>{day.t[k]}</Text>
      </Column>,
    );
  }
  const foot = (props.place || 'MATAF') + ' · ' + (day.h || day.d);

  return {
    collapsed: head,
    expanded: (
      <Column modifiers={[fillMaxWidth()]}>
        {head}
        <Spacer modifiers={[height(8)]} />
        <Row modifiers={[fillMaxWidth()]} horizontalAlignment="center">{cells}</Row>
        <Spacer modifiers={[height(6)]} />
        <Text color={muted} maxLines={1} style={{ fontSize: 11 }}>{foot}</Text>
      </Column>
    ),
  };
});

export default PrayerNotification;
