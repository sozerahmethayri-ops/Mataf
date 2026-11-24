import { createContext, useContext, type ReactNode } from 'react';

import { defaultQuranPrefs, type QuranPrefs } from '@/data/quranEditions';
import { useI18n } from '@/i18n';
import { usePersisted } from './usePersisted';

type Ctx = { prefs: QuranPrefs; setPrefs: (p: Partial<QuranPrefs>) => void };
const QuranPrefsContext = createContext<Ctx | null>(null);

/** Kur'an okuma tercihleri (meal, okunuş, kâri, sesli meal, tefsir) — cihazda saklanır. */
export function QuranPrefsProvider({ children }: { children: ReactNode }) {
  const { lang } = useI18n();
  const [prefs, setPrefs] = usePersisted<QuranPrefs>('quran:prefs', defaultQuranPrefs(lang));
  return <QuranPrefsContext.Provider value={{ prefs, setPrefs }}>{children}</QuranPrefsContext.Provider>;
}

export function useQuranPrefs() {
  const c = useContext(QuranPrefsContext);
  if (!c) throw new Error('QuranPrefsProvider eksik');
  return c;
}
