/*
# Create profiles table for phone-based auth

1. New Tables
- `profiles`
  - `id` (uuid, primary key, references auth.users)
  - `phone` (text, unique, not null) — the user's phone number used as login
  - `display_name` (text, nullable) — friendly name shown in UI
  - `home_country` (text, default 'NG')
  - `preferred_language` (text, default 'en')
  - `trust_score` (numeric, default 0.5) — 0..1 personalization trust
  - `limits_daily_ngn` (numeric, default 500000) — daily transfer limit in naira
  - `limits_per_tx_ngn` (numeric, default 200000) — per-transaction limit in naira
  - `last_login_geo` (text, nullable)
  - `created_at` (timestamptz, default now())

2. Security
- Enable RLS on `profiles`.
- Owner-scoped CRUD: each authenticated user can only read/modify their own profile row.
- `user_id` is not used; the profile `id` IS the auth user id (1:1 with auth.users).

3. Notes
- Phone number is the primary login identifier. Supabase auth uses email under the hood;
  we derive a synthetic email `<phone>@pulse.local` so the phone number is the user-facing
  credential while still using Supabase's password auth.
- Trust score and limits seed the personalization data the frontend reads after login.
*/

CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  phone text UNIQUE NOT NULL,
  display_name text,
  home_country text NOT NULL DEFAULT 'NG',
  preferred_language text NOT NULL DEFAULT 'en',
  trust_score numeric NOT NULL DEFAULT 0.5,
  limits_daily_ngn numeric NOT NULL DEFAULT 500000,
  limits_per_tx_ngn numeric NOT NULL DEFAULT 200000,
  last_login_geo text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_profile" ON profiles;
CREATE POLICY "select_own_profile"
ON profiles FOR SELECT
TO authenticated
USING (auth.uid() = id);

DROP POLICY IF EXISTS "insert_own_profile" ON profiles;
CREATE POLICY "insert_own_profile"
ON profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "update_own_profile" ON profiles;
CREATE POLICY "update_own_profile"
ON profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "delete_own_profile" ON profiles;
CREATE POLICY "delete_own_profile"
ON profiles FOR DELETE
TO authenticated
USING (auth.uid() = id);
