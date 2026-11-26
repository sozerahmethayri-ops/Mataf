// Yaşlı ve engelli ziyaretçiler: Mescid-i Haram'da ücretsiz tekerlekli sandalye, golf arabası ve itici ile sandalye,
// otelden alma; resmî rezervasyon platformuna ve kapı listesine bağlantı.
import { router } from 'expo-router';
import { Linking, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/Icon';
import { Btn, Card, Header, T } from '@/components/ui';
import { C, fs } from '@/constants/theme';
import { ACCESS_CARDS, ACCESS_NOTE, ACCESS_SITE } from '@/data/access';
import { pick, useI18n } from '@/i18n';

type Lang = 'tr' | 'en' | 'ar';
const L = {
  title: { tr: 'Tekerlekli sandalye ve araba', en: 'Wheelchairs and carts', ar: 'الكراسي المتحركة والعربات' },
  sub: { tr: 'Mescid-i Haram · yaşlı ve engelli ziyaretçiler', en: 'Grand Mosque · elderly and disabled visitors', ar: 'المسجد الحرام · كبار السن وذوو الإعاقة' },
  book: { tr: 'Rezervasyon', en: 'Book', ar: 'الحجز' },
  gates: { tr: 'Kapılar', en: 'Gates', ar: 'الأبواب' },
};

export default function AccessScreen() {
  const { lang } = useI18n();
  const lg = lang as Lang;
  const insets = useSafeAreaInsets();
  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <View style={{ paddingTop: insets.top, paddingHorizontal: 16 }}>
        <Header back title={pick(L.title, lg)} subtitle={pick(L.sub, lg)} />
      </View>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: insets.bottom + 24 }}>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Btn title={pick(L.gates, lg)} icon="gate" kind="secondary" style={{ flex: 1 }} onPress={() => router.push('/kapilar')} />
          <Btn title={pick(L.book, lg)} icon="external" style={{ flex: 1.4 }} onPress={() => Linking.openURL(ACCESS_SITE)} />
        </View>
        {ACCESS_CARDS.map((c) => (
          <Card key={c.title.tr} style={{ gap: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: C.accentSoft, alignItems: 'center', justifyContent: 'center' }}>
                <Icon name={c.icon} size={18} color={C.accent} />
              </View>
              <Text style={{ flex: 1, fontSize: fs(16), fontWeight: '700', color: C.ink }}>{pick(c.title, lg)}</Text>
            </View>
            <Text style={T.body}>{pick(c.text, lg)}</Text>
          </Card>
        ))}
        <Text style={[T.small, { marginTop: 4 }]}>{pick(ACCESS_NOTE, lg)}</Text>
      </ScrollView>
    </View>
  );
}
