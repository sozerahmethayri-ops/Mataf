// Zikirmatik: hazır zikirler (Arapça + okunuş + anlam) ve kendi zikirleriniz; hedef, tur sayısı, titreşim,
// namaz sonrası tesbihat (33-33-34) sırası. Sayım her zikir için saklanır; "Kaydet" ile tarih, sayı ve
// isteğe bağlı notla deftere yazılır.
import * as Haptics from 'expo-haptics';
import { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { Icon } from '@/components/Icon';
import { BarChart } from '@/components/BarChart';
import { Btn, Chip, Header, SectionTitle, T } from '@/components/ui';
import { ZIKIR_GOALS, useZikirGoal } from '@/components/ZikirCard';
import { C, fs, fsAr } from '@/constants/theme';
import { pick, useI18n } from '@/i18n';
import { useTheme } from '@/services/ThemeContext';
import { usePersisted } from '@/services/usePersisted';
import { zikirStats } from '@/services/zikirStats';
import { SafeAreaView } from 'react-native-safe-area-context';

type Lang = 'tr' | 'en' | 'ar';
type ML = { tr: string; en: string; ar: string };
export type Dhikr = { id: string; ar: string; tr: string; mean: ML; target: number; custom?: boolean };

export const DHIKRS: Dhikr[] = [
  { id: 'subhanallah', ar: 'سُبْحَانَ ٱللَّٰهِ', tr: 'Sübhânallah', mean: { tr: 'Allah her türlü eksiklikten münezzehtir', en: 'Glory be to Allah', ar: 'سبحان الله' }, target: 33 },
  { id: 'elhamdulillah', ar: 'ٱلْحَمْدُ لِلَّٰهِ', tr: 'Elhamdülillâh', mean: { tr: 'Hamd Allah’a mahsustur', en: 'All praise is due to Allah', ar: 'الحمد لله' }, target: 33 },
  { id: 'allahuekber', ar: 'ٱللَّٰهُ أَكْبَرُ', tr: 'Allâhu ekber', mean: { tr: 'Allah en büyüktür', en: 'Allah is the Greatest', ar: 'الله أكبر' }, target: 34 },
  { id: 'tevhid', ar: 'لَا إِلَٰهَ إِلَّا ٱللَّٰهُ', tr: 'Lâ ilâhe illallâh', mean: { tr: 'Allah’tan başka ilâh yoktur', en: 'There is no god but Allah', ar: 'لا إله إلا الله' }, target: 100 },
  { id: 'istigfar', ar: 'أَسْتَغْفِرُ ٱللَّٰهَ', tr: 'Estağfirullâh', mean: { tr: 'Allah’tan bağışlanma dilerim', en: 'I seek Allah’s forgiveness', ar: 'أستغفر الله' }, target: 100 },
  { id: 'salavat', ar: 'ٱللَّٰهُمَّ صَلِّ عَلَىٰ مُحَمَّدٍ', tr: 'Allâhümme salli alâ Muhammed', mean: { tr: 'Allah’ım, Muhammed’e salât eyle', en: 'O Allah, send blessings upon Muhammad', ar: 'اللهم صل على محمد' }, target: 100 },
  { id: 'subhanallahibihamdihi', ar: 'سُبْحَانَ ٱللَّٰهِ وَبِحَمْدِهِ', tr: 'Sübhânallâhi ve bihamdihî', mean: { tr: 'Allah’ı hamdiyle tesbih ederim', en: 'Glory and praise be to Allah', ar: 'سبحان الله وبحمده' }, target: 100 },
  { id: 'hawqala', ar: 'لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِٱللَّٰهِ', tr: 'Lâ havle velâ kuvvete illâ billâh', mean: { tr: 'Güç ve kuvvet ancak Allah’tandır', en: 'There is no power except with Allah', ar: 'لا حول ولا قوة إلا بالله' }, target: 100 },
];
const TESBIHAT = ['subhanallah', 'elhamdulillah', 'allahuekber'];
const TARGETS = [33, 99, 100, 500, 1000, 0];

const stamp = () => Date.now();
const nowDate = () => new Date();
type LogItem = { id: string; at: number; zid: string; name: string; count: number; note: string };
type State = { current: string; counts: Record<string, number>; targets: Record<string, number>; custom: Dhikr[]; tesbihat: boolean };

const L = {
  title: { tr: 'Zikirmatik', en: 'Dhikr counter', ar: 'المسبحة' },
  tap: { tr: 'Saymak için dokunun', en: 'Tap to count', ar: 'اضغط للعدّ' },
  round: { tr: 'tur', en: 'rounds', ar: 'دورة' },
  target: { tr: 'Hedef', en: 'Target', ar: 'الهدف' },
  none: { tr: 'Sınırsız', en: 'No limit', ar: 'بلا حد' },
  save: { tr: 'Deftere kaydet', en: 'Save to log', ar: 'حفظ في السجل' },
  reset: { tr: 'Sıfırla', en: 'Reset', ar: 'تصفير' },
  note: { tr: 'Not (isteğe bağlı): niyet, kimin için…', en: 'Note (optional): intention, for whom…', ar: 'ملاحظة (اختياري)' },
  log: { tr: 'Zikir defteri', en: 'Dhikr log', ar: 'سجل الأذكار' },
  empty: { tr: 'Henüz kayıt yok. Saydığınız zikri "Deftere kaydet" ile not edebilirsiniz.', en: 'No entries yet. Save a count with "Save to log".', ar: 'لا توجد سجلات بعد.' },
  todayTotal: { tr: 'Bugün toplam', en: 'Today in total', ar: 'مجموع اليوم' },
  dailyGoal: { tr: 'Günlük hedef', en: 'Daily goal', ar: 'الهدف اليومي' },
  goalOff: { tr: 'Kapalı', en: 'Off', ar: 'إيقاف' },
  goalSub: { tr: 'Ana sayfada bugünkü zikrinizle birlikte görünür.', en: 'Shown on the home screen with today’s dhikr.', ar: 'يظهر في الصفحة الرئيسية مع ذكر اليوم.' },
  tesbihat: { tr: 'Namaz sonrası tesbihat (33-33-34 sırayla)', en: 'After-prayer tasbih (33-33-34 in order)', ar: 'تسبيح بعد الصلاة (33-33-34)' },
  add: { tr: 'Kendi zikrini ekle', en: 'Add your own dhikr', ar: 'أضف ذكرك' },
  name: { tr: 'Zikir (ör. Yâ Latîf)', en: 'Dhikr (e.g. Ya Latif)', ar: 'الذكر' },
  addBtn: { tr: 'Ekle', en: 'Add', ar: 'إضافة' },
  del: { tr: 'Silinsin mi?', en: 'Delete?', ar: 'حذف؟' },
  done: { tr: 'Hedefe ulaşıldı', en: 'Target reached', ar: 'تم بلوغ الهدف' },
  stats: { tr: 'İstatistik (deftere kaydedilenler)', en: 'Statistics (saved entries)', ar: 'الإحصاءات' },
  sToday: { tr: 'Bugün', en: 'Today', ar: 'اليوم' },
  sWeek: { tr: 'Son 7 gün', en: 'Last 7 days', ar: 'آخر ٧ أيام' },
  sMonth: { tr: 'Bu ay', en: 'This month', ar: 'هذا الشهر' },
  sStreak: { tr: 'Seri', en: 'Streak', ar: 'متتالية' },
  dayUnit: { tr: 'gün', en: 'd', ar: 'يوم' },
  allTime: { tr: 'Toplam', en: 'All time', ar: 'الإجمالي' },
};

export default function Zikir() {
  const { lang } = useI18n();
  const lg = lang as Lang;
  const { prefs } = useTheme();
  const [st, setSt] = usePersisted<State>('zikir:state', { current: 'subhanallah', counts: {}, targets: {}, custom: [], tesbihat: false });
  const [log, setLog] = usePersisted<{ items: LogItem[] }>('zikir:log', { items: [] });
  const [goal, setGoal] = useZikirGoal();
  const [note, setNote] = useState('');
  const [newName, setNewName] = useState('');
  const [chartW, setChartW] = useState(340);
  const all = useMemo(() => [...DHIKRS, ...st.custom], [st.custom]);
  const cur = all.find((d) => d.id === st.current) ?? DHIKRS[0];
  const count = st.counts[cur.id] ?? 0;
  const target = st.targets[cur.id] ?? cur.target;
  const inRound = target ? count % target : count;
  const rounds = target ? Math.floor(count / target) : 0;
  const prog = target ? (count === 0 ? 0 : inRound === 0 ? 1 : inRound / target) : 0;

  const vib = (kind: 'tap' | 'goal') => {
    if (!prefs.haptics) return;
    (kind === 'tap' ? Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light) : Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)).catch(() => undefined);
  };
  const bump = (d: number) => {
    const next = Math.max(0, count + d);
    const counts = { ...st.counts, [cur.id]: next };
    const goal = d > 0 && target > 0 && next % target === 0;
    vib(goal ? 'goal' : 'tap');
    // Tesbihat: 33 → sonraki zikre geç
    if (goal && st.tesbihat && TESBIHAT.includes(cur.id)) {
      const i = TESBIHAT.indexOf(cur.id);
      if (i < TESBIHAT.length - 1) { setSt({ counts: { ...counts, [TESBIHAT[i + 1]]: 0 }, current: TESBIHAT[i + 1] }); return; }
    }
    setSt({ counts });
  };
  const save = () => {
    if (!count) return;
    const at = stamp();
    const item: LogItem = { id: String(at), at, zid: cur.id, name: cur.tr, count, note: note.trim() };
    setLog({ items: [item, ...log.items].slice(0, 5000) });
    setSt({ counts: { ...st.counts, [cur.id]: 0 } });
    setNote('');
  };
  const today = new Date().toDateString();
  const dayKey = today;
  const todayTotal = log.items.filter((i) => new Date(i.at).toDateString() === today).reduce((s, i) => s + i.count, 0) + Object.values(st.counts).reduce((s, n) => s + n, 0);

  const stats = useMemo(() => zikirStats(log.items, nowDate()), [log.items, dayKey]); // eslint-disable-line react-hooks/exhaustive-deps
  const R = 118;
  const circ = 2 * Math.PI * R;
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32, gap: 14 }} keyboardShouldPersistTaps="handled">
        <Header back title={pick(L.title, lg)} subtitle={`${pick(L.todayTotal, lg)}: ${todayTotal.toLocaleString(lang)}`} />

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          {all.map((d) => {
            const on = d.id === cur.id;
            return (
              <Pressable key={d.id} onPress={() => setSt({ current: d.id })} onLongPress={() => d.custom && Alert.alert(d.tr, pick(L.del, lg), [{ text: '✕' }, { text: 'OK', onPress: () => setSt({ custom: st.custom.filter((x) => x.id !== d.id), current: 'subhanallah' }) }])}
                style={{ height: 36, paddingHorizontal: 14, borderRadius: 18, justifyContent: 'center', backgroundColor: on ? C.ink : C.surface }}>
                <Text style={{ fontSize: fs(13), fontWeight: on ? '700' : '500', color: on ? C.onInk : C.ink }}>{d.tr}</Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <View style={{ alignItems: 'center', gap: 4 }}>
          <Text style={{ fontSize: fsAr(30), color: C.ink, textAlign: 'center', writingDirection: 'rtl' }}>{cur.ar}</Text>
          <Text style={{ fontSize: fs(13), color: C.muted, textAlign: 'center' }}>{pick(cur.mean, lg)}</Text>
        </View>

        {/* Sayaç: dairenin her yerine dokunulabilir */}
        <Pressable onPress={() => bump(1)} accessibilityRole="button" accessibilityLabel={`${cur.tr} ${count}`}
          style={({ pressed }) => ({ alignSelf: 'center', width: 2 * R + 28, height: 2 * R + 28, alignItems: 'center', justifyContent: 'center', transform: [{ scale: pressed && !prefs.reduceMotion ? 0.985 : 1 }] })}>
          <Svg width={2 * R + 28} height={2 * R + 28} style={{ position: 'absolute' }}>
            <Circle cx={R + 14} cy={R + 14} r={R} fill={C.accentSoft} stroke={C.accentTint} strokeWidth={12} />
            {target > 0 && <Circle cx={R + 14} cy={R + 14} r={R} fill="none" stroke={C.route} strokeWidth={12} strokeLinecap="round"
              strokeDasharray={`${circ * prog} ${circ}`} rotation={-90} origin={`${R + 14}, ${R + 14}`} />}
          </Svg>
          <Text style={{ fontSize: fs(64), fontWeight: '700', color: C.ink, fontVariant: ['tabular-nums'] }}>{target ? (count && inRound === 0 ? target : inRound) : count}</Text>
          <Text style={{ fontSize: fs(13), color: C.muted }}>{target ? `/ ${target}${rounds ? ` · ${rounds} ${pick(L.round, lg)}` : ''}` : pick(L.tap, lg)}</Text>
          {target > 0 && count > 0 && inRound === 0 && <Text style={{ fontSize: fs(13), color: C.open, fontWeight: '700', marginTop: 4 }}>{pick(L.done, lg)} ✓</Text>}
        </Pressable>

        <View style={{ flexDirection: 'row', gap: 10, justifyContent: 'center' }}>
          <Btn title="−1" kind="secondary" onPress={() => bump(-1)} style={{ minWidth: 72 }} />
          <Btn title={pick(L.reset, lg)} kind="secondary" onPress={() => setSt({ counts: { ...st.counts, [cur.id]: 0 } })} />
        </View>

        <Text style={T.small}>{pick(L.target, lg)}</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {TARGETS.map((n) => {
            const on = n === target;
            return (
              <Pressable key={n} onPress={() => setSt({ targets: { ...st.targets, [cur.id]: n } })}
                style={{ height: 34, minWidth: 52, paddingHorizontal: 12, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: on ? C.accentTint : C.surface }}>
                <Text style={{ fontSize: fs(13), fontWeight: on ? '700' : '500', color: on ? C.accent : C.ink }}>{n || pick(L.none, lg)}</Text>
              </Pressable>
            );
          })}
        </View>
        <Pressable onPress={() => setSt({ tesbihat: !st.tesbihat, ...(st.tesbihat ? {} : { current: 'subhanallah', counts: { ...st.counts, subhanallah: 0, elhamdulillah: 0, allahuekber: 0 } }) })}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6 }}>
          <View style={{ width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: st.tesbihat ? C.accent : C.borderStrong, backgroundColor: st.tesbihat ? C.accent : 'transparent', alignItems: 'center', justifyContent: 'center' }}>
            {st.tesbihat && <Icon name="check" size={14} color={C.onAccent} width={3} />}
          </View>
          <Text style={[T.body, { flex: 1 }]}>{pick(L.tesbihat, lg)}</Text>
        </Pressable>

        <TextInput value={note} onChangeText={setNote} placeholder={pick(L.note, lg)} placeholderTextColor={C.muted}
          style={{ minHeight: 44, borderRadius: 14, backgroundColor: C.surface, paddingHorizontal: 14, fontSize: fs(14), color: C.ink }} />
        <Btn title={pick(L.save, lg)} icon="bookmark" onPress={save} disabled={!count} />

        <SectionTitle>{pick(L.add, lg)}</SectionTitle>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TextInput value={newName} onChangeText={setNewName} placeholder={pick(L.name, lg)} placeholderTextColor={C.muted}
            style={{ flex: 1, height: 44, borderRadius: 14, backgroundColor: C.surface, paddingHorizontal: 14, fontSize: fs(14), color: C.ink }} />
          <Btn title={pick(L.addBtn, lg)} kind="secondary" disabled={!newName.trim()} onPress={() => {
            const d: Dhikr = { id: `c${stamp()}`, ar: '', tr: newName.trim(), mean: { tr: '', en: '', ar: '' }, target: 100, custom: true };
            setSt({ custom: [...st.custom, d], current: d.id });
            setNewName('');
          }} />
        </View>

        <SectionTitle>{pick(L.dailyGoal, lg)}</SectionTitle>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {ZIKIR_GOALS.map((g) => <Chip key={g} label={g ? g.toLocaleString(lang) : pick(L.goalOff, lg)} active={goal === g} onPress={() => setGoal(g)} />)}
        </View>
        <Text style={T.small}>{pick(L.goalSub, lg)}</Text>

        {log.items.length > 0 && (
          <>
            <SectionTitle>{pick(L.stats, lg)}</SectionTitle>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {[
                { k: L.sToday, v: stats.today },
                { k: L.sWeek, v: stats.weekTotal },
                { k: L.sMonth, v: stats.month },
                { k: L.sStreak, v: stats.streak, unit: pick(L.dayUnit, lg) },
              ].map((x) => (
                <View key={x.k.tr} style={{ flex: 1, padding: 10, borderRadius: 14, backgroundColor: C.surface, gap: 2 }}>
                  <Text style={{ fontSize: fs(18), fontWeight: '800', color: C.ink }} numberOfLines={1} adjustsFontSizeToFit>{x.v.toLocaleString(lang)}{x.unit ? ` ${x.unit}` : ''}</Text>
                  <Text style={T.small} numberOfLines={1}>{pick(x.k, lg)}</Text>
                </View>
              ))}
            </View>
            <View onLayout={(e) => setChartW(Math.round(e.nativeEvent.layout.width))}>
              <BarChart width={chartW} data={stats.week.map((d) => ({ label: d.date.toLocaleDateString(lang === 'ar' ? 'ar' : lang, { weekday: lang === 'ar' ? 'narrow' : 'short' }), value: d.value }))} />
            </View>
            {stats.top.map((t) => (
              <View key={t.name} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={[T.body, { flex: 1 }]} numberOfLines={1}>{t.name}</Text>
                <View style={{ width: `${Math.max(4, (t.count / stats.top[0].count) * 40)}%`, height: 8, borderRadius: 4, backgroundColor: C.accent, opacity: 0.7 }} />
                <Text style={{ fontSize: fs(13), fontWeight: '700', color: C.ink, minWidth: 56, textAlign: 'right' }}>{t.count.toLocaleString(lang)}</Text>
              </View>
            ))}
            <Text style={T.small}>{pick(L.allTime, lg)}: {stats.all.toLocaleString(lang)}</Text>
          </>
        )}

        <SectionTitle>{pick(L.log, lg)}</SectionTitle>
        {log.items.length === 0 ? <Text style={T.small}>{pick(L.empty, lg)}</Text> : log.items.slice(0, 100).map((i) => (
          <View key={i.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: C.border }}>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={{ fontSize: fs(15), fontWeight: '600', color: C.ink }}>{i.name} · {i.count.toLocaleString(lang)}</Text>
              <Text style={T.small}>{new Intl.DateTimeFormat(lang, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(i.at)}{i.note ? ` · ${i.note}` : ''}</Text>
            </View>
            <Pressable hitSlop={8} accessibilityLabel="Sil" onPress={() => Alert.alert(i.name, pick(L.del, lg), [{ text: '✕' }, { text: 'OK', onPress: () => setLog({ items: log.items.filter((x) => x.id !== i.id) }) }])}>
              <Icon name="trash" size={18} color={C.muted} />
            </Pressable>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
