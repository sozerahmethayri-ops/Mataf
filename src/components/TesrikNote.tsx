// Kurban Bayramı teşrik günlerinde (Arefe sabahı – bayramın 4. günü ikindisi, 23 vakit) farzlardan sonra getirilen tekbir.
import { Text, View } from 'react-native';

import { Icon } from '@/components/Icon';
import { C, fs } from '@/constants/theme';
import { pick } from '@/i18n';
import { isTesrik } from '@/services/adhanPlan';
import { PRAYERS, type PrayerKey } from '@/services/prayer';

type Lang = 'tr' | 'en' | 'ar';
const TXT = {
  title: { tr: 'Teşrik tekbiri', en: 'Takbir al-tashriq', ar: 'تكبير التشريق' },
  sub: { tr: 'Her farz namazın selamından sonra bir kez:', en: 'Once after the salam of every obligatory prayer:', ar: 'مرة بعد السلام من كل فريضة:' },
  latin: { tr: 'Allâhü ekber, Allâhü ekber. Lâ ilâhe illallâhü vallâhü ekber. Allâhü ekber ve lillâhi’l-hamd.', en: 'Allahu akbar, Allahu akbar. La ilaha illallahu wallahu akbar. Allahu akbar wa lillahil-hamd.', ar: '' },
};
const ARABIC = 'اللهُ أكبرُ اللهُ أكبرُ، لا إلهَ إلا اللهُ واللهُ أكبرُ، اللهُ أكبرُ وللهِ الحمدُ';

/** Şu anki ya da sıradaki farz vakti teşrik vakitlerinden biri mi? */
export function tesrikActive(today: Record<PrayerKey, Date>, now: Date, next: { key: PrayerKey; at: Date }) {
  const cur = [...PRAYERS].reverse().find((p) => p !== 'sunrise' && today[p] <= now);
  return (!!cur && isTesrik(cur, today[cur])) || isTesrik(next.key, next.at);
}

export function TesrikNote({ lang }: { lang: Lang }) {
  return (
    <View accessible style={{ gap: 6, paddingVertical: 12, paddingHorizontal: 14, borderRadius: 16, backgroundColor: C.greenTint }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Icon name="beads" size={18} color={C.green} />
        <Text style={{ flex: 1, fontSize: fs(14.5), fontWeight: '700', color: C.ink }}>{pick(TXT.title, lang)}</Text>
      </View>
      <Text style={{ fontSize: fs(12.5), color: C.muted }}>{pick(TXT.sub, lang)}</Text>
      <Text style={{ fontSize: fs(18), color: C.ink, textAlign: 'right', writingDirection: 'rtl', lineHeight: fs(30) }}>{ARABIC}</Text>
      {lang !== 'ar' && <Text style={{ fontSize: fs(13.5), color: C.ink, lineHeight: fs(19) }}>{pick(TXT.latin, lang)}</Text>}
    </View>
  );
}
