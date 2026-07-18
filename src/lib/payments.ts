// Simulated payment rail for the live demo.
//
// This intentionally does NOT move real money. Wiring a real payment
// processor (Paystack/Flutterwave/a bank rail) into a hackathon judging
// environment needs a registered business, PCI-scoped handling of card
// data, and live settlement accounts — none of which is appropriate or
// buildable here, and it isn't what the judging rubric asks for (per the
// Frontend Integration Fix Brief: decisions need to be *visible*, not
// backed by real settlement).
//
// What this DOES give you: a realistic processing → success/decline flow,
// with a small simulated failure/latency rate, gated entirely by the real
// risk decision from PULSE. "block" never reaches the payment step at all.
// If you want an actual sandboxed processor (fake money, real API shape)
// later, Paystack and Flutterwave both have free test-mode keys that behave
// like this module but hit a real endpoint — ask and I'll wire one in.

export interface PaymentResult {
  status: 'success' | 'declined';
  reference: string;
  processedAt: number;
  message: string;
}

function reference(): string {
  return 'PSIM-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).slice(2, 6).toUpperCase();
}

/** Simulates submitting a payment to a processor: brief artificial latency,
 * a small random decline rate so the "failed" state is demoable too. */
export async function runSimulatedPayment(amountNgn: number): Promise<PaymentResult> {
  await new Promise((r) => setTimeout(r, 900 + Math.random() * 700));

  // Extremely large simulated amounts have a higher simulated decline rate,
  // purely for demo variety — this has no bearing on the real risk engine.
  const declineChance = amountNgn > 500_000 ? 0.15 : 0.03;
  const declined = Math.random() < declineChance;

  return declined
    ? {
        status: 'declined',
        reference: reference(),
        processedAt: Date.now(),
        message: 'Simulated processor declined the transaction (insufficient sandbox balance).',
      }
    : {
        status: 'success',
        reference: reference(),
        processedAt: Date.now(),
        message: 'Simulated processor approved the transaction.',
      };
}
