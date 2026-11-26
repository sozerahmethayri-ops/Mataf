// Ana ekran namaz vakti küçük uygulaması (Android, expo-widgets): orta boy (4×2), "Günün vakitleri".
// Diğer boylar: NextPrayerWidget (2×2), PrayerListWidget (2×3), PrayerStripWidget (4×1); hepsi aynı veriyi alır.
// Görünüm uygulamadan ayrı, küçük bir JS ortamında çizilir: aşağıdaki işlevin gövdesi derlemede dizeye
// çevrilir ('widget' yönergesi), bu yüzden dosyadaki başka hiçbir değere, içe aktarmaya ya da yardımcıya
// erişemez — her şey props'tan gelir. Bileşenler ve değiştiriciler (@expo/ui/jetpack-compose) o ortamda
// küresel adlarla bulunur; burada yalnız tür olarak bildirilir (uygulama paketine çalışma kodu girmez).
// Derleyici yardımcısı gerektiren sözdiziminden (?. ?? ... yayma, for…of, dizi ayrıştırma) kaçınılır.
//
// Vakitler 30 günlük olarak verilir; küçük uygulama her çizimde (Android en geç 30 dakikada bir yeniler)
// "şimdi"yi kendisi bulur. Uygulama açılmasa da günler ilerledikçe doğru günü ve sıradaki vakti gösterir.
import type * as UI from '@expo/ui/jetpack-compose';
import type * as M from '@expo/ui/jetpack-compose/modifiers';
import { createWidget } from 'expo-widgets';

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

export type PrayerWidgetColors = { bg: string; ink: string; muted: string; accent: string; tint: string };
/** Bir gün: s = günün başı (ms, dize), d = gün etiketi, t = 6 saat ("05:12"), a = 6 an (ms, dize). */
export type PrayerWidgetDay = { s: string; d: string; t: string[]; a: string[] };
export type PrayerWidgetProps = {
  v?: number;
  place?: string;
  names?: string[];
  days?: PrayerWidgetDay[];
  /** "Sıradaki:" */
  next?: string;
  /** "yarın" */
  tomorrow?: string;
  /** "Sonra" (küçük ve şerit küçük uygulamada bir sonraki vakit) */
  after?: string;
  /** Veri bittiğinde: "Güncellemek için MATAF'ı açın" */
  stale?: string;
  /** Hiç veri yokken */
  empty?: string;
  mode?: 'system' | 'light' | 'dark';
  light?: PrayerWidgetColors;
  dark?: PrayerWidgetColors;
};

function prayerLayout(props: PrayerWidgetProps, env: { colorScheme?: 'light' | 'dark' }) {
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
  const root = [fillMaxSize(), background(c.bg), cornerRadius(22), padding(12, 10, 12, 10)];

  // Sıradaki vakit: şimdiden sonraki ilk an (veri bittiyse "uygulamayı açın")
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
        <Text color={c.accent} style={{ fontSize: 17, fontWeight: 'bold' }}>{props.place || 'MATAF'}</Text>
        <Text color={c.muted} maxLines={2} style={{ fontSize: 12, textAlign: 'center' }}>{msg}</Text>
      </Column>
    );
  }
  const day = days[di];
  const tomorrow = Number(day.s) > now;
  const head = (props.place ? props.place + ' · ' : '') + day.d;
  const when = day.t[pi] + (tomorrow && props.tomorrow ? ' · ' + props.tomorrow : '');

  // Altı vakit: sıradaki vurgulu, geçenler soluk
  const cells = [];
  for (let k = 0; k < day.t.length && k < 6; k++) {
    const on = k === pi;
    const past = !tomorrow && k < pi;
    cells.push(
      <Column
        key={'p' + k}
        horizontalAlignment="center"
        modifiers={on ? [width(41), background(c.tint), cornerRadius(10), padding(0, 5, 0, 5)] : [width(41), padding(0, 5, 0, 5)]}>
        <Text color={on ? c.accent : c.muted} maxLines={1} style={{ fontSize: 11 }}>{names[k]}</Text>
        <Text color={on ? c.accent : past ? c.muted : c.ink} maxLines={1} style={{ fontSize: 14, fontWeight: 'bold' }}>{day.t[k]}</Text>
      </Column>,
    );
  }

  return (
    <Column modifiers={root} verticalAlignment="center">
      <Text color={c.muted} maxLines={1} style={{ fontSize: 12 }}>{head}</Text>
      <Row verticalAlignment="center">
        <Text color={c.accent} maxLines={1} style={{ fontSize: 22, fontWeight: 'bold' }}>{names[pi]}</Text>
        <Spacer modifiers={[width(8)]} />
        <Text color={c.ink} maxLines={1} style={{ fontSize: 22, fontWeight: 'bold' }}>{when}</Text>
      </Row>
      <Spacer modifiers={[height(8)]} />
      <Row modifiers={[fillMaxWidth()]} horizontalAlignment="center">{cells}</Row>
    </Column>
  );
}

const PrayerWidget = createWidget<PrayerWidgetProps>('PrayerWidget', prayerLayout, {
  empty: 'Vakitler için MATAF uygulamasını bir kez açın · Open MATAF once',
});

export default PrayerWidget;
