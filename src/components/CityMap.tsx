// Şehir haritası (iOS: Apple Haritalar, Android: Google Haritalar — react-native-maps).
import MapView, { Marker, Polyline, type LongPressEvent } from 'react-native-maps';

import { C } from '@/constants/theme';
import type { PoiCat } from '@/services/osm';
import type { CityMapProps } from './CityMap.types';

export const POI_COLORS: Record<PoiCat, string> = {
  hotel: '#7C3AED', food: '#B45309', pharmacy: '#0F766E', bus: '#1D4ED8', taxi: '#A16207', hospital: '#B42318',
};

export function CityMap({ center, pois, hotel, gates, route, onLongPress, onPoiPress, onGatePress }: CityMapProps) {
  return (
    <MapView
      style={{ flex: 1 }}
      initialRegion={{ latitude: center.lat, longitude: center.lng, latitudeDelta: 0.014, longitudeDelta: 0.014 }}
      showsUserLocation
      showsCompass
      showsBuildings
      pitchEnabled
      onLongPress={(e: LongPressEvent) => onLongPress?.({ lat: e.nativeEvent.coordinate.latitude, lng: e.nativeEvent.coordinate.longitude })}>
      {route && route.length > 1 && <Polyline coordinates={route} strokeColor={C.route} strokeWidth={6} />}
      {pois.map((p) => (
        <Marker key={p.id} coordinate={{ latitude: p.lat, longitude: p.lng }} pinColor={POI_COLORS[p.cat]} title={p.name || undefined} onPress={() => onPoiPress?.(p)} />
      ))}
      {gates.map((g) => (
        <Marker key={g.id} coordinate={{ latitude: g.lat, longitude: g.lng }} title={`Kapı ${g.no}`} pinColor={g.closed ? C.closed : C.open} onCalloutPress={() => onGatePress?.(g.id)} />
      ))}
      {hotel && <Marker coordinate={{ latitude: hotel.lat, longitude: hotel.lng }} title="Otelim" pinColor="#7C3AED" />}
    </MapView>
  );
}
