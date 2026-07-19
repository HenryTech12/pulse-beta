import { getSupabase } from './env';
import type { DemoProfile } from '@/types/contract';

// Phone-based auth. Supabase uses email under the hood; we derive a synthetic
// email from the phone number so phone is the user-facing credential.
//
// NOTE: this must NOT end in a reserved/special-use TLD (.local, .test,
// .invalid, .example, .localhost) -- newer Supabase Auth projects validate
// signup emails against that list and reject them outright, even though
// nothing ever needs to actually deliver mail to this address.
function phoneToEmail(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  return `${digits}@pulseusers.app`;
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

  // Create profile row -- this must not fail silently. If session.user
  // exists but data.session doesn't (e.g. email confirmation is still
  // required), auth.uid() won't resolve yet and this insert will be
  // rejected by RLS -- previously that error was swallowed, leaving a
  // real auth.users row with no matching profile and permanently blank
  // display_name/home_country/language in the app.
  if (data.user) {
    const { error: profileError } = await supabase.from('profiles').upsert({
      id: data.user.id,
      phone,
      display_name: displayName || 'Pulse User',
    });
    if (profileError) {
      throw new Error(
        `Account created but profile setup failed: ${profileError.message}. ` +
          `This usually means email confirmation is still required in Supabase Auth settings.`,
      );
    }
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
    .select('id, phone, display_name, home_country, preferred_language, last_login_geo, wallet_balance_ngn')
    .eq('id', userId)
    .maybeSingle();

  if (!data) return null;
  return {
    user_id: data.id,
    phone: data.phone,
    display_name: data.display_name ?? 'Pulse User',
    home_country: data.home_country ?? 'NG',
    preferred_language: data.preferred_language ?? 'en',
    last_login_geo: data.last_login_geo ?? undefined,
    wallet_balance_ngn: data.wallet_balance_ngn != null ? Number(data.wallet_balance_ngn) : null,
  };
}

export async function updateLastLoginGeo(userId: string, geo: string) {
  const supabase = getSupabase();
  await supabase.from('profiles').update({ last_login_geo: geo }).eq('id', userId);
}
