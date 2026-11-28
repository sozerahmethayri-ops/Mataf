// Alt sekme yuvası (0.25.0): Ayarlar → Alt sekmeler'de bu yuvaya seçilen bölümü çizer (services/tabs.ts).
// Bölümler sekmede geri düğmesiz açılır; aynı bölümün yığın ekranı (/harita, /kuran, …) geri düğmeli.
import { useTheme } from '@/services/ThemeContext';
import { normTabs, type TabId } from '@/services/tabs';
import HacUmre from './HacUmre';
import HadithDua from './HadithScreen';
import Kible from './Kible';
import MapScreen from './MapScreen';
import PrayerTimes from './PrayerTimes';
import QuranList from './QuranList';
import Transport from './Transport';
import Zikir from './Zikir';

export function Panel({ id }: { id: TabId }) {
  switch (id) {
    case 'harita': return <MapScreen />;
    case 'kuran': return <QuranList />;
    case 'ulasim': return <Transport />;
    case 'hac': return <HacUmre />;
    case 'vakitler': return <PrayerTimes />;
    case 'kible': return <Kible back={false} />;
    case 'zikir': return <Zikir back={false} />;
    case 'hadis': return <HadithDua />;
  }
}

export default function TabSlot({ slot }: { slot: 0 | 1 | 2 }) {
  const { prefs } = useTheme();
  return <Panel id={normTabs(prefs.tabs)[slot]} />;
}
