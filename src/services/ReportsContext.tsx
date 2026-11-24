import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { GATES } from '@/data/sites';
import { createBackend, localUser, summarize, type Backend, type GateStatus, type GateSummary, type Report } from './reports';

type Ctx = {
  backend: Backend['name'];
  reports: Report[];
  summaries: Record<string, GateSummary>;
  statusOf: (gateId: string) => GateStatus;
  userId: string;
  loading: boolean;
  error?: string;
  lastSync?: number;
  refresh: () => Promise<void>;
  add: (r: Omit<Report, 'id' | 'createdAt' | 'userId' | 'userName'> & { userName?: string }) => Promise<Report>;
};

const ReportsContext = createContext<Ctx | null>(null);

export function ReportsProvider({ children }: { children: React.ReactNode }) {
  const backend = useMemo(() => createBackend(), []);
  const [reports, setReports] = useState<Report[]>([]);
  const [userId, setUserId] = useState('u-anon');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();
  const [lastSync, setLastSync] = useState<number>();
  const [tick, setTick] = useState(0);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setReports(await backend.list());
      setError(undefined);
      setLastSync(Date.now());
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [backend]);

  useEffect(() => {
    localUser().then(setUserId);
    backend.list().then(
      (r) => { setReports(r); setError(undefined); setLastSync(Date.now()); setLoading(false); },
      (e) => { setError(e instanceof Error ? e.message : String(e)); setLoading(false); },
    );
    const unsub = backend.subscribe((r) => setReports((prev) => (prev.some((x) => x.id === r.id) ? prev : [...prev, r])));
    // Süresi dolan bildirimlerin düşmesi için dakikada bir yeniden hesapla; 5 dakikada bir sunucudan tazele.
    const t1 = setInterval(() => setTick((x) => x + 1), 60 * 1000);
    const t2 = setInterval(refresh, 5 * 60 * 1000);
    return () => { unsub(); clearInterval(t1); clearInterval(t2); };
  }, [backend, refresh]);

  const summaries = useMemo(() => {
    const out: Record<string, GateSummary> = {};
    for (const g of GATES) out[g.id] = summarize(reports, g.id);
    return out;
    // tick: zaman ilerledikçe yeniden hesaplanır
  }, [reports, tick]); // eslint-disable-line react-hooks/exhaustive-deps

  const statusOf = useCallback((id: string) => summaries[id]?.status ?? 'open', [summaries]);

  const add = useCallback<Ctx['add']>(async (r) => {
    const full = await backend.add({ ...r, userId, userName: r.userName ?? 'Siz' });
    setReports((prev) => (prev.some((x) => x.id === full.id) ? prev : [...prev, full]));
    return full;
  }, [backend, userId]);

  const value = useMemo<Ctx>(() => ({
    backend: backend.name, reports, summaries, statusOf, userId, loading, error, lastSync, refresh, add,
  }), [backend.name, reports, summaries, statusOf, userId, loading, error, lastSync, refresh, add]);

  return <ReportsContext.Provider value={value}>{children}</ReportsContext.Provider>;
}

export function useReports() {
  const ctx = useContext(ReportsContext);
  if (!ctx) throw new Error('useReports must be used inside ReportsProvider');
  return ctx;
}
