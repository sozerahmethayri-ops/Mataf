// Uygulama içi navigasyon (0.25.0, proje sahibinin isteği: Google Haritalar'a/Yandex'e yönlendirme yok).
// Yürüme ve araç: OSRM rotası adımlarıyla; üstte sıradaki manevra ("120 m · Sağa dönün"), haritada rota ve canlı konum,
// altta kalan yol ve varış saati; rotadan çıkınca yeniden hesaplanır; sesli yönlendirme açılıp kapanır.
// Toplu taşıma: Ulaşım'da seçilen tarifin bacakları (hangi hatta binilir, kaç durak, nerede ve saat kaçta inilir);
// konuma göre şu anki bacak öne çıkar. Parametreler: to=enlem,boylam · name · mode=walk|car|transit.
import * as Location from 'expo-location';
import { useKeepAwake } from 'expo-keep-awake';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Icon, type IconName } from '@/components/Icon';
import { OnlineMap } from '@/components/OnlineMap';
import { Btn, IconBtn, T } from '@/components/ui';
import { C, fs, shadow } from '@/constants/theme';
import type { ML } from '@/data/sites';
import { pick, useI18n } from '@/i18n';
import { getJson } from '@/services/cache';
import { cumulative, currentLeg, distText, legText, offRoute, progress, spokenText, stepText } from '@/services/navigation';
import { getNavItinerary } from '@/services/navStore';
import { fmtMinutes, osrmUrl, parseOsrm, roughRoute, type LatLng, type NavStep, type StreetRoute } from '@/services/transport';
import { playSequence, stopVoice } from '@/services/voice';

type Mode = 'walk' | 'car' | 'transit';
const L = {
  title: { tr: 'Yol tarifi', en: 'Directions', ar: 'الاتجاهات' },
  locating: { tr: 'Konumunuz alınıyor…', en: 'Getting your location…', ar: 'جارٍ تحديد موقعك…' },
  denied: { tr: 'Konum izni yok. Ayarlardan MATAF\'a konum izni verin.', en: 'No location permission. Allow location for MATAF in settings.', ar: 'لا إذن للموقع. اسمح لـ MATAF بالموقع من الإعدادات.' },
  routing: { tr: 'Rota hesaplanıyor…', en: 'Finding the route…', ar: 'جارٍ حساب المسار…' },
  rerouting: { tr: 'Rotadan çıktınız, yeniden hesaplanıyor…', en: 'Off route, recalculating…', ar: 'خرجت عن المسار، جارٍ إعادة الحساب…' },
  approx: { tr: 'Rota sunucusuna ulaşılamadı: kuş uçuşu yön gösteriliyor.', en: 'Route server unreachable: showing straight-line direction.', ar: 'تعذّر الوصول إلى خادم المسارات: يُعرض الاتجاه المباشر.' },
  left: { tr: 'Kalan', en: 'Remaining', ar: 'المتبقي' },
  eta: { tr: 'Varış', en: 'Arrival', ar: 'الوصول' },
  end: { tr: 'Bitir', en: 'End', ar: 'إنهاء' },
  voiceOn: { tr: 'Sesli yönlendirme açık', en: 'Voice guidance on', ar: 'التوجيه الصوتي مفعّل' },
  voiceOff: { tr: 'Sesli yönlendirme kapalı', en: 'Voice guidance off', ar: 'التوجيه الصوتي متوقف' },
  steps: { tr: 'Adımlar', en: 'Steps', ar: 'الخطوات' },
  noTransit: { tr: 'Toplu taşıma tarifi bulunamadı; Ulaşım ekranından bir tarif seçin.', en: 'No transit plan; choose one on the Transport screen.', ar: 'لا توجد خطة نقل؛ اختر واحدة من شاشة التنقل.' },
  approxTimes: { tr: 'Saatler yaklaşık (sefer saati yok).', en: 'Times are approximate (no timetable).', ar: 'الأوقات تقريبية.' },
  arrived: { tr: 'Hedefe vardınız', en: 'You have arrived', ar: 'وصلت إلى وجهتك' },
} satisfies Record<string, ML>;

/** Manevranın simgesi */
const turnIcon = (s: NavStep | null): IconName => {
  if (!s) return 'up';
  if (s.type === 'arrive') return 'flag';
  if (s.type.includes('roundabout') || s.type.includes('rotary')) return 'refresh';
  if (s.modifier === 'uturn') return 'back';
  if (s.modifier?.includes('left')) return 'left';
  if (s.modifier?.includes('right')) return 'right';
  return 'up';
};

export default function RouteNav() {
  useKeepAwake();
  const params = useLocalSearchParams<{ to?: string; name?: string; mode?: Mode }>();
  const { lang } = useI18n();
  const lg = lang as 'tr' | 'en' | 'ar';
  const mode: Mode = params.mode === 'car' || params.mode === 'transit' ? params.mode : 'walk';
  const [la, ln] = (params.to ?? '').split(',').map(Number);
  const dest: LatLng | null = Number.isFinite(la) && Number.isFinite(ln) ? { lat: la, lng: ln } : null;
  const destName = typeof params.name === 'string' && params.name ? params.name : pick(L.title, lg);
  const clock = (iso: string) => new Date(iso).toLocaleTimeString(lg === 'ar' ? 'ar-SA' : lg, { hour: '2-digit', minute: '2-digit' });

  // ── Canlı konum ──
  const [fix, setFix] = useState<(LatLng & { acc?: number | null; at: number }) | null>(null);
  const [denied, setDenied] = useState(false);
  useEffect(() => {
    let alive = true;
    let sub: Location.LocationSubscription | undefined;
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (!alive) return;
      if (status !== 'granted') { setDenied(true); return; }
      const on = (l: Location.LocationObject) => { if (alive) setFix({ lat: l.coords.latitude, lng: l.coords.longitude, acc: l.coords.accuracy, at: l.timestamp }); };
      const last = await Location.getLastKnownPositionAsync({ maxAge: 2 * 60e3 }).catch(() => null);
      if (last) on(last);
      sub = await Location.watchPositionAsync({ accuracy: Location.Accuracy.BestForNavigation, distanceInterval: mode === 'car' ? 8 : 3, timeInterval: 2000 }, on);
    })().catch(() => undefined);
    return () => { alive = false; sub?.remove(); };
  }, [mode]);

  // ── Yürüme / araç rotası (OSRM, adımlarıyla); rotadan çıkınca yeniden ──
  const [route, setRoute] = useState<StreetRoute | null>(null);
  const [rerouting, setRerouting] = useState(false);
  const busy = useRef(false);
  const lastAt = useRef(0);
  const fetchRoute = (from: LatLng) => {
    if (!dest || busy.current || mode === 'transit') return;
    busy.current = true;
    lastAt.current = Date.now();
    const profile = mode === 'car' ? 'car' : 'foot';
    getJson(osrmUrl(from, dest, profile))
      .then((j) => setRoute(parseOsrm(j as Parameters<typeof parseOsrm>[0]) ?? roughRoute(from, dest, profile)))
      .catch(() => setRoute((r) => r ?? roughRoute(from, dest, profile)))
      .finally(() => { busy.current = false; setRerouting(false); });
  };
  useEffect(() => {
    if (fix && !route && !busy.current) fetchRoute(fix);
  }, [fix, route]); // eslint-disable-line react-hooks/exhaustive-deps
  const cum = useMemo(() => (route ? cumulative(route.coords) : []), [route]);
  const prog = route && fix ? progress(route, fix, cum) : null;
  useEffect(() => {
    if (!prog || !fix || mode === 'transit' || route?.approximate) return;
    if (offRoute(prog.off, mode === 'car' ? 'car' : 'walk', fix.acc) && Date.now() - lastAt.current > 20000) {
      setTimeout(() => setRerouting(true), 0);
      fetchRoute(fix);
    }
  });

  // ── Sesli yönlendirme: manevraya yaklaşınca bir kez uzakken, bir kez yanındayken ──
  const [voice, setVoice] = useState(true);
  const said = useRef('');
  useEffect(() => {
    if (!voice || !prog?.next || mode === 'transit') return;
    const far = mode === 'car' ? 300 : 60;
    const band = prog.arrived ? 'arr' : prog.toNext < (mode === 'car' ? 60 : 20) ? 'near' : prog.toNext < far ? 'far' : '';
    if (!band) return;
    const key = `${prog.next.idx}:${band}`;
    if (said.current === key) return;
    said.current = key;
    const text = prog.arrived ? pick(L.arrived, lg) : spokenText(prog.next, band === 'near' ? 0 : prog.toNext, lg);
    playSequence([{ kind: 'speak', text, lang: lg }]).catch(() => undefined);
  });
  useEffect(() => () => { stopVoice().catch(() => undefined); }, []);

  // ── Toplu taşıma ──
  const [itin] = useState(() => (mode === 'transit' ? getNavItinerary() : null));
  const legI = useMemo(() => (itin && fix ? currentLeg(itin.legs, fix) : 0), [itin, fix]);

  const user = fix ? { lat: fix.lat, lng: fix.lng } : null;
  const lines = mode === 'transit'
    ? (itin?.legs ?? []).map((g, i) => ({ coords: g.coords, color: g.kind === 'walk' ? C.muted : g.color ?? C.route, width: i === legI ? 7 : 5, dashed: g.kind === 'walk' }))
    : route ? [{ coords: route.coords, color: C.route, width: 7 }] : [];
  const [follow, setFollow] = useState(0);
  // Harita konumu izlesin: her 25 m'de bir konuma ortalanır
  const lastFollow = useRef<LatLng | null>(null);
  useEffect(() => {
    if (!user) return;
    const lf = lastFollow.current;
    if (!lf || Math.hypot(lf.lat - user.lat, lf.lng - user.lng) * 111000 > 25) {
      lastFollow.current = user;
      setTimeout(() => setFollow((n) => n + 1), 0);
    }
  });

  // Varış saati konumun alındığı andan (çizimde Date.now() yok)
  const eta = prog && fix ? new Date(fix.at + prog.leftS * 1000) : itin ? new Date(itin.end) : null;
  const next = prog?.next ?? null;
  const [showSteps, setShowSteps] = useState(false);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={['top', 'left', 'right', 'bottom']}>
      {/* Üstte sıradaki talimat */}
      <View style={[{ margin: 12, marginBottom: 8, padding: 14, borderRadius: 20, backgroundColor: C.ink, flexDirection: 'row', alignItems: 'center', gap: 14 }, shadow]}>
        <IconBtn name="back" label={pick(L.end, lg)} size={40} tint="rgba(255,255,255,0.12)" color={C.onInk} onPress={() => router.back()} />
        {mode === 'transit' ? (
          itin && itin.legs[legI] ? (() => {
            const tx = legText(itin.legs[legI], lg, clock);
            return (
              <View style={{ flex: 1 }}>
                <Text style={{ color: C.onInk, fontSize: fs(18), fontWeight: '800' }} numberOfLines={3}>{tx.head}</Text>
                <Text style={{ color: C.onInk, opacity: 0.8, fontSize: fs(14), marginTop: 2 }} numberOfLines={2}>{tx.sub}</Text>
              </View>
            );
          })() : <Text style={{ flex: 1, color: C.onInk, fontSize: fs(15) }}>{pick(L.noTransit, lg)}</Text>
        ) : !fix ? (
          <Text style={{ flex: 1, color: C.onInk, fontSize: fs(16), fontWeight: '700' }}>{pick(denied ? L.denied : L.locating, lg)}</Text>
        ) : !route ? (
          <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <ActivityIndicator color={C.onInk} />
            <Text style={{ color: C.onInk, fontSize: fs(16), fontWeight: '700' }}>{pick(L.routing, lg)}</Text>
          </View>
        ) : (
          <>
            <View style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: C.route, alignItems: 'center', justifyContent: 'center' }}>
              <Icon name={prog?.arrived ? 'flag' : turnIcon(next)} size={28} color="#FFFFFF" width={2.6} />
            </View>
            <View style={{ flex: 1 }}>
              {prog?.arrived ? (
                <Text style={{ color: C.onInk, fontSize: fs(20), fontWeight: '800' }}>{pick(L.arrived, lg)}</Text>
              ) : (
                <>
                  <Text style={{ color: C.onInk, fontSize: fs(24), fontWeight: '800' }}>{distText(prog?.toNext ?? route.meters, lg)}</Text>
                  <Text style={{ color: C.onInk, opacity: 0.9, fontSize: fs(15), fontWeight: '600' }} numberOfLines={2}>
                    {route.approximate ? pick(L.approx, lg) : next ? stepText(next, lg) : destName}
                  </Text>
                </>
              )}
            </View>
          </>
        )}
      </View>
      {rerouting && <Text style={[T.small, { textAlign: 'center', marginBottom: 4 }]}>{pick(L.rerouting, lg)}</Text>}

      <View style={{ flex: 1 }}>
        <OnlineMap
          pins={dest ? [{ id: 'dest', lat: dest.lat, lng: dest.lng, color: C.accent, label: destName, big: true }] : []}
          lines={lines}
          user={user}
          center={user ?? dest ?? undefined}
          fitTo={[...(user ? [user] : []), ...(dest ? [dest] : [])]}
          fitKey={`${route ? route.coords.length : 0}:${itin ? 1 : 0}`}
          recenterKey={follow}
          threeD={false}
          padding={{ top: 8, bottom: 8, left: 16, right: 16 }}
        />
      </View>

      {/* Altta kalan yol, varış saati, ses ve adımlar */}
      <View style={[{ backgroundColor: C.bg, borderTopLeftRadius: 22, borderTopRightRadius: 22, padding: 14, gap: 10 }, shadow]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: fs(22), fontWeight: '800', color: C.ink }}>
              {prog ? fmtMinutes(Math.max(1, Math.round(prog.leftS / 60)), lg) : itin ? `${itin.approx ? '≈ ' : ''}${fmtMinutes(itin.minutes, lg)}` : '—'}
            </Text>
            <Text style={T.small}>
              {prog ? `${pick(L.left, lg)} ${distText(prog.leftM, lg)}` : ''}{eta ? `${prog ? ' · ' : ''}${pick(L.eta, lg)} ${eta.toLocaleTimeString(lg === 'ar' ? 'ar-SA' : lg, { hour: '2-digit', minute: '2-digit' })}` : ''}
            </Text>
          </View>
          {mode !== 'transit' && (
            <IconBtn name={voice ? 'speaker' : 'mute'} label={pick(voice ? L.voiceOn : L.voiceOff, lg)} size={48} tint={voice ? C.accentTint : C.surface} color={voice ? C.accent : C.muted}
              onPress={() => { setVoice((v) => !v); if (voice) stopVoice().catch(() => undefined); }} />
          )}
          <IconBtn name="list" label={pick(L.steps, lg)} size={48} tint={showSteps ? C.ink : C.surface} color={showSteps ? C.onInk : C.ink} onPress={() => setShowSteps((v) => !v)} />
          <Btn title={pick(L.end, lg)} kind="secondary" onPress={() => router.back()} />
        </View>
        {showSteps && (
          <ScrollView style={{ maxHeight: 260 }} contentContainerStyle={{ gap: 2 }}>
            {mode === 'transit'
              ? (itin?.legs ?? []).map((g, i) => {
                const tx = legText(g, lg, clock);
                return (
                  <View key={i} style={{ flexDirection: 'row', gap: 10, paddingVertical: 8, opacity: i < legI ? 0.5 : 1 }}>
                    <Icon name={g.kind === 'walk' ? 'walk' : g.kind === 'train' || g.kind === 'metro' || g.kind === 'tram' ? 'train' : 'bus'} size={18} color={i === legI ? C.accent : C.muted} />
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: fs(14), fontWeight: i === legI ? '800' : '600', color: C.ink }}>{tx.head}</Text>
                      <Text style={T.small}>{itin?.approx ? '' : `${clock(g.from.time)} · `}{tx.sub}</Text>
                    </View>
                  </View>
                );
              })
              : (route?.steps ?? []).filter((s) => s.type !== 'depart').map((s, i) => (
                <Pressable key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, opacity: prog && i < prog.step ? 0.5 : 1 }}>
                  <Icon name={turnIcon(s)} size={18} color={C.accent} />
                  <Text style={{ flex: 1, fontSize: fs(14), color: C.ink }}>{stepText(s, lg)}</Text>
                  <Text style={T.small}>{distText(s.distance, lg)}</Text>
                </Pressable>
              ))}
            {mode === 'transit' && itin?.approx ? <Text style={T.small}>{pick(L.approxTimes, lg)}</Text> : null}
          </ScrollView>
        )}
      </View>
    </SafeAreaView>
  );
}
