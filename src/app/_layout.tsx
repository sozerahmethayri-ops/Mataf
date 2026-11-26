import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AdhanHost } from '@/components/AdhanHost';
import { ErrorScreen } from '@/components/ErrorScreen';
import { C } from '@/constants/theme';
import { I18nProvider } from '@/i18n';
import { AppProvider } from '@/services/AppContext';
import { GroupProvider } from '@/services/GroupContext';
import { QuranPrefsProvider } from '@/services/QuranPrefs';
import { ScreenRemount, ThemeProvider, useTheme } from '@/services/ThemeContext';
import { ReportsProvider } from '@/services/ReportsContext';
import { installErrorLog } from '@/services/errorLog';

installErrorLog();
// Hiçbir ekranın yakalamadığı hatalar için sade hata sayfası
export const ErrorBoundary = ErrorScreen;

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <I18nProvider>
        <ReportsProvider>
          <AppProvider>
            <QuranPrefsProvider>
              <ThemeProvider>
                <GroupProvider>
                  <AppStack />
                </GroupProvider>
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
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: C.bg } }}
        screenLayout={({ children }) => <ScreenRemount>{children}</ScreenRemount>}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="bildir" options={{ presentation: 'modal' }} />
        <Stack.Screen name="kuran-ayarlar" options={{ presentation: 'modal' }} />
        <Stack.Screen name="hosgeldin" options={{ presentation: 'fullScreenModal', gestureEnabled: false, animation: 'fade' }} />
      </Stack>
    </>
  );
}
