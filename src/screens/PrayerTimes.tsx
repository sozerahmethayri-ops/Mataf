// Namaz vakitleri (tam ekran): resimli gökyüzü (güneş ve ayın yeri), sonraki vakit, günün vakitleri, güneş/ay/konum
// ayrıntısı, 7 günlük çizelge, yaklaşan mübarek günler ve ilgili ayarlar.
import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import { getTimes } from 'suncalc';

import { Icon, type IconName } from '@/components/Icon';
import { SkyScene } from '@/components/SkyScene';
import { TesrikNote, tesrikActive } from '@/components/TesrikNote';
import { WidgetPinRow } from '@/components/WidgetPinRow';
import { Header, ListRow, Screen, SectionTitle, Segmented, T } from '@/components/ui';
import { C, fs } from '@/constants/theme';
import { pick, useI18n } from '@/i18n';
import { HIJRI_MONTHS, hijriText, specialOn, toHijri } from '@/services/hijri';
import { METHODS, PRAYERS, fmtTime, nextPrayer, shownDay, times, type PrayerKey } from '@/services/prayer';
import { altitudeText, directionText, moonPhaseName, skyNow } from '@/services/sky';
import { usePrayerPlace, type PlaceId } from '@/services/prayerPlace';
import { sceneKind } from '@/services/skyScene';
import { usePrayerWidgetSync } from '@/services/widgetSync';
import { Countdown, pct } from './HomePrayer';

type Lang = 'tr' | 'en' | 'ar';
const L = {
  here: { tr: 'Konumum', en: 'My location', ar: 'موقعي' },
  makkah: { tr: 'Mekke', en: 'Makkah', ar: 'مكة' },
  madinah: { tr: 'Medine', en: 'Madinah', ar: 'المدينة' },
  week: { tr: '7 günlük çizelge', en: 'Next 7 days', ar: 'الأيام السبعة القادمة' },
  special: { tr: 'Mübarek gün ve geceler', en: 'Blessed days and nights', ar: 'الأيام والليالي المباركة' },
  night: { tr: 'gecesi (önceki akşam)', en: 'night (previous evening)', ar: 'ليلة (مساء اليوم السابق)' },
  waiting: { tr: 'Konum alınıyor…', en: 'Getting location…', ar: 'جارٍ تحديد الموقع…' },
  mosque: { tr: 'En yakın cami', en: 'Nearest mosque', ar: 'أقرب مسجد' },
  mosqueSub: { tr: 'Mesafe, yön ve uygulama içinde yol tarifi', en: 'Distance, direction and in-app directions', ar: 'المسافة والاتجاه والمسار' },
  notif: { tr: 'Ezan bildirimleri', en: 'Adhan notifications', ar: 'إشعارات الأذان' },
  notifSub: { tr: 'Ezandan önce hatırlatma, ses, kendi ezan kaydınız', en: 'Reminder before adhan, sound, your own adhan', ar: 'تذكير قبل الأذان، الصوت' },
  imsak: { tr: 'İmsak', en: 'Fajr', ar: 'الفجر' },
  aksam: { tr: 'Akşam', en: 'Maghrib', ar: 'المغرب' },
  skyTitle: { tr: 'Güneş, ay ve konum', en: 'Sun, moon and location', ar: 'الشمس والقمر والموقع' },
  sun: { tr: 'Güneş', en: 'Sun', ar: 'الشمس' },
  moon: { tr: 'Ay', en: 'Moon', ar: 'القمر' },
  place: { tr: 'Konum', en: 'Location', ar: 'الموقع' },
  rise: { tr: 'Doğuş', en: 'Rise', ar: 'الشروق' },
  set: { tr: 'Batış', en: 'Set', ar: 'الغروب' },
  lit: { tr: 'aydınlık', en: 'lit', ar: 'مضاء' },
  dayLen: { tr: 'gün {h} sa {m} dk', en: 'day {h} h {m} min', ar: 'النهار {h} س {m} د' },
  tomorrow: { tr: 'Yarın', en: 'Tomorrow', ar: 'غدًا' },
};

/** 21,4230° K · 39,8263° D */
function coordText(lat: number, lng: number, lg: Lang) {
  const n = (v: number) => Math.abs(v).toFixed(4).replace('.', lg === 'tr' ? ',' : '.');
  const ns = lg === 'tr' ? (lat >= 0 ? 'K' : 'G') : lg === 'ar' ? (lat >= 0 ? 'ش' : 'ج') : lat >= 0 ? 'N' : 'S';
  const ew = lg === 'tr' ? (lng >= 0 ? 'D' : 'B') : lg === 'ar' ? (lng >= 0 ? 'ق' : 'غ') : lng >= 0 ? 'E' : 'W';
  return `${n(lat)}° ${ns} · ${n(lng)}° ${ew}`;
}

export default function PrayerTimes({ back = false }: { back?: boolean }) {
  const { t, lang } = useI18n();
  const lg = lang as Lang;
  const { place, setPlace, loc, method, label, waiting } = usePrayerPlace(lang);
  usePrayerWidgetSync({ loc, method, label, waiting });
  const [now, setNow] = useState(new Date());
  useEffect(() => { const id = setInterval(() => setNow(new Date()), 30000); return () => clearInterval(id); }, []);

  const tt = useMemo(() => times(loc.lat, loc.lng, method, now), [loc.lat, loc.lng, method, now]);
  const nx = nextPrayer(loc.lat, loc.lng, method, now);
  // Yatsıdan sonra liste yarının vakitlerini gösterir (vurgulanan imsak ile üstteki saat aynı olsun)
  const day = useMemo(() => shownDay(loc.lat, loc.lng, method, now), [loc.lat, loc.lng, method, now]);
  const dayKey = now.toDateString();
  const week = useMemo(() => {
    const base = new Date(dayKey);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(base.getFullYear(), base.getMonth(), base.getDate() + i, 12);
      return { d, h: toHijri(d), t: times(loc.lat, loc.lng, method, d) };
    });
  }, [loc.lat, loc.lng, method, dayKey]);
  const specials = useMemo(() => {
    const out: { name: string; date: Date; night?: boolean }[] = [];
    const b0 = new Date(dayKey);
    const base = new Date(b0.getFullYear(), b0.getMonth(), b0.getDate(), 12);
    for (let i = 0; i < 370 && out.length < 4; i++) {
      const d = new Date(base.getTime() + i * 864e5);
      const s = specialOn(d);
      if (s) out.push({ name: pick(s.name, lg), date: d, night: s.night });
    }
    return out;
  }, [dayKey, lg]);
  const placeName = label === 'makkah' ? pick(L.makkah, lg) : label === 'madinah' ? pick(L.madinah, lg) : label;
  const names = useMemo(() => Object.fromEntries(PRAYERS.map((p) => [p, t(`pray.${p}` as const).split(' · ')[0]])) as Record<PrayerKey, string>, [t]);
  const minuteKey = Math.floor(now.getTime() / 60e3);
  const sky = useMemo(() => skyNow(new Date(minuteKey * 60e3), loc.lat, loc.lng), [minuteKey, loc.lat, loc.lng]);
  const sunT = useMemo(() => getTimes(new Date(dayKey), loc.lat, loc.lng), [dayKey, loc.lat, loc.lng]);
  const dayMin = sunT.sunrise && sunT.sunset ? Math.round((sunT.sunset.getTime() - sunT.sunrise.getTime()) / 60e3) : 0;
  const dayLen = dayMin > 0 ? pick(L.dayLen, lg).replace('{h}', String(Math.floor(dayMin / 60))).replace('{m}', String(dayMin % 60)) : '';
  const dayFmt = new Intl.DateTimeFormat(lang, { weekday: 'short', day: 'numeric', month: 'short' });

  return (
    <Screen>
      <Header back={back} title={t('times.title')} subtitle={placeName || (waiting ? pick(L.waiting, lg) : undefined)} />
      <Segmented<PlaceId> value={place} onChange={setPlace} options={[
        { value: 'auto', label: pick(L.here, lg) }, { value: 'makkah', label: pick(L.makkah, lg) }, { value: 'madinah', label: pick(L.madinah, lg) },
      ]} />

      {/* Gökyüzü ve sonraki vakit */}
      <SkyScene now={now} lat={loc.lat} lng={loc.lng} kind={sceneKind(loc.lat, loc.lng)} height={196} style={{ borderRadius: 24 }}
        label={`${altitudeText(sky.sun.alt, lg)}, ${directionText(sky.sun.az, lg)}. ${moonPhaseName(sky.moon.phase, lg)}`} />
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 16, borderRadius: 18, backgroundColor: C.surface }}>
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={{ fontSize: fs(13), fontWeight: '600', color: C.muted }}>{t('times.next')}</Text>
          <Text style={{ fontSize: fs(22), fontWeight: '700', color: C.ink }} numberOfLines={1}>{names[nx.key]} <Text style={{ color: C.accent }}>{fmtTime(nx.at, loc.tz)}</Text></Text>
        </View>
        <Countdown to={nx.at} size={20} />
      </View>

      {tesrikActive(tt, now, nx) && <TesrikNote lang={lg} />}

      {/* Günün vakitleri */}
      <View style={{ borderWidth: 1, borderColor: C.border, borderRadius: 20, paddingHorizontal: 16 }}>
        {PRAYERS.map((p, i) => {
          const on = nx.key === p;
          return (
            <View key={p} style={{ height: 52, flexDirection: 'row', alignItems: 'center', borderBottomWidth: i < 5 ? 1 : 0, borderBottomColor: C.border }}>
              <View style={{ width: 8, height: 8, borderRadius: 4, marginRight: 10, backgroundColor: on ? C.route : 'transparent' }} />
              <Text style={{ flex: 1, fontSize: fs(15), fontWeight: on ? '700' : '500', color: on ? C.accent : p === 'sunrise' ? C.muted : C.ink }}>{t(`pray.${p}` as const)}</Text>
              <Text style={{ fontSize: fs(16), fontWeight: on ? '700' : '600', color: on ? C.accent : C.ink, fontVariant: ['tabular-nums'] }}>{fmtTime(day.t[p], loc.tz)}</Text>
            </View>
          );
        })}
      </View>
      <Text style={T.small}>{day.tomorrow ? `${pick(L.tomorrow, lg)} · ` : ''}{new Intl.DateTimeFormat(lang, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(day.date)} · {hijriText(day.date, lg)} · {t('times.method', { m: METHODS.find((x) => x.id === method)?.label ?? method })}</Text>

      {/* Güneş, ay ve konum */}
      <SectionTitle>{pick(L.skyTitle, lg)}</SectionTitle>
      <View style={{ borderWidth: 1, borderColor: C.border, borderRadius: 20, paddingHorizontal: 16 }}>
        <SkyRow icon="sun" title={`${pick(L.sun, lg)} · ${altitudeText(sky.sun.alt, lg)}, ${directionText(sky.sun.az, lg)}`}
          sub={[sunT.sunrise && `${pick(L.rise, lg)} ${fmtTime(sunT.sunrise, loc.tz)}`, sunT.sunset && `${pick(L.set, lg)} ${fmtTime(sunT.sunset, loc.tz)}`, dayLen].filter(Boolean).join(' · ')} />
        <SkyRow icon="moon" title={`${pick(L.moon, lg)} · ${moonPhaseName(sky.moon.phase, lg)}, ${pct(sky.moon.fraction, lg)} ${pick(L.lit, lg)}`}
          sub={[`${altitudeText(sky.moon.alt, lg)}, ${directionText(sky.moon.az, lg)}`, sky.moonRise && `${pick(L.rise, lg)} ${fmtTime(sky.moonRise, loc.tz)}`, sky.moonSet && `${pick(L.set, lg)} ${fmtTime(sky.moonSet, loc.tz)}`].filter(Boolean).join(' · ')} />
        <SkyRow icon="pin" title={`${pick(L.place, lg)} · ${placeName || (lg === 'en' ? 'My location' : lg === 'ar' ? 'موقعي' : 'Konumum')}`} sub={coordText(loc.lat, loc.lng, lg)} last />
      </View>

      {/* 7 gün */}
      <SectionTitle>{pick(L.week, lg)}</SectionTitle>
      <View style={{ borderRadius: 16, backgroundColor: C.surface, padding: 12, gap: 2 }}>
        <View style={{ flexDirection: 'row', paddingBottom: 6 }}>
          <Text style={[T.small, { flex: 1.6 }]} />
          <Text style={[T.small, { flex: 1, textAlign: 'right', fontWeight: '700' }]}>{pick(L.imsak, lg)}</Text>
          <Text style={[T.small, { flex: 1, textAlign: 'right', fontWeight: '700' }]}>{pick(L.aksam, lg)}</Text>
        </View>
        {week.map((w, i) => (
          <View key={i} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 5 }}>
            <View style={{ flex: 1.6 }}>
              <Text style={{ fontSize: fs(13), fontWeight: i === 0 ? '700' : '500', color: C.ink }}>{dayFmt.format(w.d)}</Text>
              <Text style={{ fontSize: fs(11), color: C.muted }}>{w.h.d} {HIJRI_MONTHS[lg][w.h.m - 1]}</Text>
            </View>
            <Text style={{ flex: 1, textAlign: 'right', fontSize: fs(14), color: C.ink, fontVariant: ['tabular-nums'] }}>{fmtTime(w.t.fajr, loc.tz)}</Text>
            <Text style={{ flex: 1, textAlign: 'right', fontSize: fs(14), color: C.ink, fontVariant: ['tabular-nums'] }}>{fmtTime(w.t.maghrib, loc.tz)}</Text>
          </View>
        ))}
      </View>

      {/* Mübarek günler */}
      <SectionTitle>{pick(L.special, lg)}</SectionTitle>
      {specials.map((s) => {
        const days = Math.round((s.date.getTime() - new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12).getTime()) / 864e5);
        return (
          <View key={s.name + s.date.toDateString()} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6 }}>
            <Icon name="moon" size={18} color={C.green} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: fs(15), fontWeight: '600', color: C.ink }}>{s.name}</Text>
              <Text style={T.small}>{new Intl.DateTimeFormat(lang, { day: 'numeric', month: 'long', weekday: 'long' }).format(s.date)}{s.night ? ` · ${pick(L.night, lg)}` : ''}</Text>
            </View>
            <Text style={{ fontSize: fs(13), fontWeight: '700', color: C.green }}>{days === 0 ? (lg === 'tr' ? 'Bugün' : lg === 'ar' ? 'اليوم' : 'Today') : `${days} ${lg === 'tr' ? 'gün' : lg === 'ar' ? 'يوم' : 'd'}`}</Text>
          </View>
        );
      })}

      <ListRow title={t('times.qibla')} subtitle={t('times.qiblaSub')} onPress={() => router.push('/kible')} left={<Icon name="compass" color={C.accent} />} />
      <ListRow title={pick(L.mosque, lg)} subtitle={pick(L.mosqueSub, lg)} onPress={() => router.push('/cami')} left={<Icon name="pin" color={C.green} />} />
      <ListRow title={pick(L.notif, lg)} subtitle={pick(L.notifSub, lg)} onPress={() => router.push('/bildirimler')} left={<Icon name="bell" color={C.accent} />} />
      <WidgetPinRow />
      <ListRow title={t('settings.method')} subtitle={METHODS.find((x) => x.id === method)?.label} onPress={() => router.push('/ayarlar')} left={<Icon name="settings" color={C.muted} />} />
    </Screen>
  );
}

function SkyRow({ icon, title, sub, last }: { icon: IconName; title: string; sub: string; last?: boolean }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: last ? 0 : 1, borderBottomColor: C.border }}>
      <Icon name={icon} size={20} color={icon === 'sun' ? C.gold : icon === 'moon' ? C.user : C.accent} />
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={{ fontSize: fs(14.5), fontWeight: '600', color: C.ink }}>{title}</Text>
        {!!sub && <Text style={T.small}>{sub}</Text>}
      </View>
    </View>
  );
}
