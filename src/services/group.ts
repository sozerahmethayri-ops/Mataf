// Aile / grup konumu sunucusu. Supabase yapılandırıldıysa gerçek grup (davet koduyla, yalnız üyeler görür,
// geçmiş tutulmaz); yoksa yalnız bu cihazda çalışan bir önizleme (örnek üyelerle) kullanılır.
// Şema: supabase/schema.sql ("Aile / grup konumu" bölümü).
import { SUPABASE_CONFIGURED, ensureAnonUser, supabase } from './supabase';
import { colorFor, makeCode, type GroupMember } from './groupLogic';

export type GroupInfo = { id: string; code: string; name: string };
export type GroupKind = 'supabase' | 'demo';
export type Pos = { lat: number; lng: number; accuracy?: number | null };

export interface GroupBackend {
  kind: GroupKind;
  create(name: string, member: string, color: string): Promise<GroupInfo>;
  join(code: string, member: string, color: string): Promise<GroupInfo>;
  members(g: GroupInfo): Promise<GroupMember[]>;
  update(g: GroupInfo, pos: Pos | null, sharing: boolean): Promise<void>;
  leave(g: GroupInfo): Promise<void>;
  /** Değişiklik olunca cb çağrılır; dönen işlev aboneliği bitirir. */
  subscribe(g: GroupInfo, cb: () => void): () => void;
}

export const GROUP_SERVER = SUPABASE_CONFIGURED;

type Row = { user_id: string; name: string; color: string; sharing: boolean; lat: number | null; lng: number | null; accuracy: number | null; updated_at: string | null };

class SupabaseGroups implements GroupBackend {
  kind = 'supabase' as const;
  private uid = '';
  private async sb() {
    const sb = supabase();
    if (!sb) throw new Error('Sunucu yapılandırılmamış');
    this.uid = await ensureAnonUser(sb);
    return sb;
  }
  private static info(d: unknown): GroupInfo {
    const g = (Array.isArray(d) ? d[0] : d) as { id: string; code: string; name: string } | null;
    if (!g?.id) throw new Error('Grup bilgisi alınamadı');
    return { id: g.id, code: g.code, name: g.name };
  }
  async create(name: string, member: string, color: string) {
    const sb = await this.sb();
    const { data, error } = await sb.rpc('create_group', { p_name: name, p_member: member, p_color: color });
    if (error) throw new Error(error.message);
    return SupabaseGroups.info(data);
  }
  async join(code: string, member: string, color: string) {
    const sb = await this.sb();
    const { data, error } = await sb.rpc('join_group', { p_code: code, p_member: member, p_color: color });
    if (error) throw new Error(error.message);
    return SupabaseGroups.info(data);
  }
  async members(g: GroupInfo) {
    const sb = await this.sb();
    const { data, error } = await sb.from('group_members').select('user_id,name,color,sharing,lat,lng,accuracy,updated_at').eq('group_id', g.id);
    if (error) throw new Error(error.message);
    return ((data ?? []) as Row[]).map((r) => ({
      userId: r.user_id, name: r.name, color: r.color, sharing: r.sharing,
      lat: r.sharing ? r.lat : null, lng: r.sharing ? r.lng : null, accuracy: r.accuracy,
      updatedAt: r.updated_at ? Date.parse(r.updated_at) : null, me: r.user_id === this.uid,
    }));
  }
  async update(g: GroupInfo, pos: Pos | null, sharing: boolean) {
    const sb = await this.sb();
    const row = pos && sharing
      ? { lat: pos.lat, lng: pos.lng, accuracy: pos.accuracy ?? null, sharing, updated_at: new Date().toISOString() }
      : sharing ? { sharing } : { sharing, lat: null, lng: null, accuracy: null };
    const { error } = await sb.from('group_members').update(row).eq('group_id', g.id).eq('user_id', this.uid);
    if (error) throw new Error(error.message);
  }
  async leave(g: GroupInfo) {
    const sb = await this.sb();
    const { error } = await sb.from('group_members').delete().eq('group_id', g.id).eq('user_id', this.uid);
    if (error) throw new Error(error.message);
  }
  subscribe(g: GroupInfo, cb: () => void) {
    const sb = supabase();
    if (!sb) return () => undefined;
    const ch = sb
      .channel(`group-${g.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'group_members', filter: `group_id=eq.${g.id}` }, () => cb())
      .subscribe();
    return () => { sb.removeChannel(ch); };
  }
}

/** Önizleme: yalnız bu cihazda; örnek üyeler benim çevremde yavaşça dolaşır. */
class DemoGroups implements GroupBackend {
  kind = 'demo' as const;
  private me: GroupMember | null = null;
  private center: Pos = { lat: 21.4225, lng: 39.8262 };
  private t0 = Date.now();
  async create(name: string, member: string, color: string) {
    this.me = { userId: 'me', name: member, color, sharing: true, me: true };
    return { id: 'demo', code: makeCode(), name };
  }
  async join(code: string, member: string, color: string) {
    this.me = { userId: 'me', name: member, color, sharing: true, me: true };
    return { id: 'demo', code, name: 'Önizleme' };
  }
  async members(): Promise<GroupMember[]> {
    const k = (Date.now() - this.t0) / 60e3;
    const c = this.center;
    const fake = (id: string, name: string, dLat: number, dLng: number, ageMin: number): GroupMember => ({
      userId: id, name, color: colorFor(name), sharing: true,
      lat: c.lat + dLat + Math.sin(k + dLat * 1e3) * 0.0002, lng: c.lng + dLng + Math.cos(k + dLng * 1e3) * 0.0002,
      accuracy: 12, updatedAt: Date.now() - ageMin * 60e3,
    });
    return [
      ...(this.me ? [{ ...this.me }] : []),
      fake('d1', 'Annem', 0.0021, 0.0012, 0.5),
      fake('d2', 'Ahmet', -0.0035, 0.0028, 6),
      fake('d3', 'Zeynep', 0.0009, -0.0041, 40),
    ];
  }
  async update(_g: GroupInfo, pos: Pos | null, sharing: boolean) {
    if (pos) this.center = pos;
    if (this.me) this.me = { ...this.me, sharing, lat: sharing && pos ? pos.lat : null, lng: sharing && pos ? pos.lng : null, updatedAt: Date.now() };
  }
  async leave() { this.me = null; }
  subscribe() { return () => undefined; }
}

let real: SupabaseGroups | null = null;
let demo: DemoGroups | null = null;
export function groupBackend(kind: GroupKind): GroupBackend {
  if (kind === 'supabase' && GROUP_SERVER) return (real ??= new SupabaseGroups());
  return (demo ??= new DemoGroups());
}
