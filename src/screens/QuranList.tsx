import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Icon } from '@/components/Icon';
import { Header, Segmented, T } from '@/components/ui';
import { C, fs } from '@/constants/theme';
import { quranProgress } from '@/data/quranEditions';
import { pageOf } from '@/data/quranPages';
import type { ML } from '@/data/sites';
import { pick, useI18n } from '@/i18n';
import { JUZ_STARTS, juzOf } from '@/services/hatim';
import { SURAH_TR, listSurahs, surahName, type SurahMeta } from '@/services/quran';
import { juzStartPage, parseQuranQuery, type QuranTarget } from '@/services/quranNav';
import { useQuranPrefs, type Bookmark } from '@/services/QuranPrefs';

/** Sûrenin indiği yer */
const REV = {
  meccan: { tr: 'Mekkî', en: 'Meccan', ar: 'مكية' },
  medinan: { tr: 'Medenî', en: 'Medinan', ar: 'مدنية' },
};
const L = {
  marks: { tr: 'Ayraçlar', en: 'Bookmarks', ar: 'العلامات' },
  surahs: { tr: 'Sûreler', en: 'Surahs', ar: 'السور' },
  juzs: { tr: 'Cüzler', en: 'Juz', ar: 'الأجزاء' },
  hint: { tr: 'Okurken âyetin altındaki “Ayraç” ile yeni ayraç ekleyin. Her ayraç kendi yerini ayrı hatırlar.', en: 'Add more with “Bookmark” under any verse. Each bookmark keeps its own place.', ar: 'أضف علامات أخرى من زر «علامة» تحت أي آية. تحفظ كل علامة موضعها.' },
  go: { tr: 'Devam et', en: 'Continue', ar: 'تابع' },
  done: { tr: 'tamamlandı', en: 'done', ar: 'مكتمل' },
  ayah: { tr: '{n}. âyet', en: 'verse {n}', ar: 'الآية {n}' },
  search: { tr: 'Sûre, âyet (2:255), sayfa (s 300), cüz (c 15)', en: 'Surah, verse (2:255), page (p 300), juz (j 15)', ar: 'سورة، آية (2:255)، صفحة (ص 300)، جزء (جزء 15)' },
  last: { tr: 'Kaldığınız yer', en: 'Where you left off', ar: 'آخر موضع' },
  lastSub: { tr: '{a}. âyet · sayfa {p} · {j}. cüz', en: 'Verse {a} · page {p} · juz {j}', ar: 'الآية {a} · صفحة {p} · الجزء {j}' },
  mushaf: { tr: 'Mushafta aç', en: 'Open mushaf', ar: 'افتح المصحف' },
  meal: { tr: 'Mealli oku', en: 'Read with translation', ar: 'اقرأ مع الترجمة' },
  startHere: { tr: 'Mushafı baştan aç', en: 'Open the mushaf', ar: 'افتح المصحف' },
  goPage: { tr: 'Sayfa {p}', en: 'Page {p}', ar: 'صفحة {p}' },
  goJuz: { tr: '{j}. cüz · sayfa {p}', en: 'Juz {j} · page {p}', ar: 'الجزء {j} · صفحة {p}' },
  juzRow: { tr: '{j}. cüz', en: 'Juz {j}', ar: 'الجزء {j}' },
  juzFrom: { tr: '{s} {a} · sayfa {p}', en: '{s} {a} · page {p}', ar: '{s} {a} · صفحة {p}' },
  hatim: { tr: 'Hatim planı: her gün bir bölüm', en: 'Khatm plan: a daily portion', ar: 'خطة الختمة: ورد يومي' },
  tajweed: { tr: 'Tecvid kuralları ve renkleri', en: 'Tajweed rules and colours', ar: 'أحكام التجويد وألوانها' },
  settings: { tr: 'Okuma ayarları', en: 'Reading settings', ar: 'إعدادات القراءة' },
} satisfies Record<string, ML>;

type Tab = 'surah' | 'juz' | 'marks';
const pageWord = (lang: 'tr' | 'en' | 'ar') => (lang === 'en' ? 'p.' : lang === 'ar' ? 'ص' : 's.');

function openTarget(t: QuranTarget) {
  if (t.kind === 'ayah') router.push({ pathname: '/kuran/[sure]', params: { sure: String(t.s), a: String(t.a) } });
  else router.push({ pathname: '/mushaf', params: { p: String(t.kind === 'page' ? t.p : juzStartPage(t.j)) } });
}

/** Kaldığınız yer: son okunan sûre, âyet, sayfa ve cüz; mushafta ya da mealli açılır. */
function ContinueCard({ lang, list }: { lang: 'tr' | 'en' | 'ar'; list: SurahMeta[] | null }) {
  const { prefs } = useQuranPrefs();
  const last = prefs.last;
  if (!last) {
    return (
      <Pressable onPress={() => router.push({ pathname: '/mushaf', params: { p: String(prefs.page ?? 1) } })} accessibilityRole="button"
        style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderRadius: 18, backgroundColor: C.accentTint, opacity: pressed ? 0.85 : 1 })}>
        <Icon name="book" size={22} color={C.accent} />
        <Text style={{ flex: 1, fontSize: fs(16), fontWeight: '700', color: C.ink }}>{pick(L.startHere, lang)}</Text>
        <Icon name="chevron" size={16} color={C.muted} />
      </Pressable>
    );
  }
  const btn = (label: string, primary: boolean, onPress: () => void) => (
    <Pressable onPress={onPress} accessibilityRole="button"
      style={({ pressed }) => ({ flex: 1, minHeight: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center', backgroundColor: primary ? C.accent : C.bg, borderWidth: primary ? 0 : 1, borderColor: C.borderStrong, opacity: pressed ? 0.85 : 1 })}>
      <Text style={{ fontSize: fs(15), fontWeight: '700', color: primary ? C.onAccent : C.ink }}>{label}</Text>
    </Pressable>
  );
  return (
    <View style={{ padding: 16, gap: 12, borderRadius: 18, backgroundColor: C.accentTint }}>
      <View style={{ gap: 2 }}>
        <Text style={[T.section, { color: C.accent }]}>{pick(L.last, lang)}</Text>
        <Text style={{ fontSize: fs(20), fontWeight: '700', color: C.ink }}>{surahName(last.s, lang, list?.[last.s - 1])}</Text>
        <Text style={T.muted}>{pick(L.lastSub, lang).replace('{a}', String(last.a)).replace('{p}', String(last.p)).replace('{j}', String(juzOf(last.s, last.a)))}</Text>
      </View>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        {btn(pick(L.mushaf, lang), true, () => router.push({ pathname: '/mushaf', params: { p: String(last.p) } }))}
        {btn(pick(L.meal, lang), false, () => router.push({ pathname: '/kuran/[sure]', params: { sure: String(last.s), a: String(last.a) } }))}
      </View>
    </View>
  );
}

function Marks({ items, lang, list, onRemove }: { items: Bookmark[]; lang: 'tr' | 'en' | 'ar'; list: SurahMeta[] | null; onRemove: (id: string) => void }) {
  return (
    <View style={{ gap: 8 }}>
      {items.map((b) => {
        const pct = Math.round(quranProgress(b.surah, b.ayah) * 100);
        return (
          <Pressable key={b.id} onPress={() => router.push({ pathname: '/kuran/[sure]', params: { sure: String(b.surah), b: b.id, a: String(b.ayah) } })}
            accessibilityRole="button" accessibilityLabel={`${b.name}, ${surahName(b.surah, lang, list?.[b.surah - 1])} ${b.ayah}`}
            style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 16, backgroundColor: b.hatim ? C.greenTint : C.surface, opacity: pressed ? 0.8 : 1 })}>
            <Icon name="bookmark" size={20} color={b.hatim ? C.green : C.accent} />
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={{ fontSize: fs(15), fontWeight: '700', color: C.ink }}>{b.name}</Text>
              <Text style={T.small}>{surahName(b.surah, lang, list?.[b.surah - 1])} · {pick(L.ayah, lang).replace('{n}', String(b.ayah))} · {pageWord(lang)} {pageOf(b.surah, b.ayah)}{b.hatim ? ` · %${pct} ${pick(L.done, lang)}` : ''}</Text>
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
    </View>
  );
}

function LinkRow({ icon, label, onPress }: { icon: 'bookmark' | 'text' | 'settings'; label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" style={({ pressed }) => ({ minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 8, opacity: pressed ? 0.7 : 1 })}>
      <Icon name={icon} size={18} color={C.accent} />
      <Text style={{ flex: 1, fontSize: fs(15), fontWeight: '700', color: C.accent }}>{label}</Text>
      <Icon name="chevron" size={16} color={C.muted} />
    </Pressable>
  );
}

export default function QuranList() {
  const { t, lang } = useI18n();
  const { bookmarks, removeBookmark } = useQuranPrefs();
  const [list, setList] = useState<SurahMeta[] | null>(null);
  const [offline, setOffline] = useState(false);
  const [q, setQ] = useState('');
  const [tab, setTab] = useState<Tab>('surah');

  useEffect(() => {
    listSurahs().then(setList).catch(() => {
      setOffline(true);
      setList(SURAH_TR.map((n, i) => ({ number: i + 1, name: '', englishName: n, numberOfAyahs: 0, revelationType: '' })));
    });
  }, []);

  const target = useMemo(() => parseQuranQuery(q, [SURAH_TR, (list ?? []).map((s) => s.englishName), (list ?? []).map((s) => s.name)]), [q, list]);
  const targetLabel = !target ? '' : target.kind === 'ayah'
    ? `${surahName(target.s, lang, list?.[target.s - 1])} · ${pick(L.ayah, lang).replace('{n}', String(target.a))} · ${pageWord(lang)} ${pageOf(target.s, target.a)}`
    : target.kind === 'page' ? pick(L.goPage, lang).replace('{p}', String(target.p))
      : pick(L.goJuz, lang).replace('{j}', String(target.j)).replace('{p}', String(juzStartPage(target.j)));

  const filtered = useMemo(() => {
    const needle = q.toLocaleLowerCase(lang).trim();
    return (list ?? []).filter((s) => !needle || `${s.number} ${surahName(s.number, lang, s)} ${s.englishName} ${s.name}`.toLocaleLowerCase(lang).includes(needle));
  }, [list, q, lang]);
  const showTab: Tab = q ? 'surah' : tab;

  const header = (
    <View style={{ gap: 12, paddingBottom: 8 }}>
      {target && (
        <Pressable onPress={() => openTarget(target)} accessibilityRole="button"
          style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderRadius: 16, backgroundColor: C.accent, opacity: pressed ? 0.85 : 1 })}>
          <Icon name="book" size={18} color={C.onAccent} />
          <Text style={{ flex: 1, fontSize: fs(15), fontWeight: '700', color: C.onAccent }}>{targetLabel}</Text>
          <Icon name="chevron" size={16} color={C.onAccent} />
        </Pressable>
      )}
      {!q && <ContinueCard lang={lang} list={list} />}
      {!q && (
        <Segmented<Tab> value={tab} onChange={setTab}
          options={[{ value: 'surah', label: pick(L.surahs, lang) }, { value: 'juz', label: pick(L.juzs, lang) }, { value: 'marks', label: pick(L.marks, lang) }]} />
      )}
      {showTab === 'marks' && (
        <View style={{ gap: 4 }}>
          <Marks items={bookmarks} lang={lang} list={list} onRemove={removeBookmark} />
          <LinkRow icon="bookmark" label={pick(L.hatim, lang)} onPress={() => router.push('/hatim')} />
          <LinkRow icon="text" label={pick(L.tajweed, lang)} onPress={() => router.push('/tecvid')} />
          <LinkRow icon="settings" label={pick(L.settings, lang)} onPress={() => router.push('/kuran-ayarlar')} />
        </View>
      )}
    </View>
  );

  const juzRows = JUZ_STARTS.map(([s, a], i) => ({ j: i + 1, s, a, p: juzStartPage(i + 1) }));

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={['top', 'left', 'right']}>
      <View style={{ paddingHorizontal: 16, gap: 10, paddingBottom: 8 }}>
        <Header title={t('quran.title')} right={(
          <Pressable onPress={() => router.push('/kuran-ayarlar')} accessibilityRole="button" accessibilityLabel={pick(L.settings, lang)} hitSlop={8}>
            <Icon name="settings" color={C.muted} />
          </Pressable>
        )} />
        <TextInput value={q} onChangeText={setQ} placeholder={pick(L.search, lang)} placeholderTextColor={C.muted} returnKeyType="go"
          onSubmitEditing={() => { if (target) openTarget(target); }}
          style={{ height: 46, borderRadius: 23, backgroundColor: C.surface, paddingHorizontal: 16, fontSize: fs(15), color: C.ink }} />
        {offline && <Text style={T.small}>{t('quran.offline')}</Text>}
      </View>
      {!list ? <ActivityIndicator style={{ marginTop: 32 }} color={C.accent} /> : showTab === 'juz' ? (
        <FlatList
          data={juzRows}
          keyExtractor={(r) => String(r.j)}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
          ListHeaderComponent={header}
          renderItem={({ item: r }) => (
            <Pressable onPress={() => router.push({ pathname: '/mushaf', params: { p: String(r.p) } })} accessibilityRole="button"
              style={{ minHeight: 60, flexDirection: 'row', alignItems: 'center', gap: 12, borderBottomWidth: 1, borderBottomColor: C.border }}>
              <View style={{ width: 36, height: 36, borderRadius: 18, borderWidth: 1.5, borderColor: C.route, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: fs(12), fontWeight: '700', color: C.accent }}>{r.j}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: fs(15), fontWeight: '600', color: C.ink }}>{pick(L.juzRow, lang).replace('{j}', String(r.j))}</Text>
                <Text style={T.small}>{pick(L.juzFrom, lang).replace('{s}', surahName(r.s, lang, list?.[r.s - 1])).replace('{a}', String(r.a)).replace('{p}', String(r.p))}</Text>
              </View>
              <Icon name="chevron" size={16} color={C.muted} />
            </Pressable>
          )}
        />
      ) : (
        <FlatList
          data={showTab === 'surah' ? filtered : []}
          keyExtractor={(s) => String(s.number)}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
          ListHeaderComponent={header}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item: s }) => (
            <Pressable onPress={() => router.push({ pathname: '/kuran/[sure]', params: { sure: String(s.number) } })}
              style={{ minHeight: 60, flexDirection: 'row', alignItems: 'center', gap: 12, borderBottomWidth: 1, borderBottomColor: C.border }}>
              <View style={{ width: 36, height: 36, borderRadius: 18, borderWidth: 1.5, borderColor: C.route, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: fs(12), fontWeight: '700', color: C.accent }}>{s.number}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: fs(15), fontWeight: '600', color: C.ink }}>{surahName(s.number, lang, s)}</Text>
                {s.numberOfAyahs ? <Text style={T.small}>{pick(s.revelationType === 'Meccan' ? REV.meccan : REV.medinan, lang)} · {t('quran.ayahs', { n: s.numberOfAyahs })} · {pageWord(lang)} {pageOf(s.number, 1)}</Text> : null}
              </View>
              {s.name ? <Text style={{ fontSize: fs(20), color: C.ink }}>{s.name}</Text> : null}
            </Pressable>
          )}
          ListFooterComponent={showTab === 'surah' ? <Text style={[T.small, { marginTop: 12 }]}>{t('quran.source')}</Text> : undefined}
        />
      )}
    </SafeAreaView>
  );
}
