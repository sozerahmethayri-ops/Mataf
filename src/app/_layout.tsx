import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { C } from '@/constants/theme';
import { I18nProvider } from '@/i18n';
import { AppProvider } from '@/services/AppContext';
import { ReportsProvider } from '@/services/ReportsContext';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <I18nProvider>
        <ReportsProvider>
          <AppProvider>
            <StatusBar style="dark" />
            <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: C.bg } }}>
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="bildir" options={{ presentation: 'modal' }} />
            </Stack>
          </AppProvider>
        </ReportsProvider>
      </I18nProvider>
    </SafeAreaProvider>
  );
}
