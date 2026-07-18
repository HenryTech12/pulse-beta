import { useState } from 'react';
import { useStore } from '@/store/appStore';
import { Card, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { format } from 'date-fns';
import { FileText, ChevronRight } from 'lucide-react';
import type { Case, CaseOwner } from '@/types/contract';

const statusTone = { open: 'warning', in_review: 'info', resolved: 'success', escalated: 'danger' } as const;
const actionTone = { approve: 'success', soft_challenge: 'info', block: 'danger', review: 'warning' } as const;
const OWNERS: CaseOwner[] = ['Unassigned', 'Compliance', 'CS'];

export function Cases() {
  const { cases } = useStore();
  const [selected, setSelected] = useState<Case | null>(null);
  const [sort, setSort] = useState<'recent' | 'confidence'>('recent');

  const sorted = [...cases].sort((a, b) =>
    sort === 'recent' ? b.created_at - a.created_at : b.confidence - a.confidence,
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-1">
        <h2 className="font-semibold text-lg">Cases</h2>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as any)}
          className="h-9 px-3 rounded-lg border border-ink-200 text-sm bg-white"
        >
          <option value="recent">Most recent</option>
          <option value="confidence">Confidence</option>
        </select>
      </div>

      {sorted.length === 0 ? (
        <Card><CardBody><p className="text-sm text-ink-500 text-center py-8">No cases yet. Use the Copilot to create one.</p></CardBody></Card>
      ) : (
        <div className="space-y-2">
          {sorted.map((c) => (
            <Card key={c.case_id} hover>
              <button onClick={() => setSelected(c)} className="w-full text-left p-4 flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-ink-100 text-ink-700 flex items-center justify-center shrink-0">
                  <FileText size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-mono font-semibold text-sm">{c.case_id}</p>
                    <Badge tone={statusTone[c.status]}>{c.status}</Badge>
                  </div>
                  <p className="text-xs text-ink-500">
                    {c.transaction_ids.join(', ')} · {c.owner} · {format(c.created_at, 'PP p')}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-semibold">{Math.round(c.confidence * 100)}%</p>
                  <ChevronRight size={16} className="text-ink-400" />
                </div>
              </button>
            </Card>
          ))}
        </div>
      )}

      <Modal open={!!selected} onClose={() => setSelected(null)} title={selected ? `Case ${selected.case_id}` : ''} size="lg">
        {selected && <CaseDetail case_={selected} />}
      </Modal>
    </div>
  );
}

function CaseDetail({ case_ }: { case_: Case }) {
  const { assignCase, addCaseNote, transactions, sessionLogs } = useStore();
  const [note, setNote] = useState('');
  const tx = transactions.find((t) => case_.transaction_ids.includes(t.tx_id));
  const log = tx?.session_id ? sessionLogs.find((l) => l.session_id === tx.session_id) : undefined;

  return (
    <div className="p-5 space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone={statusTone[case_.status]}>{case_.status}</Badge>
        <Badge tone={actionTone[case_.recommended_action]}>{case_.recommended_action}</Badge>
        <Badge tone="brand">{case_.owner}</Badge>
        <span className="text-xs text-ink-500 ml-auto">{format(case_.created_at, 'PPpp')}</span>
      </div>

      <div>
        <p className="text-xs font-semibold text-ink-700 uppercase tracking-wide">Transactions</p>
        <p className="font-mono text-sm mt-1">{case_.transaction_ids.join(', ')}</p>
      </div>

      <div>
        <p className="text-xs font-semibold text-ink-700 uppercase tracking-wide">Evidence</p>
        <ul className="mt-1 space-y-1.5">
          {case_.evidence.map((e, i) => (
            <li key={i} className="text-sm rounded-lg bg-ink-50 px-3 py-2">
              <div className="flex items-center justify-between">
                <span className="font-medium">{e.title}</span>
                <Badge tone={e.confidence > 0.7 ? 'danger' : 'warning'}>{Math.round(e.confidence * 100)}%</Badge>
              </div>
              <p className="text-xs text-ink-500">{e.summary}</p>
            </li>
          ))}
        </ul>
      </div>

      {log && (
        <div>
          <p className="text-xs font-semibold text-ink-700 uppercase tracking-wide mb-1">PULSE exchange for this session</p>
          <pre className="rounded-xl bg-ink-900 text-white p-3 font-mono text-xs overflow-x-auto">
            {JSON.stringify({ request: log.request, response: log.response }, null, 2)}
          </pre>
        </div>
      )}

      {/* Assignment */}
      <div>
        <p className="text-xs font-semibold text-ink-700 uppercase tracking-wide mb-1">Assign to team</p>
        <div className="flex gap-2">
          {OWNERS.map((o) => (
            <button
              key={o}
              onClick={() => assignCase(case_.case_id, o)}
              className={'px-3 py-1.5 rounded-full text-xs font-medium ' + (case_.owner === o ? 'bg-brand-500 text-white' : 'bg-ink-100 text-ink-700')}
            >
              {o}
            </button>
          ))}
        </div>
      </div>

      {/* Notes */}
      <div>
        <p className="text-xs font-semibold text-ink-700 uppercase tracking-wide mb-1">Notes</p>
        <ul className="space-y-1.5 mb-2">
          {case_.notes.map((n, i) => (
            <li key={i} className="text-sm rounded-lg bg-ink-50 px-3 py-2">
              <span className="font-medium">{n.author}: </span>{n.body}
              <span className="text-xs text-ink-400 block">{format(n.ts, 'PP p')}</span>
            </li>
          ))}
        </ul>
        <form onSubmit={(e) => { e.preventDefault(); if (note.trim()) { addCaseNote(case_.case_id, note); setNote(''); } }} className="flex gap-2">
          <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Add a note…" className="flex-1 h-10 px-3 rounded-lg border border-ink-200 text-sm" />
          <Button type="submit" size="sm">Add</Button>
        </form>
      </div>
    </div>
  );
}
