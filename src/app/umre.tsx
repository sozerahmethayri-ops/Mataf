// Umre adım adım rehberi: mîkattan tıraşa kadar her adımda yapılacaklar, dualar, sık hatalar ve cezaları.
// İlerleme cihazda saklanır; tavaf ve sa'y asistanları bitince ilgili adımı kendiliğinden işaretler.
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GuideStepCard } from '@/components/GuideStepCard';
import { Icon } from '@/components/Icon';
import { Card, IconBtn, SectionTitle, T } from '@/components/ui';
import { C, fs } from '@/constants/theme';
import { IHRAM_RULES, RULES_NOTE, SPECIAL_CASES, UMRE_STEPS, type T3 } from '@/data/umre';
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
          <GuideStepCard key={step.id} step={step} n={i + 1} lg={lg} done={prog.done.includes(step.id)} open={open === step.id}
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
