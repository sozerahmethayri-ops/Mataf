// Ana haritanın (2D) katmanları: otelim, camiler, hastane ve eczaneler, hac yerleri (Arafat, Müzdelife, Mina,
// cemreler) ve Harem sınırı. Seçim cihazda saklanır; veriler ancak katman açılınca yüklenir.
import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { Icon, type IconName } from '@/components/Icon';
import type { PlainArea, PlainPin } from '@/components/PlainMap';
import { Toggle } from '@/components/ui';
import { C, fs, shadow } from '@/constants/theme';
import { ARAFAT_AREA, HAC_PLACES, HARAM_BOUNDARY, MINA_AREA, NAMIRA_MOSQUE, type LL2 } from '@/data/osm/hacSites';
import type { T3 } from '@/data/umre';
import { pick } from '@/i18n';
import { useHotel } from '@/services/hotel';
import { useMyPlaces } from '@/services/myPlaces';
import { findMosques, type Mosque } from '@/services/mosques';
import { nearbyPois, type Poi } from '@/services/osm';
import { usePersisted } from '@/services/usePersisted';

type Lang = 'tr' | 'en' | 'ar';
type City = 'makkah' | 'madinah';
export type LayerId = 'hotel' | 'mosque' | 'health' | 'hac' | 'haram';
export type Layers = Record<LayerId, boolean>;

const LAYERS: { id: LayerId; icon: IconName; label: T3; color: string; makkahOnly?: boolean }[] = [
  { id: 'hotel', icon: 'hotel', label: { tr: 'Otelim ve yerlerim', en: 'My hotel and places', ar: 'فندقي وأماكني' }, color: '#C2410C' },
  { id: 'mosque', icon: 'pin', label: { tr: 'Camiler', en: 'Mosques', ar: 'المساجد' }, color: '#277F4C' },
  { id: 'health', icon: 'aid', label: { tr: 'Hastane ve eczane', en: 'Hospitals and pharmacies', ar: 'مستشفيات وصيدليات' }, color: '#DC2626' },
  { id: 'hac', icon: 'sun', label: { tr: 'Hac yerleri', en: 'Hajj sites', ar: 'المشاعر' }, color: '#0E7490', makkahOnly: true },
  { id: 'haram', icon: 'shield', label: { tr: 'Harem sınırı', en: 'Haram boundary', ar: 'حدود الحرم' }, color: '#DC2626', makkahOnly: true },
];

const L = {
  title: { tr: 'Katmanlar', en: 'Layers', ar: 'الطبقات' },
  noHotel: { tr: 'Otel kaydı yok · Otelime dön’den ekleyin', en: 'No hotel saved · add it in Back to my hotel', ar: 'لا فندق محفوظ' },
  myHotel: { tr: 'Otelim', en: 'My hotel', ar: 'فندقي' },
  pharmacy: { tr: 'Eczane', en: 'Pharmacy', ar: 'صيدلية' },
  hospital: { tr: 'Hastane', en: 'Hospital', ar: 'مستشفى' },
  mosque: { tr: 'Mescit', en: 'Mosque', ar: 'مسجد' },
} satisfies Record<string, T3>;

const ll = (p: LL2) => ({ lat: p[0], lng: p[1] });

/** Açık katmanların noktaları ve alanları; dokunulan katman noktasının açılacak ekranı. */
export function useMapLayers(city: City, origin: { lat: number; lng: number }, lg: Lang) {
  const [layers, setLayers] = usePersisted<Layers>('map:layers', { hotel: true, mosque: false, health: false, hac: false, haram: false });
  const { hotel } = useHotel(city);
  const { places } = useMyPlaces();
  const [mosques, setMosques] = useState<{ key: string; list: Mosque[] } | null>(null);
  const [pois, setPois] = useState<{ key: string; list: Poi[] } | null>(null);
  // Kaynak noktası ~500 m kayınca yeniden yükle
  const key = `${city}:${origin.lat.toFixed(2)},${origin.lng.toFixed(2)}`;

  useEffect(() => {
    if (!layers.mosque || mosques?.key === key) return;
    let alive = true;
    findMosques(origin, lg).then((r) => alive && setMosques({ key, list: r.mosques.slice(0, 40) })).catch(() => undefined);
    return () => { alive = false; };
  }, [layers.mosque, key]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!layers.health || pois?.key === key) return;
    let alive = true;
    nearbyPois(origin.lat, origin.lng, 2500)
      .then((r) => alive && setPois({ key, list: r.filter((p) => p.cat === 'hospital' || p.cat === 'pharmacy') }))
      .catch(() => undefined);
    return () => { alive = false; };
  }, [layers.health, key]); // eslint-disable-line react-hooks/exhaustive-deps

  const makkah = city === 'makkah';
  const pins = useMemo<PlainPin[]>(() => {
    const out: PlainPin[] = [];
    if (layers.hotel && hotel) out.push({ id: 'L:hotel', lat: hotel.lat, lng: hotel.lng, color: '#C2410C', label: hotel.name || pick(L.myHotel, lg), big: true });
    if (layers.hotel) for (const p of places) out.push({ id: `L:yer-${p.id}`, lat: p.lat, lng: p.lng, color: '#0E7490', label: p.name });
    if (layers.mosque && mosques) for (const m of mosques.list) out.push({ id: `L:m:${m.id}`, lat: m.lat, lng: m.lng, color: '#277F4C', label: m.name || pick(L.mosque, lg) });
    if (layers.health && pois) for (const p of pois.list) out.push({ id: `L:p:${p.id}`, lat: p.lat, lng: p.lng, color: p.cat === 'hospital' ? '#DC2626' : '#DB2777', label: p.name || pick(p.cat === 'hospital' ? L.hospital : L.pharmacy, lg) });
    if (makkah && layers.hac) {
      for (const p of HAC_PLACES) if (p.kind !== 'hospital' && p.kind !== 'station') out.push({ id: `L:hac:${p.id}`, lat: p.lat, lng: p.lng, color: '#0E7490', label: pick(p.name, lg), big: p.kind === 'area' });
    }
    return out;
  }, [layers, hotel, places, mosques, pois, makkah, lg]);

  const areas = useMemo<PlainArea[]>(() => {
    const out: PlainArea[] = [];
    if (makkah && layers.haram) out.push({ coords: HARAM_BOUNDARY.map(ll), color: '#DC2626', opacity: 0, dashed: true });
    if (makkah && layers.hac) {
      out.push({ coords: ARAFAT_AREA.map(ll), color: '#16A34A', opacity: 0.16 });
      out.push({ coords: MINA_AREA.map(ll), color: '#2563EB', opacity: 0.1 });
      out.push({ coords: NAMIRA_MOSQUE.map(ll), color: '#EA580C', opacity: 0.35 });
    }
    return out;
  }, [layers.haram, layers.hac, makkah]);

  /** Katman noktasına ikinci dokunuşta açılacak ekran */
  const open = (id: string) => {
    if (id === 'L:hotel') router.push('/otel');
    else if (id.startsWith('L:yer-')) router.push({ pathname: '/yerlerim', params: { id: id.slice(6) } });
    else if (id.startsWith('L:m:')) router.push('/cami');
    else if (id.startsWith('L:hac:')) router.push('/hac-harita');
    else if (id.startsWith('L:p:')) router.push('/acil');
  };
  const available = LAYERS.filter((x) => !x.makkahOnly || makkah);
  return { layers, setLayers, pins, areas, open, available, hasHotel: !!hotel };
}

export function LayersPanel({ lg, layers, onChange, available, hasHotel, onClose }: {
  lg: Lang; layers: Layers; onChange: (l: Layers) => void; available: typeof LAYERS; hasHotel: boolean; onClose: () => void;
}) {
  return (
    <View style={[{ width: 270, padding: 12, borderRadius: 18, backgroundColor: C.bg, gap: 4 }, shadow]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
        <Text style={{ flex: 1, fontSize: fs(15), fontWeight: '800', color: C.ink }}>{pick(L.title, lg)}</Text>
        <Pressable onPress={onClose} hitSlop={10} accessibilityRole="button" accessibilityLabel="Kapat"><Icon name="close" size={18} color={C.muted} /></Pressable>
      </View>
      {available.map((x) => (
        <View key={x.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 44 }}>
          <View style={{ width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: `${x.color}22` }}>
            <Icon name={x.icon} size={16} color={x.color} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: fs(14), fontWeight: '600', color: C.ink }}>{pick(x.label, lg)}</Text>
            {x.id === 'hotel' && !hasHotel && <Text style={{ fontSize: fs(11.5), color: C.muted }}>{pick(L.noHotel, lg)}</Text>}
          </View>
          <Toggle value={layers[x.id]} onChange={(v) => onChange({ ...layers, [x.id]: v })} label={pick(x.label, lg)} />
        </View>
      ))}
    </View>
  );
}
