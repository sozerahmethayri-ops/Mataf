// Android: bildirimdeki "Kıldım" uygulamayı açmadan işler. expo-notifications, düğmeye uygulama önde değilken
// dokunulunca bu görevi çalıştırır; uygulama kapalıysa expo-task-manager JS'i görünmeden yükler (ekranlar kurulmaz).
// Görev vakti Namaz takibine işler, bildirimi kapatır ve ana ekran kutusunu yeniler. Uygulama kapalıyken de tanımlı
// olsun diye giriş dosyasından (index.ts) yüklenir. Kayıt kurulamazsa düğme eskisi gibi uygulamayı açar (adhanNotify).
import * as Notifications from 'expo-notifications';
import * as TaskManager from 'expo-task-manager';

import { PRAYED_TASK, prayedFromResponse } from './prayedTask.types';
import { markPrayed } from './usePrayerLog';

export * from './prayedTask.types';

TaskManager.defineTask(PRAYED_TASK, async ({ data, error }) => {
  if (error) return;
  const hit = prayedFromResponse(data);
  if (!hit) return;
  try {
    if (hit.day && hit.prayer) await markPrayed(hit.day, hit.prayer);
  } finally {
    // Bildirimdeki düğmeler bildirimi kendiliğinden kapatmaz
    await Notifications.dismissNotificationAsync(hit.id).catch(() => undefined);
  }
  console.log(`[kıldım] arka planda işlendi: ${hit.prayer ?? 'deneme'}`);
});

let ready = false;
/** Görev bu açılışta kuruldu mu (düğme uygulamayı açmadan işliyor) */
export const prayedInBackground = () => ready;

/** Görevi kaydeder (kayıt kalıcı; her açılışta denetlenir). Kurulamazsa false: düğme uygulamayı açar. */
export async function registerPrayedTask() {
  try {
    if (!(await TaskManager.isTaskRegisteredAsync(PRAYED_TASK))) await Notifications.registerTaskAsync(PRAYED_TASK);
    ready = true;
  } catch (e) {
    console.warn('[kıldım] arka plan görevi kurulamadı', e);
    ready = false;
  }
  return ready;
}
