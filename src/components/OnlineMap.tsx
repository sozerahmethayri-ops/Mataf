// Uygulama içi online harita (telefon): MapLibre GL + OpenFreeMap (OSM). Binalar, mezarlıklar, yollar ve yer adları
// gerçek veriden gelir; 2D/3D düğmesi binaları yükseltip haritayı eğer. Harita yüklenemezse (internet yok, WebGL yok)
// sade haritaya (PlainMap) geçer — ekran hiçbir zaman boş kalmaz.
import { useEffect, useMemo, useRef, useState, type ComponentType, type Ref } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { WebView as RNWebView, type WebViewMessageEvent, type WebViewProps } from 'react-native-webview';

import { C, fs, shadow } from '@/constants/theme';
import { useTheme } from '@/services/ThemeContext';
import { Icon } from './Icon';
import { onlineMapHtml } from './onlineMapHtml';
import { PlainMap, type PlainLL } from './PlainMap';
import type { OnlineMapProps } from './OnlineMap.types';

export type { OnlineMapProps };

// Paketin sınıf tipi (WebView<P = undefined>) yeni TypeScript'te `never` props'a düşüyor; kullandığımız kısmı yazıyoruz.
type WebViewHandle = { injectJavaScript: (js: string) => void };
const WebView = RNWebView as unknown as ComponentType<WebViewProps & { ref?: Ref<WebViewHandle> }>;

export function OnlineMap(props: OnlineMapProps) {
  const { pins, lines = [], user, selectedId, onPin, onLongPress, center, padding, fitUser, controls = true } = props;
  const { dark, prefs } = useTheme();
  const ref = useRef<WebViewHandle>(null);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [own3d, setOwn3d] = useState(prefs.map3d);
  const [recenter, setRecenter] = useState(0);
  const threeD = props.threeD ?? own3d;
  const html = useMemo(
    () => onlineMapHtml({ dark, bg: C.mapGround, ink: C.ink, user: C.user, building: dark ? '#2E3440' : '#DCD3C6' }),
    [dark],
  );
  // Kullanıcı haritayı kaydırmışken her konum değişiminde yeniden çerçevelenmesin: yalnız noktalar/çizgiler değişince
  const autoKey = `${pins.length}:${pins[0]?.id ?? ''}:${pins[pins.length - 1]?.id ?? ''}:${lines.map((l) => `${l.coords.length}`).join(',')}`;
  const state = JSON.stringify({
    pins, lines, user: user ?? null, selectedId, center, padding, fitUser, threeD,
    fitKey: props.fitKey ?? autoKey,
    recenter: (props.recenterKey ?? 0) * 1000 + recenter,
  });
  useEffect(() => {
    if (ready) ref.current?.injectJavaScript(`window.matafSet(${state});true;`);
  }, [state, ready]);
  // 25 sn içinde açılmazsa (ağ çok yavaş / engelli) sade haritaya geç
  useEffect(() => {
    if (ready || failed) return;
    const id = setTimeout(() => setFailed(true), 25000);
    return () => clearTimeout(id);
  }, [ready, failed, attempt]);

  const onMessage = (e: WebViewMessageEvent) => {
    let m: { t: string; id?: string; lat?: number; lng?: number; m?: string };
    try { m = JSON.parse(e.nativeEvent.data); } catch { return; }
    if (m.t === 'ready') setReady(true);
    else if (m.t === 'error') setFailed(true);
    else if (m.t === 'pin' && m.id) onPin?.(m.id);
    else if (m.t === 'long' && m.lat != null && m.lng != null) onLongPress?.({ lat: m.lat, lng: m.lng } as PlainLL);
  };

  if (failed) {
    return (
      <View style={{ flex: 1 }}>
        <PlainMap pins={pins} lines={lines} user={user} selectedId={selectedId} onPin={onPin} onLongPress={onLongPress} center={center} />
        <Pressable onPress={() => { setFailed(false); setReady(false); setAttempt((n) => n + 1); }} accessibilityRole="button"
          style={[{ position: 'absolute', top: (padding?.top ?? 0) + 10, alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, height: 32, borderRadius: 16, backgroundColor: C.bg }, shadow]}>
          <Icon name="refresh" size={14} color={C.accent} />
          <Text style={{ fontSize: fs(12), fontWeight: '700', color: C.ink }}>Harita yüklenemedi · tekrar dene</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: C.mapGround }}>
      <WebView
        key={attempt}
        ref={ref}
        source={{ html, baseUrl: 'https://mataf.app/' }}
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
        androidLayerType="hardware"
        style={{ flex: 1, backgroundColor: C.mapGround }}
      />
      {!ready && <ActivityIndicator style={{ position: 'absolute', top: '45%', alignSelf: 'center' }} color={C.accent} />}
      {controls && ready && (
        <View style={{ position: 'absolute', right: (padding?.right ?? 0) + 10, top: (padding?.top ?? 0) + 10, gap: 8 }}>
          <Pressable onPress={() => setOwn3d((v) => !v)} accessibilityRole="button" accessibilityLabel={threeD ? '2B görünüm' : '3B görünüm'}
            style={[{ width: 42, height: 42, borderRadius: 21, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center' }, shadow]}>
            <Text style={{ fontSize: fs(13), fontWeight: '800', color: C.ink }}>{threeD ? '2D' : '3D'}</Text>
          </Pressable>
          {user && (
            <Pressable onPress={() => setRecenter((n) => n + 1)} accessibilityRole="button" accessibilityLabel="Konumuma git"
              style={[{ width: 42, height: 42, borderRadius: 21, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center' }, shadow]}>
              <Icon name="locate" size={20} color={C.user} />
            </Pressable>
          )}
        </View>
      )}
    </View>
  );
}
