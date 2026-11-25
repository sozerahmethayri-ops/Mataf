import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Btn, Card, Header, IconBtn, T } from '@/components/ui';
import { C, fs } from '@/constants/theme';
import { LANG_NAMES, TAFSIRS } from '@/data/quranEditions';
import type { ML } from '@/data/sites';
import { pick, useI18n } from '@/i18n';
import { getAyahRange, surahName } from '@/services/quran';
import { surahLength } from '@/services/quranIndex';
import { useQuranPrefs } from '@/services/QuranPrefs';
import { getTafsir } from '@/services/tafsir';
import { useAsync } from '@/services/useAsync';

const L = {
  title: { tr: 'Tefsir', en: 'Tafsir', ar: 'التفسير' },
  err: { tr: 'Tefsir yüklenemedi. İnternet bağlantınızı kontrol edin; bir kez açılan tefsir çevrimdışı da okunur.', en: 'Could not load the tafsir. Check your connection; once opened it is available offline.', ar: 'تعذّر تحميل التفسير. تحقق من الاتصال.' },
  empty: { tr: 'Bu ayet için bu kaynakta metin yok (bazı tefsirler ayetleri grup halinde açıklar).', en: 'No text for this verse in this source (some tafsirs explain verses in groups).', ar: 'لا يوجد نص لهذه الآية في هذا المصدر.' },
  prev: { tr: 'Önceki ayet', en: 'Previous', ar: 'السابقة' },
  next: { tr: 'Sonraki ayet', en: 'Next', ar: 'التالية' },
  retry: { tr: 'Tekrar dene', en: 'Retry', ar: 'أعد المحاولة' },
} satisfies Record<string, ML>;

export default function TafsirScreen() {
  const params = useLocalSearchParams<{ s: string; a: string }>();
  const s = Number(params.s) || 1;
  const [a, setA] = useState(Number(params.a) || 1);
  const { lang } = useI18n();
  const insets = useSafeAreaInsets();
  const { prefs, setPrefs } = useQuranPrefs();
  const [attempt, setAttempt] = useState(0);
  const ayah = useAsync(() => getAyahRange(s, a, a, prefs.translation, null), [s, a, prefs.translation]);
  const taf = useAsync(() => getTafsir(prefs.tafsir, s, a), [prefs.tafsir, s, a, attempt]);
  const src = TAFSIRS.find((x) => x.id === prefs.tafsir);
  const same = TAFSIRS.filter((x) => x.lang === (src?.lang ?? lang));
  const ay = ayah.data?.[0];
  const rtl = src?.lang === 'ar' || src?.lang === 'ur' || src?.lang === 'fa' || src?.lang === 'ps' || src?.lang === 'ug';

  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.bg }} contentContainerStyle={{ padding: 16, paddingTop: insets.top + 8, paddingBottom: insets.bottom + 32, gap: 12 }}>
      <Header back title={`${pick(L.title, lang)} · ${surahName(s, lang)} ${a}`} subtitle={src ? `${src.name} · ${LANG_NAMES[src.lang] ?? src.lang}` : undefined}
        right={<IconBtn name="settings" label="Ayarlar" onPress={() => router.push('/kuran-ayarlar')} />} />
      {ay ? (
        <Card tint={C.accentSoft} style={{ gap: 8 }}>
          <Text style={T.arabic}>{ay.ar}</Text>
          {ay.meal ? <Text style={T.body}>{ay.meal}</Text> : null}
        </Card>
      ) : null}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {same.map((x) => (
          <Pressable key={x.id} onPress={() => setPrefs({ tafsir: x.id })} accessibilityRole="radio" accessibilityState={{ selected: x.id === prefs.tafsir }}
            style={{ height: 32, paddingHorizontal: 12, borderRadius: 16, justifyContent: 'center', backgroundColor: x.id === prefs.tafsir ? C.ink : C.surface }}>
            <Text style={{ fontSize: fs(12.5), fontWeight: '600', color: x.id === prefs.tafsir ? C.onInk : C.ink }}>{x.name}</Text>
          </Pressable>
        ))}
      </View>
      {taf.loading ? <ActivityIndicator color={C.accent} style={{ marginTop: 16 }} /> : taf.error ? (
        <View style={{ gap: 10 }}>
          <Text style={T.body}>{pick(L.err, lang)}</Text>
          <Btn title={pick(L.retry, lang)} kind="secondary" onPress={() => setAttempt((x) => x + 1)} />
        </View>
      ) : (
        <Text selectable style={[T.body, { fontSize: fs(16), lineHeight: fs(26) }, rtl && { textAlign: 'right', writingDirection: 'rtl', fontSize: fs(19), lineHeight: fs(34) }]}>{taf.data || pick(L.empty, lang)}</Text>
      )}
      <View style={{ flexDirection: 'row', gap: 10, marginTop: 8 }}>
        <Btn title={pick(L.prev, lang)} kind="secondary" style={{ flex: 1 }} disabled={a <= 1} onPress={() => setA((x) => Math.max(1, x - 1))} />
        <Btn title={pick(L.next, lang)} kind="secondary" style={{ flex: 1 }} disabled={a >= surahLength(s)} onPress={() => setA((x) => Math.min(surahLength(s), x + 1))} />
      </View>
    </ScrollView>
  );
}
