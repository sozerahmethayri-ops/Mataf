// Sa'y sayacı: Safâ–Merve arası 7 şavt. Mes'a'daysanız GPS ile kendiliğinden sayar, her zaman elle düzeltilebilir.
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { useKeepAwake } from 'expo-keep-awake';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, G, Line, Path, Rect, Text as SvgText } from 'react-native-svg';

import { DuaBlock } from '@/components/DuaBlock';
import { Icon } from '@/components/Icon';
import { Btn, Card, IconBtn, SectionTitle, Segmented, T } from '@/components/ui';
import { C, fs, shadow } from '@/constants/theme';
import { SAFA_AYAH, SAFA_DHIKR, SAY_BETWEEN, UMRE_STEPS, type T3 } from '@/data/umre';
import { pick, useI18n } from '@/i18n';
import {
  MASA_LENGTH, SAY_TOTAL, adjustSay, initialSay, lapDirection, startSayManual, stepSay, type SayEvent, type SayFix, type SayState,
} from '@/services/say';
import { useSayFeed } from '@/services/sayFeed';
import { markUmreStep } from '@/services/umreProgress';
import { usePersisted } from '@/services/usePersisted';
import { duaSpeech, playSequence, stopVoice, type SpeechItem } from '@/services/voice';

type Lang = 'tr' | 'en' | 'ar';
type Phase = 'prep' | 'active' | 'done';

const L = {
  title: { tr: 'Sa’y sayacı', en: 'Sa‘y counter', ar: 'عدّاد السعي' },
  sub: { tr: 'Safâ ile Merve arası · 7 şavt', en: 'Between Safa and Marwah · 7 trips', ar: 'بين الصفا والمروة · ٧ أشواط' },
  safa: { tr: 'Safâ', en: 'Safa', ar: 'الصفا' },
  marwa: { tr: 'Merve', en: 'Marwah', ar: 'المروة' },
  prep: { tr: 'Sa’ye hazırlık', en: 'Before you start', ar: 'قبل البدء' },
  p1: { tr: 'Sa’y, tavaftan sonra yapılır ve Safâ’dan başlar. Safâ’dan Merve’ye gidiş bir şavt, Merve’den Safâ’ya dönüş bir şavttır; yedinci şavt Merve’de biter.', en: 'Sa‘y follows tawaf and starts at Safa. Safa to Marwah is one trip, Marwah back to Safa is another; the seventh ends at Marwah.', ar: 'السعي بعد الطواف ويبدأ من الصفا؛ الذهاب إلى المروة شوط والعودة شوط، وينتهي السابع بالمروة.' },
  p2: { tr: 'Yeşil ışıklarla işaretli bölümde erkekler hafifçe koşar; kadınlar normal yürür. Ara vermek ve tekerlekli sandalye kullanmak caizdir.', en: 'In the green-lit section men jog lightly; women walk normally. Resting and using a wheelchair are allowed.', ar: 'بين العلمين الأخضرين يسعى الرجال سعيًا خفيفًا، وتمشي النساء. ويجوز الاستراحة واستعمال الكرسي.' },
  begin: { tr: 'Sa’ye başla', en: 'Start sa‘y', ar: 'ابدأ السعي' },
  waiting: { tr: 'Safâ’dan Merve’ye yürümeye başlayınca sayım kendiliğinden başlar.', en: 'Counting starts automatically when you walk from Safa toward Marwah.', ar: 'يبدأ العدّ تلقائيًا عند المشي من الصفا نحو المروة.' },
  atSafa: { tr: 'Safâ’dayım, başlat', en: 'I’m at Safa, start', ar: 'أنا على الصفا، ابدأ' },
  wrong: { tr: 'Merve’den Safâ’ya yürüyorsunuz: sa’y Safâ’dan başlar, bu yol sayılmaz. Safâ’ya varınca oradan başlayın.', en: 'You are walking from Marwah to Safa: sa‘y starts at Safa, so this trip does not count. Start again from Safa.', ar: 'أنت تمشي من المروة إلى الصفا؛ السعي يبدأ من الصفا فلا يُحتسب هذا الشوط.' },
  plusOne: { tr: 'Şavtı tamamladım', en: 'Trip completed', ar: 'أتممت الشوط' },
  auto: { tr: 'Otomatik sayım', en: 'Auto count', ar: 'العدّ التلقائي' },
  manual: { tr: 'Elle sayım', en: 'Manual count', ar: 'العدّ اليدوي' },
  countNote: { tr: 'Mes’a kapalı ve çok katlı olduğu için GPS zayıf olabilir. Şüphede az olanı esas alın; sayacı her zaman elle düzeltebilirsiniz.', en: 'GPS can be weak in the covered, multi-level Mas‘a. When in doubt take the lower number; you can always correct the counter.', ar: 'قد يضعف GPS في المسعى المسقوف متعدد الأدوار؛ عند الشك خذ بالأقل، ويمكنك التصحيح يدويًا.' },
  atEnd: { tr: 'Tepede, Kâbe’ye dönerek', en: 'On the hill, facing the Kaaba', ar: 'على الجبل مستقبل الكعبة' },
  between: { tr: 'Yolda', en: 'On the way', ar: 'في الطريق' },
  free: { tr: 'Dilediğiniz duayı kendi dilinizde de yapabilirsiniz.', en: 'You may also make any du‘a in your own language.', ar: 'ادعُ بما شئت ولو بلغتك.' },
  done: { tr: 'Sa’yiniz tamamlandı', en: 'Your sa‘y is complete', ar: 'تمّ سعيك' },
  accept: { tr: 'Allah kabul etsin.', en: 'May Allah accept it.', ar: 'تقبّل الله منك.' },
  next: { tr: 'Sıradaki adım: tıraş ya da saç kısaltma', en: 'Next: shaving or shortening the hair', ar: 'التالي: الحلق أو التقصير' },
  guide: { tr: 'Umre rehberine dön', en: 'Back to the umrah guide', ar: 'العودة إلى دليل العمرة' },
  again: { tr: 'Yeni sa’y', en: 'New sa‘y', ar: 'سعي جديد' },
  demo: { tr: 'Önizleme · örnek yürüyüş', en: 'Preview · simulated walk', ar: 'معاينة · مشي تجريبي' },
  away: { tr: 'Mes’a’da değilsiniz', en: 'You are not in the Mas‘a', ar: 'لست في المسعى' },
  awayHelp: { tr: 'Konumunuz Safâ–Merve arasında olmadığı için şavtlar kendiliğinden sayılmaz. Elle sayabilir ya da önizlemeyle deneyebilirsiniz.', en: 'You are not between Safa and Marwah, so trips are not counted automatically. Count manually or try the preview.', ar: 'لست بين الصفا والمروة فلا تُعدّ الأشواط تلقائيًا؛ عُدّ يدويًا أو جرّب المعاينة.' },
  preview: { tr: 'Önizleme', en: 'Preview', ar: 'معاينة' },
  previewOff: { tr: 'Önizlemeyi kapat', en: 'Stop preview', ar: 'إيقاف المعاينة' },
  gpsGood: { tr: 'GPS iyi', en: 'GPS good', ar: 'GPS جيد' },
  gpsWeak: { tr: 'GPS zayıf · elle sayın', en: 'Weak GPS · count manually', ar: 'GPS ضعيف · عُدّ يدويًا' },
  gpsNone: { tr: 'Konum bekleniyor', en: 'Waiting for location', ar: 'في انتظار الموقع' },
  denied: { tr: 'Konum izni yok · elle sayın', en: 'No location permission · count manually', ar: 'لا إذن للموقع · عُدّ يدويًا' },
  voiceOn: { tr: 'Sesli bildirim açık', en: 'Voice on', ar: 'الصوت مفعّل' },
  voiceOff: { tr: 'Sesli bildirim kapalı', en: 'Voice off', ar: 'الصوت متوقف' },
  lock: { tr: 'Ekranı kilitle', en: 'Lock screen', ar: 'قفل الشاشة' },
  locked: { tr: 'Ekran kilitli: açmak için basılı tutun', en: 'Screen locked: press and hold to unlock', ar: 'الشاشة مقفلة: اضغط مطولًا لفتحها' },
  resumed: { tr: 'Yarım kalan sa’y geri yüklendi', en: 'Unfinished sa‘y restored', ar: 'تمت استعادة السعي غير المكتمل' },
  of: { tr: 'tamamlandı', en: 'completed', ar: 'مكتملة' },
  vguide: { tr: 'Sesli rehber', en: 'Voice guide', ar: 'الدليل الصوتي' },
  gOff: { tr: 'Kapalı', en: 'Off', ar: 'مغلق' },
  gShort: { tr: 'Kısa', en: 'Short', ar: 'مختصر' },
  gFull: { tr: 'Ayrıntılı', en: 'Detailed', ar: 'مفصّل' },
  gShortSub: { tr: 'Yalnız şavt sayısı ve yön.', en: 'Only the trip number and direction.', ar: 'رقم الشوط والاتجاه فقط.' },
  gFullSub: { tr: 'Şavt sayısı, tepede Safâ/Merve zikri ve yolun ortasında dua. Kulaklıkla kullanın.', en: 'Trip number, the dhikr on the hills and a du‘a midway. Use earphones.', ar: 'رقم الشوط وذكر الصفا والمروة ودعاء في منتصف الطريق.' },
} satisfies Record<string, T3>;

const ORD: Record<Lang, string[]> = {
  tr: ['Birinci', 'İkinci', 'Üçüncü', 'Dördüncü', 'Beşinci', 'Altıncı', 'Yedinci'],
  en: ['First', 'Second', 'Third', 'Fourth', 'Fifth', 'Sixth', 'Seventh'],
  ar: ['الأول', 'الثاني', 'الثالث', 'الرابع', 'الخامس', 'السادس', 'السابع'],
};
const endName = (to: 'safa' | 'marwa', lg: Lang) => pick(to === 'safa' ? L.safa : L.marwa, lg);
function announce(e: SayEvent, lg: Lang): string {
  if (e.type === 'start') return lg === 'en' ? 'Sa‘y started. First trip, to Marwah.' : lg === 'ar' ? 'بدأ السعي. الشوط الأول إلى المروة.' : 'Sa’y başladı. Birinci şavt, Merve’ye.';
  if (e.type === 'wrongStart') return pick(L.wrong, lg);
  if (e.type === 'done') return lg === 'en' ? 'Seven trips complete. May Allah accept it.' : lg === 'ar' ? 'تمت الأشواط السبعة. تقبّل الله منك.' : 'Yedi şavt tamamlandı. Allah kabul etsin.';
  const n = e.laps;
  const to = n % 2 === 0 ? 'marwa' : 'safa';
  if (lg === 'en') return `${ORD.en[n - 1]} trip complete. ${ORD.en[n]} trip, to ${endName(to, 'en')}.`;
  if (lg === 'ar') return `انتهى الشوط ${ORD.ar[n - 1]}. الشوط ${ORD.ar[n]} إلى ${endName(to, 'ar')}.`;
  return `${ORD.tr[n - 1]} şavt tamamlandı. ${ORD.tr[n]} şavt, ${to === 'safa' ? 'Safâ’ya' : 'Merve’ye'}.`;
}
const haptic = (done: boolean) => {
  if (Platform.OS === 'web') return;
  (done ? Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success) : Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)).catch(() => undefined);
};
const SAVE_KEY = 'say:session';
const SVG_FONT = Platform.OS === 'web' ? 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif' : undefined;
const now = () => Date.now();

export default function SayScreen() {
  useKeepAwake();
  const { lang } = useI18n();
  const lg = lang as Lang;
  const insets = useSafeAreaInsets();
  const [prefs, setPrefs] = usePersisted('say:prefs', { voice: true, auto: true, guide: 'full' as 'short' | 'full' });
  const [phase, setPhase] = useState<Phase>('prep');
  const [st, setSt] = useState<SayState>(initialSay);
  const [fix, setFix] = useState<SayFix | null>(null);
  const [locked, setLocked] = useState(false);
  const [resumed, setResumed] = useState(false);
  const [forceDemo, setForceDemo] = useState(false);
  const [width, setWidth] = useState(360);

  const stRef = useRef(st);
  const phaseRef = useRef(phase);
  const prefsRef = useRef(prefs);
  const lgRef = useRef(lg);
  const midSaid = useRef(false);
  useEffect(() => { phaseRef.current = phase; prefsRef.current = prefs; lgRef.current = lg; });

  const speak = (items: SpeechItem[]) => { if (prefsRef.current.voice) playSequence(items).catch(() => undefined); };
  const onEvents = (events: SayEvent[]) => {
    for (const e of events) {
      if (e.type !== 'wrongStart') haptic(e.type === 'done');
      // Ayrıntılı rehber: tepeye varınca (şavt bitişi) Safâ/Merve zikri de okunur
      const atHill = (e.type === 'lap' || e.type === 'done') && prefsRef.current.guide === 'full';
      speak([{ kind: 'speak', text: announce(e, lgRef.current), lang: lgRef.current }, ...(atHill ? duaSpeech(SAFA_DHIKR) : [])]);
      midSaid.current = false;
      if (e.type === 'done') { setPhase('done'); markUmreStep('say').catch(() => undefined); }
    }
  };
  const onFix = (f: SayFix) => {
    setFix(f);
    if (phaseRef.current !== 'active') return;
    const prev = stRef.current;
    const res = stepSay(prev, f);
    let next = res.st;
    let events = res.events;
    if (!prefsRef.current.auto && prev.started) {
      // Elle sayımda şavtı yalnız düğme artırır; konum yine çizim için izlenir
      next = { ...next, laps: prev.laps, toward: prev.toward, lastLapT: prev.lastLapT };
      events = [];
    }
    stRef.current = next;
    setSt(next);
    onEvents(events);
    // Yolun ortasında bir kez "Rabbiğfir verham" (ayrıntılı rehber)
    if (next.started && next.s !== undefined && !midSaid.current && prefsRef.current.guide === 'full' && Math.abs(next.s - MASA_LENGTH / 2) < 40) {
      midSaid.current = true;
      speak(duaSpeech(SAY_BETWEEN));
    }
  };
  const { denied, source } = useSayFeed({ walking: phase === 'active', speed: 6, forceDemo, onFix });
  const demo = source === 'demo';
  const away = source === 'away';

  // Yarım kalan sa'yi geri yükle (3 saate kadar)
  useEffect(() => {
    AsyncStorage.getItem(SAVE_KEY).then((raw) => {
      if (!raw) return;
      const s = JSON.parse(raw) as { phase: Phase; laps: number; t: number };
      if (s.phase === 'active' && now() - s.t < 3 * 3600e3 && s.laps > 0) {
        const x = adjustSay({ ...startSayManual(initialSay()), laps: s.laps - 1 }, 1);
        stRef.current = x;
        setSt(x);
        setPhase('active');
        setResumed(true);
      }
    }).catch(() => undefined);
    return () => { stopVoice(); };
  }, []);
  useEffect(() => {
    AsyncStorage.setItem(SAVE_KEY, JSON.stringify({ phase, laps: st.laps, t: now() })).catch(() => undefined);
  }, [phase, st.laps]);

  const begin = () => { stRef.current = initialSay(); setSt(stRef.current); setPhase('active'); setResumed(false); };
  const manualStart = () => { const x = startSayManual(stRef.current, fix?.t ?? 0); stRef.current = x; setSt(x); onEvents([{ type: 'start' }]); };
  const bump = (d: 1 | -1) => {
    const x = adjustSay(stRef.current, d, fix?.t ?? 0);
    stRef.current = x;
    setSt(x);
    if (d > 0) onEvents([x.laps >= SAY_TOTAL ? { type: 'done' } : { type: 'lap', laps: x.laps }]);
  };
  const reset = () => { stopVoice(); stRef.current = initialSay(); setSt(stRef.current); setPhase('prep'); };

  const sNow = st.s;
  const nearEnd = sNow === undefined || sNow < 45 || sNow > MASA_LENGTH - 45;
  const pill = demo ? { text: pick(L.demo, lg), bg: C.accentTint, fg: C.accent }
    : away ? { text: pick(denied ? L.denied : L.away, lg), bg: C.surface, fg: C.muted }
      : st.quality === 'good' ? { text: `${pick(L.gpsGood, lg)} · ±${Math.round(fix?.acc ?? 0)} m`, bg: C.openTint, fg: C.open }
        : st.quality === 'weak' ? { text: pick(L.gpsWeak, lg), bg: C.limitedTint, fg: C.limited }
          : { text: pick(L.gpsNone, lg), bg: C.surface, fg: C.muted };
  const current = Math.min(SAY_TOTAL, st.laps + 1);
  const dirNow = lapDirection(st.laps);
  const tiras = UMRE_STEPS.find((x) => x.id === 'tiras')!;

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <View style={{ paddingTop: insets.top + 6, paddingHorizontal: 12, paddingBottom: 8, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <IconBtn name="back" label="Geri" onPress={() => router.back()} />
        <View style={{ flex: 1 }}>
          <Text style={T.h2} numberOfLines={1}>{pick(L.title, lg)}</Text>
          <Text style={T.small} numberOfLines={1}>{pick(L.sub, lg)}</Text>
        </View>
        <IconBtn name={prefs.voice ? 'speaker' : 'mute'} label={pick(prefs.voice ? L.voiceOn : L.voiceOff, lg)} tint={prefs.voice ? C.accentTint : C.surface} color={prefs.voice ? C.accent : C.muted}
          onPress={() => { if (prefs.voice) stopVoice(); setPrefs({ voice: !prefs.voice }); }} />
        <IconBtn name="lock" label={pick(L.lock, lg)} onPress={() => setLocked(true)} />
      </View>

      <View onLayout={(e) => setWidth(Math.round(e.nativeEvent.layout.width))} style={{ paddingHorizontal: 12 }}>
        <MasaBar width={width - 24} s={phase === 'prep' && !demo ? undefined : sNow} toward={st.started ? st.toward : undefined} lg={lg} />
        <View style={{ position: 'absolute', left: 22, top: 8, flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, height: 26, borderRadius: 13, backgroundColor: pill.bg }}>
          <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: pill.fg }} />
          <Text style={{ fontSize: fs(11.5), fontWeight: '700', color: pill.fg }}>{pill.text}</Text>
        </View>
        {(away || demo) && (
          <Pressable onPress={() => setForceDemo((v) => !v)} accessibilityRole="button"
            style={[{ position: 'absolute', right: 22, top: 6, height: 30, paddingHorizontal: 12, borderRadius: 15, flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: demo ? C.accent : C.bg }, shadow]}>
            <Icon name={demo ? 'stop' : 'play'} size={13} color={demo ? C.onAccent : C.accent} fill={demo ? C.onAccent : C.accent} />
            <Text style={{ fontSize: fs(12), fontWeight: '700', color: demo ? C.onAccent : C.accent }}>{pick(demo ? L.previewOff : L.preview, lg)}</Text>
          </Pressable>
        )}
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: insets.bottom + 24 }}>
        {phase === 'prep' && (
          <>
            {away && <Card tint={C.surface}><Text style={T.body}>{pick(L.awayHelp, lg)}</Text></Card>}
            <Text style={T.h2}>{pick(L.prep, lg)}</Text>
            <Text style={T.body}>{pick(L.p1, lg)}</Text>
            <Text style={T.body}>{pick(L.p2, lg)}</Text>
            <DuaBlock d={SAFA_AYAH} compact />
            <SectionTitle>{pick(L.vguide, lg)}</SectionTitle>
            <Segmented value={prefs.voice ? prefs.guide : 'off'} onChange={(v) => (v === 'off' ? (stopVoice(), setPrefs({ voice: false })) : setPrefs({ voice: true, guide: v as 'short' | 'full' }))}
              options={[{ value: 'off', label: pick(L.gOff, lg) }, { value: 'short', label: pick(L.gShort, lg) }, { value: 'full', label: pick(L.gFull, lg) }]} />
            <Text style={T.small}>{pick(prefs.voice && prefs.guide === 'full' ? L.gFullSub : L.gShortSub, lg)}</Text>
            <Btn title={pick(L.begin, lg)} icon="walk" onPress={begin} />
          </>
        )}

        {phase === 'active' && (
          <>
            {resumed && <Text style={[T.small, { color: C.open }]}>{pick(L.resumed, lg)}</Text>}
            <View style={{ gap: 10 }}>
              <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
                <Text style={{ fontSize: fs(28), fontWeight: '800', color: C.ink }}>
                  {st.started ? (lg === 'tr' ? `${current}. şavt` : lg === 'ar' ? `الشوط ${ORD.ar[current - 1]}` : `Trip ${current}`) : '—'}
                </Text>
                {st.started && (
                  <Text style={{ fontSize: fs(15), fontWeight: '700', color: C.accent }}>
                    {dirNow === 'toMarwa' ? `${pick(L.safa, lg)} → ${pick(L.marwa, lg)}` : `${pick(L.marwa, lg)} → ${pick(L.safa, lg)}`}
                  </Text>
                )}
                <Text style={T.muted}>{st.laps}/7 {pick(L.of, lg)}</Text>
              </View>
              <View style={{ flexDirection: 'row', gap: 6 }} accessibilityLabel={`${st.laps}/7`}>
                {Array.from({ length: SAY_TOTAL }, (_, i) => {
                  const done = i < st.laps;
                  const isNow = st.started && i === st.laps;
                  return (
                    <View key={i} style={{ flex: 1, height: 40, borderRadius: 8, alignItems: 'center', justifyContent: 'center', gap: 1, backgroundColor: done ? C.accent : isNow ? C.accentTint : C.surface, borderWidth: isNow ? 2 : 0, borderColor: C.route }}>
                      <Text style={{ fontSize: fs(13), fontWeight: '700', color: done ? C.onAccent : isNow ? C.accent : C.muted }}>{i + 1}</Text>
                      <Text style={{ fontSize: fs(10), color: done ? C.onAccent : C.muted }}>{i % 2 === 0 ? '→' : '←'}</Text>
                    </View>
                  );
                })}
              </View>
            </View>
            {!st.started && (
              <Card tint={C.greenTint} style={{ gap: 10 }}>
                <Text style={T.body}>{pick(L.waiting, lg)}</Text>
                <Btn title={pick(L.atSafa, lg)} kind="green" icon="flag" onPress={manualStart} />
              </Card>
            )}
            {st.wrongStart && !st.started && (
              <Card tint={C.limitedTint}><Text style={[T.body, { color: C.limited }]}>{pick(L.wrong, lg)}</Text></Card>
            )}
            <SectionTitle>{pick(nearEnd ? L.atEnd : L.between, lg)}</SectionTitle>
            {nearEnd ? <DuaBlock d={SAFA_DHIKR} compact /> : <DuaBlock d={SAY_BETWEEN} compact tint={C.surface} />}
            <Text style={T.small}>{pick(L.free, lg)}</Text>
            {st.started && (
              <View style={{ gap: 8 }}>
                <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
                  <IconBtn name="minus" label="−1" onPress={() => bump(-1)} />
                  <Btn title={`+1 · ${pick(L.plusOne, lg)}`} kind={prefs.auto && st.quality === 'good' && !demo ? 'secondary' : 'primary'} style={{ flex: 1 }} onPress={() => bump(1)} />
                </View>
                <Pressable onPress={() => setPrefs({ auto: !prefs.auto })} accessibilityRole="switch" accessibilityState={{ checked: prefs.auto }}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'flex-start', paddingVertical: 4 }}>
                  <View style={{ width: 34, height: 20, borderRadius: 10, backgroundColor: prefs.auto ? C.open : C.borderStrong, padding: 2, alignItems: prefs.auto ? 'flex-end' : 'flex-start' }}>
                    <View style={{ width: 16, height: 16, borderRadius: 8, backgroundColor: '#FFFFFF' }} />
                  </View>
                  <Text style={T.small}>{pick(prefs.auto ? L.auto : L.manual, lg)}</Text>
                </Pressable>
                <Text style={T.small}>{pick(L.countNote, lg)}</Text>
              </View>
            )}
          </>
        )}

        {phase === 'done' && (
          <>
            <Card tint={C.openTint} style={{ alignItems: 'center', gap: 6, paddingVertical: 18 }}>
              <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: C.open, alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="check" size={26} color="#FFFFFF" width={3} />
              </View>
              <Text style={T.h2}>{pick(L.done, lg)}</Text>
              <Text style={T.body}>{pick(L.accept, lg)}</Text>
            </Card>
            <SectionTitle>{pick(L.next, lg)}</SectionTitle>
            {tiras.todo.map((x, i) => (
              <View key={i} style={{ flexDirection: 'row', gap: 10 }}>
                <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: C.openTint, alignItems: 'center', justifyContent: 'center', marginTop: 1 }}>
                  <Icon name="check" size={13} color={C.open} width={3} />
                </View>
                <Text style={[T.body, { flex: 1 }]}>{pick(x, lg)}</Text>
              </View>
            ))}
            <Btn title={pick(L.guide, lg)} icon="list" onPress={() => router.push('/umre')} />
            <Btn title={pick(L.again, lg)} kind="secondary" onPress={reset} />
          </>
        )}
      </ScrollView>

      {locked && (
        <Pressable onLongPress={() => setLocked(false)} delayLongPress={1200} accessibilityLabel={pick(L.locked, lg)}
          style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, backgroundColor: 'rgba(23,24,28,0.92)', alignItems: 'center', justifyContent: 'center', gap: 14, padding: 24 }}>
          <Text style={{ color: '#FFFFFF', fontSize: fs(64), fontWeight: '800' }}>{st.started ? current : '—'}</Text>
          <Text style={{ color: '#FFFFFF', fontSize: fs(18), fontWeight: '700' }}>
            {st.started ? (dirNow === 'toMarwa' ? `${pick(L.safa, lg)} → ${pick(L.marwa, lg)}` : `${pick(L.marwa, lg)} → ${pick(L.safa, lg)}`) : pick(L.title, lg)}
          </Text>
          <Icon name="lock" size={22} color="#FFFFFF" />
          <Text style={{ color: '#C9CCD3', fontSize: fs(14), textAlign: 'center' }}>{pick(L.locked, lg)}</Text>
        </Pressable>
      )}
    </View>
  );
}

/** Mes'a şeridi: solda Safâ, sağda Merve; konum noktası ve gidilen yön. */
function MasaBar({ width, s, toward, lg }: { width: number; s?: number; toward?: 'safa' | 'marwa'; lg: Lang }) {
  const h = 132;
  const x0 = 44;
  const x1 = width - 44;
  const y = 82;
  const pos = s === undefined ? undefined : x0 + ((x1 - x0) * Math.max(0, Math.min(MASA_LENGTH, s))) / MASA_LENGTH;
  const hill = (cx: number) => `M${cx - 30} ${y + 16} Q${cx - 18} ${y - 22} ${cx} ${y - 24} Q${cx + 18} ${y - 22} ${cx + 30} ${y + 16} Z`;
  return (
    <Svg width={width} height={h}>
      <Rect x={0} y={34} width={width} height={h - 40} rx={18} fill={C.surface} />
      <Path d={hill(x0)} fill={C.limitedTint} />
      <Path d={hill(x1)} fill={C.limitedTint} />
      <Line x1={x0} y1={y} x2={x1} y2={y} stroke={C.borderStrong} strokeWidth={10} strokeLinecap="round" />
      {Array.from({ length: 9 }, (_, i) => {
        const x = x0 + ((x1 - x0) * (i + 1)) / 10;
        return <Line key={i} x1={x} y1={y - 3} x2={x} y2={y + 3} stroke={C.bg} strokeWidth={1.5} />;
      })}
      <SvgText x={x0} y={y + 34} fontSize={13} fontWeight="700" fill={C.ink} textAnchor="middle" fontFamily={SVG_FONT}>{pick(L.safa, lg)}</SvgText>
      <SvgText x={x1} y={y + 34} fontSize={13} fontWeight="700" fill={C.ink} textAnchor="middle" fontFamily={SVG_FONT}>{pick(L.marwa, lg)}</SvgText>
      <SvgText x={(x0 + x1) / 2} y={y + 34} fontSize={11} fill={C.muted} textAnchor="middle" fontFamily={SVG_FONT}>≈{Math.round(MASA_LENGTH / 10) * 10} m</SvgText>
      {pos !== undefined && (
        <G>
          {toward && (
            <Path d={toward === 'marwa' ? `M${pos + 14} ${y - 6} l10 6 l-10 6 z` : `M${pos - 14} ${y - 6} l-10 6 l10 6 z`} fill={C.route} />
          )}
          <Circle cx={pos} cy={y} r={14} fill={C.user} opacity={0.18} />
          <Circle cx={pos} cy={y} r={7} fill={C.user} stroke="#FFFFFF" strokeWidth={2.5} />
        </G>
      )}
    </Svg>
  );
}
