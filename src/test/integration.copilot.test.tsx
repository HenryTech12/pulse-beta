import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AppShell } from '@/components/AppShell';
import { useStore } from '@/store/appStore';

function renderApp() {
  return render(<AppShell />);
}

describe('Copilot integration: suspicious tx -> case', () => {
  beforeEach(async () => {
    // Bypass auth: seed an authenticated session directly in the store
    useStore.setState({
      authReady: true,
      session: { user: { id: 'u_demo' } } as any,
      userId: 'u_demo',
      copilotOpen: false,
    });
    await useStore.getState().init();
    useStore.setState({
      copilotMessages: [
        {
          id: 'welcome',
          role: 'assistant',
          content: 'Hi, I’m the Pulse analyst copilot. Ask me to surface suspicious transactions, cross-check transfers, or draft a case.',
          ts: Date.now(),
        },
      ],
    });
  });

  it('creates a case routed to Compliance from a suspicious transaction', async () => {
    const user = userEvent.setup();
    renderApp();

    // Wait for dashboard ready
    await waitFor(() => expect(screen.getByText(/Wallet balance/i)).toBeInTheDocument(), { timeout: 3000 });

    // Open copilot via FAB
    const fab = screen.getByRole('button', { name: /open analyst copilot/i });
    await user.click(fab);

    // Copilot panel open
    await waitFor(() => expect(screen.getByRole('dialog', { name: /analyst copilot/i })).toBeInTheDocument());

    // Run a suggested prompt
    const prompt = "Show me today's suspicious transactions over ₦50000";
    const input = screen.getByPlaceholderText(/ask copilot/i);
    await user.click(input);
    await user.keyboard(prompt);
    await user.keyboard('{Enter}');

    // Assistant responds with matched transaction TX-1006
    await waitFor(
      () => {
        expect(screen.getAllByText(/TX-1006/).length).toBeGreaterThan(0);
      },
      { timeout: 3000 },
    );

    // Click "Create case" for TX-1006 (the button in the matched-tx row)
    const caseBtn = screen.getAllByRole('button', { name: /create case/i })[0];
    await user.click(caseBtn);

    // Case created confirmation appears with a case id
    await waitFor(
      () => {
        expect(screen.getByText(/case.*created.*routed/i)).toBeInTheDocument();
      },
      { timeout: 3000 },
    );

    // The case now exists in the store, routed to Compliance
    const cases = useStore.getState().cases;
    expect(cases.length).toBeGreaterThan(0);
    const created = cases[0];
    expect(created.transaction_ids).toContain('TX-1006');
    expect(created.owner).toBe('Compliance');
    expect(created.evidence.length).toBeGreaterThan(0);
    expect(created.recommended_action).toMatch(/block|soft_challenge|review/);
  });
});
