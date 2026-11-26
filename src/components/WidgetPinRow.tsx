// "Ana ekrana vakit kutusu ekle": yalnız Android'de ve başlatıcı destekliyorsa görünür. Dokununca dört boy
// açılır (küçük, orta, liste, şerit); seçilen boy için başlatıcının onay penceresi açılır.
import { useCallback, useEffect, useState } from 'react';
import { AppState, Pressable, Text, View } from 'react-native';

import { Icon, type IconName } from '@/components/Icon';
import { ListRow } from '@/components/ui';
import { C, fs } from '@/constants/theme';
import { pick, useI18n } from '@/i18n';
import type { Lang } from '@/i18n/strings';
import { pinPrayerWidget, widgetCount, widgetPinSupported, type WidgetName } from '@/services/widgetSync';

type T3 = { tr: string; en: string; ar: string };
const L = {
  title: { tr: 'Ana ekrana vakit kutusu ekle', en: 'Add prayer times to home screen', ar: 'أضف المواقيت إلى الشاشة الرئيسية' },
  sub: { tr: 'Dört boy: küçük, orta, liste ve ince şerit', en: 'Four sizes: small, medium, list and slim strip', ar: 'أربعة أحجام: صغير ومتوسط وقائمة وشريط' },
  added: { tr: 'Ana ekranda {n} tane ✓ · başka boy eklemek için dokunun', en: '{n} on your home screen ✓ · tap to add another size', ar: '{n} على الشاشة ✓ · اضغط لإضافة حجم آخر' },
  manual: { tr: 'Olmadıysa: ana ekranda boş yere basılı tutun → Widget’lar → MATAF', en: 'If nothing happened: long-press the home screen → Widgets → MATAF', ar: 'إن لم يحدث شيء: اضغط مطولًا على الشاشة الرئيسية ← الأدوات ← MATAF' },
};
const SIZES: { name: WidgetName; icon: IconName; title: T3; sub: T3 }[] = [
  { name: 'NextPrayerWidget', icon: 'clock', title: { tr: 'Küçük · sıradaki vakit', en: 'Small · next prayer', ar: 'صغير · الصلاة التالية' }, sub: { tr: '2×2 · büyük saat, ardından gelen vakit', en: '2×2 · large time and the one after', ar: '2×2 · وقت كبير والتي تليها' } },
  { name: 'PrayerWidget', icon: 'grid', title: { tr: 'Orta · günün vakitleri', en: 'Medium · today’s times', ar: 'متوسط · مواقيت اليوم' }, sub: { tr: '4×2 · sıradaki vakit ve altı vakit yan yana', en: '4×2 · next prayer and all six side by side', ar: '4×2 · التالية والمواقيت الستة' } },
  { name: 'PrayerListWidget', icon: 'list', title: { tr: 'Liste · alt alta', en: 'List · stacked', ar: 'قائمة · عمودية' }, sub: { tr: '2×3 · altı vakit alt alta, okuması en kolay', en: '2×3 · six times stacked, easiest to read', ar: '2×3 · المواقيت الستة عموديًا' } },
  { name: 'PrayerStripWidget', icon: 'minus', title: { tr: 'İnce şerit', en: 'Slim strip', ar: 'شريط رفيع' }, sub: { tr: '4×1 · sıradaki ve sonraki vakit tek satırda', en: '4×1 · next and following prayer in one line', ar: '4×1 · التالية والتي تليها في سطر' } },
];

export function WidgetPinRow() {
  const { lang } = useI18n();
  const lg = lang as Lang;
  const [supported] = useState(widgetPinSupported);
  const [count, setCount] = useState(widgetCount);
  const [open, setOpen] = useState(false);
  const [asked, setAsked] = useState(false);
  const refresh = useCallback(() => setCount(widgetCount()), []);
  useEffect(() => {
    const sub = AppState.addEventListener('change', (s) => s === 'active' && refresh());
    return () => sub.remove();
  }, [refresh]);
  if (!supported) return null;
  const sub = asked ? pick(L.manual, lg) : count > 0 ? pick(L.added, lg).replace('{n}', String(count)) : pick(L.sub, lg);
  return (
    <View>
      <ListRow title={pick(L.title, lg)} subtitle={sub} onPress={() => setOpen((v) => !v)} left={<Icon name="plus" color={C.accent} />} />
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
