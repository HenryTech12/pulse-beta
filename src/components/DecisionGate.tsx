import { useState } from 'react';
import { useStore } from '@/store/appStore';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ShieldAlert, ShieldCheck, ShieldQuestion } from 'lucide-react';
import { ngn } from '@/types/contract';

// This is the single highest-priority fix called out in the Frontend
// Integration Fix Brief (§3.2): the PULSE decision has to be visible and
// understandable to the user, not just computed on a server nobody sees.
//   approve         -> no modal at all, the action proceeds silently
//   soft_challenge  -> this modal, a distinct extra verification step
//   block           -> this modal, an unmistakable stop, nothing proceeds
export function DecisionGate() {
  const pending = useStore((s) => s.pendingDecision);
  const resolve = useStore((s) => s.resolvePendingDecision);
  const [answer, setAnswer] = useState('');
  const [checking, setChecking] = useState(false);

  if (!pending) return null;
  const { response, amountNgn } = pending;
  const isBlock = response.decision === 'block';

  const submitChallenge = () => {
    setChecking(true);
    // Demo-scale check: any non-empty answer clears the soft challenge —
    // the point being demonstrated is that a distinct step existed, not a
    // real knowledge-based-auth backend.
    setTimeout(() => {
      setChecking(false);
      setAnswer('');
      resolve(answer.trim().length > 0);
    }, 500);
  };

  return (
    <Modal open onClose={() => {}} size="sm" className="text-center">
      <div className="p-6 space-y-4">
        <div
          className={
            'h-16 w-16 rounded-full mx-auto flex items-center justify-center ' +
            (isBlock ? 'bg-red-100 text-danger' : 'bg-amber-100 text-amber-600')
          }
        >
          {isBlock ? <ShieldAlert size={32} /> : <ShieldQuestion size={32} />}
        </div>

        <div>
          <h2 className="text-xl font-bold text-ink-900">
            {isBlock ? 'Transaction blocked' : 'Extra verification needed'}
          </h2>
          <p className="text-sm text-ink-500 mt-1">
            {isBlock
              ? 'PULSE stopped this action before it could complete.'
              : 'PULSE wants to confirm it\u2019s really you before this goes through.'}
          </p>
        </div>

        <div className="flex items-center justify-center gap-2">
          <Badge tone={isBlock ? 'danger' : 'warning'}>{response.decision}</Badge>
          <Badge tone="neutral">risk {Math.round(response.risk_score * 100)}%</Badge>
          {response.source && <Badge tone="info">{response.source}</Badge>}
        </div>

        {amountNgn != null && (
          <p className="text-2xl font-bold text-ink-900">{ngn(amountNgn)}</p>
        )}

        <div className="rounded-xl bg-ink-50 p-3 text-left text-sm text-ink-600">
          {response.reasoning}
        </div>

        {isBlock ? (
          <Button block variant="danger" onClick={() => resolve(false)}>
            Okay, cancel this transaction
          </Button>
        ) : (
          <div className="space-y-3 text-left">
            <label className="block text-sm">
              <span className="text-ink-500">Security answer — mother's maiden name</span>
              <input
                autoFocus
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="Type anything to continue the demo"
                className="mt-1 w-full h-11 px-3 rounded-xl border border-ink-200 focus:border-brand-400"
              />
            </label>
            <div className="flex gap-2">
              <Button block variant="outline" onClick={() => resolve(false)}>
                Cancel
              </Button>
              <Button block loading={checking} onClick={submitChallenge}>
                Verify & continue
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}

export function ApprovedToast({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-ink-900 text-white text-sm px-4 py-2.5 rounded-full shadow-panel animate-fadeIn">
      <ShieldCheck size={16} className="text-green-400" />
      Approved — no extra friction
    </div>
  );
}
