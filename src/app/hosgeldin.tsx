// İlk açılış: dil, konum izni ve ezan bildirimi tek sayfada. "Başla" ile kapanır, bir daha görünmez.
// mataf://hosgeldin?bitti=1 ekranı hemen kapatır (emülatör denemesi için).
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon, type IconName } from '@/components/Icon';
import { Btn, Segmented } from '@/components/ui';
import { C, fs } from '@/constants/theme';
import { pick, useI18n } from '@/i18n';
import { LANGS } from '@/i18n/strings';
import { NOTIF_KEY, applySchedule, loadNotifPrefs, notificationsSupported } from '@/services/adhanNotify';
import { setOnboarded } from '@/services/onboarding';

type Lang = 'tr' | 'en' | 'ar';
type St = 'idle' | 'busy' | 'ok' | 'no';
const L = {
  title: { tr: 'Hoş geldiniz', en: 'Welcome', ar: 'أهلًا وسهلًا' },
  sub: { tr: 'Namaz vakitleri, Kur’an, kıble ve Mekke–Medine rehberi. Çoğu özellik internetsiz çalışır.', en: 'Prayer times, Quran, qibla and a Makkah–Madinah guide. Most features work offline.', ar: 'مواقيت الصلاة والقرآن والقبلة ودليل مكة والمدينة. معظم الميزات تعمل دون اتصال.' },
  lang: { tr: 'Dil', en: 'Language', ar: 'اللغة' },
  loc: { tr: 'Konum', en: 'Location', ar: 'الموقع' },
  locSub: { tr: 'Vakitler, kıble ve en yakın cami için. Konumunuz telefonda kalır.', en: 'For prayer times, qibla and the nearest mosque. Your location stays on the phone.', ar: 'للمواقيت والقبلة وأقرب مسجد. يبقى موقعك على الهاتف.' },
  locBtn: { tr: 'Konuma izin ver', en: 'Allow location', ar: 'السماح بالموقع' },
  locNo: { tr: 'İzin verilmedi: Mekke vakitleri kullanılır, sonra Ayarlar’dan açabilirsiniz.', en: 'Not allowed: Makkah times are used; you can allow it later.', ar: 'لم يُسمح: تُستخدم مواقيت مكة، ويمكنك السماح لاحقًا.' },
  notif: { tr: 'Ezan bildirimi', en: 'Adhan reminder', ar: 'تنبيه الأذان' },
  notifSub: { tr: 'Vakit girince ve 10 dakika önce haber verir. Sonra değiştirebilirsiniz.', en: 'At prayer time and 10 minutes before. You can change it later.', ar: 'عند دخول الوقت وقبله بعشر دقائق. يمكنك تغييره لاحقًا.' },
  notifBtn: { tr: 'Bildirimleri aç', en: 'Turn on reminders', ar: 'تشغيل التنبيهات' },
  notifNo: { tr: 'Açılamadı. Ayarlar → Ezan bildirimleri’nden deneyebilirsiniz.', en: 'Could not turn on. Try Settings → Adhan notifications.', ar: 'تعذّر التشغيل. جرّب الإعدادات ← إشعارات الأذان.' },
  done: { tr: 'Açık', en: 'On', ar: 'مفعّل' },
  start: { tr: 'Başla', en: 'Start', ar: 'ابدأ' },
};

export default function Welcome() {
  const { lang, setLang } = useI18n();
  const lg = lang as Lang;
  const insets = useSafeAreaInsets();
  const { bitti } = useLocalSearchParams<{ bitti?: string }>();
  const [loc, setLoc] = useState<St>('idle');
  const [notif, setNotif] = useState<St>(notificationsSupported ? 'idle' : 'no');

  // Yığında birden çok karşılama ekranı olabilir (açılış + derin bağlantı): hepsini kapatıp ana sayfaya dön
  const finish = () => { setOnboarded().then(() => (router.canDismiss() ? router.dismissAll() : router.replace('/'))); };
  useEffect(() => { if (bitti === '1') finish(); }, [bitti]);
  useEffect(() => {
    Location.getForegroundPermissionsAsync().then((p) => p.granted && setLoc('ok')).catch(() => undefined);
  }, []);

  const askLoc = () => {
    setLoc('busy');
    Location.requestForegroundPermissionsAsync().then((p) => setLoc(p.granted ? 'ok' : 'no')).catch(() => setLoc('no'));
  };
  const askNotif = () => {
    setNotif('busy');
    loadNotifPrefs()
      .then(async (p) => {
        const next = { ...p, enabled: true };
        await AsyncStorage.setItem(NOTIF_KEY, JSON.stringify(next));
        const r = await applySchedule(next, lg, { ask: true });
        setNotif(r.ok ? 'ok' : 'no');
      })
      .catch(() => setNotif('no'));
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.bg }} contentContainerStyle={{ flexGrow: 1, paddingTop: insets.top + 36, paddingBottom: insets.bottom + 24, paddingHorizontal: 24, gap: 22 }}>
      <View style={{ gap: 10 }}>
        <View style={{ width: 64, height: 64, borderRadius: 20, backgroundColor: C.accentTint, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="kaaba" size={34} color={C.accent} />
        </View>
        <Text style={{ fontSize: fs(30), fontWeight: '800', color: C.ink, letterSpacing: -0.5 }}>{pick(L.title, lg)}</Text>
        <Text style={{ fontSize: fs(15.5), color: C.ink2, lineHeight: fs(22) }}>{pick(L.sub, lg)}</Text>
      </View>

      <View style={{ gap: 8 }}>
        <Text style={{ fontSize: fs(13), fontWeight: '700', color: C.muted }}>{pick(L.lang, lg)}</Text>
        <Segmented<string> value={lang} onChange={(code) => { const to = LANGS.find((x) => x.code === code); if (to) setLang(to.code); }}
          options={LANGS.map((x) => ({ value: x.code, label: x.label }))} />
      </View>

      <Step icon="locate" title={pick(L.loc, lg)} sub={loc === 'no' ? pick(L.locNo, lg) : pick(L.locSub, lg)} st={loc}
        btn={pick(L.locBtn, lg)} doneLabel={pick(L.done, lg)} onPress={askLoc} />
      {Platform.OS !== 'web' && (
        <Step icon="bell" title={pick(L.notif, lg)} sub={notif === 'no' ? pick(L.notifNo, lg) : pick(L.notifSub, lg)} st={notif}
          btn={pick(L.notifBtn, lg)} doneLabel={pick(L.done, lg)} onPress={askNotif} />
      )}

      <View style={{ flex: 1 }} />
      <Btn title={pick(L.start, lg)} onPress={finish} />
    </ScrollView>
  );
}

function Step({ icon, title, sub, st, btn, doneLabel, onPress }: { icon: IconName; title: string; sub: string; st: St; btn: string; doneLabel: string; onPress: () => void }) {
  return (
    <View style={{ flexDirection: 'row', gap: 14, padding: 16, borderRadius: 20, backgroundColor: C.surface }}>
      <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center' }}>
        <Icon name={icon} size={20} color={C.accent} />
      </View>
      <View style={{ flex: 1, gap: 8 }}>
        <Text style={{ fontSize: fs(16), fontWeight: '700', color: C.ink }}>{title}</Text>
        <Text style={{ fontSize: fs(13.5), color: st === 'no' ? C.limited : C.muted, lineHeight: fs(19) }}>{sub}</Text>
        {st === 'ok' ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Icon name="check" size={16} color={C.green} />
            <Text style={{ fontSize: fs(14), fontWeight: '700', color: C.green }}>{doneLabel}</Text>
          </View>
        ) : st === 'busy' ? <ActivityIndicator color={C.accent} style={{ alignSelf: 'flex-start' }} /> : st === 'idle' ? (
          <Pressable onPress={onPress} accessibilityRole="button"
            style={({ pressed }) => ({ alignSelf: 'flex-start', height: 38, paddingHorizontal: 16, borderRadius: 19, backgroundColor: C.accent, justifyContent: 'center', opacity: pressed ? 0.85 : 1 })}>
            <Text style={{ fontSize: fs(14), fontWeight: '700', color: C.onAccent }}>{btn}</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}
