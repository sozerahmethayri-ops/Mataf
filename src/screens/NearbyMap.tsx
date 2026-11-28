// Harita sekmesinin "Konumum" görünümü (0.24.0): Mekke ve Medine dışındayken bulunduğunuz yerin gerçek haritası,
// yakındaki camiler ve en yakın camiye uygulama içinde yol tarifi. Mekke ve Medine üstteki seçiciden açılır.
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';

import { OnlineMap } from '@/components/OnlineMap';
import { Btn, T } from '@/components/ui';
import { C, fs, shadow } from '@/constants/theme';
import { pick, useI18n } from '@/i18n';
import type { Fix } from '@/services/location';
import { searchMosques } from '@/services/mosqueStore';
import { distanceM, fmtDistance, relocate, walkMinutes, type Mosque, type SearchResult } from '@/services/mosques';

const L = {
  locating: { tr: 'Konumunuz alınıyor…', en: 'Getting your location…', ar: 'جارٍ تحديد موقعك…' },
  denied: { tr: 'Konum izni yok. Haritayı Mekke ya da Medine için yukarıdan açabilirsiniz.', en: 'No location permission. You can open Makkah or Madinah above.', ar: 'لا إذن للموقع. يمكنك فتح مكة أو المدينة من الأعلى.' },
  searching: { tr: 'Yakındaki camiler aranıyor…', en: 'Finding nearby mosques…', ar: 'جارٍ البحث عن المساجد القريبة…' },
  none: { tr: 'Yakında cami bulunamadı', en: 'No mosque found nearby', ar: 'لم يُعثر على مسجد قريب' },
  failed: { tr: 'Camiler yüklenemedi (internet?)', en: 'Could not load mosques (internet?)', ar: 'تعذّر تحميل المساجد (الإنترنت؟)' },
  nearest: { tr: 'En yakın cami', en: 'Nearest mosque', ar: 'أقرب مسجد' },
  chosen: { tr: 'Seçili cami', en: 'Selected mosque', ar: 'المسجد المختار' },
  walk: { tr: '~{n} dk yürüme', en: '~{n} min walk', ar: '~{n} د سيرًا' },
  route: { tr: 'Yol tarifi', en: 'Directions', ar: 'الاتجاهات' },
  all: { tr: 'Tüm camiler', en: 'All mosques', ar: 'كل المساجد' },
  unnamed: { tr: 'Cami', en: 'Mosque', ar: 'مسجد' },
};

export function NearbyMap({ fix, denied, top }: { fix: Fix | null; denied: boolean; top: number }) {
  const { lang } = useI18n();
  const lg = lang as 'tr' | 'en' | 'ar';
  const [res, setRes] = useState<SearchResult | null>(null);
  const [failed, setFailed] = useState(false);
  const [sel, setSel] = useState<string | undefined>(undefined);
  const [sheetH, setSheetH] = useState(170);
  const searchedAt = useRef<{ lat: number; lng: number } | null>(null);
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => { alive.current = false; };
  }, []);
  // Camiler bir kez, 800 m'den fazla uzaklaşınca yeniden aranır (Photon; önbellekli)
  useEffect(() => {
    if (!fix) return;
    if (searchedAt.current && distanceM(searchedAt.current, fix) < 800) return;
    const o = { lat: fix.lat, lng: fix.lng };
    searchedAt.current = o;
    searchMosques(o, lg)
      .then((r) => { if (alive.current) { setRes(r); setFailed(false); } })
      .catch(() => { if (alive.current) setFailed(true); });
  }, [fix?.lat, fix?.lng, lg]); // eslint-disable-line react-hooks/exhaustive-deps

  const list: Mosque[] = res && fix ? relocate(res.mosques, fix).slice(0, 30) : [];
  const chosen = list.find((m) => m.id === sel) ?? list[0];
  const nameOf = (m: Mosque) => m.name || pick(L.unnamed, lang);
  const pins = list.map((m) => ({ id: m.id, lat: m.lat, lng: m.lng, color: C.green, label: m.id === chosen?.id ? nameOf(m) : undefined, big: m.id === chosen?.id }));
  const user = fix ? { lat: fix.lat, lng: fix.lng } : null;
  const fitTo = [...(user ? [user] : []), ...list.slice(0, 4).map((m) => ({ lat: m.lat, lng: m.lng }))];

  return (
    <View style={{ flex: 1 }}>
      <OnlineMap
        pins={pins}
        user={user}
        center={user ?? { lat: 21.4225, lng: 39.8262 }}
        selectedId={chosen?.id}
        fitTo={fitTo}
        fitKey={`${res?.at ?? 0}:${list.length}`}
        padding={{ top: top + 6, bottom: sheetH, left: 16, right: 16 }}
        threeD={false}
        onPin={(id) => setSel(id)}
      />
      <View onLayout={(e) => setSheetH(Math.round(e.nativeEvent.layout.height))}
        style={[{ position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: C.bg, borderTopLeftRadius: 22, borderTopRightRadius: 22, paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12, gap: 10 }, shadow]}>
        <View style={{ alignSelf: 'center', width: 36, height: 4, borderRadius: 2, backgroundColor: C.borderStrong }} />
        {!fix ? (
          <Text style={T.body}>{pick(denied ? L.denied : L.locating, lang)}</Text>
        ) : !res && !failed ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 44 }}>
            <ActivityIndicator color={C.accent} />
            <Text style={T.body}>{pick(L.searching, lang)}</Text>
          </View>
        ) : !chosen ? (
          <Text style={T.body}>{pick(failed ? L.failed : L.none, lang)}</Text>
        ) : (
          <>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={T.small}>{pick(chosen.id === list[0]?.id ? L.nearest : L.chosen, lang)}</Text>
                <Text style={T.h2} numberOfLines={1}>{nameOf(chosen)}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={{ fontSize: fs(20), fontWeight: '700', color: C.green }}>{fmtDistance(chosen.dist, lg)}</Text>
                <Text style={T.small}>{pick(L.walk, lang).replace('{n}', String(walkMinutes(chosen.dist)))}</Text>
              </View>
            </View>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <Btn title={pick(L.route, lang)} icon="nav" style={{ flex: 1 }}
                onPress={() => router.push({ pathname: '/ulasim', params: { to: `${chosen.lat.toFixed(6)},${chosen.lng.toFixed(6)}`, name: nameOf(chosen) } })} />
              <Btn title={pick(L.all, lang)} kind="secondary" onPress={() => router.push('/cami')} />
            </View>
          </>
        )}
      </View>
    </View>
  );
}
