// Alt sekmeler (kaydırarak geçilebilir): Harita · Kur'an · Ana sayfa · Ulaşım · Menü.
// Ana sayfa ortadadır; bütün sekmeler aynı görünür (öne çıkan yuvarlak düğme şablon gibi duruyordu, 0.13.5).
// Harita ve Ulaşım sekmelerinde kaydırma kapalıdır (haritayı sürüklemek sekme değiştirmesin).
// Ayarlar → "Sekmeler arasında kaydır" ile tamamen kapatılabilir.
import { TopTabs, type MaterialTopTabBarProps } from 'expo-router/js-top-tabs';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon, type IconName } from '@/components/Icon';
import { C, fs } from '@/constants/theme';
import { useI18n } from '@/i18n';
import { useTheme } from '@/services/ThemeContext';

const ICONS: Record<string, IconName> = { harita: 'map', kuran: 'book', index: 'home', ulasim: 'bus', menu: 'grid' };

function BottomBar({ state, descriptors, emitter, navigateToTab }: MaterialTopTabBarProps) {
  const insets = useSafeAreaInsets();
  return (
    <View style={{ flexDirection: 'row', backgroundColor: C.bg, borderTopWidth: 1, borderTopColor: C.border, paddingBottom: Math.max(insets.bottom, 6), paddingTop: 6 }}>
      {state.routes.map((route, i) => {
        const on = state.index === i;
        const { options } = descriptors[route.key];
        const label = typeof options.title === 'string' ? options.title : route.name;
        const go = () => {
          const e = emitter.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!on && !e.defaultPrevented) navigateToTab(route.key);
        };
        return (
          <Pressable key={route.key} onPress={go} accessibilityRole="tab" accessibilityState={{ selected: on }} accessibilityLabel={label}
            style={{ flex: 1, alignItems: 'center', gap: 3, paddingVertical: 4 }}>
            <Icon name={ICONS[route.name] ?? 'grid'} size={22} color={on ? C.accent : C.muted} width={on ? 2.1 : 1.9} />
            <Text style={{ fontSize: fs(11), fontWeight: on ? '700' : '600', color: on ? C.accent : C.muted }} numberOfLines={1}>{label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

// Açılışta ortadaki Ana sayfa
export const unstable_settings = { initialRouteName: 'index' };

export default function TabLayout() {
  const { t, lang } = useI18n();
  const { prefs } = useTheme();
  const home = lang === 'ar' ? 'الرئيسية' : lang === 'en' ? 'Home' : 'Ana sayfa';
  const menu = lang === 'ar' ? 'القائمة' : lang === 'en' ? 'Menu' : 'Menü';
  return (
    <TopTabs
      tabBarPosition="bottom"
      tabBar={(p) => <BottomBar {...p} />}
      screenOptions={{ swipeEnabled: prefs.swipeTabs, lazy: true, animationEnabled: !prefs.reduceMotion, sceneStyle: { backgroundColor: C.bg } }}>
      <TopTabs.Screen name="harita" options={{ title: t('tab.map'), swipeEnabled: false }} />
      <TopTabs.Screen name="kuran" options={{ title: t('tab.quran') }} />
      <TopTabs.Screen name="index" options={{ title: home }} />
      <TopTabs.Screen name="ulasim" options={{ title: t('tab.transport'), swipeEnabled: false }} />
      <TopTabs.Screen name="menu" options={{ title: menu }} />
    </TopTabs>
  );
}
