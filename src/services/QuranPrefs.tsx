import { createContext, useContext, type ReactNode } from 'react';

import { defaultQuranPrefs, type QuranPrefs } from '@/data/quranEditions';
import { useI18n } from '@/i18n';
import { usePersisted } from './usePersisted';

/** Ayraç: Hatim ayracı ve kullanıcının adlandırdığı diğerleri; her biri ayrı yeri hatırlar. */
export type Bookmark = { id: string; name: string; surah: number; ayah: number; at: number; hatim?: boolean };

type Ctx = {
  prefs: QuranPrefs;
  setPrefs: (p: Partial<QuranPrefs>) => void;
  bookmarks: Bookmark[];
  saveBookmark: (b: Bookmark) => void;
  removeBookmark: (id: string) => void;
};
const QuranPrefsContext = createContext<Ctx | null>(null);
const stamp = () => Date.now();

/** Kur'an okuma tercihleri (meal, okunuş, kâri, sesli meal, tefsir, görünüm) ve ayraçlar — cihazda saklanır. */
export function QuranPrefsProvider({ children }: { children: ReactNode }) {
  const { lang } = useI18n();
  const [prefs, setPrefs] = usePersisted<QuranPrefs>('quran:prefs', defaultQuranPrefs(lang));
  const [bm, setBm] = usePersisted<{ items: Bookmark[] }>('quran:bookmarks', {
    items: [{ id: 'hatim', name: lang === 'en' ? 'Khatm' : lang === 'ar' ? 'الختمة' : 'Hatim', surah: 1, ayah: 1, at: 0, hatim: true }],
  });
  const saveBookmark = (b: Bookmark) => {
    const others = bm.items.filter((x) => x.id !== b.id);
    setBm({ items: [...others, { ...b, at: stamp() }].sort((x, y) => (x.hatim ? -1 : y.hatim ? 1 : y.at - x.at)) });
  };
  const removeBookmark = (id: string) => setBm({ items: bm.items.filter((x) => x.id !== id || x.hatim) });
  return <QuranPrefsContext.Provider value={{ prefs, setPrefs, bookmarks: bm.items, saveBookmark, removeBookmark }}>{children}</QuranPrefsContext.Provider>;
}

export function useQuranPrefs() {
  const c = useContext(QuranPrefsContext);
  if (!c) throw new Error('QuranPrefsProvider eksik');
  return c;
}
