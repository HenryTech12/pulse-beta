import { describe, it, expect, beforeEach } from 'vitest';
import { useStore } from '@/store/appStore';

describe('case persistence flow (mock-mode branch)', () => {
  beforeEach(() => {
    useStore.setState({
      session: { user: { id: 'u_demo' } },
      transactions: [
        { tx_id: 'TX-CASE1', user_id: 'u_demo', counterparty: 'X', counterparty_country: 'RU', direction: 'out', channel: 'transfer', amount_ngn: 900000, currency: 'NGN', status: 'flagged', ts: Date.now(), risk_score: 0.9, flags: ['geo_anomaly'] },
      ],
      cases: [],
    });
  });

  it('creates a case with a generated id and pushes it to the front of the list', async () => {
    const c = await useStore.getState().createCaseFromTx('TX-CASE1', 'suspicious geo + amount');
    expect(c.case_id).toMatch(/^C-/);
    expect(c.transaction_ids).toEqual(['TX-CASE1']);
    expect(useStore.getState().cases[0].case_id).toBe(c.case_id);
  });

  it('reassigns a case owner', async () => {
    const c = await useStore.getState().createCaseFromTx('TX-CASE1', 'reason');
    await useStore.getState().assignCase(c.case_id, 'CS');
    expect(useStore.getState().cases.find((x) => x.case_id === c.case_id)?.owner).toBe('CS');
  });

  it('appends a note without dropping existing ones', async () => {
    const c = await useStore.getState().createCaseFromTx('TX-CASE1', 'reason');
    const before = useStore.getState().cases.find((x) => x.case_id === c.case_id)!.notes.length;
    await useStore.getState().addCaseNote(c.case_id, 'follow-up note');
    const after = useStore.getState().cases.find((x) => x.case_id === c.case_id)!.notes;
    expect(after.length).toBe(before + 1);
    expect(after[after.length - 1].body).toBe('follow-up note');
  });
});
