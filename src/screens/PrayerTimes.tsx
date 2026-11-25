// Namaz vakitleri (tam ekran): miladî + hicrî tarih kartı, sonraki vakit geri sayımı, günün vakitleri,
// 7 günlük çizelge, yaklaşan mübarek günler ve ilgili ayarlar.
import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Text, View } from 'react-native';

import { Icon } from '@/components/Icon';
import { WidgetPinRow } from '@/components/WidgetPinRow';
import { Header, ListRow, Screen, SectionTitle, Segmented, T } from '@/components/ui';
import { C, fs } from '@/constants/theme';
import { pick, useI18n } from '@/i18n';
import { HIJRI_MONTHS, SPECIAL_DAYS, hijriText, toHijri } from '@/services/hijri';
import { METHODS, PRAYERS, fmtTime, nextPrayer, times } from '@/services/prayer';
import { usePrayerPlace, type PlaceId } from '@/services/prayerPlace';
import { usePrayerWidgetSync } from '@/services/widgetSync';
import { Countdown } from './HomePrayer';

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
};

export default function PrayerTimes({ back = false }: { back?: boolean }) {
  const { t, lang } = useI18n();
  const lg = lang as Lang;
  const { place, setPlace, loc, method, label, waiting } = usePrayerPlace(lang);
  usePrayerWidgetSync({ loc, method, label, waiting });
  const [now, setNow] = useState(new Date());
  useEffect(() => { const id = setInterval(() => setNow(new Date()), 30000); return () => clearInterval(id); }, []);

  const tt = useMemo(() => times(loc.lat, loc.lng, method, now), [loc.lat, loc.lng, method, now]);
  const nx = nextPrayer(loc.lat, loc.lng, method, now);
  const prog = Math.min(1, Math.max(0, (now.getTime() - nx.prev.getTime()) / (nx.at.getTime() - nx.prev.getTime())));
  const h = toHijri(now);
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
      const hh = toHijri(d);
      const s = SPECIAL_DAYS.find((x) => x.m === hh.m && x.d === hh.d);
      if (s) out.push({ name: pick(s.name, lg), date: d, night: s.night });
    }
    return out;
  }, [dayKey, lg]);
  const placeName = label === 'makkah' ? pick(L.makkah, lg) : label === 'madinah' ? pick(L.madinah, lg) : label;
  const dayFmt = new Intl.DateTimeFormat(lang, { weekday: 'short', day: 'numeric', month: 'short' });

  return (
    <Screen>
      <Header back={back} title={t('times.title')} subtitle={placeName || (waiting ? pick(L.waiting, lg) : undefined)} />
      <Segmented<PlaceId> value={place} onChange={setPlace} options={[
        { value: 'auto', label: pick(L.here, lg) }, { value: 'makkah', label: pick(L.makkah, lg) }, { value: 'madinah', label: pick(L.madinah, lg) },
      ]} />

      {/* Tarih kartı */}
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <View style={{ flex: 1, padding: 14, borderRadius: 18, backgroundColor: C.surface, gap: 2 }}>
          <Text style={{ fontSize: fs(12), color: C.muted, fontWeight: '700' }}>{new Intl.DateTimeFormat(lang, { weekday: 'long' }).format(now)}</Text>
          <Text style={{ fontSize: fs(30), color: C.ink, fontWeight: '700' }}>{now.getDate()}</Text>
          <Text style={{ fontSize: fs(13), color: C.ink2 }}>{new Intl.DateTimeFormat(lang, { month: 'long', year: 'numeric' }).format(now)}</Text>
        </View>
        <View style={{ flex: 1, padding: 14, borderRadius: 18, backgroundColor: C.greenTint, gap: 2 }}>
          <Text style={{ fontSize: fs(12), color: C.green, fontWeight: '700' }}>{lg === 'ar' ? 'هجري' : lg === 'en' ? 'Hijri' : 'Hicrî'}</Text>
          <Text style={{ fontSize: fs(30), color: C.ink, fontWeight: '700' }}>{h.d}</Text>
          <Text style={{ fontSize: fs(13), color: C.ink2 }} numberOfLines={1}>{HIJRI_MONTHS[lg][h.m - 1]} {h.y}</Text>
        </View>
      </View>

      {/* Sonraki vakit */}
      <View style={{ padding: 18, borderRadius: 20, backgroundColor: C.accentSoft, borderWidth: 1, borderColor: C.accentTint, gap: 8 }}>
        <Text style={{ fontSize: fs(12), fontWeight: '700', color: C.accent, textTransform: 'uppercase', letterSpacing: 0.7 }}>{t('times.next')}</Text>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <Text style={{ fontSize: fs(28), fontWeight: '700', color: C.ink }}>{t(`pray.${nx.key}` as const).split(' · ')[0]}</Text>
          <Text style={{ fontSize: fs(28), fontWeight: '700', color: C.accent }}>{fmtTime(nx.at, loc.tz)}</Text>
        </View>
        <View style={{ height: 6, borderRadius: 3, backgroundColor: C.accentTint, overflow: 'hidden' }}>
          <View style={{ width: `${prog * 100}%`, height: 6, backgroundColor: C.route }} />
        </View>
        <View style={{ alignItems: 'flex-end' }}><Countdown to={nx.at} size={20} /></View>
      </View>

      {/* Günün vakitleri */}
      <View style={{ borderWidth: 1, borderColor: C.border, borderRadius: 20, paddingHorizontal: 16 }}>
        {PRAYERS.map((p, i) => {
          const on = nx.key === p;
          return (
            <View key={p} style={{ height: 52, flexDirection: 'row', alignItems: 'center', borderBottomWidth: i < 5 ? 1 : 0, borderBottomColor: C.border }}>
              <View style={{ width: 8, height: 8, borderRadius: 4, marginRight: 10, backgroundColor: on ? C.route : 'transparent' }} />
              <Text style={{ flex: 1, fontSize: fs(15), fontWeight: on ? '700' : '500', color: on ? C.accent : p === 'sunrise' ? C.muted : C.ink }}>{t(`pray.${p}` as const)}</Text>
              <Text style={{ fontSize: fs(16), fontWeight: on ? '700' : '600', color: on ? C.accent : C.ink, fontVariant: ['tabular-nums'] }}>{fmtTime(tt[p], loc.tz)}</Text>
            </View>
          );
        })}
      </View>
      <Text style={T.small}>{hijriText(now, lg)} · {t('times.method', { m: METHODS.find((x) => x.id === method)?.label ?? method })}</Text>

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
