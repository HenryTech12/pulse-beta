import { formatDistanceToNow, format } from 'date-fns';
import { ArrowDownLeft, ArrowUpRight, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/cn';
import { ngn, type Transaction } from '@/types/contract';

const statusTone = {
  success: 'success',
  pending: 'warning',
  failed: 'neutral',
  flagged: 'danger',
} as const;

export function TxRow({ tx, onClick }: { tx: Transaction; onClick?: () => void }) {
  const out = tx.direction === 'out';
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-ink-50',
        'focus-visible:bg-ink-50',
      )}
    >
      <div
        className={cn(
          'h-10 w-10 rounded-full flex items-center justify-center shrink-0',
          out ? 'bg-brand-50 text-brand-600' : 'bg-blue-50 text-blue-600',
        )}
      >
        {out ? <ArrowUpRight size={18} /> : <ArrowDownLeft size={18} />}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="font-medium text-ink-900 truncate">{tx.counterparty}</p>
          {tx.status === 'flagged' && <AlertTriangle size={14} className="text-danger shrink-0" />}
        </div>
        <p className="text-xs text-ink-500">
          {tx.channel} · {tx.counterparty_country} · {formatDistanceToNow(tx.ts, { addSuffix: true })}
        </p>
      </div>
      <div className="text-right shrink-0">
        <p className={cn('font-semibold', out ? 'text-ink-900' : 'text-brand-600')}>
          {out ? '-' : '+'}{ngn(tx.amount_ngn)}
        </p>
        <Badge tone={statusTone[tx.status]}>{tx.status}</Badge>
      </div>
    </button>
  );
}

export function TxDetail({ tx }: { tx: Transaction }) {
  return (
    <div className="p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-2xl font-bold">
            {tx.direction === 'out' ? '-' : '+'}{ngn(tx.amount_ngn)}
          </p>
          <p className="text-sm text-ink-500">{tx.counterparty}</p>
        </div>
        <Badge tone={statusTone[tx.status]}>{tx.status}</Badge>
      </div>
      <dl className="text-sm divide-y divide-ink-100">
        <Row label="Transaction ID" value={tx.tx_id} />
        <Row label="Channel" value={tx.channel} />
        <Row label="Country" value={tx.counterparty_country} />
        <Row label="Date" value={format(tx.ts, 'PPpp')} />
        <Row label="Risk score" value={`${Math.round((tx.risk_score ?? 0) * 100)}%`} />
        <Row label="PULSE decision" value={tx.decision ?? '—'} />
        <Row label="Flags" value={tx.flags?.join(', ') || '—'} />
        <Row label="Session" value={tx.session_id || '—'} />
      </dl>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-2">
      <dt className="text-ink-500">{label}</dt>
      <dd className="font-medium text-right max-w-[60%] truncate">{value}</dd>
    </div>
  );
}
