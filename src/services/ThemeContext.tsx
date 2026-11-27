// Tema: açık / koyu / sistem ve renk paleti; yazı ölçeği. Seçim cihazda saklanır.
// Değişince C (renkler) ve yazı ölçeği güncellenir; gezinme ağacı (yığın) yerinde kalır, yalnız ekranların
// içeriği yeniden kurulur (ScreenRemount) — kullanıcı bulunduğu ekranda kalır, uygulama yeniden başlamaz.
import { DarkTheme, DefaultTheme, ThemeProvider as NavThemeProvider } from 'expo-router';
import * as SystemUI from 'expo-system-ui';
import { createContext, useContext, useEffect, useMemo, type ReactNode } from 'react';
import { useColorScheme, View } from 'react-native';

import { C, applyTextScale, applyTheme, type PaletteId, type ThemeMode } from '@/constants/theme';
import { usePersisted } from './usePersisted';
import type { WidgetStyle } from './widgetProps';

export type HomeId = 'vakit' | 'vakitler' | 'kuran' | 'harita' | 'tavaf' | 'zikir' | 'hadis';
export type ThemePrefs = {
  mode: ThemeMode;
  palette: PaletteId;
  /** Yazı boyutu çarpanı (0,9–1,4) */
  text: number;
  /** Arapça yazı çarpanı (0,85–1,6) */
  arabic: number;
  /** Ortadaki Ana sayfa sekmesinde ne gösterilsin */
  home: HomeId;
  /** Haram/Nebevî haritası: true = 3D, false = 2D plan */
  map3d: boolean;
  /** Hareketleri azalt (animasyonsuz geçişler) */
  reduceMotion: boolean;
  /** Dokunmada titreşim */
  haptics: boolean;
  /** Sekmeler arasında kaydırarak geçiş */
  swipeTabs: boolean;
  /** Ana ekran kutularının görünümü (varsayılan koyu şeffaf, 0.22.0) */
  widget: WidgetStyle;
};
const DEFAULTS: ThemePrefs = { mode: 'system', palette: 'kabe', text: 1, arabic: 1, home: 'vakit', map3d: true, reduceMotion: false, haptics: true, swipeTabs: true, widget: 'glass' };
type Ctx = { prefs: ThemePrefs; dark: boolean; key: string; setTheme: (p: Partial<ThemePrefs>) => void };
const ThemeCtx = createContext<Ctx | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const system = useColorScheme();
  const [prefs, setPrefs, ready] = usePersisted<ThemePrefs>('theme:prefs', DEFAULTS);
  const dark = prefs.mode === 'dark' || (prefs.mode === 'system' && system === 'dark');
  // Renkleri ve yazı ölçeğini çizimden önce uygula; anahtar değişince ekranlar yeniden kurulur.
  const key = useMemo(() => {
    applyTheme(dark, prefs.palette);
    applyTextScale(prefs.text, prefs.arabic);
    return `${dark ? 'dark' : 'light'}-${prefs.palette}-${prefs.text}-${prefs.arabic}`;
  }, [dark, prefs.palette, prefs.text, prefs.arabic]);
  useEffect(() => { SystemUI.setBackgroundColorAsync(C.bg).catch(() => undefined); }, [key]);

  const nav = useMemo(() => {
    const base = dark ? DarkTheme : DefaultTheme;
    return { ...base, dark, colors: { ...base.colors, primary: C.accent, background: C.bg, card: C.bg, text: C.ink, border: C.border, notification: C.closed } };
  }, [dark, key]); // eslint-disable-line react-hooks/exhaustive-deps

  const value = useMemo<Ctx>(() => ({ prefs, dark, key, setTheme: setPrefs }), [prefs, dark, key, setPrefs]);

  if (!ready) return null; // kayıtlı tema okunana kadar (birkaç ms) açılış ekranı kalır
  return (
    <ThemeCtx.Provider value={value}>
      <NavThemeProvider value={nav}>
        <View style={{ flex: 1, backgroundColor: C.bg }}>{children}</View>
      </NavThemeProvider>
    </ThemeCtx.Provider>
  );
}

/** Ekran içeriğini tema/yazı ölçeği değişince yeniden kurar (yığın ve geçmiş korunur). */
export function ScreenRemount({ children }: { children: ReactNode }) {
  const { key } = useTheme();
  return <View key={key} style={{ flex: 1, backgroundColor: C.bg }}>{children}</View>;
}

export function useTheme() {
  const c = useContext(ThemeCtx);
  if (!c) throw new Error('ThemeProvider eksik');
  return c;
}
