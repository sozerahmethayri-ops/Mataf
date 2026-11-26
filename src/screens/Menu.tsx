// Menü: uygulamadaki bütün ekranlar tek yerde, gruplu.
import { router } from 'expo-router';
import { Linking, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon, type IconName } from '@/components/Icon';
import { C, fs } from '@/constants/theme';
import { RAWDAH } from '@/data/content';
import { pick, useI18n } from '@/i18n';

type Lang = 'tr' | 'en' | 'ar';
type Item = { icon: IconName; title: { tr: string; en: string; ar: string }; to?: string; url?: string; tint?: string };
const GROUPS: { title: { tr: string; en: string; ar: string }; items: Item[] }[] = [
  {
    title: { tr: 'İbadet', en: 'Worship', ar: 'العبادة' },
    items: [
      { icon: 'clock', title: { tr: 'Namaz vakitleri', en: 'Prayer times', ar: 'مواقيت الصلاة' }, to: '/vakitler' },
      { icon: 'list', title: { tr: 'Umre rehberi', en: 'Umrah guide', ar: 'دليل العمرة' }, to: '/umre' },
      { icon: 'sun', title: { tr: 'Hac rehberi', en: 'Hajj guide', ar: 'دليل الحج' }, to: '/hac' },
      { icon: 'compass', title: { tr: 'Kıble', en: 'Qibla', ar: 'القبلة' }, to: '/kible' },
      { icon: 'beads', title: { tr: 'Zikirmatik', en: 'Dhikr counter', ar: 'المسبحة' }, to: '/zikir' },
      { icon: 'check', title: { tr: 'Kaza namazı ve oruç takibi', en: 'Missed prayers and fasts', ar: 'قضاء الصلوات والصيام' }, to: '/kaza' },
      { icon: 'book', title: { tr: "Kur'an-ı Kerîm", en: 'The Quran', ar: 'القرآن الكريم' }, to: '/kuran' },
      { icon: 'moon', title: { tr: 'Hadis ve dualar', en: 'Hadith and du‘as', ar: 'الحديث والدعاء' }, to: '/hadis-dua' },
      { icon: 'pin', title: { tr: 'En yakın cami', en: 'Nearest mosque', ar: 'أقرب مسجد' }, to: '/cami', tint: '#277F4C' },
      { icon: 'bell', title: { tr: 'Ezan bildirimleri', en: 'Adhan notifications', ar: 'إشعارات الأذان' }, to: '/bildirimler' },
    ],
  },
  {
    title: { tr: 'Mekke ve Medine', en: 'Makkah and Madinah', ar: 'مكة والمدينة' },
    items: [
      { icon: 'map', title: { tr: 'Haram / Nebevî haritası', en: 'Haram / Nabawi map', ar: 'خريطة الحرم' }, to: '/harita' },
      { icon: 'kaaba', title: { tr: 'Tavaf asistanı', en: 'Tawaf assistant', ar: 'مساعد الطواف' }, to: '/tavaf' },
      { icon: 'walk', title: { tr: 'Sa’y sayacı', en: 'Sa‘y counter', ar: 'عدّاد السعي' }, to: '/say' },
      { icon: 'flag', title: { tr: 'Şeytan taşlama sayacı', en: 'Jamarat counter', ar: 'عداد الجمرات' }, to: '/cemerat' },
      { icon: 'map', title: { tr: 'Hac yerleri haritası', en: 'Hajj sites map', ar: 'خريطة المشاعر' }, to: '/hac-harita' },
      { icon: 'hotel', title: { tr: 'Otelime dön', en: 'Back to my hotel', ar: 'العودة إلى فندقي' }, to: '/otel' },
      { icon: 'users', title: { tr: 'Aile ve grup konumu', en: 'Family & group location', ar: 'موقع العائلة والمجموعة' }, to: '/grup' },
      { icon: 'gate', title: { tr: 'Kapı durumu', en: 'Gate status', ar: 'حالة الأبواب' }, to: '/kapilar' },
      { icon: 'alert', title: { tr: 'Kapı bildir', en: 'Report a gate', ar: 'الإبلاغ عن باب' }, to: '/bildir' },
      { icon: 'nav', title: { tr: 'Yol tarifi (mescit içi)', en: 'Directions (in the mosque)', ar: 'الاتجاهات' }, to: '/navigasyon' },
      { icon: 'search', title: { tr: 'Mescitte ara (tuvalet, su, asansör…)', en: 'Find in the mosque', ar: 'ابحث في المسجد' }, to: '/arama' },
      { icon: 'star', title: { tr: 'Ravza rehberi', en: 'Rawdah guide', ar: 'دليل الروضة' }, to: '/ravza' },
      { icon: 'tour', title: { tr: 'Ravza 360°', en: 'Rawdah 360°', ar: 'الروضة ٣٦٠°' }, url: RAWDAH.tourUrl },
      { icon: 'list', title: { tr: 'Medine rehberi', en: 'Madinah guide', ar: 'دليل المدينة' }, to: '/medine-rehber' },
      { icon: 'hotel', title: { tr: 'Şehir haritası (otel, eczane, hastane)', en: 'City map', ar: 'خريطة المدينة' }, to: '/sehir' },
    ],
  },
  {
    title: { tr: 'Ulaşım', en: 'Getting around', ar: 'التنقل' },
    items: [
      { icon: 'bus', title: { tr: 'Ulaşım ve harita', en: 'Transport and map', ar: 'التنقل والخريطة' }, to: '/ulasim' },
    ],
  },
  {
    title: { tr: 'Uygulama', en: 'App', ar: 'التطبيق' },
    items: [
      { icon: 'settings', title: { tr: 'Ayarlar', en: 'Settings', ar: 'الإعدادات' }, to: '/ayarlar' },
      { icon: 'text', title: { tr: "Kur'an okuma ayarları", en: 'Quran reading settings', ar: 'إعدادات القراءة' }, to: '/kuran-ayarlar' },
      { icon: 'layers', title: { tr: 'Çevrimdışı paket', en: 'Offline pack', ar: 'الحزمة دون اتصال' }, to: '/cevrimdisi' },
      { icon: 'data', title: { tr: 'Veri kaynakları', en: 'Data sources', ar: 'مصادر البيانات' }, to: '/veriler' },
    ],
  },
];

export default function Menu() {
  const { lang } = useI18n();
  const lg = lang as Lang;
  const insets = useSafeAreaInsets();
  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.bg }} contentContainerStyle={{ paddingTop: insets.top + 12, paddingHorizontal: 16, paddingBottom: 28, gap: 18 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <Text style={{ flex: 1, fontSize: fs(26), fontWeight: '700', color: C.ink, letterSpacing: -0.3 }}>{lg === 'ar' ? 'القائمة' : lg === 'en' ? 'Menu' : 'Menü'}</Text>
        <Pressable onPress={() => router.push('/acil')} accessibilityRole="button" accessibilityLabel={lg === 'en' ? 'Emergency' : lg === 'ar' ? 'الطوارئ' : 'Acil durum'}
          style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 6, height: 38, paddingHorizontal: 14, borderRadius: 19, backgroundColor: C.closed, opacity: pressed ? 0.85 : 1 })}>
          <Icon name="sos" size={16} color="#FFFFFF" />
          <Text style={{ fontSize: fs(14), fontWeight: '800', color: '#FFFFFF' }}>{lg === 'en' ? 'Emergency' : lg === 'ar' ? 'الطوارئ' : 'Acil durum'}</Text>
        </Pressable>
      </View>
      {GROUPS.map((g) => (
        <View key={g.title.tr} style={{ gap: 8 }}>
          <Text style={{ fontSize: fs(12), fontWeight: '700', color: C.muted, textTransform: 'uppercase', letterSpacing: 0.7 }}>{pick(g.title, lg)}</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
            {g.items.map((it) => (
              <Pressable key={it.title.tr} accessibilityRole="button" onPress={() => (it.url ? Linking.openURL(it.url) : router.push(it.to as never))}
                style={({ pressed }) => ({ width: '31%', minHeight: 96, padding: 10, borderRadius: 16, backgroundColor: C.surface, gap: 8, justifyContent: 'space-between', opacity: pressed ? 0.75 : 1 })}>
                <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name={it.icon} size={19} color={it.tint ?? C.accent} />
                </View>
                <Text style={{ fontSize: fs(12.5), fontWeight: '600', color: C.ink, lineHeight: fs(16) }} numberOfLines={3}>{pick(it.title, lg)}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      ))}
    </ScrollView>
  );
}
