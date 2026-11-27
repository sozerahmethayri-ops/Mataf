// Ana sayfa açıkken namaz takibi küçük uygulamasının dilini, rengini ve hatim satırını kurar, işaretleri yazar.
import { useEffect } from 'react';

import { LOG_NAMES } from '@/components/PrayerLogCard';
import { pick } from '@/i18n';
import { readFromMark, readShare } from './hatim';
import { pushLogWidget, setLogWidgetContext } from './logWidget';
import { LOG_PRAYERS } from './prayerLog';
import { useQuranPrefs } from './QuranPrefs';
import { useTheme } from './ThemeContext';
import { useHatimPlan } from './useHatimPlan';
import { usePrayerLog } from './usePrayerLog';

type Lang = 'tr' | 'en' | 'ar';
const L = {
  title: { tr: 'Bugünkü namazlarım', en: 'Today’s prayers', ar: 'صلواتي اليوم' },
  allDone: { tr: 'Beş vakit tamam', en: 'All five prayed', ar: 'أتممت الصلوات الخمس' },
  empty: { tr: 'Namaz takibi için MATAF’ı bir kez açın', en: 'Open MATAF once to start tracking', ar: 'افتح MATAF مرة لبدء المتابعة' },
  hatim: { tr: 'Hatim', en: 'Khatm', ar: 'الختمة' },
};

export function useLogWidgetSync(lg: Lang) {
  const { log } = usePrayerLog();
  const { prefs } = useTheme();
  const { bookmarks } = useQuranPrefs();
  const [plan] = useHatimPlan();
  const hb = bookmarks.find((b) => b.hatim);
  const hatim = plan && hb ? `${pick(L.hatim, lg)} %${Math.round(readShare(readFromMark(hb.surah, hb.ayah)) * 100)}` : undefined;
  useEffect(() => {
    setLogWidgetContext({
      title: pick(L.title, lg),
      names: LOG_PRAYERS.map((p) => pick(LOG_NAMES[p], lg)),
      allDone: pick(L.allDone, lg),
      empty: pick(L.empty, lg),
      hatim,
      palette: prefs.palette,
      mode: prefs.mode,
      style: prefs.widget,
      clear: prefs.widgetClear,
    });
    pushLogWidget(log);
  }, [log, lg, hatim, prefs.palette, prefs.mode, prefs.widget, prefs.widgetClear]);
}
