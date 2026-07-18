import { getSupabase } from './env';
import type { Case, CaseOwner, Evidence, RecommendedAction, Transaction, TxDirection, TxChannel, TxStatus, RiskDecision } from '@/types/contract';

// Real, persistent per-user transaction history + wallet balance, backed
// by the wallet_transactions table and profiles.wallet_balance_ngn
// (see supabase/migrations/20260719003000_add_wallet_ledger.sql). Unlike
// src/lib/mock/fixtures.ts (in-memory, resets on reload, used only in
// VITE_USE_MOCK mode), everything here survives reloads and devices,
// scoped per Supabase auth user via row-level security.
//
// Cases (wallet_cases, see 20260719004500_add_wallet_cases.sql) follow
// the exact same pattern below.

interface WalletTxRow {
  tx_id: string;
  pulse_user_id: string;
  counterparty: string;
  counterparty_country: string;
  direction: string;
  channel: string;
  amount_ngn: number | string;
  currency: string;
  status: string;
  ts: string;
  session_id: string | null;
  risk_score: number | null;
  decision: string | null;
  flags: string[] | null;
}

function rowToTransaction(row: WalletTxRow): Transaction {
  return {
    tx_id: row.tx_id,
    user_id: row.pulse_user_id,
    counterparty: row.counterparty,
    counterparty_country: row.counterparty_country,
    direction: row.direction as TxDirection,
    channel: row.channel as TxChannel,
    amount_ngn: Number(row.amount_ngn),
    currency: row.currency,
    status: row.status as TxStatus,
    ts: new Date(row.ts).getTime(),
    session_id: row.session_id ?? undefined,
    risk_score: row.risk_score ?? undefined,
    decision: (row.decision as RiskDecision | null) ?? undefined,
    flags: row.flags ?? [],
  };
}

export async function listTransactions(ownerId: string): Promise<Transaction[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('wallet_transactions')
    .select('*')
    .eq('owner_id', ownerId)
    .order('ts', { ascending: false })
    .limit(200);
  if (error || !data) return [];
  return (data as WalletTxRow[]).map(rowToTransaction);
}

export async function insertTransaction(ownerId: string, tx: Transaction): Promise<void> {
  const supabase = getSupabase();
  await supabase.from('wallet_transactions').insert({
    owner_id: ownerId,
    tx_id: tx.tx_id,
    pulse_user_id: tx.user_id,
    counterparty: tx.counterparty,
    counterparty_country: tx.counterparty_country,
    direction: tx.direction,
    channel: tx.channel,
    amount_ngn: tx.amount_ngn,
    currency: tx.currency,
    status: tx.status,
    ts: new Date(tx.ts).toISOString(),
    session_id: tx.session_id ?? null,
    risk_score: tx.risk_score ?? null,
    decision: tx.decision ?? null,
    flags: tx.flags ?? [],
  });
}

export async function updateTransactionStatus(
  ownerId: string,
  txId: string,
  status: TxStatus,
): Promise<void> {
  const supabase = getSupabase();
  await supabase
    .from('wallet_transactions')
    .update({ status })
    .eq('owner_id', ownerId)
    .eq('tx_id', txId);
}

export async function setWalletBalance(ownerId: string, balanceNgn: number): Promise<void> {
  const supabase = getSupabase();
  await supabase.from('profiles').update({ wallet_balance_ngn: balanceNgn }).eq('id', ownerId);
}

interface WalletCaseRow {
  case_id: string;
  transaction_ids: string[] | null;
  evidence: Evidence[] | null;
  recommended_action: string;
  assigned_to: string;
  status: string;
  notes: { author: string; body: string; ts: number }[] | null;
  confidence: number | string;
  created_at: string;
}

function rowToCase(row: WalletCaseRow): Case {
  return {
    case_id: row.case_id,
    transaction_ids: row.transaction_ids ?? [],
    evidence: row.evidence ?? [],
    recommended_action: row.recommended_action as RecommendedAction,
    owner: row.assigned_to as CaseOwner,
    status: row.status as Case['status'],
    notes: row.notes ?? [],
    created_at: new Date(row.created_at).getTime(),
    confidence: Number(row.confidence),
  };
}

export async function listCases(ownerId: string): Promise<Case[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('wallet_cases')
    .select('*')
    .eq('owner_id', ownerId)
    .order('created_at', { ascending: false })
    .limit(200);
  if (error || !data) return [];
  return (data as WalletCaseRow[]).map(rowToCase);
}

export async function insertCase(ownerId: string, c: Case): Promise<void> {
  const supabase = getSupabase();
  await supabase.from('wallet_cases').insert({
    owner_id: ownerId,
    case_id: c.case_id,
    transaction_ids: c.transaction_ids,
    evidence: c.evidence,
    recommended_action: c.recommended_action,
    assigned_to: c.owner,
    status: c.status,
    notes: c.notes,
    confidence: c.confidence,
    created_at: new Date(c.created_at).toISOString(),
  });
}

export async function updateCaseRow(
  ownerId: string,
  caseId: string,
  patch: Partial<Pick<Case, 'owner' | 'status' | 'notes'>>,
): Promise<void> {
  const supabase = getSupabase();
  const row: Record<string, unknown> = {};
  if (patch.owner !== undefined) row.assigned_to = patch.owner;
  if (patch.status !== undefined) row.status = patch.status;
  if (patch.notes !== undefined) row.notes = patch.notes;
  if (Object.keys(row).length === 0) return;
  await supabase.from('wallet_cases').update(row).eq('owner_id', ownerId).eq('case_id', caseId);
}
