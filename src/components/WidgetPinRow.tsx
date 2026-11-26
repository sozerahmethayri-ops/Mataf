// "Ana ekrana vakit kutusu ekle": yalnız Android'de ve başlatıcı destekliyorsa görünür. Dokununca dört boy
// açılır (küçük, orta, liste, şerit); seçilen boy için başlatıcının onay penceresi açılır.
import { useCallback, useEffect, useState } from 'react';
import { AppState, Pressable, Text, View } from 'react-native';

import { Icon, type IconName } from '@/components/Icon';
import { ListRow } from '@/components/ui';
import { C, fs } from '@/constants/theme';
import { pick, useI18n } from '@/i18n';
import type { Lang } from '@/i18n/strings';
import { askExactAlarm, exactAlarmGranted } from '@/services/adhanNotify';
import { pinPrayerWidget, refreshWidgetTicks, widgetCount, widgetPinSupported, type WidgetName } from '@/services/widgetSync';

type T3 = { tr: string; en: string; ar: string };
const L = {
  title: { tr: 'Ana ekrana vakit kutusu ekle', en: 'Add prayer times to home screen', ar: 'أضف المواقيت إلى الشاشة الرئيسية' },
  sub: { tr: 'Dört boy: küçük, orta, liste ve ince şerit', en: 'Four sizes: small, medium, list and slim strip', ar: 'أربعة أحجام: صغير ومتوسط وقائمة وشريط' },
  exact: { tr: 'Kutu vakit girince birkaç dakika geç değişebilir. Tam vaktinde değişsin diye “Alarmlar ve hatırlatıcılar” iznini açın ›', en: 'The widget may switch a few minutes late. Tap to allow “Alarms & reminders” so it changes exactly on time ›', ar: 'قد تتغير الأداة متأخرة بضع دقائق. اضغط للسماح بـ«المنبهات والتذكيرات» لتتغير في الوقت تمامًا ›' },
  added: { tr: 'Ana ekranda {n} tane ✓ · başka boy eklemek için dokunun', en: '{n} on your home screen ✓ · tap to add another size', ar: '{n} على الشاشة ✓ · اضغط لإضافة حجم آخر' },
  manual: { tr: 'Olmadıysa: ana ekranda boş yere basılı tutun → Widget’lar → MATAF', en: 'If nothing happened: long-press the home screen → Widgets → MATAF', ar: 'إن لم يحدث شيء: اضغط مطولًا على الشاشة الرئيسية ← الأدوات ← MATAF' },
};
const SIZES: { name: WidgetName; icon: IconName; title: T3; sub: T3 }[] = [
  { name: 'NextPrayerWidget', icon: 'clock', title: { tr: 'Küçük · sıradaki vakit', en: 'Small · next prayer', ar: 'صغير · الصلاة التالية' }, sub: { tr: 'Kare · büyük saat, ardından gelen vakit', en: 'Square · large time and the one after', ar: 'مربع · وقت كبير والتي تليها' } },
  { name: 'PrayerWidget', icon: 'grid', title: { tr: 'Orta · günün vakitleri', en: 'Medium · today’s times', ar: 'متوسط · مواقيت اليوم' }, sub: { tr: 'Geniş · sıradaki vakit ve altı vakit yan yana', en: 'Wide · next prayer and all six side by side', ar: 'عريض · التالية والمواقيت الستة' } },
  { name: 'PrayerListWidget', icon: 'list', title: { tr: 'Liste · alt alta', en: 'List · stacked', ar: 'قائمة · عمودية' }, sub: { tr: 'Uzun · altı vakit alt alta, okuması en kolay', en: 'Tall · six times stacked, easiest to read', ar: 'طويل · المواقيت الستة عموديًا' } },
  { name: 'PrayerStripWidget', icon: 'minus', title: { tr: 'İnce şerit', en: 'Slim strip', ar: 'شريط رفيع' }, sub: { tr: 'Tek satır · sıradaki ve sonraki vakit', en: 'One line · next and following prayer', ar: 'سطر واحد · التالية والتي تليها' } },
];

export function WidgetPinRow() {
  const { lang } = useI18n();
  const lg = lang as Lang;
  const [supported] = useState(widgetPinSupported);
  const [count, setCount] = useState(widgetCount);
  const [open, setOpen] = useState(false);
  const [asked, setAsked] = useState(false);
  const [exact, setExact] = useState(true);
  const refresh = useCallback(() => {
    setCount(widgetCount());
    exactAlarmGranted().then(setExact).catch(() => undefined);
  }, []);
  // İzin durumu açılışta bir kez (sonuç sonradan gelir; doğrudan setState yok)
  useEffect(() => { exactAlarmGranted().then(setExact).catch(() => undefined); }, []);
  useEffect(() => {
    const sub = AppState.addEventListener('change', (s) => s === 'active' && refresh());
    return () => sub.remove();
  }, [refresh]);
  if (!supported) return null;
  const sub = asked ? pick(L.manual, lg) : count > 0 ? pick(L.added, lg).replace('{n}', String(count)) : pick(L.sub, lg);
  return (
    <View>
      <ListRow title={pick(L.title, lg)} subtitle={sub} onPress={() => setOpen((v) => !v)} left={<Icon name="plus" color={C.accent} />} />
      {count > 0 && !exact && (
        <Pressable accessibilityRole="button" onPress={() => askExactAlarm().then((ok) => { setExact(ok); if (ok) refreshWidgetTicks(); })}
          style={{ paddingLeft: 12, paddingBottom: 8 }}>
          <Text style={{ fontSize: fs(12.5), color: C.limited }}>{pick(L.exact, lg)}</Text>
        </Pressable>
      )}
      {open && (
        <View style={{ gap: 6, paddingLeft: 12, paddingBottom: 6 }}>
          {SIZES.map((w) => (
            <Pressable key={w.name} accessibilityRole="button" accessibilityLabel={pick(w.title, lg)}
              onPress={() => { pinPrayerWidget(w.name); setAsked(true); setTimeout(refresh, 4000); }}
              style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, paddingHorizontal: 12, borderRadius: 14, backgroundColor: pressed ? C.accentTint : C.surface })}>
              <Icon name={w.icon} size={18} color={C.accent} />
              <View style={{ flex: 1, gap: 1 }}>
                <Text style={{ fontSize: fs(14.5), fontWeight: '700', color: C.ink }}>{pick(w.title, lg)}</Text>
                <Text style={{ fontSize: fs(12.5), color: C.muted }}>{pick(w.sub, lg)}</Text>
              </View>
              <Icon name="plus" size={16} color={C.muted} />
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}
