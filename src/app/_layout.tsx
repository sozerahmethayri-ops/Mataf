import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AdhanHost } from '@/components/AdhanHost';
import { C } from '@/constants/theme';
import { I18nProvider } from '@/i18n';
import { AppProvider } from '@/services/AppContext';
import { QuranPrefsProvider } from '@/services/QuranPrefs';
import { ThemeProvider, useTheme } from '@/services/ThemeContext';
import { ReportsProvider } from '@/services/ReportsContext';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <I18nProvider>
        <ReportsProvider>
          <AppProvider>
            <QuranPrefsProvider>
              <ThemeProvider>
                <AppStack />
              </ThemeProvider>
              <AdhanHost />
            </QuranPrefsProvider>
          </AppProvider>
        </ReportsProvider>
      </I18nProvider>
    </SafeAreaProvider>
  );
}

function AppStack() {
  const { dark } = useTheme();
  return (
    <>
      <StatusBar style={dark ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: C.bg } }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="bildir" options={{ presentation: 'modal' }} />
        <Stack.Screen name="kuran-ayarlar" options={{ presentation: 'modal' }} />
      </Stack>
    </>
  );
}
