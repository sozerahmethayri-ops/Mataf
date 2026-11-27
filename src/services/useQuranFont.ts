// Kur'an hattını yükler: dosyalar uygulamanın içinde (internet gerekmez), ilk seçildiğinde bir kez yüklenir.
// Yüklenene dek cihazın yazısıyla gösterilir (metin boş kalmasın).
import * as Font from 'expo-font';
import { useEffect, useState } from 'react';

import { QURAN_FONTS, quranFont, type QuranFont, type QuranFontId } from '@/data/quranFonts';

const FILES: Record<Exclude<QuranFontId, 'system'>, number> = {
  madina: require('../../assets/fonts/MatafMadina.ttf'),
  amiri: require('@expo-google-fonts/amiri-quran/400Regular/AmiriQuran_400Regular.ttf'),
  scheherazade: require('@expo-google-fonts/scheherazade-new/400Regular/ScheherazadeNew_400Regular.ttf'),
  naskh: require('@expo-google-fonts/noto-naskh-arabic/400Regular/NotoNaskhArabic_400Regular.ttf'),
  lateef: require('@expo-google-fonts/lateef/400Regular/Lateef_400Regular.ttf'),
};

export async function loadQuranFont(f: QuranFont) {
  if (!f.family || f.id === 'system' || Font.isLoaded(f.family)) return;
  await Font.loadAsync({ [f.family]: FILES[f.id] });
}

const loadedNow = () => new Set(QURAN_FONTS.filter((f) => f.family && Font.isLoaded(f.family)).map((f) => f.family as string));

/** Seçili hat; yüklenmediyse cihaz yazısı ölçüleriyle döner */
export function useQuranFont(id?: string): { f: QuranFont; fontFamily?: string } {
  const f = quranFont(id);
  const [loaded, setLoaded] = useState<Set<string>>(loadedNow);
  useEffect(() => {
    if (!f.family || Font.isLoaded(f.family)) return;
    let alive = true;
    loadQuranFont(f).then(() => alive && setLoaded(loadedNow())).catch(() => undefined);
    return () => {
      alive = false;
    };
  }, [f]);
  return f.family && loaded.has(f.family) ? { f, fontFamily: f.family } : { f: QURAN_FONTS[0], fontFamily: undefined };
}

/** Ayarlardaki önizleme için bütün hatları yükler; yüklenmiş aileleri döner */
export function useAllQuranFonts(): Set<string> {
  const [loaded, setLoaded] = useState<Set<string>>(loadedNow);
  useEffect(() => {
    let alive = true;
    Promise.all(QURAN_FONTS.map((f) => loadQuranFont(f).catch(() => undefined))).then(() => alive && setLoaded(loadedNow()));
    return () => {
      alive = false;
    };
  }, []);
  return loaded;
}
