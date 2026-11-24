import { useLocalSearchParams } from 'expo-router';
import { Share, Text } from 'react-native';

import { Card, Header, IconBtn, Screen, T } from '@/components/ui';
import { C } from '@/constants/theme';
import { DUA_CATS } from '@/data/content';
import { useI18n } from '@/i18n';

export default function DuaCategory() {
  const { kategori } = useLocalSearchParams<{ kategori: string }>();
  const { t } = useI18n();
  const cat = DUA_CATS.find((c) => c.id === kategori) ?? DUA_CATS[0];
  return (
    <Screen>
      <Header back title={cat.title} />
      {cat.items.map((d, i) => (
        <Card key={i} tint={C.accentSoft} style={{ gap: 8 }}>
          <Text style={T.arabic}>{d.ar}</Text>
          <Text style={{ fontSize: 14, fontStyle: 'italic', color: C.ink2 }}>{d.tr}</Text>
          <Text style={T.body}>{d.meaning}</Text>
          <Text style={T.small}>{d.ref}</Text>
          <IconBtn name="share" label={t('common.share')} size={36} tint={C.bg} onPress={() => Share.share({ message: `${d.ar}\n${d.tr}\n${d.meaning}\n— ${d.ref}` })} />
        </Card>
      ))}
    </Screen>
  );
}
