// Hac rehberi: hac türü seçimi, hac günlerinin tarihleri (Ümmü'l-Kurâ), gün gün adımlar (yapılacaklar, dualar,
// sık hatalar, dayanak), farz/vacip/sünnet listesi, ihram yasakları. İlerleme ve tür cihazda saklanır.
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GuideStepCard } from '@/components/GuideStepCard';
import { Icon, type IconName } from '@/components/Icon';
import { Card, IconBtn, SectionTitle, Segmented, T } from '@/components/ui';
import { C, fs } from '@/constants/theme';
import { HAC_NOTE, HAC_PILLARS, HAC_SOURCES, HAC_STEPS, HAC_TYPES, type HacStep, type HacType } from '@/data/hac';
import { IHRAM_RULES, RULES_NOTE, type T3 } from '@/data/umre';
import { pick, useI18n } from '@/i18n';
import { hajjCalendar, hajjPhase, type HajjCal } from '@/services/hac';
import { usePersisted } from '@/services/usePersisted';

type Lang = 'tr' | 'en' | 'ar';
const nowDate = () => new Date();
const stamp = () => Date.now();

const L = {
  title: { tr: 'Hac rehberi', en: 'Hajj guide', ar: 'دليل الحج' },
  sub: { tr: 'Diyanet Hac İlmihali (Hanefî) özeti', en: 'Summary of the Hanafi rulings (Diyanet)', ar: 'ملخص وفق المذهب الحنفي' },
  type: { tr: 'Hac türünüz', en: 'Your type of Hajj', ar: 'نوع حجك' },
  days: { tr: 'Hac günleri', en: 'Days of Hajj', ar: 'أيام الحج' },
  left: { tr: 'Arefe’ye {n} gün', en: '{n} days to Arafah', ar: '{n} يومًا إلى عرفة' },
  today: { tr: 'Bugün', en: 'Today', ar: 'اليوم' },
  after: { tr: 'Bu yılın hac günleri geçti.', en: 'This year’s days of Hajj have passed.', ar: 'انقضت أيام الحج لهذا العام.' },
  calNote: { tr: 'Tarihler Ümmü’l-Kurâ takvimine göre; Suudi Arabistan’ın ilanıyla bir gün kayabilir.', en: 'Dates follow the Umm al-Qura calendar and may shift a day with the Saudi announcement.', ar: 'التواريخ وفق تقويم أم القرى وقد تتغير يومًا حسب الإعلان الرسمي.' },
  progress: { tr: 'Haccım · {d}/{n} adım', en: 'My Hajj · {d}/{n} steps', ar: 'حجي · {d}/{n}' },
  reset: { tr: 'Sıfırla', en: 'Reset', ar: 'إعادة' },
  allDone: { tr: 'Haccınız tamamlandı. Allah kabul etsin, hacc-ı mebrûr olsun!', en: 'Your Hajj is complete. May Allah accept it!', ar: 'تمّ حجك، حجًّا مبرورًا!' },
  pillars: { tr: 'Haccın farzları, vacipleri, sünnetleri', en: 'Pillars, requirements and sunnahs', ar: 'أركان الحج وواجباته وسننه' },
  rules: { tr: 'İhram yasakları ve cezaları', en: 'Ihram restrictions and penalties', ar: 'محظورات الإحرام' },
  tools: { tr: 'Araçlar', en: 'Tools', ar: 'أدوات' },
  sources: { tr: 'Kaynaklar', en: 'Sources', ar: 'المصادر' },
  checked: { tr: 'Bu içerik henüz bir ilahiyatçı tarafından kontrol edilmedi; kendi durumunuz için kafilenizin din görevlisine danışın.', en: 'Not yet reviewed by a scholar; ask your group’s religious guide about your own case.', ar: 'لم يراجعه عالم بعد؛ اسأل مرشد مجموعتك.' },
} satisfies Record<string, T3>;

const DAY_NAMES: Record<number, T3> = {
  8: { tr: 'Terviye', en: 'Tarwiyah', ar: 'التروية' },
  9: { tr: 'Arefe', en: 'Arafah', ar: 'عرفة' },
  10: { tr: 'Bayram 1', en: 'Eid 1', ar: 'العيد ١' },
  11: { tr: 'Bayram 2', en: 'Eid 2', ar: 'العيد ٢' },
  12: { tr: 'Bayram 3', en: 'Eid 3', ar: 'العيد ٣' },
  13: { tr: 'Bayram 4', en: 'Eid 4', ar: 'العيد ٤' },
};

const TOOLS: { icon: IconName; label: T3; to: string }[] = [
  { icon: 'flag', label: { tr: 'Şeytan taşlama', en: 'Jamarat', ar: 'الجمرات' }, to: '/cemerat' },
  { icon: 'map', label: { tr: 'Hac yerleri', en: 'Hajj sites', ar: 'المشاعر' }, to: '/hac-harita' },
  { icon: 'kaaba', label: { tr: 'Tavaf', en: 'Tawaf', ar: 'الطواف' }, to: '/tavaf' },
  { icon: 'walk', label: { tr: 'Sa’y', en: 'Sa‘y', ar: 'السعي' }, to: '/say' },
];

/** Bugünün adımı (dh'ye göre); Arefe akşamı için Arafat yeterli bir vurgu. */
const todayStep = (dh: number | null) => (dh === 8 ? 'terviye' : dh === 9 ? 'arafat' : dh === 10 ? 'bayram1' : dh && dh >= 11 ? 'tesrik' : null);

type Prog = { type: HacType; done: string[]; at: number };

export default function HacScreen() {
  const { lang } = useI18n();
  const lg = lang as Lang;
  const insets = useSafeAreaInsets();
  const [prog, setProg] = usePersisted<Prog>('hac:progress', { type: 'temettu', done: [], at: 0 });
  const [now] = useState(nowDate);
  const cal = useMemo<HajjCal | null>(() => hajjCalendar(now), [now]);
  const phase = cal ? hajjPhase(now, cal) : null;
  const curDh = phase?.kind === 'during' ? phase.dh : null;
  const steps = useMemo(() => HAC_STEPS.filter((s) => !s.types || s.types.includes(prog.type)), [prog.type]);
  const [open, setOpen] = useState<string | null>(() => todayStep(curDh));
  const [pillarsOpen, setPillarsOpen] = useState(false);
  const [rulesOpen, setRulesOpen] = useState(false);

  const dfmt = useMemo(() => new Intl.DateTimeFormat(lg, { day: 'numeric', month: 'long', weekday: 'short' }), [lg]);
  const dateOf = (s: HacStep) => (s.dh && cal ? dfmt.format(cal.days.find((d) => d.dh === s.dh)!.date) : undefined);
  const count = steps.filter((s) => prog.done.includes(s.id)).length;
  const toggle = (id: string) => {
    const done = prog.done.includes(id) ? prog.done.filter((x) => x !== id) : [...prog.done, id];
    setProg({ ...prog, done, at: stamp() });
    if (!prog.done.includes(id)) setOpen(steps.find((x) => !done.includes(x.id))?.id ?? null);
  };
  const typeInfo = HAC_TYPES.find((t) => t.id === prog.type)!;

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <View style={{ paddingTop: insets.top + 6, paddingHorizontal: 12, paddingBottom: 8, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <IconBtn name="back" label="Geri" onPress={() => router.back()} />
        <View style={{ flex: 1 }}>
          <Text style={T.h2} numberOfLines={1}>{pick(L.title, lg)}</Text>
          <Text style={T.small} numberOfLines={1}>{pick(L.sub, lg)}</Text>
        </View>
      </View>
      <ScrollView contentContainerStyle={{ padding: 16, paddingTop: 4, gap: 12, paddingBottom: insets.bottom + 28 }}>
        {cal && (
          <Card tint={curDh ? C.accentSoft : undefined} style={{ gap: 10 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Icon name="sun" size={18} color={C.accent} />
              <Text style={{ flex: 1, fontSize: fs(15), fontWeight: '700', color: C.ink }}>
                {pick(L.days, lg)}
                {phase?.kind === 'before' ? ` · ${pick(L.left, lg).replace('{n}', String(phase.days))}` : ''}
              </Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 6 }}>
              {cal.days.map((d) => {
                const on = d.dh === curDh;
                return (
                  <View key={d.dh} style={{ flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: 12, backgroundColor: on ? C.accent : C.surface, gap: 2 }}>
                    <Text style={{ fontSize: fs(10.5), fontWeight: '700', color: on ? C.onAccent : C.muted }} numberOfLines={1}>{pick(DAY_NAMES[d.dh], lg)}</Text>
                    <Text style={{ fontSize: fs(16), fontWeight: '800', color: on ? C.onAccent : C.ink }}>{d.date.getDate()}</Text>
                    <Text style={{ fontSize: fs(10.5), color: on ? C.onAccent : C.muted }} numberOfLines={1}>
                      {d.date.toLocaleDateString(lg, { month: 'short' })}
                    </Text>
                  </View>
                );
              })}
            </View>
            {phase?.kind === 'after' && <Text style={T.small}>{pick(L.after, lg)}</Text>}
            <Text style={[T.small, { color: C.muted }]}>{pick(L.calNote, lg)}</Text>
          </Card>
        )}

        <SectionTitle>{pick(L.type, lg)}</SectionTitle>
        <Segmented<HacType>
          value={prog.type}
          options={HAC_TYPES.map((t) => ({ value: t.id, label: pick(t.title, lg) }))}
          onChange={(type) => setProg({ ...prog, type, at: stamp() })}
        />
        <Text style={T.small}>{pick(typeInfo.text, lg)}</Text>

        <View style={{ flexDirection: 'row', gap: 8 }}>
          {TOOLS.map((t) => (
            <Pressable key={t.to} onPress={() => router.push(t.to as never)} accessibilityRole="button"
              style={{ flex: 1, alignItems: 'center', gap: 6, paddingVertical: 12, borderRadius: 14, backgroundColor: C.surface }}>
              <Icon name={t.icon} size={20} color={C.accent} />
              <Text style={{ fontSize: fs(12), fontWeight: '700', color: C.ink, textAlign: 'center' }} numberOfLines={2}>{pick(t.label, lg)}</Text>
            </Pressable>
          ))}
        </View>

        <Card tint={count === steps.length ? C.openTint : undefined} style={{ gap: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={{ flex: 1, fontSize: fs(15), fontWeight: '700', color: C.ink }}>
              {pick(L.progress, lg).replace('{d}', String(count)).replace('{n}', String(steps.length))}
            </Text>
            {count > 0 && (
              <Pressable onPress={() => setProg({ ...prog, done: [], at: stamp() })} accessibilityRole="button" hitSlop={8}>
                <Text style={{ fontSize: fs(13), fontWeight: '700', color: C.accent }}>{pick(L.reset, lg)}</Text>
              </Pressable>
            )}
          </View>
          <View style={{ flexDirection: 'row', gap: 4 }}>
            {steps.map((x) => <View key={x.id} style={{ flex: 1, height: 6, borderRadius: 3, backgroundColor: prog.done.includes(x.id) ? C.open : C.border }} />)}
          </View>
          {count === steps.length && <Text style={[T.body, { color: C.open, fontWeight: '700' }]}>{pick(L.allDone, lg)}</Text>}
        </Card>

        {steps.map((step, i) => (
          <GuideStepCard key={step.id} step={step} n={i + 1} lg={lg} done={prog.done.includes(step.id)} open={open === step.id}
            badge={dateOf(step)} today={todayStep(curDh) === step.id}
            onToggleOpen={() => setOpen((o) => (o === step.id ? null : step.id))} onToggleDone={() => toggle(step.id)} />
        ))}

        <Collapse title={pick(L.pillars, lg)} icon="list" open={pillarsOpen} onToggle={() => setPillarsOpen((v) => !v)} tint={C.surface} />
        {pillarsOpen && (
          <View style={{ gap: 12 }}>
            {HAC_PILLARS.map((g) => (
              <View key={g.title.tr} style={{ gap: 4 }}>
                <Text style={T.h3}>{pick(g.title, lg)}</Text>
                {g.items.map((x) => <Text key={x.tr} style={T.body}>• {pick(x, lg)}</Text>)}
              </View>
            ))}
            <Text style={T.small}>{pick(HAC_NOTE, lg)}</Text>
          </View>
        )}

        <Collapse title={pick(L.rules, lg)} icon="alert" open={rulesOpen} onToggle={() => setRulesOpen((v) => !v)} tint={C.closedTint} color={C.closed} />
        {rulesOpen && (
          <View style={{ gap: 10 }}>
            {IHRAM_RULES.map((r, i) => (
              <View key={i} style={{ gap: 3, paddingBottom: 10, borderBottomWidth: 1, borderColor: C.border }}>
                <Text style={[T.body, { fontWeight: '600' }]}>{pick(r.rule, lg)}</Text>
                <Text style={[T.small, { color: C.closed }]}>{pick(r.penalty, lg)}</Text>
              </View>
            ))}
            <Text style={T.small}>{pick(RULES_NOTE, lg)}</Text>
          </View>
        )}

        <SectionTitle>{pick(L.sources, lg)}</SectionTitle>
        {HAC_SOURCES.map((s) => <Text key={s} style={T.small}>• {s}</Text>)}
        <Text style={[T.small, { marginTop: 4 }]}>{pick(L.checked, lg)}</Text>
      </ScrollView>
    </View>
  );
}

function Collapse({ title, icon, open, onToggle, tint, color = C.accent }: { title: string; icon: IconName; open: boolean; onToggle: () => void; tint: string; color?: string }) {
  return (
    <Pressable onPress={onToggle} accessibilityRole="button" accessibilityState={{ expanded: open }}
      style={{ flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderRadius: 16, backgroundColor: tint }}>
      <Icon name={icon} size={20} color={color} />
      <Text style={{ flex: 1, fontSize: fs(15), fontWeight: '700', color: C.ink }}>{title}</Text>
      <View style={{ transform: [{ rotate: open ? '90deg' : '0deg' }] }}><Icon name="chevron" size={16} color={C.muted} /></View>
    </Pressable>
  );
}
