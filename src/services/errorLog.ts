// Hata kaydı: beklenmeyen hatalar cihazda saklanır (son 20) ve sunucu bağlıysa adsız olarak "client_errors"
// tablosuna gönderilir (kişisel bilgi yok: sürüm, platform, ekran, hata metni). Kullanıcı Ayarlar'dan ya da hata
// ekranından kaydı paylaşabilir.
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { Platform, Share } from 'react-native';

import { supabase } from './supabase';

export type ErrEntry = { at: string; msg: string; stack?: string; where?: string; v: string; p: string };
const KEY = 'errors:v1';
const MAX = 20;

const clip = (s: string, n: number) => (s.length > n ? `${s.slice(0, n - 1)}…` : s);

export async function logError(err: unknown, where?: string) {
  const e = err instanceof Error ? err : new Error(String(err));
  const entry: ErrEntry = {
    at: new Date().toISOString(),
    msg: clip(`${e.name}: ${e.message}`, 500),
    stack: e.stack ? clip(e.stack.split('\n').slice(0, 8).join('\n'), 2000) : undefined,
    where: where ? clip(where, 80) : undefined,
    v: Constants.expoConfig?.version ?? '',
    p: Platform.OS,
  };
  try {
    const raw = await AsyncStorage.getItem(KEY);
    const list = raw ? (JSON.parse(raw) as ErrEntry[]) : [];
    // Aynı hata art arda yağıyorsa bir kez yaz
    if (list[0]?.msg === entry.msg && Date.parse(entry.at) - Date.parse(list[0].at) < 10e3) return;
    await AsyncStorage.setItem(KEY, JSON.stringify([entry, ...list].slice(0, MAX)));
  } catch { /* kayıt yazılamadıysa geç */ }
  const sb = supabase();
  if (sb) {
    sb.from('client_errors').insert({ version: entry.v, platform: entry.p, place: entry.where ?? null, message: entry.msg, stack: entry.stack ?? null })
      .then(() => undefined, () => undefined);
  }
}

export async function getErrors(): Promise<ErrEntry[]> {
  try { return JSON.parse((await AsyncStorage.getItem(KEY)) ?? '[]') as ErrEntry[]; } catch { return []; }
}
export const clearErrors = () => AsyncStorage.removeItem(KEY).catch(() => undefined);

export function errorsText(list: ErrEntry[]) {
  return list.map((e) => `[${e.at.slice(0, 16).replace('T', ' ')}] MATAF ${e.v} ${e.p}${e.where ? ` · ${e.where}` : ''}\n${e.msg}${e.stack ? `\n${e.stack}` : ''}`).join('\n\n');
}
export async function shareErrors(extra?: ErrEntry) {
  const list = await getErrors();
  const all = extra && list[0]?.msg !== extra.msg ? [extra, ...list] : list;
  return Share.share({ message: all.length ? errorsText(all.slice(0, 5)) : 'MATAF: hata kaydı yok' }).catch(() => undefined);
}

let installed = false;
/** Yakalanmamış JS hatalarını da kaydet (önceki işleyici yine çalışır). */
export function installErrorLog() {
  if (installed) return;
  installed = true;
  const EU = (globalThis as { ErrorUtils?: { getGlobalHandler: () => (e: unknown, fatal?: boolean) => void; setGlobalHandler: (h: (e: unknown, fatal?: boolean) => void) => void } }).ErrorUtils;
  if (!EU) return;
  const prev = EU.getGlobalHandler();
  EU.setGlobalHandler((e, fatal) => {
    logError(e, fatal ? 'fatal' : 'global').catch(() => undefined);
    prev(e, fatal);
  });
}
