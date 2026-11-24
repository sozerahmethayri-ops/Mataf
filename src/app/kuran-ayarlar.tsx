import { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/Icon';
import { Header, SectionTitle, Segmented, T } from '@/components/ui';
import { C } from '@/constants/theme';
import { LANG_NAMES, MEAL_AUDIO, RECITERS, TAFSIRS } from '@/data/quranEditions';
import type { ML } from '@/data/sites';
import { pick, useI18n } from '@/i18n';
import { listTranslations, type Edition } from '@/services/quran';
import { useQuranPrefs } from '@/services/QuranPrefs';
import { useAsync } from '@/services/useAsync';

const L = {
  title: { tr: 'Okuma ayarları', en: 'Reading settings', ar: 'إعدادات القراءة' },
  meal: { tr: 'Meal', en: 'Translation', ar: 'الترجمة' },
  none: { tr: 'Meal gösterme', en: 'No translation', ar: 'بدون ترجمة' },
  translit: { tr: 'Okunuşu göster (Latin harfli)', en: 'Show transliteration', ar: 'إظهار النطق اللاتيني' },
  reciter: { tr: 'Kâri (Arapça tilavet)', en: 'Reciter', ar: 'القارئ' },
  mealAudio: { tr: 'Sesli meal', en: 'Audio translation', ar: 'الترجمة الصوتية' },
  off: { tr: 'Kapalı', en: 'Off', ar: 'إيقاف' },
  mode: { tr: 'Dinlerken', en: 'When playing', ar: 'عند الاستماع' },
  modeAr: { tr: 'Arapça', en: 'Arabic', ar: 'العربية' },
  modeBoth: { tr: 'Arapça + meal', en: 'Arabic + translation', ar: 'العربية + الترجمة' },
  modeMeal: { tr: 'Yalnız meal', en: 'Translation only', ar: 'الترجمة فقط' },
  tafsir: { tr: 'Tefsir', en: 'Tafsir', ar: 'التفسير' },
  offline: { tr: 'Meal listesi yüklenemedi; çevrimiçi olunca tüm diller görünür.', en: 'Could not load the list; all languages appear when online.', ar: 'تعذّر تحميل القائمة.' },
  license: { tr: 'Meal ve tefsir metinlerinin hakları sahiplerine aittir.', en: 'Translations and tafsir texts belong to their publishers.', ar: 'حقوق الترجمات والتفاسير لأصحابها.' },
} satisfies Record<string, ML>;

const FALLBACK: Edition[] = [
  { identifier: 'tr.diyanet', language: 'tr', englishName: 'Diyanet İşleri', name: 'Diyanet' },
  { identifier: 'tr.vakfi', language: 'tr', englishName: 'Diyanet Vakfı', name: 'Diyanet Vakfı' },
  { identifier: 'tr.yazir', language: 'tr', englishName: 'Elmalılı Hamdi Yazır', name: 'Elmalılı' },
  { identifier: 'en.sahih', language: 'en', englishName: 'Saheeh International', name: 'Saheeh International' },
];

export default function QuranSettings() {
  const { lang } = useI18n();
  const insets = useSafeAreaInsets();
  const { prefs, setPrefs } = useQuranPrefs();
  const eds = useAsync(() => listTranslations(), []);
  const all = eds.data ?? FALLBACK;
  const langs = useMemo(() => {
    const set = Array.from(new Set(all.map((e) => e.language)));
    const pri = [lang, 'tr', 'en', 'ar'];
    return set.sort((a, b) => (pri.indexOf(a) === -1 ? 99 : pri.indexOf(a)) - (pri.indexOf(b) === -1 ? 99 : pri.indexOf(b)) || (LANG_NAMES[a] ?? a).localeCompare(LANG_NAMES[b] ?? b));
  }, [all, lang]);
  const current = all.find((e) => e.identifier === prefs.translation)?.language ?? (prefs.translation?.split('.')[0] ?? lang);
  const [mealLang, setMealLang] = useState<string>(current);
  const tafLangs = Array.from(new Set(TAFSIRS.map((x) => x.lang)));
  const tafCurrent = TAFSIRS.find((x) => x.id === prefs.tafsir)?.lang ?? lang;
  const [tafLang, setTafLang] = useState<string>(tafCurrent);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.bg }} contentContainerStyle={{ padding: 16, paddingTop: insets.top + 8, paddingBottom: insets.bottom + 32, gap: 10 }}>
      <Header back title={pick(L.title, lang)} />

      <SectionTitle>{pick(L.meal, lang)}</SectionTitle>
      <LangChips langs={langs} value={mealLang} onChange={setMealLang} />
      {eds.error ? <Text style={T.small}>{pick(L.offline, lang)}</Text> : null}
      <Option label={pick(L.none, lang)} selected={prefs.translation === null} onPress={() => setPrefs({ translation: null })} />
      {all.filter((e) => e.language === mealLang).map((e) => (
        <Option key={e.identifier} label={e.englishName} sub={e.name !== e.englishName ? e.name : undefined} selected={prefs.translation === e.identifier} onPress={() => setPrefs({ translation: e.identifier })} />
      ))}
      <Option label={pick(L.translit, lang)} selected={prefs.translit} check onPress={() => setPrefs({ translit: !prefs.translit })} />

      <SectionTitle>{pick(L.reciter, lang)}</SectionTitle>
      {RECITERS.map((r) => <Option key={r.id} label={r.name} selected={prefs.reciter === r.id} onPress={() => setPrefs({ reciter: r.id })} />)}

      <SectionTitle>{pick(L.mealAudio, lang)}</SectionTitle>
      <Option label={pick(L.off, lang)} selected={prefs.mealAudio === null} onPress={() => setPrefs({ mealAudio: null, mode: 'ar' })} />
      {MEAL_AUDIO.map((m) => <Option key={m.id} label={m.name} selected={prefs.mealAudio === m.id} onPress={() => setPrefs({ mealAudio: m.id, mode: prefs.mode === 'ar' ? 'ar+meal' : prefs.mode })} />)}
      {prefs.mealAudio ? (
        <>
          <SectionTitle>{pick(L.mode, lang)}</SectionTitle>
          <Segmented value={prefs.mode} onChange={(v) => setPrefs({ mode: v })}
            options={[{ value: 'ar', label: pick(L.modeAr, lang) }, { value: 'ar+meal', label: pick(L.modeBoth, lang) }, { value: 'meal', label: pick(L.modeMeal, lang) }]} />
        </>
      ) : null}

      <SectionTitle>{pick(L.tafsir, lang)}</SectionTitle>
      <LangChips langs={tafLangs} value={tafLang} onChange={setTafLang} />
      {TAFSIRS.filter((x) => x.lang === tafLang).map((x) => <Option key={x.id} label={x.name} selected={prefs.tafsir === x.id} onPress={() => setPrefs({ tafsir: x.id })} />)}
      <Text style={[T.small, { marginTop: 8 }]}>{pick(L.license, lang)}</Text>
    </ScrollView>
  );
}

function LangChips({ langs, value, onChange }: { langs: string[]; value: string; onChange: (v: string) => void }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 2 }}>
      {langs.map((l) => (
        <Pressable key={l} onPress={() => onChange(l)} accessibilityRole="radio" accessibilityState={{ selected: value === l }}
          style={{ height: 34, paddingHorizontal: 12, borderRadius: 17, justifyContent: 'center', backgroundColor: value === l ? C.ink : C.surface }}>
          <Text style={{ fontSize: 13, fontWeight: '600', color: value === l ? '#FFFFFF' : C.ink }}>{LANG_NAMES[l] ?? l}</Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

function Option({ label, sub, selected, onPress, check }: { label: string; sub?: string; selected: boolean; onPress: () => void; check?: boolean }) {
  return (
    <Pressable onPress={onPress} accessibilityRole={check ? 'checkbox' : 'radio'} accessibilityState={check ? { checked: selected } : { selected }}
      style={{ minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 14, backgroundColor: selected ? C.accentSoft : C.surface }}>
      <View style={{ width: 22, height: 22, borderRadius: check ? 6 : 11, borderWidth: 2, borderColor: selected ? C.accent : '#C9CCD3', backgroundColor: selected ? C.accent : 'transparent', alignItems: 'center', justifyContent: 'center' }}>
        {selected ? <Icon name="check" size={13} color="#FFFFFF" width={3} /> : null}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 15, fontWeight: '600', color: C.ink }}>{label}</Text>
        {sub ? <Text style={T.small}>{sub}</Text> : null}
      </View>
    </Pressable>
  );
}
