// Namaz takibi küçük uygulaması yalnız Android'de var (logWidget.android.ts); web ve iOS'ta bir şey yapmaz.
import type { PrayerLog } from './prayerLog';
import type { LogWidgetContext } from './widgetProps';

export function setLogWidgetContext(ctx: LogWidgetContext): void {
  void ctx;
}

export function pushLogWidget(log: PrayerLog): void {
  void log;
}
