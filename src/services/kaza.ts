// Kaza namazı ve oruç takibi: saf hesaplar (React'e bağlı değil); scripts/check-logic.ts test eder.
// Hanefî mezhebine göre beş vakit farz ve vitir vâcip olduğu için vitrin de kazası tutulur (isteğe bağlı).

export type KazaKey = 'sabah' | 'ogle' | 'ikindi' | 'aksam' | 'yatsi' | 'vitir' | 'oruc';
export const PRAYER_KEYS: KazaKey[] = ['sabah', 'ogle', 'ikindi', 'aksam', 'yatsi', 'vitir'];
export const ALL_KEYS: KazaKey[] = [...PRAYER_KEYS, 'oruc'];

export type KazaState = {
  owed: Record<KazaKey, number>; // toplam borç
  done: Record<KazaKey, number>; // ödenen
  /** Gün gün ödenen sayılar (son 120 gün): 'YYYY-MM-DD' → anahtar → sayı */
  days: Record<string, Partial<Record<KazaKey, number>>>;
  vitir: boolean; // vitri de takip et
  dailyGoal: number; // günde kaç "günlük" (5 ya da 6 namaz) kaza
};

const zero = (): Record<KazaKey, number> => ({ sabah: 0, ogle: 0, ikindi: 0, aksam: 0, yatsi: 0, vitir: 0, oruc: 0 });
export const initialKaza = (): KazaState => ({ owed: zero(), done: zero(), days: {}, vitir: true, dailyGoal: 1 });

export const dayKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
export const remaining = (s: KazaState, k: KazaKey) => Math.max(0, s.owed[k] - s.done[k]);
export const activeKeys = (s: KazaState) => PRAYER_KEYS.filter((k) => k !== 'vitir' || s.vitir);

/** Kalan toplam namaz sayısı (vitir seçiliyse dahil). */
export const prayersLeft = (s: KazaState) => activeKeys(s).reduce((n, k) => n + remaining(s, k), 0);

/** Bir kaza ödendi (+1) ya da geri alındı (−1). Gün kaydı da güncellenir. */
export function markKaza(s: KazaState, k: KazaKey, d: 1 | -1, when: Date): KazaState {
  const doneK = Math.max(0, Math.min(s.owed[k], s.done[k] + d));
  if (doneK === s.done[k]) return s;
  const key = dayKey(when);
  const today = { ...(s.days[key] ?? {}) };
  today[k] = Math.max(0, (today[k] ?? 0) + d);
  // Yalnız son 120 gün tutulur
  const keys = Object.keys({ ...s.days, [key]: today }).sort().slice(-120);
  const days: KazaState['days'] = {};
  for (const x of keys) days[x] = x === key ? today : s.days[x];
  return { ...s, done: { ...s.done, [k]: doneK }, days };
}

/**
 * Hesaplayıcı: kaç gün namaz kılınmadı / oruç tutulmadı → borç. `add` true ise mevcut borca eklenir.
 * Vitir seçili değilse vitrin borcu da yine yazılır ama hesaplara katılmaz.
 */
export function setOwedDays(s: KazaState, prayerDays: number, fastDays: number, add: boolean): KazaState {
  const owed = { ...s.owed };
  for (const k of PRAYER_KEYS) owed[k] = (add ? owed[k] : 0) + Math.max(0, Math.round(prayerDays));
  owed.oruc = (add ? owed.oruc : 0) + Math.max(0, Math.round(fastDays));
  const done = { ...s.done };
  for (const k of ALL_KEYS) done[k] = Math.min(done[k], owed[k]);
  return { ...s, owed, done };
}

/** Yıl/ay/gün → gün (yıl 365, ay 30 gün sayılır; ihtiyat için yukarı yuvarlanır). */
export const toDays = (years: number, months: number, days: number) => Math.ceil(Math.max(0, years) * 365 + Math.max(0, months) * 30 + Math.max(0, days));

/** Bu hızla kaç günde biter? (günde `dailyGoal` günlük kaza) */
export function daysToFinish(s: KazaState) {
  const perDay = activeKeys(s).length * Math.max(1, s.dailyGoal);
  const left = prayersLeft(s);
  return left === 0 ? 0 : Math.ceil(left / perDay);
}

/** Son n gün için gün başına ödenen namaz sayısı (en eskiden en yeniye). */
export function lastDays(s: KazaState, n: number, now: Date, keys: KazaKey[] = PRAYER_KEYS) {
  const out: { key: string; date: Date; count: number }[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
    const k = dayKey(d);
    const rec = s.days[k] ?? {};
    out.push({ key: k, date: d, count: keys.reduce((a, x) => a + (rec[x] ?? 0), 0) });
  }
  return out;
}
