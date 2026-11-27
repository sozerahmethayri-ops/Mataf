// Hatim planı: kaç günde bitireceğinizi seçin; her günün bölümü Hatim ayracının yerinden hesaplanır.
// Okurken ayraç kendiliğinden ilerler (kuran/[sure] ayraçla açılınca görünen ilk âyet kaydedilir).
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Platform, ScrollView, Text, View } from 'react-native';

import { HL, place, portionText } from '@/components/HatimCard';
import { Btn, Chip, Header, Screen, SectionTitle, Segmented, T, Toggle } from '@/components/ui';
import { C, fs } from '@/constants/theme';
import { pick, useI18n } from '@/i18n';
import { NOTIF_KEY, applySchedule, loadNotifPrefs } from '@/services/adhanNotify';
import { PLAN_DAYS, hatimToday, juzPos, readFromMark, readShare } from '@/services/hatim';
import { dayKey } from '@/services/prayerLog';
import { useQuranPrefs } from '@/services/QuranPrefs';
import { useHatimPlan } from '@/services/useHatimPlan';

type Lang = 'tr' | 'en' | 'ar';
const L = {
  sub: { tr: 'Kur’an’ı belli bir sürede bitirin', en: 'Finish the Quran in a set time', ar: 'أتمّ القرآن في مدة محددة' },
  intro: {
    tr: 'Kaç günde bitirmek istediğinizi seçin. Her gün okuyacağınız bölüm Hatim ayracınızın yerinden hesaplanır; okudukça ayraç kendiliğinden ilerler.',
    en: 'Choose how many days you want to take. Each day’s portion is worked out from your Khatm bookmark, which moves forward as you read.',
    ar: 'اختر عدد الأيام. يُحسب ورد كل يوم من موضع علامة الختمة، وتتقدم العلامة تلقائيًا أثناء القراءة.',
  },
  mark: { tr: 'Hatim ayracınız: {p} (%{n})', en: 'Your Khatm bookmark: {p} ({n}%)', ar: 'علامة الختمة: {p} ({n}٪)' },
  length: { tr: 'Süre', en: 'Length', ar: 'المدة' },
  daysN: { tr: '{n} gün', en: '{n} days', ar: '{n} يومًا' },
  perDay: { tr: 'Günde {x}', en: '{x} a day', ar: '{x} يوميًا' },
  fromHere: { tr: 'Kaldığım yerden', en: 'From my bookmark', ar: 'من موضعي' },
  fromStart: { tr: 'Baştan', en: 'From the start', ar: 'من البداية' },
  start: { tr: 'Planı başlat', en: 'Start the plan', ar: 'ابدأ الخطة' },
  overdue: { tr: 'Planın süresi doldu. Kalan bölüm için yeni bir süre seçebilirsiniz.', en: 'The plan’s time is up. You can choose a new length for the rest.', ar: 'انتهت مدة الخطة. يمكنك اختيار مدة جديدة لما تبقّى.' },
  replan: { tr: 'Yeni süreyle devam et', en: 'Continue with a new length', ar: 'تابع بمدة جديدة' },
  again: { tr: 'Yeni hatim başlat', en: 'Start a new khatm', ar: 'ابدأ ختمة جديدة' },
  progress: { tr: '%{n} okundu', en: '{n}% read', ar: 'قُرئ {n}٪' },
  remind: { tr: 'Her gün yatsıdan sonra hatırlat', en: 'Remind me daily after Isha', ar: 'ذكّرني يوميًا بعد العشاء' },
  remindSub: { tr: 'Bildirimle; dokununca bu ekran açılır.', en: 'As a notification; tap to open this screen.', ar: 'بإشعار؛ اضغط لفتح هذه الشاشة.' },
  stop: { tr: 'Planı kaldır', en: 'Remove the plan', ar: 'إزالة الخطة' },
  sure: { tr: 'Plan kaldırılsın mı? Hatim ayracınız yerinde kalır.', en: 'Remove the plan? Your Khatm bookmark stays where it is.', ar: 'إزالة الخطة؟ تبقى علامة الختمة في مكانها.' },
  yes: { tr: 'Kaldır', en: 'Remove', ar: 'إزالة' },
  no: { tr: 'Vazgeç', en: 'Cancel', ar: 'إلغاء' },
};

export default function HatimScreen() {
  const { lang } = useI18n();
  const lg = lang as Lang;
  const [plan, setPlan] = useHatimPlan();
  const { bookmarks, saveBookmark } = useQuranPrefs();
  const hb = bookmarks.find((b) => b.hatim);
  const read = hb ? readFromMark(hb.surah, hb.ayah) : 0;
  const pct = Math.round(readShare(read) * 100);
  const [now] = useState(() => new Date());
  const [days, setDays] = useState<number>(30);
  const [fresh, setFresh] = useState<'here' | 'start'>('here');
  const [confirm, setConfirm] = useState(false);
  const [remind, setRemind] = useState(false);
  useEffect(() => {
    if (Platform.OS === 'web') return;
    loadNotifPrefs().then((p) => setRemind(p.quran)).catch(() => undefined);
  }, []);
  const setReminder = (v: boolean) => {
    setRemind(v);
    loadNotifPrefs()
      .then(async (p) => {
        const next = { ...p, quran: v };
        await AsyncStorage.setItem(NOTIF_KEY, JSON.stringify(next));
        await applySchedule(next, lang, { ask: v });
      })
      .catch(() => undefined);
  };
  const begin = (from: number) => setPlan({ start: dayKey(new Date()), days, from });
  const startNew = () => {
    if (fresh === 'start' && hb) saveBookmark({ ...hb, surah: 1, ayah: 1 });
    begin(fresh === 'start' ? 0 : read);
  };
  const restart = () => {
    if (hb) saveBookmark({ ...hb, surah: 1, ayah: 1 });
    setPlan(null);
    setFresh('start');
  };
  const stop = () => {
    setPlan(null);
    setConfirm(false);
    if (remind) setReminder(false);
  };
  const openReader = () => hb && router.push({ pathname: '/kuran/[sure]', params: { sure: String(hb.surah), b: hb.id, a: String(hb.ayah) } });
  // Seçilen süreyle günlük bölümün büyüklüğü (cüz ve sayfa)
  const perDay = (from: number) => {
    const j = (30 - juzPos(from)) / days;
    return pick(L.perDay, lg).replace('{x}', portionText(j, Math.max(1, Math.round(j * 20)), lg));
  };
  const lengthPicker = (from: number) => (
    <>
      <SectionTitle>{pick(L.length, lg)}</SectionTitle>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
        {PLAN_DAYS.map((d) => <Chip key={d} label={pick(L.daysN, lg).replace('{n}', String(d))} active={days === d} onPress={() => setDays(d)} />)}
      </ScrollView>
      <Text style={{ fontSize: fs(15), fontWeight: '600', color: C.ink }}>{perDay(from)}</Text>
    </>
  );
  const s = plan ? hatimToday(plan, read, now) : null;

  return (
    <Screen>
      <Header back title={pick(HL.title, lg)} subtitle={pick(L.sub, lg)} />
      {hb && <Text style={T.muted}>{pick(L.mark, lg).replace('{p}', place([hb.surah, hb.ayah], lg)).replace('{n}', String(pct))}</Text>}

      {!plan || !s ? (
        <>
          <Text style={T.body}>{pick(L.intro, lg)}</Text>
          {read > 0 && (
            <Segmented<'here' | 'start'> value={fresh} onChange={setFresh}
              options={[{ value: 'here', label: pick(L.fromHere, lg) }, { value: 'start', label: pick(L.fromStart, lg) }]} />
          )}
          {lengthPicker(fresh === 'start' ? 0 : read)}
          <Btn title={pick(L.start, lg)} icon="book" onPress={startNew} />
        </>
      ) : (
        <>
          <View style={{ borderWidth: 1, borderColor: C.border, borderRadius: 18, padding: 14, gap: 8 }}>
            <Text style={{ fontSize: fs(13), fontWeight: '600', color: C.muted }}>
              {pick(HL.day, lg).replace('{d}', String(Math.min(s.day, plan.days))).replace('{n}', String(plan.days))}
            </Text>
            {s.finished ? (
              <Text style={{ fontSize: fs(17), fontWeight: '700', color: C.accent }}>{pick(HL.finished, lg)}</Text>
            ) : s.left > 0 ? (
              <>
                <Text style={{ fontSize: fs(17), fontWeight: '700', color: C.ink }}>{pick(HL.today, lg)}: {place(s.from, lg)} → {place(s.to, lg)}</Text>
                <Text style={{ fontSize: fs(14), color: C.muted }}>{portionText(s.juzLeft, s.pagesLeft, lg)}</Text>
              </>
            ) : (
              <Text style={{ fontSize: fs(17), fontWeight: '700', color: C.accent }}>{pick(HL.done, lg)}</Text>
            )}
            <View style={{ height: 8, borderRadius: 4, backgroundColor: C.surface, overflow: 'hidden' }}>
              <View style={{ width: `${Math.max(1, pct)}%`, height: 8, backgroundColor: C.accent }} />
            </View>
            <Text style={T.small}>{pick(L.progress, lg).replace('{n}', String(pct))}</Text>
          </View>
          {s.finished ? (
            <Btn title={pick(L.again, lg)} icon="refresh" onPress={restart} />
          ) : (
            <Btn title={pick(HL.read, lg)} icon="book" onPress={openReader} />
          )}
          {s.overdue && !s.finished && (
            <>
              <Text style={T.body}>{pick(L.overdue, lg)}</Text>
              {lengthPicker(read)}
              <Btn title={pick(L.replan, lg)} kind="secondary" onPress={() => begin(read)} />
            </>
          )}
          {Platform.OS !== 'web' && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 52 }}>
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={T.body}>{pick(L.remind, lg)}</Text>
                <Text style={T.small}>{pick(L.remindSub, lg)}</Text>
              </View>
              <Toggle value={remind} onChange={setReminder} label={pick(L.remind, lg)} />
            </View>
          )}
          {confirm ? (
            <View style={{ gap: 8 }}>
              <Text style={T.body}>{pick(L.sure, lg)}</Text>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <Btn title={pick(L.yes, lg)} kind="secondary" onPress={stop} style={{ flex: 1 }} />
                <Btn title={pick(L.no, lg)} kind="secondary" onPress={() => setConfirm(false)} style={{ flex: 1 }} />
              </View>
            </View>
          ) : (
            <Btn title={pick(L.stop, lg)} kind="secondary" onPress={() => setConfirm(true)} />
          )}
        </>
      )}
    </Screen>
  );
}
