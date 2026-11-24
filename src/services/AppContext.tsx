import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

import { DESTINATIONS, type City } from '@/data/sites';

type Ctx = {
  city: City;
  setCity: (c: City) => void;
  destId: string;
  setDestId: (id: string) => void;
};

const AppContext = createContext<Ctx | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [city, setCityState] = useState<City>('makkah');
  const [destId, setDestId] = useState('mataf');
  useEffect(() => {
    AsyncStorage.getItem('mataf.city').then((v) => {
      if (v === 'makkah' || v === 'madinah') {
        setCityState(v);
        setDestId(v === 'makkah' ? 'mataf' : 'rawdah');
      }
    });
  }, []);
  const value = useMemo<Ctx>(() => ({
    city,
    setCity: (c) => {
      setCityState(c);
      AsyncStorage.setItem('mataf.city', c);
      if (!DESTINATIONS.some((d) => d.id === destId && d.city === c)) setDestId(c === 'makkah' ? 'mataf' : 'rawdah');
    },
    destId,
    setDestId,
  }), [city, destId]);
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}
