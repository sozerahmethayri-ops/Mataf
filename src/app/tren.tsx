// Haremeyn Hızlı Treni: beş istasyon haritada ve listede (uzaklık, yol tarifi), yaklaşık süreler, bilet ve bagaj
// bilgisi; sefer saatleri ve bilet için resmî siteye bağlantı.
import { useMemo, useState } from 'react';
import { Linking, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/Icon';
import { OnlineMap } from '@/components/OnlineMap';
import type { PlainPin } from '@/components/PlainMap';
import { Btn, Card, Header, SectionTitle, T } from '@/components/ui';
import { C, fs } from '@/constants/theme';
import { HHR_LINKS, HHR_STATIONS, HHR_TIMES, HHR_TIPS } from '@/data/train';
import { pick, useI18n } from '@/i18n';
import { useLocation } from '@/services/location';
import { directionsUrl } from '@/services/mosques';
import { meters } from '@/services/transport';

type Lang = 'tr' | 'en' | 'ar';
const L = {
  title: { tr: 'Haremeyn treni', en: 'Haramain train', ar: 'قطار الحرمين' },
  sub: { tr: 'Mekke – Cidde – Medine hızlı treni', en: 'Makkah – Jeddah – Madinah high-speed rail', ar: 'قطار مكة – جدة – المدينة السريع' },
  times: { tr: 'Yaklaşık süreler', en: 'Approximate times', ar: 'المدد التقريبية' },
  stations: { tr: 'İstasyonlar', en: 'Stations', ar: 'المحطات' },
  tips: { tr: 'Bilet ve bagaj', en: 'Tickets and luggage', ar: 'التذاكر والأمتعة' },
  timetable: { tr: 'Sefer saatleri', en: 'Timetable', ar: 'مواعيد الرحلات' },
  book: { tr: 'Bilet al', en: 'Buy ticket', ar: 'احجز' },
  nearest: { tr: 'size en yakın', en: 'nearest to you', ar: 'الأقرب إليك' },
  route: { tr: 'Yol tarifi', en: 'Directions', ar: 'الاتجاهات' },
  src: { tr: 'İstasyon yerleri: © OpenStreetMap katkıcıları. Süreler: Suudi Basın Ajansı (Mayıs 2026). Sefer ve ücretler değişebilir; resmî siteye bakın.', en: 'Station locations: © OpenStreetMap contributors. Times: Saudi Press Agency (May 2026). Services and fares change; check the official site.', ar: 'مواقع المحطات: © مساهمو OpenStreetMap. المدد: وكالة الأنباء السعودية (مايو 2026).' },
};
const fmtKm = (m: number) => (m < 1000 ? `${Math.round(m / 10) * 10} m` : `${Math.round(m / 1000).toLocaleString('tr-TR')} km`);

export default function TrainScreen() {
  const { lang } = useI18n();
  const lg = lang as Lang;
  const insets = useSafeAreaInsets();
  const { fix } = useLocation();
  const here = useMemo(() => (fix ? { lat: fix.lat, lng: fix.lng } : null), [fix]);
  const [sel, setSel] = useState<string | null>(null);
  const pins: PlainPin[] = HHR_STATIONS.map((s) => ({ id: s.id, lat: s.lat, lng: s.lng, color: '#0F766E', label: pick(s.name, lg), big: s.id === sel }));
  const line = { coords: HHR_STATIONS.map((s) => ({ lat: s.lat, lng: s.lng })), color: '#0F766E', dashed: true, width: 3 };
  const nearest = here ? [...HHR_STATIONS].sort((a, b) => meters(here, a) - meters(here, b))[0] : null;

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <View style={{ paddingTop: insets.top, paddingHorizontal: 16 }}>
        <Header back title={pick(L.title, lg)} subtitle={pick(L.sub, lg)} />
      </View>
      <View style={{ height: 230 }}>
        <OnlineMap pins={pins} lines={[line]} user={here} selectedId={sel ?? undefined} onPin={(id) => setSel(id === sel ? null : id)}
          fitTo={HHR_STATIONS.map((s) => ({ lat: s.lat, lng: s.lng }))} fitKey={sel ?? 'all'} center={{ lat: 22.9, lng: 39.4 }}
          padding={{ top: 30, bottom: 30, left: 40, right: 40 }} />
      </View>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: insets.bottom + 24 }}>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Btn title={pick(L.timetable, lg)} icon="clock" kind="secondary" style={{ flex: 1 }} onPress={() => Linking.openURL(HHR_LINKS.timetable)} />
          <Btn title={pick(L.book, lg)} icon="nav" style={{ flex: 1 }} onPress={() => Linking.openURL(HHR_LINKS.book)} />
        </View>

        <SectionTitle>{pick(L.times, lg)}</SectionTitle>
        <Card style={{ gap: 0, paddingVertical: 4 }}>
          {HHR_TIMES.map((x, i) => (
            <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderTopWidth: i ? 1 : 0, borderTopColor: C.border }}>
              <Text style={{ flex: 1, fontSize: fs(14.5), color: C.ink, fontWeight: '600' }}>{pick(x.from, lg)} ↔ {pick(x.to, lg)}</Text>
              <Text style={{ fontSize: fs(14), color: C.accent, fontWeight: '700' }}>{pick(x.time, lg)}</Text>
            </View>
          ))}
        </Card>

        <SectionTitle>{pick(L.stations, lg)}</SectionTitle>
        {HHR_STATIONS.map((s) => {
          const on = s.id === sel;
          return (
            <Pressable key={s.id} onPress={() => setSel(on ? null : s.id)} accessibilityRole="button"
              style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, paddingHorizontal: 10, borderRadius: 14, backgroundColor: on ? C.accentSoft : 'transparent', opacity: pressed ? 0.75 : 1 })}>
              <Icon name="train" size={20} color="#0F766E" />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: fs(15), fontWeight: '600', color: C.ink }}>{pick(s.name, lg)}{nearest?.id === s.id && <Text style={{ fontSize: fs(12.5), fontWeight: '700', color: C.green }}>{`  ${pick(L.nearest, lg)}`}</Text>}</Text>
                {(s.note || here) && <Text style={T.small}>{[s.note && pick(s.note, lg), here && fmtKm(meters(here, s))].filter(Boolean).join(' · ')}</Text>}
              </View>
              <Pressable onPress={() => Linking.openURL(directionsUrl({ lat: s.lat, lng: s.lng }, Platform.OS))} accessibilityRole="button" hitSlop={6}
                style={{ height: 34, paddingHorizontal: 12, borderRadius: 17, backgroundColor: C.surface, justifyContent: 'center' }}>
                <Text style={{ fontSize: fs(13), fontWeight: '700', color: C.accent }}>{pick(L.route, lg)}</Text>
              </Pressable>
            </Pressable>
          );
        })}

        <SectionTitle>{pick(L.tips, lg)}</SectionTitle>
        <View style={{ gap: 8 }}>
          {HHR_TIPS.map((x, i) => (
            <View key={i} style={{ flexDirection: 'row', gap: 10 }}>
              <Text style={{ fontSize: fs(14), color: C.accent }}>•</Text>
              <Text style={[T.body, { flex: 1 }]}>{pick(x, lg)}</Text>
            </View>
          ))}
        </View>
        <Text style={[T.small, { marginTop: 8 }]}>{pick(L.src, lg)}</Text>
      </ScrollView>
    </View>
  );
}
