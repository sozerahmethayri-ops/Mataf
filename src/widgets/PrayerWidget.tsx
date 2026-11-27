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
//
// Görünüm (0.22.0, proje sahibinin isteği: "Ezan Vakti Pro'ya benzesin"): zemin seçili paletin koyu ya da açık
// tonu, şeffaflığı ayarlanır (varsayılan koyu, %40 şeffaf; duvar kâğıdı görünür); büyük ve saniye saniye işleyen
// geri sayım, miladi ve hicrî tarih, altı vakit yan yana ve sıradaki dolu renkli hapta. Geri sayım Text'e verilen
// countdownTo ile yerelde Android Chronometer olur (expo-widgets yaması, WidgetCountdown.kt); başlatıcı onu kendisi
// işletir, yenileme gerekmez. Sayaç bulunduğu kabın kalan alanına yayılır: bu yüzden ya kendi Column'unun son
// çocuğudur ya da sabit genişlikli bir Box içindedir (yoksa sonraki kardeşleri görünmez olur; duman testinde görüldü).
// env.width/height kutunun gerçek boyu (dp, yama): küçük ekranda hücreler ve yazılar küçülür.
import type * as UI from '@expo/ui/jetpack-compose';
import type * as M from '@expo/ui/jetpack-compose/modifiers';
import { createWidget } from 'expo-widgets';
import type { ReactElement } from 'react';

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

/**
 * bg zemin, ink yazı, muted soluk yazı, accent vurgu yazısı, tint hafif dolgu (boş daire);
 * fill ve onFill: sıradaki vaktin dolu hapı ve üstündeki yazı (eski verilerde yok: accent ve bg).
 */
export type PrayerWidgetColors = { bg: string; ink: string; muted: string; accent: string; tint: string; fill?: string; onFill?: string };
/** Bir gün: s = günün başı (ms, dize), d = gün etiketi, h = hicrî tarih, t = 6 saat ("05:12"), a = 6 an (ms, dize). */
export type PrayerWidgetDay = { s: string; d: string; h?: string; t: string[]; a: string[] };
/** system: telefonun açık/koyu ayarı; light/dark sabit. Zeminin şeffaflığı renkte (#RRGGBBAA). */
export type PrayerWidgetMode = 'system' | 'light' | 'dark';
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
  /** "{p} vaktine kalan" (geri sayımın üstü) */
  left?: string;
  /** "kaldı" (şeritte geri sayımın yanı) */
  remain?: string;
  /** Veri bittiğinde: "Güncellemek için MATAF'ı açın" */
  stale?: string;
  /** Hiç veri yokken */
  empty?: string;
  mode?: PrayerWidgetMode;
  light?: PrayerWidgetColors;
  dark?: PrayerWidgetColors;
};
/** Geri sayım: Text'in kendisi; countdownTo yerel tarafta Chronometer'a çevrilir, çocuk yazı yalnız yedek */
export type CountdownProps = { countdownTo: number; color: string; maxLines?: number; style?: { fontSize?: number; fontWeight?: 'bold' | 'normal'; textAlign?: 'start' | 'center' | 'end' }; children?: string };

function prayerLayout(props: PrayerWidgetProps, env: { colorScheme?: 'light' | 'dark'; width?: number; height?: number }) {
  'widget';
  const dk = props.mode === 'dark' || (props.mode !== 'light' && env.colorScheme === 'dark');
  let c = dk ? props.dark : props.light;
  if (!c) c = { bg: '#17120E99', ink: '#F6EFE7', muted: '#B3A393', accent: '#F7934F', tint: '#3A2214', fill: '#F7934F', onFill: '#1F0F05' };
  const fill = c.fill || c.accent;
  const onFill = c.onFill || c.bg;
  const Countdown = Text as unknown as (p: CountdownProps) => ReactElement;
  const days = props.days || [];
  const names = props.names && props.names.length === 6 ? props.names : ['İmsak', 'Güneş', 'Öğle', 'İkindi', 'Akşam', 'Yatsı'];
  const root = [fillMaxSize(), background(c.bg), cornerRadius(22), padding(14, 12, 14, 12)];

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
  const target = Number(day.a[pi]);
  const mins = Math.max(0, Math.ceil((target - now) / 60000));
  const fallback = Math.floor(mins / 60) + ':' + (mins % 60 < 10 ? '0' : '') + (mins % 60);
  const label = (props.left || '{p}').replace('{p}', names[pi]);
  const date = day.d + (day.h ? ' · ' + day.h : '');
  const when = day.t[pi] + (tomorrow && props.tomorrow ? ' · ' + props.tomorrow : '');
  // Boyutlar kutunun genişliğine göre (küçük ekranlarda altı vakit sığsın)
  const W = env.width && env.width > 0 ? env.width : 320;
  const cellW = Math.max(36, Math.min(56, Math.floor((W - 28) / 6)));
  const tSize = cellW >= 46 ? 15 : cellW >= 41 ? 14 : 12;
  const nSize = cellW >= 44 ? 11 : 10;
  const big = W >= 300 ? 32 : 28;

  // Altı vakit: sıradaki dolu hapta, geçenler soluk
  const cells = [];
  for (let k = 0; k < day.t.length && k < 6; k++) {
    const on = k === pi;
    const past = !tomorrow && k < pi;
    cells.push(
      <Column
        key={'p' + k}
        horizontalAlignment="center"
        modifiers={on ? [width(cellW), background(fill), cornerRadius(12), padding(0, 4, 0, 4)] : [width(cellW), padding(0, 4, 0, 4)]}>
        <Text color={on ? onFill : c.muted} maxLines={1} style={{ fontSize: nSize }}>{names[k]}</Text>
        <Text color={on ? onFill : past ? c.muted : c.ink} maxLines={1} style={{ fontSize: tSize, fontWeight: 'bold' }}>{day.t[k]}</Text>
      </Column>,
    );
  }

  return (
    <Column modifiers={root} verticalAlignment="center">
      <Row verticalAlignment="center" modifiers={[fillMaxWidth()]}>
        <Text color={c.ink} maxLines={1} style={{ fontSize: 13, fontWeight: 'bold' }}>{props.place || 'MATAF'}</Text>
        <Spacer modifiers={[width(8)]} />
        <Text color={c.muted} maxLines={1} style={{ fontSize: 12 }}>{date}</Text>
      </Row>
      <Spacer modifiers={[height(6)]} />
      <Row verticalAlignment="center" modifiers={[fillMaxWidth()]}>
        <Box contentAlignment="centerStart" modifiers={[width(Math.round(big * 4.3))]}>
          <Countdown countdownTo={target} color={c.ink} maxLines={1} style={{ fontSize: big, fontWeight: 'bold', textAlign: 'start' }}>{fallback}</Countdown>
        </Box>
        <Spacer modifiers={[width(8)]} />
        <Column>
          <Text color={c.accent} maxLines={1} style={{ fontSize: 12, fontWeight: 'bold' }}>{label}</Text>
          <Text color={c.ink} maxLines={1} style={{ fontSize: 15, fontWeight: 'bold' }}>{names[pi] + ' ' + when}</Text>
        </Column>
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
