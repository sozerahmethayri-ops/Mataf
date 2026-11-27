// Menü: uygulamadaki bütün ekranlar tek yerde, gruplu.
import { router } from 'expo-router';
import { useState } from 'react';
import { Linking, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon, type IconName } from '@/components/Icon';
import { shareApp } from '@/services/shareApp';
import { C, fs } from '@/constants/theme';
import { RAWDAH } from '@/data/content';
import { pick, useI18n } from '@/i18n';

type Lang = 'tr' | 'en' | 'ar';
// sos: kırmızı yazılır (Acil durum); öbürlerinin simgesi tek renk (renkli simge zeminleri şablon gibi duruyordu, 0.13.5)
type Item = { icon: IconName; title: { tr: string; en: string; ar: string }; to?: string; url?: string; sos?: boolean };
// Sade menü: her ekran bir kez, grup başına en çok sekiz satır; başka ekranlardan açılanlar (kapı bildir, Ravza 360°, okuma
// ayarları, veri kaynakları, yol tarifi, ezan bildirimleri) yalnız aramada çıkar.
const GROUPS: { title: { tr: string; en: string; ar: string }; items: Item[] }[] = [
  {
    title: { tr: 'İbadet', en: 'Worship', ar: 'العبادة' },
    items: [
      { icon: 'clock', title: { tr: 'Namaz vakitleri', en: 'Prayer times', ar: 'مواقيت الصلاة' }, to: '/vakitler' },
      { icon: 'check', title: { tr: 'Namaz takibi', en: 'Prayer tracker', ar: 'متابعة الصلاة' }, to: '/namaz-takibi' },
      { icon: 'book', title: { tr: "Kur'an-ı Kerîm", en: 'The Quran', ar: 'القرآن الكريم' }, to: '/kuran' },
      { icon: 'bookmark', title: { tr: 'Hatim planı', en: 'Khatm plan', ar: 'خطة الختمة' }, to: '/hatim' },
      { icon: 'compass', title: { tr: 'Kıble', en: 'Qibla', ar: 'القبلة' }, to: '/kible' },
      { icon: 'beads', title: { tr: 'Zikirmatik', en: 'Dhikr counter', ar: 'المسبحة' }, to: '/zikir' },
      { icon: 'moon', title: { tr: 'Hadis ve dualar', en: 'Hadith and du‘as', ar: 'الحديث والدعاء' }, to: '/hadis-dua' },
      { icon: 'counter', title: { tr: 'Kaza takibi', en: 'Missed prayers', ar: 'قضاء الصلوات' }, to: '/kaza' },
    ],
  },
  {
    title: { tr: 'Umre ve hac', en: 'Umrah and Hajj', ar: 'العمرة والحج' },
    items: [
      { icon: 'list', title: { tr: 'Umre rehberi', en: 'Umrah guide', ar: 'دليل العمرة' }, to: '/umre' },
      { icon: 'sun', title: { tr: 'Hac rehberi', en: 'Hajj guide', ar: 'دليل الحج' }, to: '/hac' },
      { icon: 'kaaba', title: { tr: 'Tavaf', en: 'Tawaf', ar: 'الطواف' }, to: '/tavaf' },
      { icon: 'walk', title: { tr: 'Sa’y', en: 'Sa‘y', ar: 'السعي' }, to: '/say' },
      { icon: 'flag', title: { tr: 'Şeytan taşlama', en: 'Jamarat', ar: 'رمي الجمرات' }, to: '/cemerat' },
      { icon: 'map', title: { tr: 'Hac yerleri', en: 'Hajj sites', ar: 'المشاعر' }, to: '/hac-harita' },
    ],
  },
  {
    title: { tr: 'Mekke ve Medine', en: 'Makkah and Madinah', ar: 'مكة والمدينة' },
    items: [
      { icon: 'map', title: { tr: 'Harem haritası', en: 'Haram map', ar: 'خريطة الحرم' }, to: '/harita' },
      { icon: 'gate', title: { tr: 'Kapılar', en: 'Gates', ar: 'الأبواب' }, to: '/kapilar' },
      { icon: 'search', title: { tr: 'Mescitte ara', en: 'Find in the mosque', ar: 'ابحث في المسجد' }, to: '/arama' },
      { icon: 'star', title: { tr: 'Ravza', en: 'Rawdah', ar: 'الروضة' }, to: '/ravza' },
      { icon: 'list', title: { tr: 'Medine rehberi', en: 'Madinah guide', ar: 'دليل المدينة' }, to: '/medine-rehber' },
      { icon: 'hospital', title: { tr: 'Şehir haritası', en: 'City map', ar: 'خريطة المدينة' }, to: '/sehir' },
    ],
  },
  {
    title: { tr: 'Yolculuk', en: 'On the way', ar: 'في الطريق' },
    items: [
      { icon: 'pin', title: { tr: 'En yakın cami', en: 'Nearest mosque', ar: 'أقرب مسجد' }, to: '/cami' },
      { icon: 'hotel', title: { tr: 'Otelime dön', en: 'Back to hotel', ar: 'العودة إلى الفندق' }, to: '/otel' },
      { icon: 'users', title: { tr: 'Aile ve grup', en: 'Family & group', ar: 'العائلة والمجموعة' }, to: '/grup' },
      { icon: 'bus', title: { tr: 'Ulaşım', en: 'Transport', ar: 'التنقل' }, to: '/ulasim' },
      { icon: 'pin', title: { tr: 'Yerlerim (çadır, buluşma)', en: 'My places', ar: 'أماكني' }, to: '/yerlerim' },
      { icon: 'list', title: { tr: 'Hazırlık listesi', en: 'Packing list', ar: 'قائمة التجهيز' }, to: '/hazirlik' },
      { icon: 'text', title: { tr: 'Arapça ifadeler', en: 'Arabic phrases', ar: 'عبارات عربية' }, to: '/arapca' },
      { icon: 'settings', title: { tr: 'Ayarlar', en: 'Settings', ar: 'الإعدادات' }, to: '/ayarlar' },
    ],
  },
];

// Yalnız aramada görünenler (ek anahtar sözcüklerle)
const EXTRA: Item[] = [
  { icon: 'bell', title: { tr: 'Ezan bildirimleri', en: 'Adhan notifications', ar: 'إشعارات الأذان' }, to: '/bildirimler' },
  { icon: 'alert', title: { tr: 'Kapı bildir', en: 'Report a gate', ar: 'الإبلاغ عن باب' }, to: '/bildir' },
  { icon: 'tour', title: { tr: 'Ravza 360°', en: 'Rawdah 360°', ar: 'الروضة ٣٦٠°' }, url: RAWDAH.tourUrl },
  { icon: 'text', title: { tr: "Kur'an okuma ayarları", en: 'Quran reading settings', ar: 'إعدادات القراءة' }, to: '/kuran-ayarlar' },
  { icon: 'text', title: { tr: 'Tecvid kuralları (renkli Kur’an)', en: 'Tajweed rules', ar: 'أحكام التجويد' }, to: '/tecvid' },
  { icon: 'layers', title: { tr: 'İnternetsiz paket (çevrimdışı)', en: 'Offline pack', ar: 'الحزمة دون اتصال' }, to: '/cevrimdisi' },
  { icon: 'data', title: { tr: 'Veri kaynakları', en: 'Data sources', ar: 'مصادر البيانات' }, to: '/veriler' },
  { icon: 'nav', title: { tr: 'Yol tarifi (mescit içi)', en: 'Directions (in the mosque)', ar: 'الاتجاهات' }, to: '/navigasyon' },
  { icon: 'train', title: { tr: 'Haremeyn treni (Mekke–Cidde–Medine)', en: 'Haramain train', ar: 'قطار الحرمين' }, to: '/tren' },
  { icon: 'wheel', title: { tr: 'Tekerlekli sandalye, golf arabası (yaşlı ve engelli)', en: 'Wheelchairs and golf carts (elderly, disabled)', ar: 'الكراسي المتحركة وعربات القولف' }, to: '/erisim' },
  { icon: 'share', title: { tr: 'Uygulamayı paylaş (arkadaşlarına gönder)', en: 'Share the app', ar: 'شارك التطبيق' }, to: 'share:app' },
  { icon: 'sos', title: { tr: 'Acil durum', en: 'Emergency', ar: 'الطوارئ' }, to: '/acil', sos: true },
  { icon: 'palette', title: { tr: 'Tema, renk, yazı boyutu', en: 'Theme, colours, text size', ar: 'المظهر وحجم الخط' }, to: '/ayarlar' },
];
const ALL: Item[] = [...GROUPS.flatMap((g) => g.items), ...EXTRA];
// Türkçe büyük/küçük harf ve şapkalardan bağımsız karşılaştırma
function fold(x: string) {
  let y = x.toLowerCase();
  try { y = x.toLocaleLowerCase('tr').normalize('NFD'); } catch { /* eski motor: düz küçük harf */ }
  return y.replace(/[\u0300-\u036f]/g, '').replace(/ı/g, 'i').replace(/[’'‘]/g, '');
}

export default function Menu() {
  const { lang } = useI18n();
  const lg = lang as Lang;
  const insets = useSafeAreaInsets();
  const [q, setQ] = useState('');
  const fq = fold(q.trim());
  const found = fq ? ALL.filter((it) => [it.title.tr, it.title.en, it.title.ar].some((x) => fold(x).includes(fq))) : null;
  const open = (it: Item) => (it.url ? Linking.openURL(it.url) : it.to === 'share:app' ? shareApp(lg) : router.push(it.to as never));
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
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, height: 46, paddingHorizontal: 14, borderRadius: 23, backgroundColor: C.surface }}>
        <Icon name="search" size={18} color={C.muted} />
        <TextInput value={q} onChangeText={setQ} placeholder={lg === 'en' ? 'Search' : lg === 'ar' ? 'بحث' : 'Ara'} placeholderTextColor={C.muted}
          style={{ flex: 1, fontSize: fs(15), color: C.ink }} returnKeyType="search" autoCorrect={false} accessibilityLabel={lg === 'en' ? 'Search the menu' : lg === 'ar' ? 'بحث في القائمة' : 'Menüde ara'} />
        {!!q && <Pressable onPress={() => setQ('')} accessibilityRole="button" accessibilityLabel="✕" hitSlop={10}><Icon name="close" size={16} color={C.muted} /></Pressable>}
      </View>
      {found ? (
        found.length === 0
          ? <Text style={{ fontSize: fs(14), color: C.muted, paddingVertical: 8 }}>{lg === 'en' ? 'Nothing found' : lg === 'ar' ? 'لا نتائج' : 'Bulunamadı'}</Text>
          : <View style={listBox()}>{found.map((it, i) => <Row key={it.title.tr} it={it} lg={lg} first={i === 0} onPress={() => open(it)} />)}</View>
      ) : GROUPS.map((g) => (
        <View key={g.title.tr} style={{ gap: 8 }}>
          <Text style={{ fontSize: fs(14), fontWeight: '700', color: C.accent }} accessibilityRole="header">{pick(g.title, lg)}</Text>
          <View style={listBox()}>{g.items.map((it, i) => <Row key={it.title.tr} it={it} lg={lg} first={i === 0} onPress={() => open(it)} />)}</View>
        </View>
      ))}
    </ScrollView>
  );
}

// Grup kutusu: Vakitler listesiyle aynı ince çerçeve (renk çizim anında okunur; tema değişebilir)
const listBox = () => ({ borderWidth: 1, borderColor: C.border, borderRadius: 18, paddingHorizontal: 14 });

/** Menü satırı: simge, ad, ok; dokunma alanı 52 px. */
function Row({ it, lg, first, onPress }: { it: Item; lg: Lang; first: boolean; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress}
      style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 14, minHeight: 52, paddingVertical: 6, borderTopWidth: first ? 0 : 1, borderTopColor: C.border, opacity: pressed ? 0.7 : 1 })}>
      <Icon name={it.icon} size={20} color={it.sos ? C.closed : C.accent} />
      <Text style={{ flex: 1, fontSize: fs(15.5), fontWeight: '600', color: it.sos ? C.closed : C.ink }}>{pick(it.title, lg)}</Text>
      <Icon name="chevron" size={16} color={C.muted} />
    </Pressable>
  );
}
