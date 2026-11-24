// Yerel harita (react-native-maps) kullanılabilir mi? iOS'ta Apple Haritalar her zaman var. Android'de Google
// Haritalar bir API anahtarı ister: anahtarsız derlemede MapView uygulamayı kapatır. Expo Go'nun kendi anahtarı
// vardır; kendi derlememizde anahtar app.config.js ile GOOGLE_MAPS_API_KEY ortam değişkeninden gelir.
// Anahtar yoksa ekranlar sade haritayı (PlainMap) gösterir.
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { Platform } from 'react-native';

export const NATIVE_MAPS =
  Platform.OS === 'ios' ||
  (Platform.OS === 'android' &&
    (Constants.executionEnvironment === ExecutionEnvironment.StoreClient || !!Constants.expoConfig?.android?.config?.googleMaps?.apiKey));
