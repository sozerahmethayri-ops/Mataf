// Web (iPhone ve bilgisayar): telefondaki gibi gerçek harita (MapLibre GL + OpenFreeMap), bir iframe içinde ve aynı
// sayfa koduyla (onlineMapHtml). Kütüphane uygulamayla gelir (assets/maplibre), CDN gerekmez. Harita açılamazsa
// (WebGL ya da internet yok) sade harita (PlainMap) gösterilir; 20 sn'de açılmazsa arada sade harita durur.
import { createElement, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import { C, fs, shadow } from '@/constants/theme';
import { pick, useI18n } from '@/i18n';
import { loadMapLib, mapLibNow } from '@/services/mapLib';
import { useTheme } from '@/services/ThemeContext';
import { Icon } from './Icon';
import { onlineMapHtml } from './onlineMapHtml';
import { PlainMap } from './PlainMap';
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

let seq = 0;
type Frame = { contentWindow: (Window & { matafSet?: (st: unknown) => void }) | null };

export function OnlineMap(props: OnlineMapProps) {
  const { pins, lines = [], areas = [], fitTo, user, selectedId, onPin, onLongPress, center, padding, fitUser, controls = true, zoomLevel = 0 } = props;
  const { dark, prefs } = useTheme();
  const { lang } = useI18n();
  const [id] = useState(() => `m${++seq}`);
  const ref = useRef<Frame | null>(null);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [slow, setSlow] = useState(false);
  const [own3d, setOwn3d] = useState(prefs.map3d);
  const [recenter, setRecenter] = useState(0);
  const [ownZoom, setOwnZoom] = useState(0);
  const threeD = props.threeD ?? own3d;
  const [lib, setLib] = useState<string | null | undefined>(() => mapLibNow());
  useEffect(() => {
    if (lib !== undefined) return;
    let alive = true;
    loadMapLib().then((t) => { if (alive) setLib(t); }).catch(() => { if (alive) setLib(null); });
    return () => { alive = false; };
  }, [lib]);
  const html = useMemo(
    () => (lib === undefined ? '' : onlineMapHtml({ dark, bg: C.mapGround, ink: C.ink, user: C.user, building: dark ? '#2E3440' : '#DCD3C6', lib, frame: id })),
    [dark, lib, id],
  );
  const autoKey = `${pins.length}:${pins[0]?.id ?? ''}:${pins[pins.length - 1]?.id ?? ''}:${lines.map((l) => `${l.coords.length}`).join(',')}`;
  const state = JSON.stringify({
    pins, lines, areas, fitTo, user: user ?? null, selectedId, center, padding, fitUser, threeD, zl: zoomLevel + ownZoom,
    fitKey: props.fitKey ?? autoKey,
    recenter: (props.recenterKey ?? 0) * 1000 + recenter,
  });
  const stateRef = useRef(state);
  useEffect(() => { stateRef.current = state; });
  const handlers = useRef({ onPin, onLongPress });
  useEffect(() => { handlers.current = { onPin, onLongPress }; });
  useEffect(() => {
    if (ready) ref.current?.contentWindow?.matafSet?.(JSON.parse(state));
  }, [state, ready]);
  // Sayfadan gelen iletiler (yalnız bu iframe'in kimliğiyle)
  useEffect(() => {
    const on = (e: MessageEvent) => {
      const d = e.data as { mataf?: string; d?: string } | null;
      if (!d || d.mataf !== id || typeof d.d !== 'string') return;
      let m: { t: string; id?: string | number; lat?: number; lng?: number; m?: string };
      try { m = JSON.parse(d.d); } catch { return; }
      if (m.t === 'ready') {
        ref.current?.contentWindow?.matafSet?.(JSON.parse(stateRef.current));
        setReady(true);
        setSlow(false);
      } else if (m.t === 'error') {
        console.warn('[harita] açılamadı:', m.m);
        setFailed(true);
      } else if (m.t === 'log') console.log('[harita]', m.m);
      else if (m.t === 'pin' && m.id != null) handlers.current.onPin?.(String(m.id));
      else if (m.t === 'long' && m.lat != null && m.lng != null) handlers.current.onLongPress?.({ lat: m.lat, lng: m.lng });
    };
    window.addEventListener('message', on);
    return () => window.removeEventListener('message', on);
  }, [id]);
  useEffect(() => {
    if (ready || failed || !html) return;
    const t = setTimeout(() => setSlow(true), 20000);
    return () => clearTimeout(t);
  }, [ready, failed, html, attempt]);

  const plain = (
    <PlainMap key={`p${props.recenterKey ?? 0}:${recenter}`} pins={pins} lines={lines} areas={areas} user={user} selectedId={selectedId}
      onPin={onPin} onLongPress={onLongPress} center={center} zoomLevel={zoomLevel} buttons={controls} />
  );
  if (failed) {
    return (
      <View style={{ flex: 1 }}>
        {plain}
        <Pressable onPress={() => { setFailed(false); setReady(false); setSlow(false); setAttempt((n) => n + 1); }} accessibilityRole="button"
          style={[{ position: 'absolute', top: (padding?.top ?? 0) + 10, alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, height: 32, borderRadius: 16, backgroundColor: C.bg }, shadow]}>
          <Icon name="refresh" size={14} color={C.accent} />
          <Text style={{ fontSize: fs(12), fontWeight: '700', color: C.ink }}>{pick(L.failed, lang)}</Text>
        </Pressable>
      </View>
    );
  }
  if (!html) return <View style={{ flex: 1, backgroundColor: C.mapGround }} />;

  return (
    <View style={{ flex: 1, backgroundColor: C.mapGround }}>
      {createElement('iframe', {
        key: attempt,
        ref,
        srcDoc: html,
        title: 'map',
        style: { border: 0, width: '100%', height: '100%', display: 'block', backgroundColor: C.mapGround },
      })}
      {!ready && !slow && <ActivityIndicator style={{ position: 'absolute', top: '45%', alignSelf: 'center' }} color={C.accent} />}
      {!ready && slow && (
        <View style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}>
          {plain}
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
