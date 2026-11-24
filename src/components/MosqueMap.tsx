// En yakın cami haritası (iOS: Apple Haritalar, Android: Google Haritalar — react-native-maps; anahtarsız Android'de sade harita).
import { useEffect, useRef } from 'react';
import MapView, { Marker, Polyline } from 'react-native-maps';

import { C } from '@/constants/theme';
import { NATIVE_MAPS } from '@/services/nativeMaps';
import type { MosqueMapProps } from './MosqueMap.types';
import { MosqueMapPlain } from './MosqueMapPlain';

export function MosqueMap(props: MosqueMapProps) {
  return NATIVE_MAPS ? <MosqueMapNative {...props} /> : <MosqueMapPlain {...props} />;
}

function MosqueMapNative({ user, mosques, selectedId, route, onSelect }: MosqueMapProps) {
  const ref = useRef<MapView>(null);
  const sel = mosques.find((m) => m.id === selectedId) ?? mosques[0];
  // Kullanıcı ve seçili cami birlikte görünsün
  useEffect(() => {
    if (!sel) return;
    ref.current?.fitToCoordinates(
      [{ latitude: user.lat, longitude: user.lng }, { latitude: sel.lat, longitude: sel.lng }, ...(route ?? [])],
      { edgePadding: { top: 60, right: 60, bottom: 60, left: 60 }, animated: true },
    );
  }, [sel?.id, route?.length]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <MapView
      ref={ref}
      style={{ flex: 1 }}
      initialRegion={{ latitude: user.lat, longitude: user.lng, latitudeDelta: 0.02, longitudeDelta: 0.02 }}
      showsUserLocation
      showsCompass
      zoomEnabled
      rotateEnabled
      showsMyLocationButton>
      {route && route.length > 1 && <Polyline coordinates={route} strokeColor={C.route} strokeWidth={6} />}
      {mosques.slice(0, 25).map((m) => (
        <Marker key={m.id} coordinate={{ latitude: m.lat, longitude: m.lng }} title={m.name || undefined}
          pinColor={m.id === sel?.id ? C.accent : C.green} onPress={() => onSelect?.(m.id)} />
      ))}
    </MapView>
  );
}
