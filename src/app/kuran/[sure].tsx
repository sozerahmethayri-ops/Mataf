import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, FlatList, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Btn, Header, T } from '@/components/ui';
import { C } from '@/constants/theme';
import { useI18n } from '@/i18n';
import { getSurah, surahName } from '@/services/quran';
import { useAsync } from '@/services/useAsync';

export default function SurahReader() {
  const { sure } = useLocalSearchParams<{ sure: string }>();
  const n = Number(sure) || 1;
  const { t, lang } = useI18n();
  const [attempt, setAttempt] = useState(0);
  const res = useAsync(() => getSurah(n, lang), [n, lang, attempt]);
  const ayahs = res.data?.ayahs ?? null;
  const err = !!res.error;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
      <View style={{ paddingHorizontal: 16 }}>
        <Header back title={surahName(n, lang)} subtitle={`${n}. sûre`} />
      </View>
      {err ? (
        <View style={{ padding: 16, gap: 12 }}>
          <Text style={T.body}>{t('hadith.error')}</Text>
          <Btn title={t('common.retry')} onPress={() => setAttempt((a) => a + 1)} />
        </View>
      ) : !ayahs ? <ActivityIndicator style={{ marginTop: 32 }} color={C.accent} /> : (
        <FlatList
          data={ayahs}
          keyExtractor={(a) => String(a.n)}
          contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
          ListHeaderComponent={n !== 1 && n !== 9 ? (
            <Text style={[T.arabic, { textAlign: 'center', fontSize: 26, marginBottom: 12 }]}>بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ</Text>
          ) : undefined}
          renderItem={({ item: a }) => (
            <View style={{ paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F1EFEB', gap: 8 }}>
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
                <View style={{ width: 28, height: 28, borderRadius: 14, borderWidth: 1.5, borderColor: C.route, alignItems: 'center', justifyContent: 'center', marginTop: 6 }}>
                  <Text style={{ fontSize: 11, fontWeight: '700', color: C.accent }}>{a.n}</Text>
                </View>
                <Text style={[T.arabic, { flex: 1 }]}>{a.ar}</Text>
              </View>
              {a.tr ? <Text style={T.body}>{a.tr}</Text> : null}
            </View>
          )}
          ListFooterComponent={<Text style={[T.small, { marginTop: 12 }]}>{t('quran.source')}</Text>}
        />
      )}
    </SafeAreaView>
  );
}
