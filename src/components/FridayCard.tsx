// Ana sayfa, yalnız cuma: hayırlı cumalar, öğle (cuma) vakti ve Kehf sûresine kısayol.
import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import { C, fs } from '@/constants/theme';
import { pick } from '@/i18n';
import { fmtTime } from '@/services/prayer';
import { Icon } from './Icon';

type Lang = 'tr' | 'en' | 'ar';
const L = {
  title: { tr: 'Hayırlı cumalar', en: 'Blessed Friday', ar: 'جمعة مباركة' },
  time: { tr: 'Öğle (cuma) vakti: {t}', en: 'Dhuhr (Jumu‘ah) time: {t}', ar: 'وقت الظهر (الجمعة): {t}' },
  kahf: { tr: 'Kehf sûresini aç', en: 'Open Surah al-Kahf', ar: 'افتح سورة الكهف' },
};

export function FridayCard({ now, dhuhr, tz, lg }: { now: Date; dhuhr: Date; tz?: string; lg: Lang }) {
  if (now.getDay() !== 5) return null;
  return (
    <View style={{ borderRadius: 18, padding: 14, gap: 8, backgroundColor: C.accentSoft, borderWidth: 1, borderColor: C.accentTint }}>
      <Text style={{ fontSize: fs(16), fontWeight: '700', color: C.accent }}>{pick(L.title, lg)}</Text>
      <Text style={{ fontSize: fs(14), color: C.ink2 }}>{pick(L.time, lg).replace('{t}', fmtTime(dhuhr, tz))}</Text>
      <Pressable onPress={() => router.push({ pathname: '/kuran/[sure]', params: { sure: '18' } })} accessibilityRole="button"
        style={({ pressed }) => ({ alignSelf: 'flex-start', minHeight: 44, paddingHorizontal: 16, borderRadius: 22, backgroundColor: C.accent, flexDirection: 'row', alignItems: 'center', gap: 8, opacity: pressed ? 0.85 : 1 })}>
        <Icon name="book" size={16} color={C.onAccent} />
        <Text style={{ fontSize: fs(14.5), fontWeight: '700', color: C.onAccent }}>{pick(L.kahf, lg)}</Text>
      </Pressable>
    </View>
  );
}
