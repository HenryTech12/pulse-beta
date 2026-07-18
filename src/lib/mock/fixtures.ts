import type {
  Transaction,
  Case,
  TxDirection,
  TxChannel,
  SessionEventRequest,
  SessionEventResponse,
  Personalization,
  RiskDecision,
} from '@/types/contract';

const NOW = Date.now();
const HOUR = 3600_000;

function tx(p: Partial<Transaction> & { tx_id: string }): Transaction {
  return {
    user_id: 'u_demo',
    counterparty: 'Unknown',
    counterparty_country: 'NG',
    direction: 'out' as TxDirection,
    channel: 'transfer' as TxChannel,
    amount_ngn: 0,
    currency: 'NGN',
    status: 'success',
    ts: NOW - 2 * HOUR,
    risk_score: 0.12,
    flags: [],
    ...p,
  };
}

const seedTransactions: Transaction[] = [
  tx({ tx_id: 'TX-1001', counterparty: 'Adaeze N.', direction: 'out', channel: 'transfer', amount_ngn: 18500, status: 'success', ts: NOW - 1 * HOUR, risk_score: 0.08 }),
  tx({ tx_id: 'TX-1002', counterparty: 'BettingHub', direction: 'out', channel: 'betting', amount_ngn: 52000, status: 'success', ts: NOW - 3 * HOUR, risk_score: 0.21 }),
  tx({ tx_id: 'TX-1003', counterparty: 'MTN Airtime', direction: 'out', channel: 'airtime', amount_ngn: 3500, status: 'success', ts: NOW - 5 * HOUR, risk_score: 0.04 }),
  tx({ tx_id: 'TX-1004', counterparty: 'Tunde A.', direction: 'in', channel: 'transfer', amount_ngn: 132000, status: 'success', ts: NOW - 6 * HOUR, risk_score: 0.15 }),
  tx({ tx_id: 'TX-1005', counterparty: 'Wallet Top-up', counterparty_country: 'US', direction: 'in', channel: 'topup', amount_ngn: 205000, status: 'success', ts: NOW - 9 * HOUR, risk_score: 0.1 }),
  tx({ tx_id: 'TX-1006', counterparty: 'Unknown Beneficiary', direction: 'out', channel: 'transfer', amount_ngn: 760000, status: 'flagged', ts: NOW - 12 * HOUR, risk_score: 0.92, decision: 'block', session_id: 'S-SEED1006', flags: ['large_amount', 'geo_anomaly', 'rapid_repeat'] }),
  tx({ tx_id: 'TX-1007', counterparty: 'Unknown Beneficiary', direction: 'out', channel: 'transfer', amount_ngn: 715000, status: 'flagged', ts: NOW - 12 * HOUR - 60_000, risk_score: 0.9, decision: 'block', session_id: 'S-SEED1007', flags: ['large_amount', 'rapid_repeat'] }),
  tx({ tx_id: 'TX-1008', counterparty: 'Bet9ja', direction: 'out', channel: 'betting', amount_ngn: 31000, status: 'pending', ts: NOW - 26 * HOUR, risk_score: 0.18 }),
  tx({ tx_id: 'TX-1009', counterparty: 'Glo Airtime', direction: 'out', channel: 'airtime', amount_ngn: 5000, status: 'success', ts: NOW - 30 * HOUR, risk_score: 0.05 }),
  tx({ tx_id: 'TX-1010', counterparty: 'Chidi O.', direction: 'out', channel: 'transfer', amount_ngn: 98000, status: 'success', ts: NOW - 40 * HOUR, risk_score: 0.2 }),
];

class MockStore {
  private transactions: Transaction[] = [...seedTransactions];
  private cases: Case[] = [];

  getTransactions(): Transaction[] {
    return [...this.transactions].sort((a, b) => b.ts - a.ts);
  }

  addTransaction(t: Transaction) {
    this.transactions.unshift(t);
  }

  createCase(payload: Omit<Case, 'case_id' | 'created_at'>): Case {
    const c: Case = { ...payload, case_id: 'C-' + Math.random().toString(36).slice(2, 8).toUpperCase(), created_at: Date.now() };
    this.cases.unshift(c);
    return c;
  }

  updateCase(id: string, patch: Partial<Case>): Case {
    const idx = this.cases.findIndex((c) => c.case_id === id);
    if (idx < 0) throw new Error('case not found');
    this.cases[idx] = { ...this.cases[idx], ...patch };
    return this.cases[idx];
  }

  getCases(): Case[] {
    return [...this.cases];
  }
}

export const mockFixtures = new MockStore();

// ---------------------------------------------------------------------------
// Mock implementations of the REAL backend contract (used only when
// VITE_USE_MOCK=true, i.e. api.py isn't running). Mirrors api.py's own
// documented fallback behavior so switching to the live backend later
// changes nothing about how the UI consumes the response.
// ---------------------------------------------------------------------------

export function mockDecisionFor(payload: SessionEventRequest): SessionEventResponse {
  const amount = payload.transaction_amount ?? 0;
  const avgInterval =
    payload.keystroke_intervals.length > 0
      ? payload.keystroke_intervals.reduce((s, v) => s + v, 0) / payload.keystroke_intervals.length
      : 150;
  const isOffHours = payload.hour_of_day < 5 || payload.hour_of_day > 23;
  const isBotLikeTyping = avgInterval < 25;

  let score = 0.1;
  if (amount > 500_000) score += 0.35;
  else if (amount > 100_000) score += 0.15;
  if (isOffHours) score += 0.15;
  if (isBotLikeTyping) score += 0.25;
  if (payload.screen_sequence.length <= 2) score += 0.1;
  score = Math.min(0.99, score);

  const decision: RiskDecision = score > 0.75 ? 'block' : score > 0.4 ? 'soft_challenge' : 'approve';
  const reasoning =
    decision === 'block'
      ? 'Large transaction combined with atypical session timing did not match this user\'s known pattern.'
      : decision === 'soft_challenge'
        ? 'Session shows a new signal, but overall timing is broadly consistent with this user.'
        : 'Session timing and amount are consistent with this user\'s established pattern.';

  return {
    user_id: payload.user_id,
    risk_score: Number(score.toFixed(3)),
    is_cold_start: payload.keystroke_intervals.length === 0,
    decision,
    reasoning,
    source: 'fallback',
  };
}

const seedPersonalization: Record<string, Personalization> = {
  u_demo: {
    user_id: 'u_demo',
    archetype: 'Weekend Planner',
    preferred_check_day: 5,
    preferred_check_hour: 19.2,
    estimated_recurring_amount: 85000,
    days_until_due: 6,
    current_balance: 62000,
    projected_balance: 48000,
    shortfall_amount: 37000,
  },
};

export function mockPersonalizationFor(userId: string): Personalization {
  return seedPersonalization[userId] ?? { ...seedPersonalization.u_demo, user_id: userId };
}

export { NOW as MOCK_NOW };
