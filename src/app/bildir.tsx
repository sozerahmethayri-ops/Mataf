import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, Image, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Icon } from '@/components/Icon';
import { Btn, Header, Segmented, SectionTitle, T } from '@/components/ui';
import { C } from '@/constants/theme';
import { GATES, dist, toLocal } from '@/data/sites';
import { pick, useI18n } from '@/i18n';
import type { Key } from '@/i18n/strings';
import { useApp } from '@/services/AppContext';
import { useLocation } from '@/services/location';
import type { Floor, GateStatus } from '@/services/reports';
import { useReports } from '@/services/ReportsContext';

const OPTIONS: { v: GateStatus; k: Key }[] = [
  { v: 'closed', k: 'status.closed' }, { v: 'crowded', k: 'status.crowded' }, { v: 'exitOnly', k: 'status.exitOnly' },
  { v: 'entryOnly', k: 'status.entryOnly' }, { v: 'women', k: 'status.women' }, { v: 'noAccess', k: 'status.noAccess' }, { v: 'open', k: 'status.open' },
];

export default function ReportScreen() {
  const params = useLocalSearchParams<{ gate?: string }>();
  const { t, lang } = useI18n();
  const { city } = useApp();
  const { add } = useReports();
  const { fix } = useLocation();
  const cityGates = GATES.filter((g) => g.city === city);
  const [gateId, setGateId] = useState(params.gate ?? cityGates[0].id);
  const [status, setStatus] = useState<GateStatus>('closed');
  const [floor, setFloor] = useState<Floor>('ground');
  const [comment, setComment] = useState('');
  const [photo, setPhoto] = useState<string>();
  const [busy, setBusy] = useState(false);
  const gate = GATES.find((g) => g.id === gateId) ?? cityGates[0];

  const d = fix ? Math.round(dist(toLocal(gate.city, fix.lat, fix.lng), gate.pos)) : null;
  const tooFar = d != null && d > 150;

  const pickPhoto = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.6 });
    if (!res.canceled) setPhoto(res.assets[0]?.uri);
  };

  const submit = async () => {
    if (tooFar) { Alert.alert(t('report.title'), t('report.tooFar', { m: d ?? 0 })); return; }
    setBusy(true);
    try {
      await add({ gateId: gate.id, kind: 'report', status, floor, comment: comment.trim() || undefined, photoUri: photo, lang, verified: d != null });
      Alert.alert(t('report.title'), t('report.sent'));
      router.back();
    } catch (e) {
      Alert.alert(t('report.title'), e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }} keyboardShouldPersistTaps="handled">
        <Header back title={t('report.title')} subtitle={t('report.subtitle')} />
        <SectionTitle>{t('report.gate')}</SectionTitle>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          {cityGates.map((g) => (
            <Pressable key={g.id} onPress={() => setGateId(g.id)} accessibilityRole="button" accessibilityState={{ selected: g.id === gateId }}
              style={{ paddingHorizontal: 12, height: 40, borderRadius: 20, justifyContent: 'center', borderWidth: g.id === gateId ? 2 : 1, borderColor: g.id === gateId ? C.accent : C.borderStrong, backgroundColor: g.id === gateId ? C.accentTint : C.bg }}>
              <Text style={{ fontWeight: '700', color: g.id === gateId ? C.accent : C.ink }}>{g.no} · {pick(g.name, lang)}</Text>
            </Pressable>
          ))}
        </ScrollView>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Icon name={d == null ? 'alert' : tooFar ? 'alert' : 'check'} size={16} color={d == null ? C.limited : tooFar ? C.closed : C.open} />
          <Text style={[T.small, { color: d == null ? C.limited : tooFar ? C.closed : C.open, fontWeight: '600' }]}>
            {d == null ? t('report.unverified') : tooFar ? t('report.tooFar', { m: d }) : t('report.verified', { m: d })}
          </Text>
        </View>

        <SectionTitle>{t('report.what')}</SectionTitle>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {OPTIONS.map((o) => {
            const on = o.v === status;
            return (
              <Pressable key={o.v} onPress={() => setStatus(o.v)} accessibilityRole="button" accessibilityState={{ selected: on }}
                style={{ width: '48%', height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 6, borderWidth: on ? 2 : 1, borderColor: on ? C.accent : C.borderStrong, backgroundColor: on ? C.accentTint : C.bg }}>
                {on && <Icon name="check" size={16} color={C.accent} width={2.6} />}
                <Text style={{ fontWeight: on ? '700' : '500', color: on ? C.accent : C.ink }}>{t(o.k)}</Text>
              </Pressable>
            );
          })}
        </View>

        <SectionTitle>{t('report.floor')}</SectionTitle>
        <Segmented<Floor> value={floor} onChange={setFloor} options={[
          { value: 'basement', label: t('floor.basement') }, { value: 'ground', label: t('floor.ground') },
          { value: 'first', label: t('floor.first') }, { value: 'roof', label: t('floor.roof') },
        ]} />

        <SectionTitle>{t('report.comment')}</SectionTitle>
        <TextInput value={comment} onChangeText={setComment} multiline placeholder={t('detail.write')} placeholderTextColor={C.muted}
          style={{ minHeight: 80, borderWidth: 1, borderColor: C.borderStrong, borderRadius: 14, padding: 12, fontSize: 14, color: C.ink, textAlignVertical: 'top' }} />
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Pressable onPress={pickPhoto} accessibilityRole="button"
            style={{ height: 44, paddingHorizontal: 14, borderRadius: 22, borderWidth: 1, borderStyle: 'dashed', borderColor: '#C9C6C0', flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Icon name="camera" size={18} />
            <Text style={{ fontWeight: '600' }}>{t('report.photo')}</Text>
          </Pressable>
          {photo ? <Image source={{ uri: photo }} style={{ width: 52, height: 52, borderRadius: 10 }} /> : <Text style={[T.small, { flex: 1 }]}>{t('report.photoNote')}</Text>}
        </View>

        <Btn title={t('report.send')} onPress={submit} disabled={busy} style={{ marginTop: 8 }} />
        <Text style={[T.small, { textAlign: 'center' }]}>{t('report.rule')}</Text>
      </ScrollView>
    </SafeAreaView>
  );
}
