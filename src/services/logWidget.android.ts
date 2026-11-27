// Namaz takibi küçük uygulamasını (Android) günceller: işaret değişince ve ana sayfa açılınca kayıt kutuya yazılır.
// Dil ve renkler ana sayfa açılınca kurulur (setLogWidgetContext) ve telefonda saklanır: bildirimdeki "Kıldım"
// uygulama kapalıyken işlenince (arka plan görevi, prayedTask.android.ts) kutu da aynı dil ve renkle yazılsın.
// Hiç kurulmadıysa yazılmaz; kutu "uygulamayı bir kez açın" der. Küçük uygulama modülü geç yüklenir; yerel modül
// yoksa (ör. Expo Go) sessizce atlanır.
import AsyncStorage from '@react-native-async-storage/async-storage';

import type { PrayerLog } from './prayerLog';
import { buildLogWidgetProps, type LogWidgetContext } from './widgetProps';

const CTX_KEY = 'widget:logCtx';

type Snap = { updateSnapshot(props: object): void };
let ctx: LogWidgetContext | null = null;
let savedSig = '';
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
  const sig = JSON.stringify(c);
  if (sig === savedSig) return;
  savedSig = sig;
  AsyncStorage.setItem(CTX_KEY, sig).catch(() => undefined);
}

async function context() {
  if (ctx) return ctx;
  try {
    const raw = await AsyncStorage.getItem(CTX_KEY);
    if (raw) ctx = JSON.parse(raw) as LogWidgetContext;
  } catch {
    /* yok ya da bozuk: kurulmamış say */
  }
  return ctx;
}

/** Kaydı kutuya yazar; hata vermez (arka plan görevi sonucu bekler, yoksa JS kutu yazılmadan kapanabilir). */
export async function pushLogWidget(log: PrayerLog) {
  try {
    const c = await context();
    if (!c) return;
    const w = await load();
    w?.updateSnapshot(buildLogWidgetProps({ ...c, log, today: new Date() }));
  } catch (e) {
    console.warn('[widget] takip güncellenemedi', e);
  }
}
