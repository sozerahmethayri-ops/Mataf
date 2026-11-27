// Ekranlar arasında ortak, cihazda saklanan küçük kayıtlar: ana sayfa kartı ile ayrıntı ekranı aynı değeri görür.
// usePersisted her bileşene ayrı kopya verir; bu ise tek kopya tutar. Her açılışta kayıt yeniden okunur
// (yedekten geri yüklemeden sonra da güncel kalsın). Kullanım: const useX = sharedPersisted('anahtar', başlangıç, temizle);
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';

export function sharedPersisted<T>(key: string, initial: T, clean: (raw: unknown) => T) {
  let value = initial;
  const listeners = new Set<(v: T) => void>();
  const emit = (v: T) => {
    value = v;
    for (const fn of listeners) fn(v);
  };
  const reload = async () => {
    try {
      const raw = await AsyncStorage.getItem(key);
      let v = initial;
      try {
        v = raw ? clean(JSON.parse(raw)) : initial;
      } catch {
        /* bozuk kayıt: başlangıç değeri */
      }
      emit(v);
    } catch {
      /* okunamadı: eldeki kalsın */
    }
  };
  return function useShared() {
    const [v, setV] = useState<T>(value);
    useEffect(() => {
      listeners.add(setV);
      reload();
      return () => {
        listeners.delete(setV);
      };
    }, []);
    const set = useCallback((next: T | ((prev: T) => T)) => {
      const n = typeof next === 'function' ? (next as (prev: T) => T)(value) : next;
      emit(n);
      AsyncStorage.setItem(key, JSON.stringify(n)).catch(() => {});
    }, []);
    return [v, set] as const;
  };
}
