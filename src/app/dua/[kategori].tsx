import { router, useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import { DuaBlock } from '@/components/DuaBlock';
import { Icon } from '@/components/Icon';
import { Btn, Header, Screen, T } from '@/components/ui';
import { C } from '@/constants/theme';
import { DUA_LIB, isQuranRef, type QuranRef } from '@/data/duas';
import { TRANSLIT } from '@/data/quranEditions';
import type { ML } from '@/data/sites';
import { pick, useI18n } from '@/i18n';
import { getAyahRange, surahName } from '@/services/quran';
import { useQuranPrefs } from '@/services/QuranPrefs';
import { useAsync } from '@/services/useAsync';

const L = {
  assistant: { tr: 'Tavaf asistanını aç', en: 'Open the tawaf assistant', ar: 'افتح مساعد الطواف' },
  loading: { tr: 'Ayet yükleniyor…', en: 'Loading verse…', ar: 'جارٍ التحميل…' },
  offline: { tr: 'Ayet metni için bir kez internet gerekir; sonra çevrimdışı açılır.', en: 'This verse needs a connection once; afterwards it works offline.', ar: 'يلزم الاتصال مرة واحدة لتحميل الآية.' },
  times: { tr: 'kez', en: 'times', ar: 'مرات' },
  count: { tr: 'dua', en: 'du‘as', ar: 'دعاء' },
} satisfies Record<string, ML>;

export default function DuaCategory() {
  const { kategori } = useLocalSearchParams<{ kategori: string }>();
  const { lang } = useI18n();
  const cat = DUA_LIB.find((c) => c.id === kategori) ?? DUA_LIB[0];
  return (
    <Screen>
      <Header back title={pick(cat.title, lang)} subtitle={`${cat.items.length} ${pick(L.count, lang)}`} />
      {cat.id === 'tavaf' && <Btn title={pick(L.assistant, lang)} icon="kaaba" onPress={() => router.push('/tavaf')} />}
      {cat.items.map((d) => (isQuranRef(d) ? <QuranDua key={d.id} q={d} /> : <DuaBlock key={d.id} d={d} />))}
    </Screen>
  );
}

/** Kur'an'daki dua: Arapça metin, okunuş ve meal seçili meal dilinde API'den; ses kâri kaydı. */
function QuranDua({ q }: { q: QuranRef }) {
  const { lang } = useI18n();
  const { prefs } = useQuranPrefs();
  const [s, from, to = from] = q.quran;
  const translit = TRANSLIT[lang === 'en' ? 'en' : 'tr'];
  const res = useAsync(() => getAyahRange(s, from, to, prefs.translation, lang === 'ar' ? null : translit), [s, from, to, prefs.translation, translit, lang]);
  const ref = `${surahName(s, lang)} ${from}${to !== from ? `–${to}` : ''}${q.note ? ` · ${q.note}` : ''}`;
  if (!res.data) {
    return (
      <View style={{ backgroundColor: C.accentSoft, borderRadius: 16, padding: 14, gap: 6 }}>
        {q.when ? <Text style={[T.small, { color: C.accent, fontWeight: '700' }]}>{pick(q.when, lang)}</Text> : null}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          {res.error ? <Icon name="alert" size={16} color={C.muted} /> : <ActivityIndicator color={C.accent} />}
          <Text style={T.small}>{res.error ? pick(L.offline, lang) : pick(L.loading, lang)}</Text>
        </View>
        <Pressable onPress={() => router.push({ pathname: '/kuran/[sure]', params: { sure: String(s) } })}><Text style={[T.small, { color: C.accent }]}>{ref}</Text></Pressable>
      </View>
    );
  }
  const ar = res.data.map((a) => a.ar).join(' ۝ ');
  const tl = res.data.map((a) => a.translit ?? '').join(' ').trim();
  const meal = res.data.map((a) => a.meal ?? '').join(' ').trim();
  return (
    <DuaBlock d={{ id: q.id, ar, tr: tl, mean: { tr: meal, en: meal, ar: meal }, ref, quran: [s, from, to], count: q.count, when: q.when }} />
  );
}
