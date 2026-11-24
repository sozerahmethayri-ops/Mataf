// Ulaşım haritası (iOS: Apple Haritalar, Android: Google Haritalar — react-native-maps).
// İki parmakla büyütme, döndürme ve eğme açık; pusulaya dokununca kuzey yukarı döner.
import { useEffect, useRef } from 'react';
import MapView, { Marker, Polyline, type LongPressEvent } from 'react-native-maps';

import { C } from '@/constants/theme';
import type { TransportMapProps } from './TransportMap.types';

const ll = (p: { lat: number; lng: number }) => ({ latitude: p.lat, longitude: p.lng });

export function TransportMap({ user, dest, segments, onLongPress, fitKey }: TransportMapProps) {
  const ref = useRef<MapView>(null);
  useEffect(() => {
    const pts = [...(user ? [ll(user)] : []), ...(dest ? [ll(dest)] : []), ...segments.flatMap((s) => s.coords.map(ll))];
    if (pts.length < 2) return;
    ref.current?.fitToCoordinates(pts, { edgePadding: { top: 70, right: 50, bottom: 50, left: 50 }, animated: true });
  }, [fitKey]); // eslint-disable-line react-hooks/exhaustive-deps
  const start = user ?? dest ?? { lat: 21.4225, lng: 39.8262 };
  return (
    <MapView
      ref={ref}
      style={{ flex: 1 }}
      initialRegion={{ latitude: start.lat, longitude: start.lng, latitudeDelta: 0.03, longitudeDelta: 0.03 }}
      showsUserLocation
      showsMyLocationButton
      showsCompass
      showsTraffic={false}
      zoomEnabled
      rotateEnabled
      pitchEnabled
      scrollEnabled
      toolbarEnabled={false}
      onLongPress={(e: LongPressEvent) => onLongPress?.({ lat: e.nativeEvent.coordinate.latitude, lng: e.nativeEvent.coordinate.longitude })}>
      {segments.map((s, i) => s.coords.length > 1 && (
        <Polyline key={i} coordinates={s.coords.map(ll)} strokeColor={s.color} strokeWidth={s.dashed ? 4 : 6} lineDashPattern={s.dashed ? [2, 8] : undefined} />
      ))}
      {dest && <Marker coordinate={ll(dest)} title={dest.name} pinColor={C.accent} />}
    </MapView>
  );
}
