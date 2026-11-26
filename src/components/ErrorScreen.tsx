// Uygulama genelinde hata ekranı (Expo Router ErrorBoundary): beyaz/kırmızı çökme yerine sade bir sayfa.
// Sağlayıcıların dışında çizilebilir; bu yüzden yalnız düz React Native bileşenleri ve tema renkleri kullanır.
import { router, type ErrorBoundaryProps } from 'expo-router';
import { useEffect } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { C } from '@/constants/theme';
import { logError, shareErrors } from '@/services/errorLog';

export function ErrorScreen({ error, retry }: ErrorBoundaryProps) {
  useEffect(() => { logError(error, 'ekran').catch(() => undefined); }, [error]);
  const btn = (label: string, onPress: () => void, primary = false) => (
    <Pressable onPress={onPress} accessibilityRole="button"
      style={({ pressed }) => ({ height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: primary ? C.accent : C.surface, opacity: pressed ? 0.85 : 1 })}>
      <Text style={{ fontSize: 15, fontWeight: '700', color: primary ? C.onAccent : C.ink }}>{label}</Text>
    </Pressable>
  );
  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.bg }} contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 28, gap: 14 }}>
      <View style={{ gap: 8 }}>
        <Text style={{ fontSize: 26, fontWeight: '800', color: C.ink }}>Bir şeyler ters gitti</Text>
        <Text style={{ fontSize: 15, color: C.ink2, lineHeight: 22 }}>Bu ekran açılırken bir hata oldu. Tekrar deneyebilir ya da ana sayfaya dönebilirsiniz. Hatayı bize gönderirseniz düzeltiriz.</Text>
        <Text style={{ fontSize: 13, color: C.muted }}>Something went wrong. You can retry or go home.</Text>
      </View>
      <Text style={{ fontSize: 12, color: C.muted, fontFamily: 'monospace' }} numberOfLines={3}>{error.message}</Text>
      {btn('Tekrar dene', () => { retry(); }, true)}
      {btn('Ana sayfa', () => { try { router.replace('/'); } catch { retry(); } })}
      {btn('Hatayı paylaş', () => { shareErrors({ at: new Date().toISOString(), msg: `${error.name}: ${error.message}`, stack: error.stack, v: '', p: '' }); })}
    </ScrollView>
  );
}
