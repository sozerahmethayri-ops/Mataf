import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { Icon } from '@/components/Icon';
import { Btn, Chip, Header, Screen, STATUS_TONE, Segmented, StatusPill, T, ago } from '@/components/ui';
import { C, fs } from '@/constants/theme';
import { GATES } from '@/data/sites';
import { pick, useI18n } from '@/i18n';
import { useApp } from '@/services/AppContext';
import { useReports } from '@/services/ReportsContext';

type Filter = 'all' | 'closed' | 'limited' | 'open';

export default function GatesScreen() {
  const { t, lang } = useI18n();
  const { city, setCity } = useApp();
  const { summaries, reports } = useReports();
  const [filter, setFilter] = useState<Filter>('all');

  const gates = GATES.filter((g) => g.city === city);
  const group = (id: string): Filter => {
    const s = summaries[id]?.status ?? 'open';
    return s === 'open' ? 'open' : s === 'closed' ? 'closed' : 'limited';
  };
  const order: Record<Filter, number> = { closed: 0, limited: 1, open: 2, all: 3 };
  const list = gates.filter((g) => filter === 'all' || group(g.id) === filter).sort((a, b) => order[group(a.id)] - order[group(b.id)]);
  const count = (f: Filter) => (f === 'all' ? gates.length : gates.filter((g) => group(g.id) === f).length);

  return (
    <Screen>
      <Header back title={t('gates.title')} right={<Pressable onPress={() => router.push('/veriler')} accessibilityRole="button"><Icon name="data" color={C.muted} /></Pressable>} />
      <Pressable onPress={() => router.push('/veriler')} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: C.open }} />
        <Text style={T.muted}>{t('gates.live')}</Text>
      </Pressable>
      <Segmented value={city} onChange={setCity} options={[{ value: 'makkah', label: t('city.makkah') }, { value: 'madinah', label: t('city.madinah') }]} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
        {(['all', 'closed', 'limited', 'open'] as Filter[]).map((f) => (
          <Chip key={f} label={`${t(f === 'all' ? 'gates.all' : f === 'closed' ? 'gates.closed' : f === 'limited' ? 'gates.limited' : 'gates.open')} ${count(f)}`} active={filter === f} onPress={() => setFilter(f)} />
        ))}
      </ScrollView>
      {list.map((g) => {
        const s = summaries[g.id];
        const tone = STATUS_TONE[s?.status ?? 'open'];
        const last = reports.filter((r) => r.gateId === g.id && r.comment).sort((a, b) => b.createdAt - a.createdAt)[0];
        return (
          <Pressable key={g.id} onPress={() => router.push({ pathname: '/kapi/[id]', params: { id: g.id } })} accessibilityRole="button"
            style={({ pressed }) => [{ borderWidth: 1, borderColor: C.border, borderRadius: 18, padding: 14, gap: 10, opacity: pressed ? 0.8 : 1 }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: tone.bg, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: fs(15), fontWeight: '700', color: tone.fg }}>{g.no}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: fs(16), fontWeight: '700', color: C.ink }}>{pick(g.name, lang)}</Text>
                <Text style={T.small}>{pick(g.side, lang)}</Text>
              </View>
              <StatusPill status={s?.status ?? 'open'} />
            </View>
            {last?.comment ? <Text style={T.body} numberOfLines={2}>{last.comment}</Text> : null}
            <Text style={T.small}>
              {s?.source === 'official' ? `${t('detail.official')} · ` : ''}
              {t('gates.confirmations', { n: s?.confirmations ?? 0 })}{s?.lastAt ? ` · ${ago(s.lastAt, t)}` : ''}
            </Text>
          </Pressable>
        );
      })}
      <Btn title={t('map.report')} icon="plus" onPress={() => router.push('/bildir')} />
    </Screen>
  );
}
