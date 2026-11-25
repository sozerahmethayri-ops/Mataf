// Web önizlemesinde çevrimdışı paket yok (dosya sistemi yok); aynı arayüz boş döner.
import type { Area, Remote } from './offlineMath';

export const OFFLINE_SUPPORTED = false;
export type OfflineIndex = {
  quran?: { editions: string[]; at: number; bytes: number };
  audio?: { reciter: string; count: number; at: number; bytes: number };
  maps?: { areas: Area['id'][]; at: number; bytes: number; tiles: number; remote: Remote };
  lib?: { version: string; at: number };
};
export type Progress = (done: number, total: number, label: string) => void;
export type Cancel = { cancelled: boolean };
const no = async () => { throw new Error('Web sürümünde çevrimdışı paket yok'); };

export const getIndex = (): OfflineIndex => ({});
export const downloadQuran = (_e: string[], _p: Progress, _c: Cancel) => no();
export const offlineSurah = (_n: number, _e: string[]): Record<string, string[]> | null => null;
export const duaAyahs = (): number[] => [];
export const downloadDuaAudio = (_r: string, _p: Progress, _c: Cancel) => no();
export const localAyahAudio = (_g: number, _r: string): string | null => null;
export const downloadMaps = (_a: Area['id'][], _p: Progress, _c: Cancel) => no();
export const offlineMapConfig = (_dark: boolean): { style: object; remote: Remote; libBase?: string } | null => null;
export const readMapFile = async (_p: string): Promise<string | null> => null;
export const deleteOffline = async (_p: 'quran' | 'audio' | 'maps') => undefined;
