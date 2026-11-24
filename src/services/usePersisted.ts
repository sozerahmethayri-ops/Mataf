import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';

/** Cihazda saklanan küçük ayar nesnesi. İlk değer hemen döner; kayıtlı değer gelince güncellenir. */
export function usePersisted<T extends object>(key: string, initial: T) {
  const [value, setValue] = useState<T>(initial);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let alive = true;
    AsyncStorage.getItem(key)
      .then((raw) => {
        if (!alive) return;
        if (raw) {
          try { setValue((v) => ({ ...v, ...(JSON.parse(raw) as Partial<T>) })); } catch { /* bozuk kayıt: yok say */ }
        }
        setReady(true);
      })
      .catch(() => alive && setReady(true));
    return () => { alive = false; };
  }, [key]);
  const update = useCallback((patch: Partial<T>) => {
    setValue((v) => {
      const next = { ...v, ...patch };
      AsyncStorage.setItem(key, JSON.stringify(next)).catch(() => undefined);
      return next;
    });
  }, [key]);
  return [value, update, ready] as const;
}
