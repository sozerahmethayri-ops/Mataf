// Namaz takibi kaydı ekranlar arasında ortak: ana sayfa kartı ve Namaz takibi ekranı aynı kopyayı görür.
// Her açılışta kayıt yeniden okunur (yedekten geri yüklemeden sonra da güncel kalsın).
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';

import { pushLogWidget } from './logWidget';
import { LOG_KEY, isDone, prune, sanitize, toggle, type LogPrayer, type PrayerLog } from './prayerLog';

/** '1' ise ana sayfadaki kart gizli */
export const LOG_HIDDEN_KEY = 'prayer:logHidden';

type State = { log: PrayerLog; hidden: boolean };
let state: State = { log: {}, hidden: false };
const listeners = new Set<(s: State) => void>();
const emit = (s: State) => {
  state = s;
  for (const fn of listeners) fn(s);
};

async function reload() {
  try {
    const pairs = await AsyncStorage.multiGet([LOG_KEY, LOG_HIDDEN_KEY]);
    const raw = pairs[0]?.[1];
    let log: PrayerLog = {};
    try {
      log = sanitize(raw ? JSON.parse(raw) : {});
    } catch {
      /* bozuk kayıt: boş başla */
    }
    emit({ log, hidden: pairs[1]?.[1] === '1' });
  } catch {
    /* okunamadı: eldeki kalsın */
  }
}

/** Bildirimdeki "Kıldım" düğmesi: o vakti işaretler (zaten işaretliyse dokunmaz). Uygulama kapalıysa düğme önce uygulamayı açar. */
export async function markPrayed(day: string, p: LogPrayer) {
  await reload();
  if (isDone(state.log, day, p)) return;
  const log = prune(toggle(state.log, day, p), new Date());
  emit({ ...state, log });
  await AsyncStorage.setItem(LOG_KEY, JSON.stringify(log)).catch(() => {});
  pushLogWidget(log);
}

export function usePrayerLog() {
  const [s, setS] = useState<State>(state);
  useEffect(() => {
    listeners.add(setS);
    reload();
    return () => {
      listeners.delete(setS);
    };
  }, []);
  const flip = useCallback((day: string, p: LogPrayer) => {
    const log = prune(toggle(state.log, day, p), new Date());
    emit({ ...state, log });
    AsyncStorage.setItem(LOG_KEY, JSON.stringify(log)).catch(() => {});
    // Ana ekran küçük uygulaması da hemen güncellensin (Android)
    pushLogWidget(log);
  }, []);
  const setHidden = useCallback((hidden: boolean) => {
    emit({ ...state, hidden });
    AsyncStorage.setItem(LOG_HIDDEN_KEY, hidden ? '1' : '0').catch(() => {});
  }, []);
  return { log: s.log, hidden: s.hidden, flip, setHidden };
}
