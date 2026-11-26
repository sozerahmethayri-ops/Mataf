// Ortadaki Ana sayfa sekmesi: Ayarlar'da seçilen ekranı gösterir (varsayılan: sade ezan vakitleri).
// İlk açılışta bir kez "Hoş geldiniz" ekranını açar.
import { router } from 'expo-router';
import { useEffect } from 'react';

import { needsOnboarding } from '@/services/onboarding';
import { useTheme } from '@/services/ThemeContext';
import HadithDua from './HadithScreen';
import HomePrayer from './HomePrayer';
import MapScreen from './MapScreen';
import PrayerTimes from './PrayerTimes';
import QuranList from './QuranList';
import Tawaf from './Tawaf';
import Zikir from './Zikir';

export default function Home() {
  const { prefs } = useTheme();
  useEffect(() => {
    let alive = true;
    needsOnboarding().then((n) => { if (alive && n) router.push('/hosgeldin'); });
    return () => { alive = false; };
  }, []);
  switch (prefs.home) {
    case 'vakitler': return <PrayerTimes />;
    case 'kuran': return <QuranList />;
    case 'harita': return <MapScreen />;
    case 'tavaf': return <Tawaf />;
    case 'zikir': return <Zikir />;
    case 'hadis': return <HadithDua />;
    default: return <HomePrayer />;
  }
}
