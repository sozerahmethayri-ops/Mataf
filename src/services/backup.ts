// Yedekleme: uygulamanın cihazda tuttuğu kişisel veriler (zikir defteri, kaza, ayraçlar, otel, sağlık kartı,
// ayarlar…) tek bir JSON dosyasına yazılır ve paylaşılır; geri yüklerken aynı dosya seçilir.
// Ağ önbelleği (cache:*) ve yarım kalan tavaf/sa'y oturumları yedeğe girmez.
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as DocumentPicker from 'expo-document-picker';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Platform, Share } from 'react-native';

import { SKIP, parseBackup, type Backup } from './backupFormat';

export async function buildBackup(version: string): Promise<Backup> {
  const keys = (await AsyncStorage.getAllKeys()).filter((k) => !SKIP(k));
  const pairs = await AsyncStorage.multiGet(keys);
  const data: Record<string, string> = {};
  for (const [k, v] of pairs) if (v != null) data[k] = v;
  return { app: 'MATAF', version, at: new Date().toISOString(), data };
}

/** Yedeği dosya olarak paylaş (telefon) ya da indir (web). Kaç kayıt yazıldığını döner. */
export async function exportBackup(version: string) {
  const b = await buildBackup(version);
  const json = JSON.stringify(b);
  const name = `mataf-yedek-${b.at.slice(0, 10)}.json`;
  if (Platform.OS === 'web') {
    const url = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    a.click();
    URL.revokeObjectURL(url);
    return Object.keys(b.data).length;
  }
  const f = new File(Paths.cache, name);
  if (f.exists) f.delete();
  f.create();
  f.write(json);
  if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(f.uri, { mimeType: 'application/json', dialogTitle: name, UTI: 'public.json' });
  else await Share.share({ message: json });
  return Object.keys(b.data).length;
}

/** Dosya seçtirip geri yükler; seçilmezse null. Var olan aynı adlı kayıtların üzerine yazar. */
export async function importBackup(): Promise<{ count: number; at: string } | null> {
  const r = await DocumentPicker.getDocumentAsync({ type: ['application/json', 'text/plain', '*/*'], copyToCacheDirectory: true, multiple: false });
  if (r.canceled || !r.assets?.[0]) return null;
  const uri = r.assets[0].uri;
  const text = Platform.OS === 'web' ? await (await fetch(uri)).text() : await new File(uri).text();
  const b = parseBackup(text);
  const pairs = Object.entries(b.data).filter(([k]) => !SKIP(k));
  await AsyncStorage.multiSet(pairs);
  return { count: pairs.length, at: b.at };
}
