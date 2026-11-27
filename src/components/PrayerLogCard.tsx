// Ana sayfa: bugünkü beş vakti tek dokunuşla işaretleme (Namaz takibi). Vakti girmemiş namaz işaretlenmez.
// Başlığa dokununca Namaz takibi ekranı açılır; kart oradan gizlenebilir.
import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import { C, fs } from '@/constants/theme';
import { pick } from '@/i18n';
import type { PrayerKey } from '@/services/prayer';
import { LOG_PRAYERS, countDay, dayKey, isDone, type LogPrayer } from '@/services/prayerLog';
import { usePrayerLog } from '@/services/usePrayerLog';
import { Icon } from './Icon';

type Lang = 'tr' | 'en' | 'ar';
type ML = { tr: string; en: string; ar: string };

/** Namaz adları (vakit adı değil: "İmsak" yerine "Sabah") */
export const LOG_NAMES: Record<LogPrayer, ML> = {
  fajr: { tr: 'Sabah', en: 'Fajr', ar: 'الفجر' },
  dhuhr: { tr: 'Öğle', en: 'Dhuhr', ar: 'الظهر' },
  asr: { tr: 'İkindi', en: 'Asr', ar: 'العصر' },
  maghrib: { tr: 'Akşam', en: 'Maghrib', ar: 'المغرب' },
  isha: { tr: 'Yatsı', en: 'Isha', ar: 'العشاء' },
};
const L = {
  title: { tr: 'Bugünkü namazlarım', en: 'Today’s prayers', ar: 'صلواتي اليوم' },
  allDone: { tr: 'Beş vakit tamam', en: 'All five prayed', ar: 'أتممت الصلوات الخمس' },
  notYet: { tr: 'vakti girmedi', en: 'not yet time', ar: 'لم يدخل وقتها' },
};

/** Yuvarlak işaret: kılındıysa palet renginde ve tikli */
export function CheckDot({ on, size }: { on: boolean; size: number }) {
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, borderWidth: 2, borderColor: on ? C.accent : C.borderStrong, backgroundColor: on ? C.accent : 'transparent', alignItems: 'center', justifyContent: 'center' }}>
      {on && <Icon name="check" size={Math.round(size * 0.5)} color={C.onAccent} />}
    </View>
  );
}

export function PrayerLogCard({ times, now, lg }: { times: Record<PrayerKey, Date>; now: Date; lg: Lang }) {
  const { log, hidden, flip } = usePrayerLog();
  if (hidden) return null;
  const day = dayKey(now);
  const n = countDay(log, day);
  return (
    <View style={{ borderWidth: 1, borderColor: C.border, borderRadius: 18, paddingHorizontal: 12, paddingTop: 4, paddingBottom: 12, gap: 4 }}>
      <Pressable onPress={() => router.push('/namaz-takibi')} accessibilityRole="button"
        style={({ pressed }) => ({ minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 2, opacity: pressed ? 0.7 : 1 })}>
        <Text style={{ flex: 1, fontSize: fs(15), fontWeight: '700', color: C.ink }} numberOfLines={1}>{pick(L.title, lg)}</Text>
        <Text style={{ fontSize: fs(13.5), fontWeight: '700', color: n === 5 ? C.accent : C.muted, fontVariant: ['tabular-nums'] }}>{n === 5 ? pick(L.allDone, lg) : `${n}/5`}</Text>
        <Icon name="chevron" size={16} color={C.muted} />
      </Pressable>
      <View style={{ flexDirection: 'row' }}>
        {LOG_PRAYERS.map((p) => {
          const due = times[p] <= now;
          const on = isDone(log, day, p);
          const name = pick(LOG_NAMES[p], lg);
          return (
            <Pressable key={p} disabled={!due} onPress={() => flip(day, p)} accessibilityRole="checkbox"
              accessibilityState={{ checked: on, disabled: !due }} accessibilityLabel={due ? name : `${name}, ${pick(L.notYet, lg)}`}
              style={({ pressed }) => ({ flex: 1, minHeight: 64, alignItems: 'center', justifyContent: 'center', gap: 4, opacity: !due ? 0.4 : pressed ? 0.7 : 1 })}>
              <CheckDot on={on} size={40} />
              <Text style={{ fontSize: fs(12), fontWeight: '600', color: on ? C.ink : C.muted }} numberOfLines={1}>{name}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
