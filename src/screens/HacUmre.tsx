// Hac ve umre bölümü (0.25.0): umre ve hac rehberi, tavaf, sa'y, cemerat, hac yerleri, kapılar, hazırlık ve erişim
// tek sayfada büyük düğmelerle. Alt sekmeye konabilir (Ayarlar → Alt sekmeler) ya da /hac-umre ile açılır.
import { router } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon, type IconName } from '@/components/Icon';
import { Header, T } from '@/components/ui';
import { C, fs } from '@/constants/theme';
import type { ML } from '@/data/sites';
import { pick, useI18n } from '@/i18n';

const L = {
  title: { tr: 'Hac ve umre', en: 'Hajj and Umrah', ar: 'الحج والعمرة' },
  sub: { tr: 'Rehberler, sayaçlar ve haritalar', en: 'Guides, counters and maps', ar: 'الأدلة والعدادات والخرائط' },
  note: { tr: 'Rehberler Diyanet kaynaklıdır; henüz bir ilahiyatçı kontrolünden geçmedi.', en: 'Guides are based on Diyanet sources; not yet reviewed by a scholar.', ar: 'الأدلة من مصادر رئاسة الشؤون الدينية؛ لم تُراجَع بعدُ من عالم.' },
} satisfies Record<string, ML>;

const ITEMS: { icon: IconName; title: ML; sub: ML; to: string }[] = [
  { icon: 'list', title: { tr: 'Umre rehberi', en: 'Umrah guide', ar: 'دليل العمرة' }, sub: { tr: 'Mîkattan tıraşa adım adım', en: 'Step by step, from miqat to shaving', ar: 'خطوة بخطوة من الميقات إلى الحلق' }, to: '/umre' },
  { icon: 'sun', title: { tr: 'Hac rehberi', en: 'Hajj guide', ar: 'دليل الحج' }, sub: { tr: 'Gün gün yapılacaklar', en: 'What to do, day by day', ar: 'الأعمال يومًا بيوم' }, to: '/hac' },
  { icon: 'kaaba', title: { tr: 'Tavaf asistanı', en: 'Tawaf assistant', ar: 'مساعد الطواف' }, sub: { tr: 'Şavt sayacı ve dualar', en: 'Lap counter and du‘as', ar: 'عدّاد الأشواط والأدعية' }, to: '/tavaf' },
  { icon: 'walk', title: { tr: 'Sa’y sayacı', en: 'Sa‘y counter', ar: 'عدّاد السعي' }, sub: { tr: 'Safâ ile Merve arası 7 şavt', en: '7 laps between Safa and Marwah', ar: 'سبعة أشواط بين الصفا والمروة' }, to: '/say' },
  { icon: 'flag', title: { tr: 'Şeytan taşlama', en: 'Jamarat', ar: 'رمي الجمرات' }, sub: { tr: 'Taş sayacı ve atış vakti', en: 'Pebble counter and throwing times', ar: 'عدّاد الحصى وأوقات الرمي' }, to: '/cemerat' },
  { icon: 'map', title: { tr: 'Hac yerleri', en: 'Hajj sites', ar: 'المشاعر' }, sub: { tr: 'Arafat, Müzdelife, Mina; sınırın içinde misiniz', en: 'Arafat, Muzdalifah, Mina; are you inside', ar: 'عرفات ومزدلفة ومنى' }, to: '/hac-harita' },
  { icon: 'gate', title: { tr: 'Kapılar', en: 'Gates', ar: 'الأبواب' }, sub: { tr: 'Mescid-i Haram ve Mescid-i Nebevî', en: 'Masjid al-Haram and the Prophet’s Mosque', ar: 'المسجد الحرام والمسجد النبوي' }, to: '/kapilar' },
  { icon: 'check', title: { tr: 'Hazırlık listesi', en: 'Packing list', ar: 'قائمة التجهيز' }, sub: { tr: 'Yola çıkmadan', en: 'Before you travel', ar: 'قبل السفر' }, to: '/hazirlik' },
  { icon: 'wheel', title: { tr: 'Tekerlekli sandalye, golf arabası', en: 'Wheelchairs and golf carts', ar: 'الكراسي المتحركة وعربات القولف' }, sub: { tr: 'Yaşlı ve engelli ziyaretçiler için', en: 'For elderly and disabled visitors', ar: 'لكبار السن وذوي الإعاقة' }, to: '/erisim' },
];

export default function HacUmre({ back = false }: { back?: boolean }) {
  const { lang } = useI18n();
  const insets = useSafeAreaInsets();
  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.bg }} contentContainerStyle={{ padding: 16, paddingTop: insets.top + 8, paddingBottom: insets.bottom + 32, gap: 8 }}>
      <Header back={back} title={pick(L.title, lang)} subtitle={pick(L.sub, lang)} />
      {ITEMS.map((it) => (
        <Pressable key={it.to} onPress={() => router.push(it.to as never)} accessibilityRole="button"
          style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 14, minHeight: 68, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 16, backgroundColor: C.surface, opacity: pressed ? 0.8 : 1 })}>
          <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: C.accentSoft, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name={it.icon} size={22} color={C.accent} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: fs(16), fontWeight: '700', color: C.ink }}>{pick(it.title, lang)}</Text>
            <Text style={T.small} numberOfLines={2}>{pick(it.sub, lang)}</Text>
          </View>
          <Icon name="chevron" size={18} color={C.muted} />
        </Pressable>
      ))}
      <Text style={[T.small, { marginTop: 8 }]}>{pick(L.note, lang)}</Text>
    </ScrollView>
  );
}
