// Aile / grup konumu: saf yardımcılar (testli). Davet kodu, renk, tazelik, mesafe sırası, gönderim sıklığı.

/** Karışmayan harfler (I, O, 0, 1 yok) */
export const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
export const CODE_LEN = 6;

export function normalizeCode(s: string) {
  return s.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, CODE_LEN);
}
export const isValidCode = (s: string) => s.length === CODE_LEN && [...s].every((ch) => CODE_ALPHABET.includes(ch));

export function makeCode(rand: () => number = Math.random) {
  let c = '';
  for (let i = 0; i < CODE_LEN; i++) c += CODE_ALPHABET[Math.floor(rand() * CODE_ALPHABET.length)];
  return c;
}

// Mavi yok: haritada "siz" noktası mavidir, bir üye onunla karışmasın
export const MEMBER_COLORS = ['#C2410C', '#92400E', '#16A34A', '#9333EA', '#DB2777', '#0E7490', '#CA8A04', '#4B5563'];
/** Adın harflerinden kararlı bir renk */
export function colorFor(name: string) {
  let h = 0;
  for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return MEMBER_COLORS[h % MEMBER_COLORS.length];
}

export type Fresh = 'live' | 'recent' | 'stale' | 'none';
/** Konum ne kadar taze: 2 dk altı canlı, 15 dk altı yakın zamanda, daha eski bayat. */
export function freshness(updatedAt: number | null | undefined, now: number): Fresh {
  if (!updatedAt) return 'none';
  const m = (now - updatedAt) / 60e3;
  return m < 2 ? 'live' : m < 15 ? 'recent' : 'stale';
}

export type LL = { lat: number; lng: number };
export function metersBetween(a: LL, b: LL) {
  const R = 6371000;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const s = Math.sin(dLat / 2) ** 2 + Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

export type GroupMember = {
  userId: string;
  name: string;
  color: string;
  sharing: boolean;
  lat?: number | null;
  lng?: number | null;
  accuracy?: number | null;
  updatedAt?: number | null;
  me?: boolean;
};

/** Ben önce, sonra konumu olanlar yakından uzağa, en sonda konumu olmayanlar */
export function sortMembers(list: GroupMember[], me: LL | null) {
  const d = (m: GroupMember) => (me && m.lat != null && m.lng != null ? metersBetween(me, { lat: m.lat, lng: m.lng }) : Infinity);
  return [...list].sort((a, b) => (a.me ? -1 : b.me ? 1 : d(a) - d(b) || a.name.localeCompare(b.name)));
}

/** Konum gönderilsin mi: ilk kez, 25 m'den fazla yer değişince (en az 15 sn arayla) ya da 2 dakikada bir. */
export function shouldSend(last: { at: number; lat: number; lng: number } | null, fix: LL, now: number) {
  if (!last) return true;
  const dt = now - last.at;
  if (dt >= 120e3) return true;
  if (dt < 15e3) return false;
  return metersBetween(last, fix) > 25;
}

export function inviteText(code: string, groupName: string, lang: 'tr' | 'en' | 'ar') {
  if (lang === 'en') return `Join my MATAF group “${groupName}” to see each other on the map. Code: ${code}`;
  if (lang === 'ar') return `انضم إلى مجموعتي «${groupName}» في تطبيق MATAF لنرى بعضنا على الخريطة. الرمز: ${code}`;
  return `MATAF’ta “${groupName}” grubuma katıl, haritada birbirimizi görelim. Kod: ${code}`;
}
