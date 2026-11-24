// Web önizlemesinde yerel harita yok: OpenStreetMap bağlantısı gösterilir (pusula oku ve liste yine çalışır).
import { Linking, Pressable, Text, View } from 'react-native';

import { C } from '@/constants/theme';
import type { MosqueMapProps } from './MosqueMap.types';

export function MosqueMap({ user, mosques, selectedId }: MosqueMapProps) {
  const sel = mosques.find((m) => m.id === selectedId) ?? mosques[0];
  const p = sel ?? user;
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 16, gap: 8, backgroundColor: C.mapGround }}>
      <Text style={{ fontSize: 13, color: C.ink2, textAlign: 'center' }}>Harita telefonda (iOS/Android) görünür.</Text>
      <Pressable onPress={() => Linking.openURL(`https://www.openstreetmap.org/?mlat=${p.lat}&mlon=${p.lng}#map=17/${p.lat}/${p.lng}`)}>
        <Text style={{ color: C.accent, fontWeight: '700' }}>OpenStreetMap’te aç ↗</Text>
      </Pressable>
    </View>
  );
}
