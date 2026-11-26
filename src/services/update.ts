// Güncelleme uyarısı (yalnız Android, APK ile dağıtım): derleme iş akışı her APK ile birlikte apk-latest
// sürümüne version.json koyar. Uygulama en çok 6 saatte bir bakar; yeni sürüm varsa ana sayfada şerit çıkar.
// "Sonra" denirse o sürüm için bir daha gösterilmez.
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';

import { newer } from './version';

export const VERSION_URL = 'https://github.com/sozerahmethayri-ops/Mataf/releases/download/apk-latest/version.json';
export { newer };
export type UpdateInfo = { version: string; apk: string };
const K_LAST = 'update:last';
const K_INFO = 'update:info';
const K_DISMISSED = 'update:dismissed';

export const localVersion = () => Constants.expoConfig?.version ?? '0';

/** force: süreye bakmadan sunucuya sor (Ayarlar'daki "Güncellemeleri denetle"). */
export async function checkUpdate(force = false): Promise<UpdateInfo | null> {
  if (Platform.OS !== 'android') return null;
  let info: UpdateInfo | null = null;
  try {
    const last = Number((await AsyncStorage.getItem(K_LAST)) || 0);
    const stamp = Date.now();
    if (force || stamp - last > 6 * 3600e3) {
      const r = await fetch(VERSION_URL, { headers: { 'Cache-Control': 'no-cache' } });
      if (r.ok) {
        const j = (await r.json()) as Partial<UpdateInfo>;
        if (typeof j.version === 'string' && typeof j.apk === 'string') {
          info = { version: j.version, apk: j.apk };
          await AsyncStorage.multiSet([[K_LAST, String(stamp)], [K_INFO, JSON.stringify(info)]]);
        }
      }
    }
    if (!info) {
      const raw = await AsyncStorage.getItem(K_INFO);
      info = raw ? (JSON.parse(raw) as UpdateInfo) : null;
    }
  } catch {
    return null;
  }
  if (!info || !newer(info.version, localVersion())) return null;
  if (!force && (await AsyncStorage.getItem(K_DISMISSED)) === info.version) return null;
  return info;
}

/** Ana sayfa şeridi için: [yeni sürüm ya da null, "sonra" (bu sürümü gizle)] */
export function useUpdate(): [UpdateInfo | null, () => void] {
  const [info, setInfo] = useState<UpdateInfo | null>(null);
  useEffect(() => {
    let alive = true;
    checkUpdate().then((u) => { if (alive) setInfo(u); });
    return () => { alive = false; };
  }, []);
  const later = () => {
    if (info) AsyncStorage.setItem(K_DISMISSED, info.version).catch(() => undefined);
    setInfo(null);
  };
  return [info, later];
}
