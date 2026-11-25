// Zikir istatistikleri: defter kayıtlarından gün, hafta, ay toplamları, seri ve zikir başına toplam. Saf fonksiyonlar.
export type ZikirLogItem = { at: number; name: string; count: number };

const dayStart = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
const DAY = 86400000;

export function zikirStats(items: ZikirLogItem[], now: Date) {
  const today0 = dayStart(now);
  const byDay = new Map<number, number>();
  for (const i of items) {
    const k = dayStart(new Date(i.at));
    byDay.set(k, (byDay.get(k) ?? 0) + i.count);
  }
  // Son 7 gün (eskiden yeniye); yaz saati geçişlerinde kaymasın diye takvim günüyle
  const week = Array.from({ length: 7 }, (_, j) => {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (6 - j));
    return { date: d, value: byDay.get(d.getTime()) ?? 0 };
  });
  const month0 = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  let month = 0;
  let all = 0;
  const perName = new Map<string, number>();
  for (const i of items) {
    all += i.count;
    if (i.at >= month0) month += i.count;
    perName.set(i.name, (perName.get(i.name) ?? 0) + i.count);
  }
  // Seri: bugün (ya da henüz kayıt yoksa dün) geriye doğru kesintisiz kayıtlı gün sayısı
  let streak = 0;
  let d = byDay.has(today0) ? today0 : today0 - DAY;
  for (;;) {
    const dd = new Date(d);
    const key = new Date(dd.getFullYear(), dd.getMonth(), dd.getDate()).getTime();
    if (!byDay.has(key)) break;
    streak += 1;
    const prev = new Date(dd.getFullYear(), dd.getMonth(), dd.getDate() - 1);
    d = prev.getTime();
  }
  const top = [...perName.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([name, count]) => ({ name, count }));
  return { today: byDay.get(today0) ?? 0, week, weekTotal: week.reduce((s, x) => s + x.value, 0), month, all, streak, top };
}
