// Ana ekran namaz vakti küçük uygulamalarını (Android; dört boy) güncel tutar: vakit ekranı açıldığında
// 30 günün vakitlerini hesaplayıp hepsine yazar ve vakit girdiği anlarda yenilenmeleri için alarm kurar
// (yerel yama: scheduleWidgetTicks). Yer, yöntem, dil ya da tema değişince yeniden yazılır.
// Küçük uygulama modülleri geç yüklenir; yerel modül yoksa (ör. Expo Go) sessizce atlanır.
import { requireOptionalNativeModule } from 'expo';
import * as Notifications from 'expo-notifications';
import { useEffect } from 'react';

import { useI18n } from '@/i18n';
import { loadNotifPrefs } from './adhanNotify';
import type { Lang } from '@/i18n/strings';
import { hijriText } from './hijri';
import { PRAYERS, fmtTime, times } from './prayer';
import { useTheme } from './ThemeContext';
import { buildWidgetProps, widgetPlace, widgetTicks } from './widgetProps';
import type { WidgetSyncInput } from './widgetSync';

type Snap = { updateSnapshot(props: object): void };
/** Dört vakit boyu: orta (4×2), küçük (2×2), liste (2×3), şerit (4×1); beşincisi namaz takibi (4×2, logWidget.android.ts) */
export const WIDGET_NAMES = ['PrayerWidget', 'NextPrayerWidget', 'PrayerListWidget', 'PrayerStripWidget', 'PrayerLogWidget'] as const;
export type WidgetName = (typeof WIDGET_NAMES)[number];
let loading: Promise<Snap[]> | null = null;
function loadWidgets() {
  const one = (p: Promise<{ default: unknown }>) => p.then((m) => m.default as unknown as Snap).catch((e: unknown) => {
    console.warn('[widget] yüklenemedi', e);
    return null;
  });
  loading ??= Promise.all([
    one(import('@/widgets/PrayerWidget')),
    one(import('@/widgets/NextPrayerWidget')),
    one(import('@/widgets/PrayerListWidget')),
    one(import('@/widgets/PrayerStripWidget')),
  ]).then((all) => all.filter((w): w is Snap => !!w));
  return loading;
}

let lastSig = '';
let lastProps: ReturnType<typeof buildWidgetProps> | null = null;
const today = () => new Date();

export function usePrayerWidgetSync({ loc, method, label, waiting }: WidgetSyncInput) {
  const { t, lang } = useI18n();
  const { prefs } = useTheme();
  const lg = lang as Lang;
  const place = widgetPlace(label, lg);
  const names = PRAYERS.map((p) => t(`pray.${p}` as const).split(' · ')[0]).join('|');

  useEffect(() => {
    if (waiting) return;
    const day = today().toDateString();
    const sig = [loc.lat.toFixed(3), loc.lng.toFixed(3), loc.tz ?? '', method, place, lg, names, prefs.palette, prefs.mode, prefs.widget, prefs.widgetClear, day].join('~');
    if (sig === lastSig) return;
    // İlk çizimi bekletmemek için biraz sonra
    const id = setTimeout(() => {
      loadWidgets().then((ws) => {
        if (!ws.length || sig === lastSig) return;
        try {
          const dayFmt = new Intl.DateTimeFormat(lg, { day: 'numeric', month: 'long', weekday: 'short' });
          const props = buildWidgetProps({
            start: today(),
            timesFor: (d) => times(loc.lat, loc.lng, method, d),
            fmt: (d) => fmtTime(d, loc.tz),
            dayLabel: (d) => dayFmt.format(d),
            hijriLabel: (d) => hijriText(d, lg),
            place,
            names: names.split('|'),
            lang: lg,
            palette: prefs.palette,
            mode: prefs.mode,
            style: prefs.widget,
            clear: prefs.widgetClear,
          });
          for (const w of ws) w.updateSnapshot(props);
          // Vakit girince (ve gün dönünce) küçük uygulamalar ve kalıcı vakit bildirimi hemen yenilensin
          pinApi()?.scheduleWidgetTicks?.(widgetTicks(props, Date.now()));
          lastProps = props;
          lastSig = sig;
          ongoingLang = lg;
          loadNotifPrefs().then((n) => setOngoingPrayer(n.ongoing)).catch(() => undefined);
        } catch (e) {
          console.warn('[widget] güncellenemedi', e);
        }
      }).catch(() => undefined);
    }, 1200);
    return () => clearTimeout(id);
  }, [waiting, loc.lat, loc.lng, loc.tz, method, place, lg, names, prefs.palette, prefs.mode, prefs.widget, prefs.widgetClear]);
}

// ── Kalıcı vakit bildirimi (bildirim panelinde MATAF kutusu; src/widgets/PrayerNotification.tsx) ──
type Ongoing = { post(props: object, options: object): Promise<unknown>; cancelAll(): Promise<void> };
let ongoing: Promise<Ongoing | null> | null = null;
let ongoingLang: Lang = 'tr';
const ONGOING_CHANNEL = 'mataf-vakit';
function loadOngoing() {
  ongoing ??= import('@/widgets/PrayerNotification').then((m) => m.default as unknown as Ongoing).catch(() => null);
  return ongoing;
}
/** Açıksa son vakit verisiyle bildirimi koy (aynı kimlikle günceller), kapalıysa kaldır. İzin yoksa sessizce geçer. */
export async function setOngoingPrayer(enabled: boolean) {
  const f = await loadOngoing();
  if (!f) return;
  try {
    if (!enabled) { await f.cancelAll(); return; }
    if (!lastProps) return;
    // Sessiz, rozetsiz kanal: kalıcı kutu ses çıkarmaz, titremez
    await Notifications.setNotificationChannelAsync(ONGOING_CHANNEL, {
      name: { tr: 'Vakit kutusu (kalıcı)', en: 'Prayer times (persistent)', ar: 'أوقات الصلاة (دائم)' }[ongoingLang],
      importance: Notifications.AndroidImportance.LOW, // eslint-disable-line import/namespace
      sound: null,
      enableVibrate: false,
      showBadge: false,
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC, // eslint-disable-line import/namespace
    }).catch(() => undefined);
    await f.post(lastProps, { id: 'vakit', channelId: ONGOING_CHANNEL, ongoing: true, alertOnlyOnce: true, autoCancel: false, url: 'mataf://vakitler' });
  } catch (e) {
    console.warn('[bildirim] kalıcı vakit', e);
  }
}

/** Yenileme anlarını yeniden kur (ör. tam zamanlı alarm izni yeni verildiyse alarmlar artık tam vaktinde). */
export function refreshWidgetTicks() {
  if (lastProps) pinApi()?.scheduleWidgetTicks?.(widgetTicks(lastProps, Date.now()));
}

// ── Ana ekrana ekleme (başlatıcı onay penceresi açar; Android 8+) ──
type PinApi = {
  isPinWidgetSupported?: () => boolean;
  requestPinWidget?: (name: string) => boolean;
  installedWidgetCount?: (name: string) => number;
  scheduleWidgetTicks?: (times: number[]) => void;
};
function pinApi(): PinApi | null {
  try {
    return requireOptionalNativeModule<PinApi>('ExpoWidgets');
  } catch {
    return null;
  }
}
export function widgetPinSupported() {
  try {
    return !!pinApi()?.isPinWidgetSupported?.();
  } catch {
    return false;
  }
}
/** Ana ekranda kaç tane var (dört boyun toplamı) */
export function widgetCount() {
  try {
    const api = pinApi();
    return WIDGET_NAMES.reduce((n, w) => n + (api?.installedWidgetCount?.(w) ?? 0), 0);
  } catch {
    return 0;
  }
}
export function pinPrayerWidget(name: WidgetName = 'PrayerWidget') {
  try {
    return !!pinApi()?.requestPinWidget?.(name);
  } catch {
    return false;
  }
}
