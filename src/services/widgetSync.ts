// Ana ekran küçük uygulaması yalnız Android'de var (widgetSync.android.ts); web ve iOS'ta bir şey yapmaz.
import type { MethodId } from './prayer';
import type { PrayerLoc } from './prayerPlace';

export type WidgetSyncInput = { loc: PrayerLoc; method: MethodId; label: string; waiting: boolean };

export function usePrayerWidgetSync(input: WidgetSyncInput): void {
  void input;
}

export const widgetPinSupported = () => false;
export const refreshWidgetTicks = () => undefined;
/** Kalıcı vakit bildirimi yalnız Android'de (widgetSync.android.ts) */
export const setOngoingPrayer = async (enabled: boolean) => { void enabled; };
export const widgetCount = () => 0;
export const WIDGET_NAMES = ['PrayerWidget', 'NextPrayerWidget', 'PrayerListWidget', 'PrayerStripWidget', 'PrayerLogWidget'] as const;
export type WidgetName = (typeof WIDGET_NAMES)[number];
export function pinPrayerWidget(name?: WidgetName) {
  void name;
  return false;
}
