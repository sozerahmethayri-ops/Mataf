// Ortak Supabase istemcisi (kapı bildirimleri ve aile/grup konumu). EXPO_PUBLIC_SUPABASE_URL ve
// EXPO_PUBLIC_SUPABASE_ANON_KEY derlemede verilmezse null döner; uygulama yerel/önizleme moduyla çalışır.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let client: SupabaseClient | null | undefined;

export const SUPABASE_CONFIGURED = !!(process.env.EXPO_PUBLIC_SUPABASE_URL && process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY);

export function supabase(): SupabaseClient | null {
  if (client !== undefined) return client;
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
  client = url && key
    ? createClient(url, key, { auth: { storage: AsyncStorage, persistSession: true, autoRefreshToken: true, detectSessionInUrl: false } })
    : null;
  return client;
}

/** Anonim oturum (yoksa açar); kullanıcı kimliğini döndürür. Supabase'de "Anonymous sign-ins" açık olmalı. */
export async function ensureAnonUser(sb: SupabaseClient): Promise<string> {
  const { data } = await sb.auth.getSession();
  if (!data.session) {
    const r = await sb.auth.signInAnonymously();
    if (r.error) throw new Error(r.error.message);
  }
  const { data: u, error } = await sb.auth.getUser();
  if (error || !u.user) throw new Error(error?.message ?? 'oturum açılamadı');
  return u.user.id;
}
