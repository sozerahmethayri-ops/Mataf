// Tema: açık / koyu / sistem ve renk paleti. Seçim cihazda saklanır.
// Tema değişince C (renkler) güncellenir ve gezinme ağacı yeniden kurulur; ayarlardan değiştirildiyse
// kullanıcı yeniden ayarlar ekranına döner.
import { DarkTheme, DefaultTheme, ThemeProvider as NavThemeProvider, router } from 'expo-router';
import * as SystemUI from 'expo-system-ui';
import { createContext, useContext, useEffect, useMemo, type ReactNode } from 'react';
import { useColorScheme, View } from 'react-native';

import { C, applyTheme, type PaletteId, type ThemeMode } from '@/constants/theme';
import { usePersisted } from './usePersisted';

export type ThemePrefs = { mode: ThemeMode; palette: PaletteId };
type Ctx = { prefs: ThemePrefs; dark: boolean; setTheme: (p: Partial<ThemePrefs>, returnTo?: string) => void };
const ThemeCtx = createContext<Ctx | null>(null);

let pendingRoute: string | null = null;

function ReturnTo() {
  useEffect(() => {
    if (!pendingRoute) return;
    const route = pendingRoute;
    pendingRoute = null;
    const id = setTimeout(() => router.push(route as never), 60);
    return () => clearTimeout(id);
  }, []);
  return null;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const system = useColorScheme();
  const [prefs, setPrefs, ready] = usePersisted<ThemePrefs>('theme:prefs', { mode: 'system', palette: 'kabe' });
  const dark = prefs.mode === 'dark' || (prefs.mode === 'system' && system === 'dark');
  // Renkleri çizimden önce uygula; anahtar değişince alt ağaç yeni renklerle yeniden kurulur.
  const key = useMemo(() => {
    applyTheme(dark, prefs.palette);
    return `${dark ? 'dark' : 'light'}-${prefs.palette}`;
  }, [dark, prefs.palette]);
  useEffect(() => { SystemUI.setBackgroundColorAsync(C.bg).catch(() => undefined); }, [key]);

  const nav = useMemo(() => {
    const base = dark ? DarkTheme : DefaultTheme;
    return { ...base, dark, colors: { ...base.colors, primary: C.accent, background: C.bg, card: C.bg, text: C.ink, border: C.border, notification: C.closed } };
  }, [dark, key]); // eslint-disable-line react-hooks/exhaustive-deps

  const value = useMemo<Ctx>(() => ({
    prefs, dark,
    setTheme: (p, returnTo) => {
      const next = { ...prefs, ...p };
      const nextDark = next.mode === 'dark' || (next.mode === 'system' && system === 'dark');
      // Renkler değişmiyorsa ağaç yeniden kurulmaz; dönüş rotası bekletilmesin.
      pendingRoute = nextDark !== dark || next.palette !== prefs.palette ? returnTo ?? null : null;
      setPrefs(p);
    },
  }), [prefs, dark, setPrefs, system]);

  if (!ready) return null; // kayıtlı tema okunana kadar (birkaç ms) açılış ekranı kalır
  return (
    <ThemeCtx.Provider value={value}>
      <NavThemeProvider value={nav}>
        <View key={key} style={{ flex: 1, backgroundColor: C.bg }}>
          {children}
          <ReturnTo />
        </View>
      </NavThemeProvider>
    </ThemeCtx.Provider>
  );
}

export function useTheme() {
  const c = useContext(ThemeCtx);
  if (!c) throw new Error('ThemeProvider eksik');
  return c;
}
