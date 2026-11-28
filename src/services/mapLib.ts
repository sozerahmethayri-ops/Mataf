// Uygulamaya gömülü MapLibre GL JS (assets/maplibre, tools/maplibre/build.mjs ile üretilir): harita sayfasına satır
// içi konur, böylece kütüphane için CDN'e (unpkg, jsdelivr) gerek kalmaz; bazı ağlar bu adresleri açmıyor.
// Okunamazsa ya da 4 sn'de okunmazsa null döner ve sayfa kütüphaneyi eskisi gibi CDN'den yükler.
import { Asset } from 'expo-asset';
import { File } from 'expo-file-system';
import { Platform } from 'react-native';

let file: Promise<string | null> | null = null;
let ready: string | null | undefined;

function readFile(): Promise<string | null> {
  if (!file) {
    file = (async () => {
      try {
        const a = Asset.fromModule(require('../../assets/maplibre/maplibre-gl-5.24.1.html'));
        if (Platform.OS === 'web') return await (await fetch(a.uri)).text();
        await a.downloadAsync();
        const text = await new File(a.localUri ?? a.uri).text();
        return text.length > 100000 ? text : null;
      } catch (e) {
        console.warn('[harita] gömülü kütüphane okunamadı:', String(e));
        return null;
      }
    })();
    file.then((t) => { ready = t; }).catch(() => { ready = null; });
  }
  return file;
}

/** Gömülü kütüphane; 4 sn'de okunmazsa null (harita hiçbir zaman beklemede kalmasın; dosya sonra okunursa sonraki açılışta kullanılır). */
export function loadMapLib(): Promise<string | null> {
  const late = new Promise<null>((res) => setTimeout(() => res(null), 4000));
  return Promise.race([readFile(), late]);
}

/** Kütüphane okunduysa hemen verir; okunmadıysa okumayı başlatır ve undefined döner. */
export function mapLibNow(): string | null | undefined {
  if (ready === undefined) readFile();
  return ready;
}
