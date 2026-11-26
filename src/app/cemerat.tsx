// Şeytan taşlama (cemerat) sayacı: bayram günü seçimi, Hanefî atış vakti (Mina için hesaplanan imsak, öğle,
// akşam), cemre cemre 7 taş sayacı, sıra uyarısı, küçük ve orta cemreden sonra dua hatırlatması, vekâlet için
// ayrı kişi sayaçları. Sayaçlar cihazda saklanır.
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DuaBlock } from '@/components/DuaBlock';
import { Icon } from '@/components/Icon';
import { Btn, Card, Chip, IconBtn, SectionTitle, Segmented, T, Toggle } from '@/components/ui';
import { C, fs } from '@/constants/theme';
import { CEMRE_TEKBIR, TESRIK_TEKBIR } from '@/data/hac';
import type { T3 } from '@/data/umre';
import { pick, useI18n } from '@/i18n';
import {
  cemrelerFor, dayDone, dayThrown, eidDayAt, emptyCount, hajjCalendar, pebblesTotal, throwPebble, throwWindow, undoPebble, windowState,
  type CemreCount, type CemreId, type EidDay,
} from '@/services/hac';
import { fmtTime, times } from '@/services/prayer';
import { useTheme } from '@/services/ThemeContext';
import { usePersisted } from '@/services/usePersisted';

type Lang = 'tr' | 'en' | 'ar';
const nowDate = () => new Date();
const MINA = { lat: 21.4133, lng: 39.8933 };
const TZ = 'Asia/Riyadh';

const L = {
  title: { tr: 'Şeytan taşlama', en: 'Stoning the Jamarat', ar: 'رمي الجمرات' },
  sub: { tr: 'Cemerat sayacı · Hanefî vakitleri', en: 'Jamarat counter · Hanafi times', ar: 'عداد الجمرات' },
  day: { tr: 'Bayram {n}', en: 'Eid {n}', ar: 'العيد {n}' },
  self: { tr: 'Kendim', en: 'Myself', ar: 'نفسي' },
  addPerson: { tr: '+ Vekâlet', en: '+ Proxy', ar: '+ نيابة' },
  personName: { tr: 'Vekili olduğunuz kişinin adı', en: 'Name of the person you throw for', ar: 'اسم من تنوب عنه' },
  add: { tr: 'Ekle', en: 'Add', ar: 'إضافة' },
  proxyNote: { tr: 'Vekil önce kendi taşlarını atar, sonra vekili olduğu kişinin taşlarını.', en: 'A proxy first throws his own pebbles, then the other person’s.', ar: 'يرمي النائب عن نفسه أولًا ثم عن غيره.' },
  remove: { tr: '{p} silinsin mi?', en: 'Remove {p}?', ar: 'حذف {p}؟' },
  throw: { tr: 'Taş attım', en: 'Pebble thrown', ar: 'رميت حصاة' },
  done: { tr: 'Tamam', en: 'Done', ar: 'تم' },
  afterSmall: { tr: 'Kenara çekilip kıbleye dönün, ellerinizi kaldırarak dua edin.', en: 'Step aside, face the qibla and make du‘a with raised hands.', ar: 'تنحَّ واستقبل القبلة وادعُ رافعًا يديك.' },
  afterAkabe: { tr: 'Akabe’de durulmaz; dua etmeden ayrılın.', en: 'Do not stop at al-Aqabah; leave without standing for du‘a.', ar: 'لا تقف عند العقبة.' },
  orderWarn: { tr: 'Sıra küçük → orta → büyük. Hanefîlere göre sünnettir; diğer mezheplere göre vaciptir.', en: 'Order: small → middle → big. Sunnah for Hanafis, wajib for the other schools.', ar: 'الترتيب: الصغرى ثم الوسطى ثم العقبة.' },
  today: { tr: 'Bu gün: {d}/{n} taş', en: 'This day: {d}/{n} pebbles', ar: 'هذا اليوم: {d}/{n}' },
  total: { tr: 'Toplam: {d}/{n} taş', en: 'Total: {d}/{n} pebbles', ar: 'المجموع: {d}/{n}' },
  stay13: { tr: 'Bayramın 4. günü Mina’da kalacağım (70 taş)', en: 'I will stay at Mina on Eid day 4 (70 pebbles)', ar: 'سأبقى في منى رابع أيام العيد' },
  dayDone: { tr: 'Bu günün taşları tamam. Allah kabul etsin!', en: 'This day’s pebbles are complete. May Allah accept!', ar: 'اكتمل رمي هذا اليوم.' },
  winBefore: { tr: 'Vakit henüz girmedi · başlangıç {from}', en: 'Not yet time · starts {from}', ar: 'لم يدخل الوقت · يبدأ {from}' },
  winEarly: { tr: 'Öğleden önce: Ebû Hanîfe’ye göre bu gün caiz; diğer imamlara göre öğle ({from}) beklenir.', en: 'Before Dhuhr: allowed this day for Abu Hanifa; others wait for Dhuhr ({from}).', ar: 'قبل الزوال: يجوز عند أبي حنيفة في هذا اليوم.' },
  winOpen: { tr: 'Vakit girdi · {to}’a kadar', en: 'Time has started · until {to}', ar: 'دخل الوقت · حتى {to}' },
  winAfter: { tr: 'Bu günün vakti geçti. Atılmayan taşlar bayramın 4. günü güneş batana kadar kaza edilir (Ebû Hanîfe’ye göre gecikme için dem gerekir).', en: 'This day’s time has passed. Make up missed pebbles by sunset of Eid day 4 (Abu Hanifa: a dam for the delay).', ar: 'فات وقت هذا اليوم؛ يُقضى حتى غروب رابع أيام العيد.' },
  winText1: { tr: 'Vakit: imsaktan ({from}) ertesi gün imsaka ({to}) kadar. İmsaktan önce atılan geçerli olmaz.', en: 'Time: from dawn ({from}) to the next dawn ({to}). Pebbles before dawn do not count.', ar: 'الوقت: من الفجر إلى فجر اليوم التالي.' },
  winText2: { tr: 'Vakit: öğleden (zeval, {from}) ertesi gün imsaka ({to}) kadar. Öğleden önce atılan geçerli olmaz; yeniden atılır.', en: 'Time: from Dhuhr ({from}) to the next dawn ({to}). Pebbles before Dhuhr do not count; throw again.', ar: 'الوقت: من الزوال إلى فجر اليوم التالي.' },
  winText4: { tr: 'Vakit: öğleden ({from}) güneş batana ({to}) kadar. Bu günü yalnız Mina’da kalanlar atar.', en: 'Time: from Dhuhr ({from}) to sunset ({to}). Only those who stay at Mina throw this day.', ar: 'الوقت: من الزوال إلى الغروب، لمن بقي في منى.' },
  minaTimes: { tr: 'Saatler Mina için hesaplandı (Mekke saati).', en: 'Times computed for Mina (Makkah time).', ar: 'الأوقات محسوبة لمنى.' },
  info: { tr: 'Bilmeniz gerekenler', en: 'Good to know', ar: 'معلومات' },
  map: { tr: 'Cemerat’ı haritada gör', en: 'See the Jamarat on the map', ar: 'الجمرات على الخريطة' },
  guide: { tr: 'Hac rehberi', en: 'Hajj guide', ar: 'دليل الحج' },
} satisfies Record<string, T3>;

const NAMES: Record<CemreId, T3> = {
  kucuk: { tr: 'Küçük cemre (Cemre-i Ûlâ)', en: 'Small Jamrah (al-Ula)', ar: 'الجمرة الصغرى' },
  orta: { tr: 'Orta cemre (Cemre-i Vüstâ)', en: 'Middle Jamrah (al-Wusta)', ar: 'الجمرة الوسطى' },
  akabe: { tr: 'Büyük cemre (Cemre-i Akabe)', en: 'Big Jamrah (al-Aqabah)', ar: 'جمرة العقبة' },
};

const INFO: T3[] = [
  { tr: 'Taşlar nohut büyüklüğünde ve temiz olmalı; büyük taş kırılarak atılmaz.', en: 'Pebbles should be chickpea-sized and clean; do not break big stones.' },
  { tr: 'Taşı sağ elin baş ve işaret parmağıyla tutup atın, her taşta tekbir getirin. Taşın havuza düşmesi gerekir; düşmezse yeniden atın.', en: 'Hold the pebble between the right thumb and index finger and say takbir with each. It must fall into the basin; if not, throw again.' },
  { tr: 'Bayramın 1. günü yalnız Akabe’ye 7 taş atılır; ilk taşla telbiye biter.', en: 'On Eid day 1 only al-Aqabah gets 7 pebbles; the talbiyah ends with the first.' },
  { tr: 'Hasta ve özürlüler vekille attırabilir. Kalabalıkta itişmeyin; kafile görevlinizin bildirdiği saate uyun.', en: 'The sick and unable may use a proxy. Do not push in the crowd; follow the time your group gives you.' },
];

type Store = { persons: string[]; counts: Record<string, CemreCount>; stay13: boolean };
const keyOf = (day: EidDay, person: string) => `${day}|${person}`;

export default function CemeratScreen() {
  const { lang } = useI18n();
  const lg = lang as Lang;
  const insets = useSafeAreaInsets();
  const { prefs } = useTheme();
  const [now] = useState(nowDate);
  const [st, setSt] = usePersisted<Store>('cemerat:v1', { persons: [], counts: {}, stay13: false });

  const cal = useMemo(() => hajjCalendar(now), [now]);
  const todayFajr = useMemo(() => times(MINA.lat, MINA.lng, 'UmmAlQura', now).fajr, [now]);
  const [day, setDay] = useState<EidDay>(() => (cal ? eidDayAt(now, cal, todayFajr) : null) ?? 1);
  const [person, setPerson] = useState('');
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');
  const [warn, setWarn] = useState(false);

  const counts = st.counts[keyOf(day, person)] ?? emptyCount();
  const list = cemrelerFor(day);
  const dayDate = cal?.days.find((d) => d.dh === day + 9)?.date ?? now;
  const win = useMemo(() => {
    const t0 = times(MINA.lat, MINA.lng, 'UmmAlQura', dayDate);
    const t1 = times(MINA.lat, MINA.lng, 'UmmAlQura', new Date(dayDate.getTime() + 864e5));
    return throwWindow(day, t0, t1);
  }, [day, dayDate]);
  const state = windowState(now, win);
  const hm = (d: Date) => fmtTime(d, TZ);
  const fill = (s: string) => s.replace('{from}', hm(win.from)).replace('{to}', hm(win.to));
  const winText = day === 1 ? L.winText1 : day === 4 ? L.winText4 : L.winText2;
  const stateText = state === 'before' ? L.winBefore : state === 'early' ? L.winEarly : state === 'open' ? L.winOpen : L.winAfter;
  const stateColor = state === 'open' ? C.open : state === 'after' ? C.closed : C.limited;

  const totalThrown = ([1, 2, 3, 4] as EidDay[]).reduce((s, d) => s + dayThrown(st.counts[keyOf(d, person)] ?? emptyCount(), d), 0);
  const total = pebblesTotal(st.stay13);

  const buzz = (strong: boolean) => {
    if (!prefs.haptics) return;
    (strong ? Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success) : Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)).catch(() => undefined);
  };
  const doThrow = (id: CemreId) => {
    const r = throwPebble(counts, day, id);
    if (r.event === 'full' || r.event === 'not-today') return;
    setWarn(r.orderWarn);
    setSt({ ...st, counts: { ...st.counts, [keyOf(day, person)]: r.counts } });
    buzz(r.event !== 'ok');
  };
  const doUndo = (id: CemreId) => setSt({ ...st, counts: { ...st.counts, [keyOf(day, person)]: undoPebble(counts, id) } });
  const addPerson = () => {
    const n = name.trim();
    if (n && !st.persons.includes(n)) { setSt({ ...st, persons: [...st.persons, n] }); setPerson(n); }
    setName('');
    setAdding(false);
  };
  const removePerson = (p: string) => Alert.alert(pick(L.remove, lg).replace('{p}', p), undefined, [
    { text: 'İptal', style: 'cancel' },
    { text: 'Sil', style: 'destructive', onPress: () => { setSt({ ...st, persons: st.persons.filter((x) => x !== p) }); setPerson(''); } },
  ]);

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <View style={{ paddingTop: insets.top + 6, paddingHorizontal: 12, paddingBottom: 8, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <IconBtn name="back" label="Geri" onPress={() => router.back()} />
        <View style={{ flex: 1 }}>
          <Text style={T.h2} numberOfLines={1}>{pick(L.title, lg)}</Text>
          <Text style={T.small} numberOfLines={1}>{pick(L.sub, lg)}</Text>
        </View>
      </View>
      <ScrollView contentContainerStyle={{ padding: 16, paddingTop: 4, gap: 12, paddingBottom: insets.bottom + 28 }} keyboardShouldPersistTaps="handled">
        <Segmented<string>
          value={String(day)}
          options={[1, 2, 3, 4].map((n) => ({ value: String(n), label: pick(L.day, lg).replace('{n}', String(n)) }))}
          onChange={(v) => { setDay(Number(v) as EidDay); setWarn(false); }}
        />

        <Card style={{ gap: 6 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: stateColor }} />
            <Text style={{ flex: 1, fontSize: fs(14.5), fontWeight: '700', color: C.ink }}>{fill(pick(stateText, lg))}</Text>
          </View>
          <Text style={T.small}>{dayDate.toLocaleDateString(lg, { day: 'numeric', month: 'long', weekday: 'long' })} · {fill(pick(winText, lg))}</Text>
          <Text style={[T.small, { color: C.muted }]}>{pick(L.minaTimes, lg)}</Text>
        </Card>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          <Chip label={pick(L.self, lg)} active={person === ''} onPress={() => setPerson('')} />
          {st.persons.map((p) => (
            <Pressable key={p} onLongPress={() => removePerson(p)}>
              <Chip label={p} active={person === p} onPress={() => setPerson(p)} />
            </Pressable>
          ))}
          {!adding && <Chip label={pick(L.addPerson, lg)} onPress={() => setAdding(true)} />}
        </View>
        {adding && (
          <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
            <TextInput value={name} onChangeText={setName} placeholder={pick(L.personName, lg)} placeholderTextColor={C.muted} autoFocus onSubmitEditing={addPerson}
              style={{ flex: 1, height: 44, borderRadius: 12, borderWidth: 1, borderColor: C.borderStrong, paddingHorizontal: 12, color: C.ink, fontSize: fs(15) }} />
            <Btn title={pick(L.add, lg)} onPress={addPerson} />
          </View>
        )}
        {(person !== '' || adding) && <Text style={T.small}>{pick(L.proxyNote, lg)}</Text>}

        {warn && (
          <Card tint={C.limitedTint} style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-start' }}>
            <Icon name="alert" size={16} color={C.limited} />
            <Text style={[T.small, { flex: 1, color: C.ink }]}>{pick(L.orderWarn, lg)}</Text>
          </Card>
        )}

        {list.map((id) => {
          const n = counts[id];
          const full = n >= 7;
          return (
            <Card key={id} tint={full ? C.openTint : undefined} style={{ gap: 10 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={{ flex: 1, fontSize: fs(16), fontWeight: '700', color: C.ink }}>{pick(NAMES[id], lg)}</Text>
                <Text style={{ fontSize: fs(16), fontWeight: '800', color: full ? C.open : C.accent }}>{n}/7</Text>
              </View>
              <View style={{ flexDirection: 'row', gap: 8, justifyContent: 'center' }}>
                {Array.from({ length: 7 }, (_, i) => (
                  <View key={i} style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: i < n ? (full ? C.open : C.accent) : C.surface, borderWidth: 1, borderColor: i < n ? 'transparent' : C.borderStrong }} />
                ))}
              </View>
              {full ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Icon name="check" size={18} color={C.open} width={3} />
                  <Text style={[T.body, { flex: 1, color: C.ink }]}>{pick(id === 'akabe' ? L.afterAkabe : L.afterSmall, lg)}</Text>
                </View>
              ) : (
                <Pressable onPress={() => doThrow(id)} accessibilityRole="button" accessibilityLabel={`${pick(NAMES[id], lg)} ${pick(L.throw, lg)}`}
                  style={({ pressed }) => ({ height: 64, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: pressed ? C.ink : C.accent })}>
                  <Text style={{ fontSize: fs(18), fontWeight: '800', color: C.onAccent }}>{pick(L.throw, lg)} · {n + 1}</Text>
                </Pressable>
              )}
              {n > 0 && (
                <Pressable onPress={() => doUndo(id)} accessibilityRole="button" hitSlop={8} style={{ alignSelf: 'center' }}>
                  <Text style={{ fontSize: fs(13), fontWeight: '700', color: C.muted }}>−1</Text>
                </Pressable>
              )}
            </Card>
          );
        })}

        <Card tint={dayDone(counts, day) ? C.openTint : C.surface} style={{ gap: 6 }}>
          <Text style={{ fontSize: fs(15), fontWeight: '700', color: C.ink }}>
            {pick(L.today, lg).replace('{d}', String(dayThrown(counts, day))).replace('{n}', String(list.length * 7))}
            {'   '}
            {pick(L.total, lg).replace('{d}', String(totalThrown)).replace('{n}', String(total))}
          </Text>
          {dayDone(counts, day) && <Text style={[T.body, { color: C.open, fontWeight: '700' }]}>{pick(L.dayDone, lg)}</Text>}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Text style={[T.small, { flex: 1 }]}>{pick(L.stay13, lg)}</Text>
            <Toggle value={st.stay13} onChange={(v) => setSt({ ...st, stay13: v })} label={pick(L.stay13, lg)} />
          </View>
        </Card>

        <DuaBlock d={CEMRE_TEKBIR} compact />
        <DuaBlock d={TESRIK_TEKBIR} compact />

        <SectionTitle>{pick(L.info, lg)}</SectionTitle>
        {INFO.map((x) => (
          <View key={x.tr} style={{ flexDirection: 'row', gap: 10 }}>
            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: C.accent, marginTop: 8 }} />
            <Text style={[T.body, { flex: 1 }]}>{pick(x, lg)}</Text>
          </View>
        ))}
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <View style={{ flex: 1 }}><Btn title={pick(L.map, lg)} kind="secondary" icon="map" onPress={() => router.push('/hac-harita?yer=cemerat' as never)} /></View>
          <View style={{ flex: 1 }}><Btn title={pick(L.guide, lg)} kind="secondary" icon="list" onPress={() => router.push('/hac' as never)} /></View>
        </View>
      </ScrollView>
    </View>
  );
}
