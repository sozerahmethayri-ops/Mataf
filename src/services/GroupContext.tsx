// Aile / grup konumu durumu (cihazda saklanır) ve paylaşım döngüsü: grup varsa ve paylaşım açıksa uygulama
// açıkken konum her 25 m'de (en az 15 sn arayla) ya da 2 dakikada bir gruba yazılır. Geçmiş tutulmaz.
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { AppState, Platform } from 'react-native';

import { GROUP_SERVER, groupBackend, type GroupInfo, type GroupKind } from './group';
import { colorFor, shouldSend } from './groupLogic';
import { supabase } from './supabase';

const KEY = 'group:v1';
export type GroupState = { group: (GroupInfo & { kind: GroupKind }) | null; name: string; color: string; sharing: boolean };
const INITIAL: GroupState = { group: null, name: '', color: '#C2410C', sharing: true };

type Ctx = {
  st: GroupState;
  ready: boolean;
  server: boolean;
  lastSent: number | null;
  error: string | null;
  create: (groupName: string, myName: string, demo?: boolean) => Promise<void>;
  join: (code: string, myName: string, demo?: boolean) => Promise<void>;
  leave: () => Promise<void>;
  setSharing: (v: boolean) => void;
};
const GroupCtx = createContext<Ctx | null>(null);
const stamp = () => Date.now();

export function GroupProvider({ children }: { children: ReactNode }) {
  const [st, setSt] = useState<GroupState>(INITIAL);
  const [ready, setReady] = useState(false);
  const [lastSent, setLastSent] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const last = useRef<{ at: number; lat: number; lng: number } | null>(null);

  useEffect(() => {
    let alive = true;
    AsyncStorage.getItem(KEY).then((raw) => {
      if (!alive) return;
      if (raw) { try { setSt({ ...INITIAL, ...(JSON.parse(raw) as Partial<GroupState>) }); } catch { /* bozuk kayıt: varsayılan */ } }
      setReady(true);
    }).catch(() => setReady(true));
    return () => { alive = false; };
  }, []);
  // Supabase'in React Native önerisi: oturum yenilemesi yalnız uygulama öndeyken çalışsın
  useEffect(() => {
    const sb = Platform.OS === 'web' ? null : supabase();
    if (!sb) return;
    const sub = AppState.addEventListener('change', (s) => { if (s === 'active') sb.auth.startAutoRefresh(); else sb.auth.stopAutoRefresh(); });
    return () => sub.remove();
  }, []);
  const save = useCallback((next: GroupState) => {
    setSt(next);
    AsyncStorage.setItem(KEY, JSON.stringify(next)).catch(() => undefined);
  }, []);

  // Paylaşım döngüsü (uygulama açıkken)
  const g = st.group;
  const sharing = !!g && st.sharing;
  useEffect(() => {
    if (!g || !sharing) return;
    let alive = true;
    let sub: Location.LocationSubscription | undefined;
    const be = groupBackend(g.kind);
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted' || !alive) return;
      sub = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.Balanced, distanceInterval: 20, timeInterval: 20000 },
        (l) => {
          const fix = { lat: l.coords.latitude, lng: l.coords.longitude, accuracy: l.coords.accuracy };
          const now = stamp();
          if (!shouldSend(last.current, fix, now)) return;
          last.current = { at: now, lat: fix.lat, lng: fix.lng };
          be.update(g, fix, true)
            .then(() => { if (alive) { setLastSent(now); setError(null); } })
            .catch((e: unknown) => { last.current = null; if (alive) setError(e instanceof Error ? e.message : String(e)); });
        },
      );
    })().catch((e: unknown) => alive && setError(e instanceof Error ? e.message : String(e)));
    return () => { alive = false; sub?.remove(); };
  }, [g, sharing]);

  const value = useMemo<Ctx>(() => ({
    st, ready, server: GROUP_SERVER, lastSent, error,
    create: async (groupName, myName, demo) => {
      const kind: GroupKind = demo || !GROUP_SERVER ? 'demo' : 'supabase';
      const color = colorFor(myName);
      const info = await groupBackend(kind).create(groupName.trim(), myName.trim(), color);
      last.current = null;
      save({ ...st, group: { ...info, kind }, name: myName.trim(), color, sharing: true });
    },
    join: async (code, myName, demo) => {
      const kind: GroupKind = demo || !GROUP_SERVER ? 'demo' : 'supabase';
      const color = colorFor(myName);
      const info = await groupBackend(kind).join(code, myName.trim(), color);
      last.current = null;
      save({ ...st, group: { ...info, kind }, name: myName.trim(), color, sharing: true });
    },
    leave: async () => {
      if (st.group) await groupBackend(st.group.kind).leave(st.group).catch(() => undefined);
      last.current = null;
      save({ ...st, group: null });
    },
    setSharing: (v) => {
      if (st.group) groupBackend(st.group.kind).update(st.group, null, v).catch(() => undefined);
      last.current = null;
      save({ ...st, sharing: v });
    },
  }), [st, ready, lastSent, error, save]);

  return <GroupCtx.Provider value={value}>{children}</GroupCtx.Provider>;
}

export function useGroup() {
  const c = useContext(GroupCtx);
  if (!c) throw new Error('GroupProvider eksik');
  return c;
}
