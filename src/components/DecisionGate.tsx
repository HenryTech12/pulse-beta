import { useEffect, useState } from 'react';
import { useStore } from '@/store/appStore';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { api } from '@/lib/api';
import { ShieldAlert, ShieldCheck, ShieldQuestion } from 'lucide-react';
import { ngn } from '@/types/contract';

// This is the single highest-priority fix called out in the Frontend
// Integration Fix Brief (§3.2): the PULSE decision has to be visible and
// understandable to the user, not just computed on a server nobody sees.
//   approve         -> no modal at all, the action proceeds silently
//   soft_challenge  -> this modal, backed by a real Twilio Verify OTP
//   block           -> this modal, an unmistakable stop, nothing proceeds
export function DecisionGate() {
  const pending = useStore((s) => s.pendingDecision);
  const resolve = useStore((s) => s.resolvePendingDecision);
  const profile = useStore((s) => s.profile);
  const [code, setCode] = useState('');
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sendState, setSendState] = useState<'sending' | 'sent' | 'simulated' | 'failed'>('sending');

  const isBlock = pending?.response.decision === 'block';

  // Fire the real OTP the moment a soft_challenge appears -- once per
  // challenge, not once per render.
  useEffect(() => {
    if (!pending || isBlock) return;
    if (!profile?.phone) {
      setSendState('failed');
      setError('No phone number on file for this account -- cannot send a verification code.');
      return;
    }
    let cancelled = false;
    setSendState('sending');
    api
      .sendOtp(profile.phone)
      .then((res) => {
        if (cancelled) return;
        setSendState(res.simulated ? 'simulated' : 'sent');
      })
      .catch((e) => {
        if (cancelled) return;
        setSendState('failed');
        setError(e instanceof Error ? e.message : 'Could not send the verification code.');
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pending?.response.decision]);

  if (!pending) return null;
  const { response, amountNgn } = pending;

  const submitChallenge = async () => {
    if (!profile?.phone) return;
    setChecking(true);
    setError(null);
    try {
      const result = await api.verifyOtp(profile.phone, code);
      if (result.approved) {
        setCode('');
        resolve(true);
      } else {
        setError('That code didn\u2019t match. Check your messages and try again.');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Verification failed.');
    } finally {
      setChecking(false);
    }
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
              <span className="text-ink-500">Enter the verification code sent to {profile?.phone ?? 'your phone'}</span>
              <input
                autoFocus
                inputMode="numeric"
                maxLength={8}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                placeholder="6-digit code"
                disabled={sendState === 'failed'}
                className="mt-1 w-full h-11 px-3 rounded-xl border border-ink-200 focus:border-brand-400 tracking-widest font-mono"
              />
              <span className="text-xs text-ink-400 mt-1 block">
                {sendState === 'sending' && 'Sending code via Twilio…'}
                {sendState === 'sent' && 'Real code sent via Twilio Verify.'}
                {sendState === 'simulated' &&
                  'Demo mode — no live Twilio credentials configured, any 4+ digit code is accepted.'}
                {sendState === 'failed' && !error && 'Could not send a code.'}
              </span>
            </label>
            {error && <p className="text-sm text-danger">{error}</p>}
            <div className="flex gap-2">
              <Button block variant="outline" onClick={() => resolve(false)}>
                Cancel
              </Button>
              <Button block loading={checking} disabled={code.trim().length < 4} onClick={submitChallenge}>
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
