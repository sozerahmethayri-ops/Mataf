// Kaza namazı ve oruç takibi: borcu hesapla, kıldıkça düş, haftalık ilerleme ve bitiş tahmini.
import { useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BarChart } from '@/components/BarChart';
import { Icon } from '@/components/Icon';
import { Btn, Card, Header, Segmented, SectionTitle, T, Toggle } from '@/components/ui';
import { C, fs } from '@/constants/theme';
import type { T3 } from '@/data/umre';
import { pick, useI18n } from '@/i18n';
import {
  ALL_KEYS, activeKeys, daysToFinish, initialKaza, lastDays, markKaza, prayersLeft, remaining, setOwedDays, toDays, type KazaKey, type KazaState,
} from '@/services/kaza';
import { usePersisted } from '@/services/usePersisted';

type Lang = 'tr' | 'en' | 'ar';
const NAMES: Record<KazaKey, T3> = {
  sabah: { tr: 'Sabah', en: 'Fajr', ar: 'الفجر' },
  ogle: { tr: 'Öğle', en: 'Dhuhr', ar: 'الظهر' },
  ikindi: { tr: 'İkindi', en: 'Asr', ar: 'العصر' },
  aksam: { tr: 'Akşam', en: 'Maghrib', ar: 'المغرب' },
  yatsi: { tr: 'Yatsı', en: 'Isha', ar: 'العشاء' },
  vitir: { tr: 'Vitir', en: 'Witr', ar: 'الوتر' },
  oruc: { tr: 'Oruç', en: 'Fasting', ar: 'الصوم' },
};
const L = {
  title: { tr: 'Kaza takibi', en: 'Missed prayers', ar: 'قضاء الفوائت' },
  sub: { tr: 'Kaza namazı ve oruç', en: 'Make-up prayers and fasts', ar: 'قضاء الصلاة والصوم' },
  left: { tr: 'Kalan', en: 'Remaining', ar: 'المتبقي' },
  prayers: { tr: 'namaz', en: 'prayers', ar: 'صلاة' },
  fasts: { tr: 'gün oruç', en: 'days of fasting', ar: 'يوم صيام' },
  finish: { tr: 'Günde {g} günlük kaza ile ≈ {n} günde biter ({d}).', en: 'At {g} day(s) of make-up per day, done in ≈ {n} days ({d}).', ar: 'بمعدل {g} يوم قضاء يوميًا تنتهي خلال ≈ {n} يومًا ({d}).' },
  goal: { tr: 'Günlük hedef', en: 'Daily goal', ar: 'الهدف اليومي' },
  goalUnit: { tr: 'günlük', en: 'day', ar: 'يوم' },
  prayed: { tr: 'Kıldım', en: 'Prayed', ar: 'صليت' },
  fasted: { tr: 'Tuttum', en: 'Fasted', ar: 'صمت' },
  week: { tr: 'Son 7 gün (kılınan kaza namazı)', en: 'Last 7 days (make-up prayers)', ar: 'آخر ٧ أيام' },
  setup: { tr: 'Borcunuzu hesaplayın', en: 'Work out what you owe', ar: 'احسب ما عليك' },
  setupText: { tr: 'Namaz kılmadığınız ve oruç tutmadığınız süreyi yaklaşık girin; emin değilseniz fazlasını yazmak ihtiyata daha uygundur.', en: 'Enter roughly how long you missed prayers and fasts; when unsure, rounding up is the safer choice.', ar: 'أدخل المدة التقريبية؛ وعند الشك فالأحوط الزيادة.' },
  prayerPeriod: { tr: 'Kılınmayan namaz süresi', en: 'Period of missed prayers', ar: 'مدة الصلوات الفائتة' },
  years: { tr: 'yıl', en: 'years', ar: 'سنة' },
  months: { tr: 'ay', en: 'months', ar: 'شهر' },
  days: { tr: 'gün', en: 'days', ar: 'يوم' },
  fastDays: { tr: 'Tutulmayan oruç (gün)', en: 'Missed fasts (days)', ar: 'أيام الصوم الفائتة' },
  save: { tr: 'Kaydet', en: 'Save', ar: 'حفظ' },
  addMore: { tr: 'Mevcut borca ekle', en: 'Add to current', ar: 'أضف إلى الحالي' },
  replace: { tr: 'Borcu yeniden yaz', en: 'Replace', ar: 'استبدال' },
  edit: { tr: 'Borcu düzenle', en: 'Edit what I owe', ar: 'تعديل' },
  vitir: { tr: 'Vitri de takip et (Hanefî’ye göre vâcip)', en: 'Track witr too (wajib for Hanafis)', ar: 'تتبع الوتر أيضًا (واجب عند الحنفية)' },
  cancel: { tr: 'Vazgeç', en: 'Cancel', ar: 'إلغاء' },
  done: { tr: 'Bütün kazalarınız ödendi. Allah kabul etsin!', en: 'All make-ups are done. May Allah accept them!', ar: 'تمّ قضاء الجميع. تقبّل الله!' },
  info: { tr: 'Bilgi', en: 'Notes', ar: 'ملاحظات' },
  i1: { tr: 'Kılınmamış farz namazlar ve vitir kaza edilir; sünnetlerin kazası yoktur (sabahın sünneti, aynı günün öğlesine kadar farzla birlikte kılınabilir).', en: 'Missed obligatory prayers and witr are made up; sunnahs are not (except the sunnah of Fajr, with the fard, until noon the same day).', ar: 'تُقضى الفرائض والوتر، ولا تُقضى السنن.' },
  i2: { tr: 'Kaza namazı kerahat vakitleri (güneş doğarken, tam tepedeyken, batarken) dışında her zaman kılınabilir. Çok kazası olan, “kılmadığım ilk (ya da son) öğle namazı” gibi niyet eder.', en: 'Make-ups can be prayed at any time except the disliked times (sunrise, zenith, sunset). With many owed, intend “the first (or last) Dhuhr I missed”.', ar: 'تُقضى في غير أوقات الكراهة، وينوي: أول (أو آخر) ظهر فاتني.' },
  i3: { tr: 'Kaynak: Diyanet İşleri Başkanlığı (Hanefî). Kendi durumunuz için bir din görevlisine danışın.', en: 'Source: Diyanet (Hanafi). Ask a scholar about your own situation.', ar: 'المصدر: رئاسة الشؤون الدينية (حنفي).' },
} satisfies Record<string, T3>;
const stamp = () => new Date();

export default function KazaScreen() {
  const { lang } = useI18n();
  const lg = lang as Lang;
  const [s, setS] = usePersisted<KazaState>('kaza:state', initialKaza());
  const [setup, setSetup] = useState(false);
  const [w, setW] = useState(340);
  const empty = ALL_KEYS.every((k) => s.owed[k] === 0);
  const totalOwed = activeKeys(s).reduce((n, k) => n + s.owed[k], 0);
  const left = prayersLeft(s);
  const pct = totalOwed ? Math.round(((totalOwed - left) / totalOwed) * 100) : 0;
  const finishIn = daysToFinish(s);
  const now = stamp();
  const finishDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + finishIn);
  const week = lastDays(s, 7, now, activeKeys(s)).map((d) => ({ label: d.date.toLocaleDateString(lang === 'ar' ? 'ar' : lang, { weekday: lang === 'ar' ? 'narrow' : 'short' }), value: d.count }));
  const mark = (k: KazaKey, d: 1 | -1) => setS(markKaza(s, k, d, stamp()));

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32, gap: 12 }}>
        <Header back title={pick(L.title, lg)} subtitle={pick(L.sub, lg)} />

        {(empty || setup) ? (
          <Calculator lg={lg} hasOwed={!empty} onCancel={empty ? undefined : () => setSetup(false)}
            onSave={(pd, fd, add) => { setS(setOwedDays(s, pd, fd, add)); setSetup(false); }} />
        ) : (
          <>
            <Card tint={left === 0 ? C.openTint : C.accentSoft} style={{ gap: 8 }}>
              <Text style={T.small}>{pick(L.left, lg)}</Text>
              <Text style={{ fontSize: fs(30), fontWeight: '800', color: C.ink }}>
                {left.toLocaleString(lang)} <Text style={{ fontSize: fs(16), fontWeight: '600', color: C.ink2 }}>{pick(L.prayers, lg)}</Text>
                {s.owed.oruc > 0 ? <Text style={{ fontSize: fs(16), fontWeight: '600', color: C.ink2 }}>{`  ·  ${remaining(s, 'oruc')} ${pick(L.fasts, lg)}`}</Text> : null}
              </Text>
              <View style={{ height: 8, borderRadius: 4, backgroundColor: C.border, overflow: 'hidden' }}>
                <View style={{ width: `${pct}%`, height: 8, backgroundColor: C.open }} />
              </View>
              <Text style={T.small}>
                {left === 0 ? pick(L.done, lg) : `%${pct} · ${pick(L.finish, lg).replace('{g}', String(s.dailyGoal)).replace('{n}', finishIn.toLocaleString(lang)).replace('{d}', finishDate.toLocaleDateString(lang, { day: 'numeric', month: 'long', year: 'numeric' }))}`}
              </Text>
            </Card>

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Text style={[T.small, { flex: 1 }]}>{pick(L.goal, lg)}</Text>
              <View style={{ width: 200 }}>
                <Segmented value={String(s.dailyGoal)} onChange={(v) => setS({ ...s, dailyGoal: Number(v) })}
                  options={[1, 2, 3].map((n) => ({ value: String(n), label: `${n} ${pick(L.goalUnit, lg)}` }))} />
              </View>
            </View>

            {[...activeKeys(s), ...(s.owed.oruc > 0 ? (['oruc'] as KazaKey[]) : [])].map((k) => {
              const r = remaining(s, k);
              return (
                <View key={k} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6, borderBottomWidth: 1, borderColor: C.border }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: fs(16), fontWeight: '700', color: C.ink }}>{pick(NAMES[k], lg)}</Text>
                    <Text style={T.small}>{s.done[k].toLocaleString(lang)} / {s.owed[k].toLocaleString(lang)}</Text>
                  </View>
                  <Text style={{ fontSize: fs(22), fontWeight: '800', color: r ? C.ink : C.open, minWidth: 60, textAlign: 'right' }}>{r.toLocaleString(lang)}</Text>
                  <Pressable onPress={() => mark(k, -1)} disabled={s.done[k] === 0} accessibilityLabel="Geri al" hitSlop={6}
                    style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: C.surface, alignItems: 'center', justifyContent: 'center', opacity: s.done[k] ? 1 : 0.4 }}>
                    <Icon name="minus" size={16} color={C.ink2} />
                  </Pressable>
                  <Pressable onPress={() => mark(k, 1)} disabled={r === 0} accessibilityRole="button"
                    style={({ pressed }) => ({ height: 40, paddingHorizontal: 14, borderRadius: 20, backgroundColor: r ? C.green : C.surface, flexDirection: 'row', alignItems: 'center', gap: 6, opacity: pressed ? 0.8 : 1 })}>
                    <Icon name="check" size={16} color={r ? '#FFFFFF' : C.muted} width={3} />
                    <Text style={{ fontSize: fs(14), fontWeight: '700', color: r ? '#FFFFFF' : C.muted }}>{pick(k === 'oruc' ? L.fasted : L.prayed, lg)}</Text>
                  </Pressable>
                </View>
              );
            })}

            <SectionTitle>{pick(L.week, lg)}</SectionTitle>
            <View onLayout={(e) => setW(Math.round(e.nativeEvent.layout.width))}>
              <BarChart data={week} width={w} color={C.green} />
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Text style={[T.body, { flex: 1 }]}>{pick(L.vitir, lg)}</Text>
              <Toggle value={s.vitir} onChange={(v) => setS({ ...s, vitir: v })} label={pick(L.vitir, lg)} />
            </View>
            <Btn title={pick(L.edit, lg)} kind="secondary" icon="edit" onPress={() => setSetup(true)} />
          </>
        )}

        <SectionTitle>{pick(L.info, lg)}</SectionTitle>
        <Text style={T.body}>{pick(L.i1, lg)}</Text>
        <Text style={T.body}>{pick(L.i2, lg)}</Text>
        <Text style={T.small}>{pick(L.i3, lg)}</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function Calculator({ lg, hasOwed, onSave, onCancel }: { lg: Lang; hasOwed: boolean; onSave: (prayerDays: number, fastDays: number, add: boolean) => void; onCancel?: () => void }) {
  const [y, setY] = useState('');
  const [m, setM] = useState('');
  const [d, setD] = useState('');
  const [f, setF] = useState('');
  const [add, setAdd] = useState(false);
  const n = (v: string) => Number(v.replace(',', '.')) || 0;
  const pd = toDays(n(y), n(m), n(d));
  const num = (v: string, set: (s: string) => void, label: string) => (
    <View style={{ flex: 1, gap: 4 }}>
      <TextInput value={v} onChangeText={set} keyboardType="number-pad" placeholder="0" placeholderTextColor={C.muted}
        style={{ height: 48, borderRadius: 12, backgroundColor: C.surface, paddingHorizontal: 12, fontSize: fs(18), fontWeight: '700', color: C.ink, textAlign: 'center' }} />
      <Text style={[T.small, { textAlign: 'center' }]}>{label}</Text>
    </View>
  );
  return (
    <Card style={{ gap: 12, borderWidth: 1, borderColor: C.border }}>
      <Text style={T.h2}>{pick(L.setup, lg)}</Text>
      <Text style={T.body}>{pick(L.setupText, lg)}</Text>
      <SectionTitle>{pick(L.prayerPeriod, lg)}</SectionTitle>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        {num(y, setY, pick(L.years, lg))}
        {num(m, setM, pick(L.months, lg))}
        {num(d, setD, pick(L.days, lg))}
      </View>
      {pd > 0 && <Text style={T.small}>= {pd.toLocaleString()} {pick(L.days, lg)} × 5 (+ vitir)</Text>}
      <SectionTitle>{pick(L.fastDays, lg)}</SectionTitle>
      <View style={{ flexDirection: 'row' }}>{num(f, setF, pick(L.days, lg))}<View style={{ flex: 2 }} /></View>
      {hasOwed && (
        <Segmented value={add ? 'add' : 'replace'} onChange={(v) => setAdd(v === 'add')}
          options={[{ value: 'add', label: pick(L.addMore, lg) }, { value: 'replace', label: pick(L.replace, lg) }]} />
      )}
      <Btn title={pick(L.save, lg)} icon="check" disabled={pd === 0 && n(f) === 0} onPress={() => onSave(pd, n(f), add)} />
      {onCancel && <Btn title={pick(L.cancel, lg)} kind="secondary" onPress={onCancel} />}
    </Card>
  );
}
