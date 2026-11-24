// Web önizlemesinde yerel harita bileşeni yok; OpenStreetMap bağlantısı gösterilir.
import { Linking, Pressable, Text, View } from 'react-native';

import { C } from '@/constants/theme';
import type { CityMapProps } from './CityMap.types';

export const POI_COLORS = {
  hotel: '#7C3AED', food: '#B45309', pharmacy: '#0F766E', bus: '#1D4ED8', taxi: '#A16207', hospital: '#B42318',
} as const;

export function CityMap({ center, pois }: CityMapProps) {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 12, backgroundColor: C.mapGround }}>
      <Text style={{ fontSize: 15, color: C.ink2, textAlign: 'center' }}>Şehir haritası telefonda (iOS/Android) çalışır. {pois.length} yer yüklendi.</Text>
      <Pressable onPress={() => Linking.openURL(`https://www.openstreetmap.org/#map=16/${center.lat}/${center.lng}`)}>
        <Text style={{ color: C.accent, fontWeight: '700' }}>OpenStreetMap’te aç ↗</Text>
      </Pressable>
    </View>
  );
}
