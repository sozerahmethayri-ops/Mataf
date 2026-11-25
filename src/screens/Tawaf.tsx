import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { useKeepAwake } from 'expo-keep-awake';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Platform, Pressable, ScrollView, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DuaBlock } from '@/components/DuaBlock';
import { Icon } from '@/components/Icon';
import { TawafScene } from '@/components/TawafScene';
import { Btn, Card, IconBtn, SectionTitle, T } from '@/components/ui';
import { C, shadow, fs } from '@/constants/theme';
import type { ML } from '@/data/sites';
import {
  AFTER, COUNT_NOTE, FREE_NOTE, ISTILAM, NIYET_NOTE, PREP, TAWAF_DHIKR, TAWAF_TYPES, ZONES, niyet, type TawafType,
} from '@/data/tawaf';
import { pick, useI18n } from '@/i18n';
import {
  CORNERS, LAPS_TOTAL, adjustLap, bearingOf, initialLap, lapLength, pointAt, startManual, stepLap, zoneOf,
  type Fix, type LapEvent, type LapState, type ZoneId,
} from '@/services/tawaf';
import { DEMO_RADIUS, useTawafFeed } from '@/services/tawafFeed';
import { usePersisted } from '@/services/usePersisted';
import { duaSpeech, playSequence, stopVoice, type SpeechItem } from '@/services/voice';

type Phase = 'prep' | 'active' | 'done';
type Lang = 'tr' | 'en' | 'ar';

const L = {
  title: { tr: 'Tavaf asistanı', en: 'Tawaf assistant', ar: 'مساعد الطواف' },
  prep: { tr: 'Tavafa hazırlık', en: 'Before you start', ar: 'قبل البدء' },
  type: { tr: 'Tavaf türü', en: 'Type of tawaf', ar: 'نوع الطواف' },
  intention: { tr: 'Niyet', en: 'Intention', ar: 'النية' },
  begin: { tr: 'Tavafa başla', en: 'Start tawaf', ar: 'ابدأ الطواف' },
  waiting: { tr: 'Hacerü’l-Esved hizasını geçince sayım kendiliğinden başlar.', en: 'Counting starts automatically when you pass the Black Stone line.', ar: 'يبدأ العدّ تلقائيًا عند تجاوز خط الحجر الأسود.' },
  atLine: { tr: 'Hizadayım, başlat', en: 'I’m at the line — start', ar: 'أنا عند الخط، ابدأ' },
  round: { tr: '. şavt', en: '', ar: '' },
  of: { tr: 'tamamlandı', en: 'completed', ar: 'مكتملة' },
  plusOne: { tr: 'Şavtı tamamladım', en: 'Round completed', ar: 'أتممت الشوط' },
  suggestion: { tr: 'Bu şavt için öneri', en: 'Suggested for this round', ar: 'مقترح لهذا الشوط' },
  ramal: { tr: 'Erkekler: ilk üç şavtta remel', en: 'Men: ramal in the first three rounds', ar: 'للرجال: الرَّمَل في الأشواط الثلاثة الأولى' },
  done: { tr: 'Tavafınız tamamlandı', en: 'Your tawaf is complete', ar: 'تمّ طوافك' },
  accept: { tr: 'Allah kabul etsin.', en: 'May Allah accept it.', ar: 'تقبّل الله منك.' },
  next: { tr: 'Sıradaki adımlar', en: 'What to do next', ar: 'الخطوات التالية' },
  again: { tr: 'Yeni tavaf', en: 'New tawaf', ar: 'طواف جديد' },
  demo: { tr: 'Önizleme · örnek yürüyüş', en: 'Preview · simulated walk', ar: 'معاينة · مشي تجريبي' },
  away: { tr: 'Mescid-i Haram’da değilsiniz', en: 'You are not at the Haram', ar: 'لست في المسجد الحرام' },
  awayHelp: { tr: 'Konumunuz Kâbe çevresinde olmadığı için şavtlar kendiliğinden sayılmaz. Tavafta konumunuz 3D sahnede gösterilir ve görünüm sizinle döner. Şimdi denemek için önizlemeyi açabilir ya da şavtları elle sayabilirsiniz.', en: 'You are not near the Kaaba, so rounds are not counted automatically. During tawaf your position is shown in 3D and the view turns with you. You can try the preview or count rounds manually.', ar: 'لست قرب الكعبة، لذلك لا تُعدّ الأشواط تلقائيًا. يمكنك تجربة المعاينة أو العدّ يدويًا.' },
  preview: { tr: 'Önizleme', en: 'Preview', ar: 'معاينة' },
  previewOff: { tr: 'Önizlemeyi kapat', en: 'Stop preview', ar: 'إيقاف المعاينة' },
  gpsGood: { tr: 'GPS iyi', en: 'GPS good', ar: 'GPS جيد' },
  gpsWeak: { tr: 'GPS zayıf · elle sayın', en: 'Weak GPS · count manually', ar: 'GPS ضعيف · عُدّ يدويًا' },
  gpsNone: { tr: 'Konum bekleniyor', en: 'Waiting for location', ar: 'في انتظار الموقع' },
  denied: { tr: 'Konum izni yok · elle sayın', en: 'No location permission · count manually', ar: 'لا إذن للموقع · عُدّ يدويًا' },
  voiceOn: { tr: 'Sesli asistan açık', en: 'Voice on', ar: 'الصوت مفعّل' },
  voiceOff: { tr: 'Sesli asistan kapalı', en: 'Voice off', ar: 'الصوت متوقف' },
  auto: { tr: 'Otomatik sayım', en: 'Auto count', ar: 'العدّ التلقائي' },
  manual: { tr: 'Elle sayım', en: 'Manual count', ar: 'العدّ اليدوي' },
  follow: { tr: 'Beni takip et', en: 'Follow me', ar: 'تتبّعني' },
  lock: { tr: 'Ekranı kilitle', en: 'Lock screen', ar: 'قفل الشاشة' },
  locked: { tr: 'Ekran kilitli — açmak için basılı tutun', en: 'Screen locked — press and hold to unlock', ar: 'الشاشة مقفلة — اضغط مطولًا لفتحها' },
  lapLen: { tr: 'Bu halkada bir şavt ≈', en: 'One round on this ring ≈', ar: 'الشوط في هذه الحلقة ≈' },
  resumed: { tr: 'Yarım kalan tavaf geri yüklendi', en: 'Unfinished tawaf restored', ar: 'تمت استعادة الطواف غير المكتمل' },
} satisfies Record<string, ML>;

const ORD: Record<Lang, string[]> = {
  tr: ['birinci', 'ikinci', 'üçüncü', 'dördüncü', 'beşinci', 'altıncı', 'yedinci'],
  en: ['first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh'],
  ar: ['الأول', 'الثاني', 'الثالث', 'الرابع', 'الخامس', 'السادس', 'السابع'],
};
function lapAnnouncement(completed: number, lang: Lang): string {
  const o = ORD[lang];
  if (lang === 'en') return completed === 0 ? 'Tawaf started. First round.' : `${o[completed - 1]} round complete. ${o[completed]} round.`.replace(/^./, (c) => c.toUpperCase());
  if (lang === 'ar') return completed === 0 ? 'بدأ الطواف. الشوط الأول.' : `انتهى الشوط ${o[completed - 1]}. الشوط ${o[completed]}.`;
  return completed === 0 ? 'Tavaf başladı. Birinci şavt.' : `${o[completed - 1]} şavt tamamlandı. ${o[completed]} şavt.`.replace(/^./, (c) => c.toLocaleUpperCase('tr'));
}
const ZONE_VOICE: Partial<Record<ZoneId, ML>> = {
  yamani: { tr: 'Rükn-i Yemânî. Dokunabiliyorsanız sağ elinizle dokunun.', en: 'Yemeni Corner. Touch it with your right hand if you can.', ar: 'الركن اليماني. استلمه بيدك اليمنى إن تيسّر.' },
  hijr: { tr: 'Hatîm. Duvarın dışından geçin.', en: 'Hatim. Stay outside the wall.', ar: 'الحِجر. طُف من خارجه.' },
};
const DONE_VOICE: ML = { tr: 'Yedi şavt tamamlandı. Allah kabul etsin.', en: 'Seven rounds complete. May Allah accept it.', ar: 'تمت الأشواط السبعة. تقبّل الله منك.' };

const haptic = (kind: 'lap' | 'done') => {
  if (Platform.OS === 'web') return;
  (kind === 'done'
    ? Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    : Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)
  ).catch(() => undefined);
};

const SAVE_KEY = 'tawaf:session';

export default function TawafScreen() {
  useKeepAwake();
  const { lang } = useI18n();
  const insets = useSafeAreaInsets();
  const { height: winH } = useWindowDimensions();
  const [prefs, setPrefs] = usePersisted('tawaf:prefs', { type: 'umre' as TawafType, voice: true, auto: true, follow: true });
  const [phase, setPhase] = useState<Phase>('prep');
  const [lap, setLap] = useState<LapState>(initialLap);
  const [fix, setFix] = useState<Fix | null>(null);
  const [locked, setLocked] = useState(false);
  const [width, setWidth] = useState(390);
  const [resumed, setResumed] = useState(false);
  const [forceDemo, setForceDemo] = useState(false);

  // Geri çağrılarda en güncel değerler
  const lapRef = useRef(lap);
  const phaseRef = useRef(phase);
  const prefsRef = useRef(prefs);
  const langRef = useRef(lang as Lang);
  const zoneRef = useRef<ZoneId | undefined>(undefined);
  useEffect(() => { phaseRef.current = phase; prefsRef.current = prefs; langRef.current = lang as Lang; });

  const speak = (items: SpeechItem[]) => { if (prefsRef.current.voice) playSequence(items).catch(() => undefined); };

  const onEvents = (events: LapEvent[]) => {
    const lg = langRef.current;
    for (const e of events) {
      if (e.type === 'start' || e.type === 'lap') {
        haptic('lap');
        speak([{ kind: 'speak', text: lapAnnouncement(e.type === 'start' ? 0 : e.laps, lg), lang: lg }, ...duaSpeech(ISTILAM)]);
      } else if (e.type === 'done') {
        haptic('done');
        speak([{ kind: 'speak', text: pick(DONE_VOICE, lg), lang: lg }, ...duaSpeech(ISTILAM)]);
        setPhase('done');
      }
    }
  };

  const onFix = (f: Fix) => {
    setFix(f);
    if (phaseRef.current !== 'active') return;
    const prev = lapRef.current;
    const res = stepLap(prev, f);
    let st = res.st;
    let events = res.events;
    if (!prefsRef.current.auto && prev.started) {
      // Elle sayımda şavtı yalnız düğme artırır; açı yine bölge ve yay için izlenir.
      st = { ...st, laps: prev.laps, U: 360 * prev.laps + Math.min(st.last ?? 0, 359) };
      events = [];
    }
    lapRef.current = st;
    setLap(st);
    onEvents(events);
    // Bölge değişince kısa sesli yönlendirme
    if (st.started && st.last !== undefined) {
      const z = zoneOf(st.last);
      if (z !== zoneRef.current) {
        zoneRef.current = z;
        const lg = langRef.current;
        if (z === 'rabbana') speak(duaSpeech(ZONES.rabbana.dua!));
        else if (ZONE_VOICE[z]) speak([{ kind: 'speak', text: pick(ZONE_VOICE[z]!, lg), lang: lg }]);
      }
    }
  };

  const { denied, source } = useTawafFeed({ walking: phase === 'active', speed: 8, forceDemo, onFix });
  const demo = source === 'demo';
  const away = source === 'away';

  // Yarım kalan tavafı geri yükle (3 saate kadar)
  useEffect(() => {
    AsyncStorage.getItem(SAVE_KEY).then((raw) => {
      if (!raw) return;
      const s = JSON.parse(raw) as { phase: Phase; laps: number; t: number };
      if (s.phase === 'active' && Date.now() - s.t < 3 * 3600e3 && s.laps > 0) {
        const st = { ...startManual(initialLap()), laps: s.laps, U: 360 * s.laps };
        lapRef.current = st;
        setLap(st);
        setPhase('active');
        setResumed(true);
      }
    }).catch(() => undefined);
    return () => { stopVoice(); };
  }, []);
  useEffect(() => {
    AsyncStorage.setItem(SAVE_KEY, JSON.stringify({ phase, laps: lap.laps, t: Date.now() })).catch(() => undefined);
  }, [phase, lap.laps]);

  const begin = () => { lapRef.current = initialLap(); setLap(lapRef.current); zoneRef.current = undefined; setPhase('active'); setResumed(false); };
  const manualStart = () => { const st = startManual(lapRef.current); lapRef.current = st; setLap(st); onEvents([{ type: 'start' }]); };
  const bump = (d: 1 | -1) => {
    const st = adjustLap(lapRef.current, d);
    lapRef.current = st;
    setLap(st);
    if (d > 0) onEvents([st.laps >= LAPS_TOTAL ? { type: 'done' } : { type: 'lap', laps: st.laps }]);
  };
  const reset = () => { stopVoice(); lapRef.current = initialLap(); setLap(lapRef.current); setPhase('prep'); };

  // Görünüm
  const sceneH = Math.round(Math.min(430, Math.max(300, winH * 0.44)));
  const ringR = lap.radius ?? (fix ? Math.hypot(fix.p[0], fix.p[1]) : DEMO_RADIUS);
  const userPos = lap.started && lap.last !== undefined && lap.quality === 'good' ? pointAt(lap.last, ringR) : fix?.p;
  // Takip: kamera kullanıcının arkasında, Kâbe'ye bakar; her yeni ölçümde görünüm sizinle birlikte döner
  const viewerBearing = prefs.follow && userPos && !away ? Math.round(bearingOf(userPos)) : bearingOf(CORNERS.aswad) + 30;
  const zone: ZoneId | undefined = phase === 'active' && lap.last !== undefined ? zoneOf(lap.last) : undefined;
  const typeDef = TAWAF_TYPES.find((x) => x.id === prefs.type)!;
  const ramal = typeDef.ramal !== 'no';
  const zoneInfo = zone ? ZONES[zone] : undefined;
  const suggestion = TAWAF_DHIKR[lap.laps % TAWAF_DHIKR.length];
  const pill = demo ? { text: pick(L.demo, lang), bg: C.accentTint, fg: C.accent }
    : away ? { text: pick(denied ? L.denied : L.away, lang), bg: C.surface, fg: C.muted }
    : lap.quality === 'good' ? { text: `${pick(L.gpsGood, lang)} · ±${Math.round(fix?.acc ?? 0)} m`, bg: C.openTint, fg: C.open }
      : lap.quality === 'weak' ? { text: pick(L.gpsWeak, lang), bg: C.limitedTint, fg: C.limited }
        : { text: pick(L.gpsNone, lang), bg: C.surface, fg: C.muted };

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <View style={{ paddingTop: insets.top + 6, paddingHorizontal: 12, paddingBottom: 8, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <IconBtn name="back" label="Geri" onPress={() => router.back()} />
        <View style={{ flex: 1 }}>
          <Text style={T.h2} numberOfLines={1}>{pick(L.title, lang)}</Text>
          <Text style={T.small} numberOfLines={1}>{pick(typeDef.name, lang)}</Text>
        </View>
        <IconBtn name={prefs.voice ? 'speaker' : 'mute'} label={pick(prefs.voice ? L.voiceOn : L.voiceOff, lang)} tint={prefs.voice ? C.accentTint : C.surface} color={prefs.voice ? C.accent : C.muted}
          onPress={() => { if (prefs.voice) stopVoice(); setPrefs({ voice: !prefs.voice }); }} />
        <IconBtn name="lock" label={pick(L.lock, lang)} onPress={() => setLocked(true)} />
      </View>

      <View onLayout={(e) => setWidth(Math.round(e.nativeEvent.layout.width))}>
        <TawafScene width={width} height={sceneH} viewerBearing={viewerBearing} user={away ? undefined : userPos} acc={demo ? undefined : fix?.acc}
          radius={ringR} progress={phase === 'active' && lap.started ? lap.last : undefined} zone={zone} demo={demo} />
        <View style={{ position: 'absolute', left: 10, top: 10, flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, height: 28, borderRadius: 14, backgroundColor: pill.bg }}>
          <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: pill.fg }} />
          <Text style={{ fontSize: fs(11.5), fontWeight: '700', color: pill.fg }}>{pill.text}</Text>
        </View>
        <Pressable onPress={() => setPrefs({ follow: !prefs.follow })} accessibilityRole="switch" accessibilityState={{ checked: prefs.follow }} accessibilityLabel={pick(L.follow, lang)}
          style={[{ position: 'absolute', right: 10, top: 10, width: 40, height: 40, borderRadius: 20, backgroundColor: prefs.follow ? C.user : C.bg, alignItems: 'center', justifyContent: 'center' }, shadow]}>
          <Icon name="compass" size={20} color={prefs.follow ? C.onInk : C.ink} />
        </Pressable>
        {(away || demo) && (
          <Pressable onPress={() => setForceDemo((v) => !v)} accessibilityRole="button"
            style={[{ position: 'absolute', left: 10, bottom: 10, height: 34, paddingHorizontal: 12, borderRadius: 17, flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: demo ? C.accent : C.bg }, shadow]}>
            <Icon name={demo ? 'stop' : 'play'} size={14} color={demo ? C.onAccent : C.accent} fill={demo ? C.onAccent : C.accent} />
            <Text style={{ fontSize: fs(12.5), fontWeight: '700', color: demo ? C.onAccent : C.accent }}>{pick(demo ? L.previewOff : L.preview, lang)}</Text>
          </Pressable>
        )}
        {phase === 'active' && (
          <View style={[{ position: 'absolute', right: 10, bottom: 10, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, backgroundColor: C.overlay }]}>
            <Text style={T.small}>{pick(L.lapLen, lang)} {Math.round(lapLength(ringR) / 10) * 10} m</Text>
          </View>
        )}
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: insets.bottom + 24 }}>
        {phase === 'prep' && (
          <>
            {away && <Card tint={C.surface}><Text style={T.body}>{pick(L.awayHelp, lang)}</Text></Card>}
            <Text style={T.h2}>{pick(L.prep, lang)}</Text>
            <SectionTitle>{pick(L.type, lang)}</SectionTitle>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {TAWAF_TYPES.map((x) => (
                <Pressable key={x.id} onPress={() => setPrefs({ type: x.id })} accessibilityRole="radio" accessibilityState={{ selected: prefs.type === x.id }}
                  style={{ height: 36, paddingHorizontal: 14, borderRadius: 18, justifyContent: 'center', backgroundColor: prefs.type === x.id ? C.ink : C.surface }}>
                  <Text style={{ fontSize: fs(13), fontWeight: '600', color: prefs.type === x.id ? C.onInk : C.ink }}>{pick(x.name, lang)}</Text>
                </Pressable>
              ))}
            </View>
            <Card tint={C.accentSoft} style={{ gap: 6 }}>
              <Text style={[T.small, { color: C.accent, fontWeight: '700' }]}>{pick(L.intention, lang)}</Text>
              <Text style={T.body}>{niyet(prefs.type, lang as Lang)}</Text>
              <Text style={T.small}>{pick(NIYET_NOTE, lang)}</Text>
            </Card>
            {PREP.filter((p) => !p.ramalOnly || ramal).map((p) => (
              <View key={p.id} style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start' }}>
                <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: C.openTint, alignItems: 'center', justifyContent: 'center', marginTop: 1 }}>
                  <Icon name="check" size={13} color={C.open} width={3} />
                </View>
                <Text style={[T.body, { flex: 1 }]}>{pick(p.text, lang)}</Text>
              </View>
            ))}
            <Btn title={pick(L.begin, lang)} icon="kaaba" onPress={begin} />
          </>
        )}

        {phase === 'active' && (
          <>
            {resumed && <Text style={[T.small, { color: C.open }]}>{pick(L.resumed, lang)}</Text>}
            <LapCounter laps={lap.laps} started={lap.started} lang={lang as Lang} />
            {!lap.started ? (
              <Card tint={C.greenTint} style={{ gap: 10 }}>
                <Text style={T.body}>{pick(L.waiting, lang)}</Text>
                <Btn title={pick(L.atLine, lang)} kind="green" icon="flag" onPress={manualStart} />
              </Card>
            ) : null}
            {lap.started && ramal && lap.laps < 3 ? (
              <View style={{ alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12, backgroundColor: C.userTint }}>
                <Text style={{ fontSize: fs(12), fontWeight: '700', color: C.user }}>{pick(L.ramal, lang)}</Text>
              </View>
            ) : null}
            {zoneInfo && (
              <Card style={{ gap: 8, borderWidth: 1, borderColor: C.border }}>
                <Text style={T.h3}>{pick(zoneInfo.title, lang)}</Text>
                <Text style={T.body}>{pick(zoneInfo.text, lang)}</Text>
                {zoneInfo.ref ? <Text style={T.small}>{zoneInfo.ref}</Text> : null}
                {zoneInfo.dua ? <DuaBlock d={zoneInfo.dua} compact /> : null}
              </Card>
            )}
            {lap.started && !zoneInfo?.dua && (
              <View style={{ gap: 8 }}>
                <SectionTitle>{pick(L.suggestion, lang)}</SectionTitle>
                <DuaBlock d={suggestion} compact tint={C.surface} />
                <Text style={T.small}>{pick(FREE_NOTE, lang)}</Text>
              </View>
            )}
            {lap.started && (
              <View style={{ gap: 8 }}>
                <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
                  <IconBtn name="minus" label="−1" onPress={() => bump(-1)} />
                  <Btn title={`+1 · ${pick(L.plusOne, lang)}`} kind={prefs.auto && lap.quality === 'good' && !demo ? 'secondary' : 'primary'} style={{ flex: 1 }} onPress={() => bump(1)} />
                </View>
                <Pressable onPress={() => setPrefs({ auto: !prefs.auto })} accessibilityRole="switch" accessibilityState={{ checked: prefs.auto }}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'flex-start', paddingVertical: 4 }}>
                  <View style={{ width: 34, height: 20, borderRadius: 10, backgroundColor: prefs.auto ? C.open : C.borderStrong, padding: 2, alignItems: prefs.auto ? 'flex-end' : 'flex-start' }}>
                    <View style={{ width: 16, height: 16, borderRadius: 8, backgroundColor: '#FFFFFF' }} />
                  </View>
                  <Text style={T.small}>{pick(prefs.auto ? L.auto : L.manual, lang)}</Text>
                </Pressable>
                <Text style={T.small}>{pick(COUNT_NOTE, lang)}</Text>
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
              <Text style={T.h2}>{pick(L.done, lang)}</Text>
              <Text style={T.body}>{pick(L.accept, lang)}</Text>
            </Card>
            <SectionTitle>{pick(L.next, lang)}</SectionTitle>
            {AFTER.filter((a) => !a.ramalOnly || ramal).map((a, i) => (
              <View key={a.id} style={{ gap: 8 }}>
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: C.accentTint, alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ fontSize: fs(12), fontWeight: '700', color: C.accent }}>{i + 1}</Text>
                  </View>
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={T.h3}>{pick(a.title, lang)}</Text>
                    <Text style={T.body}>{pick(a.text, lang)}</Text>
                  </View>
                </View>
                {a.dua ? <DuaBlock d={a.dua} compact /> : null}
              </View>
            ))}
            <Btn title={pick(L.again, lang)} kind="secondary" onPress={reset} />
          </>
        )}
      </ScrollView>

      {locked && (
        <Pressable onLongPress={() => setLocked(false)} delayLongPress={1200} accessibilityLabel={pick(L.locked, lang)}
          style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, backgroundColor: 'rgba(23,24,28,0.92)', alignItems: 'center', justifyContent: 'center', gap: 14, padding: 24 }}>
          <Text style={{ color: '#FFFFFF', fontSize: fs(64), fontWeight: '800' }}>{Math.min(LAPS_TOTAL, lap.laps + (lap.started ? 1 : 0))}</Text>
          <Text style={{ color: '#FFFFFF', fontSize: fs(18), fontWeight: '700' }}>{zoneInfo ? pick(zoneInfo.title, lang) : pick(L.title, lang)}</Text>
          <Icon name="lock" size={22} color="#FFFFFF" />
          <Text style={{ color: '#C9CCD3', fontSize: fs(14), textAlign: 'center' }}>{pick(L.locked, lang)}</Text>
        </Pressable>
      )}
    </View>
  );
}

function LapCounter({ laps, started, lang }: { laps: number; started: boolean; lang: Lang }) {
  const current = Math.min(LAPS_TOTAL, laps + 1);
  const label = lang === 'tr' ? `${current}. şavt` : lang === 'ar' ? `الشوط ${ORD.ar[current - 1]}` : `Round ${current}`;
  return (
    <View style={{ gap: 10 }}>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 10 }}>
        <Text style={{ fontSize: fs(30), fontWeight: '800', color: C.ink }}>{started ? label : '—'}</Text>
        <Text style={T.muted}>{laps}/7 {pick(L.of, lang)}</Text>
      </View>
      <View style={{ flexDirection: 'row', gap: 6 }} accessibilityLabel={`${laps}/7`}>
        {Array.from({ length: LAPS_TOTAL }, (_, i) => {
          const done = i < laps;
          const now = started && i === laps;
          return (
            <View key={i} style={{ flex: 1, height: 30, borderRadius: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: done ? C.accent : now ? C.accentTint : C.surface, borderWidth: now ? 2 : 0, borderColor: C.route }}>
              <Text style={{ fontSize: fs(13), fontWeight: '700', color: done ? C.onAccent : now ? C.accent : C.muted }}>{i + 1}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}
