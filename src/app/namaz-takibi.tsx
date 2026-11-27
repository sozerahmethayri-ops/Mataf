// Namaz takibi: bugünün beş vakti, son 7 gün, seri. Kayıt yalnız bu telefonda (prayer:log); kaza takibine bağlantı.
// Dil sade ve suçlamasız: kaçan vakit "kayıp" diye gösterilmez, yalnız kılınan işaretlenir.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { Icon, type IconName } from '@/components/Icon';
import { CheckDot, LOG_NAMES } from '@/components/PrayerLogCard';
import { Header, ListRow, Screen, SectionTitle, T, Toggle } from '@/components/ui';
import { C, fs } from '@/constants/theme';
import { pick, useI18n } from '@/i18n';
import { fmtTime, times } from '@/services/prayer';
import { usePrayerPlace } from '@/services/prayerPlace';
import { readFromMark, readShare } from '@/services/hatim';
import { LOG_PRAYERS, countDays, dayKey, isDone, lastDays, streak } from '@/services/prayerLog';
import { useQuranPrefs } from '@/services/QuranPrefs';
import { zikirStats, type ZikirLogItem } from '@/services/zikirStats';
import { usePrayerLog } from '@/services/usePrayerLog';
import { pinPrayerWidget, widgetPinSupported } from '@/services/widgetSync';

type Lang = 'tr' | 'en' | 'ar';
const L = {
  title: { tr: 'Namaz takibi', en: 'Prayer tracker', ar: 'متابعة الصلاة' },
  sub: { tr: 'Yalnız bu telefonda saklanır', en: 'Stored only on this phone', ar: 'تُحفظ على هذا الهاتف فقط' },
  today: { tr: 'Bugün', en: 'Today', ar: 'اليوم' },
  week: { tr: 'Son 7 gün', en: 'Last 7 days', ar: 'آخر 7 أيام' },
  thisWeek: { tr: 'Son 7 günün özeti', en: 'Last 7 days at a glance', ar: 'ملخص آخر 7 أيام' },
  sPrayer: { tr: 'Namaz', en: 'Prayers', ar: 'الصلاة' },
  nPrayer: { tr: '{n} vakit', en: '{n} prayers', ar: '{n} صلاة' },
  sZikir: { tr: 'Zikir (deftere kaydedilen)', en: 'Dhikr (saved in the log)', ar: 'الذكر (المسجّل)' },
  sQuran: { tr: 'Hatim', en: 'Khatm', ar: 'الختمة' },
  streak: { tr: '{n} gündür beş vakit tamam', en: 'All five prayers, {n} days in a row', ar: 'الصلوات الخمس كاملة منذ {n} يوم' },
  notYet: { tr: 'Vakti girmedi', en: 'Not yet time', ar: 'لم يدخل وقتها' },
  hint: {
    tr: 'Kıldığınız namaza dokunun; yanlışlıkla işaretlediyseniz yeniden dokunun. Geçmiş günleri tablodan düzeltebilirsiniz.',
    en: 'Tap a prayer once you have prayed it; tap again to undo. You can correct past days in the table.',
    ar: 'اضغط على الصلاة بعد أدائها، واضغط مرة أخرى للتراجع. يمكنك تصحيح الأيام السابقة من الجدول.',
  },
  kaza: { tr: 'Kaza namazı takibi', en: 'Missed prayers (qada)', ar: 'قضاء الصلوات' },
  kazaSub: { tr: 'Kılamadığınız namazları kaza edin ve sayın', en: 'Make up the prayers you missed and keep count', ar: 'اقضِ ما فاتك من الصلوات وعُدَّه' },
  showHome: { tr: 'Ana sayfada göster', en: 'Show on the home screen', ar: 'إظهار في الصفحة الرئيسية' },
  pin: { tr: 'Telefonun ana ekranına ekle', en: 'Add to your phone’s home screen', ar: 'أضف إلى الشاشة الرئيسية للهاتف' },
  pinSub: { tr: 'Bugünkü vakitler kutuda görünür; dokununca uygulama açılır.', en: 'Today’s prayers appear in a widget; tap it to open the app.', ar: 'تظهر صلوات اليوم في أداة؛ اضغط لفتح التطبيق.' },
};

/** 'YYYY-MM-DD' → yerel öğle (ayrıştırma motorundan bağımsız) */
const fromKey = (k: string) => {
  const [y, m, d] = k.split('-').map(Number);
  return new Date(y, m - 1, d, 12);
};

export default function PrayerLogScreen() {
  const { lang } = useI18n();
  const lg = lang as Lang;
  const { loc, method } = usePrayerPlace(lang);
  const { log, hidden, flip, setHidden } = usePrayerLog();
  const { bookmarks } = useQuranPrefs();
  const hb = bookmarks.find((b) => b.hatim);
  const qPct = hb ? Math.round(readShare(readFromMark(hb.surah, hb.ayah)) * 100) : 0;
  // Son 7 günün zikri (deftere kaydedilenler)
  const [zw, setZw] = useState(0);
  useEffect(() => {
    let alive = true;
    AsyncStorage.getItem('zikir:log')
      .then((raw) => {
        if (!alive) return;
        try {
          const items = (JSON.parse(raw ?? '{}') as { items?: ZikirLogItem[] }).items ?? [];
          setZw(zikirStats(items, new Date()).weekTotal);
        } catch { /* bozuk kayıt */ }
      })
      .catch(() => undefined);
    return () => { alive = false; };
  }, []);
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(id);
  }, []);
  const tt = useMemo(() => times(loc.lat, loc.lng, method, now), [loc.lat, loc.lng, method, now]);
  const today = dayKey(now);
  const days = lastDays(now, 7);
  const st = streak(log, now);
  const sum = countDays(log, days);
  const dayFmt = new Intl.DateTimeFormat(lang, { weekday: 'short', day: 'numeric' });

  return (
    <Screen>
      <Header back title={pick(L.title, lg)} subtitle={pick(L.sub, lg)} />

      <SectionTitle>{pick(L.today, lg)}</SectionTitle>
      <View style={{ borderWidth: 1, borderColor: C.border, borderRadius: 18, paddingHorizontal: 14 }}>
        {LOG_PRAYERS.map((p, i) => {
          const due = tt[p] <= now;
          const on = isDone(log, today, p);
          return (
            <Pressable key={p} disabled={!due} onPress={() => flip(today, p)} accessibilityRole="checkbox" accessibilityState={{ checked: on, disabled: !due }}
              accessibilityLabel={pick(LOG_NAMES[p], lg)}
              style={({ pressed }) => ({ minHeight: 56, flexDirection: 'row', alignItems: 'center', gap: 12, borderTopWidth: i ? 1 : 0, borderTopColor: C.border, opacity: !due ? 0.45 : pressed ? 0.7 : 1 })}>
              <CheckDot on={on} size={30} />
              <Text style={{ flex: 1, fontSize: fs(16), fontWeight: '600', color: C.ink }}>{pick(LOG_NAMES[p], lg)}</Text>
              <Text style={{ fontSize: fs(15), color: C.muted, fontVariant: ['tabular-nums'] }}>{due ? fmtTime(tt[p], loc.tz) : pick(L.notYet, lg)}</Text>
            </Pressable>
          );
        })}
      </View>
      {st >= 2 && <Text style={{ fontSize: fs(15), fontWeight: '700', color: C.accent }}>{pick(L.streak, lg).replace('{n}', String(st))}</Text>}

      <SectionTitle>{pick(L.week, lg)}</SectionTitle>
      <View style={{ borderWidth: 1, borderColor: C.border, borderRadius: 18, paddingHorizontal: 10, paddingVertical: 4 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', minHeight: 34 }}>
          <View style={{ width: 72 }} />
          {LOG_PRAYERS.map((p) => (
            <Text key={p} style={{ flex: 1, textAlign: 'center', fontSize: fs(11.5), fontWeight: '700', color: C.muted }} numberOfLines={1}>{pick(LOG_NAMES[p], lg)}</Text>
          ))}
        </View>
        {days.slice().reverse().map((d) => {
          const isToday = d === today;
          const label = isToday ? pick(L.today, lg) : dayFmt.format(fromKey(d));
          return (
            <View key={d} style={{ flexDirection: 'row', alignItems: 'center', minHeight: 48, borderTopWidth: 1, borderTopColor: C.border }}>
              <Text style={{ width: 72, fontSize: fs(13), fontWeight: isToday ? '700' : '500', color: isToday ? C.ink : C.ink2 }} numberOfLines={1}>{label}</Text>
              {LOG_PRAYERS.map((p) => {
                const due = !isToday || tt[p] <= now;
                const on = isDone(log, d, p);
                return (
                  <Pressable key={p} disabled={!due} onPress={() => flip(d, p)} accessibilityRole="checkbox" accessibilityState={{ checked: on, disabled: !due }}
                    accessibilityLabel={`${label}, ${pick(LOG_NAMES[p], lg)}`}
                    style={({ pressed }) => ({ flex: 1, minHeight: 44, alignItems: 'center', justifyContent: 'center', opacity: !due ? 0.35 : pressed ? 0.7 : 1 })}>
                    <CheckDot on={on} size={24} />
                  </Pressable>
                );
              })}
            </View>
          );
        })}
      </View>
      <SectionTitle>{pick(L.thisWeek, lg)}</SectionTitle>
      <View style={{ borderWidth: 1, borderColor: C.border, borderRadius: 18, paddingHorizontal: 14 }}>
        <SumRow icon="check" label={pick(L.sPrayer, lg)} value={pick(L.nPrayer, lg).replace('{n}', String(sum))} first />
        <SumRow icon="beads" label={pick(L.sZikir, lg)} value={zw.toLocaleString(lang)} onPress={() => router.push('/zikir')} />
        <SumRow icon="book" label={pick(L.sQuran, lg)} value={`%${qPct}`} onPress={() => router.push('/hatim')} />
      </View>
      <Text style={T.small}>{pick(L.hint, lg)}</Text>

      <ListRow title={pick(L.kaza, lg)} subtitle={pick(L.kazaSub, lg)} onPress={() => router.push('/kaza')} left={<Icon name="counter" size={20} color={C.ink2} />} />
      <View style={{ flexDirection: 'row', alignItems: 'center', minHeight: 52, gap: 12 }}>
        <Text style={{ flex: 1, fontSize: fs(15), fontWeight: '600', color: C.ink }}>{pick(L.showHome, lg)}</Text>
        <Toggle value={!hidden} onChange={(v) => setHidden(!v)} label={pick(L.showHome, lg)} />
      </View>
      {widgetPinSupported() && (
        <ListRow title={pick(L.pin, lg)} subtitle={pick(L.pinSub, lg)} onPress={() => pinPrayerWidget('PrayerLogWidget')} left={<Icon name="plus" size={20} color={C.accent} />} />
      )}
    </Screen>
  );
}

function SumRow({ icon, label, value, first, onPress }: { icon: IconName; label: string; value: string; first?: boolean; onPress?: () => void }) {
  return (
    <Pressable onPress={onPress} disabled={!onPress} accessibilityRole={onPress ? 'button' : undefined}
      style={({ pressed }) => ({ minHeight: 52, flexDirection: 'row', alignItems: 'center', gap: 12, borderTopWidth: first ? 0 : 1, borderTopColor: C.border, opacity: pressed ? 0.7 : 1 })}>
      <Icon name={icon} size={20} color={C.accent} />
      <Text style={{ flex: 1, fontSize: fs(15), color: C.ink }}>{label}</Text>
      <Text style={{ fontSize: fs(15), fontWeight: '700', color: C.ink, fontVariant: ['tabular-nums'] }}>{value}</Text>
    </Pressable>
  );
}
