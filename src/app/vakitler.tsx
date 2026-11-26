import { router, useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';

import PrayerTimes from '@/screens/PrayerTimes';
import { WIDGET_NAMES, pinPrayerWidget, type WidgetName } from '@/services/widgetSync';

export default function PrayerTimesRoute() {
  const { widget } = useLocalSearchParams<{ widget?: string }>();
  // mataf://vakitler?widget=1 → başlatıcının "ana ekrana ekle" penceresi (Android); widget=NextPrayerWidget gibi
  // bir ad verilirse o boy eklenir
  useEffect(() => {
    if (!widget) return;
    const name = (WIDGET_NAMES as readonly string[]).includes(widget) ? (widget as WidgetName) : widget === '1' ? 'PrayerWidget' : null;
    if (!name) return;
    pinPrayerWidget(name);
    // Parametre durumda kalırsa uygulama yeniden açılınca pencere tekrar çıkar: hemen temizle
    router.setParams({ widget: undefined });
  }, [widget]);
  return <PrayerTimes back />;
}
