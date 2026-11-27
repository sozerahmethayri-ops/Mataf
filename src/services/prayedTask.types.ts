// Bildirimdeki "Kıldım" düğmesinin ortak parçaları (React'sız, testli). Android'de düğme uygulamayı açmadan arka plan
// görevini çalıştırır (prayedTask.android.ts); görev kurulamazsa ya da başka platformda uygulama açılır ve yanıtı
// AdhanHost işler. İkisi de yanıtı prayedFromResponse ile okur.
import { LOG_PRAYERS, type LogPrayer } from './prayerLog';

/** Vakit girdi bildirimindeki "Kıldım" düğmesinin kimliği */
export const PRAYED_ACTION = 'prayed';
/** Arka plan görevinin adı. Android kaydı bu adla tutar: değişirse eski kayıt boşa düşer. */
export const PRAYED_TASK = 'mataf-prayed';

/** id: bildirimin kimliği (kapatmak için); day ve prayer: işlenecek vakit (deneme bildiriminde ikisi de boş) */
export type PrayedHit = { id: string; day: string | null; prayer: LogPrayer | null };

type RawResponse = {
  actionIdentifier?: unknown;
  notification?: { request?: { identifier?: unknown; content?: { data?: unknown; dataString?: unknown } | null } | null } | null;
};

/**
 * Bildirim yanıtından "Kıldım"ı çıkarır; başka düğme ya da bozuk yanıt için null. Uygulama içindeki dinleyicide
 * content.data nesnedir; arka plan görevinde Android yerel bildirimin verisini content.dataString (JSON) olarak verir.
 */
export function prayedFromResponse(r: unknown): PrayedHit | null {
  if (!r || typeof r !== 'object') return null;
  const x = r as RawResponse;
  if (x.actionIdentifier !== PRAYED_ACTION) return null;
  const req = x.notification?.request;
  const id = req?.identifier;
  if (typeof id !== 'string' || !id) return null;
  let data: unknown = req?.content?.data;
  const ds = req?.content?.dataString;
  if ((!data || typeof data !== 'object' || Object.keys(data).length === 0) && typeof ds === 'string') {
    try {
      data = JSON.parse(ds);
    } catch {
      data = null;
    }
  }
  const d = (data && typeof data === 'object' ? data : {}) as { day?: unknown; prayer?: unknown };
  const day = typeof d.day === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d.day) ? d.day : null;
  const prayer = typeof d.prayer === 'string' && (LOG_PRAYERS as readonly string[]).includes(d.prayer) ? (d.prayer as LogPrayer) : null;
  return day && prayer ? { id, day, prayer } : { id, day: null, prayer: null };
}
