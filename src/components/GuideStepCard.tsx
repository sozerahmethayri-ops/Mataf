// Rehber adımı kartı (umre ve hac rehberleri): başlık, özet, vurgulu kutu, yapılacaklar, eylem düğmesi,
// dualar, sık hatalar ve dayanak. Açılır-kapanır; "tamamladım" ile işaretlenir.
import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import { DuaBlock } from '@/components/DuaBlock';
import { Icon, type IconName } from '@/components/Icon';
import { Btn, Card, SectionTitle, T } from '@/components/ui';
import { C, fs } from '@/constants/theme';
import type { DuaText } from '@/data/tawaf';
import type { T3 } from '@/data/umre';
import { pick } from '@/i18n';
import { resolveTabPath } from '@/services/tabs';
import { useTheme } from '@/services/ThemeContext';

type Lang = 'tr' | 'en' | 'ar';

export type GuideStep = {
  id: string;
  icon: IconName;
  title: T3;
  summary: T3;
  todo: T3[];
  duas?: DuaText[];
  mistakes?: { text: T3; penalty?: T3 }[];
  action?: { label: T3; to: string; icon: IconName };
  callout?: { title: T3; text: T3; note?: T3 };
  src?: string[];
};

const L = {
  todo: { tr: 'Yapılacaklar', en: 'What to do', ar: 'ما تفعله' },
  duas: { tr: 'Dualar', en: 'Du‘as', ar: 'الأدعية' },
  care: { tr: 'Dikkat: sık yapılan hatalar', en: 'Common mistakes', ar: 'أخطاء شائعة' },
  doneBtn: { tr: 'Bu adımı tamamladım', en: 'I’ve done this step', ar: 'أتممت هذه الخطوة' },
  undo: { tr: 'Tamamlandı · geri al', en: 'Done · undo', ar: 'تم · تراجع' },
  src: { tr: 'Dayanak', en: 'Source', ar: 'المصدر' },
  today: { tr: 'Bugün', en: 'Today', ar: 'اليوم' },
} satisfies Record<string, T3>;

export function GuideStepCard({ step, n, lg, done, open, onToggleOpen, onToggleDone, badge, today }: {
  step: GuideStep; n: number; lg: Lang; done: boolean; open: boolean; onToggleOpen: () => void; onToggleDone: () => void;
  /** Başlığın üstünde küçük etiket (ör. tarih) */
  badge?: string;
  /** Bugünün adımı: vurgulu kenar ve "Bugün" etiketi */
  today?: boolean;
}) {
  const { prefs: theme } = useTheme();
  const edge = open || today ? C.accent : C.border;
  return (
    <View style={{ borderRadius: 18, borderWidth: open || today ? 1.5 : 1, borderColor: edge, overflow: 'hidden' }}>
      <Pressable onPress={onToggleOpen} accessibilityRole="button" accessibilityState={{ expanded: open }}
        style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, backgroundColor: done ? C.openTint : today ? C.accentSoft : C.bg }}>
        <View style={{ width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: done ? C.open : C.accentTint }}>
          {done ? <Icon name="check" size={17} color="#FFFFFF" width={3} /> : <Text style={{ fontSize: fs(14), fontWeight: '800', color: C.accent }}>{n}</Text>}
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          {(badge || today) && (
            <Text style={{ fontSize: fs(11.5), fontWeight: '800', color: C.accent, letterSpacing: 0.3 }} numberOfLines={1}>
              {today ? `${pick(L.today, lg).toLocaleUpperCase(lg)}${badge ? ' · ' : ''}` : ''}{badge ?? ''}
            </Text>
          )}
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
          {step.action && <Btn title={pick(step.action.label, lg)} icon={step.action.icon} onPress={() => router.push(resolveTabPath(step.action!.to, theme.tabs) as never)} />}
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
          {step.src && step.src.length > 0 && (
            <Text style={[T.small, { color: C.muted }]}>{pick(L.src, lg)}: {step.src.join(' · ')}</Text>
          )}
          <Btn title={pick(done ? L.undo : L.doneBtn, lg)} kind={done ? 'secondary' : 'green'} icon={done ? undefined : 'check'} onPress={onToggleDone} />
        </View>
      )}
    </View>
  );
}
