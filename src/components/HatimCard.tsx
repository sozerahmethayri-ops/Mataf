// Ana sayfa: hatim planı varsa bugünün bölümü ve "Okumaya devam". Plan yoksa çizilmez.
import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import { C, fs } from '@/constants/theme';
import { pick } from '@/i18n';
import { hatimToday, readFromMark, readShare } from '@/services/hatim';
import { surahName } from '@/services/quran';
import { useQuranPrefs } from '@/services/QuranPrefs';
import { useHatimPlan } from '@/services/useHatimPlan';
import { Icon } from './Icon';

type Lang = 'tr' | 'en' | 'ar';
export const HL = {
  title: { tr: 'Hatim planı', en: 'Khatm plan', ar: 'خطة الختمة' },
  day: { tr: '{d}. gün / {n}', en: 'Day {d} of {n}', ar: 'اليوم {d} من {n}' },
  today: { tr: 'Bugün', en: 'Today', ar: 'اليوم' },
  done: { tr: 'Bugünkü bölüm tamam', en: 'Today’s portion is done', ar: 'أتممت ورد اليوم' },
  finished: { tr: 'Hatminiz tamam. Allah kabul etsin.', en: 'Your khatm is complete. May Allah accept it.', ar: 'تمّت ختمتك، تقبّل الله منك.' },
  read: { tr: 'Okumaya devam', en: 'Continue reading', ar: 'متابعة القراءة' },
  juz: { tr: '≈ {j} cüz ({p} sayfa)', en: '≈ {j} juz ({p} pages)', ar: '≈ {j} جزء ({p} صفحة)' },
  pages: { tr: '≈ {p} sayfa', en: '≈ {p} pages', ar: '≈ {p} صفحة' },
};

/** Sûre ve âyet: Türkçede sûre adıyla, öbür dillerde 2:142 biçiminde (ad listesi çevrimdışı yalnız Türkçe) */
export const place = ([s, a]: [number, number], lg: Lang) => (lg === 'tr' ? `${surahName(s, 'tr')} ${a}` : `${s}:${a}`);

/** Kalan bölümün büyüklüğü: üç çeyrek cüzden azsa yalnız sayfa (cüz yarıma yuvarlanır, sayfa ile çelişmesin) */
export function portionText(juzLeft: number, pages: number, lg: Lang) {
  const j = Math.round(juzLeft * 2) / 2;
  return juzLeft >= 0.75
    ? pick(HL.juz, lg).replace('{j}', j.toLocaleString(lg)).replace('{p}', String(pages))
    : pick(HL.pages, lg).replace('{p}', String(pages));
}

export function HatimCard({ now, lg }: { now: Date; lg: Lang }) {
  const [plan] = useHatimPlan();
  const { bookmarks } = useQuranPrefs();
  if (!plan) return null;
  const hb = bookmarks.find((b) => b.hatim);
  const read = hb ? readFromMark(hb.surah, hb.ayah) : 0;
  const s = hatimToday(plan, read, now);
  const pct = Math.round(readShare(read) * 100);
  const open = () => (hb ? router.push({ pathname: '/kuran/[sure]', params: { sure: String(hb.surah), b: hb.id, a: String(hb.ayah) } }) : router.push('/hatim'));
  return (
    <View style={{ borderWidth: 1, borderColor: C.border, borderRadius: 18, padding: 14, gap: 8 }}>
      <Pressable onPress={() => router.push('/hatim')} accessibilityRole="button" style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 32, opacity: pressed ? 0.7 : 1 })}>
        <Icon name="book" size={18} color={C.accent} />
        <Text style={{ flex: 1, fontSize: fs(15), fontWeight: '700', color: C.ink }}>{pick(HL.title, lg)}</Text>
        <Text style={{ fontSize: fs(13), fontWeight: '600', color: C.muted }}>{pick(HL.day, lg).replace('{d}', String(Math.min(s.day, plan.days))).replace('{n}', String(plan.days))}</Text>
        <Icon name="chevron" size={16} color={C.muted} />
      </Pressable>
      {s.finished ? (
        <Text style={{ fontSize: fs(15), fontWeight: '700', color: C.accent }}>{pick(HL.finished, lg)}</Text>
      ) : s.left > 0 ? (
        <View style={{ gap: 2 }}>
          <Text style={{ fontSize: fs(15), fontWeight: '600', color: C.ink }}>{pick(HL.today, lg)}: {place(s.from, lg)} → {place(s.to, lg)}</Text>
          <Text style={{ fontSize: fs(13.5), color: C.muted }}>{portionText(s.juzLeft, s.pagesLeft, lg)}</Text>
        </View>
      ) : (
        <Text style={{ fontSize: fs(15), fontWeight: '700', color: C.accent }}>{pick(HL.done, lg)}</Text>
      )}
      <View style={{ height: 6, borderRadius: 3, backgroundColor: C.surface, overflow: 'hidden' }} accessibilityLabel={`%${pct}`}>
        <View style={{ width: `${Math.max(1, pct)}%`, height: 6, backgroundColor: C.accent }} />
      </View>
      {!s.finished && (
        <Pressable onPress={open} accessibilityRole="button"
          style={({ pressed }) => ({ alignSelf: 'flex-start', minHeight: 44, paddingHorizontal: 16, borderRadius: 22, backgroundColor: C.accent, flexDirection: 'row', alignItems: 'center', gap: 8, opacity: pressed ? 0.85 : 1 })}>
          <Icon name="book" size={16} color={C.onAccent} />
          <Text style={{ fontSize: fs(14.5), fontWeight: '700', color: C.onAccent }}>{pick(HL.read, lg)}</Text>
        </Pressable>
      )}
    </View>
  );
}
