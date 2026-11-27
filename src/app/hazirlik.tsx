// Hac ve umre hazırlık listesi: yolculuktan önce işaretlenir; işaretler yalnız bu telefonda (trip:checklist).
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { CheckDot } from '@/components/PrayerLogCard';
import { Btn, Header, Screen, SectionTitle, T } from '@/components/ui';
import { C, fs } from '@/constants/theme';
import { CHECKLIST, CHECK_TOTAL } from '@/data/checklist';
import { pick, useI18n } from '@/i18n';
import { sharedPersisted } from '@/services/sharedPersisted';

type Lang = 'tr' | 'en' | 'ar';
const useChecks = sharedPersisted<Record<string, boolean>>('trip:checklist', {}, (raw) => {
  const out: Record<string, boolean> = {};
  if (raw && typeof raw === 'object') for (const [k, v] of Object.entries(raw as Record<string, unknown>)) if (v === true) out[k] = true;
  return out;
});

const L = {
  title: { tr: 'Hazırlık listesi', en: 'Packing list', ar: 'قائمة التجهيز' },
  sub: { tr: 'Hac ve umre yolculuğundan önce', en: 'Before your Hajj or Umrah trip', ar: 'قبل رحلة الحج أو العمرة' },
  ready: { tr: '{n} / {t} hazır', en: '{n} of {t} ready', ar: '{n} من {t} جاهز' },
  open: { tr: 'Aç', en: 'Open', ar: 'فتح' },
  reset: { tr: 'İşaretleri temizle', en: 'Clear all ticks', ar: 'مسح العلامات' },
  sure: { tr: 'Bütün işaretler kalksın mı?', en: 'Clear every tick?', ar: 'مسح كل العلامات؟' },
  yes: { tr: 'Temizle', en: 'Clear', ar: 'مسح' },
  no: { tr: 'Vazgeç', en: 'Cancel', ar: 'إلغاء' },
  note: { tr: 'İhram yasakları ve adımlar Umre ve Hac rehberindedir.', en: 'Ihram rules and the steps are in the Umrah and Hajj guides.', ar: 'محظورات الإحرام والخطوات في دليلي العمرة والحج.' },
};

export default function Hazirlik() {
  const { lang } = useI18n();
  const lg = lang as Lang;
  const [checks, setChecks] = useChecks();
  const [confirm, setConfirm] = useState(false);
  const key = (g: string, i: string) => `${g}.${i}`;
  const done = CHECKLIST.reduce((n, g) => n + g.items.filter((it) => checks[key(g.id, it.id)]).length, 0);
  const flip = (k: string) => setChecks((c) => {
    const next = { ...c };
    if (next[k]) delete next[k];
    else next[k] = true;
    return next;
  });
  const pct = Math.round((done / CHECK_TOTAL) * 100);
  return (
    <Screen>
      <Header back title={pick(L.title, lg)} subtitle={pick(L.sub, lg)} />
      <View style={{ gap: 6 }}>
        <Text style={{ fontSize: fs(15), fontWeight: '700', color: done === CHECK_TOTAL ? C.accent : C.ink }}>
          {pick(L.ready, lg).replace('{n}', String(done)).replace('{t}', String(CHECK_TOTAL))}
        </Text>
        <View style={{ height: 8, borderRadius: 4, backgroundColor: C.surface, overflow: 'hidden' }}>
          <View style={{ width: `${Math.max(1, pct)}%`, height: 8, backgroundColor: C.accent }} />
        </View>
      </View>
      {CHECKLIST.map((g) => (
        <View key={g.id} style={{ gap: 8 }}>
          <SectionTitle>{pick(g.title, lg)}</SectionTitle>
          <View style={{ borderWidth: 1, borderColor: C.border, borderRadius: 18, paddingHorizontal: 14 }}>
            {g.items.map((it, i) => {
              const k = key(g.id, it.id);
              const on = !!checks[k];
              return (
                <View key={k} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, borderTopWidth: i ? 1 : 0, borderTopColor: C.border }}>
                  <Pressable onPress={() => flip(k)} accessibilityRole="checkbox" accessibilityState={{ checked: on }}
                    style={({ pressed }) => ({ flex: 1, minHeight: 54, flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8, opacity: pressed ? 0.7 : 1 })}>
                    <CheckDot on={on} size={28} />
                    <Text style={{ flex: 1, fontSize: fs(15), color: on ? C.muted : C.ink, textDecorationLine: on ? 'line-through' : 'none' }}>{pick(it.text, lg)}</Text>
                  </Pressable>
                  {it.to && (
                    <Pressable onPress={() => router.push(it.to as never)} accessibilityRole="button" hitSlop={6}
                      style={({ pressed }) => ({ minHeight: 44, justifyContent: 'center', paddingHorizontal: 4, opacity: pressed ? 0.7 : 1 })}>
                      <Text style={{ fontSize: fs(14), fontWeight: '700', color: C.accent }}>{pick(L.open, lg)} ›</Text>
                    </Pressable>
                  )}
                </View>
              );
            })}
          </View>
        </View>
      ))}
      <Text style={T.small}>{pick(L.note, lg)}</Text>
      {done > 0 && (confirm ? (
        <View style={{ gap: 8 }}>
          <Text style={T.body}>{pick(L.sure, lg)}</Text>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Btn title={pick(L.yes, lg)} kind="secondary" onPress={() => { setChecks({}); setConfirm(false); }} style={{ flex: 1 }} />
            <Btn title={pick(L.no, lg)} kind="secondary" onPress={() => setConfirm(false)} style={{ flex: 1 }} />
          </View>
        </View>
      ) : (
        <Btn title={pick(L.reset, lg)} kind="secondary" onPress={() => setConfirm(true)} />
      ))}
    </Screen>
  );
}
