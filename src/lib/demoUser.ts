// The real PULSE backend only has personalization_profiles.json entries
// for 40 synthetic demo users: user_000 .. user_039. Supabase auth ids are
// random UUIDs that will never match one of those, so GET
// /user/{id}/personalization always 404s for a real logged-in account.
//
// Rather than requiring people to manually type a seeded id after every
// login, map each Supabase account deterministically onto one of the 40
// seeded users -- same login always lands on the same demo persona, and
// personalization always resolves.

const SEEDED_USER_COUNT = 40;

function stableHash(input: string): number {
  // djb2 -- simple, fast, good enough distribution for 40 buckets.
  let hash = 5381;
  for (let i = 0; i < input.length; i++) {
    hash = (hash * 33) ^ input.charCodeAt(i);
  }
  return Math.abs(hash);
}

/** Maps any auth id (Supabase UUID, phone number, etc.) onto one of the
 * seeded user_000..user_039 ids the real backend has profiles for. Pass
 * through ids that already look like a seeded id unchanged, so manual
 * overrides in Settings/Simulator still work as typed. */
export function demoUserIdFor(authId: string): string {
  if (/^user_\d{3}$/.test(authId)) return authId;
  const bucket = stableHash(authId) % SEEDED_USER_COUNT;
  return `user_${String(bucket).padStart(3, '0')}`;
}
