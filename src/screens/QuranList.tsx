import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Icon } from '@/components/Icon';
import { Header, T } from '@/components/ui';
import { C, fs } from '@/constants/theme';
import { quranProgress } from '@/data/quranEditions';
import { pageOf } from '@/data/quranPages';
import type { ML } from '@/data/sites';
import { pick, useI18n } from '@/i18n';
import { SURAH_TR, listSurahs, surahName, type SurahMeta } from '@/services/quran';
import { useQuranPrefs, type Bookmark } from '@/services/QuranPrefs';

/** Sûrenin indiği yer */
const REV = {
  meccan: { tr: 'Mekkî', en: 'Meccan', ar: 'مكية' },
  medinan: { tr: 'Medenî', en: 'Medinan', ar: 'مدنية' },
};
const L = {
  marks: { tr: 'Ayraçlar', en: 'Bookmarks', ar: 'العلامات' },
  hint: { tr: 'Okurken ayetin altındaki “Ayraç” ile yeni ayraç ekleyin. Her ayraç kendi yerini ayrı hatırlar.', en: 'Add more with “Bookmark” under any verse. Each bookmark keeps its own place.', ar: 'أضف علامات أخرى من زر «علامة» تحت أي آية. تحفظ كل علامة موضعها.' },
  go: { tr: 'Devam et', en: 'Continue', ar: 'تابع' },
  done: { tr: 'tamamlandı', en: 'done', ar: 'مكتمل' },
  ayah: { tr: '{n}. ayet', en: 'verse {n}', ar: 'الآية {n}' },
  search: { tr: 'Sûre ara…', en: 'Search surah…', ar: 'ابحث عن سورة…' },
} satisfies Record<string, ML>;

function Marks({ items, lang, list, onRemove }: { items: Bookmark[]; lang: 'tr' | 'en' | 'ar'; list: SurahMeta[] | null; onRemove: (id: string) => void }) {
  return (
    <View style={{ gap: 8, marginBottom: 14 }}>
      <Text style={[T.section, { marginTop: 4 }]}>{pick(L.marks, lang)}</Text>
      {items.map((b) => {
        const pct = Math.round(quranProgress(b.surah, b.ayah) * 100);
        return (
          <Pressable key={b.id} onPress={() => router.push({ pathname: '/kuran/[sure]', params: { sure: String(b.surah), b: b.id, a: String(b.ayah) } })}
            accessibilityRole="button" accessibilityLabel={`${b.name}, ${surahName(b.surah, lang, list?.[b.surah - 1])} ${b.ayah}`}
            style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 16, backgroundColor: b.hatim ? C.greenTint : C.surface, opacity: pressed ? 0.8 : 1 })}>
            <Icon name="bookmark" size={20} color={b.hatim ? C.green : C.accent} />
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={{ fontSize: fs(15), fontWeight: '700', color: C.ink }}>{b.name}</Text>
              <Text style={T.small}>{surahName(b.surah, lang, list?.[b.surah - 1])} · {pick(L.ayah, lang).replace('{n}', String(b.ayah))} · {lang === 'en' ? 'p.' : lang === 'ar' ? 'ص' : 's.'} {pageOf(b.surah, b.ayah)}{b.hatim ? ` · %${pct} ${pick(L.done, lang)}` : ''}</Text>
              {b.hatim && (
                <View style={{ height: 4, borderRadius: 2, backgroundColor: C.border, overflow: 'hidden' }}>
                  <View style={{ width: `${Math.max(1, pct)}%`, height: 4, backgroundColor: C.green }} />
                </View>
              )}
            </View>
            <Text style={{ fontSize: fs(13), fontWeight: '700', color: b.hatim ? C.green : C.accent }}>{pick(L.go, lang)}</Text>
            {!b.hatim && (
              <Pressable onPress={() => onRemove(b.id)} hitSlop={10} accessibilityLabel="Sil" style={{ padding: 4 }}>
                <Icon name="trash" size={16} color={C.muted} />
              </Pressable>
            )}
          </Pressable>
        );
      })}
      <Text style={T.small}>{pick(L.hint, lang)}</Text>
      <Pressable onPress={() => router.push('/hatim')} accessibilityRole="button" style={({ pressed }) => ({ minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 8, opacity: pressed ? 0.7 : 1 })}>
        <Icon name="bookmark" size={18} color={C.accent} />
        <Text style={{ flex: 1, fontSize: fs(15), fontWeight: '700', color: C.accent }}>{lang === 'en' ? 'Khatm plan: a daily portion' : lang === 'ar' ? 'خطة الختمة: ورد يومي' : 'Hatim planı: her gün bir bölüm'}</Text>
        <Icon name="chevron" size={16} color={C.muted} />
      </Pressable>
      <Pressable onPress={() => router.push('/tecvid')} accessibilityRole="button" style={({ pressed }) => ({ minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 8, opacity: pressed ? 0.7 : 1 })}>
        <Icon name="text" size={18} color={C.accent} />
        <Text style={{ flex: 1, fontSize: fs(15), fontWeight: '700', color: C.accent }}>{lang === 'en' ? 'Tajweed rules and colours' : lang === 'ar' ? 'أحكام التجويد وألوانها' : 'Tecvid kuralları ve renkleri'}</Text>
        <Icon name="chevron" size={16} color={C.muted} />
      </Pressable>
    </View>
  );
}

export default function QuranList() {
  const { t, lang } = useI18n();
  const { bookmarks, removeBookmark } = useQuranPrefs();
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
        <TextInput value={q} onChangeText={setQ} placeholder={pick(L.search, lang)} placeholderTextColor={C.muted}
          style={{ height: 44, borderRadius: 22, backgroundColor: C.surface, paddingHorizontal: 16, fontSize: fs(15), color: C.ink }} />
        {offline && <Text style={T.small}>{t('quran.offline')}</Text>}
      </View>
      {!list ? <ActivityIndicator style={{ marginTop: 32 }} color={C.accent} /> : (
        <FlatList
          data={filtered}
          keyExtractor={(s) => String(s.number)}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
          ListHeaderComponent={q ? undefined : <Marks items={bookmarks} lang={lang} list={list} onRemove={removeBookmark} />}
          renderItem={({ item: s }) => (
            <Pressable onPress={() => router.push({ pathname: '/kuran/[sure]', params: { sure: String(s.number) } })}
              style={{ minHeight: 60, flexDirection: 'row', alignItems: 'center', gap: 12, borderBottomWidth: 1, borderBottomColor: C.border }}>
              <View style={{ width: 36, height: 36, borderRadius: 18, borderWidth: 1.5, borderColor: C.route, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: fs(12), fontWeight: '700', color: C.accent }}>{s.number}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: fs(15), fontWeight: '600', color: C.ink }}>{surahName(s.number, lang, s)}</Text>
                {s.numberOfAyahs ? <Text style={T.small}>{pick(s.revelationType === 'Meccan' ? REV.meccan : REV.medinan, lang)} · {t('quran.ayahs', { n: s.numberOfAyahs })} · {lang === 'en' ? 'p.' : lang === 'ar' ? 'ص' : 's.'} {pageOf(s.number, 1)}</Text> : null}
              </View>
              {s.name ? <Text style={{ fontSize: fs(20), color: C.ink }}>{s.name}</Text> : null}
            </Pressable>
          )}
          ListFooterComponent={<Text style={[T.small, { marginTop: 12 }]}>{t('quran.source')}</Text>}
        />
      )}
    </SafeAreaView>
  );
}
