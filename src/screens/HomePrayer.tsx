// Ana sayfa (varsayılan): sade ezan vakitleri. Tarih (miladî + hicrî), yer, sonraki vakte geri sayım halkası,
// günün vakitleri, yaklaşan mübarek gün ve dört kısayol. Geri sayım kendi bileşeninde saniyede bir güncellenir
// (ekranın geri kalanı yeniden çizilmez).
import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';

import { Icon, type IconName } from '@/components/Icon';
import { C, fs } from '@/constants/theme';
import { pick, useI18n } from '@/i18n';
import { hijriText, nextSpecial } from '@/services/hijri';
import { PRAYERS, fmtTime, nextPrayer, times } from '@/services/prayer';
import { kmTo } from '@/services/location';
import { usePrayerPlace, type PlaceId } from '@/services/prayerPlace';

type Lang = 'tr' | 'en' | 'ar';
const L = {
  until: { tr: 'vaktine kalan', en: 'until', ar: 'المتبقي حتى' },
  here: { tr: 'Konumum', en: 'My location', ar: 'موقعي' },
  makkah: { tr: 'Mekke', en: 'Makkah', ar: 'مكة' },
  madinah: { tr: 'Medine', en: 'Madinah', ar: 'المدينة' },
  waiting: { tr: 'Konum alınıyor…', en: 'Getting location…', ar: 'جارٍ تحديد الموقع…' },
  noPerm: { tr: 'Konum izni yok · Mekke vakitleri', en: 'No location permission · Makkah times', ar: 'لا إذن للموقع · مواقيت مكة' },
  today: { tr: 'Bugün', en: 'Today', ar: 'اليوم' },
  inDays: { tr: '{n} gün sonra', en: 'in {n} days', ar: 'بعد {n} يوم' },
  tonight: { tr: 'Bu gece', en: 'Tonight', ar: 'الليلة' },
  qibla: { tr: 'Kıble', en: 'Qibla', ar: 'القبلة' },
  zikr: { tr: 'Zikir', en: 'Dhikr', ar: 'الذكر' },
  quran: { tr: "Kur'an", en: 'Quran', ar: 'القرآن' },
  mosque: { tr: 'Cami', en: 'Mosque', ar: 'مسجد' },
  umre: { tr: 'Umre', en: 'Umrah', ar: 'العمرة' },
  tawaf: { tr: 'Tavaf', en: 'Tawaf', ar: 'الطواف' },
  hotel: { tr: 'Otelim', en: 'My hotel', ar: 'فندقي' },
  sos: { tr: 'Acil', en: 'SOS', ar: 'طوارئ' },
  rawdah: { tr: 'Ravza', en: 'Rawdah', ar: 'الروضة' },
  map: { tr: 'Harita', en: 'Map', ar: 'الخريطة' },
  all: { tr: 'Tüm vakitler', en: 'All times', ar: 'كل المواقيت' },
};

export default function HomePrayer() {
  const { t, lang } = useI18n();
  const lg = lang as Lang;
  const insets = useSafeAreaInsets();
  const { place, setPlace, loc, method, label, denied, waiting } = usePrayerPlace(lang);
  const [now, setNow] = useState(new Date());
  useEffect(() => { const id = setInterval(() => setNow(new Date()), 20000); return () => clearInterval(id); }, []);

  const tt = useMemo(() => times(loc.lat, loc.lng, method, now), [loc.lat, loc.lng, method, now]);
  const nx = nextPrayer(loc.lat, loc.lng, method, now);
  const nearMakkah = kmTo('makkah', loc) < 80;
  const pilgrim = nearMakkah || kmTo('madinah', loc) < 80;
  const prog = Math.min(1, Math.max(0, (now.getTime() - nx.prev.getTime()) / (nx.at.getTime() - nx.prev.getTime())));
  const dayKey = now.toDateString();
  const special = useMemo(() => nextSpecial(new Date(dayKey), 120), [dayKey]);
  const greg = new Intl.DateTimeFormat(lang, { weekday: 'long', day: 'numeric', month: 'long' }).format(now);
  const placeLabel = label === 'makkah' ? pick(L.makkah, lg) : label === 'madinah' ? pick(L.madinah, lg) : label || pick(L.here, lg);

  const R = 104;
  const circ = 2 * Math.PI * R;
  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.bg }} contentContainerStyle={{ paddingTop: insets.top + 18, paddingHorizontal: 22, paddingBottom: 28, gap: 22 }}>
      {/* Tarih ve yer */}
      <View style={{ gap: 4 }}>
        <Text style={{ fontSize: fs(15), color: C.muted, fontWeight: '600' }}>{greg}</Text>
        <Text style={{ fontSize: fs(24), color: C.ink, fontWeight: '700', letterSpacing: -0.3 }}>{hijriText(now, lg)}</Text>
        <View style={{ flexDirection: 'row', gap: 6, marginTop: 8 }}>
          {(['auto', 'makkah', 'madinah'] as PlaceId[]).map((p) => {
            const on = p === place;
            return (
              <Pressable key={p} onPress={() => setPlace(p)} accessibilityRole="radio" accessibilityState={{ selected: on }}
                style={{ height: 32, paddingHorizontal: 12, borderRadius: 16, flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: on ? C.accentTint : 'transparent', borderWidth: 1, borderColor: on ? C.accentTint : C.border }}>
                {p === 'auto' && <Icon name="locate" size={13} color={on ? C.accent : C.muted} />}
                <Text style={{ fontSize: fs(12.5), fontWeight: on ? '700' : '500', color: on ? C.accent : C.muted }} numberOfLines={1}>
                  {p === 'auto' ? (on && label && label !== 'makkah' ? placeLabel : pick(L.here, lg)) : pick(L[p], lg)}
                </Text>
              </Pressable>
            );
          })}
        </View>
        {place === 'auto' && (waiting || denied) && <Text style={{ fontSize: fs(12), color: C.muted }}>{pick(denied ? L.noPerm : L.waiting, lg)}</Text>}
      </View>

      {/* Geri sayım halkası */}
      <Pressable onPress={() => router.push('/vakitler')} accessibilityRole="button" style={{ alignItems: 'center', justifyContent: 'center' }}>
        <Svg width={2 * R + 24} height={2 * R + 24}>
          <Circle cx={R + 12} cy={R + 12} r={R} stroke={C.surface} strokeWidth={10} fill="none" />
          <Circle cx={R + 12} cy={R + 12} r={R} stroke={C.route} strokeWidth={10} fill="none" strokeLinecap="round"
            strokeDasharray={`${circ * prog} ${circ}`} rotation={-90} origin={`${R + 12}, ${R + 12}`} />
        </Svg>
        <View style={{ position: 'absolute', alignItems: 'center', gap: 2 }}>
          <Text style={{ fontSize: fs(15), color: C.muted, fontWeight: '600' }}>{t(`pray.${nx.key}` as const).split(' · ')[0]} {pick(L.until, lg)}</Text>
          <Countdown to={nx.at} />
          <Text style={{ fontSize: fs(17), color: C.accent, fontWeight: '700' }}>{fmtTime(nx.at, loc.tz)}</Text>
        </View>
      </Pressable>

      {/* Günün vakitleri */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 10 }}>
        {PRAYERS.map((p) => {
          const on = nx.key === p;
          const past = !on && tt[p] < now;
          return (
            <View key={p} style={{ width: '31.5%', paddingVertical: 12, borderRadius: 16, alignItems: 'center', gap: 4, backgroundColor: on ? C.accent : C.surface }}>
              <Text style={{ fontSize: fs(12.5), fontWeight: '600', color: on ? C.onAccent : past ? C.muted : C.ink2 }} numberOfLines={1}>{t(`pray.${p}` as const).split(' · ')[0]}</Text>
              <Text style={{ fontSize: fs(18), fontWeight: '700', color: on ? C.onAccent : past ? C.muted : C.ink, fontVariant: ['tabular-nums'] }}>{fmtTime(tt[p], loc.tz)}</Text>
            </View>
          );
        })}
      </View>

      {special && special.inDays <= 60 && (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12, paddingHorizontal: 14, borderRadius: 16, backgroundColor: C.greenTint }}>
          <Icon name="moon" size={18} color={C.green} />
          <Text style={{ flex: 1, fontSize: fs(14), fontWeight: '700', color: C.ink }}>{pick(special.s.name, lg)}</Text>
          <Text style={{ fontSize: fs(13), color: C.green, fontWeight: '700' }}>
            {special.inDays === 0 ? pick(L.today, lg) : special.inDays === 1 && special.s.night ? pick(L.tonight, lg) : pick(L.inDays, lg).replace('{n}', String(special.inDays))}
          </Text>
        </View>
      )}

      {/* Kısayollar */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Shortcut icon="compass" label={pick(L.qibla, lg)} onPress={() => router.push('/kible')} />
        <Shortcut icon="beads" label={pick(L.zikr, lg)} onPress={() => router.push('/zikir')} />
        <Shortcut icon="book" label={pick(L.quran, lg)} onPress={() => router.push('/kuran')} />
        <Shortcut icon="pin" label={pick(L.mosque, lg)} onPress={() => router.push('/cami')} />
      </View>
      {/* Mekke ya da Medine'deyken (ya da vakitler oraya göreyken) ziyaretçi kısayolları */}
      {pilgrim && (
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          {nearMakkah && <Shortcut icon="list" label={pick(L.umre, lg)} onPress={() => router.push('/umre')} />}
          {nearMakkah && <Shortcut icon="kaaba" label={pick(L.tawaf, lg)} onPress={() => router.push('/tavaf')} />}
          <Shortcut icon="hotel" label={pick(L.hotel, lg)} onPress={() => router.push('/otel')} />
          <Shortcut icon="sos" label={pick(L.sos, lg)} onPress={() => router.push('/acil')} tint={C.closed} />
          {!nearMakkah && <Shortcut icon="star" label={pick(L.rawdah, lg)} onPress={() => router.push('/ravza')} />}
          {!nearMakkah && <Shortcut icon="map" label={pick(L.map, lg)} onPress={() => router.push('/harita')} />}
        </View>
      )}
      <Pressable onPress={() => router.push('/vakitler')} style={{ alignSelf: 'center', paddingVertical: 6 }}>
        <Text style={{ fontSize: fs(13), color: C.accent, fontWeight: '700' }}>{pick(L.all, lg)} ›</Text>
      </Pressable>
    </ScrollView>
  );
}

/** Saniyede bir güncellenen geri sayım (yalnız bu yazı yeniden çizilir). */
const nowMs = () => Date.now();
export function Countdown({ to, size = 40 }: { to: Date; size?: number }) {
  const [t, setT] = useState(nowMs);
  useEffect(() => { const id = setInterval(() => setT(nowMs()), 1000); return () => clearInterval(id); }, []);
  const left = Math.max(0, to.getTime() - t);
  const h = Math.floor(left / 3600e3);
  const m = Math.floor((left % 3600e3) / 60e3);
  const s = Math.floor((left % 60e3) / 1000);
  const p = (n: number) => String(n).padStart(2, '0');
  return <Text style={{ fontSize: fs(size), fontWeight: '700', color: C.ink, fontVariant: ['tabular-nums'], letterSpacing: -0.5 }}>{p(h)}:{p(m)}:{p(s)}</Text>;
}

function Shortcut({ icon, label, onPress, tint }: { icon: IconName; label: string; onPress: () => void; tint?: string }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={label} style={({ pressed }) => ({ alignItems: 'center', gap: 6, width: 72, opacity: pressed ? 0.7 : 1 })}>
      <View style={{ width: 54, height: 54, borderRadius: 27, backgroundColor: C.surface, alignItems: 'center', justifyContent: 'center' }}>
        <Icon name={icon} size={22} color={tint ?? C.accent} />
      </View>
      <Text style={{ fontSize: fs(12), color: C.ink2, fontWeight: '600' }} numberOfLines={1}>{label}</Text>
    </Pressable>
  );
}
