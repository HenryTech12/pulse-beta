import { getSupabase } from './env';
import type { DemoProfile } from '@/types/contract';

// Phone-based auth. Supabase uses email under the hood; we derive a synthetic
// email from the phone number so phone is the user-facing credential.
function phoneToEmail(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  return `${digits}@pulse.local`;
}

export async function signInWithPhone(phone: string, password: string) {
  const supabase = getSupabase();
  const email = phoneToEmail(phone);
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signUpWithPhone(phone: string, password: string, displayName?: string) {
  const supabase = getSupabase();
  const email = phoneToEmail(phone);
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { phone, display_name: displayName || 'Pulse User' } },
  });
  if (error) throw error;

  // Create profile row
  if (data.user) {
    await supabase.from('profiles').upsert({
      id: data.user.id,
      phone,
      display_name: displayName || 'Pulse User',
    });
  }
  return data;
}

export async function signOut() {
  const supabase = getSupabase();
  await supabase.auth.signOut();
}

export async function getSession() {
  const supabase = getSupabase();
  const { data } = await supabase.auth.getSession();
  return data.session;
}

/** Identity-only profile from Supabase. Not to be confused with the real
 * PULSE Personalization payload (archetype, shortfall_amount, etc.), which
 * comes from GET /user/{id}/personalization instead. */
export async function fetchProfile(userId: string): Promise<DemoProfile | null> {
  const supabase = getSupabase();
  const { data } = await supabase
    .from('profiles')
    .select('id, phone, display_name, home_country, preferred_language, last_login_geo')
    .eq('id', userId)
    .maybeSingle();

  if (!data) return null;
  return {
    user_id: data.id,
    display_name: data.display_name ?? 'Pulse User',
    home_country: data.home_country ?? 'NG',
    preferred_language: data.preferred_language ?? 'en',
    last_login_geo: data.last_login_geo ?? undefined,
  };
}

export async function updateLastLoginGeo(userId: string, geo: string) {
  const supabase = getSupabase();
  await supabase.from('profiles').update({ last_login_geo: geo }).eq('id', userId);
}
