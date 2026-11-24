import { Tabs } from 'expo-router';

import { Icon, type IconName } from '@/components/Icon';
import { C } from '@/constants/theme';
import { useI18n } from '@/i18n';

export default function TabLayout() {
  const { t } = useI18n();
  const icon = (name: IconName) => function TabIcon({ color }: { color: unknown }) {
    return <Icon name={name} color={typeof color === 'string' ? color : C.muted} size={24} width={1.9} />;
  };
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: C.accent,
        tabBarInactiveTintColor: C.muted,
        tabBarStyle: { backgroundColor: C.bg, borderTopColor: C.border },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}>
      <Tabs.Screen name="index" options={{ title: t('tab.map'), tabBarIcon: icon('map') }} />
      <Tabs.Screen name="ulasim" options={{ title: t('tab.transport'), tabBarIcon: icon('bus') }} />
      <Tabs.Screen name="kuran" options={{ title: t('tab.quran'), tabBarIcon: icon('book') }} />
      <Tabs.Screen name="vakitler" options={{ title: t('tab.times'), tabBarIcon: icon('clock') }} />
      <Tabs.Screen name="hadis" options={{ title: t('tab.hadith'), tabBarIcon: icon('moon') }} />
    </Tabs>
  );
}
