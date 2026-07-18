import { describe, it, expect, beforeEach } from 'vitest';
import { useStore } from '@/store/appStore';

describe('finalizeTransfer wallet debiting', () => {
  beforeEach(() => {
    useStore.setState({
      session: { user: { id: 'u_demo' } },
      walletBalance: 100000,
      transactions: [],
      lastTransactionId: 'TX-TEST1',
    });
  });

  it('debits the wallet balance on success', async () => {
    await useStore.getState().finalizeTransfer('success', 25000);
    expect(useStore.getState().walletBalance).toBe(75000);
  });

  it('does not debit the wallet balance on failure', async () => {
    await useStore.getState().finalizeTransfer('failed', 25000);
    expect(useStore.getState().walletBalance).toBe(100000);
  });

  it('updates the matching transaction status', async () => {
    useStore.setState({
      transactions: [
        { tx_id: 'TX-TEST1', user_id: 'u_demo', counterparty: 'X', counterparty_country: 'NG', direction: 'out', channel: 'transfer', amount_ngn: 25000, currency: 'NGN', status: 'flagged', ts: Date.now() },
      ],
    });
    await useStore.getState().finalizeTransfer('success', 25000);
    const tx = useStore.getState().transactions.find((t) => t.tx_id === 'TX-TEST1');
    expect(tx?.status).toBe('success');
  });

  it('leaves balance untouched when there is nothing to debit against', async () => {
    useStore.setState({ walletBalance: null });
    await useStore.getState().finalizeTransfer('success', 25000);
    expect(useStore.getState().walletBalance).toBeNull();
  });
});
