// Kapı bildirimleri ve yorumlar. İki arka uç:
//  - Yerel demo (AsyncStorage + örnek bildirimler) — kurulum gerektirmez.
//  - Supabase (gerçek zamanlı, çok kullanıcılı) — EXPO_PUBLIC_SUPABASE_URL ve _ANON_KEY tanımlıysa.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

export type GateStatus = 'open' | 'closed' | 'crowded' | 'exitOnly' | 'entryOnly' | 'women' | 'noAccess';
export type Floor = 'basement' | 'ground' | 'first' | 'roof';

export type Report = {
  id: string;
  gateId: string;
  kind: 'report' | 'comment';
  status?: GateStatus;
  floor?: Floor;
  comment?: string;
  photoUri?: string;
  userId: string;
  userName: string;
  country?: string;
  lang?: string;
  official?: boolean;
  verified?: boolean;
  createdAt: number; // ms
};

export type GateSummary = {
  status: GateStatus;
  source: 'official' | 'crowd' | 'default';
  confirmations: number;
  lastAt?: number;
};

// Kurallar (docs/OTOMATIK-GUNCELLEME.md): resmî bilgi önceliklidir; ziyaretçi bildirimi
// 3 farklı kişi onaylayınca görünür; 2 saatte yeniden onaylanmayan bildirim düşer.
export const MIN_CONFIRMATIONS = 3;
export const REPORT_TTL_MS = 2 * 60 * 60 * 1000;
export const OFFICIAL_TTL_MS = 12 * 60 * 60 * 1000;

export function summarize(reports: Report[], gateId: string, now = Date.now()): GateSummary {
  const rs = reports.filter((r) => r.gateId === gateId && r.kind === 'report' && r.status);
  const official = rs.filter((r) => r.official && now - r.createdAt < OFFICIAL_TTL_MS).sort((a, b) => b.createdAt - a.createdAt)[0];
  const fresh = rs.filter((r) => !r.official && now - r.createdAt < REPORT_TTL_MS);
  const byStatus = new Map<GateStatus, Set<string>>();
  for (const r of fresh) {
    if (!byStatus.has(r.status!)) byStatus.set(r.status!, new Set());
    byStatus.get(r.status!)!.add(r.userId);
  }
  const lastAt = [...fresh, ...(official ? [official] : [])].reduce<number | undefined>((m, r) => Math.max(m ?? 0, r.createdAt), undefined);
  if (official) {
    const agree = byStatus.get(official.status!)?.size ?? 0;
    // Resmî "kapalı" bilgisini, en az 3 kişi "açıldı" derse geçersiz say (resmî kaynak güncellenene kadar)
    const openVotes = byStatus.get('open')?.size ?? 0;
    if (!(official.status !== 'open' && openVotes >= MIN_CONFIRMATIONS && openVotes > agree))
      return { status: official.status!, source: 'official', confirmations: agree, lastAt };
  }
  let best: { s: GateStatus; n: number } | null = null;
  for (const [s, users] of byStatus) if (!best || users.size > best.n) best = { s, n: users.size };
  if (best && best.n >= MIN_CONFIRMATIONS) return { status: best.s, source: 'crowd', confirmations: best.n, lastAt };
  return { status: 'open', source: 'default', confirmations: 0, lastAt };
}

export interface Backend {
  name: 'local' | 'supabase';
  list(): Promise<Report[]>;
  add(r: Omit<Report, 'id' | 'createdAt'>): Promise<Report>;
  subscribe(cb: (r: Report) => void): () => void;
}

const uid = () => Math.random().toString(36).slice(2) + Date.now().toString(36);
const MIN = 60 * 1000;

function seeds(now: number): Report[] {
  const s: Report[] = [];
  const add = (gateId: string, status: GateStatus, users: number, minsAgo: number, extra: Partial<Report> = {}) => {
    for (let i = 0; i < users; i++)
      s.push({ id: `seed-${gateId}-${status}-${i}`, gateId, kind: 'report', status, userId: `seed-${gateId}-${i}`, userName: 'Ziyaretçi', createdAt: now - (minsAgo + i) * MIN, ...extra });
  };
  s.push({ id: 'seed-mk1-off', gateId: 'mk-1', kind: 'report', status: 'closed', userId: 'official', userName: 'Genel Kurum', official: true, createdAt: now - 70 * MIN, comment: 'Bakım çalışması nedeniyle giriş kapalı.' });
  add('mk-1', 'closed', 5, 12);
  add('mk-100', 'crowded', 4, 25);
  add('mk-62', 'crowded', 4, 6);
  add('mk-45', 'exitOnly', 3, 9);
  add('mk-79', 'open', 3, 4);
  const c = (gateId: string, userName: string, country: string, lang: string, minsAgo: number, comment: string) =>
    s.push({ id: uid(), gateId, kind: 'comment', userId: `seed-c-${userName}`, userName, country, lang, comment, createdAt: now - minsAgo * MIN });
  c('mk-1', 'Ahmet', 'TR', 'tr', 12, 'Güvenlik görevlileri Kral Fahd Kapısı’na yönlendiriyor. Kapının önündeki yürüyen merdivenler de çalışmıyor.');
  c('mk-1', 'Siti', 'ID', 'id', 25, 'Di depan pintu ada pembatas. Pengguna kursi roda bisa masuk lewat pintu 79.');
  c('mk-1', 'Usman', 'PK', 'ur', 40, 'باہر نکلنے کا راستہ بھی بند ہے، اجیاد کی طرف سیڑھیوں سے اتریں۔');
  c('mk-62', 'Mehmet', 'TR', 'tr', 6, 'Girişte uzun kuyruk var, yaklaşık 15 dk bekleme.');
  return s;
}

class LocalBackend implements Backend {
  name = 'local' as const;
  private key = 'mataf.reports.v1';
  private listeners = new Set<(r: Report) => void>();
  async list() {
    const raw = await AsyncStorage.getItem(this.key);
    const mine: Report[] = raw ? JSON.parse(raw) : [];
    return [...seeds(Date.now()), ...mine];
  }
  async add(r: Omit<Report, 'id' | 'createdAt'>) {
    const full: Report = { ...r, id: uid(), createdAt: Date.now() };
    const raw = await AsyncStorage.getItem(this.key);
    const mine: Report[] = raw ? JSON.parse(raw) : [];
    const keep = mine.filter((x) => Date.now() - x.createdAt < 24 * 60 * MIN);
    await AsyncStorage.setItem(this.key, JSON.stringify([...keep, full]));
    this.listeners.forEach((l) => l(full));
    return full;
  }
  subscribe(cb: (r: Report) => void) {
    this.listeners.add(cb);
    return () => { this.listeners.delete(cb); };
  }
}

type Row = {
  id: string; gate_id: string; kind: 'report' | 'comment'; status: GateStatus | null; floor: Floor | null; comment: string | null;
  photo_url: string | null; user_id: string; user_name: string; country: string | null; lang: string | null;
  official: boolean; verified: boolean; created_at: string;
};
const fromRow = (x: Row): Report => ({
  id: x.id, gateId: x.gate_id, kind: x.kind, status: x.status ?? undefined, floor: x.floor ?? undefined,
  comment: x.comment ?? undefined, photoUri: x.photo_url ?? undefined, userId: x.user_id, userName: x.user_name,
  country: x.country ?? undefined, lang: x.lang ?? undefined, official: x.official, verified: x.verified,
  createdAt: new Date(x.created_at).getTime(),
});

class SupabaseBackend implements Backend {
  name = 'supabase' as const;
  constructor(private sb: SupabaseClient) {}
  private async ensureUser() {
    const { data } = await this.sb.auth.getSession();
    if (!data.session) await this.sb.auth.signInAnonymously();
  }
  async list() {
    const since = new Date(Date.now() - 24 * 60 * MIN).toISOString();
    const { data, error } = await this.sb.from('reports').select('*').gte('created_at', since).order('created_at', { ascending: false }).limit(2000);
    if (error) throw error;
    return (data as Row[]).map(fromRow);
  }
  async add(r: Omit<Report, 'id' | 'createdAt'>) {
    await this.ensureUser();
    const { data: u } = await this.sb.auth.getUser();
    const row = {
      gate_id: r.gateId, kind: r.kind, status: r.status ?? null, floor: r.floor ?? null, comment: r.comment ?? null,
      photo_url: null, user_id: u.user?.id ?? r.userId, user_name: r.userName, country: r.country ?? null, lang: r.lang ?? null,
      official: false, verified: !!r.verified,
    };
    const { data, error } = await this.sb.from('reports').insert(row).select().single();
    if (error) throw error;
    return fromRow(data as Row);
  }
  subscribe(cb: (r: Report) => void) {
    const ch = this.sb
      .channel('reports-feed')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'reports' }, (p) => cb(fromRow(p.new as Row)))
      .subscribe();
    return () => { this.sb.removeChannel(ch); };
  }
}

export function createBackend(): Backend {
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
  if (url && key) {
    const sb = createClient(url, key, { auth: { storage: AsyncStorage, persistSession: true, autoRefreshToken: true, detectSessionInUrl: false } });
    return new SupabaseBackend(sb);
  }
  return new LocalBackend();
}

export async function localUser() {
  let id = await AsyncStorage.getItem('mataf.user');
  if (!id) { id = 'u-' + uid(); await AsyncStorage.setItem('mataf.user', id); }
  return id;
}
