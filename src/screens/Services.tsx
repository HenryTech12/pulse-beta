import { useState } from 'react';
import { useStore } from '@/store/appStore';
import { Card, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Send, Check, X, Loader2 } from 'lucide-react';
import { ngn } from '@/types/contract';

export function Transfer() {
  const { trackScreen, trackKeystroke, submitSession, runPayment, paymentResult, clearPaymentResult, userId } = useStore();
  const [step, setStep] = useState<'recipient' | 'amount' | 'confirm' | 'checking' | 'paying' | 'done' | 'blocked'>('recipient');
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');

  const goto = (s: typeof step, screen?: Parameters<typeof trackScreen>[0]) => {
    if (screen) trackScreen(screen);
    setStep(s);
  };

  const confirmAndSend = async () => {
    trackScreen('confirm');
    goto('checking');
    const proceed = await submitSession(Number(amount));
    if (!proceed) {
      goto('blocked');
      return;
    }
    goto('paying');
    const result = await runPayment(Number(amount));
    goto(result.status === 'success' ? 'done' : 'blocked');
  };

  const reset = () => {
    clearPaymentResult();
    setRecipient('');
    setAmount('');
    goto('recipient', 'transfer');
  };

  if (step === 'checking') {
    return (
      <Card>
        <CardBody className="text-center py-14">
          <Loader2 size={32} className="mx-auto animate-spin text-brand-600" />
          <p className="mt-4 text-ink-600 font-medium">Checking this session with PULSE…</p>
          <p className="text-xs text-ink-400 mt-1">Sending screen sequence + keystroke timing to /session/event</p>
        </CardBody>
      </Card>
    );
  }

  if (step === 'paying') {
    return (
      <Card>
        <CardBody className="text-center py-14">
          <Loader2 size={32} className="mx-auto animate-spin text-brand-600" />
          <p className="mt-4 text-ink-600 font-medium">Processing payment…</p>
          <p className="text-xs text-ink-400 mt-1">Simulated sandbox rail — no real funds move in this demo.</p>
        </CardBody>
      </Card>
    );
  }

  if (step === 'blocked') {
    return (
      <Card>
        <CardBody className="text-center py-10">
          <div className="h-16 w-16 rounded-full bg-red-50 text-danger mx-auto flex items-center justify-center">
            <X size={32} />
          </div>
          <h2 className="text-xl font-bold mt-4">Transfer stopped</h2>
          <p className="text-ink-500 mt-1">
            {paymentResult?.status === 'declined' ? paymentResult.message : 'The session was blocked or the transfer was cancelled.'}
          </p>
          <Button className="mt-6" onClick={reset}>Try again</Button>
        </CardBody>
      </Card>
    );
  }

  if (step === 'done') {
    return (
      <Card>
        <CardBody className="text-center py-10">
          <div className="h-16 w-16 rounded-full bg-brand-50 text-brand-600 mx-auto flex items-center justify-center">
            <Check size={32} />
          </div>
          <h2 className="text-xl font-bold mt-4">Transfer sent</h2>
          <p className="text-ink-500 mt-1">{ngn(Number(amount))} to {recipient}</p>
          {paymentResult && (
            <p className="text-xs text-ink-400 mt-2 font-mono">ref {paymentResult.reference}</p>
          )}
          <Button className="mt-6" onClick={reset}>New transfer</Button>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card>
      <CardBody className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-lg">Send money</h2>
          <Badge tone="neutral">user {userId.slice(0, 10)}</Badge>
        </div>
        {step === 'recipient' && (
          <>
            <label className="block text-sm">
              <span className="text-ink-500">Recipient name or handle</span>
              <input
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                onKeyDown={trackKeystroke}
                onFocus={() => trackScreen('transfer')}
                placeholder="e.g. Adaeze N."
                className="mt-1 w-full h-12 px-3 rounded-xl border border-ink-200 focus:border-brand-400"
              />
            </label>
            <Button block disabled={!recipient} onClick={() => goto('amount', 'transfer')}>
              Continue
            </Button>
          </>
        )}
        {step === 'amount' && (
          <>
            <label className="block text-sm">
              <span className="text-ink-500">Amount (₦)</span>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                onKeyDown={trackKeystroke}
                placeholder="0.00"
                className="mt-1 w-full h-12 px-3 rounded-xl border border-ink-200 focus:border-brand-400 text-lg"
              />
            </label>
            <Button block disabled={!amount || Number(amount) <= 0} onClick={() => goto('confirm', 'confirm')}>
              Continue
            </Button>
          </>
        )}
        {step === 'confirm' && (
          <>
            <div className="rounded-xl bg-ink-50 p-4 space-y-2">
              <Row label="To" value={recipient} />
              <Row label="Amount" value={ngn(Number(amount))} />
              <Row label="Fee" value={ngn(0)} />
            </div>
            <Button block leftIcon={<Send size={16} />} onClick={confirmAndSend}>
              Confirm & send
            </Button>
          </>
        )}
      </CardBody>
    </Card>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-ink-500">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

export function Airtime() {
  return (
    <Card>
      <CardBody>
        <h2 className="font-semibold text-lg mb-3">Buy airtime</h2>
        <p className="text-xs text-ink-400 mb-3">Demo screen — not wired to a real telco or to PULSE.</p>
        <div className="grid grid-cols-3 gap-2 mb-4">
          {['MTN', 'Glo', 'Airtel'].map((p) => (
            <button key={p} className="py-3 rounded-xl bg-ink-100 hover:bg-ink-200 font-medium text-sm">{p}</button>
          ))}
        </div>
        <input placeholder="Phone number" className="w-full h-12 px-3 rounded-xl border border-ink-200 focus:border-brand-400 mb-3" />
        <input placeholder="Amount (₦)" className="w-full h-12 px-3 rounded-xl border border-ink-200 focus:border-brand-400 mb-4" />
        <Button block>Buy airtime</Button>
      </CardBody>
    </Card>
  );
}

export function Betting() {
  return (
    <Card>
      <CardBody>
        <h2 className="font-semibold text-lg mb-3">Betting wallet</h2>
        <p className="text-xs text-ink-400 mb-3">Demo screen — not wired to a real provider or to PULSE.</p>
        <div className="grid grid-cols-2 gap-2 mb-4">
          {['Bet9ja', 'SportyBet', '1xBet', 'BangBet'].map((p) => (
            <button key={p} className="py-3 rounded-xl bg-ink-100 hover:bg-ink-200 font-medium text-sm">{p}</button>
          ))}
        </div>
        <input placeholder="Amount (₦)" className="w-full h-12 px-3 rounded-xl border border-ink-200 focus:border-brand-400 mb-4" />
        <Button block>Fund betting</Button>
      </CardBody>
    </Card>
  );
}

export function Wallet() {
  const { personalization } = useStore();
  return (
    <Card>
      <CardBody className="space-y-4">
        <h2 className="font-semibold text-lg">Balance</h2>
        <div className="rounded-xl bg-brand-50 p-4">
          <p className="text-brand-700 text-sm">Current balance</p>
          <p className="text-2xl font-bold text-brand-700">
            {personalization ? ngn(personalization.current_balance) : '—'}
          </p>
        </div>
        <div className="rounded-xl bg-ink-50 p-4">
          <p className="text-ink-500 text-sm">Projected balance ({personalization?.days_until_due ?? '—'} days out)</p>
          <p className="text-xl font-semibold text-ink-800">
            {personalization ? ngn(personalization.projected_balance) : '—'}
          </p>
          {personalization && personalization.shortfall_amount > 0 && (
            <p className="text-xs text-danger mt-1">
              Projected shortfall of {ngn(personalization.shortfall_amount)} before your next recurring payment.
            </p>
          )}
        </div>
        <Button block leftIcon={<Send size={16} />}>Top-up wallet</Button>
      </CardBody>
    </Card>
  );
}

export function Settings() {
  const { profile, personalization, setUserId, userId } = useStore();
  return (
    <Card>
      <CardBody className="space-y-4">
        <h2 className="font-semibold text-lg">Settings</h2>
        <label className="block text-sm">
          <span className="text-ink-500">Active user id (sent to PULSE)</span>
          <input
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            className="mt-1 w-full h-12 px-3 rounded-xl border border-ink-200 focus:border-brand-400"
          />
        </label>
        <dl className="text-sm divide-y divide-ink-100">
          <SettingRow label="Display name" value={profile?.display_name ?? '—'} />
          <SettingRow label="Home country" value={profile?.home_country ?? '—'} />
          <SettingRow label="Language" value={profile?.preferred_language ?? '—'} />
          <SettingRow label="Archetype (PULSE)" value={personalization?.archetype ?? '—'} />
          <SettingRow label="Estimated recurring amount" value={personalization ? ngn(personalization.estimated_recurring_amount) : '—'} />
        </dl>
      </CardBody>
    </Card>
  );
}

function SettingRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-2">
      <dt className="text-ink-500">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}
