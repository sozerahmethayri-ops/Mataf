import AsyncStorage from '@react-native-async-storage/async-storage';
import { getLocales } from 'expo-localization';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { I18nManager } from 'react-native';

import { DICTS, FALLBACK, LANGS, type Key, type Lang } from './strings';

type Ctx = {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: Key, vars?: Record<string, string | number>) => string;
  rtl: boolean;
};

const I18nContext = createContext<Ctx | null>(null);
const STORE_KEY = 'mataf.lang';

function detect(): Lang {
  const code = getLocales()[0]?.languageCode ?? 'tr';
  return (LANGS.find((l) => l.code === code)?.code ?? 'en') as Lang;
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>(detect());

  useEffect(() => {
    AsyncStorage.getItem(STORE_KEY).then((v) => {
      if (v && LANGS.some((l) => l.code === v)) setLangState(v as Lang);
    });
  }, []);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    AsyncStorage.setItem(STORE_KEY, l);
    const rtl = LANGS.find((x) => x.code === l)?.rtl ?? false;
    // Sağdan sola düzen yeniden başlatmadan sonra devreye girer.
    I18nManager.allowRTL(rtl);
    I18nManager.forceRTL(rtl);
  }, []);

  const t = useCallback(
    (key: Key, vars?: Record<string, string | number>) => {
      let s = DICTS[lang][key] ?? DICTS.en[key] ?? FALLBACK[key] ?? key;
      if (vars) for (const [k, v] of Object.entries(vars)) s = s.split(`{${k}}`).join(String(v));
      return s;
    },
    [lang],
  );

  const value = useMemo(
    () => ({ lang, setLang, t, rtl: LANGS.find((x) => x.code === lang)?.rtl ?? false }),
    [lang, setLang, t],
  );
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used inside I18nProvider');
  return ctx;
}

/** Çok dilli içerik alanından (ör. kapı adı) uygun dili seçer. */
export function pick(text: { tr: string; en?: string; ar?: string }, lang: Lang) {
  return text[lang] ?? text.en ?? text.tr;
}
