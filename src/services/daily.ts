// Günlük içerik seçimi: her gün aynı sırayla bir sonraki öğe (bütün telefonlarda aynı gün aynı dua). React'sız, testli.

/** Yerel takvim gününün sıra numarası (1970'ten beri), saat diliminden ve yaz saatinden bağımsız */
export const dayNumber = (d: Date) => Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 864e5);

/** n öğeli listeden bugünün öğesinin sırası (0..n-1); n = 0 ise -1 */
export const dailyIndex = (d: Date, n: number) => (n > 0 ? ((dayNumber(d) % n) + n) % n : -1);
