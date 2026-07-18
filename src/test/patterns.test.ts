import { describe, it, expect } from 'vitest';
import { evaluatePatterns, PATTERN_RULES, confidenceFor } from '@/lib/patterns';
import { mockFixtures } from '@/lib/mock/fixtures';
import type { Transaction } from '@/types/contract';

const base: Transaction = {
  tx_id: 'X', user_id: 'u', counterparty: 'c', counterparty_country: 'NG',
  direction: 'out', channel: 'transfer', amount_ngn: 1000, currency: 'NGN',
  status: 'success', ts: Date.now(),
};

describe('pattern rules', () => {
  it('flags large amounts over 50000 naira', () => {
    const rule = PATTERN_RULES.find((r) => r.id === 'large_amount')!;
    expect(rule.match({ ...base, amount_ngn: 51000 })).toBe(true);
    expect(rule.match({ ...base, amount_ngn: 5000 })).toBe(false);
  });

  it('flags geo anomaly when country differs', () => {
    const rule = PATTERN_RULES.find((r) => r.id === 'geo_anomaly')!;
    expect(rule.match({ ...base, counterparty_country: 'RU' })).toBe(true);
    expect(rule.match({ ...base, counterparty_country: 'NG' })).toBe(false);
  });

  it('evaluatePatterns collects hits across transactions', () => {
    const txs = mockFixtures.getTransactions();
    const hits = evaluatePatterns(txs);
    expect(hits.length).toBeGreaterThan(0);
    expect(hits.some((h) => h.tx.tx_id === 'TX-1006')).toBe(true);
  });

  it('confidenceFor stays in [0,1] and rises with severity', () => {
    const low = confidenceFor({ ...base, amount_ngn: 500 });
    const high = confidenceFor({ ...base, amount_ngn: 760000, flags: ['geo_anomaly', 'rapid_repeat'] });
    expect(low).toBeGreaterThanOrEqual(0);
    expect(low).toBeLessThanOrEqual(1);
    expect(high).toBeGreaterThan(low);
  });
});
