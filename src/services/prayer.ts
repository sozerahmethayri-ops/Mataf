// Namaz vakitleri telefonda hesaplanır (adhan). İnternet gerekmez.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CalculationMethod, Coordinates, PrayerTimes, Qibla, type CalculationParameters } from 'adhan';

export type MethodId = 'UmmAlQura' | 'Turkey' | 'MuslimWorldLeague' | 'Egyptian' | 'Karachi' | 'NorthAmerica' | 'Dubai';

export const METHODS: { id: MethodId; label: string; make: () => CalculationParameters }[] = [
  { id: 'UmmAlQura', label: "Ümmü'l-Kurâ (Mekke)", make: () => CalculationMethod.UmmAlQura() },
  { id: 'Turkey', label: 'Diyanet (Türkiye)', make: () => CalculationMethod.Turkey() },
  { id: 'MuslimWorldLeague', label: 'Muslim World League', make: () => CalculationMethod.MuslimWorldLeague() },
  { id: 'Egyptian', label: 'Egyptian General Authority', make: () => CalculationMethod.Egyptian() },
  { id: 'Karachi', label: 'Karachi', make: () => CalculationMethod.Karachi() },
  { id: 'NorthAmerica', label: 'ISNA (Kuzey Amerika)', make: () => CalculationMethod.NorthAmerica() },
  { id: 'Dubai', label: 'Dubai', make: () => CalculationMethod.Dubai() },
];

export const PLACES = {
  makkah: { lat: 21.4225, lng: 39.8262, tz: 'Asia/Riyadh' },
  madinah: { lat: 24.4672, lng: 39.6111, tz: 'Asia/Riyadh' },
};

export type PrayerKey = 'fajr' | 'sunrise' | 'dhuhr' | 'asr' | 'maghrib' | 'isha';
export const PRAYERS: PrayerKey[] = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'];

export function times(lat: number, lng: number, method: MethodId, date = new Date()) {
  const params = (METHODS.find((m) => m.id === method) ?? METHODS[0]).make();
  const pt = new PrayerTimes(new Coordinates(lat, lng), date, params);
  return { fajr: pt.fajr, sunrise: pt.sunrise, dhuhr: pt.dhuhr, asr: pt.asr, maghrib: pt.maghrib, isha: pt.isha } as Record<PrayerKey, Date>;
}

export function nextPrayer(lat: number, lng: number, method: MethodId, now = new Date()) {
  const today = times(lat, lng, method, now);
  for (const k of PRAYERS) if (today[k] > now) return { key: k, at: today[k], prev: prevOf(k, today, lat, lng, method, now) };
  const tomorrow = new Date(now.getTime() + 24 * 3600 * 1000);
  const t2 = times(lat, lng, method, tomorrow);
  return { key: 'fajr' as PrayerKey, at: t2.fajr, prev: today.isha };
}

/**
 * Ekranda gösterilecek günün vakitleri. Yatsı geçince yarının vakitleri döner; böylece vurgulanan
 * imsak ile geri sayımın saati aynı olur (küçük uygulama da böyle davranır).
 */
export function shownDay(lat: number, lng: number, method: MethodId, now = new Date()) {
  const today = times(lat, lng, method, now);
  if (today.isha > now) return { t: today, date: now, tomorrow: false };
  const date = new Date(now.getTime() + 24 * 3600 * 1000);
  return { t: times(lat, lng, method, date), date, tomorrow: true };
}

function prevOf(k: PrayerKey, today: Record<PrayerKey, Date>, lat: number, lng: number, method: MethodId, now: Date) {
  const i = PRAYERS.indexOf(k);
  if (i > 0) return today[PRAYERS[i - 1]];
  const y = times(lat, lng, method, new Date(now.getTime() - 24 * 3600 * 1000));
  return y.isha;
}

export const qiblaDeg = (lat: number, lng: number) => Qibla(new Coordinates(lat, lng));

export function guessMethod(): MethodId {
  let tz = '';
  try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone ?? ''; } catch { /* yok */ }
  if (tz === 'Europe/Istanbul') return 'Turkey';
  if (tz === 'Asia/Riyadh' || tz === 'Asia/Aden' || tz === 'Asia/Qatar' || tz === 'Asia/Bahrain' || tz === 'Asia/Kuwait') return 'UmmAlQura';
  if (tz === 'Asia/Dubai' || tz === 'Asia/Muscat') return 'Dubai';
  if (tz.startsWith('America/')) return 'NorthAmerica';
  if (tz === 'Asia/Karachi' || tz === 'Asia/Kolkata' || tz === 'Asia/Dhaka') return 'Karachi';
  if (tz === 'Africa/Cairo') return 'Egyptian';
  return 'MuslimWorldLeague';
}

export async function getMethod(): Promise<MethodId> {
  return ((await AsyncStorage.getItem('mataf.method')) as MethodId) || guessMethod();
}
export async function setMethod(m: MethodId) {
  await AsyncStorage.setItem('mataf.method', m);
}

export function fmtTime(d: Date, tz?: string) {
  try {
    return new Intl.DateTimeFormat('tr-TR', { hour: '2-digit', minute: '2-digit', timeZone: tz }).format(d);
  } catch {
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  }
}

export function hijri(d: Date, lang: string) {
  try {
    return new Intl.DateTimeFormat(`${lang}-u-ca-islamic-umalqura`, { day: 'numeric', month: 'long', year: 'numeric' }).format(d);
  } catch {
    return '';
  }
}
