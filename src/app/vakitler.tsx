import { router, useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';

import PrayerTimes from '@/screens/PrayerTimes';
import { pinPrayerWidget } from '@/services/widgetSync';

export default function PrayerTimesRoute() {
  const { widget } = useLocalSearchParams<{ widget?: string }>();
  // mataf://vakitler?widget=1 → başlatıcının "ana ekrana ekle" penceresi (Android)
  useEffect(() => {
    if (widget !== '1') return;
    pinPrayerWidget();
    // Parametre durumda kalırsa uygulama yeniden açılınca pencere tekrar çıkar: hemen temizle
    router.setParams({ widget: undefined });
  }, [widget]);
  return <PrayerTimes back />;
}
