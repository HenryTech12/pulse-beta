/*
# Add wallet ledger — real transaction history + a debitable balance

1. Changes to `profiles`
- `wallet_balance_ngn` (numeric, nullable) — the live, debitable wallet
  balance shown on Dashboard/Wallet. Null until first initialized (seeded
  from the real PULSE `current_balance` the first time a user's
  personalization loads), then persists across reloads/devices and is
  decremented on every successful transfer.

2. New Tables
- `wallet_transactions`
  - `id` (uuid, primary key)
  - `owner_id` (uuid, references auth.users) — RLS owner column
  - `tx_id` (text) — the app-level transaction id shown in the UI
  - `pulse_user_id` (text) — the mapped user_XXX id this session was scored under
  - `counterparty`, `counterparty_country`, `direction`, `channel`,
    `amount_ngn`, `currency`, `status`, `ts`
  - `session_id`, `risk_score`, `decision`, `flags` — the PULSE outcome for
    this transaction, when there was one
  - `created_at` (timestamptz, default now())

3. Security
- Enable RLS on `wallet_transactions`.
- Owner-scoped CRUD: a user can only read/write their own rows
  (`owner_id = auth.uid()`), same pattern as `profiles`.

4. Notes
- This is real, persistent per-user transaction history — replacing the
  previous purely in-memory demo list, which reset on every page reload
  and was never written to any database.
- `pulse_user_id` is kept distinct from `owner_id`: `owner_id` is the
  Supabase auth identity (RLS scope), `pulse_user_id` is whichever
  user_XXX id PULSE actually scored this session under (see
  demoUserIdFor in the frontend) — useful context, not a security boundary.
*/

CREATE EXTENSION IF NOT EXISTS pgcrypto;

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS wallet_balance_ngn numeric;

CREATE TABLE IF NOT EXISTS wallet_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tx_id text NOT NULL,
  pulse_user_id text NOT NULL,
  counterparty text NOT NULL DEFAULT 'Unknown',
  counterparty_country text NOT NULL DEFAULT 'NG',
  direction text NOT NULL,
  channel text NOT NULL,
  amount_ngn numeric NOT NULL,
  currency text NOT NULL DEFAULT 'NGN',
  status text NOT NULL,
  ts timestamptz NOT NULL DEFAULT now(),
  session_id text,
  risk_score numeric,
  decision text,
  flags jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS wallet_transactions_owner_ts_idx
  ON wallet_transactions (owner_id, ts DESC);

ALTER TABLE wallet_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_transactions" ON wallet_transactions;
CREATE POLICY "select_own_transactions"
ON wallet_transactions FOR SELECT
TO authenticated
USING (auth.uid() = owner_id);

DROP POLICY IF EXISTS "insert_own_transactions" ON wallet_transactions;
CREATE POLICY "insert_own_transactions"
ON wallet_transactions FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "update_own_transactions" ON wallet_transactions;
CREATE POLICY "update_own_transactions"
ON wallet_transactions FOR UPDATE
TO authenticated
USING (auth.uid() = owner_id)
WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "delete_own_transactions" ON wallet_transactions;
CREATE POLICY "delete_own_transactions"
ON wallet_transactions FOR DELETE
TO authenticated
USING (auth.uid() = owner_id);
