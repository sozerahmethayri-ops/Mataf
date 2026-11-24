import AsyncStorage from '@react-native-async-storage/async-storage';

import { findMosques, type Cache, type LatLng } from './mosques';

const KEY = 'mosques:last';
const cache: Cache = { get: () => AsyncStorage.getItem(KEY), set: (v) => AsyncStorage.setItem(KEY, v) };

/** Uygulamadaki arama: son başarılı sonuç cihazda saklanır, internet yokken o gösterilir. */
export const searchMosques = (o: LatLng, lang: 'tr' | 'en' | 'ar') => findMosques(o, lang, { cache });
