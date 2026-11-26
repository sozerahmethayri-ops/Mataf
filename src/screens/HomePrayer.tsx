// Ana sayfa (varsayılan): sade ezan vakitleri. Tarih (miladî + hicrî), yer seçimi, gökyüzü yayı (güneş ve ayın
// şu anki yeri, vakitler yay üzerinde), sonraki vakte geri sayım, günün vakitleri, yaklaşan mübarek gün ve kısayollar.
// Geri sayım kendi bileşeninde saniyede bir güncellenir (ekranın geri kalanı yeniden çizilmez).
import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Linking, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon, type IconName } from '@/components/Icon';
import { SkyArc } from '@/components/SkyArc';
import { C, fs } from '@/constants/theme';
import { pick, useI18n } from '@/i18n';
import { hijriText, nextSpecial } from '@/services/hijri';
import { PRAYERS, fmtTime, nextPrayer, times, type PrayerKey } from '@/services/prayer';
import { altitudeText, directionText, moonPhaseName, skyNow } from '@/services/sky';
import { hajjSoon, type HajjPhase } from '@/services/hac';
import { kmTo } from '@/services/location';
import { usePrayerPlace, type PlaceId } from '@/services/prayerPlace';
import { useUpdate } from '@/services/update';
import { usePrayerWidgetSync } from '@/services/widgetSync';

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
  sunWord: { tr: 'Güneş', en: 'Sun', ar: 'الشمس' },
  moonWord: { tr: 'Ay', en: 'Moon', ar: 'القمر' },
  lit: { tr: 'aydınlık', en: 'lit', ar: 'مضاء' },
  moonDown: { tr: 'ufkun altında', en: 'below the horizon', ar: 'تحت الأفق' },
  update: { tr: 'Yeni sürüm hazır: {v}', en: 'New version ready: {v}', ar: 'إصدار جديد جاهز: {v}' },
  download: { tr: 'İndir', en: 'Download', ar: 'تنزيل' },
  later: { tr: 'Sonra', en: 'Later', ar: 'لاحقًا' },
  hajj: { tr: 'Hac', en: 'Hajj', ar: 'الحج' },
  hajjGuide: { tr: 'Hac rehberi', en: 'Hajj guide', ar: 'دليل الحج' },
  hajjJamarat: { tr: 'Şeytan taşlama sayacı', en: 'Jamarat counter', ar: 'عداد الجمرات' },
  hajjSoon: { tr: 'Hac günleri yaklaşıyor · Arefe’ye {n} gün', en: 'Hajj is near · {n} days to Arafah', ar: 'اقتربت أيام الحج · {n} يومًا إلى عرفة' },
  hajj8: { tr: 'Bugün Terviye: hac ihramı', en: 'Today is Tarwiyah: Hajj ihram', ar: 'اليوم يوم التروية' },
  hajj9: { tr: 'Bugün Arefe: Arafat vakfesi', en: 'Today is Arafah: standing at Arafat', ar: 'اليوم يوم عرفة' },
  hajj10: { tr: 'Bayramın 1. günü: Akabe, kurban, tıraş', en: 'Eid day 1: al-Aqabah, sacrifice, haircut', ar: 'يوم النحر: العقبة والهدي والحلق' },
  hajj11: { tr: 'Bayramın {n}. günü: üç cemreye taş', en: 'Eid day {n}: all three Jamarat', ar: 'اليوم {n} من العيد: رمي الجمرات' },
  hajj13: { tr: 'Bayramın 4. günü: Mina’da kaldıysanız üç cemre', en: 'Eid day 4: all three Jamarat if you stayed at Mina', ar: 'رابع أيام العيد' },
};

/** Yüzde yazımı: Türkçede işaret önde (%78) */
export const pct = (f: number, lg: Lang) => (lg === 'tr' ? `%${Math.round(f * 100)}` : `${Math.round(f * 100)}%`);

function hajjTitle(p: HajjPhase, lg: Lang) {
  if (p.kind === 'before') return pick(L.hajjSoon, lg).replace('{n}', String(p.days));
  if (p.kind !== 'during') return '';
  if (p.dh === 8) return pick(L.hajj8, lg);
  if (p.dh === 9) return pick(L.hajj9, lg);
  if (p.dh === 10) return pick(L.hajj10, lg);
  if (p.dh === 13) return pick(L.hajj13, lg);
  return pick(L.hajj11, lg).replace('{n}', String(p.dh - 9));
}

export default function HomePrayer() {
  const { t, lang } = useI18n();
  const lg = lang as Lang;
  const insets = useSafeAreaInsets();
  const { place, setPlace, loc, method, label, denied, waiting } = usePrayerPlace(lang);
  usePrayerWidgetSync({ loc, method, label, waiting });
  const [now, setNow] = useState(new Date());
  useEffect(() => { const id = setInterval(() => setNow(new Date()), 20000); return () => clearInterval(id); }, []);

  const tt = useMemo(() => times(loc.lat, loc.lng, method, now), [loc.lat, loc.lng, method, now]);
  const nx = nextPrayer(loc.lat, loc.lng, method, now);
  const nearMakkah = kmTo('makkah', loc) < 80;
  const pilgrim = nearMakkah || kmTo('madinah', loc) < 80;
  const dayKey = now.toDateString();
  const special = useMemo(() => nextSpecial(new Date(dayKey), 120), [dayKey]);
  const greg = new Intl.DateTimeFormat(lang, { weekday: 'long', day: 'numeric', month: 'long' }).format(now);
  const hajj = useMemo(() => (nearMakkah ? hajjSoon(new Date(dayKey)) : null), [nearMakkah, dayKey]);
  const placeLabel = label === 'makkah' ? pick(L.makkah, lg) : label === 'madinah' ? pick(L.madinah, lg) : label || pick(L.here, lg);

  const names = useMemo(() => Object.fromEntries(PRAYERS.map((p) => [p, t(`pray.${p}` as const).split(' · ')[0]])) as Record<PrayerKey, string>, [t]);
  const minuteKey = Math.floor(now.getTime() / 60e3);
  const sky = useMemo(() => skyNow(new Date(minuteKey * 60e3), loc.lat, loc.lng), [minuteKey, loc.lat, loc.lng]);
  const [pickOpen, setPickOpen] = useState(false);
  const [upd, later] = useUpdate();
  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.bg }} contentContainerStyle={{ paddingTop: insets.top + 18, paddingHorizontal: 22, paddingBottom: 28, gap: 18 }}>
      {/* Tarih ve yer */}
      <View style={{ gap: 8 }}>
        <Text style={{ fontSize: fs(14), color: C.muted, fontWeight: '600' }} numberOfLines={1}>{greg}</Text>
        <Text style={{ fontSize: fs(22), color: C.ink, fontWeight: '700', letterSpacing: -0.3, marginTop: -6 }}>{hijriText(now, lg)}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Pressable onPress={() => setPickOpen((v) => !v)} accessibilityRole="button" accessibilityState={{ expanded: pickOpen }}
            accessibilityLabel={`${placeLabel}. ${lg === 'en' ? 'Change place' : lg === 'ar' ? 'تغيير المكان' : 'Yeri değiştir'}`}
            style={{ height: 34, maxWidth: '80%', paddingHorizontal: 12, borderRadius: 17, flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: C.accentTint }}>
            <Icon name={place === 'auto' ? 'locate' : 'pin'} size={13} color={C.accent} />
            <Text style={{ flexShrink: 1, fontSize: fs(12.5), fontWeight: '700', color: C.accent }} numberOfLines={1}>{placeLabel}</Text>
            <View style={{ transform: [{ rotate: pickOpen ? '-90deg' : '90deg' }] }}><Icon name="chevron" size={12} color={C.accent} /></View>
          </Pressable>
          {place === 'auto' && (waiting || denied) && <Text style={{ flex: 1, fontSize: fs(12), color: C.muted }} numberOfLines={2}>{pick(denied ? L.noPerm : L.waiting, lg)}</Text>}
        </View>
        {pickOpen && (
          <View style={{ flexDirection: 'row', gap: 6 }}>
            {(['auto', 'makkah', 'madinah'] as PlaceId[]).map((p) => {
              const on = p === place;
              return (
                <Pressable key={p} onPress={() => { setPlace(p); setPickOpen(false); }} accessibilityRole="radio" accessibilityState={{ selected: on }}
                  style={{ height: 32, paddingHorizontal: 12, borderRadius: 16, flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: on ? C.accentTint : 'transparent', borderWidth: 1, borderColor: on ? C.accentTint : C.border }}>
                  {p === 'auto' && <Icon name="locate" size={13} color={on ? C.accent : C.muted} />}
                  <Text style={{ fontSize: fs(12.5), fontWeight: on ? '700' : '500', color: on ? C.accent : C.muted }} numberOfLines={1}>{pick(p === 'auto' ? L.here : L[p], lg)}</Text>
                </Pressable>
              );
            })}
          </View>
        )}
      </View>

      {upd && (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, paddingLeft: 14, paddingRight: 8, borderRadius: 16, backgroundColor: C.userTint }}>
          <Icon name="refresh" size={18} color={C.user} />
          <Text style={{ flex: 1, fontSize: fs(13.5), fontWeight: '600', color: C.ink }}>{pick(L.update, lg).replace('{v}', upd.version)}</Text>
          <Pressable onPress={() => Linking.openURL(upd.apk)} accessibilityRole="button" style={{ height: 34, paddingHorizontal: 14, borderRadius: 17, backgroundColor: C.user, justifyContent: 'center' }}>
            <Text style={{ fontSize: fs(13), fontWeight: '700', color: '#FFFFFF' }}>{pick(L.download, lg)}</Text>
          </Pressable>
          <Pressable onPress={later} accessibilityRole="button" accessibilityLabel={pick(L.later, lg)} hitSlop={8} style={{ padding: 6 }}>
            <Icon name="close" size={16} color={C.muted} />
          </Pressable>
        </View>
      )}

      {/* Gökyüzü: güneş ve ayın yeri; altında sonraki vakte geri sayım */}
      <Pressable onPress={() => router.push('/vakitler')} accessibilityRole="button" style={{ gap: 10 }}>
        <SkyArc now={now} lat={loc.lat} lng={loc.lng} tz={loc.tz} method={method} nextKey={nx.key} nextAt={nx.at} names={names} lang={lg} />
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}>
          <Text style={{ flex: 1, fontSize: fs(12), color: C.muted }} numberOfLines={3}>
            <Text style={{ fontWeight: '700', color: C.ink2 }}>{pick(L.sunWord, lg)} </Text>{altitudeText(sky.sun.alt, lg)}, {directionText(sky.sun.az, lg)}
          </Text>
          <Text style={{ flex: 1, fontSize: fs(12), color: C.muted, textAlign: 'right' }} numberOfLines={3}>
            <Text style={{ fontWeight: '700', color: C.ink2 }}>{pick(L.moonWord, lg)} </Text>{moonPhaseName(sky.moon.phase, lg)} · {pct(sky.moon.fraction, lg)}{sky.moon.alt < 0 ? ` · ${pick(L.moonDown, lg)}` : ''}
          </Text>
        </View>
        <View style={{ alignItems: 'center', gap: 2, paddingTop: 4 }}>
          <Text style={{ fontSize: fs(15), color: C.muted, fontWeight: '600' }}>{names[nx.key]} {pick(L.until, lg)}</Text>
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

      {hajj && (
        <Pressable onPress={() => router.push((hajj.phase.kind === 'during' && hajj.phase.dh >= 10 ? '/cemerat' : '/hac') as never)} accessibilityRole="button"
          style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 14, borderRadius: 16, backgroundColor: C.accentSoft, borderWidth: 1, borderColor: C.accent }}>
          <Icon name={hajj.phase.kind === 'during' && hajj.phase.dh >= 10 ? 'flag' : 'sun'} size={20} color={C.accent} />
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={{ fontSize: fs(14.5), fontWeight: '700', color: C.ink }}>{hajjTitle(hajj.phase, lg)}</Text>
            <Text style={{ fontSize: fs(12.5), color: C.accent, fontWeight: '700' }}>{pick(hajj.phase.kind === 'during' && hajj.phase.dh >= 10 ? L.hajjJamarat : L.hajjGuide, lg)} ›</Text>
          </View>
        </Pressable>
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
          {nearMakkah && (hajj ? <Shortcut icon="sun" label={pick(L.hajj, lg)} onPress={() => router.push('/hac')} /> : <Shortcut icon="list" label={pick(L.umre, lg)} onPress={() => router.push('/umre')} />)}
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
