// Namaz takibi (yalnız bu telefonda): hangi gün hangi farz namazın kılındığı. React'sız; testleri scripts/check-logic.ts'te.
// Kayıt biçimi: { 'YYYY-MM-DD': bit maskesi }; bit sırası LOG_PRAYERS (sabah 1, öğle 2, ikindi 4, akşam 8, yatsı 16).
// Seri gün bitmeden bozulmaz ve kayıp gösterilmez: amaç suçluluk değil, kişinin kendi düzenini görmesi.

export const LOG_PRAYERS = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'] as const;
export type LogPrayer = (typeof LOG_PRAYERS)[number];
export type PrayerLog = Record<string, number>;
export const LOG_KEY = 'prayer:log';
/** Beş vaktin hepsi işaretli */
export const FULL_DAY = 31;

const pad = (n: number) => String(n).padStart(2, '0');
/** Yerel takvim günü anahtarı, ör. 2026-11-27 */
export const dayKey = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const bit = (p: LogPrayer) => 1 << LOG_PRAYERS.indexOf(p);
/** Öğle saatinde sabitlenmiş gün (yaz saati geçişlerinde gün kaymasın) */
const noon = (d: Date, minusDays = 0) => new Date(d.getFullYear(), d.getMonth(), d.getDate() - minusDays, 12);

export const isDone = (log: PrayerLog, day: string, p: LogPrayer) => ((log[day] ?? 0) & bit(p)) !== 0;

/** O gün işaretlenen vakit sayısı (0–5) */
export function countDay(log: PrayerLog, day: string) {
  let v = log[day] ?? 0;
  let n = 0;
  while (v) {
    n += v & 1;
    v >>= 1;
  }
  return n;
}

/** Günlerin toplamı */
export const countDays = (log: PrayerLog, days: string[]) => days.reduce((s, d) => s + countDay(log, d), 0);

/** İşareti aç ya da kapat; boşalan gün kayıttan silinir. Yeni nesne döner. */
export function toggle(log: PrayerLog, day: string, p: LogPrayer): PrayerLog {
  const v = (log[day] ?? 0) ^ bit(p);
  const next = { ...log };
  if (v) next[day] = v;
  else delete next[day];
  return next;
}

/** Bugün dahil son n günün anahtarları, eskiden yeniye */
export function lastDays(today: Date, n: number): string[] {
  const out: string[] = [];
  for (let i = n - 1; i >= 0; i--) out.push(dayKey(noon(today, i)));
  return out;
}

/** Beş vakti tam, art arda gün sayısı. Bugün tamamsa bugünden, değilse dünden geriye sayar (gün bitmeden seri bozulmaz). */
export function streak(log: PrayerLog, today: Date): number {
  let i = log[dayKey(noon(today))] === FULL_DAY ? 0 : 1;
  let n = 0;
  for (; n < 3660; i++) {
    if (log[dayKey(noon(today, i))] !== FULL_DAY) break;
    n++;
  }
  return n;
}

/** Çok eski günleri atar (varsayılan 400 gün); kayıt küçük kalsın. */
export function prune(log: PrayerLog, today: Date, keep = 400): PrayerLog {
  const min = dayKey(noon(today, keep));
  const out: PrayerLog = {};
  for (const k of Object.keys(log)) if (k >= min) out[k] = log[k];
  return out;
}

/** Bozuk ya da elle değiştirilmiş kaydı temizler: yalnız geçerli gün anahtarları ve 1–31 değerleri kalır. */
export function sanitize(raw: unknown): PrayerLog {
  const out: PrayerLog = {};
  if (!raw || typeof raw !== 'object') return out;
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    if (/^\d{4}-\d{2}-\d{2}$/.test(k) && typeof v === 'number' && Number.isInteger(v) && v > 0 && v <= FULL_DAY) out[k] = v;
  }
  return out;
}
