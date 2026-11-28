// Uygulama içi online harita (telefon): MapLibre GL + OpenFreeMap (OSM). Binalar, mezarlıklar, yollar ve yer adları
// gerçek veriden gelir; 2D/3D düğmesi binaları yükseltip haritayı eğer. Harita yüklenemezse (internet yok, WebGL yok)
// sade haritaya (PlainMap) geçer — ekran hiçbir zaman boş kalmaz.
import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState, type ComponentType, type Ref } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { WebView as RNWebView, type WebViewMessageEvent, type WebViewProps } from 'react-native-webview';

import { C, fs, shadow } from '@/constants/theme';
import { pick, useI18n } from '@/i18n';
import { logError } from '@/services/errorLog';
import { loadMapLib, mapLibNow } from '@/services/mapLib';
import { offlineMapConfig, readMapFile } from '@/services/offline';
import { resolveMataf } from '@/services/offlineMath';
import { useTheme } from '@/services/ThemeContext';
import { Icon } from './Icon';
import { onlineMapHtml } from './onlineMapHtml';
import { PlainMap, type PlainLL } from './PlainMap';
import type { OnlineMapProps } from './OnlineMap.types';

export type { OnlineMapProps };

const L = {
  failed: { tr: 'Harita yüklenemedi · tekrar dene', en: 'Map did not load · try again', ar: 'لم تُحمَّل الخريطة · أعد المحاولة' },
  loading: { tr: 'Harita yükleniyor…', en: 'Loading map…', ar: 'جارٍ تحميل الخريطة…' },
  to2d: { tr: '2B görünüm', en: '2D view', ar: 'عرض ثنائي الأبعاد' },
  to3d: { tr: '3B görünüm', en: '3D view', ar: 'عرض ثلاثي الأبعاد' },
  me: { tr: 'Konumuma git', en: 'Go to my location', ar: 'اذهب إلى موقعي' },
  zin: { tr: 'Yakınlaştır', en: 'Zoom in', ar: 'تكبير' },
  zout: { tr: 'Uzaklaştır', en: 'Zoom out', ar: 'تصغير' },
};

// Paketin sınıf tipi (WebView<P = undefined>) yeni TypeScript'te `never` props'a düşüyor; kullandığımız kısmı yazıyoruz.
type WebViewHandle = { injectJavaScript: (js: string) => void };
const WebView = RNWebView as unknown as ComponentType<WebViewProps & { ref?: Ref<WebViewHandle> }>;

export function OnlineMap(props: OnlineMapProps) {
  const { pins, lines = [], areas = [], fitTo, user, selectedId, onPin, onLongPress, center, padding, fitUser, controls = true, zoomLevel = 0 } = props;
  const { dark, prefs } = useTheme();
  const { lang } = useI18n();
  const ref = useRef<WebViewHandle>(null);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [own3d, setOwn3d] = useState(prefs.map3d);
  const [recenter, setRecenter] = useState(0);
  const [ownZoom, setOwnZoom] = useState(0);
  const threeD = props.threeD ?? own3d;
  // Çevrimdışı paket indirildiyse yerel stil ve kütüphane (ağ yalnız paket dışındaki yerler için)
  const off = useMemo(() => offlineMapConfig(dark), [dark]);
  // Gömülü MapLibre (CDN'siz); okunana dek (ilk açılışta birkaç yüz ms) sayfa kurulmaz
  const [lib, setLib] = useState<string | null | undefined>(() => mapLibNow());
  useEffect(() => {
    if (lib !== undefined) return;
    let alive = true;
    loadMapLib().then((t) => { if (alive) setLib(t); }).catch(() => { if (alive) setLib(null); });
    return () => { alive = false; };
  }, [lib]);
  const html = useMemo(
    () => (lib === undefined ? '' : onlineMapHtml({ dark, bg: C.mapGround, ink: C.ink, user: C.user, building: dark ? '#2E3440' : '#DCD3C6', offline: off ? { style: off.style, libBase: off.libBase } : undefined, lib })),
    [dark, off, lib],
  );
  const sendFile = async (id: number, url: string) => {
    const r = off ? resolveMataf(url, off.remote) : null;
    const b64 = r ? await readMapFile(r.path) : null;
    ref.current?.injectJavaScript(`window.matafFile(${id},${b64 ? JSON.stringify(b64) : 'null'},${JSON.stringify(r?.remote ?? null)});true;`);
  };
  // Kullanıcı haritayı kaydırmışken her konum değişiminde yeniden çerçevelenmesin: yalnız noktalar/çizgiler değişince
  const autoKey = `${pins.length}:${pins[0]?.id ?? ''}:${pins[pins.length - 1]?.id ?? ''}:${lines.map((l) => `${l.coords.length}`).join(',')}`;
  const state = JSON.stringify({
    pins, lines, areas, fitTo, user: user ?? null, selectedId, center, padding, fitUser, threeD, zl: zoomLevel + ownZoom,
    fitKey: props.fitKey ?? autoKey,
    recenter: (props.recenterKey ?? 0) * 1000 + recenter,
  });
  // Sayfa hazır olunca son durum hemen gönderilir; sonraki değişiklikler etkiyle
  const stateRef = useRef(state);
  const logs = useRef(0);
  const reloaded = useRef(false);
  // Hazır olduktan sonra WebView'i 1 px oynat: bazı cihazlarda (ilk WebView) tuval ancak yeniden yerleşimde boyanıyor
  const [nudge, setNudge] = useState(0);
  useEffect(() => {
    if (!ready) return;
    const a = setTimeout(() => setNudge(1), 700);
    const b = setTimeout(() => setNudge(0), 1400);
    return () => { clearTimeout(a); clearTimeout(b); };
  }, [ready]);
  useEffect(() => { stateRef.current = state; });
  useEffect(() => {
    if (ready) ref.current?.injectJavaScript(`window.matafSet(${state});true;`);
  }, [state, ready]);
  // Ekran 20 sn'den uzun arka planda kalırsa WebView kapatılır (bellek); öne gelince yeniden açılır
  const [sleeping, setSleeping] = useState(false);
  const sleepTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // WebView, sayfa geçişi (sekme kaydırması) bittikten sonra kurulur; ViewPager içinde erken kurulunca boş kalabiliyor
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const id = setTimeout(() => setMounted(true), 300);
    return () => clearTimeout(id);
  }, []);
  useFocusEffect(useCallback(() => {
    if (sleepTimer.current) clearTimeout(sleepTimer.current);
    setSleeping(false);
    const wake = setTimeout(() => ref.current?.injectJavaScript('window.matafWake&&window.matafWake();true;'), 400);
    return () => {
      clearTimeout(wake);
      sleepTimer.current = setTimeout(() => { setSleeping(true); setReady(false); }, 20000);
    };
  }, []));
  useEffect(() => () => { if (sleepTimer.current) clearTimeout(sleepTimer.current); }, []);
  // 20 sn içinde açılmazsa (yavaş ağ) o sırada sade harita gösterilir; online harita arkada yüklenmeye devam eder
  const [slow, setSlow] = useState(false);
  const t0 = useRef(0);
  useEffect(() => {
    if (ready || failed || sleeping || !mounted) return;
    t0.current = Date.now();
    const id = setTimeout(() => setSlow(true), 20000);
    return () => clearTimeout(id);
  }, [ready, failed, attempt, sleeping, mounted]);

  const onMessage = (e: WebViewMessageEvent) => {
    let m: { t: string; id?: string | number; lat?: number; lng?: number; m?: string; url?: string };
    try { m = JSON.parse(e.nativeEvent.data); } catch { return; }
    if (m.t === 'file' && typeof m.id === 'number' && m.url) {
      sendFile(m.id, m.url).catch(() => undefined);
      return;
    }
    if (m.t === 'ready') {
      ref.current?.injectJavaScript(`window.matafSet(${stateRef.current});true;`);
      console.log('[harita] hazır', Date.now() - t0.current, 'ms');
      setReady(true);
      setSlow(false);
    } else if (m.t === 'reload' && !reloaded.current) {
      // WebGL bağlamı kaybolduysa sayfayı bir kez yeniden kur
      reloaded.current = true;
      console.log('[harita] yeniden kuruluyor:', m.m);
      setReady(false);
      setAttempt((n) => n + 1);
    } else if (m.t === 'error') {
      console.warn('[harita] açılamadı:', m.m);
      // Telefonda neden açılmadığını "Hata kaydı"ndan görebilelim
      logError(new Error(`harita açılamadı: ${m.m ?? ''}`), 'OnlineMap').catch(() => undefined);
      setFailed(true);
    } else if (m.t === 'log' && logs.current < 12) {
      logs.current += 1;
      console.log('[harita]', m.m);
    }
    else if (m.t === 'pin' && m.id != null) onPin?.(String(m.id));
    else if (m.t === 'long' && m.lat != null && m.lng != null) onLongPress?.({ lat: m.lat, lng: m.lng } as PlainLL);
  };

  if (failed) {
    return (
      <View style={{ flex: 1 }}>
        <PlainMap key={`p${props.recenterKey ?? 0}:${recenter}`} pins={pins} lines={lines} areas={areas} user={user} selectedId={selectedId} onPin={onPin} onLongPress={onLongPress} center={center} zoomLevel={zoomLevel} buttons={controls} />
        <Pressable onPress={() => { setFailed(false); setReady(false); setSlow(false); setAttempt((n) => n + 1); }} accessibilityRole="button"
          style={[{ position: 'absolute', top: (padding?.top ?? 0) + 10, alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, height: 32, borderRadius: 16, backgroundColor: C.bg }, shadow]}>
          <Icon name="refresh" size={14} color={C.accent} />
          <Text style={{ fontSize: fs(12), fontWeight: '700', color: C.ink }}>{pick(L.failed, lang)}</Text>
        </Pressable>
      </View>
    );
  }

  if (sleeping || !mounted || !html) return <View style={{ flex: 1, backgroundColor: C.mapGround }} />;

  return (
    <View style={{ flex: 1, backgroundColor: C.mapGround }}>
      <WebView
        key={attempt}
        ref={ref}
        source={{ html, baseUrl: off?.libBase ?? 'https://mataf.app/' }}
        allowFileAccess={!!off?.libBase}
        allowFileAccessFromFileURLs={!!off?.libBase}
        allowUniversalAccessFromFileURLs={!!off?.libBase}
        originWhitelist={['*']}
        onMessage={onMessage}
        onError={() => setFailed(true)}
        javaScriptEnabled
        domStorageEnabled
        cacheEnabled
        setSupportMultipleWindows={false}
        overScrollMode="never"
        nestedScrollEnabled
        scrollEnabled={false}
        bounces={false}
        style={{ flex: 1, marginBottom: nudge, backgroundColor: C.mapGround }}
      />
      {!ready && !slow && <ActivityIndicator style={{ position: 'absolute', top: '45%', alignSelf: 'center' }} color={C.accent} />}
      {!ready && slow && (
        <View style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}>
          <PlainMap key={`p${props.recenterKey ?? 0}:${recenter}`} pins={pins} lines={lines} areas={areas} user={user} selectedId={selectedId} onPin={onPin} onLongPress={onLongPress} center={center} zoomLevel={zoomLevel} buttons={controls} />
          <View style={[{ position: 'absolute', top: (padding?.top ?? 0) + 10, alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, height: 30, borderRadius: 15, backgroundColor: C.bg }, shadow]}>
            <ActivityIndicator size="small" color={C.accent} />
            <Text style={{ fontSize: fs(12), fontWeight: '700', color: C.ink }}>{pick(L.loading, lang)}</Text>
          </View>
        </View>
      )}
      {controls && ready && (
        <View style={{ position: 'absolute', right: (padding?.right ?? 0) + 10, top: (padding?.top ?? 0) + 10, gap: 8 }}>
          <Pressable onPress={() => setOwn3d((v) => !v)} accessibilityRole="button" accessibilityLabel={pick(threeD ? L.to2d : L.to3d, lang)}
            style={[{ width: 42, height: 42, borderRadius: 21, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center' }, shadow]}>
            <Text style={{ fontSize: fs(13), fontWeight: '800', color: C.ink }}>{threeD ? '2D' : '3D'}</Text>
          </Pressable>
          {user && (
            <Pressable onPress={() => setRecenter((n) => n + 1)} accessibilityRole="button" accessibilityLabel={pick(L.me, lang)}
              style={[{ width: 42, height: 42, borderRadius: 21, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center' }, shadow]}>
              <Icon name="locate" size={20} color={C.user} />
            </Pressable>
          )}
          {/* İki parmakla yakınlaştıramayanlar için +/− */}
          <View style={[{ width: 42, borderRadius: 21, backgroundColor: C.bg, overflow: 'hidden' }, shadow]}>
            <Pressable onPress={() => setOwnZoom((n) => n + 1)} accessibilityRole="button" accessibilityLabel={pick(L.zin, lang)} style={{ height: 44, alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="plus" size={20} color={C.ink} />
            </Pressable>
            <View style={{ height: 1, marginHorizontal: 9, backgroundColor: C.border }} />
            <Pressable onPress={() => setOwnZoom((n) => n - 1)} accessibilityRole="button" accessibilityLabel={pick(L.zout, lang)} style={{ height: 44, alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="minus" size={20} color={C.ink} />
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
}
