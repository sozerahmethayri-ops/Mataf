// Umre adım adım rehberi: mîkattan tıraşa kadar her adımda yapılacaklar, dualar, sık hatalar ve cezaları.
// İlerleme cihazda saklanır; tavaf ve sa'y asistanları bitince ilgili adımı kendiliğinden işaretler.
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DuaBlock } from '@/components/DuaBlock';
import { Icon } from '@/components/Icon';
import { Btn, Card, IconBtn, SectionTitle, T } from '@/components/ui';
import { C, fs } from '@/constants/theme';
import { IHRAM_RULES, RULES_NOTE, SPECIAL_CASES, UMRE_STEPS, type T3, type UmreStep } from '@/data/umre';
import { pick, useI18n } from '@/i18n';
import { readUmre, writeUmre, type UmreProgress } from '@/services/umreProgress';

type Lang = 'tr' | 'en' | 'ar';
const stamp = () => Date.now();
const L = {
  title: { tr: 'Umre rehberi', en: 'Umrah guide', ar: 'دليل العمرة' },
  sub: { tr: 'Diyanet Hac ve Umre İlmihali (Hanefî) özeti', en: 'Summary of the Hanafi rulings (Diyanet)', ar: 'ملخص وفق المذهب الحنفي' },
  my: { tr: 'Umrem', en: 'My umrah', ar: 'عمرتي' },
  steps: { tr: 'adım tamamlandı', en: 'steps done', ar: 'خطوات مكتملة' },
  reset: { tr: 'Yeni umre', en: 'New umrah', ar: 'عمرة جديدة' },
  todo: { tr: 'Yapılacaklar', en: 'What to do', ar: 'ما تفعله' },
  duas: { tr: 'Dualar', en: 'Du‘as', ar: 'الأدعية' },
  care: { tr: 'Dikkat: sık yapılan hatalar', en: 'Common mistakes', ar: 'أخطاء شائعة' },
  doneBtn: { tr: 'Bu adımı tamamladım', en: 'I’ve done this step', ar: 'أتممت هذه الخطوة' },
  undo: { tr: 'Tamamlandı · geri al', en: 'Done · undo', ar: 'تم · تراجع' },
  rules: { tr: 'İhram yasakları ve cezaları', en: 'Ihram restrictions and penalties', ar: 'محظورات الإحرام وكفاراتها' },
  special: { tr: 'Özel durumlar', en: 'Special cases', ar: 'حالات خاصة' },
  allDone: { tr: 'Umreniz tamamlandı. Allah kabul etsin!', en: 'Your umrah is complete. May Allah accept it!', ar: 'تمّت عمرتك، تقبّل الله منك!' },
  source: { tr: 'Kaynak: Diyanet İşleri Başkanlığı, Hac ve Umre İlmihali (Hanefî). Hadis numaraları sunnah.com’a göre. Kendi durumunuz için kafilenizdeki din görevlisine danışın.', en: 'Source: Diyanet, Hajj and Umrah manual (Hanafi). Hadith numbers per sunnah.com. Ask a scholar about your own situation.', ar: 'المصدر: رئاسة الشؤون الدينية التركية، دليل الحج والعمرة (حنفي).' },
} satisfies Record<string, T3>;

export default function UmreScreen() {
  const { lang } = useI18n();
  const lg = lang as Lang;
  const insets = useSafeAreaInsets();
  const [prog, setProg] = useState<UmreProgress>({ done: [], at: 0 });
  const [open, setOpen] = useState<string | null>(null);
  const [rulesOpen, setRulesOpen] = useState(false);

  // Ekran her öne geldiğinde ilerlemeyi oku (tavaf/sa'y ekranları adım işaretlemiş olabilir)
  useFocusEffect(useCallback(() => {
    let alive = true;
    readUmre().then((p) => {
      if (!alive) return;
      setProg(p);
      setOpen((o) => o ?? UMRE_STEPS.find((x) => !p.done.includes(x.id))?.id ?? null);
    }).catch(() => undefined);
    return () => { alive = false; };
  }, []));

  const save = (p: UmreProgress) => { setProg(p); writeUmre(p).catch(() => undefined); };
  const toggle = (id: string) => {
    const done = prog.done.includes(id) ? prog.done.filter((x) => x !== id) : [...prog.done, id];
    save({ done, at: stamp() });
    if (!prog.done.includes(id)) {
      // Sıradaki tamamlanmamış adımı aç
      const nextStep = UMRE_STEPS.find((x) => !done.includes(x.id));
      setOpen(nextStep?.id ?? null);
    }
  };
  const count = UMRE_STEPS.filter((x) => prog.done.includes(x.id)).length;

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
        <Card tint={count === UMRE_STEPS.length ? C.openTint : C.accentSoft} style={{ gap: 10 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Text style={{ flex: 1, fontSize: fs(16), fontWeight: '700', color: C.ink }}>
              {pick(L.my, lg)} · {count}/{UMRE_STEPS.length} {pick(L.steps, lg)}
            </Text>
            {count > 0 && (
              <Pressable onPress={() => { save({ done: [], at: stamp() }); setOpen(UMRE_STEPS[0].id); }} accessibilityRole="button" hitSlop={8}>
                <Text style={{ fontSize: fs(13), fontWeight: '700', color: C.accent }}>{pick(L.reset, lg)}</Text>
              </Pressable>
            )}
          </View>
          <View style={{ flexDirection: 'row', gap: 4 }}>
            {UMRE_STEPS.map((x) => (
              <View key={x.id} style={{ flex: 1, height: 6, borderRadius: 3, backgroundColor: prog.done.includes(x.id) ? C.open : C.border }} />
            ))}
          </View>
          {count === UMRE_STEPS.length && <Text style={[T.body, { color: C.open, fontWeight: '700' }]}>{pick(L.allDone, lg)}</Text>}
        </Card>

        {UMRE_STEPS.map((step, i) => (
          <StepCard key={step.id} step={step} n={i + 1} lg={lg} done={prog.done.includes(step.id)} open={open === step.id}
            onToggleOpen={() => setOpen((o) => (o === step.id ? null : step.id))} onToggleDone={() => toggle(step.id)} />
        ))}

        <Pressable onPress={() => setRulesOpen((v) => !v)} accessibilityRole="button" accessibilityState={{ expanded: rulesOpen }}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderRadius: 16, backgroundColor: C.closedTint }}>
          <Icon name="alert" size={20} color={C.closed} />
          <Text style={{ flex: 1, fontSize: fs(15), fontWeight: '700', color: C.ink }}>{pick(L.rules, lg)}</Text>
          <View style={{ transform: [{ rotate: rulesOpen ? '90deg' : '0deg' }] }}><Icon name="chevron" size={16} color={C.muted} /></View>
        </Pressable>
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

        <SectionTitle>{pick(L.special, lg)}</SectionTitle>
        {SPECIAL_CASES.map((c) => (
          <View key={c.title.tr} style={{ gap: 2 }}>
            <Text style={T.h3}>{pick(c.title, lg)}</Text>
            <Text style={T.body}>{pick(c.text, lg)}</Text>
          </View>
        ))}
        <Text style={[T.small, { marginTop: 6 }]}>{pick(L.source, lg)}</Text>
      </ScrollView>
    </View>
  );
}

function StepCard({ step, n, lg, done, open, onToggleOpen, onToggleDone }: {
  step: UmreStep; n: number; lg: Lang; done: boolean; open: boolean; onToggleOpen: () => void; onToggleDone: () => void;
}) {
  return (
    <View style={{ borderRadius: 18, borderWidth: open ? 1.5 : 1, borderColor: open ? C.accent : C.border, overflow: 'hidden' }}>
      <Pressable onPress={onToggleOpen} accessibilityRole="button" accessibilityState={{ expanded: open }}
        style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, backgroundColor: done ? C.openTint : C.bg }}>
        <View style={{ width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: done ? C.open : C.accentTint }}>
          {done ? <Icon name="check" size={17} color="#FFFFFF" width={3} /> : <Text style={{ fontSize: fs(14), fontWeight: '800', color: C.accent }}>{n}</Text>}
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={{ fontSize: fs(15.5), fontWeight: '700', color: C.ink }}>{pick(step.title, lg)}</Text>
          {!open && <Text style={T.small} numberOfLines={2}>{pick(step.summary, lg)}</Text>}
        </View>
        <Icon name={step.icon} size={20} color={done ? C.open : C.muted} />
      </Pressable>
      {open && (
        <View style={{ padding: 14, paddingTop: 4, gap: 12 }}>
          <Text style={T.body}>{pick(step.summary, lg)}</Text>
          {step.callout && (
            <Card tint={C.accentSoft} style={{ gap: 6 }}>
              <Text style={[T.small, { color: C.accent, fontWeight: '700' }]}>{pick(step.callout.title, lg)}</Text>
              <Text style={T.body}>{pick(step.callout.text, lg)}</Text>
              {step.callout.note && <Text style={T.small}>{pick(step.callout.note, lg)}</Text>}
            </Card>
          )}
          <SectionTitle>{pick(L.todo, lg)}</SectionTitle>
          {step.todo.map((x, i) => (
            <View key={i} style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: C.accent, marginTop: 8 }} />
              <Text style={[T.body, { flex: 1 }]}>{pick(x, lg)}</Text>
            </View>
          ))}
          {step.action && <Btn title={pick(step.action.label, lg)} icon={step.action.icon} onPress={() => router.push(step.action!.to as never)} />}
          {step.duas && step.duas.length > 0 && (
            <>
              <SectionTitle>{pick(L.duas, lg)}</SectionTitle>
              {step.duas.map((d) => <DuaBlock key={d.id} d={d} compact />)}
            </>
          )}
          {step.mistakes && step.mistakes.length > 0 && (
            <>
              <SectionTitle>{pick(L.care, lg)}</SectionTitle>
              {step.mistakes.map((m, i) => (
                <View key={i} style={{ flexDirection: 'row', gap: 10 }}>
                  <Icon name="alert" size={16} color={C.closed} />
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={[T.body, { fontWeight: '600' }]}>{pick(m.text, lg)}</Text>
                    {m.penalty && <Text style={T.small}>{pick(m.penalty, lg)}</Text>}
                  </View>
                </View>
              ))}
            </>
          )}
          <Btn title={pick(done ? L.undo : L.doneBtn, lg)} kind={done ? 'secondary' : 'green'} icon={done ? undefined : 'check'} onPress={onToggleDone} />
        </View>
      )}
    </View>
  );
}
