// İlk açılış ekranı bir kez gösterilir. Eski sürümden gelen (zaten kullanmış) kullanıcıya gösterilmez.
import AsyncStorage from '@react-native-async-storage/async-storage';

export const ONBOARD_KEY = 'onboard:v1';
const USED = ['theme:prefs', 'adhan:prefs', 'quran:bookmarks', 'zikir:log', 'kaza:state', 'prayer:place', 'mataf.method'];

export async function needsOnboarding(): Promise<boolean> {
  try {
    if ((await AsyncStorage.getItem(ONBOARD_KEY)) === '1') return false;
    const old = await AsyncStorage.multiGet(USED);
    if (old.some(([, v]) => v != null)) {
      await AsyncStorage.setItem(ONBOARD_KEY, '1');
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

export function setOnboarded() {
  return AsyncStorage.setItem(ONBOARD_KEY, '1').catch(() => undefined);
}
