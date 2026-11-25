// Ortadaki Ana sayfa sekmesi: Ayarlar'da seçilen ekranı gösterir (varsayılan: sade ezan vakitleri).
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
