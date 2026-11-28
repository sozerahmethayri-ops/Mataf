// Alt sekmeler (kaydırarak geçilebilir): varsayılan Harita · Kur'an · Ana sayfa · Ulaşım · Menü. 1., 2. ve 4. sekme "yuva"dır
// (s1, s2, s4): içine Ayarlar → Alt sekmeler'de seçilen bölüm çizilir (0.25.0; services/tabs.ts, screens/TabSlot.tsx).
// Ana sayfa ortadadır; bütün sekmeler aynı görünür (öne çıkan yuvarlak düğme şablon gibi duruyordu, 0.13.5).
// Harita, Ulaşım ve Kıble bölümlerinde kaydırma kapalıdır (haritayı sürüklemek sekme değiştirmesin).
// Ayarlar → "Sekmeler arasında kaydır" ile tamamen kapatılabilir.
// Web'de Arapça: sayfa yönü <html dir="rtl"> ile döner (i18n), ama sekme kaydırıcısı yönü bilmez (ExpoRoot yön vermez,
// sayfalar boş görünüyordu). Kaydırıcı soldan sağa kalır; sayfaların içi ve alt çubuk sağdan sola, kaydırarak geçiş kapalı.
import { TopTabs, type MaterialTopTabBarProps } from 'expo-router/js-top-tabs';
import { Platform, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon, type IconName } from '@/components/Icon';
import { C, fs } from '@/constants/theme';
import { pick, useI18n } from '@/i18n';
import { useTheme } from '@/services/ThemeContext';
import { NO_SWIPE, normTabs, type TabId } from '@/services/tabs';

/** Yuvadaki bölümün simgesi ve adı */
const TAB_ICON: Record<TabId, IconName> = { harita: 'map', kuran: 'book', ulasim: 'bus', hac: 'kaaba', vakitler: 'clock', kible: 'compass', zikir: 'beads', hadis: 'moon' };
const TAB_NAME: Record<'hac' | 'vakitler' | 'kible' | 'zikir' | 'hadis', { tr: string; en: string; ar: string }> = {
  hac: { tr: 'Hac-Umre', en: 'Hajj', ar: 'الحج' },
  vakitler: { tr: 'Vakitler', en: 'Times', ar: 'المواقيت' },
  kible: { tr: 'Kıble', en: 'Qibla', ar: 'القبلة' },
  zikir: { tr: 'Zikir', en: 'Dhikr', ar: 'الذكر' },
  hadis: { tr: 'Hadis', en: 'Hadith', ar: 'الحديث' },
};

function BottomBar({ state, descriptors, emitter, navigateToTab, webRtl, icons }: MaterialTopTabBarProps & { webRtl: boolean; icons: Record<string, IconName> }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={{ direction: webRtl ? 'rtl' : undefined, flexDirection: 'row', backgroundColor: C.bg, borderTopWidth: 1, borderTopColor: C.border, paddingBottom: Math.max(insets.bottom, 6), paddingTop: 6 }}>
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
            <Icon name={icons[route.name] ?? 'grid'} size={22} color={on ? C.accent : C.muted} width={on ? 2.1 : 1.9} />
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
  const { t, lang, rtl } = useI18n();
  const { prefs } = useTheme();
  const webRtl = Platform.OS === 'web' && rtl;
  const home = lang === 'ar' ? 'الرئيسية' : lang === 'en' ? 'Home' : 'Ana sayfa';
  const menu = lang === 'ar' ? 'القائمة' : lang === 'en' ? 'Menu' : 'Menü';
  const slots = normTabs(prefs.tabs);
  const icons: Record<string, IconName> = { s1: TAB_ICON[slots[0]], s2: TAB_ICON[slots[1]], index: 'home', s4: TAB_ICON[slots[2]], menu: 'grid' };
  const tabTitle = (id: TabId) => (id === 'harita' ? t('tab.map') : id === 'kuran' ? t('tab.quran') : id === 'ulasim' ? t('tab.transport') : pick(TAB_NAME[id], lang));
  const opts = (id: TabId) => ({ title: tabTitle(id), ...(NO_SWIPE.includes(id) ? { swipeEnabled: false } : null) });
  return (
    <TopTabs
      tabBarPosition="bottom"
      style={webRtl ? { direction: 'ltr' } : undefined}
      tabBar={(p) => <BottomBar {...p} webRtl={webRtl} icons={icons} />}
      screenOptions={{ swipeEnabled: prefs.swipeTabs && !webRtl, lazy: true, animationEnabled: !prefs.reduceMotion, sceneStyle: { backgroundColor: C.bg, direction: webRtl ? 'rtl' : undefined } }}>
      <TopTabs.Screen name="s1" options={opts(slots[0])} />
      <TopTabs.Screen name="s2" options={opts(slots[1])} />
      <TopTabs.Screen name="index" options={{ title: home }} />
      <TopTabs.Screen name="s4" options={opts(slots[2])} />
      <TopTabs.Screen name="menu" options={{ title: menu }} />
    </TopTabs>
  );
}
