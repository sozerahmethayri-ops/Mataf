// İnce (4×1) ana ekran küçük uygulaması: sıradaki vakit ve ondan sonraki, tek satırda.
// PrayerWidget ile aynı veriyi alır; görünüm ayrı JS ortamında çizilir ('widget' yönergesi).
import type * as UI from '@expo/ui/jetpack-compose';
import type * as M from '@expo/ui/jetpack-compose/modifiers';
import { createWidget } from 'expo-widgets';

import type { PrayerWidgetProps } from './PrayerWidget';

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
  const dk = props.mode === 'dark' || (props.mode !== 'light' && env.colorScheme === 'dark');
  let c = dk ? props.dark : props.light;
  if (!c) {
    c = dk
      ? { bg: '#17120E', ink: '#F6EFE7', muted: '#B3A393', accent: '#F7934F', tint: '#3A2214' }
      : { bg: '#FBF7F1', ink: '#2A2018', muted: '#6F5D4C', accent: '#B4420F', tint: '#FBE4D3' };
  }
  const days = props.days || [];
  const names = props.names && props.names.length === 6 ? props.names : ['İmsak', 'Güneş', 'Öğle', 'İkindi', 'Akşam', 'Yatsı'];
  const root = [fillMaxSize(), background(c.bg), cornerRadius(20), padding(16, 0, 12, 0)];

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
  let ni = di;
  let nj = pi + 1;
  if (nj > 5) {
    ni = di + 1;
    nj = 0;
  }
  let then = '';
  if (ni < days.length) then = (props.after ? props.after + ' ' : '') + names[nj] + ' ' + days[ni].t[nj];
  // Yatsıdan sonra yan yazı yalnız "yarın" (tek satıra sığsın; gece "Sonra Güneş" gereksiz)
  const side = tomorrow && props.tomorrow ? props.tomorrow : then;

  return (
    <Row modifiers={root} verticalAlignment="center">
      <Text color={c.accent} maxLines={1} style={{ fontSize: 17, fontWeight: 'bold' }}>{names[pi]}</Text>
      <Spacer modifiers={[width(6)]} />
      <Text color={c.ink} maxLines={1} style={{ fontSize: 17, fontWeight: 'bold' }}>{day.t[pi]}</Text>
      <Spacer modifiers={[width(14)]} />
      <Text color={c.muted} maxLines={1} style={{ fontSize: 13 }}>{side}</Text>
    </Row>
  );
}

const PrayerStripWidget = createWidget<PrayerWidgetProps>('PrayerStripWidget', stripLayout, {
  empty: 'Vakitler için MATAF uygulamasını bir kez açın · Open MATAF once',
});

export default PrayerStripWidget;
