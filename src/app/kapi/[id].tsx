import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Linking, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Header, IconBtn, STATUS_TONE, T, ago } from '@/components/ui';
import { C } from '@/constants/theme';
import { GATES, dist } from '@/data/sites';
import { pick, useI18n } from '@/i18n';
import { useApp } from '@/services/AppContext';
import { useReports } from '@/services/ReportsContext';

const PALETTE = ['#C2410C', '#0F766E', '#1D4ED8', '#7C3AED']; // beyaz harfli avatarlar: her temada okunur

export default function GateDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t, lang } = useI18n();
  const { setCity } = useApp();
  const { summaries, reports, add, userId } = useReports();
  const [draft, setDraft] = useState('');
  const [follow, setFollow] = useState(true);
  const gate = GATES.find((g) => g.id === id);

  const comments = useMemo(
    () => reports.filter((r) => r.gateId === id && r.comment).sort((a, b) => b.createdAt - a.createdAt),
    [reports, id],
  );
  if (!gate) return <SafeAreaView style={{ flex: 1, padding: 16 }}><Header title="?" back /></SafeAreaView>;

  const s = summaries[gate.id];
  const status = s?.status ?? 'open';
  const tone = STATUS_TONE[status];
  const myVote = reports.filter((r) => r.gateId === gate.id && r.userId === userId && r.kind === 'report').sort((a, b) => b.createdAt - a.createdAt)[0]?.status;
  const alt = GATES.filter((g) => g.city === gate.city && g.id !== gate.id && summaries[g.id]?.status === 'open')
    .sort((a, b) => dist(a.pos, gate.pos) - dist(b.pos, gate.pos))[0];
  const official = reports.find((r) => r.gateId === gate.id && r.official);

  const send = async () => {
    const text = draft.trim();
    if (!text) return;
    setDraft('');
    await add({ gateId: gate.id, kind: 'comment', comment: text, lang });
  };
  const vote = (v: 'closed' | 'open') => add({ gateId: gate.id, kind: 'report', status: v, lang });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={['top', 'left', 'right', 'bottom']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={{ paddingHorizontal: 16 }}>
          <Header back title={pick(gate.name, lang)} subtitle={`${gate.no} · ${pick(gate.side, lang)}`}
            right={<IconBtn name="bell" label={t('detail.follow')} tint={follow ? C.accentTint : C.surface} color={follow ? C.accent : C.muted} onPress={() => setFollow((f) => !f)} />} />
        </View>
        <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }} keyboardShouldPersistTaps="handled">
          <View style={{ padding: 14, borderRadius: 18, backgroundColor: tone.bg, gap: 8 }}>
            <Text style={{ fontSize: 20, fontWeight: '700', color: tone.fg }}>{t(tone.key)}</Text>
            {official?.comment ? <Text style={T.muted}>{official.comment}</Text> : null}
            <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
              {s?.source === 'official' && <Tag text={t('detail.official')} />}
              <Tag text={t('gates.confirmations', { n: s?.confirmations ?? 0 })} />
              {s?.lastAt ? <Tag text={ago(s.lastAt, t)} /> : null}
            </View>
          </View>

          {status !== 'open' && alt && (
            <Pressable onPress={() => { setCity(alt.city); router.push('/navigasyon'); }}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 18, borderWidth: 1.5, borderColor: C.accentTint, backgroundColor: C.accentSoft }}>
              <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: C.accent, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ color: C.onAccent, fontWeight: '700' }}>{alt.no}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 12, fontWeight: '700', color: C.accent }}>{t('detail.nearestOpen')}</Text>
                <Text style={{ fontSize: 15, fontWeight: '700', color: C.ink }}>{pick(alt.name, lang)}</Text>
              </View>
              <Text style={{ color: C.accent, fontWeight: '700' }}>{t('detail.reroute')}</Text>
            </Pressable>
          )}

          <Text style={{ fontSize: 13, fontWeight: '700', color: C.ink }}>{myVote ? t('detail.thanks') : t('detail.question')}</Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {(['closed', 'open'] as const).map((v) => {
              const on = myVote === v;
              const col = v === 'closed' ? C.closed : C.open;
              return (
                <Pressable key={v} onPress={() => vote(v)} accessibilityRole="button" accessibilityState={{ selected: on }}
                  style={{ flex: 1, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center', borderWidth: on ? 2 : 1, borderColor: on ? col : C.borderStrong, backgroundColor: on ? (v === 'closed' ? C.closedTint : C.openTint) : C.bg }}>
                  <Text style={{ fontWeight: '700', color: on ? col : C.ink }}>{t(v === 'closed' ? 'detail.stillClosed' : 'detail.nowOpen')}</Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={[T.h2, { marginTop: 4 }]}>{t('detail.comments')} <Text style={T.muted}>· {comments.length}</Text></Text>
          {comments.map((c, i) => (
            <View key={c.id} style={{ flexDirection: 'row', gap: 10, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: C.border }}>
              <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: PALETTE[i % PALETTE.length], alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ color: '#FFFFFF', fontWeight: '700' }}>{c.userName.charAt(0)}</Text>
              </View>
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={T.small}>
                  <Text style={{ color: C.ink, fontWeight: '700' }}>{c.userId === userId ? 'Siz' : c.userName}</Text>
                  {c.country ? ` · ${c.country}` : ''} · {ago(c.createdAt, t)}{c.official ? ` · ${t('detail.official')}` : ''}
                </Text>
                <Text style={T.body}>{c.comment}</Text>
                <View style={{ flexDirection: 'row', gap: 16 }}>
                  {c.lang && c.lang !== lang && (
                    <Pressable onPress={() => Linking.openURL(`https://translate.google.com/?sl=auto&tl=${lang}&text=${encodeURIComponent(c.comment ?? '')}`)}>
                      <Text style={{ fontSize: 12, fontWeight: '700', color: C.user }}>{t('detail.translate')} ↗</Text>
                    </Pressable>
                  )}
                  <Text style={{ fontSize: 12, fontWeight: '600', color: C.muted }}>{t('detail.flag')}</Text>
                </View>
              </View>
            </View>
          ))}
        </ScrollView>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderTopWidth: 1, borderTopColor: C.border }}>
          <IconBtn name="camera" label={t('report.photo')} onPress={() => router.push({ pathname: '/bildir', params: { gate: gate.id } })} />
          <TextInput value={draft} onChangeText={setDraft} placeholder={t('detail.write')} placeholderTextColor={C.muted} onSubmitEditing={send} returnKeyType="send"
            style={{ flex: 1, height: 44, borderWidth: 1, borderColor: C.borderStrong, borderRadius: 22, paddingHorizontal: 16, fontSize: 14, color: C.ink }} />
          <IconBtn name="send" label="Gönder" tint={C.accent} color="#FFFFFF" onPress={send} />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Tag({ text }: { text: string }) {
  return <View style={{ paddingHorizontal: 9, paddingVertical: 4, borderRadius: 10, backgroundColor: C.bg }}><Text style={{ fontSize: 11, fontWeight: '700', color: C.ink }}>{text}</Text></View>;
}

