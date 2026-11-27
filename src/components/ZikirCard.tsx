// Ana sayfa: bugünkü zikir ve günlük hedef. Hedef Zikirmatik'ten seçilir (0 = kapalı); hiç zikir yapılmadıysa çizilmez.
// Zikir kayıtları ekran öne gelince yeniden okunur (Zikirmatik'ten dönünce güncel olsun).
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { C, fs } from '@/constants/theme';
import { pick } from '@/i18n';
import { sharedPersisted } from '@/services/sharedPersisted';
import { zikirToday, type ZikirLogItem } from '@/services/zikirStats';
import { Icon } from './Icon';

type Lang = 'tr' | 'en' | 'ar';
/** Günlük zikir hedefi (0 = kapalı) */
export const ZIKIR_GOALS = [0, 100, 300, 1000] as const;
export const useZikirGoal = sharedPersisted<number>('zikir:goal', 100, (raw) => (typeof raw === 'number' && raw >= 0 && raw <= 100000 ? Math.round(raw) : 100));

const L = {
  title: { tr: 'Bugünkü zikir', en: 'Today’s dhikr', ar: 'ذكر اليوم' },
  done: { tr: 'Günlük hedef tamam', en: 'Daily goal reached', ar: 'بلغت هدف اليوم' },
  go: { tr: 'Zikre devam', en: 'Continue dhikr', ar: 'متابعة الذكر' },
};

export function ZikirCard({ lg }: { lg: Lang }) {
  const [goal] = useZikirGoal();
  const [today, setToday] = useState<number | null>(null);
  const [used, setUsed] = useState(false);
  useFocusEffect(
    useCallback(() => {
      let alive = true;
      AsyncStorage.multiGet(['zikir:log', 'zikir:state'])
        .then((pairs) => {
          if (!alive) return;
          let items: ZikirLogItem[] = [];
          let counts: Record<string, number> = {};
          try { items = (JSON.parse(pairs[0]?.[1] ?? '{}') as { items?: ZikirLogItem[] }).items ?? []; } catch { /* bozuk kayıt */ }
          try { counts = (JSON.parse(pairs[1]?.[1] ?? '{}') as { counts?: Record<string, number> }).counts ?? {}; } catch { /* bozuk kayıt */ }
          const n = zikirToday(items, counts, new Date());
          setToday(n);
          setUsed(items.length > 0 || n > 0);
        })
        .catch(() => undefined);
      return () => {
        alive = false;
      };
    }, []),
  );
  if (!goal || !used || today == null) return null;
  const pct = Math.min(100, Math.round((today / goal) * 100));
  return (
    <Pressable onPress={() => router.push('/zikir')} accessibilityRole="button"
      style={({ pressed }) => ({ borderWidth: 1, borderColor: C.border, borderRadius: 18, padding: 14, gap: 8, opacity: pressed ? 0.8 : 1 })}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Icon name="beads" size={18} color={C.accent} />
        <Text style={{ flex: 1, fontSize: fs(15), fontWeight: '700', color: C.ink }}>{pick(L.title, lg)}</Text>
        <Text style={{ fontSize: fs(14), fontWeight: '700', color: today >= goal ? C.accent : C.muted, fontVariant: ['tabular-nums'] }}>
          {today.toLocaleString(lg)} / {goal.toLocaleString(lg)}
        </Text>
      </View>
      <View style={{ height: 6, borderRadius: 3, backgroundColor: C.surface, overflow: 'hidden' }}>
        <View style={{ width: `${Math.max(1, pct)}%`, height: 6, backgroundColor: C.accent }} />
      </View>
      <Text style={{ fontSize: fs(13.5), fontWeight: '700', color: C.accent }}>{today >= goal ? pick(L.done, lg) : `${pick(L.go, lg)} ›`}</Text>
    </Pressable>
  );
}
