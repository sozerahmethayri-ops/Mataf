import Constants from 'expo-constants';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, Linking, Platform, Pressable, Text, View } from 'react-native';

import { Icon } from '@/components/Icon';
import { Card, Header, ListRow, Screen, SectionTitle, Segmented, T, Toggle } from '@/components/ui';
import { WidgetPinRow } from '@/components/WidgetPinRow';
import { exportBackup, importBackup } from '@/services/backup';
import { C, PALETTES, colorsFor, fs, fsAr, type PaletteId, type ThemeMode } from '@/constants/theme';
import { pick, useI18n } from '@/i18n';
import { LANGS } from '@/i18n/strings';
import { SOUNDS, type NotifPrefs } from '@/services/adhanPlan';
import { loadNotifPrefs } from '@/services/adhanNotify';
import { METHODS, getMethod, setMethod, type MethodId } from '@/services/prayer';
import { useReports } from '@/services/ReportsContext';
import { useTheme, type HomeId } from '@/services/ThemeContext';

type Lang = 'tr' | 'en' | 'ar';
const TEXT_STEPS: { v: number; l: { tr: string; en: string; ar: string } }[] = [
  { v: 0.9, l: { tr: 'Küçük', en: 'Small', ar: 'صغير' } },
  { v: 1, l: { tr: 'Normal', en: 'Normal', ar: 'عادي' } },
  { v: 1.15, l: { tr: 'Büyük', en: 'Large', ar: 'كبير' } },
  { v: 1.3, l: { tr: 'Çok büyük', en: 'Larger', ar: 'أكبر' } },
];
const AR_STEPS: { v: number; l: string }[] = [{ v: 0.85, l: 'A−' }, { v: 1, l: 'A' }, { v: 1.2, l: 'A+' }, { v: 1.4, l: 'A++' }, { v: 1.6, l: 'A+++' }];
const HOMES: { id: HomeId; l: { tr: string; en: string; ar: string } }[] = [
  { id: 'vakit', l: { tr: 'Sade ezan vakitleri (önerilen)', en: 'Minimal prayer times (recommended)', ar: 'مواقيت الصلاة المبسطة' } },
  { id: 'vakitler', l: { tr: 'Ayrıntılı namaz vakitleri', en: 'Detailed prayer times', ar: 'مواقيت الصلاة المفصلة' } },
  { id: 'kuran', l: { tr: "Kur'an-ı Kerîm", en: 'The Quran', ar: 'القرآن الكريم' } },
  { id: 'harita', l: { tr: 'Haram / Nebevî haritası', en: 'Haram / Nabawi map', ar: 'خريطة الحرم' } },
  { id: 'tavaf', l: { tr: 'Tavaf asistanı', en: 'Tawaf assistant', ar: 'مساعد الطواف' } },
  { id: 'zikir', l: { tr: 'Zikirmatik', en: 'Dhikr counter', ar: 'المسبحة' } },
  { id: 'hadis', l: { tr: 'Hadis ve dualar', en: 'Hadith and du‘as', ar: 'الحديث والدعاء' } },
];

const L = {
  look: { tr: 'Görünüm', en: 'Appearance', ar: 'المظهر' },
  light: { tr: 'Açık', en: 'Light', ar: 'فاتح' },
  dark: { tr: 'Koyu', en: 'Dark', ar: 'داكن' },
  system: { tr: 'Sistem', en: 'System', ar: 'النظام' },
  palette: { tr: 'Renk paleti', en: 'Color palette', ar: 'لوحة الألوان' },
  notif: { tr: 'Ezan bildirimleri', en: 'Adhan notifications', ar: 'إشعارات الأذان' },
  notifOff: { tr: 'Kapalı', en: 'Off', ar: 'مغلق' },
  before: { tr: 'dk önce', en: 'min before', ar: 'دقيقة قبل' },
  atTime: { tr: 'vaktinde', en: 'at adhan time', ar: 'عند الأذان' },
  text: { tr: 'Yazı boyutu', en: 'Text size', ar: 'حجم الخط' },
  arabic: { tr: 'Arapça yazı boyutu (Kur’an, dua)', en: 'Arabic text size (Quran, du‘a)', ar: 'حجم الخط العربي' },
  sample: { tr: 'Örnek: Bugün öğle namazı 12:08’de.', en: 'Sample: Dhuhr today is at 12:08.', ar: 'مثال: الظهر اليوم الساعة ١٢:٠٨' },
  home: { tr: 'Ana sayfa', en: 'Home screen', ar: 'الصفحة الرئيسية' },
  homeNote: { tr: 'Alttaki ortadaki düğme bu ekranı açar.', en: 'The middle button at the bottom opens this screen.', ar: 'الزر الأوسط في الأسفل يفتح هذه الشاشة.' },
  behaviour: { tr: 'Kullanım', en: 'Behaviour', ar: 'الاستخدام' },
  map3d: { tr: 'Haram/Nebevî haritası 3D açılsın', en: 'Open the Haram/Nabawi map in 3D', ar: 'فتح الخريطة ثلاثية الأبعاد' },
  map3dSub: { tr: 'Kapalıysa 2D plan görünümüyle açılır; haritadaki 2D/3D düğmesiyle her an değişir.', en: 'Off: opens in 2D plan view; switch any time with the 2D/3D button.', ar: 'إذا أُوقف تُفتح بعرض مسطح.' },
  swipe: { tr: 'Sekmeler arasında kaydırarak geç', en: 'Swipe between tabs', ar: 'التنقل بين التبويبات بالسحب' },
  motion: { tr: 'Hareketleri azalt', en: 'Reduce motion', ar: 'تقليل الحركة' },
  motionSub: { tr: 'Geçiş ve pusula animasyonları kapanır.', en: 'Turns off transitions and compass animation.', ar: 'إيقاف الحركات الانتقالية.' },
  haptics: { tr: 'Titreşim', en: 'Haptics', ar: 'الاهتزاز' },
  hapticsSub: { tr: 'Zikir sayacı, kıble ve tavafta kısa titreşim.', en: 'Short vibration in dhikr counter, qibla and tawaf.', ar: 'اهتزاز قصير في المسبحة والقبلة والطواف.' },
  data: { tr: 'Veriler', en: 'Data', ar: 'البيانات' },
  offline: { tr: 'Çevrimdışı paket', en: 'Offline pack', ar: 'الحزمة دون اتصال' },
  offlineSub: { tr: 'Kur’an, meal, dua sesleri ve Mekke/Medine haritasını indirin.', en: 'Download the Quran, translation, du‘a audio and maps.', ar: 'نزّل القرآن والترجمة والخرائط.' },
  backup: { tr: 'Yedekle', en: 'Back up', ar: 'نسخ احتياطي' },
  backupSub: { tr: 'Zikir defteri, kaza, ayraçlar, otel, sağlık kartı ve ayarlar tek dosyada.', en: 'Dhikr log, make-ups, bookmarks, hotel, medical card and settings in one file.', ar: 'كل بياناتك في ملف واحد.' },
  restore: { tr: 'Yedekten geri yükle', en: 'Restore from backup', ar: 'استعادة' },
  restoreSub: { tr: 'Yeni telefona geçince yedek dosyasını seçin.', en: 'Pick the backup file on your new phone.', ar: 'اختر ملف النسخة الاحتياطية.' },
  restoreAsk: { tr: 'Yedekteki kayıtlar bu telefondakilerin üzerine yazılacak. Devam edilsin mi?', en: 'Backup entries will overwrite the ones on this phone. Continue?', ar: 'ستُستبدل البيانات الحالية. متابعة؟' },
  restored: { tr: '{n} kayıt geri yüklendi ({d}). Hepsinin görünmesi için uygulamayı kapatıp açın.', en: '{n} entries restored ({d}). Close and reopen the app to see everything.', ar: 'تمت استعادة {n} سجلًا. أعد فتح التطبيق.' },
  backedUp: { tr: '{n} kayıt yedeklendi.', en: '{n} entries backed up.', ar: 'تم نسخ {n} سجلًا.' },
  failed: { tr: 'İşlem yapılamadı', en: 'Could not complete', ar: 'تعذّر الإتمام' },
} satisfies Record<string, { tr: string; en: string; ar: string }>;

export default function Settings() {
  const { t, lang, setLang } = useI18n();
  const { backend } = useReports();
  const [method, setM] = useState<MethodId>('UmmAlQura');
  const [rtlChanged, setRtlChanged] = useState(false);
  const { prefs: theme, dark, setTheme } = useTheme();
  const [notif, setNotif] = useState<NotifPrefs | null>(null);
  const lg = lang as Lang;
  const l = (k: keyof typeof L) => pick(L[k], lg);
  useEffect(() => { getMethod().then(setM); }, []);
  useFocusEffect(useCallback(() => { loadNotifPrefs().then(setNotif); }, []));
  const doExport = () => {
    exportBackup(Constants.expoConfig?.version ?? '').then((n) => { if (Platform.OS !== 'web') return; Alert.alert(l('backup'), l('backedUp').replace('{n}', String(n))); })
      .catch((e) => Alert.alert(l('failed'), String(e?.message ?? e)));
  };
  const doImport = () => {
    Alert.alert(l('restore'), l('restoreAsk'), [{ text: '✕', style: 'cancel' }, {
      text: 'OK',
      onPress: () => {
        importBackup().then((r) => r && Alert.alert(l('restore'), l('restored').replace('{n}', String(r.count)).replace('{d}', r.at.slice(0, 10))))
          .catch((e) => Alert.alert(l('failed'), String(e?.message ?? e)));
      },
    }]);
  };
  const notifSub = !notif ? '' : !notif.enabled ? l('notifOff')
    : [notif.before ? `${notif.before} ${l('before')}` : '', notif.atTime ? l('atTime') : '', pick((SOUNDS.find((x) => x.id === notif.sound) ?? SOUNDS[0]).ml, lg)].filter(Boolean).join(' · ');

  return (
    <Screen>
      <Header back title={t('settings.title')} />

      <SectionTitle>{l('look')}</SectionTitle>
      <Segmented<ThemeMode> value={theme.mode} onChange={(m) => setTheme({ mode: m })}
        options={[{ value: 'light', label: l('light') }, { value: 'dark', label: l('dark') }, { value: 'system', label: l('system') }]} />
      <Text style={T.small}>{l('palette')}</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {(Object.keys(PALETTES) as PaletteId[]).map((id) => {
          const on = id === theme.palette;
          const c = colorsFor(dark, id);
          return (
            <Pressable key={id} onPress={() => setTheme({ palette: id })} accessibilityRole="radio" accessibilityState={{ selected: on }}
              accessibilityLabel={pick(PALETTES[id].name, lg)}
              style={({ pressed }) => ({ width: '31%', minWidth: 100, padding: 8, gap: 6, borderRadius: 14, borderWidth: on ? 2 : 1, borderColor: on ? C.accent : C.border, backgroundColor: c.bg, opacity: pressed ? 0.8 : 1 })}>
              <View style={{ flexDirection: 'row', gap: 4 }}>
                <View style={{ flex: 2, height: 22, borderRadius: 6, backgroundColor: c.accent, alignItems: 'center', justifyContent: 'center' }}>
                  {on && <Icon name="check" color={c.onAccent} size={14} width={3} />}
                </View>
                <View style={{ flex: 1, height: 22, borderRadius: 6, backgroundColor: c.route }} />
                <View style={{ flex: 1, height: 22, borderRadius: 6, backgroundColor: c.accentTint }} />
              </View>
              <Text style={{ fontSize: fs(12), fontWeight: on ? '700' : '500', color: c.ink, minHeight: 32 }} numberOfLines={2}>{pick(PALETTES[id].name, lg)}</Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={T.small}>{l('text')}</Text>
      <Segmented<string> value={String(theme.text)} onChange={(v) => setTheme({ text: Number(v) })}
        options={TEXT_STEPS.map((x) => ({ value: String(x.v), label: pick(x.l, lg) }))} />
      <Text style={T.small}>{l('arabic')}</Text>
      <Segmented<string> value={String(theme.arabic)} onChange={(v) => setTheme({ arabic: Number(v) })}
        options={AR_STEPS.map((x) => ({ value: String(x.v), label: x.l }))} />
      <Card tint={C.surface} style={{ gap: 6 }}>
        <Text style={{ fontSize: fsAr(24), lineHeight: fsAr(40), color: C.ink, textAlign: 'right', writingDirection: 'rtl' }}>بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ</Text>
        <Text style={T.body}>{l('sample')}</Text>
      </Card>

      <SectionTitle>{l('home')}</SectionTitle>
      {HOMES.map((h) => (
        <ListRow key={h.id} title={pick(h.l, lg)} onPress={() => setTheme({ home: h.id })}
          right={h.id === theme.home ? <Icon name="check" color={C.accent} /> : <></>} />
      ))}
      <Text style={T.small}>{l('homeNote')}</Text>

      <SectionTitle>{l('behaviour')}</SectionTitle>
      <ToggleRow title={l('map3d')} sub={l('map3dSub')} value={theme.map3d} onChange={(v) => setTheme({ map3d: v })} />
      <ToggleRow title={l('swipe')} value={theme.swipeTabs} onChange={(v) => setTheme({ swipeTabs: v })} />
      <ToggleRow title={l('motion')} sub={l('motionSub')} value={theme.reduceMotion} onChange={(v) => setTheme({ reduceMotion: v })} />
      <ToggleRow title={l('haptics')} sub={l('hapticsSub')} value={theme.haptics} onChange={(v) => setTheme({ haptics: v })} />

      <SectionTitle>{l('notif')}</SectionTitle>
      <ListRow title={l('notif')} subtitle={notifSub} onPress={() => router.push('/bildirimler')}
        left={<Icon name="bell" color={notif?.enabled ? C.accent : C.muted} />} />
      <WidgetPinRow />
      <SectionTitle>{t('settings.language')}</SectionTitle>
      {LANGS.map((l) => (
        <ListRow key={l.code} title={l.label} onPress={() => { if (l.rtl !== (LANGS.find((x) => x.code === lang)?.rtl ?? false)) setRtlChanged(true); setLang(l.code); }}
          right={l.code === lang ? <Icon name="check" color={C.accent} /> : <></>} />
      ))}
      {rtlChanged && <Text style={[T.small, { color: C.limited }]}>{t('settings.rtlNote')}</Text>}

      <SectionTitle>{t('settings.method')}</SectionTitle>
      {METHODS.map((m) => (
        <ListRow key={m.id} title={m.label} onPress={() => { setM(m.id); setMethod(m.id); }}
          right={m.id === method ? <Icon name="check" color={C.accent} /> : <></>} />
      ))}

      <SectionTitle>{l('data')}</SectionTitle>
      <ListRow title={l('offline')} subtitle={l('offlineSub')} onPress={() => router.push('/cevrimdisi')}
        left={<Icon name="data" color={C.accent} />} />
      <ListRow title={l('backup')} subtitle={l('backupSub')} onPress={doExport}
        left={<Icon name="share" color={C.accent} />} />
      <ListRow title={l('restore')} subtitle={l('restoreSub')} onPress={doImport}
        left={<Icon name="up" color={C.accent} />} />
      <ListRow title={t('data.title')} subtitle={t('data.sub')} onPress={() => router.push('/veriler')}
        left={<Icon name="data" color={C.accent} />} />

      <SectionTitle>{t('settings.backend')}</SectionTitle>
      <Card tint={C.surface}>
        <Text style={T.body}>{backend === 'supabase' ? t('settings.backendRemote') : t('settings.backendLocal')}</Text>
        <Text style={T.small}>Canlı sunucu için EXPO_PUBLIC_SUPABASE_URL ve EXPO_PUBLIC_SUPABASE_ANON_KEY tanımlayın (README).</Text>
      </Card>

      <SectionTitle>{t('settings.about')}</SectionTitle>
      <Card tint={C.surface}>
        <Text style={T.body}>MATAF {Constants.expoConfig?.version ?? ''}</Text>
        <Text style={T.small}>Mescid-i Haram ve Mescid-i Nebevî’nin 3D biçimi, kapı yerleri ve çevredeki binalar OpenStreetMap’in 3D bina verisinden (© OpenStreetMap katkıcıları, ODbL); doğruluğu bu veri kadardır. Kâbe ve Yeşil Kubbe ayrıntılı kendi modelimizdir.</Text>
        <Text style={[T.small, { color: C.accent, fontWeight: '700' }]} onPress={() => Linking.openURL('https://www.openstreetmap.org/copyright')}>OpenStreetMap lisansı ↗</Text>
      </Card>
    </Screen>
  );
}

function ToggleRow({ title, sub, value, onChange }: { title: string; sub?: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: C.border }}>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={{ fontSize: fs(15), fontWeight: '600', color: C.ink }}>{title}</Text>
        {sub ? <Text style={T.small}>{sub}</Text> : null}
      </View>
      <Toggle value={value} onChange={onChange} label={title} />
    </View>
  );
}
