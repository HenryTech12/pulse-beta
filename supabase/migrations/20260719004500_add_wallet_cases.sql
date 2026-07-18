/*
# Add wallet_cases — real, persisted fraud-ops case history

1. New Tables
- `wallet_cases`
  - `id` (uuid, primary key)
  - `owner_id` (uuid, references auth.users) — RLS owner column
  - `case_id` (text) — the app-level case id shown in the UI (e.g. "C-AB12CD")
  - `transaction_ids` (jsonb) — array of tx_id strings this case covers
  - `evidence` (jsonb) — array of evidence card objects
  - `recommended_action` (text) — approve | soft_challenge | block | review
  - `assigned_to` (text) — Compliance | CS | Unassigned (the Case.owner
    field in the app; named `assigned_to` here so it isn't confused with
    `owner_id`, which is the RLS/auth owner of the row, not the team it's
    routed to)
  - `status` (text) — open | in_review | resolved | escalated
  - `notes` (jsonb) — array of {author, body, ts}
  - `confidence` (numeric)
  - `created_at` (timestamptz, default now())

2. Security
- Enable RLS on `wallet_cases`.
- Owner-scoped CRUD: a user can only read/write their own rows
  (`owner_id = auth.uid()`), same pattern as `profiles` and
  `wallet_transactions`.

3. Notes
- Replaces the previous purely in-memory Cases list (mock/fixtures.ts),
  which reset on every page reload. Still used as-is when running in
  VITE_USE_MOCK mode or before a real session exists.
*/

CREATE TABLE IF NOT EXISTS wallet_cases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  case_id text NOT NULL,
  transaction_ids jsonb NOT NULL DEFAULT '[]'::jsonb,
  evidence jsonb NOT NULL DEFAULT '[]'::jsonb,
  recommended_action text NOT NULL,
  assigned_to text NOT NULL DEFAULT 'Unassigned',
  status text NOT NULL DEFAULT 'open',
  notes jsonb NOT NULL DEFAULT '[]'::jsonb,
  confidence numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS wallet_cases_owner_created_idx
  ON wallet_cases (owner_id, created_at DESC);

ALTER TABLE wallet_cases ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_cases" ON wallet_cases;
CREATE POLICY "select_own_cases"
ON wallet_cases FOR SELECT
TO authenticated
USING (auth.uid() = owner_id);

DROP POLICY IF EXISTS "insert_own_cases" ON wallet_cases;
CREATE POLICY "insert_own_cases"
ON wallet_cases FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "update_own_cases" ON wallet_cases;
CREATE POLICY "update_own_cases"
ON wallet_cases FOR UPDATE
TO authenticated
USING (auth.uid() = owner_id)
WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "delete_own_cases" ON wallet_cases;
CREATE POLICY "delete_own_cases"
ON wallet_cases FOR DELETE
TO authenticated
USING (auth.uid() = owner_id);
