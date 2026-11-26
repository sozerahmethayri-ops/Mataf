import * as Location from 'expo-location';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Linking, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

import { Icon } from '@/components/Icon';
import { MosqueMap } from '@/components/MosqueMap';
import { Btn, Card, Header, T } from '@/components/ui';
import { C, shadow, fs } from '@/constants/theme';
import type { ML } from '@/data/sites';
import { pick, useI18n } from '@/i18n';
import { useHeading } from '@/services/location';
import { searchMosques } from '@/services/mosqueStore';
import { directionsUrl, distanceM, fmtDistance, relocate, walkMinutes, type LatLng, type Mosque, type SearchResult } from '@/services/mosques';
import { walkRoute } from '@/services/osm';
import { fmtTime, getMethod, nextPrayer, type MethodId } from '@/services/prayer';

type Lang = 'tr' | 'en' | 'ar';
const L = {
  title: { tr: 'En yakın cami', en: 'Nearest mosque', ar: 'أقرب مسجد' },
  locating: { tr: 'Konumunuz alınıyor…', en: 'Getting your location…', ar: 'جارٍ تحديد موقعك…' },
  searching: { tr: 'Çevrenizdeki camiler aranıyor…', en: 'Searching for mosques around you…', ar: 'جارٍ البحث عن المساجد القريبة…' },
  denied: { tr: 'En yakın camiyi bulmak için konum izni gerekiyor.', en: 'Location permission is needed to find the nearest mosque.', ar: 'يلزم إذن الموقع للعثور على أقرب مسجد.' },
  openSettings: { tr: 'Ayarları aç', en: 'Open settings', ar: 'افتح الإعدادات' },
  error: { tr: 'Camiler yüklenemedi. İnternet bağlantınızı kontrol edip tekrar deneyin.', en: 'Could not load mosques. Check your connection and try again.', ar: 'تعذّر تحميل المساجد. تحقق من الاتصال وحاول مرة أخرى.' },
  retry: { tr: 'Tekrar dene', en: 'Try again', ar: 'أعد المحاولة' },
  empty: { tr: '60 km içinde kayıtlı cami bulunamadı. Kıble yönüne dönerek namazınızı kılabilirsiniz.', en: 'No mosque is recorded within 60 km. You can pray facing the Qibla.', ar: 'لا يوجد مسجد مسجّل ضمن ٦٠ كم. يمكنك الصلاة باتجاه القبلة.' },
  offline: { tr: 'İnternet yok — son aramadaki camiler gösteriliyor', en: 'Offline — showing mosques from your last search', ar: 'لا يوجد اتصال — تُعرض مساجد آخر بحث' },
  directions: { tr: 'Yol tarifi', en: 'Directions', ar: 'الاتجاهات' },
  route: { tr: 'Telefonun harita uygulamasında aç', en: 'Open in your maps app', ar: 'افتح في تطبيق الخرائط' },
  walk: { tr: 'dk yürüme', en: 'min walk', ar: 'دقيقة سيرًا' },
  others: { tr: 'Diğer yakın camiler', en: 'Other mosques nearby', ar: 'مساجد قريبة أخرى' },
  unnamed: { tr: 'İsimsiz cami', en: 'Unnamed mosque', ar: 'مسجد بلا اسم' },
  mosque: { tr: 'Cami', en: 'Mosque', ar: 'مسجد' },
  musalla: { tr: 'Mescit / namazgâh', en: 'Prayer place (musalla)', ar: 'مصلى' },
  multifaith: { tr: 'İbadet odası (çok inançlı)', en: 'Multi-faith prayer room', ar: 'غرفة صلاة متعددة الأديان' },
  wheelchair: { tr: 'Tekerlekli sandalyeye uygun', en: 'Wheelchair accessible', ar: 'مهيأ للكراسي المتحركة' },
  hours: { tr: 'Açık', en: 'Open', ar: 'مفتوح' },
  missing: { tr: 'Bildiğiniz bir cami listede yok mu? Haritaya not bırakın', en: 'Know a mosque that is missing? Leave a note on the map', ar: 'هل تعرف مسجدًا غير موجود؟ اترك ملاحظة على الخريطة' },
  next: { tr: 'Sıradaki vakit', en: 'Next prayer', ar: 'الصلاة القادمة' },
  min: { tr: 'dk', en: 'min', ar: 'د' },
  hr: { tr: 'sa', en: 'h', ar: 'س' },
  qibla: { tr: 'Kıble pusulası', en: 'Qibla compass', ar: 'بوصلة القبلة' },
  noHeading: { tr: 'Ok kuzeye göre; telefonu düz tutunca yönünüze döner', en: 'Arrow relative to north; hold the phone flat to follow your heading', ar: 'السهم بالنسبة للشمال' },
  accuracy: { tr: 'Konum ±', en: 'Location ±', ar: 'الدقة ±' },
  osm: { tr: '© OpenStreetMap katkıcıları · Veriyi gönüllüler girer; bazı camiler eksik olabilir.', en: '© OpenStreetMap contributors · Volunteer data; some mosques may be missing.', ar: '© مساهمو OpenStreetMap · بيانات تطوعية وقد تنقص بعض المساجد.' },
} satisfies Record<string, ML>;
const PRAYER_NAMES: Record<string, ML> = {
  fajr: { tr: 'Sabah', en: 'Fajr', ar: 'الفجر' }, sunrise: { tr: 'Güneş', en: 'Sunrise', ar: 'الشروق' }, dhuhr: { tr: 'Öğle', en: 'Dhuhr', ar: 'الظهر' },
  asr: { tr: 'İkindi', en: 'Asr', ar: 'العصر' }, maghrib: { tr: 'Akşam', en: 'Maghrib', ar: 'المغرب' }, isha: { tr: 'Yatsı', en: 'Isha', ar: 'العشاء' },
};

type State = 'locating' | 'searching' | 'ready' | 'denied' | 'error';

export default function NearestMosque() {
  const { lang } = useI18n();
  const lg = lang as Lang;
  const insets = useSafeAreaInsets();
  const heading = useHeading(true);
  const [state, setState] = useState<State>('locating');
  const [pos, setPos] = useState<(LatLng & { acc?: number }) | null>(null);
  const [result, setResult] = useState<SearchResult | null>(null);
  const [selId, setSelId] = useState<string | undefined>(undefined);
  const [route, setRoute] = useState<{ latitude: number; longitude: number }[] | undefined>(undefined);
  const [attempt, setAttempt] = useState(0);
  const [method, setMethod] = useState<MethodId>('UmmAlQura');
  const [now, setNow] = useState(() => new Date());
  const searchedAt = useRef<LatLng | null>(null);
  const busy = useRef(false);

  useEffect(() => { getMethod().then(setMethod).catch(() => undefined); }, []);
  useEffect(() => { const id = setInterval(() => setNow(new Date()), 30000); return () => clearInterval(id); }, []);

  // Konum: önce son bilinen (anında), sonra güncel; yürürken izlenir. 1 km'den fazla uzaklaşınca yeniden aranır.
  useEffect(() => {
    let alive = true;
    let sub: Location.LocationSubscription | undefined;
    const search = (o: LatLng) => {
      if (busy.current) return;
      busy.current = true;
      searchedAt.current = o;
      setState((s) => (s === 'ready' ? s : 'searching'));
      searchMosques(o, lg)
        .then((r) => { if (alive) { setResult(r); setState('ready'); } })
        .catch(() => { if (alive) setState('error'); })
        .finally(() => { busy.current = false; });
    };
    const onPos = (l: Location.LocationObject) => {
      if (!alive) return;
      const o = { lat: l.coords.latitude, lng: l.coords.longitude, acc: l.coords.accuracy ?? undefined };
      setPos(o);
      if (!searchedAt.current || distanceM(searchedAt.current, o) > 1000) search(o);
    };
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (!alive) return;
      if (status !== 'granted') { setState('denied'); return; }
      const last = await Location.getLastKnownPositionAsync({ maxAge: 10 * 60e3 }).catch(() => null);
      if (last) onPos(last);
      const cur = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }).catch(() => null);
      if (cur) onPos(cur);
      else if (!last) { setState('error'); return; }
      sub = await Location.watchPositionAsync({ accuracy: Location.Accuracy.High, distanceInterval: 5 }, onPos);
    })().catch(() => alive && setState('error'));
    return () => { alive = false; sub?.remove(); };
  }, [attempt, lg]);

  const list: Mosque[] = result && pos ? relocate(result.mosques, pos) : result?.mosques ?? [];
  const sel = list.find((m) => m.id === selId) ?? list[0];
  const np = pos ? nextPrayer(pos.lat, pos.lng, method, now) : null;
  const npMin = np ? Math.max(0, Math.round((np.at.getTime() - now.getTime()) / 60000)) : 0;
  const kindLabel = (m: Mosque) => pick(m.kind === 'musalla' ? L.musalla : m.kind === 'multifaith' ? L.multifaith : L.mosque, lang);
  const nameOf = (m: Mosque) => m.name || pick(L.unnamed, lang);
  const rel = (m: Mosque) => (heading != null ? m.bearing - heading : m.bearing);

  const [routing, setRouting] = useState(false);
  const showRoute = async () => {
    if (!pos || !sel) return;
    setRouting(true);
    try {
      const r = await walkRoute(pos, sel);
      setRoute(r.coords);
    } catch {
      // Yürüyüş rotası alınamazsa düz çizgi: yön ve uzaklık yine görünsün
      setRoute([{ latitude: pos.lat, longitude: pos.lng }, { latitude: sel.lat, longitude: sel.lng }]);
    } finally {
      setRouting(false);
    }
  };
  const retry = () => { searchedAt.current = null; setResult(null); setRoute(undefined); setState('locating'); setAttempt((a) => a + 1); };

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <View style={{ paddingTop: insets.top + 6, paddingHorizontal: 16 }}>
        <Header back title={pick(L.title, lang)} subtitle={pos?.acc ? `${pick(L.accuracy, lang)}${Math.round(pos.acc)} m` : undefined} />
      </View>

      {(state === 'locating' || state === 'searching') && !result ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14, padding: 24 }}>
          <ActivityIndicator size="large" color={C.green} />
          <Text style={T.body}>{pick(state === 'locating' ? L.locating : L.searching, lang)}</Text>
        </View>
      ) : state === 'denied' ? (
        <View style={{ padding: 16, gap: 12 }}>
          <Text style={T.body}>{pick(L.denied, lang)}</Text>
          <Btn title={pick(L.openSettings, lang)} onPress={() => Linking.openSettings()} />
          <Btn title={pick(L.qibla, lang)} kind="secondary" icon="compass" onPress={() => router.push('/kible')} />
        </View>
      ) : state === 'error' && !result ? (
        <View style={{ padding: 16, gap: 12 }}>
          <Text style={T.body}>{pick(L.error, lang)}</Text>
          <Btn title={pick(L.retry, lang)} onPress={retry} />
          <Btn title={pick(L.qibla, lang)} kind="secondary" icon="compass" onPress={() => router.push('/kible')} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}>
          {pos && list.length > 0 && (
            <View style={{ height: 300 }}>
              <MosqueMap user={pos} mosques={list} selectedId={sel?.id} route={route} onSelect={(id) => { setSelId(id); setRoute(undefined); }} />
            </View>
          )}
          <View style={{ padding: 16, gap: 12 }}>
            {result?.offline && (
              <View style={{ padding: 10, borderRadius: 12, backgroundColor: C.limitedTint }}>
                <Text style={{ fontSize: fs(13), fontWeight: '600', color: C.limited }}>{pick(L.offline, lang)} ({fmtTime(new Date(result.at))})</Text>
              </View>
            )}
            {np && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Icon name="clock" size={16} color={C.muted} />
                <Text style={T.muted}>{pick(L.next, lang)}: <Text style={{ color: C.ink, fontWeight: '700' }}>{pick(PRAYER_NAMES[np.key], lang)} {fmtTime(np.at)}</Text> · {npMin >= 60 ? `${Math.floor(npMin / 60)} ${pick(L.hr, lang)} ${npMin % 60}` : npMin} {pick(L.min, lang)}</Text>
              </View>
            )}

            {sel ? (
              <View style={[{ borderRadius: 22, backgroundColor: C.green, padding: 16, gap: 14 }, shadow]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                  <Arrow deg={rel(sel)} size={68} color="#FFFFFF" bg="rgba(255,255,255,0.16)" />
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={{ color: '#FFFFFF', fontSize: fs(19), fontWeight: '800' }} numberOfLines={2}>{nameOf(sel)}</Text>
                    <Text style={{ color: '#D8F0E0', fontSize: fs(13) }}>{kindLabel(sel)}{sel.denomination ? ` · ${sel.denomination}` : ''}</Text>
                    <Text style={{ color: '#FFFFFF', fontSize: fs(28), fontWeight: '800', marginTop: 4 }}>{fmtDistance(sel.dist, lg)}</Text>
                    <Text style={{ color: '#D8F0E0', fontSize: fs(13) }}>~{walkMinutes(sel.dist)} {pick(L.walk, lang)}</Text>
                  </View>
                </View>
                {heading == null && <Text style={{ color: '#D8F0E0', fontSize: fs(11.5) }}>{pick(L.noHeading, lang)}</Text>}
                {(sel.wheelchair || sel.hours) && (
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                    {sel.wheelchair ? <Pill text={pick(L.wheelchair, lang)} /> : null}
                    {sel.hours ? <Pill text={`${pick(L.hours, lang)}: ${sel.hours}`} /> : null}
                  </View>
                )}
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <Pressable onPress={showRoute} accessibilityRole="button" disabled={routing}
                    style={{ flex: 1, height: 48, borderRadius: 24, backgroundColor: '#FFFFFF', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                    {routing ? <ActivityIndicator color={C.green} /> : <Icon name="nav" size={18} color={C.green} />}
                    <Text style={{ fontSize: fs(15), fontWeight: '700', color: C.green }}>{pick(L.directions, lang)}</Text>
                  </Pressable>
                  <Pressable onPress={() => Linking.openURL(directionsUrl(sel, Platform.OS))} accessibilityRole="button" accessibilityLabel={pick(L.route, lang)}
                    style={{ width: 48, height: 48, borderRadius: 24, borderWidth: 1.5, borderColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon name="external" size={18} color="#FFFFFF" />
                  </Pressable>
                </View>
              </View>
            ) : (
              <Card style={{ gap: 12 }}>
                <Text style={T.body}>{pick(L.empty, lang)}</Text>
                <Btn title={pick(L.qibla, lang)} icon="compass" onPress={() => router.push('/kible')} />
              </Card>
            )}

            {list.length > 1 && (
              <>
                <Text style={[T.section, { marginTop: 4 }]}>{pick(L.others, lang)}</Text>
                {list.slice(0, 15).filter((m) => m.id !== sel?.id).map((m) => (
                  <Pressable key={m.id} onPress={() => { setSelId(m.id); setRoute(undefined); }} accessibilityRole="button"
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 16, backgroundColor: C.surface }}>
                    <Arrow deg={rel(m)} size={36} color={C.green} bg={C.greenTint} />
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: fs(15), fontWeight: '600', color: C.ink }} numberOfLines={1}>{nameOf(m)}</Text>
                      <Text style={T.small}>{kindLabel(m)} · ~{walkMinutes(m.dist)} {pick(L.walk, lang)}</Text>
                    </View>
                    <Text style={{ fontSize: fs(15), fontWeight: '700', color: C.ink }}>{fmtDistance(m.dist, lg)}</Text>
                  </Pressable>
                ))}
              </>
            )}

            <Pressable onPress={() => router.push('/kible')} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 6 }}>
              <Icon name="compass" size={18} color={C.accent} />
              <Text style={{ color: C.accent, fontWeight: '700' }}>{pick(L.qibla, lang)}</Text>
            </Pressable>
            {pos && (
              <Pressable onPress={() => Linking.openURL(osmNoteUrl(pos.lat, pos.lng))} accessibilityRole="link"
                style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 6 }}>
                <Icon name="pin" size={18} color={C.accent} />
                <Text style={{ flex: 1, color: C.accent, fontWeight: '700' }}>{pick(L.missing, lang)}</Text>
              </Pressable>
            )}
            <Text style={T.small}>{pick(L.osm, lang)}</Text>
          </View>
        </ScrollView>
      )}
    </View>
  );
}

function Arrow({ deg, size, color, bg }: { deg: number; size: number; color: string; bg: string }) {
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: bg, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ transform: [{ rotate: `${Math.round(deg)}deg` }] }}>
        <Svg width={size * 0.56} height={size * 0.56} viewBox="0 0 24 24">
          <Path d="M12 2 L20 11 H14.6 V22 H9.4 V11 H4 Z" fill={color} />
        </Svg>
      </View>
    </View>
  );
}

function Pill({ text }: { text: string }) {
  return (
    <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.18)' }}>
      <Text style={{ color: '#FFFFFF', fontSize: fs(12), fontWeight: '600' }}>{text}</Text>
    </View>
  );
}

/** OpenStreetMap'te bulunduğunuz yere "eksik cami" notu bırakma sayfası (hesap gerekmez). */
function osmNoteUrl(lat: number, lng: number) {
  return `https://www.openstreetmap.org/note/new#map=19/${lat.toFixed(5)}/${lng.toFixed(5)}`;
}
