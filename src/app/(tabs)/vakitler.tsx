import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';

import { Icon } from '@/components/Icon';
import { Header, ListRow, Screen, Segmented, T } from '@/components/ui';
import { C } from '@/constants/theme';
import { useI18n } from '@/i18n';
import { useApp } from '@/services/AppContext';
import { useLocation } from '@/services/location';
import { METHODS, PLACES, PRAYERS, fmtTime, getMethod, hijri, nextPrayer, times, type MethodId } from '@/services/prayer';

type Where = 'makkah' | 'madinah' | 'here';

export default function PrayerTimes() {
  const { t, lang } = useI18n();
  const { city } = useApp();
  const [where, setWhere] = useState<Where>(city);
  const [method, setMethodState] = useState<MethodId>('UmmAlQura');
  const [now, setNow] = useState(new Date());
  const { fix } = useLocation(where === 'here');

  useEffect(() => { getMethod().then(setMethodState); }, []);
  useEffect(() => { const id = setInterval(() => setNow(new Date()), 30000); return () => clearInterval(id); }, []);

  const loc = where === 'here' ? (fix ? { lat: fix.lat, lng: fix.lng, tz: undefined } : null) : PLACES[where];
  const m = where === 'here' ? method : 'UmmAlQura';
  const tt = loc ? times(loc.lat, loc.lng, m, now) : null;
  const nx = loc ? nextPrayer(loc.lat, loc.lng, m, now) : null;
  const left = nx ? Math.max(0, nx.at.getTime() - now.getTime()) : 0;
  const prog = nx ? Math.min(1, Math.max(0, (now.getTime() - nx.prev.getTime()) / (nx.at.getTime() - nx.prev.getTime()))) : 0;
  const dateStr = new Intl.DateTimeFormat(lang, { day: 'numeric', month: 'long', year: 'numeric', weekday: 'long' }).format(now);

  return (
    <Screen>
      <Header title={t('times.title')} />
      <Segmented<Where> value={where} onChange={setWhere} options={[
        { value: 'makkah', label: t('city.makkah') }, { value: 'madinah', label: t('city.madinah') }, { value: 'here', label: t('times.myLocation') },
      ]} />
      <Text style={T.muted}>{dateStr}{hijri(now, lang) ? ` · ${hijri(now, lang)}` : ''}{'\n'}{t('times.method', { m: METHODS.find((x) => x.id === m)?.label ?? m })}</Text>

      {!loc ? (
        <Text style={T.body}>Konum izni bekleniyor…</Text>
      ) : (
        <>
          <View style={{ padding: 18, borderRadius: 20, backgroundColor: C.accentSoft, borderWidth: 1, borderColor: '#FBDCC8', gap: 10 }}>
            <Text style={{ fontSize: 12, fontWeight: '700', color: C.accent, textTransform: 'uppercase', letterSpacing: 0.7 }}>{t('times.next')}</Text>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <Text style={{ fontSize: 32, fontWeight: '700', color: C.ink }}>{t(`pray.${nx!.key}` as const)}</Text>
              <Text style={{ fontSize: 32, fontWeight: '700', color: C.accent }}>{fmtTime(nx!.at, loc.tz)}</Text>
            </View>
            <View style={{ height: 6, borderRadius: 3, backgroundColor: '#FBDCC8', overflow: 'hidden' }}>
              <View style={{ width: `${prog * 100}%`, height: 6, backgroundColor: C.route }} />
            </View>
            <Text style={{ fontSize: 13, fontWeight: '700', color: C.ink, textAlign: 'right' }}>
              {t('times.left', { h: Math.floor(left / 3600000), m: Math.floor((left % 3600000) / 60000) })}
            </Text>
          </View>
          <View style={{ borderWidth: 1, borderColor: C.border, borderRadius: 20, paddingHorizontal: 16 }}>
            {PRAYERS.map((p, i) => {
              const on = nx?.key === p;
              return (
                <View key={p} style={{ height: 52, flexDirection: 'row', alignItems: 'center', borderBottomWidth: i < 5 ? 1 : 0, borderBottomColor: '#F1EFEB' }}>
                  <Text style={{ flex: 1, fontSize: 15, fontWeight: on ? '700' : '500', color: on ? C.accent : p === 'sunrise' ? C.muted : C.ink }}>{t(`pray.${p}` as const)}</Text>
                  <Text style={{ fontSize: 15, fontWeight: on ? '700' : '600', color: on ? C.accent : C.ink, fontVariant: ['tabular-nums'] }}>{fmtTime(tt![p], loc.tz)}</Text>
                </View>
              );
            })}
          </View>
        </>
      )}
      <ListRow title={t('times.qibla')} subtitle={t('times.qiblaSub')} onPress={() => router.push('/kible')} left={<Icon name="nav" color={C.accent} />} />
      <ListRow title={t('settings.method')} subtitle={METHODS.find((x) => x.id === method)?.label} onPress={() => router.push('/ayarlar')} left={<Icon name="settings" color={C.muted} />} />
    </Screen>
  );
}
