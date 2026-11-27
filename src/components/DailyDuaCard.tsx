// Ana sayfa: günün duası. Kaynaklı dua kütüphanesinden (src/data/duas.ts) her gün sıradaki kısa dua; metin ve kaynak aynen.
// Uzun dualar (Arapça metni 200 harften uzun) ana sayfaya alınmaz, Dualar ekranında durur.
import { router } from 'expo-router';
import { Pressable, Share, Text, View } from 'react-native';

import { C, fs, fsAr } from '@/constants/theme';
import { allTextDuas } from '@/data/duas';
import { pick } from '@/i18n';
import { dailyIndex } from '@/services/daily';
import { IconBtn, T } from './ui';

type Lang = 'tr' | 'en' | 'ar';
const L = {
  title: { tr: 'Günün duası', en: 'Du‘a of the day', ar: 'دعاء اليوم' },
  more: { tr: 'Bu bölümün duaları', en: 'More from this section', ar: 'المزيد من هذا القسم' },
  share: { tr: 'Duayı paylaş', en: 'Share the du‘a', ar: 'مشاركة الدعاء' },
};
const SHORT = allTextDuas().filter((x) => x.d.ar.length <= 200);

export function DailyDuaCard({ now, lg }: { now: Date; lg: Lang }) {
  const item = SHORT[dailyIndex(now, SHORT.length)];
  if (!item) return null;
  const { d, cat } = item;
  // Arapça arayüzde anlam alanı boş olabilir: metnin kendisi yeterli
  const mean = pick(d.mean, lg);
  const when = d.when ? pick(d.when, lg) : '';
  const share = () => Share.share({ message: [d.ar, lg === 'ar' ? '' : d.tr, mean, `(${d.ref})`].filter(Boolean).join('\n\n') });
  return (
    <View style={{ borderWidth: 1, borderColor: C.border, borderRadius: 18, padding: 14, gap: 8 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <View style={{ flex: 1, gap: 1 }}>
          <Text style={{ fontSize: fs(15), fontWeight: '700', color: C.ink }} accessibilityRole="header">{pick(L.title, lg)}</Text>
          {when ? <Text style={{ fontSize: fs(12.5), fontWeight: '600', color: C.accent }}>{when}</Text> : null}
        </View>
        <IconBtn name="share" label={pick(L.share, lg)} onPress={share} />
      </View>
      <Text style={[T.arabic, { fontSize: fsAr(22), lineHeight: fsAr(38) }]}>{d.ar}</Text>
      {lg !== 'ar' && <Text style={{ fontSize: fs(13.5), fontStyle: 'italic', color: C.ink2, lineHeight: fs(19) }}>{d.tr}</Text>}
      {mean ? <Text style={T.body}>{mean}</Text> : null}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <Text style={[T.small, { flexShrink: 1 }]}>{d.ref}</Text>
        <View style={{ flex: 1 }} />
        <Pressable onPress={() => router.push({ pathname: '/dua/[kategori]', params: { kategori: cat } })} accessibilityRole="button" hitSlop={8}
          style={({ pressed }) => ({ minHeight: 44, justifyContent: 'center', opacity: pressed ? 0.7 : 1 })}>
          <Text style={{ fontSize: fs(13.5), fontWeight: '700', color: C.accent }}>{pick(L.more, lg)} ›</Text>
        </Pressable>
      </View>
    </View>
  );
}
