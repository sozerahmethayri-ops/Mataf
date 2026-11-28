import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';

import { Icon } from '@/components/Icon';
import { Btn, Chip, Header, Screen, STATUS_TONE, Segmented, StatusPill, T, ago } from '@/components/ui';
import { C, fs } from '@/constants/theme';
import { GATES, sideIndex, sideName, type ML } from '@/data/sites';
import { pick, useI18n } from '@/i18n';
import { useApp } from '@/services/AppContext';
import { useReports } from '@/services/ReportsContext';
import { SUPABASE_CONFIGURED } from '@/services/supabase';

type Filter = 'all' | 'closed' | 'limited' | 'open';

const L = {
  search: { tr: 'Kapı numarası ya da adı', en: 'Gate number or name', ar: 'رقم الباب أو اسمه' },
  others: { tr: 'Diğer kapılar', en: 'Other gates', ar: 'الأبواب الأخرى' },
  count: { tr: '{n} kapı', en: '{n} gates', ar: '{n} باب' },
  women: { tr: 'kadın', en: 'women', ar: 'نساء' },
  note: {
    tr: 'Ana kapıların numaraları Genel Kurum’un duyurusundan, diğerleri OpenStreetMap’teki tabela kayıtlarından. Numara tabelayla uyuşmazsa tabelayı esas alın.',
    en: 'Main gate numbers follow the General Authority’s announcements; the others come from signage recorded on OpenStreetMap. If a number differs from the sign, follow the sign.',
    ar: 'أرقام الأبواب الرئيسية من إعلانات الهيئة العامة، والبقية من اللوحات المسجلة في خريطة الشارع المفتوحة. إذا اختلف الرقم عن اللوحة فاعتمد اللوحة.',
  },
} satisfies Record<string, ML>;

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
  const [q, setQ] = useState('');
  const needle = q.trim().toLocaleLowerCase(lang);
  const hit = (g: (typeof gates)[number]) => !needle || g.no.split('–').some((n) => n === needle || n.startsWith(needle)) || pick(g.name, lang).toLocaleLowerCase(lang).includes(needle);
  const list = gates.filter((g) => (filter === 'all' || group(g.id) === filter) && hit(g)).sort((a, b) => order[group(a.id)] - order[group(b.id)]);
  const mains = list.filter((g) => g.main);
  // Diğer kapılar yöne göre (kuzeyden saat yönünde) ve numara sırasıyla
  const bySide = Array.from({ length: 8 }, (_, i) => list.filter((g) => !g.main && sideIndex(g.city, g.pos) === i).sort((a, b) => parseInt(a.no, 10) - parseInt(b.no, 10)))
    .map((gs, i) => ({ i, gs })).filter((x) => x.gs.length);
  const count = (f: Filter) => (f === 'all' ? gates.length : gates.filter((g) => group(g.id) === f).length);

  return (
    <Screen>
      <Header back title={t('gates.title')} right={<Pressable onPress={() => router.push('/veriler')} accessibilityRole="button"><Icon name="data" color={C.muted} /></Pressable>} />
      {/* "Canlı" yalnız sunucu bağlıyken; yoksa bildirimler bu telefonda kalır (yerel demo) */}
      <Pressable onPress={() => router.push('/veriler')} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: SUPABASE_CONFIGURED ? C.open : C.muted }} />
        <Text style={T.muted}>{t(SUPABASE_CONFIGURED ? 'gates.live' : 'settings.backendLocal')}</Text>
      </Pressable>
      <Segmented value={city} onChange={setCity} options={[{ value: 'makkah', label: t('city.makkah') }, { value: 'madinah', label: t('city.madinah') }]} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
        {(['all', 'closed', 'limited', 'open'] as Filter[]).map((f) => (
          <Chip key={f} label={`${t(f === 'all' ? 'gates.all' : f === 'closed' ? 'gates.closed' : f === 'limited' ? 'gates.limited' : 'gates.open')} ${count(f)}`} active={filter === f} onPress={() => setFilter(f)} />
        ))}
      </ScrollView>
      <TextInput value={q} onChangeText={setQ} placeholder={pick(L.search, lang)} placeholderTextColor={C.muted} keyboardType="default"
        style={{ height: 44, borderRadius: 22, backgroundColor: C.surface, paddingHorizontal: 16, fontSize: fs(15), color: C.ink }} />
      {mains.map((g) => {
        const s = summaries[g.id];
        const tone = STATUS_TONE[s?.status ?? 'open'];
        const last = reports.filter((r) => r.gateId === g.id && r.comment).sort((a, b) => b.createdAt - a.createdAt)[0];
        // Alt satır: resmî kaynak, onay sayısı, son bildirim; hiçbiri yoksa satır çizilmez ("0 onay" yazmaz)
        const meta = [s?.source === 'official' ? t('detail.official') : '', s?.confirmations ? t('gates.confirmations', { n: s.confirmations }) : '', s?.lastAt ? ago(s.lastAt, t) : ''].filter(Boolean).join(' · ');
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
            {meta ? <Text style={T.small}>{meta}</Text> : null}
          </Pressable>
        );
      })}
      {bySide.length > 0 && <Text style={[T.section, { marginTop: 6 }]}>{pick(L.others, lang)}</Text>}
      {bySide.map(({ i, gs }) => (
        <View key={i} style={{ gap: 8 }}>
          <Text style={T.small}>{pick(sideName(i), lang)} · {pick(L.count, lang).replace('{n}', String(gs.length))}</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {gs.map((g) => {
              const tone = STATUS_TONE[summaries[g.id]?.status ?? 'open'];
              return (
                <Pressable key={g.id} onPress={() => router.push({ pathname: '/kapi/[id]', params: { id: g.id } })} accessibilityRole="button"
                  accessibilityLabel={`${pick(g.name, lang)}, ${pick(g.side, lang)}`}
                  style={({ pressed }) => ({ minWidth: 58, minHeight: 48, paddingHorizontal: 8, borderRadius: 12, backgroundColor: tone.bg, alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.8 : 1 })}>
                  <Text style={{ fontSize: fs(15), fontWeight: '700', color: tone.fg }}>{g.no}</Text>
                  {g.women ? <Text style={{ fontSize: fs(10), color: tone.fg }}>{pick(L.women, lang)}</Text> : null}
                </Pressable>
              );
            })}
          </View>
        </View>
      ))}
      <Text style={T.small}>{pick(L.note, lang)}</Text>
      <Btn title={t('map.report')} icon="plus" onPress={() => router.push('/bildir')} />
    </Screen>
  );
}
