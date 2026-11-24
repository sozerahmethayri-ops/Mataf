import { useEffect, useState } from 'react';

/** Bir promise'i bağımlılıklar değiştikçe çalıştırır; yükleniyor/hata durumunu türetir. */
export function useAsync<T>(fn: () => Promise<T>, deps: unknown[]) {
  const key = JSON.stringify(deps);
  const [state, setState] = useState<{ key: string; data?: T; error?: unknown }>({ key: '' });
  useEffect(() => {
    let alive = true;
    fn().then(
      (data) => alive && setState({ key, data }),
      (error) => alive && setState({ key, error: error ?? new Error('failed') }),
    );
    return () => { alive = false; };
  }, [key]); // eslint-disable-line react-hooks/exhaustive-deps
  const loading = state.key !== key;
  return { data: loading ? undefined : state.data, error: loading ? undefined : state.error, loading };
}
