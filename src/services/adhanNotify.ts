// Ezan hatırlatmalarını telefona kurar (expo-notifications, yerel bildirim — sunucu gerekmez).
// Notlar:
//  • Expo Go'da yerel bildirimler çalışır ama uygulamaya özel sesler (zil, çan…) yalnız kendi derlemenizde
//    (EAS / development build) duyulur; Expo Go'da telefonun varsayılan sesi çalar.
//  • iOS en çok 64 bekleyen bildirim tutar: ~5 günlük plan kurulur, uygulama her açıldığında yenilenir.
//  • Tam ezan kaydı bildirim sesi olamaz (iOS 30 sn sınırı, Android kanal sesi derlemeye gömülü olmalı);
//    kullanıcının seçtiği ezan dosyası uygulama açıkken vakit girince ya da bildirime dokununca çalar.
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { DEFAULT_NOTIF, SOUNDS, channelId, notifText, planExtras, planNotifications, type NotifPrefs } from './adhanPlan';
import { PLACES, fmtTime, getMethod, times, type MethodId } from './prayer';

export const NOTIF_KEY = 'adhan:prefs';
type Lang = 'tr' | 'en' | 'ar';

export const notificationsSupported = Platform.OS !== 'web';

export function mergeNotif(raw: Partial<NotifPrefs> | null | undefined): NotifPrefs {
  return { ...DEFAULT_NOTIF, ...(raw ?? {}), prayers: { ...DEFAULT_NOTIF.prayers, ...(raw?.prayers ?? {}) } };
}
export async function loadNotifPrefs(): Promise<NotifPrefs> {
  try {
    const raw = await AsyncStorage.getItem(NOTIF_KEY);
    return mergeNotif(raw ? JSON.parse(raw) : null);
  } catch {
    return DEFAULT_NOTIF;
  }
}

let handlerSet = false;
/** Uygulama açıkken gelen bildirim de afiş + ses olarak gösterilsin. */
export function initNotifications() {
  if (!notificationsSupported || handlerSet) return;
  handlerSet = true;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: false }),
  });
}

const REMINDER_CHANNEL = 'hatirlatma-v1';

async function ensureChannels(lang: Lang) {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(REMINDER_CHANNEL, {
    name: { tr: 'Mübarek gün ve hac hatırlatmaları', en: 'Holy day and Hajj reminders', ar: 'تذكيرات الأيام المباركة والحج' }[lang],
    importance: Notifications.AndroidImportance.HIGH, // eslint-disable-line import/namespace
    sound: 'default',
    enableVibrate: true,
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC, // eslint-disable-line import/namespace
  });
  const title = { tr: 'Ezan hatırlatma', en: 'Adhan reminder', ar: 'تذكير الأذان' }[lang];
  for (const s of SOUNDS) {
    await Notifications.setNotificationChannelAsync(channelId(s.id), {
      name: `${title} — ${s.ml[lang]}`,
      importance: Notifications.AndroidImportance.HIGH, // eslint-disable-line import/namespace -- çalışma zamanında var; eklenti enum dışa aktarımını göremiyor
      sound: s.file ?? (s.id === 'default' ? 'default' : null),
      vibrationPattern: [0, 400, 250, 400],
      enableVibrate: true,
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC, // eslint-disable-line import/namespace
    });
  }
}

export async function notifPermission(ask: boolean): Promise<boolean> {
  if (!notificationsSupported) return false;
  const cur = await Notifications.getPermissionsAsync();
  if (cur.granted || cur.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL) return true; // eslint-disable-line import/namespace
  if (!ask || !cur.canAskAgain) return false;
  const r = await Notifications.requestPermissionsAsync({ ios: { allowAlert: true, allowSound: true, allowBadge: false } });
  return r.granted;
}

/** Hangi konumun vakitleri? "Bulunduğum yer" için son bilinen konum (izin varsa güncellenir). */
async function resolvePlace(p: NotifPrefs): Promise<{ lat: number; lng: number; tz?: string; method: MethodId } | null> {
  if (p.place !== 'here') return { ...PLACES[p.place], method: 'UmmAlQura' };
  let lat = p.lat;
  let lng = p.lng;
  try {
    const perm = await Location.getForegroundPermissionsAsync();
    if (perm.granted) {
      const l = await Location.getLastKnownPositionAsync({ maxAge: 6 * 3600 * 1000 });
      if (l) { lat = l.coords.latitude; lng = l.coords.longitude; }
    }
  } catch { /* son kayıtlı konumla devam */ }
  if (lat == null || lng == null) return null;
  if (lat !== p.lat || lng !== p.lng) {
    AsyncStorage.setItem(NOTIF_KEY, JSON.stringify({ ...p, lat, lng })).catch(() => undefined);
  }
  return { lat, lng, method: await getMethod() };
}

export type ApplyResult = { ok: boolean; count: number; first?: Date; reason?: 'web' | 'permission' | 'location' | 'off' };

/** Tüm ezan bildirimlerini siler ve tercihlere göre yeniden kurar. */
export async function applySchedule(prefs: NotifPrefs, lang: Lang, { ask = false } = {}): Promise<ApplyResult> {
  if (!notificationsSupported) return { ok: false, count: 0, reason: 'web' };
  await Notifications.cancelAllScheduledNotificationsAsync();
  // Hac hatırlatmaları ezan bildirimlerinden bağımsız açılabilir
  if (!prefs.enabled && !prefs.hajj) return { ok: true, count: 0, reason: 'off' };
  if (!(await notifPermission(ask))) return { ok: false, count: 0, reason: 'permission' };
  const resolved = await resolvePlace(prefs);
  if (!resolved && prefs.enabled) return { ok: false, count: 0, reason: 'location' };
  const place = resolved ?? { ...PLACES.makkah, method: 'UmmAlQura' as MethodId };
  await ensureChannels(lang);
  const now = new Date();
  const extras = planExtras({
    now, days: 7, lang, special: prefs.enabled && prefs.special, hajj: prefs.hajj,
    timesFor: (day) => times(place.lat, place.lng, place.method, day),
    timesAt: (lat, lng, day) => times(lat, lng, 'UmmAlQura', day),
  }).slice(0, 20);
  for (const x of extras) {
    await Notifications.scheduleNotificationAsync({
      identifier: x.id,
      content: { title: x.title, body: x.body, sound: 'default', data: { kind: 'reminder', url: x.url } },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: x.at, channelId: REMINDER_CHANNEL },
    });
  }
  // iOS en çok 64 bekleyen bildirim tutar: hatırlatmalar önce, ezanlar kalan yere
  const plan = prefs.enabled ? planNotifications((day) => times(place.lat, place.lng, place.method, day), now, prefs, { max: 60 - extras.length }) : [];
  const sound = SOUNDS.find((s) => s.id === prefs.sound) ?? SOUNDS[0];
  for (const p of plan) {
    const minutes = Math.round((p.prayerAt.getTime() - p.at.getTime()) / 60000);
    const { title, body } = notifText(p, lang, fmtTime(p.prayerAt, place.tz), minutes);
    await Notifications.scheduleNotificationAsync({
      identifier: p.id,
      content: {
        title,
        body,
        sound: sound.file ?? (sound.id === 'silent' ? false : 'default'),
        data: { kind: 'adhan', type: p.kind, prayer: p.prayer, url: '/vakitler' },
        ...(Platform.OS === 'android' ? { priority: Notifications.AndroidNotificationPriority.MAX } : {}),
      },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: p.at, channelId: channelId(sound.id) },
    });
  }
  const firsts = [plan[0]?.at, extras[0]?.at].filter((d): d is Date => !!d).sort((a, b) => a.getTime() - b.getTime());
  return { ok: true, count: plan.length + extras.length, first: firsts[0] };
}

/** Uygulama açılışında / öne gelişinde sessizce yenile (izin istemeden). */
export async function refreshSchedule(lang: Lang) {
  if (!notificationsSupported) return;
  const prefs = await loadNotifPrefs();
  if (!prefs.enabled && !prefs.hajj) return;
  await applySchedule(prefs, lang).catch(() => undefined);
}

/** Seçilen sesi denemek için 5 sn sonra bir örnek bildirim. */
export async function sendTest(prefs: NotifPrefs, lang: Lang) {
  if (!(await notifPermission(true))) return false;
  await ensureChannels(lang);
  const sound = SOUNDS.find((s) => s.id === prefs.sound) ?? SOUNDS[0];
  await Notifications.scheduleNotificationAsync({
    content: {
      title: { tr: 'Deneme: ezan hatırlatması', en: 'Test: adhan reminder', ar: 'تجربة: تذكير الأذان' }[lang],
      body: { tr: `Ses: ${sound.ml.tr}`, en: `Sound: ${sound.ml.en}`, ar: `الصوت: ${sound.ml.ar}` }[lang],
      sound: sound.file ?? (sound.id === 'silent' ? false : 'default'),
      data: { kind: 'adhan', type: 'at', test: true },
    },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: 5, channelId: channelId(sound.id) },
  });
  return true;
}
