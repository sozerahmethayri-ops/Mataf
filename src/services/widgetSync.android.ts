// Ana ekran namaz vakti küçük uygulamalarını (Android; dört boy) güncel tutar: vakit ekranı açıldığında
// 30 günün vakitlerini hesaplayıp hepsine yazar ve vakit girdiği anlarda yenilenmeleri için alarm kurar
// (yerel yama: scheduleWidgetTicks). Yer, yöntem, dil ya da tema değişince yeniden yazılır.
// Küçük uygulama modülleri geç yüklenir; yerel modül yoksa (ör. Expo Go) sessizce atlanır.
import { requireOptionalNativeModule } from 'expo';
import { useEffect } from 'react';

import { useI18n } from '@/i18n';
import type { Lang } from '@/i18n/strings';
import { PRAYERS, fmtTime, times } from './prayer';
import { useTheme } from './ThemeContext';
import { buildWidgetProps, widgetPlace, widgetTicks } from './widgetProps';
import type { WidgetSyncInput } from './widgetSync';

type Snap = { updateSnapshot(props: object): void };
/** Dört boy: orta (4×2), küçük (2×2), liste (2×3), şerit (4×1) */
export const WIDGET_NAMES = ['PrayerWidget', 'NextPrayerWidget', 'PrayerListWidget', 'PrayerStripWidget'] as const;
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
    const sig = [loc.lat.toFixed(3), loc.lng.toFixed(3), loc.tz ?? '', method, place, lg, names, prefs.palette, prefs.mode, day].join('~');
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
            place,
            names: names.split('|'),
            lang: lg,
            palette: prefs.palette,
            mode: prefs.mode,
          });
          for (const w of ws) w.updateSnapshot(props);
          // Vakit girince (ve gün dönünce) küçük uygulamalar hemen yenilensin
          pinApi()?.scheduleWidgetTicks?.(widgetTicks(props, Date.now()));
          lastSig = sig;
        } catch (e) {
          console.warn('[widget] güncellenemedi', e);
        }
      }).catch(() => undefined);
    }, 1200);
    return () => clearTimeout(id);
  }, [waiting, loc.lat, loc.lng, loc.tz, method, place, lg, names, prefs.palette, prefs.mode]);
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
