import { Linking, Text, View } from 'react-native';

import { Icon } from '@/components/Icon';
import { Btn, Card, Header, Screen, SectionTitle, T } from '@/components/ui';
import { C, fs } from '@/constants/theme';
import { RAWDAH } from '@/data/content';
import { pick, useI18n } from '@/i18n';

export default function Rawdah() {
  const { t, lang } = useI18n();
  return (
    <Screen>
      <Header back title={t('rawdah.title')} subtitle="الروضة الشريفة" />
      <Card tint={C.greenTint}>
        <Text style={{ fontSize: fs(14), fontWeight: '700', color: C.greenDark }}>Nusuk · {RAWDAH.insideMinutes} dk · {RAWDAH.reissueDays} gün</Text>
        <Text style={T.small}>{pick(RAWDAH.entry, lang)}</Text>
        <Btn title={t('rawdah.nusuk')} kind="secondary" icon="external" onPress={() => Linking.openURL(RAWDAH.nusukUrl)} />
      </Card>

      <Card style={{ backgroundColor: C.openTint, borderColor: C.border }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
          <View style={{ width: 56, height: 56, borderRadius: 18, backgroundColor: C.green, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="tour" color="#FFFFFF" size={30} width={1.8} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: fs(16), fontWeight: '700', color: C.greenDark }}>{t('rawdah.tour')}</Text>
            <Text style={T.small}>{t('rawdah.tourSub')}</Text>
          </View>
        </View>
        <Text style={T.small}>Ravza, minber, selam noktası, avlular · AR · EN · FR · ES</Text>
        <Btn title={t('rawdah.open')} kind="green" icon="external" onPress={() => Linking.openURL(RAWDAH.tourUrl)} />
      </Card>

      <SectionTitle>{t('rawdah.times')}</SectionTitle>
      <Card>
        {(['men', 'women'] as const).map((g) => (
          <View key={g} style={{ gap: 4, paddingVertical: 4 }}>
            <Text style={{ fontWeight: '700', color: C.ink }}>{t(g === 'men' ? 'rawdah.men' : 'rawdah.women')}</Text>
            <Text style={T.body}>{t('rawdah.satThu')}: {RAWDAH.hours[g].satThu.join(' · ')}</Text>
            <Text style={T.body}>{t('rawdah.fri')}: {RAWDAH.hours[g].fri.join(' · ')}</Text>
          </View>
        ))}
        <Text style={T.small}>Kaynak: {RAWDAH.source} · değişince uygulama günceller.</Text>
      </Card>

      <SectionTitle>{t('rawdah.steps')}</SectionTitle>
      {RAWDAH.steps.map((s, i) => (
        <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={{ width: 26, height: 26, borderRadius: 13, backgroundColor: C.accent, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ color: C.onAccent, fontWeight: '700', fontSize: fs(12) }}>{i + 1}</Text>
          </View>
          <Text style={[T.body, { flex: 1 }]}>{s}</Text>
        </View>
      ))}
      <Card tint={C.surface}>
        <Text style={{ fontStyle: 'italic', color: C.ink }}>“Evimle minberimin arası cennet bahçelerinden bir bahçedir.”</Text>
        <Text style={T.small}>Buhârî, 1196</Text>
      </Card>
    </Screen>
  );
}
