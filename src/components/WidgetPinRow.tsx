// "Ana ekrana vakit küçük uygulaması ekle" satırı: yalnız Android'de ve başlatıcı destekliyorsa görünür.
// Dokununca başlatıcının onay penceresi açılır; eklendiyse "ana ekranda" yazar.
import { useCallback, useEffect, useState } from 'react';
import { AppState } from 'react-native';

import { Icon } from '@/components/Icon';
import { ListRow } from '@/components/ui';
import { C } from '@/constants/theme';
import { pick, useI18n } from '@/i18n';
import type { Lang } from '@/i18n/strings';
import { pinPrayerWidget, widgetCount, widgetPinSupported } from '@/services/widgetSync';

const L = {
  title: { tr: 'Ana ekrana vakit kutusu ekle', en: 'Add prayer times to home screen', ar: 'أضف المواقيت إلى الشاشة الرئيسية' },
  sub: { tr: 'Bugünün vakitleri ve sıradaki namaz, uygulamayı açmadan', en: 'Today’s times and the next prayer at a glance', ar: 'مواقيت اليوم والصلاة التالية دون فتح التطبيق' },
  added: { tr: 'Ana ekranda ✓ · bir tane daha eklemek için dokunun', en: 'On your home screen ✓ · tap to add another', ar: 'موجودة على الشاشة ✓ · اضغط لإضافة أخرى' },
  manual: { tr: 'Olmadıysa: ana ekranda boş yere basılı tutun → Widget’lar → MATAF', en: 'If nothing happened: long-press the home screen → Widgets → MATAF', ar: 'إن لم يحدث شيء: اضغط مطولًا على الشاشة الرئيسية ← الأدوات ← MATAF' },
};

export function WidgetPinRow() {
  const { lang } = useI18n();
  const lg = lang as Lang;
  const [supported] = useState(widgetPinSupported);
  const [count, setCount] = useState(widgetCount);
  const [asked, setAsked] = useState(false);
  const refresh = useCallback(() => setCount(widgetCount()), []);
  useEffect(() => {
    const sub = AppState.addEventListener('change', (s) => s === 'active' && refresh());
    return () => sub.remove();
  }, [refresh]);
  if (!supported) return null;
  const sub = count > 0 ? pick(L.added, lg) : asked ? pick(L.manual, lg) : pick(L.sub, lg);
  return (
    <ListRow
      title={pick(L.title, lg)}
      subtitle={sub}
      onPress={() => { pinPrayerWidget(); setAsked(true); setTimeout(refresh, 4000); }}
      left={<Icon name="plus" color={C.accent} />}
    />
  );
}
