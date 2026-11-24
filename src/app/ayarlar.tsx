import Constants from 'expo-constants';
import { useEffect, useState } from 'react';
import { Linking, Text } from 'react-native';

import { Icon } from '@/components/Icon';
import { Card, Header, ListRow, Screen, SectionTitle, T } from '@/components/ui';
import { C } from '@/constants/theme';
import { useI18n } from '@/i18n';
import { LANGS } from '@/i18n/strings';
import { METHODS, getMethod, setMethod, type MethodId } from '@/services/prayer';
import { useReports } from '@/services/ReportsContext';

export default function Settings() {
  const { t, lang, setLang } = useI18n();
  const { backend } = useReports();
  const [method, setM] = useState<MethodId>('UmmAlQura');
  const [rtlChanged, setRtlChanged] = useState(false);
  useEffect(() => { getMethod().then(setM); }, []);

  return (
    <Screen>
      <Header back title={t('settings.title')} />
      <SectionTitle>{t('settings.language')}</SectionTitle>
      {LANGS.map((l) => (
        <ListRow key={l.code} title={l.label} onPress={() => { if (l.rtl !== (LANGS.find((x) => x.code === lang)?.rtl ?? false)) setRtlChanged(true); setLang(l.code); }}
          right={l.code === lang ? <Icon name="check" color={C.accent} /> : <></>} />
      ))}
      {rtlChanged && <Text style={[T.small, { color: C.limited }]}>{t('settings.rtlNote')}</Text>}

      <SectionTitle>{t('settings.method')}</SectionTitle>
      {METHODS.map((m) => (
        <ListRow key={m.id} title={m.label} onPress={() => { setM(m.id); setMethod(m.id); }}
          right={m.id === method ? <Icon name="check" color={C.accent} /> : <></>} />
      ))}

      <SectionTitle>{t('settings.backend')}</SectionTitle>
      <Card tint={C.surface}>
        <Text style={T.body}>{backend === 'supabase' ? t('settings.backendRemote') : t('settings.backendLocal')}</Text>
        <Text style={T.small}>Canlı sunucu için EXPO_PUBLIC_SUPABASE_URL ve EXPO_PUBLIC_SUPABASE_ANON_KEY tanımlayın (README).</Text>
      </Card>

      <SectionTitle>{t('settings.about')}</SectionTitle>
      <Card tint={C.surface}>
        <Text style={T.body}>MATAF {Constants.expoConfig?.version ?? ''}</Text>
        <Text style={T.small}>Harita ölçüleri yayımlanmış değerlerden; dış hatlar yaklaşık. Resmî kurumun canlı verisiyle değiştirilecek. © OpenStreetMap katkıcıları.</Text>
        <Text style={[T.small, { color: C.accent, fontWeight: '700' }]} onPress={() => Linking.openURL('https://www.openstreetmap.org/copyright')}>OpenStreetMap lisansı ↗</Text>
      </Card>
    </Screen>
  );
}
