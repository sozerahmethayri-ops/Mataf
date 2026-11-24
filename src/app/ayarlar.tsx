import Constants from 'expo-constants';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Linking, Pressable, Text, View } from 'react-native';

import { Icon } from '@/components/Icon';
import { Card, Header, ListRow, Screen, SectionTitle, Segmented, T } from '@/components/ui';
import { C, PALETTES, colorsFor, type PaletteId, type ThemeMode } from '@/constants/theme';
import { pick, useI18n } from '@/i18n';
import { LANGS } from '@/i18n/strings';
import { SOUNDS, type NotifPrefs } from '@/services/adhanPlan';
import { loadNotifPrefs } from '@/services/adhanNotify';
import { METHODS, getMethod, setMethod, type MethodId } from '@/services/prayer';
import { useReports } from '@/services/ReportsContext';
import { useTheme } from '@/services/ThemeContext';

type Lang = 'tr' | 'en' | 'ar';
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
  const notifSub = !notif ? '' : !notif.enabled ? l('notifOff')
    : [notif.before ? `${notif.before} ${l('before')}` : '', notif.atTime ? l('atTime') : '', pick((SOUNDS.find((x) => x.id === notif.sound) ?? SOUNDS[0]).ml, lg)].filter(Boolean).join(' · ');

  return (
    <Screen>
      <Header back title={t('settings.title')} />

      <SectionTitle>{l('look')}</SectionTitle>
      <Segmented<ThemeMode> value={theme.mode} onChange={(m) => setTheme({ mode: m }, '/ayarlar')}
        options={[{ value: 'light', label: l('light') }, { value: 'dark', label: l('dark') }, { value: 'system', label: l('system') }]} />
      <Text style={T.small}>{l('palette')}</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {(Object.keys(PALETTES) as PaletteId[]).map((id) => {
          const on = id === theme.palette;
          const c = colorsFor(dark, id);
          return (
            <Pressable key={id} onPress={() => setTheme({ palette: id }, '/ayarlar')} accessibilityRole="radio" accessibilityState={{ selected: on }}
              accessibilityLabel={pick(PALETTES[id].name, lg)}
              style={({ pressed }) => ({ width: '31%', minWidth: 100, padding: 8, gap: 6, borderRadius: 14, borderWidth: on ? 2 : 1, borderColor: on ? C.accent : C.border, backgroundColor: c.bg, opacity: pressed ? 0.8 : 1 })}>
              <View style={{ flexDirection: 'row', gap: 4 }}>
                <View style={{ flex: 2, height: 22, borderRadius: 6, backgroundColor: c.accent, alignItems: 'center', justifyContent: 'center' }}>
                  {on && <Icon name="check" color={c.onAccent} size={14} width={3} />}
                </View>
                <View style={{ flex: 1, height: 22, borderRadius: 6, backgroundColor: c.route }} />
                <View style={{ flex: 1, height: 22, borderRadius: 6, backgroundColor: c.accentTint }} />
              </View>
              <Text style={{ fontSize: 12, fontWeight: on ? '700' : '500', color: c.ink, minHeight: 32 }} numberOfLines={2}>{pick(PALETTES[id].name, lg)}</Text>
            </Pressable>
          );
        })}
      </View>

      <SectionTitle>{l('notif')}</SectionTitle>
      <ListRow title={l('notif')} subtitle={notifSub} onPress={() => router.push('/bildirimler')}
        left={<Icon name="bell" color={notif?.enabled ? C.accent : C.muted} />} />
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

      <SectionTitle>{t('data.title')}</SectionTitle>
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
