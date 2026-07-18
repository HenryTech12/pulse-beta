import { useState } from 'react';
import { useStore } from '@/store/appStore';
import { Card, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { sessionTracker } from '@/lib/sessionTracker';
import { Radio, Play, AlertTriangle, Terminal } from 'lucide-react';
import { evaluatePatterns } from '@/lib/patterns';
import { env } from '@/lib/env';
import { SCREENS, type ScreenName, ngn } from '@/types/contract';

// Repurposed from the old "fire 9 micro-events" simulator into a contract
// tester: it builds one real, batched SessionEventRequest exactly the way
// the live app does, sends it, and shows the raw request/response against
// the real PULSE contract — useful for judges and for verifying the
// backend integration end to end.
export function Simulator() {
  const { userId, submitSession, lastSessionLog, transactions, resolvePendingDecision, pendingDecision } = useStore();
  const [amount, setAmount] = useState('760000');
  const [screens, setScreens] = useState<ScreenName[]>(['login', 'dashboard', 'transfer', 'confirm']);
  const [keystrokeCount, setKeystrokeCount] = useState(3);
  const [botLike, setBotLike] = useState(true);
  const [sending, setSending] = useState(false);

  const toggleScreen = (s: ScreenName) => {
    setScreens((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));
  };

  const send = async () => {
    setSending(true);
    sessionTracker.reset();
    for (const s of screens) sessionTracker.recordScreen(s);
    // Simulate keystroke timing: bot-like = very tight, uniform intervals;
    // human-like = irregular, wider intervals.
    for (let i = 0; i < keystrokeCount; i++) {
      sessionTracker.recordKeystroke();
      // burn a little wall-clock time so intervals differ
      await new Promise((r) => setTimeout(r, botLike ? 10 : 120 + Math.random() * 200));
    }
    const proceed = await submitSession(Number(amount) || undefined);
    if (pendingDecision) resolvePendingDecision(proceed); // safety net, gate usually resolves itself
    setSending(false);
  };

  const alerts = evaluatePatterns(transactions);

  return (
    <div className="space-y-5">
      <Card>
        <CardBody className="space-y-4">
          <div className="flex items-center gap-2">
            <Radio size={18} className="text-brand-600" />
            <h2 className="font-semibold text-lg">Contract tester</h2>
            <Badge tone={env.useMock ? 'warning' : 'success'}>{env.useMock ? 'mock mode' : 'live: ' + env.apiBaseUrl}</Badge>
          </div>
          <p className="text-sm text-ink-500">
            Builds one batched payload and sends it to{' '}
            <code className="text-xs bg-ink-100 px-1 rounded">POST /session/event</code> — exactly the real contract,
            not a stream of micro-events.
          </p>

          <div className="rounded-xl border border-ink-200 p-3 space-y-3">
            <p className="text-xs font-semibold text-ink-700 uppercase tracking-wide">Screen sequence</p>
            <div className="flex flex-wrap gap-2">
              {SCREENS.map((s) => (
                <button
                  key={s}
                  onClick={() => toggleScreen(s)}
                  className={
                    'px-3 py-1.5 rounded-full text-xs font-medium ' +
                    (screens.includes(s) ? 'bg-brand-500 text-white' : 'bg-ink-100 text-ink-700')
                  }
                >
                  {s}
                </button>
              ))}
            </div>
            <p className="text-xs text-ink-400">Order sent: {screens.join(' → ') || '(none)'}</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="text-sm">
              <span className="text-ink-500">Transaction amount (₦)</span>
              <input value={amount} onChange={(e) => setAmount(e.target.value)} className="mt-1 w-full h-10 px-3 rounded-lg border border-ink-200 focus:border-brand-400" />
            </label>
            <label className="text-sm">
              <span className="text-ink-500">Keystrokes to simulate</span>
              <input type="number" value={keystrokeCount} onChange={(e) => setKeystrokeCount(Number(e.target.value))} className="mt-1 w-full h-10 px-3 rounded-lg border border-ink-200 focus:border-brand-400" />
            </label>
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={botLike} onChange={(e) => setBotLike(e.target.checked)} />
            Bot-like typing (near-zero intervals — should push risk up)
          </label>

          <Button block loading={sending} leftIcon={<Play size={16} />} onClick={send}>
            Send session to PULSE
          </Button>
        </CardBody>
      </Card>

      {lastSessionLog && (
        <Card>
          <CardBody className="space-y-3">
            <div className="flex items-center gap-2">
              <Terminal size={18} className="text-ink-700" />
              <h2 className="font-semibold text-lg">Last exchange</h2>
            </div>
            <div>
              <p className="text-xs font-semibold text-ink-700 uppercase tracking-wide mb-1">Request</p>
              <pre className="rounded-xl bg-ink-900 text-white p-4 font-mono text-xs overflow-x-auto">
                {JSON.stringify(lastSessionLog.request, null, 2)}
              </pre>
            </div>
            <div>
              <p className="text-xs font-semibold text-ink-700 uppercase tracking-wide mb-1">Response</p>
              {lastSessionLog.error ? (
                <p className="text-sm text-danger">{lastSessionLog.error}</p>
              ) : (
                <pre className="rounded-xl bg-ink-900 text-white p-4 font-mono text-xs overflow-x-auto">
                  {JSON.stringify(lastSessionLog.response, null, 2)}
                </pre>
              )}
            </div>
          </CardBody>
        </Card>
      )}

      <Card>
        <CardBody>
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={18} className="text-danger" />
            <h2 className="font-semibold text-lg">Local pattern alerts</h2>
            <Badge tone="danger">{alerts.length}</Badge>
            <span className="text-xs text-ink-400 ml-auto">demo heuristics, not PULSE</span>
          </div>
          {alerts.length === 0 ? (
            <p className="text-sm text-ink-500">No pattern matches across current transactions.</p>
          ) : (
            <ul className="space-y-2">
              {alerts.slice(0, 8).map((h, i) => (
                <li key={i} className="flex items-center justify-between text-sm rounded-lg bg-ink-50 px-3 py-2">
                  <div>
                    <p className="font-medium">{h.rule.name}</p>
                    <p className="text-xs text-ink-500">{h.tx.tx_id} · {ngn(h.tx.amount_ngn)}</p>
                  </div>
                  <Badge tone={h.rule.severity === 'high' ? 'danger' : h.rule.severity === 'medium' ? 'warning' : 'neutral'}>
                    {h.rule.severity}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>

      <p className="text-xs text-ink-400 px-1">
        User id used for these calls: <span className="font-mono">{userId}</span>
      </p>
    </div>
  );
}
