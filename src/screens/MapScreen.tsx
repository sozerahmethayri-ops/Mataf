import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Linking, Pressable, ScrollView, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HaramScene } from '@/components/HaramScene';
import { OnlineMap } from '@/components/OnlineMap';
import { Icon } from '@/components/Icon';
import { LayersPanel, useMapLayers } from '@/components/MapLayers';
import { Btn, Chip, IconBtn, T } from '@/components/ui';
import { C, shadow, fs } from '@/constants/theme';
import { RAWDAH } from '@/data/content';
import { DESTINATIONS, GATES, dist, toLatLng, type Pt } from '@/data/sites';
import { pick, useI18n } from '@/i18n';
import { useApp } from '@/services/AppContext';
import { kmTo, localPosition, useLocation } from '@/services/location';
import { useReports } from '@/services/ReportsContext';
import { useTheme } from '@/services/ThemeContext';
import { planRoute } from '@/services/routing';
import { MADINAH_CORE } from '@/scene/madinah';
import { Cam } from '@/scene/oblique';
import { MAKKAH_CORE } from '@/scene/makkah';

export default function MapScreen() {
  const { t, lang } = useI18n();
  const insets = useSafeAreaInsets();
  const { city, setCity, destId, setDestId } = useApp();
  const { summaries, statusOf } = useReports();
  const { fix, denied } = useLocation();
  const [preview, setPreview] = useState(false);
  const [size, setSize] = useState({ w: 390, h: 600 });
  const [zoom, setZoom] = useState(1);
  const [rot, setRot] = useState(-35); // harita dönüşü (°, saat yönü); 0 = kuzey yukarı
  const turn = (d: number) => setRot((r) => normRot(r + d));
  const [recenter, setRecenter] = useState(0);
  const [sheetH, setSheetH] = useState(150);
  const { prefs } = useTheme();
  // 3D: Harem'in kendi çizimimiz; 2D: gerçek OSM haritası (Baki, sokaklar, oteller dahil her ayrıntı)
  const [is3d, setIs3d] = useState(prefs.map3d);

  const { pos: user, demo } = localPosition(city, fix);
  const [layersOpen, setLayersOpen] = useState(false);
  const [selLayer, setSelLayer] = useState<string | undefined>(undefined);
  const km = fix && demo ? kmTo(city, fix) : null;
  const dest = DESTINATIONS.find((d) => d.id === destId && d.city === city) ?? DESTINATIONS.find((d) => d.city === city)!;
  // Mescitte değilken rota yalnız "Örnek rota" ile (örnek başlangıçtan) gösterilir
  const showRoute = !demo || preview;
  const planned = useMemo(() => planRoute(city, user, dest.id, statusOf), [city, user[0], user[1], dest.id, statusOf]); // eslint-disable-line react-hooks/exhaustive-deps
  const plan = showRoute ? planned : null;
  const cityName = city === 'makkah' ? (lang === 'en' ? 'Makkah' : lang === 'ar' ? 'مكة' : 'Mekke') : lang === 'en' ? 'Madinah' : lang === 'ar' ? 'المدينة' : 'Medine';
  const awayText = denied ? (lang === 'en' ? 'No location permission' : lang === 'ar' ? 'لا إذن للموقع' : 'Konum izni yok')
    : km == null ? (lang === 'en' ? 'Getting your location…' : lang === 'ar' ? 'جارٍ تحديد موقعك…' : 'Konumunuz alınıyor…')
      : lang === 'en' ? `You are ${Math.round(km).toLocaleString('en')} km from ${cityName}` : lang === 'ar' ? `أنت على بعد ${Math.round(km)} كم من ${cityName}` : `${cityName}’ye ${Math.round(km).toLocaleString('tr')} km uzaktasınız`;

  const closed = GATES.filter((g) => g.city === city && summaries[g.id]?.status === 'closed')
    .sort((a, b) => dist(a.pos, user) - dist(b.pos, user))[0];
  const nearestGate = GATES.filter((g) => g.city === city).sort((a, b) => dist(a.pos, user) - dist(b.pos, user))[0];
  // Üstteki arama + çipler ve alttaki panel haritayı kaplar; harita kalan alana sığdırılır.
  const topH = insets.top + 8 + 52 + 10 + 40 + 6;
  const ctrl = { w: 44, h: 44 + 8 + 44 * 2 + 1 + 8 + 44, right: 12, bottom: sheetH + 12 };
  // Döndürme: sol altta ↺ pusula ↻ (ölçek çubuğunun üstünde)
  const rotBar = { w: 44 * 3 + 8, h: 44, left: 12, bottom: sheetH + 58 };
  const ll = (p: Pt) => { const q = toLatLng(city, p); return { lat: q.latitude, lng: q.longitude }; };
  const mapUser = showRoute ? (demo ? ll(user) : fix ? { lat: fix.lat, lng: fix.lng } : null) : null;
  // Katman verisi kullanıcının yakınından (şehirdeyse), değilse mescidin çevresinden
  const layerOrigin = fix && !demo ? { lat: fix.lat, lng: fix.lng } : ll([0, 0]);
  const lyr = useMapLayers(city, layerOrigin, lang as 'tr' | 'en' | 'ar');
  const basePins = [
    ...GATES.filter((g) => g.city === city).map((g) => {
      const s = summaries[g.id]?.status ?? 'open';
      const isRoute = g.id === plan?.gate?.id;
      return { id: `g:${g.id}`, ...ll(g.pos), color: isRoute ? C.accent : s === 'closed' ? C.closed : s === 'open' ? C.open : C.limited, label: isRoute ? `${pick(g.name, lang)} (${g.no})` : undefined, big: isRoute, minor: !g.main && !isRoute, num: g.main ? undefined : g.no.split('–')[0] };
    }),
    { id: 'dest', ...ll(dest.pos), color: C.route, label: t(dest.label).split(' · ')[0], big: true },
  ];
  const pins2d = [...lyr.pins, ...basePins];
  // Çerçeve: kapılar + hedef (katman noktaları çerçeveyi değiştirmez); hac yerleri açılınca onlar da
  const hacFit = city === 'makkah' && lyr.layers.hac;
  const routePts = plan?.points && plan.points.length > 1 ? plan.points.map(ll) : [];
  const fitTo = [...basePins, ...routePts, ...(hacFit ? lyr.pins.filter((p) => p.id.startsWith('L:hac:')) : [])];
  // Bakî seçiliyse mezarlığın batı yarısı da çerçeveye girsin (yalnız giriş kapısı değil)
  // Geniş görünüm (0.22.0): Mekke'de Saat Kulesi'nin eteği, Medine'de Bakî'nin batı yarısı da çerçevede
  const wide: Pt[] = city === 'makkah' ? [[-66, 430]] : [[340, -70], [340, 130]];
  const fit = [...(city === 'makkah' ? MAKKAH_CORE : MADINAH_CORE), ...wide, ...(plan?.points ?? []), dest.pos];

  return (
    <View style={{ flex: 1, backgroundColor: C.mapGround }} onLayout={(e) => setSize({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}>
      {is3d ? (
        <HaramScene
          city={city}
          width={size.w}
          height={size.h}
          zoom={zoom}
          fit={fit}
          viewport={{ top: topH, bottom: sheetH, left: 0, right: 0 }}
          avoid={[{ x: size.w - ctrl.right - ctrl.w, y: size.h - ctrl.bottom - ctrl.h, w: ctrl.w, h: ctrl.h }, { x: rotBar.left, y: size.h - rotBar.bottom - rotBar.h, w: rotBar.w, h: rotBar.h }]}
          recenterKey={recenter}
          rotDeg={rot}
          onTransform={(sc, dr) => { setZoom((z) => Math.min(8, Math.max(0.35, z * sc))); turn(dr); }}
          route={plan?.points}
          user={showRoute ? user : undefined}
          dest={dest.pos}
          destLabel={t(dest.label).split(' · ')[0]}
          summaries={summaries}
          routeGateId={plan?.gate?.id}
          onGatePress={(id) => router.push({ pathname: '/kapi/[id]', params: { id } })}
        />
      ) : (
        <OnlineMap
          pins={pins2d}
          lines={plan?.points && plan.points.length > 1 ? [{ coords: plan.points.map(ll), color: C.route, width: 6 }] : []}
          user={mapUser}
          center={ll([0, 0])}
          padding={{ top: topH, bottom: sheetH, left: 16, right: 64 }}
          fitKey={`${city}:${dest.id}:${showRoute ? 1 : 0}:${hacFit ? 'hac' : ''}`}
          fitTo={fitTo}
          recenterKey={recenter}
          controls={false}
          threeD={false}
          areas={lyr.areas}
          selectedId={selLayer}
          onPin={(id) => {
            if (id.startsWith('g:')) router.push({ pathname: '/kapi/[id]', params: { id: id.slice(2) } });
            else if (id.startsWith('L:')) { if (selLayer === id) lyr.open(id); else setSelLayer(id); }
          }}
        />
      )}

      <View style={{ position: 'absolute', left: 16, right: 16, top: insets.top + 8, gap: 10 }}>
        <View style={[{ flexDirection: 'row', alignItems: 'center', gap: 10, height: 52, paddingLeft: 16, paddingRight: 6, borderRadius: 26, backgroundColor: C.bg }, shadow]}>
          <Icon name="search" color={C.muted} />
          <Pressable style={{ flex: 1, height: 44, justifyContent: 'center' }} onPress={() => router.push('/arama')} accessibilityRole="search">
            <Text style={{ fontSize: fs(15), color: C.muted }} numberOfLines={1}>{t('map.search')}</Text>
          </Pressable>
          <Pressable onPress={() => router.push('/cami')} accessibilityRole="button" accessibilityLabel={lang === 'en' ? 'Nearest mosque' : lang === 'ar' ? 'أقرب مسجد' : 'En yakın cami'}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 5, height: 40, paddingHorizontal: 12, borderRadius: 20, backgroundColor: C.green }}>
            <Icon name="pin" size={16} color="#FFFFFF" />
            <Text style={{ fontSize: fs(13), fontWeight: '700', color: '#FFFFFF' }}>{lang === 'en' ? 'Mosque' : lang === 'ar' ? 'مسجد' : 'Cami'}</Text>
          </Pressable>
          <IconBtn name="settings" label={t('settings.title')} tint={C.accentTint} color={C.accent} size={40} onPress={() => router.push('/ayarlar')} />
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, alignItems: 'center' }}>
          <View style={[{ flexDirection: 'row', padding: 3, borderRadius: 20, backgroundColor: C.bg }, shadow]}>
            {(['makkah', 'madinah'] as const).map((c) => (
              <Pressable key={c} onPress={() => setCity(c)} accessibilityRole="button" accessibilityState={{ selected: city === c }}
                style={{ height: 34, paddingHorizontal: 12, borderRadius: 17, justifyContent: 'center', backgroundColor: city === c ? C.ink : 'transparent' }}>
                <Text style={{ fontSize: fs(13), fontWeight: city === c ? '700' : '500', color: city === c ? C.onInk : C.muted }}>{t(c === 'makkah' ? 'city.makkah' : 'city.madinah')}</Text>
              </Pressable>
            ))}
          </View>
          {DESTINATIONS.filter((d) => d.city === city).map((d) => (
            <Chip key={d.id} label={t(d.label).split(' · ')[0]} active={d.id === dest.id} onPress={() => setDestId(d.id)} />
          ))}
          <Chip label={t('tab.gates')} dot={C.closed} onPress={() => router.push('/kapilar')} />
          {city === 'makkah' && <Chip label={lang === 'en' ? 'Tawaf assistant' : lang === 'ar' ? 'مساعد الطواف' : 'Tavaf asistanı'} dot={C.route} onPress={() => router.push('/tavaf')} />}
          <Chip label={t('map.city')} onPress={() => router.push('/sehir')} />
          {city === 'madinah' && <Chip label="Ravza" onPress={() => router.push('/ravza')} />}
          {city === 'madinah' && <Chip label="360°" onPress={() => Linking.openURL(RAWDAH.tourUrl)} />}
          {city === 'madinah' && <Chip label={t('guide.title')} onPress={() => router.push('/medine-rehber')} />}
        </ScrollView>
      </View>

      <View style={{ position: 'absolute', right: ctrl.right, bottom: ctrl.bottom, gap: 8, alignItems: 'center' }}>
        <Pressable onPress={() => setIs3d((v) => !v)} accessibilityRole="button"
          accessibilityLabel={is3d ? (lang === 'en' ? 'Real map (2D)' : lang === 'ar' ? 'خريطة حقيقية' : 'Gerçek harita (2D)') : (lang === 'en' ? '3D view' : lang === 'ar' ? 'عرض ثلاثي الأبعاد' : '3D görünüm')}
          style={[{ width: 44, height: 44, borderRadius: 22, backgroundColor: C.ink, alignItems: 'center', justifyContent: 'center' }, shadow]}>
          <Text style={{ fontSize: fs(13), fontWeight: '800', color: C.onInk }}>{is3d ? '2D' : '3D'}</Text>
        </Pressable>
        {is3d && (
        <View style={[{ width: ctrl.w, borderRadius: ctrl.w / 2, backgroundColor: C.bg, overflow: 'hidden' }, shadow]}>
          <IconBtn name="plus" label={t('map.zoomIn')} tint={C.bg} onPress={() => setZoom((z) => Math.min(8, z * 1.4))} />
          <View style={{ height: 1, marginHorizontal: 10, backgroundColor: C.border }} />
          <IconBtn name="minus" label={t('map.zoomOut')} tint={C.bg} onPress={() => setZoom((z) => Math.max(0.35, z / 1.4))} />
        </View>
        )}
        {!is3d && (
          <IconBtn name="layers" label={lang === 'en' ? 'Layers' : lang === 'ar' ? 'الطبقات' : 'Katmanlar'} tint={layersOpen ? C.ink : C.bg} color={layersOpen ? C.onInk : C.ink} elevated onPress={() => setLayersOpen((v) => !v)} />
        )}
        <IconBtn name="locate" label={t('map.recenter')} tint={C.bg} color={C.user} elevated onPress={() => { setZoom(1); setRecenter((n) => n + 1); }} />
      </View>
      {is3d && (
        <View style={[{ position: 'absolute', left: rotBar.left, bottom: rotBar.bottom, flexDirection: 'row', alignItems: 'center', gap: 4, padding: 0, borderRadius: 22, backgroundColor: C.bg }, shadow]}>
          <IconBtn name="rotl" label={lang === 'en' ? 'Rotate left' : lang === 'ar' ? 'تدوير لليسار' : 'Sola döndür'} tint={C.bg} onPress={() => turn(-45)} />
          <CompassBtn rot={rot} label={lang === 'en' ? 'North up' : lang === 'ar' ? 'الشمال للأعلى' : 'Kuzeyi yukarı al'}
            onPress={() => setRot((r) => (Math.abs(normRot(r)) < 1 ? -35 : 0))} />
          <IconBtn name="rotr" label={lang === 'en' ? 'Rotate right' : lang === 'ar' ? 'تدوير لليمين' : 'Sağa döndür'} tint={C.bg} onPress={() => turn(45)} />
        </View>
      )}
      {!is3d && layersOpen && (
        <View style={{ position: 'absolute', right: ctrl.right + ctrl.w + 8, bottom: ctrl.bottom }}>
          <LayersPanel lg={lang as 'tr' | 'en' | 'ar'} layers={lyr.layers} onChange={lyr.setLayers} available={lyr.available} hasHotel={lyr.hasHotel} onClose={() => setLayersOpen(false)} />
        </View>
      )}

      <View onLayout={(e) => setSheetH(Math.round(e.nativeEvent.layout.height))}
        style={[{ position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: C.bg, borderTopLeftRadius: 22, borderTopRightRadius: 22, paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12, gap: 10 }, shadow]}>
        <View style={{ alignSelf: 'center', width: 36, height: 4, borderRadius: 2, backgroundColor: C.borderStrong }} />
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={T.h2} numberOfLines={1}>{t(dest.label)}</Text>
            <Text style={T.muted} numberOfLines={1}>{demo && !preview ? awayText : plan?.gate ? `${demo ? (lang === 'en' ? 'Sample · ' : lang === 'ar' ? 'مثال · ' : 'Örnek · ') : ''}${t('map.via', { gate: `${pick(plan.gate.name, lang)} (${plan.gate.no})` })}` : ' '}</Text>
          </View>
          {plan && (
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={{ fontSize: fs(20), fontWeight: '700', color: C.accent }}>{plan.minutes} {t('common.min')}</Text>
              <Text style={T.small}>{Math.round(plan.lengthM / 10) * 10} m</Text>
            </View>
          )}
        </View>
        {closed && (
          <Pressable onPress={() => router.push({ pathname: '/kapi/[id]', params: { id: closed.id } })} accessibilityRole="button"
            style={{ flexDirection: 'row', alignItems: 'center', gap: 8, height: 40, paddingHorizontal: 10, borderRadius: 12, backgroundColor: C.closedTint }}>
            <Icon name="alert" color={C.closed} size={18} />
            <Text numberOfLines={1} style={{ flex: 1, fontSize: fs(13), fontWeight: '700', color: C.closed }}>{t('map.closedAlert', { gate: `${pick(closed.name, lang)} (${closed.no})` })}</Text>
            <Text style={T.small}>{t('map.confirmations', { n: summaries[closed.id]?.confirmations ?? 0 })}</Text>
            <Icon name="chevron" color={C.muted} size={16} />
          </Pressable>
        )}
        {demo && !preview ? (
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Btn title={lang === 'en' ? 'Sample route' : lang === 'ar' ? 'مسار تجريبي' : 'Örnek rota'} icon="nav" kind="secondary" style={{ flex: 1 }} onPress={() => setPreview(true)} />
            <Btn title={lang === 'en' ? 'Get there' : lang === 'ar' ? 'كيف أصل' : 'Nasıl giderim'} icon="bus" style={{ flex: 1 }} onPress={() => router.push({ pathname: '/ulasim', params: city === 'makkah'
              ? { to: '21.4225,39.8262', name: lang === 'en' ? 'Masjid al-Haram' : lang === 'ar' ? 'المسجد الحرام' : 'Mescid-i Haram' }
              : { to: '24.4672,39.6111', name: lang === 'en' ? 'Prophet’s Mosque' : lang === 'ar' ? 'المسجد النبوي' : 'Mescid-i Nebevî' } })} />
          </View>
        ) : (
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Btn title={t('map.start')} icon="nav" style={{ flex: 1 }} onPress={() => router.push('/navigasyon')} disabled={!plan} />
          <Btn title={t('map.report')} kind="secondary" onPress={() => router.push({ pathname: '/bildir', params: { gate: nearestGate.id } })} />
        </View>
        )}
      </View>
    </View>
  );
}

/** Dönüşü -180…180 aralığına getirir (sahne önbelleği aynı açıyı tek anahtarla tutsun) */
const normRot = (r: number) => ((((Math.round(r) + 180) % 360) + 360) % 360) - 180;

/** Pusula: iğne haritadaki kuzeyi gösterir; dokununca kuzey yukarı / eğik görünüm arasında geçer. */
function CompassBtn({ rot, label, onPress }: { rot: number; label: string; onPress: () => void }) {
  // Kuzeyin ekrandaki yönü: plan rot° döner, eğik izdüşüm derinliği SA kadar basar
  const c = new Cam(1, 0, 0, rot);
  const [x0, y0] = c.P(0, 0);
  const [x1, y1] = c.P(0, -100);
  const deg = (Math.atan2(x1 - x0, -(y1 - y0)) * 180) / Math.PI;
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={label}
      style={[{ width: 44, height: 44, borderRadius: 22, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center' }, shadow]}>
      <View style={{ transform: [{ rotate: `${Math.round(deg)}deg` }], alignItems: 'center' }}>
        <Svg width={16} height={30} viewBox="0 0 16 30">
          <Path d="M8 1 L14 15 L2 15 Z" fill={C.closed} />
          <Path d="M8 29 L14 15 L2 15 Z" fill={C.muted} />
        </Svg>
      </View>
    </Pressable>
  );
}
