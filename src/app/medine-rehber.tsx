import { router } from 'expo-router';
import { Linking, Text, View } from 'react-native';

import { Header, ListRow, Screen, SectionTitle, T } from '@/components/ui';
import { C } from '@/constants/theme';
import { useI18n } from '@/i18n';

const MOSQUE = [
  { title: 'Ravza-i Mutahhara', sub: 'Minber ile Hücre-i Saadet arası · yeşil halı', go: '/ravza' as const },
  { title: 'Hücre-i Saadet ve Yeşil Kubbe', sub: 'Kubbe 1837’de yeşile boyandı', go: '/ravza' as const },
  { title: 'Bab-üs Selam · Kapı 1', sub: 'Batı cephesi · selam ziyaretinin geleneksel başlangıcı', gate: 'md-1' },
  { title: 'Bab el-Bakî · Kapı 41', sub: 'Hücre-i Saadet’e en yakın kapı', gate: 'md-41' },
  { title: 'Kral Fahd Kapısı · 21', sub: 'Kuzeydeki ana giriş', gate: 'md-21' },
  { title: 'Avlu şemsiyeleri', sub: '250 şemsiye · 143.000 m² gölge' },
];

const CITY = [
  { title: 'Cennetü’l-Bakî', sub: 'Mescidin hemen doğusu', q: 'Jannat al-Baqi Medina' },
  { title: 'Kuba Mescidi', sub: 'İslam’da inşa edilen ilk mescit', q: 'Quba Mosque Medina' },
  { title: 'Kıbleteyn Mescidi', sub: 'Kıblenin Kâbe’ye çevrildiği mescit', q: 'Masjid al-Qiblatayn Medina' },
  { title: 'Uhud Dağı ve Şühedâ', sub: 'Hz. Hamza ve Uhud şehitleri', q: 'Uhud Martyrs Cemetery Medina' },
];

export default function MadinahGuide() {
  const { t } = useI18n();
  return (
    <Screen>
      <Header back title={t('guide.title')} subtitle="Mescid-i Nebevî ve çevresi" />
      <SectionTitle>Mescid-i Nebevî’de</SectionTitle>
      {MOSQUE.map((m) => (
        <ListRow key={m.title} title={m.title} subtitle={m.sub}
          onPress={m.go ? () => router.push(m.go) : m.gate ? () => router.push({ pathname: '/kapi/[id]', params: { id: m.gate! } }) : undefined}
          left={<View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: m.gate ? C.open : C.green }} />} />
      ))}
      <SectionTitle>Medine’de ziyaret</SectionTitle>
      {CITY.map((c) => (
        <ListRow key={c.title} title={c.title} subtitle={c.sub}
          onPress={() => Linking.openURL(`https://www.openstreetmap.org/search?query=${encodeURIComponent(c.q)}`)} />
      ))}
      <Text style={T.small}>Konumlar OpenStreetMap’te açılır. Ziyaret saatleri ve kurallar değişebilir; sahadaki görevlileri dinleyin.</Text>
    </Screen>
  );
}
