// Ana ekran küçük uygulaması yalnız Android'de var (widgetSync.android.ts); web ve iOS'ta bir şey yapmaz.
import type { MethodId } from './prayer';
import type { PrayerLoc } from './prayerPlace';

export type WidgetSyncInput = { loc: PrayerLoc; method: MethodId; label: string; waiting: boolean };

export function usePrayerWidgetSync(input: WidgetSyncInput): void {
  void input;
}

export const widgetPinSupported = () => false;
export const widgetCount = () => 0;
export const pinPrayerWidget = () => false;
