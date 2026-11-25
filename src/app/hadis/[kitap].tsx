import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, FlatList, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Btn, Header, T } from '@/components/ui';
import { C, fs } from '@/constants/theme';
import { useI18n } from '@/i18n';
import { bukhariSection } from '@/services/hadith';
import { useAsync } from '@/services/useAsync';

export default function BukhariBook() {
  const { kitap } = useLocalSearchParams<{ kitap: string }>();
  const no = Number(kitap) || 1;
  const { t, lang } = useI18n();
  const [attempt, setAttempt] = useState(0);
  const res = useAsync(() => bukhariSection(no, lang), [no, lang, attempt]);
  const data = res.data ?? null;
  const err = !!res.error;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
      <View style={{ paddingHorizontal: 16 }}>
        <Header back title={data?.title || `${t('hadith.bukhari')} · ${no}`} subtitle={data ? `${data.hadiths.length} hadis` : undefined} />
      </View>
      {err ? (
        <View style={{ padding: 16, gap: 12 }}>
          <Text style={T.body}>{t('hadith.error')}</Text>
          <Btn title={t('common.retry')} onPress={() => setAttempt((a) => a + 1)} />
        </View>
      ) : !data ? <ActivityIndicator style={{ marginTop: 32 }} color={C.accent} /> : (
        <FlatList
          data={data.hadiths}
          keyExtractor={(h) => String(h.number)}
          contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
          renderItem={({ item: h }) => (
            <View style={{ paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.border, gap: 6 }}>
              <Text style={{ fontSize: fs(12), fontWeight: '700', color: C.accent }}>Buhârî, {h.number}</Text>
              <Text style={lang === 'ar' ? T.arabic : T.body}>{h.text}</Text>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}
