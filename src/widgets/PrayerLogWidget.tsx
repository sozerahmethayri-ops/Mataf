// Ana ekran "Namaz takibi" küçük uygulaması (Android, expo-widgets, 4×2): bugün kılınan vakitler vurgu renginde dolu
// daire içinde ✓, kılınmayanlar açık renkli boş daire (○ harfi emülatörde çok küçük çiziliyordu, 0.21.1),
// sayı ve varsa hatim yüzdesi. Veriyi uygulama yazar (işaret değişince ve ana sayfa açılınca); "bugün"ü küçük
// uygulama her çizimde kendisi bulur, gece yarısından sonra uygulama açılmasa da yeni gün 0/5 başlar.
// Görünüm ayrı JS ortamında çizilir ('widget' yönergesi): dosyadaki başka değere erişemez; ?. ?? ... yayma ve
// for…of kullanılmaz (PrayerWidget.tsx başındaki nota bakın). Dokununca uygulama açılır (ana sayfada aynı kart).
import type * as UI from '@expo/ui/jetpack-compose';
import type * as M from '@expo/ui/jetpack-compose/modifiers';
import { createWidget } from 'expo-widgets';

import type { PrayerWidgetColors, PrayerWidgetMode } from './PrayerWidget';

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

/** k: gün (YYYY-MM-DD, yerel), m: kılınan vakitlerin bit maskesi (sabah 1, öğle 2, ikindi 4, akşam 8, yatsı 16) */
export type PrayerLogWidgetDay = { k: string; m: number };
export type PrayerLogWidgetProps = {
  v?: number;
  /** "Bugünkü namazlarım" */
  title?: string;
  /** Beş namazın adı: Sabah, Öğle, İkindi, Akşam, Yatsı */
  names?: string[];
  days?: PrayerLogWidgetDay[];
  /** "Beş vakit tamam" */
  allDone?: string;
  /** "Hatim %49" (hatim planı varsa) */
  hatim?: string;
  empty?: string;
  mode?: PrayerWidgetMode;
  light?: PrayerWidgetColors;
  dark?: PrayerWidgetColors;
};

function logLayout(props: PrayerLogWidgetProps, env: { colorScheme?: 'light' | 'dark' }) {
  'widget';
  // Görünüm vakit kutularıyla aynı (PrayerWidget.tsx): paletin koyu ya da açık tonu, zemin şeffaf olabilir
  const dk = props.mode === 'dark' || (props.mode !== 'light' && env.colorScheme === 'dark');
  let c = dk ? props.dark : props.light;
  if (!c) c = { bg: '#17120E99', ink: '#F6EFE7', muted: '#B3A393', accent: '#F7934F', tint: '#3A2214', fill: '#F7934F', onFill: '#1F0F05' };
  const fill = c.fill || c.accent;
  const onFill = c.onFill || c.bg;
  const root = [fillMaxSize(), background(c.bg), cornerRadius(22), padding(14, 10, 14, 10)];
  const days = props.days || [];
  if (days.length === 0) {
    return (
      <Column modifiers={root} verticalAlignment="center" horizontalAlignment="center">
        <Text color={c.accent} style={{ fontSize: 15, fontWeight: 'bold' }}>MATAF</Text>
        <Text color={c.muted} maxLines={3} style={{ fontSize: 11, textAlign: 'center' }}>{props.empty || 'Namaz takibi için MATAF uygulamasını bir kez açın'}</Text>
      </Column>
    );
  }
  const names = props.names && props.names.length === 5 ? props.names : ['Sabah', 'Öğle', 'İkindi', 'Akşam', 'Yatsı'];
  // Bugünün anahtarı (yerel tarih)
  const d = new Date();
  const mm = d.getMonth() + 1;
  const dd = d.getDate();
  const key = d.getFullYear() + '-' + (mm < 10 ? '0' + mm : '' + mm) + '-' + (dd < 10 ? '0' + dd : '' + dd);
  let mask = 0;
  for (let i = 0; i < days.length; i++) if (days[i].k === key) mask = days[i].m;
  let n = 0;
  for (let b = 0; b < 5; b++) if ((mask >> b) & 1) n++;

  const cells = [];
  for (let k = 0; k < 5; k++) {
    const on = ((mask >> k) & 1) === 1;
    cells.push(
      <Column key={'n' + k} horizontalAlignment="center" modifiers={[width(52), padding(0, 2, 0, 2)]}>
        <Box contentAlignment="center" modifiers={[width(30), height(30), background(on ? fill : c.tint), cornerRadius(15)]}>
          <Text color={onFill} maxLines={1} style={{ fontSize: 16, fontWeight: 'bold' }}>{on ? '✓' : ' '}</Text>
        </Box>
        <Spacer modifiers={[height(3)]} />
        <Text color={on ? c.ink : c.muted} maxLines={1} style={{ fontSize: 11 }}>{names[k]}</Text>
      </Column>,
    );
  }
  // Çocuklar açık diziyle (koşullu null çocuk kullanılmaz)
  const rows = [
    <Row key="h" verticalAlignment="center" modifiers={[fillMaxWidth()]}>
      <Text color={c.accent} maxLines={1} style={{ fontSize: 15, fontWeight: 'bold' }}>{props.title || 'MATAF'}</Text>
      <Spacer modifiers={[width(8)]} />
      <Text color={n === 5 ? c.accent : c.muted} maxLines={1} style={{ fontSize: 13, fontWeight: 'bold' }}>{n === 5 && props.allDone ? props.allDone : n + '/5'}</Text>
    </Row>,
    <Spacer key="s1" modifiers={[height(6)]} />,
    <Row key="c" modifiers={[fillMaxWidth()]} horizontalAlignment="center">{cells}</Row>,
  ];
  if (props.hatim) {
    rows.push(<Spacer key="s2" modifiers={[height(4)]} />);
    rows.push(<Text key="t" color={c.muted} maxLines={1} style={{ fontSize: 12 }}>{props.hatim}</Text>);
  }
  return (
    <Column modifiers={root} verticalAlignment="center">{rows}</Column>
  );
}

const PrayerLogWidget = createWidget<PrayerLogWidgetProps>('PrayerLogWidget', logLayout, {
  empty: 'Namaz takibi için MATAF uygulamasını bir kez açın · Open MATAF once',
});

export default PrayerLogWidget;
