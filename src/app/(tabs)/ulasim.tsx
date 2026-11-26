// Ulaşım: dünyanın her yerinde "neredeyim?" + hedefe yürüme, toplu taşıma (metro/otobüs/tren) ve araç/taksi.
// Mekke-Medine dışında da çalışır; Haram, Nebevî, otel ve en yakın cami hızlı hedeflerdir.
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import * as Location from 'expo-location';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Linking, Modal, Platform, Pressable, ScrollView, Share, Text, TextInput, View, useWindowDimensions, type TextStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Icon, type IconName } from '@/components/Icon';
import { TransportMap } from '@/components/TransportMap';
import type { MapSeg } from '@/components/TransportMap.types';
import { Btn, Card, IconBtn, Segmented, T } from '@/components/ui';
import { C, R, fs } from '@/constants/theme';
import istanbulRail from '@/data/istanbulRail.json';
import makkahBus from '@/data/makkahBus.json';
import { ANCHORS } from '@/data/sites';
import { pick, useI18n } from '@/i18n';
import { kmTo, useLocation } from '@/services/location';
import { uaHeaders } from '@/services/cache';
import {
  fmtMinutes, mapsUrl, meters, osrmUrl, parseOsrm, parsePhoton, photonReverseUrl, photonUrl, placeLine, planTransit, roughRoute,
  shareText, uberUrl, type Itinerary, type LatLng, type LegKind, type Place, type StreetRoute, type Travel,
} from '@/services/transport';
import { covers, planRail, railNetwork, type RailData, type RailNet } from '@/services/railRouter';
import { alightText, boardText, lineName, minText, stopsText, tidyName, walkText } from '@/services/transitText';
import { usePersisted } from '@/services/usePersisted';

type Lang = 'tr' | 'en' | 'ar';
const L = {
  title: { tr: 'Ulaşım', en: 'Getting around', ar: 'التنقل' },
  here: { tr: 'Buradasınız', en: 'You are here', ar: 'أنت هنا' },
  locating: { tr: 'Konumunuz alınıyor…', en: 'Getting your location…', ar: 'جارٍ تحديد موقعك…' },
  denied: { tr: 'Konum izni yok. Hedef arayıp telefonun haritasında açabilirsiniz.', en: 'No location permission. You can still search a place and open it in your maps app.', ar: 'لا يوجد إذن للموقع. يمكنك البحث عن مكان وفتحه في تطبيق الخرائط.' },
  share: { tr: 'Konumumu paylaş', en: 'Share my location', ar: 'شارك موقعي' },
  where: { tr: 'Nereye gitmek istiyorsunuz?', en: 'Where do you want to go?', ar: 'إلى أين تريد الذهاب؟' },
  hint: { tr: 'Haritada bir noktaya uzun basarak da hedef seçebilirsiniz.', en: 'You can also long-press the map to pick a destination.', ar: 'يمكنك أيضًا الضغط مطولًا على الخريطة لاختيار وجهة.' },
  haram: { tr: 'Mescid-i Haram', en: 'Masjid al-Haram', ar: 'المسجد الحرام' },
  nabawi: { tr: 'Mescid-i Nebevî', en: "Prophet's Mosque", ar: 'المسجد النبوي' },
  hotelM: { tr: 'Otelim (Mekke)', en: 'My hotel (Makkah)', ar: 'فندقي (مكة)' },
  hotelD: { tr: 'Otelim (Medine)', en: 'My hotel (Madinah)', ar: 'فندقي (المدينة)' },
  mosque: { tr: 'En yakın cami', en: 'Nearest mosque', ar: 'أقرب مسجد' },
  train: { tr: 'Haremeyn treni', en: 'Haramain train', ar: 'قطار الحرمين' },
  access: { tr: 'Tekerlekli sandalye', en: 'Wheelchair', ar: 'كرسي متحرك' },
  recent: { tr: 'Son hedefler', en: 'Recent', ar: 'الأخيرة' },
  noResult: { tr: 'Sonuç bulunamadı. Farklı yazmayı deneyin.', en: 'No results. Try another spelling.', ar: 'لا توجد نتائج. جرّب كتابة أخرى.' },
  searchErr: { tr: 'Arama yapılamadı. İnternet bağlantınızı kontrol edin.', en: 'Search failed. Check your connection.', ar: 'تعذّر البحث. تحقق من الاتصال.' },
  picked: { tr: 'Seçilen nokta', en: 'Selected point', ar: 'النقطة المختارة' },
  away: { tr: 'kuş uçuşu', en: 'straight line', ar: 'خط مستقيم' },
  change: { tr: 'Hedefi değiştir', en: 'Change destination', ar: 'غيّر الوجهة' },
  walk: { tr: 'Yürüme', en: 'Walk', ar: 'مشي' },
  transit: { tr: 'Toplu taşıma', en: 'Transit', ar: 'نقل عام' },
  car: { tr: 'Araç · Taksi', en: 'Car · Taxi', ar: 'سيارة · تاكسي' },
  routing: { tr: 'Rota hesaplanıyor…', en: 'Finding a route…', ar: 'جارٍ حساب المسار…' },
  approx: { tr: 'Rota sunucusuna ulaşılamadı — süre kaba tahmindir.', en: "Couldn't reach the routing server — time is a rough estimate.", ar: 'تعذّر الوصول إلى خادم المسارات — المدة تقديرية.' },
  noFrom: { tr: 'Konumunuz olmadan süre hesaplanamıyor; tarifi telefonun haritasında açabilirsiniz.', en: "Without your location the time can't be calculated; open directions in your maps app.", ar: 'بدون موقعك لا يمكن حساب المدة؛ افتح الاتجاهات في تطبيق الخرائط.' },
  openMaps: { tr: 'Telefonun haritasında aç', en: 'Open in maps app', ar: 'افتح في تطبيق الخرائط' },
  startWalk: { tr: 'Yürüyüş tarifini başlat', en: 'Start walking directions', ar: 'ابدأ اتجاهات المشي' },
  longWalk: { tr: 'Uzun bir yürüyüş. Sıcakta su alın; toplu taşıma ya da taksi daha uygun olabilir.', en: 'A long walk. Carry water in the heat; transit or a taxi may be better.', ar: 'مسافة مشي طويلة. احمل الماء في الحر؛ قد يكون النقل العام أو التاكسي أنسب.' },
  drive: { tr: 'Araçla yol tarifi', en: 'Driving directions', ar: 'اتجاهات القيادة' },
  uber: { tr: 'Uber çağır', en: 'Request Uber', ar: 'اطلب أوبر' },
  driver: { tr: 'Şoföre göster', en: 'Show the driver', ar: 'اعرضه على السائق' },
  noTraffic: { tr: 'trafik hariç', en: 'without traffic', ar: 'بدون زحام' },
  taxiNote: { tr: 'Taksi uygulamaları (Uber, Careem vb.) ülkeye göre değişir. Resmî taksilerde taksimetre açılmasını isteyin. Hac ve Ramazan yoğunluğunda Harem çevresinde araç trafiği kapatılabilir.', en: 'Ride apps (Uber, Careem, etc.) vary by country. In official taxis, ask for the meter. During Hajj and Ramadan peaks, traffic around the Haram may be closed.', ar: 'تختلف تطبيقات النقل (أوبر، كريم وغيرها) حسب البلد. اطلب تشغيل العداد في سيارات الأجرة الرسمية. في مواسم الحج ورمضان قد تُغلق الطرق حول الحرم.' },
  transitOff: { tr: 'Metro, otobüs ve tren tarifi (güncel sefer saatleriyle) telefonunuzun harita uygulamasında açılır.', en: 'Metro, bus and train directions (with live timetables) open in your maps app.', ar: 'تُفتح اتجاهات المترو والحافلات والقطارات (مع المواعيد) في تطبيق الخرائط.' },
  transitNone: { tr: 'Bu güzergâh için toplu taşıma bulunamadı. Harita uygulamasında deneyin.', en: 'No transit found for this trip. Try your maps app.', ar: 'لم يُعثر على نقل عام لهذه الرحلة. جرّب تطبيق الخرائط.' },
  transitErr: { tr: 'Toplu taşıma sunucusuna ulaşılamadı.', en: "Couldn't reach the transit server.", ar: 'تعذّر الوصول إلى خادم النقل العام.' },
  transfers: { tr: 'aktarma', en: 'transfer(s)', ar: 'تبديل' },
  direct: { tr: 'aktarmasız', en: 'direct', ar: 'مباشر' },
  stops: { tr: 'durak', en: 'stops', ar: 'محطات' },
  sources: { tr: 'Toplu taşıma verisi: Transitous ve açık veri kaynakları', en: 'Transit data: Transitous and open data sources', ar: 'بيانات النقل: Transitous ومصادر البيانات المفتوحة' },
  busSrc: { tr: 'Mekke otobüs hatları (Makkah Bus): © OpenStreetMap katkıcıları. Süreler yaklaşıktır; canlı varış saatleri Makkah Bus uygulamasında. Bilet uygulamadan ya da duraktaki makineden alınır. Hac ve Ramazan’da güzergâhlar değişebilir.', en: 'Makkah Bus routes: © OpenStreetMap contributors. Times are estimates; live arrivals are in the Makkah Bus app. Buy tickets in the app or from the machine at the stop. Routes may change during Hajj and Ramadan.', ar: 'خطوط حافلات مكة: © مساهمو OpenStreetMap. المدد تقديرية، ومواعيد الوصول الحية في تطبيق حافلات مكة. التذاكر من التطبيق أو من الجهاز في الموقف. قد تتغير المسارات في الحج ورمضان.' },
  railSrc: { tr: 'Metro, tramvay ve Marmaray hatları: © OpenStreetMap katkıcıları. Süreler yaklaşıktır; sefer saati içermez.', en: 'Metro, tram and Marmaray lines: © OpenStreetMap contributors. Times are estimates, not timetables.', ar: 'خطوط المترو والترام ومرمراي: © مساهمو OpenStreetMap. المدد تقديرية دون جداول.' },
  approxTime: { tr: 'yaklaşık süre', en: 'estimated time', ar: 'مدة تقديرية' },
  busSearch: { tr: 'Otobüs seferleri aranıyor…', en: 'Looking for buses…', ar: 'جارٍ البحث عن الحافلات…' },
  walkBetter: { tr: 'Yürüyerek yaklaşık {n} dk; toplu taşıma gerekmiyor.', en: 'About {n} min on foot; no transit needed.', ar: 'نحو {n} دقيقة مشيًا؛ لا حاجة للنقل العام.' },
  takeMe: { tr: 'Lütfen beni buraya götürün', en: 'Please take me here', ar: 'من فضلك خذني إلى هنا' },
  close: { tr: 'Kapat', en: 'Close', ar: 'إغلاق' },
  osm: { tr: 'Harita ve rota verisi © OpenStreetMap katkıcıları', en: 'Map and routing data © OpenStreetMap contributors', ar: 'بيانات الخريطة والمسارات © مساهمو OpenStreetMap' },
} satisfies Record<string, { tr: string; en: string; ar: string }>;

const KIND: Record<LegKind, { icon: IconName; color: string; ml: { tr: string; en: string; ar: string } }> = {
  walk: { icon: 'walk', color: '#6B7280', ml: { tr: 'Yürü', en: 'Walk', ar: 'مشي' } },
  bus: { icon: 'bus', color: '#B45309', ml: { tr: 'Otobüs', en: 'Bus', ar: 'حافلة' } },
  metro: { icon: 'train', color: '#1D4ED8', ml: { tr: 'Metro', en: 'Metro', ar: 'مترو' } },
  tram: { icon: 'train', color: '#7C3AED', ml: { tr: 'Tramvay', en: 'Tram', ar: 'ترام' } },
  train: { icon: 'train', color: '#B42318', ml: { tr: 'Tren', en: 'Train', ar: 'قطار' } },
  ferry: { icon: 'water', color: '#0F766E', ml: { tr: 'Vapur', en: 'Ferry', ar: 'عبّارة' } },
  other: { icon: 'bus', color: '#4B5563', ml: { tr: 'Hat', en: 'Line', ar: 'خط' } },
};

const CONTACT = process.env.EXPO_PUBLIC_TRANSITOUS_CONTACT ?? '';
// Çevrimdışı ağlar: İstanbul raylı sistem ve Mekke otobüsleri (ilk kullanımda bir kez kurulur)
type NetId = 'ist' | 'mkk';
const NET_DATA: Record<NetId, RailData> = { ist: istanbulRail as unknown as RailData, mkk: makkahBus as unknown as RailData };
const NETS: Partial<Record<NetId, RailNet>> = {};
const netOf = (id: NetId) => (NETS[id] ??= railNetwork(NET_DATA[id]));
/** Hedefe göre önerilen yol türü: 1,5 km'den kısa yürüme; toplu taşıma tarifi varsa o; uzaksa araç. */
function autoMode(from: LatLng | null | undefined, to: LatLng): Travel {
  const d = from ? meters(from, to) : 0;
  if (d && d < 1500) return 'walk';
  if ((from && remoteFor(from, to)) || netFor(from, to)) return 'transit';
  return d > 4000 ? 'car' : 'walk';
}

/** Her iki nokta da aynı çevrimdışı ağın alanındaysa o ağ */
const netFor = (a?: LatLng | null, b?: LatLng | null): NetId | null =>
  (a && b ? (['ist', 'mkk'] as NetId[]).find((id) => covers(NET_DATA[id], a) && covers(NET_DATA[id], b)) : undefined) ?? null;
// Transitous koşulu: istekler uygulamayı tanıtan User-Agent taşımalı — tarayıcı bunu ayarlayamadığı için web'de kapalı.
const TRANSIT_ON = !!CONTACT && (Platform.OS !== 'web' || process.env.EXPO_PUBLIC_TRANSITOUS_WEB === '1');
// Transitous'ta Suudi Arabistan verisi yok: Mekke ve Medine çevresinde istek gönderilmez (günlük sınır boşa gitmesin,
// "aranıyor" yazısı boşuna dönmesin). Mekke'de otobüs tarifi çevrimdışı ağdan gelir.
const remoteFor = (a?: LatLng | null, b?: LatLng | null) =>
  TRANSIT_ON && !(a && b && (['makkah', 'madinah'] as const).some((c) => kmTo(c, a) < 90 && kmTo(c, b) < 90));
const VERSION = Constants.expoConfig?.version ?? '0';
const WEB_NO_OUTLINE = (Platform.OS === 'web' ? { outlineStyle: 'none' } : null) as TextStyle | null;

const fmtDist = (m: number, lang: Lang) => (m < 1000 ? `${Math.round(m / 10) * 10} m` : `${(m / 1000).toFixed(m < 10000 ? 1 : 0).replace('.', lang === 'en' ? '.' : ',')} km`);
const hhmm = (iso: string, lang: Lang) => new Date(iso).toLocaleTimeString(lang === 'ar' ? 'ar-SA' : lang, { hour: '2-digit', minute: '2-digit' });

async function getJson(url: string, ms = 12000) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  try {
    const r = await fetch(url, { signal: ctrl.signal, headers: { Accept: 'application/json', ...uaHeaders() } });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return await r.json();
  } finally {
    clearTimeout(timer);
  }
}

async function reverseAddress(p: LatLng): Promise<string> {
  if (Platform.OS !== 'web') {
    try {
      const [a] = await Location.reverseGeocodeAsync({ latitude: p.lat, longitude: p.lng });
      if (a) {
        const line = [a.name !== a.street ? a.name : '', [a.street, a.streetNumber].filter(Boolean).join(' '), a.district, a.city, a.country]
          .filter(Boolean).filter((x, i, arr) => arr.indexOf(x) === i).join(', ');
        if (line) return line;
      }
    } catch { /* cihaz coğrafi kodlaması yoksa Photon'a düş */ }
  }
  const [pl] = parsePhoton(await getJson(photonReverseUrl(p)));
  return pl ? placeLine(pl) : '';
}

type Recent = { items: Place[] };

export default function TransportScreen() {
  const { lang } = useI18n();
  const lg = lang as Lang;
  const l = (k: keyof typeof L) => pick(L[k], lg);
  const { height } = useWindowDimensions();
  const { fix, denied } = useLocation();
  const here = useMemo(() => (fix ? { lat: fix.lat, lng: fix.lng } : null), [fix]);

  // Bulunduğunuz yerin adresi (50 m'den fazla hareket edince yenilenir)
  const [address, setAddress] = useState('');
  const lastGeo = useRef<LatLng | null>(null);
  useEffect(() => {
    if (!here || (lastGeo.current && meters(lastGeo.current, here) < 50)) return;
    lastGeo.current = here;
    let alive = true;
    reverseAddress(here).then((a) => alive && a && setAddress(a)).catch(() => undefined);
    return () => { alive = false; };
  }, [here]);

  // Hızlı hedefler: otel konumları (Şehir haritasında kaydedilen)
  const [hotels, setHotels] = useState<{ makkah?: LatLng; madinah?: LatLng }>({});
  useEffect(() => {
    Promise.all([AsyncStorage.getItem('mataf.hotel.makkah'), AsyncStorage.getItem('mataf.hotel.madinah')])
      .then(([m, d]) => setHotels({ makkah: m ? JSON.parse(m) : undefined, madinah: d ? JSON.parse(d) : undefined }))
      .catch(() => undefined);
  }, []);
  const [recent, setRecent] = usePersisted<Recent>('transport:recent', { items: [] });

  // Arama
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Place[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [searchErr, setSearchErr] = useState(false);
  const q3 = query.trim().length >= 3;
  useEffect(() => {
    const q = query.trim();
    if (q.length < 3) return;
    let alive = true;
    const timer = setTimeout(() => {
      setSearching(true);
      getJson(photonUrl(q, here, lg))
        .then((j) => { if (alive) { setResults(parsePhoton(j)); setSearchErr(false); } })
        .catch(() => { if (alive) { setResults([]); setSearchErr(true); } })
        .finally(() => alive && setSearching(false));
    }, 450);
    return () => { alive = false; clearTimeout(timer); };
  }, [query]); // eslint-disable-line react-hooks/exhaustive-deps

  // Hedef ve rota
  const [dest, setDest] = useState<Place | null>(null);
  const [from, setFrom] = useState<LatLng | null>(null);
  // Kullanıcının seçtiği yol türü; null iken hedefe ve konuma göre kendiliğinden seçilir (konum sonradan gelse de)
  const [modeSel, setMode] = useState<Travel | null>('walk');
  const [street, setStreet] = useState<Record<string, StreetRoute | undefined>>({});
  const [transit, setTransit] = useState<Record<string, Itinerary[] | 'error' | undefined>>({});
  const [sel, setSel] = useState(0);
  const [driver, setDriver] = useState(false);

  const choose = (p: Place, remember = true) => {
    setDest(p);
    setQuery('');
    setResults(null);
    setFrom(here);
    setSel(0);
    setMode(here ? autoMode(here, p) : null);
    if (remember) setRecent({ items: [p, ...recent.items.filter((x) => x.id !== p.id)].slice(0, 6) });
  };
  // Derin bağlantı: mataf://ulasim?to=21.4225,39.8262&name=Mescid-i Haram (haritadaki "Nasıl giderim" de bunu kullanır).
  // Konum henüz yoksa yol türü konum gelince kendiliğinden seçilir.
  const params = useLocalSearchParams<{ to?: string; name?: string }>();
  const linked = useRef('');
  useEffect(() => {
    const to = typeof params.to === 'string' ? params.to : '';
    if (!to || linked.current === to) return;
    const [la, ln] = to.split(',').map(Number);
    if (!Number.isFinite(la) || !Number.isFinite(ln)) return;
    const name = (typeof params.name === 'string' && params.name) || l('picked');
    const id = setTimeout(() => {
      linked.current = to;
      choose({ id: `pt:${la.toFixed(5)},${ln.toFixed(5)}`, name, sub: `${la.toFixed(5)}, ${ln.toFixed(5)}`, lat: la, lng: ln }, false);
    }, 0);
    return () => clearTimeout(id);
  }, [params.to]); // eslint-disable-line react-hooks/exhaustive-deps

  // Başlangıç: hedef seçildiği andaki konum; o an konum yoksa ~100 m'ye yuvarlanmış güncel konum
  // (rota her GPS güncellemesinde yeniden hesaplanmasın diye).
  const from2 = useMemo(() => from ?? (here ? { lat: +here.lat.toFixed(3), lng: +here.lng.toFixed(3) } : null), [from, here]);
  const routeKey = dest && from2 ? `${dest.id}|${from2.lat.toFixed(4)},${from2.lng.toFixed(4)}` : '';
  const mode: Travel = modeSel ?? (dest ? autoMode(from2, dest) : 'walk');
  useEffect(() => {
    if (!dest || !from2 || mode === 'transit') return;
    const profile = mode === 'walk' ? 'foot' : 'car';
    const k = `${routeKey}|${profile}`;
    if (street[k]) return;
    const fromP = from2;
    getJson(osrmUrl(fromP, dest, profile))
      .then((j) => parseOsrm(j) ?? roughRoute(fromP, dest, profile))
      .catch(() => roughRoute(fromP, dest, profile))
      .then((r) => setStreet((s) => ({ ...s, [k]: r })));
  }, [routeKey, mode]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!dest || !from2 || mode !== 'transit' || !remoteFor(from2, dest) || transit[routeKey]) return;
    const k = routeKey;
    planTransit(from2, dest, { lang: lg, contact: CONTACT, version: VERSION })
      .then((r) => setTransit((s) => ({ ...s, [k]: r })))
      .catch(() => setTransit((s) => ({ ...s, [k]: 'error' })));
  }, [routeKey, mode]); // eslint-disable-line react-hooks/exhaustive-deps

  const itins = transit[routeKey]; // undefined = yükleniyor
  const cur = mode === 'transit' ? undefined : street[`${routeKey}|${mode === 'walk' ? 'foot' : 'car'}`];
  // İstanbul'da metro, tramvay, Marmaray; Mekke'de Makkah Bus tarifi telefonda hesaplanır.
  // İstanbul otobüsleri ve başka şehirler Transitous'tan gelir.
  const railId = netFor(from2, dest);
  const railOn = !!railId;
  const rail = useMemo(() => (mode === 'transit' && railId && dest && from2 ? planRail(netOf(railId), from2, dest, new Date(), lg) : null), [mode, railId, dest, from2, lg]);
  const remote = remoteFor(from2, dest);
  const transitOn = remote || railOn;
  const all = useMemo(() => [...(rail?.itineraries ?? []), ...(Array.isArray(itins) ? itins : [])].sort((a, b) => a.minutes - b.minutes).slice(0, 6), [rail, itins]);
  const itin = all[sel];
  const segments: MapSeg[] = useMemo(() => {
    if (mode === 'transit') {
      return itin ? itin.legs.map((g) => ({ coords: g.coords, color: g.kind === 'walk' ? C.muted : g.color ?? KIND[g.kind].color, dashed: g.kind === 'walk' })) : [];
    }
    return cur ? [{ coords: cur.coords, color: C.route, dashed: cur.approximate }] : [];
  }, [mode, itin, cur]);

  const pickPoint = (p: LatLng) => {
    const pl: Place = { id: `pt:${p.lat.toFixed(5)},${p.lng.toFixed(5)}`, name: l('picked'), sub: `${p.lat.toFixed(5)}, ${p.lng.toFixed(5)}`, lat: p.lat, lng: p.lng };
    choose(pl, false);
    reverseAddress(p).then((a) => a && setDest((d) => (d?.id === pl.id ? { ...d, name: a.split(', ')[0], sub: a.split(', ').slice(1).join(', ') } : d))).catch(() => undefined);
  };

  const quick: { label: string; icon: IconName; onPress: () => void }[] = [
    { label: l('haram'), icon: 'kaaba', onPress: () => choose({ id: 'q:haram', name: l('haram'), local: 'المسجد الحرام', sub: pick({ tr: 'Mekke', en: 'Makkah', ar: 'مكة المكرمة' }, lg), lat: ANCHORS.makkah.lat, lng: ANCHORS.makkah.lng }) },
    { label: l('nabawi'), icon: 'moon', onPress: () => choose({ id: 'q:nabawi', name: l('nabawi'), local: 'المسجد النبوي', sub: pick({ tr: 'Medine', en: 'Madinah', ar: 'المدينة المنورة' }, lg), lat: ANCHORS.madinah.lat, lng: ANCHORS.madinah.lng }) },
    ...(hotels.makkah ? [{ label: l('hotelM'), icon: 'hotel' as IconName, onPress: () => choose({ id: 'q:hotelM', name: l('hotelM'), sub: '', ...hotels.makkah! }) }] : []),
    ...(hotels.madinah ? [{ label: l('hotelD'), icon: 'hotel' as IconName, onPress: () => choose({ id: 'q:hotelD', name: l('hotelD'), sub: '', ...hotels.madinah! }) }] : []),
    { label: l('mosque'), icon: 'pin', onPress: () => router.push('/cami') },
    { label: l('train'), icon: 'train', onPress: () => router.push('/tren') },
    { label: l('access'), icon: 'wheel', onPress: () => router.push('/erisim') },
  ];

  // "Buradasınız": hedef seçilmemişken üstte tam, seçilince altta kısa
  const hereCard = (compact: boolean) => (
    <Card style={{ gap: 8 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: C.userTint, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="locate" color={C.user} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={T.section}>{l('here')}</Text>
          <Text style={T.body} numberOfLines={2}>
            {here ? address || `${here.lat.toFixed(5)}, ${here.lng.toFixed(5)}` : denied ? l('denied') : l('locating')}
          </Text>
          {here && fix?.accuracy && !compact ? <Text style={T.small}>±{Math.round(fix.accuracy)} m · {here.lat.toFixed(5)}, {here.lng.toFixed(5)}</Text> : null}
        </View>
        {!here && !denied && <ActivityIndicator color={C.muted} />}
      </View>
      {here && <Btn title={l('share')} kind="secondary" icon="share" onPress={() => Share.share({ message: shareText(here, address) })} />}
    </Card>
  );

  const open = (m: Travel) => dest && Linking.openURL(mapsUrl(dest, m, Platform.OS, from2 ?? undefined));

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={['top', 'left', 'right']}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8, gap: 12 }}>
        <Text style={[T.h1, { flex: 1 }]} accessibilityRole="header">{l('title')}</Text>
        <IconBtn name="settings" label={pick({ tr: 'Ayarlar', en: 'Settings', ar: 'الإعدادات' }, lg)} size={40} tint={C.accentTint} color={C.accent} onPress={() => router.push('/ayarlar')} />
      </View>
      <View style={{ height: Math.round(height * 0.36), borderTopWidth: 1, borderBottomWidth: 1, borderColor: C.border }}>
        <TransportMap user={here} dest={dest} segments={segments} onLongPress={pickPoint}
          fitKey={`${dest?.id ?? ''}|${mode}|${sel}|${segments.length}|${here ? 1 : 0}`} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
        {!dest && hereCard(false)}

        {/* Hedef */}
        {!dest ? (
          <View style={{ gap: 10 }}>
            <Text style={T.h3}>{l('where')}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderColor: C.borderStrong, borderRadius: R.lg, paddingHorizontal: 12, backgroundColor: C.surface }}>
              <Icon name="search" color={C.muted} />
              <TextInput value={query} onChangeText={setQuery} placeholder={pick({ tr: 'Adres, otel, istasyon, yer…', en: 'Address, hotel, station, place…', ar: 'عنوان، فندق، محطة، مكان…' }, lg)}
                placeholderTextColor={C.muted} returnKeyType="search" autoCorrect={false}
                style={[{ flex: 1, height: 46, fontSize: fs(16), color: C.ink, textAlign: lg === 'ar' ? 'right' : 'left' }, WEB_NO_OUTLINE]} accessibilityLabel={l('where')} />
              {searching ? <ActivityIndicator color={C.muted} /> : query ? (
                <Pressable onPress={() => setQuery('')} hitSlop={8} accessibilityRole="button" accessibilityLabel={l('close')}><Icon name="close" color={C.muted} /></Pressable>
              ) : null}
            </View>
            {q3 && results ? (
              results.length ? results.map((p) => (
                <Pressable key={p.id} onPress={() => choose(p)} accessibilityRole="button"
                  style={({ pressed }) => ({ flexDirection: 'row', gap: 10, alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderColor: C.border, opacity: pressed ? 0.7 : 1 })}>
                  <Icon name="pin" color={C.accent} />
                  <View style={{ flex: 1 }}>
                    <Text style={[T.body, { fontWeight: '600' }]} numberOfLines={1}>{p.name}</Text>
                    {p.sub ? <Text style={T.small} numberOfLines={1}>{p.sub}</Text> : null}
                  </View>
                  {here && <Text style={T.small}>{fmtDist(meters(here, p), lg)}</Text>}
                </Pressable>
              )) : <Text style={T.muted}>{searchErr ? l('searchErr') : l('noResult')}</Text>
            ) : (
              <>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  {quick.map((q) => (
                    <Pressable key={q.label} onPress={q.onPress} accessibilityRole="button"
                      style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, height: 38, borderRadius: 19, backgroundColor: C.accentTint, opacity: pressed ? 0.7 : 1 })}>
                      <Icon name={q.icon} color={C.accent} size={16} />
                      <Text style={{ color: C.accent, fontWeight: '700', fontSize: fs(14) }}>{q.label}</Text>
                    </Pressable>
                  ))}
                </View>
                {recent.items.length > 0 && (
                  <View style={{ gap: 2 }}>
                    <Text style={T.section}>{l('recent')}</Text>
                    {recent.items.map((p) => (
                      <Pressable key={p.id} onPress={() => choose(p)} accessibilityRole="button"
                        style={({ pressed }) => ({ flexDirection: 'row', gap: 10, alignItems: 'center', paddingVertical: 9, opacity: pressed ? 0.7 : 1 })}>
                        <Icon name="clock" color={C.muted} size={18} />
                        <Text style={[T.body, { flex: 1 }]} numberOfLines={1}>{placeLine(p)}</Text>
                      </Pressable>
                    ))}
                  </View>
                )}
                {Platform.OS !== 'web' && <Text style={T.small}>{l('hint')}</Text>}
              </>
            )}
          </View>
        ) : (
          <View style={{ gap: 12 }}>
            <Card style={{ gap: 6 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <Icon name="flag" color={C.accent} />
                <View style={{ flex: 1 }}>
                  <Text style={[T.h3]} numberOfLines={2}>{dest.name}</Text>
                  {dest.sub ? <Text style={T.small} numberOfLines={2}>{dest.sub}</Text> : null}
                </View>
                <IconBtn name="close" label={l('change')} size={36} onPress={() => { setDest(null); setFrom(null); }} />
              </View>
              {here && <Text style={T.small}>{fmtDist(meters(here, dest), lg)} {l('away')}</Text>}
            </Card>

            <Segmented value={mode} onChange={(m) => { setMode(m); setSel(0); }}
              options={[{ value: 'walk', label: l('walk') }, { value: 'transit', label: l('transit') }, { value: 'car', label: l('car') }]} />

            {mode !== 'transit' && (
              !from2 ? <Text style={T.muted}>{l('noFrom')}</Text>
                : !cur ? (
                  <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}><ActivityIndicator color={C.muted} /><Text style={T.muted}>{l('routing')}</Text></View>
                ) : (
                  <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8 }}>
                    <Text style={{ fontSize: fs(30), fontWeight: '800', color: C.ink }}>{fmtMinutes(Math.max(1, Math.round(cur.seconds / 60)), lg)}</Text>
                    <Text style={T.muted}>{fmtDist(cur.meters, lg)}{mode === 'car' ? ` · ${l('noTraffic')}` : ''}</Text>
                  </View>
                )
            )}
            {mode !== 'transit' && cur?.approximate && <Text style={T.small}>{l('approx')}</Text>}

            {mode === 'walk' && (
              <>
                {cur && cur.meters > 3000 && <Card tint={C.limitedTint}><Text style={T.body}>{l('longWalk')}</Text></Card>}
                <Btn title={l('startWalk')} icon="walk" onPress={() => open('walk')} />
              </>
            )}

            {mode === 'car' && (
              <>
                <Btn title={l('drive')} icon="car" onPress={() => open('car')} />
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <Btn title={l('uber')} kind="secondary" icon="taxi" style={{ flex: 1 }} onPress={() => Linking.openURL(uberUrl(dest, dest.name))} />
                  <Btn title={l('driver')} kind="secondary" icon="external" style={{ flex: 1 }} onPress={() => setDriver(true)} />
                </View>
                <Text style={T.small}>{l('taxiNote')}</Text>
              </>
            )}

            {mode === 'transit' && (
              <>
                {!transitOn ? (
                  <Card style={{ gap: 6 }}>
                    <View style={{ flexDirection: 'row', gap: 6 }}>
                      {(['metro', 'bus', 'train'] as LegKind[]).map((k) => <Badge key={k} kind={k} label={pick(KIND[k].ml, lg)} />)}
                    </View>
                    <Text style={T.body}>{l('transitOff')}</Text>
                  </Card>
                ) : !from2 ? <Text style={T.muted}>{l('noFrom')}</Text> : (
                  <>
                    {rail && !rail.itineraries.length && rail.walkOnly < 30 && <Text style={T.body}>{l('walkBetter').replace('{n}', String(Math.round(rail.walkOnly)))}</Text>}
                    {all.map((it, i) => (
                      <ItinCard key={`${it.source}-${i}`} it={it} lang={lg} active={i === sel} onPress={() => setSel(i)} l={l}
                        names={{ START: l('here'), END: dest.name }} />
                    ))}
                    {remote && itins === undefined && (
                      <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}><ActivityIndicator color={C.muted} /><Text style={T.muted}>{l(rail ? 'busSearch' : 'routing')}</Text></View>
                    )}
                    {remote && itins === 'error' && !all.length && <Text style={T.muted}>{l('transitErr')}</Text>}
                    {!all.length && (!remote || Array.isArray(itins)) && !(rail && rail.walkOnly < 30) && <Text style={T.muted}>{l('transitNone')}</Text>}
                  </>
                )}
                <Btn title={l('openMaps')} kind={transitOn ? 'secondary' : 'primary'} icon="train" onPress={() => open('transit')} />
                {rail && <Text style={T.small}>{l(railId === 'mkk' ? 'busSrc' : 'railSrc')}</Text>}
                {remote && (
                  <Pressable onPress={() => Linking.openURL('https://transitous.org/sources/')} accessibilityRole="link">
                    <Text style={[T.small, { textDecorationLine: 'underline' }]}>{l('sources')} ↗</Text>
                  </Pressable>
                )}
              </>
            )}
            {mode !== 'car' && <Btn title={l('driver')} kind="secondary" icon="external" onPress={() => setDriver(true)} />}
          </View>
        )}
        {dest && hereCard(true)}
        <Text style={[T.small, { textAlign: 'center' }]}>{l('osm')}</Text>
      </ScrollView>

      {/* Şoföre / görevliye göster: büyük yazı, birkaç dilde */}
      <Modal visible={driver && !!dest} animationType="slide" onRequestClose={() => setDriver(false)} supportedOrientations={['portrait', 'landscape']}>
        <SafeAreaView style={{ flex: 1, backgroundColor: C.bg, padding: 24, gap: 18, justifyContent: 'center' }}>
          <Text style={{ fontSize: fs(22), color: C.ink2, textAlign: 'center', writingDirection: 'rtl' }}>{L.takeMe.ar}</Text>
          <Text style={{ fontSize: fs(20), color: C.ink2, textAlign: 'center', writingDirection: 'rtl' }}>براہ کرم مجھے یہاں لے چلیں</Text>
          <Text style={{ fontSize: fs(18), color: C.ink2, textAlign: 'center' }}>{L.takeMe.en}</Text>
          {dest?.local ? <Text style={{ fontSize: fs(40), fontWeight: '800', color: C.ink, textAlign: 'center', writingDirection: 'rtl' }}>{dest.local}</Text> : null}
          <Text style={{ fontSize: dest?.local ? 26 : 34, fontWeight: '800', color: C.ink, textAlign: 'center' }}>{dest?.name}</Text>
          {dest?.sub ? <Text style={{ fontSize: fs(20), color: C.ink, textAlign: 'center' }}>{dest.sub}</Text> : null}
          {dest && <Text style={{ fontSize: fs(16), color: C.muted, textAlign: 'center' }}>{dest.lat.toFixed(5)}, {dest.lng.toFixed(5)}</Text>}
          <Btn title={l('close')} kind="secondary" onPress={() => setDriver(false)} />
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

function Badge({ kind, label, color, textColor }: { kind: LegKind; label: string; color?: string; textColor?: string }) {
  const bg = color ?? KIND[kind].color;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, height: 26, borderRadius: 8, backgroundColor: bg }}>
      <Icon name={KIND[kind].icon} color={textColor ?? '#FFFFFF'} size={14} />
      {label ? <Text style={{ color: textColor ?? '#FFFFFF', fontWeight: '700', fontSize: fs(13) }}>{label}</Text> : null}
    </View>
  );
}

function ItinCard({ it, lang, active, onPress, l, names }: { it: Itinerary; lang: Lang; active: boolean; onPress: () => void; l: (k: keyof typeof L) => string; names: Record<string, string> }) {
  // MOTIS, koordinatla verilen başlangıç ve hedefi "START" / "END" diye adlandırır
  const nm = (n: string) => names[n] ?? n;
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityState={{ selected: active }}
      style={{ borderWidth: active ? 2 : 1, borderColor: active ? C.accent : C.border, borderRadius: R.lg, padding: 12, gap: 10, backgroundColor: C.bg }}>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8 }}>
        <Text style={{ fontSize: fs(20), fontWeight: '800', color: C.ink }}>{it.approx ? '≈ ' : ''}{fmtMinutes(it.minutes, lang)}</Text>
        <Text style={[T.muted, { flexShrink: 1 }]}>{it.approx ? l('approxTime') : `${hhmm(it.start, lang)} → ${hhmm(it.end, lang)}`} · {it.transfers ? `${it.transfers} ${l('transfers')}` : l('direct')}</Text>
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 4 }}>
        {it.legs.map((g, i) => (
          <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            {i > 0 && <Icon name="chevron" color={C.muted} size={12} />}
            {g.kind === 'walk'
              ? <View style={{ flexDirection: 'row', alignItems: 'center' }}><Icon name="walk" color={C.ink2} size={16} /><Text style={T.small}>{g.minutes}</Text></View>
              : <Badge kind={g.kind} label={lineName(g)} color={g.color} textColor={g.textColor} />}
          </View>
        ))}
      </View>
      {active && (
        <View style={{ gap: 8, borderTopWidth: 1, borderColor: C.border, paddingTop: 8 }}>
          {it.legs.map((g, i) => {
            const next = it.legs.slice(i + 1).find((x) => x.kind !== 'walk');
            const isEnd = g.to.name === 'END' || !g.to.name;
            const b = g.kind === 'walk' ? null : boardText(g, lang);
            return (
              <View key={i} style={{ flexDirection: 'row', gap: 10 }}>
                {!it.approx && <Text style={[T.small, { width: 46 }]}>{hhmm(g.from.time, lang)}</Text>}
                <View style={{ width: 4, borderRadius: 2, backgroundColor: g.kind === 'walk' ? C.border : g.color ?? KIND[g.kind].color }} />
                <View style={{ flex: 1, gap: 2 }}>
                  {g.kind === 'walk' ? (
                    <>
                      <Text style={[T.body, { fontWeight: '600' }]}>{walkText(isEnd ? undefined : next, nm(g.to.name), lang)}</Text>
                      <Text style={T.small}>{minText(g.minutes, lang)}{g.meters ? ` · ${fmtDist(g.meters, lang)}` : ''}</Text>
                    </>
                  ) : (
                    <>
                      <Text style={[T.body, { fontWeight: '700' }]}>{b?.head}{b?.dir ? <Text style={{ fontWeight: '500', color: C.muted }}> ({b.dir})</Text> : null}</Text>
                      <Text style={T.small}>{tidyName(nm(g.from.name), lang)} → {tidyName(nm(g.to.name), lang)} · {stopsText(g.stops + 1, lang)} · {it.approx ? '≈ ' : ''}{minText(g.minutes, lang)}{g.agency ? ` · ${g.agency}` : ''}</Text>
                      <Text style={[T.small, { color: C.ink2, fontWeight: '600' }]}>{alightText(g, lang)}</Text>
                    </>
                  )}
                </View>
              </View>
            );
          })}
        </View>
      )}
    </Pressable>
  );
}
