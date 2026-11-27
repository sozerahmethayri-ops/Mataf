// Namaz takibi küçük uygulamasını (Android) günceller: işaret değişince ve ana sayfa açılınca kayıt kutuya yazılır.
// Dil ve renkler ana sayfa açılınca kurulur (setLogWidgetContext); kurulmadıysa yazılmaz, ilk açılışta yazılır.
// Küçük uygulama modülü geç yüklenir; yerel modül yoksa (ör. Expo Go) sessizce atlanır.
import type { PrayerLog } from './prayerLog';
import { buildLogWidgetProps, type LogWidgetContext } from './widgetProps';

type Snap = { updateSnapshot(props: object): void };
let ctx: LogWidgetContext | null = null;
let widget: Promise<Snap | null> | null = null;
const load = () =>
  (widget ??= import('@/widgets/PrayerLogWidget')
    .then((m) => m.default as unknown as Snap)
    .catch((e: unknown) => {
      console.warn('[widget] takip yüklenemedi', e);
      return null;
    }));

export function setLogWidgetContext(c: LogWidgetContext) {
  ctx = c;
}

export function pushLogWidget(log: PrayerLog) {
  const c = ctx;
  if (!c) return;
  load()
    .then((w) => {
      try {
        w?.updateSnapshot(buildLogWidgetProps({ ...c, log, today: new Date() }));
      } catch (e) {
        console.warn('[widget] takip güncellenemedi', e);
      }
    })
    .catch(() => undefined);
}
