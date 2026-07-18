import { describe, it, expect } from 'vitest';
import { getProvider, buildEvidence, recommend } from '@/lib/copilot';
import { mockFixtures } from '@/lib/mock/fixtures';
import type { Transaction } from '@/types/contract';

const ctx = () => ({
  transactions: mockFixtures.getTransactions(),
});

describe('copilot mock provider', () => {
  it('returns suspicious transactions over a threshold', async () => {
    const res = await getProvider().run("Show me today's suspicious transactions over ₦50000", ctx());
    expect(res.matched_tx_ids.length).toBeGreaterThan(0);
    expect(res.matched_tx_ids).toContain('TX-1006');
    expect(res.evidence.length).toBeGreaterThan(0);
  });

  it('cross-checks transfers to Nigeria in last 24 hours', async () => {
    const res = await getProvider().run('Cross-check transfers to Nigeria in last 24 hours', ctx());
    expect(res.content).toMatch(/transfer/i);
  });

  it('drafts a case for a specific transaction', async () => {
    const res = await getProvider().run("Create case for transaction TX-1006 with reason 'sender mismatch'", ctx());
    expect(res.matched_tx_ids).toEqual(['TX-1006']);
    expect(res.recommended_action).toMatch(/block|soft_challenge|review/);
  });

  it('handles unknown transaction id gracefully', async () => {
    const res = await getProvider().run('Create case for transaction NOPE-999', ctx());
    expect(res.matched_tx_ids).toEqual([]);
  });
});

describe('evidence + recommend helpers', () => {
  const tx: Transaction = mockFixtures.getTransactions().find((t) => t.tx_id === 'TX-1006')!;

  it('buildEvidence produces multiple evidence kinds', () => {
    const ev = buildEvidence(tx);
    const kinds = ev.map((e) => e.kind);
    expect(kinds).toContain('session_replay');
    expect(kinds).toContain('pattern_match');
    expect(ev.length).toBeGreaterThanOrEqual(2);
  });

  it('recommend returns block for high risk', () => {
    expect(recommend({ ...tx, risk_score: 0.95 })).toBe('block');
    expect(recommend({ ...tx, risk_score: 0.1 })).toBe('approve');
  });
});
