// Ana sayfa (varsayılan): üstte resimli, hareketli gökyüzü sahnesi (güneş ve ay gerçek yerlerinde; Mekke'de Kâbe,
// Medine'de Yeşil Kubbe, başka yerde bir cami), üstüne binen vakit kartı (sonraki vakte geri sayım ve günün altı
// vakti), yaklaşan mübarek gün ve kısayollar. Geri sayım kendi bileşeninde saniyede bir güncellenir.
import { router, useIsFocused } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useState } from 'react';
import { Linking, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DailyDuaCard } from '@/components/DailyDuaCard';
import { FridayCard } from '@/components/FridayCard';
import { HatimCard } from '@/components/HatimCard';
import { Icon, type IconName } from '@/components/Icon';
import { PrayerLogCard } from '@/components/PrayerLogCard';
import { SkyScene } from '@/components/SkyScene';
import { TesrikNote, tesrikActive } from '@/components/TesrikNote';
import { ZikirCard } from '@/components/ZikirCard';
import { C, fs, getTextScale, isDark, shadow } from '@/constants/theme';
import { pick, useI18n } from '@/i18n';
import { hijriText, nextSpecial } from '@/services/hijri';
import { PRAYERS, fmtTime, nextPrayer, shownDay, times, type PrayerKey } from '@/services/prayer';
import { altitudeText, directionText, moonPhaseName, skyNow } from '@/services/sky';
import { hajjSoon, type HajjPhase } from '@/services/hac';
import { sceneKind } from '@/services/skyScene';
import { kmTo } from '@/services/location';
import { usePrayerPlace, type PlaceId } from '@/services/prayerPlace';
import { useUpdate } from '@/services/update';
import { useLogWidgetSync } from '@/services/useLogWidgetSync';
import { usePrayerWidgetSync } from '@/services/widgetSync';

type Lang = 'tr' | 'en' | 'ar';
const L = {
  until: { tr: '{p} vaktine kalan', en: 'Until {p}', ar: 'المتبقي حتى {p}' },
  here: { tr: 'Konumum', en: 'My location', ar: 'موقعي' },
  makkah: { tr: 'Mekke', en: 'Makkah', ar: 'مكة' },
  madinah: { tr: 'Medine', en: 'Madinah', ar: 'المدينة' },
  waiting: { tr: 'Konum alınıyor…', en: 'Getting location…', ar: 'جارٍ تحديد الموقع…' },
  noPerm: { tr: 'Konum izni yok · Mekke vakitleri', en: 'No location permission · Makkah times', ar: 'لا إذن للموقع · مواقيت مكة' },
  today: { tr: 'Bugün', en: 'Today', ar: 'اليوم' },
  tomorrowTimes: { tr: 'Yarının vakitleri', en: 'Tomorrow’s times', ar: 'مواقيت الغد' },
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
  useLogWidgetSync(lg);
  const [now, setNow] = useState(new Date());
  useEffect(() => { const id = setInterval(() => setNow(new Date()), 20000); return () => clearInterval(id); }, []);

  const tt = useMemo(() => times(loc.lat, loc.lng, method, now), [loc.lat, loc.lng, method, now]);
  const nx = nextPrayer(loc.lat, loc.lng, method, now);
  const day = useMemo(() => shownDay(loc.lat, loc.lng, method, now), [loc.lat, loc.lng, method, now]);
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
  const focused = useIsFocused();
  // Büyük yazıda altı vakit iki satıra (3 + 3) iner; tek satırda saatler kesiliyordu ("02:…")
  const twoRows = getTextScale() > 1.1;
  const skyLabel = `${pick(L.sunWord, lg)}: ${altitudeText(sky.sun.alt, lg)}, ${directionText(sky.sun.az, lg)}. ${pick(L.moonWord, lg)}: ${moonPhaseName(sky.moon.phase, lg)}, ${pct(sky.moon.fraction, lg)}${sky.moon.alt < 0 ? `, ${pick(L.moonDown, lg)}` : ''}.`;
  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.bg }} contentContainerStyle={{ paddingBottom: 28 }}>
      {focused && <StatusBar style="light" />}
      {/* Resimli gökyüzü: yer seçimi ve tarih üstünde */}
      <SkyScene now={now} lat={loc.lat} lng={loc.lng} kind={sceneKind(loc.lat, loc.lng)} height={320 + insets.top} label={skyLabel}
        style={{ borderBottomLeftRadius: 32, borderBottomRightRadius: 32 }}>
        {(sp) => (
          <View style={{ paddingTop: insets.top + 10, paddingHorizontal: 16, gap: 8 }} pointerEvents="box-none">
            {/* Yer ve tarih çipleri: sığmazsa tarih alt satıra iner (kesilmez) */}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }} pointerEvents="box-none">
              <Pressable onPress={() => setPickOpen((v) => !v)} accessibilityRole="button" accessibilityState={{ expanded: pickOpen }}
                accessibilityLabel={`${placeLabel}. ${lg === 'en' ? 'Change place' : lg === 'ar' ? 'تغيير المكان' : 'Yeri değiştir'}`}
                style={{ height: 36, maxWidth: '100%', paddingHorizontal: 12, borderRadius: 18, flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: sp.glass, borderWidth: 1, borderColor: sp.glassBorder }}>
                <Icon name={place === 'auto' ? 'locate' : 'pin'} size={14} color={sp.text} />
                <Text style={{ flexShrink: 1, fontSize: fs(13), fontWeight: '700', color: sp.text }} numberOfLines={1}>{placeLabel}</Text>
                <View style={{ transform: [{ rotate: pickOpen ? '-90deg' : '90deg' }] }}><Icon name="chevron" size={12} color={sp.text} /></View>
              </Pressable>
              <View style={{ maxWidth: '100%', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 16, backgroundColor: sp.glass, borderWidth: 1, borderColor: sp.glassBorder }}>
                <Text style={{ fontSize: fs(13.5), fontWeight: '800', color: sp.text }} numberOfLines={1}>{hijriText(now, lg)}</Text>
                <Text style={{ fontSize: fs(11.5), fontWeight: '600', color: sp.textSoft }} numberOfLines={1}>{greg}</Text>
              </View>
            </View>
            {pickOpen && (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                {(['auto', 'makkah', 'madinah'] as PlaceId[]).map((p) => {
                  const on = p === place;
                  return (
                    <Pressable key={p} onPress={() => { setPlace(p); setPickOpen(false); }} accessibilityRole="radio" accessibilityState={{ selected: on }}
                      style={{ height: 34, paddingHorizontal: 13, borderRadius: 17, flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: on ? '#FFFFFF' : sp.glass, borderWidth: 1, borderColor: on ? '#FFFFFF' : sp.glassBorder }}>
                      {p === 'auto' && <Icon name="locate" size={13} color={on ? '#1D2735' : sp.text} />}
                      <Text style={{ fontSize: fs(13), fontWeight: '700', color: on ? '#1D2735' : sp.text }} numberOfLines={1}>{pick(p === 'auto' ? L.here : L[p], lg)}</Text>
                    </Pressable>
                  );
                })}
              </View>
            )}
            {place === 'auto' && (waiting || denied) && (
              <Text style={{ alignSelf: 'flex-start', fontSize: fs(12), fontWeight: '600', color: sp.text, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, backgroundColor: sp.glass, overflow: 'hidden' }} numberOfLines={2}>{pick(denied ? L.noPerm : L.waiting, lg)}</Text>
            )}
          </View>
        )}
      </SkyScene>

      <View style={{ paddingHorizontal: 16, gap: 16 }}>
        {/* Vakit kartı: sonraki vakte geri sayım ve günün altı vakti (sahnenin üstüne biner) */}
        <Pressable onPress={() => router.push('/vakitler')} accessibilityRole="button" accessibilityHint={pick(L.all, lg)}
          style={[{ marginTop: -34, borderRadius: 24, backgroundColor: isDark() ? C.surface : C.bg, borderWidth: 1, borderColor: C.border, paddingTop: 16, paddingBottom: 12, paddingHorizontal: 14, gap: 12 }, shadow]}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 10, paddingHorizontal: 4 }}>
            <View style={{ flexShrink: 1, gap: 1 }}>
              <Text style={{ fontSize: fs(13.5), color: C.muted, fontWeight: '600' }} numberOfLines={1}>{pick(L.until, lg).replace('{p}', names[nx.key])}</Text>
              <Countdown to={nx.at} size={36} />
            </View>
            <View style={{ alignItems: 'flex-end', paddingBottom: 4 }}>
              <Text style={{ fontSize: fs(26), color: C.accent, fontWeight: '800', fontVariant: ['tabular-nums'] }}>{fmtTime(nx.at, loc.tz)}</Text>
            </View>
          </View>
          {day.tomorrow && (
            <Text style={{ fontSize: fs(12), fontWeight: '700', color: C.muted, paddingHorizontal: 4, marginBottom: -6 }} numberOfLines={1}>{pick(L.tomorrowTimes, lg)}</Text>
          )}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', rowGap: 6 }}>
            {PRAYERS.map((p) => {
              const on = nx.key === p;
              const past = !on && !day.tomorrow && day.t[p] < now;
              return (
                <View key={p} style={{ width: twoRows ? '33.333%' : '16.666%', paddingHorizontal: 2 }}>
                  <View style={{ paddingVertical: 9, borderRadius: 16, alignItems: 'center', gap: 3, backgroundColor: on ? C.accent : 'transparent' }}>
                    <Text style={{ fontSize: fs(11.5), fontWeight: '600', color: on ? C.onAccent : past ? C.muted : C.ink2 }} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75}>{names[p]}</Text>
                    <Text style={{ fontSize: fs(15), fontWeight: '700', color: on ? C.onAccent : past ? C.muted : C.ink, fontVariant: ['tabular-nums'] }} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75}>{fmtTime(day.t[p], loc.tz)}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        </Pressable>

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

      {special && special.inDays <= 60 && (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12, paddingHorizontal: 14, borderRadius: 16, backgroundColor: C.surface }}>
          <Icon name="moon" size={18} color={C.green} />
          <Text style={{ flex: 1, fontSize: fs(14), fontWeight: '700', color: C.ink }}>{pick(special.s.name, lg)}</Text>
          <Text style={{ fontSize: fs(13), color: C.green, fontWeight: '700' }}>
            {special.inDays === 0 ? pick(L.today, lg) : special.inDays === 1 && special.s.night ? pick(L.tonight, lg) : pick(L.inDays, lg).replace('{n}', String(special.inDays))}
          </Text>
        </View>
      )}

      {tesrikActive(tt, now, nx) && <TesrikNote lang={lg} />}

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

      {/* Kısayollar: iki sütun, simge ve ad yan yana (sayı hep çift: 4 ya da 8) */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
        <Shortcut icon="compass" label={pick(L.qibla, lg)} onPress={() => router.push('/kible')} />
        <Shortcut icon="beads" label={pick(L.zikr, lg)} onPress={() => router.push('/zikir')} />
        <Shortcut icon="book" label={pick(L.quran, lg)} onPress={() => router.push('/kuran')} />
        <Shortcut icon="pin" label={pick(L.mosque, lg)} onPress={() => router.push('/cami')} />
        {/* Mekke ya da Medine'deyken (ya da vakitler oraya göreyken) ziyaretçi kısayolları */}
        {pilgrim && nearMakkah && (hajj ? <Shortcut icon="sun" label={pick(L.hajj, lg)} onPress={() => router.push('/hac')} /> : <Shortcut icon="list" label={pick(L.umre, lg)} onPress={() => router.push('/umre')} />)}
        {pilgrim && nearMakkah && <Shortcut icon="kaaba" label={pick(L.tawaf, lg)} onPress={() => router.push('/tavaf')} />}
        {pilgrim && <Shortcut icon="hotel" label={pick(L.hotel, lg)} onPress={() => router.push('/otel')} />}
        {pilgrim && <Shortcut icon="sos" label={pick(L.sos, lg)} onPress={() => router.push('/acil')} tint={C.closed} />}
        {pilgrim && !nearMakkah && <Shortcut icon="star" label={pick(L.rawdah, lg)} onPress={() => router.push('/ravza')} />}
        {pilgrim && !nearMakkah && <Shortcut icon="map" label={pick(L.map, lg)} onPress={() => router.push('/harita')} />}
      </View>
      {/* Her gün dönülen yerler: cuma (yalnız cuma), bugünkü namazlar, hatim planı (varsa), zikir hedefi (zikir yapılıyorsa), günün duası */}
      <FridayCard now={now} dhuhr={tt.dhuhr} tz={loc.tz} lg={lg} />
      <PrayerLogCard times={tt} now={now} lg={lg} />
      <HatimCard now={now} lg={lg} />
      <ZikirCard lg={lg} />
      <DailyDuaCard now={now} lg={lg} />
      <Pressable onPress={() => router.push('/vakitler')} style={{ alignSelf: 'center', paddingVertical: 6 }}>
        <Text style={{ fontSize: fs(13), color: C.accent, fontWeight: '700' }}>{pick(L.all, lg)} ›</Text>
      </Pressable>
      </View>
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

/** Kısayol: simge ve ad yan yana, yarım genişlik. Renkli simge zemini yok (şablon gibi duruyordu, 0.13.5); yalnız Acil kırmızı. */
function Shortcut({ icon, label, onPress, tint }: { icon: IconName; label: string; onPress: () => void; tint?: string }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={label}
      style={({ pressed }) => ({ flexGrow: 1, flexBasis: '40%', minHeight: 52, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, borderRadius: 14, backgroundColor: C.surface, opacity: pressed ? 0.7 : 1 })}>
      <Icon name={icon} size={20} color={tint ?? C.accent} />
      <Text style={{ flexShrink: 1, fontSize: fs(15), color: tint ?? C.ink, fontWeight: '600' }} numberOfLines={1}>{label}</Text>
    </Pressable>
  );
}
