import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Icon, type IconName } from '@/components/Icon';
import { IconBtn, StatusPill, T } from '@/components/ui';
import { C } from '@/constants/theme';
import { PLACES, type PlaceCat } from '@/data/content';
import { GATES, dist } from '@/data/sites';
import { pick, useI18n } from '@/i18n';
import type { Key } from '@/i18n/strings';
import { useApp } from '@/services/AppContext';
import { localPosition, useLocation } from '@/services/location';
import { useReports } from '@/services/ReportsContext';

const CATS: { id: PlaceCat; key: Key; icon: IconName; fg: string; bg: string }[] = [
  { id: 'gate', key: 'cat.gate', icon: 'gate', fg: C.open, bg: C.openTint },
  { id: 'zamzam', key: 'cat.zamzam', icon: 'water', fg: '#1D4ED8', bg: C.userTint },
  { id: 'wc', key: 'cat.wc', icon: 'wc', fg: '#334155', bg: '#F1F5F9' },
  { id: 'lift', key: 'cat.lift', icon: 'lift', fg: '#7C3AED', bg: '#F3EEFF' },
  { id: 'access', key: 'cat.access', icon: 'wheel', fg: '#0E7490', bg: '#E6F6FA' },
  { id: 'aid', key: 'cat.aid', icon: 'aid', fg: C.closed, bg: C.closedTint },
  { id: 'lost', key: 'cat.lost', icon: 'lost', fg: C.limited, bg: C.limitedTint },
  { id: 'meet', key: 'cat.meet', icon: 'pin', fg: C.accent, bg: C.accentTint },
];

export default function Search() {
  const { t, lang } = useI18n();
  const { city } = useApp();
  const { summaries } = useReports();
  const { fix } = useLocation();
  const { pos } = localPosition(city, fix);
  const [q, setQ] = useState('');
  const [cat, setCat] = useState<PlaceCat | null>(null);

  const items = useMemo(() => {
    const gates = GATES.filter((g) => g.city === city).map((g) => ({
      id: g.id, cat: 'gate' as PlaceCat, name: `${pick(g.name, lang)} · ${g.no}`, detail: pick(g.side, lang), pos: g.pos, gateId: g.id,
    }));
    const places = PLACES.filter((p) => p.city === city);
    const needle = q.toLocaleLowerCase(lang).trim();
    return [...gates, ...places]
      .filter((p) => !cat || p.cat === cat)
      .filter((p) => !needle || `${p.name} ${p.detail} ${t(CATS.find((c) => c.id === p.cat)!.key)}`.toLocaleLowerCase(lang).includes(needle))
      .map((p) => ({ ...p, m: Math.round(dist(p.pos, pos)) }))
      .sort((a, b) => a.m - b.m);
  }, [city, lang, q, cat, pos[0], pos[1], t]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, padding: 16, paddingBottom: 8 }}>
        <IconBtn name="back" label={t('common.back')} onPress={() => router.back()} />
        <View style={{ flex: 1, height: 48, borderRadius: 24, borderWidth: 2, borderColor: C.accent, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, gap: 8 }}>
          <Icon name="search" color={C.muted} size={18} />
          <TextInput autoFocus value={q} onChangeText={setQ} placeholder={t('search.placeholder')} placeholderTextColor={C.muted} style={{ flex: 1, fontSize: 15, color: C.ink }} />
          {q ? <Pressable onPress={() => setQ('')} accessibilityLabel="Temizle"><Icon name="close" size={16} color={C.muted} /></Pressable> : null}
        </View>
      </View>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32, gap: 14 }} keyboardShouldPersistTaps="handled">
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {CATS.map((c) => {
            const on = cat === c.id;
            return (
              <Pressable key={c.id} onPress={() => setCat(on ? null : c.id)} accessibilityRole="button" accessibilityState={{ selected: on }}
                style={{ width: '23%', minHeight: 78, borderRadius: 16, alignItems: 'center', justifyContent: 'center', gap: 6, padding: 6, borderWidth: on ? 2 : 1, borderColor: on ? c.fg : C.border, backgroundColor: on ? c.bg : C.bg }}>
                <View style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: c.bg, alignItems: 'center', justifyContent: 'center' }}><Icon name={c.icon} color={c.fg} /></View>
                <Text style={{ fontSize: 11, fontWeight: '600', textAlign: 'center', color: C.ink }}>{t(c.key)}</Text>
              </Pressable>
            );
          })}
        </View>
        <Text style={T.section}>{cat ? t(CATS.find((c) => c.id === cat)!.key) : q ? t('search.results') : t('search.nearby')}</Text>
        {items.length === 0 && <Text style={T.body}>{t('search.empty')}</Text>}
        {items.map((p) => {
          const c = CATS.find((x) => x.id === p.cat)!;
          return (
            <Pressable key={p.id} onPress={() => (p.gateId ? router.push({ pathname: '/kapi/[id]', params: { id: p.gateId } }) : router.push('/navigasyon'))}
              style={{ minHeight: 60, flexDirection: 'row', alignItems: 'center', gap: 12, borderBottomWidth: 1, borderBottomColor: '#F1EFEB' }}>
              <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: c.bg, alignItems: 'center', justifyContent: 'center' }}><Icon name={c.icon} color={c.fg} size={18} /></View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: C.ink }}>{p.name}</Text>
                <Text style={T.small}>{p.detail} · {p.m} m</Text>
              </View>
              {p.gateId ? <StatusPill status={summaries[p.gateId]?.status ?? 'open'} /> : null}
            </Pressable>
          );
        })}
        <Text style={T.small}>Hizmet noktaları örnek veridir; resmî kurum verisi gelince güncellenecek.</Text>
      </ScrollView>
    </SafeAreaView>
  );
}
