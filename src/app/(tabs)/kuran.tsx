import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Header, T } from '@/components/ui';
import { C } from '@/constants/theme';
import { useI18n } from '@/i18n';
import { SURAH_TR, listSurahs, surahName, type SurahMeta } from '@/services/quran';

export default function QuranList() {
  const { t, lang } = useI18n();
  const [list, setList] = useState<SurahMeta[] | null>(null);
  const [offline, setOffline] = useState(false);
  const [q, setQ] = useState('');

  useEffect(() => {
    listSurahs().then(setList).catch(() => {
      setOffline(true);
      setList(SURAH_TR.map((n, i) => ({ number: i + 1, name: '', englishName: n, numberOfAyahs: 0, revelationType: '' })));
    });
  }, []);

  const filtered = useMemo(() => {
    const needle = q.toLocaleLowerCase(lang).trim();
    return (list ?? []).filter((s) => !needle || `${s.number} ${surahName(s.number, lang, s)} ${s.englishName} ${s.name}`.toLocaleLowerCase(lang).includes(needle));
  }, [list, q, lang]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={['top', 'left', 'right']}>
      <View style={{ paddingHorizontal: 16, gap: 10, paddingBottom: 8 }}>
        <Header title={t('quran.title')} />
        <TextInput value={q} onChangeText={setQ} placeholder="Sûre ara…" placeholderTextColor={C.muted}
          style={{ height: 44, borderRadius: 22, backgroundColor: C.surface, paddingHorizontal: 16, fontSize: 15, color: C.ink }} />
        {offline && <Text style={T.small}>{t('quran.offline')}</Text>}
      </View>
      {!list ? <ActivityIndicator style={{ marginTop: 32 }} color={C.accent} /> : (
        <FlatList
          data={filtered}
          keyExtractor={(s) => String(s.number)}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
          renderItem={({ item: s }) => (
            <Pressable onPress={() => router.push({ pathname: '/kuran/[sure]', params: { sure: String(s.number) } })}
              style={{ minHeight: 60, flexDirection: 'row', alignItems: 'center', gap: 12, borderBottomWidth: 1, borderBottomColor: '#F1EFEB' }}>
              <View style={{ width: 36, height: 36, borderRadius: 18, borderWidth: 1.5, borderColor: C.route, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: 12, fontWeight: '700', color: C.accent }}>{s.number}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 15, fontWeight: '600', color: C.ink }}>{surahName(s.number, lang, s)}</Text>
                {s.numberOfAyahs ? <Text style={T.small}>{s.revelationType === 'Meccan' ? 'Mekkî' : 'Medenî'} · {t('quran.ayahs', { n: s.numberOfAyahs })}</Text> : null}
              </View>
              {s.name ? <Text style={{ fontSize: 20, color: C.ink }}>{s.name}</Text> : null}
            </Pressable>
          )}
          ListFooterComponent={<Text style={[T.small, { marginTop: 12 }]}>{t('quran.source')}</Text>}
        />
      )}
    </SafeAreaView>
  );
}
