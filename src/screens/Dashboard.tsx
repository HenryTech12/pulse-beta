import { useMemo, useState } from 'react';
import { useStore } from '@/store/appStore';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { TxRow, TxDetail } from '@/components/TransactionRow';
import { Send, Download, Plus, Sparkles, Filter, ChevronDown } from 'lucide-react';
import type { Transaction } from '@/types/contract';
import { ngn } from '@/types/contract';

const PAGE = 12;

export function Dashboard() {
  const { profile, personalization, filteredTxs, toggleCopilot } = useStore();
  const [visible, setVisible] = useState(PAGE);
  const [selected, setSelected] = useState<Transaction | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);

  const txs = filteredTxs();
  const shown = txs.slice(0, visible);
  const balance = useMemo(
    () => txs.reduce((s, t) => s + (t.direction === 'in' ? t.amount_ngn : -t.amount_ngn), 510000),
    [txs],
  );

  return (
    <div className="space-y-5">
      {/* Balance card */}
      <Card className="bg-gradient-to-br from-brand-500 to-brand-700 text-white border-0 overflow-hidden">
        <div className="p-5">
          <p className="text-brand-50/80 text-sm">Wallet balance</p>
          <p className="text-3xl font-bold mt-1">
            {personalization ? ngn(personalization.current_balance) : ngn(balance)}
          </p>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <Badge tone="brand" className="bg-white/20 text-white">
              {profile?.display_name ?? '—'}
            </Badge>
            {personalization && (
              <span className="text-brand-50/80 text-xs">
                {personalization.archetype} · {personalization.days_until_due}d to next bill
              </span>
            )}
          </div>
          {personalization && personalization.shortfall_amount > 0 && (
            <p className="text-xs text-amber-100 bg-white/10 rounded-lg px-2.5 py-1.5 mt-3 inline-block">
              Projected shortfall of {ngn(personalization.shortfall_amount)} by your next recurring payment
            </p>
          )}
          <div className="grid grid-cols-3 gap-2 mt-5">
            <QuickAction icon={<Send size={18} />} label="Send" to="transfer" />
            <QuickAction icon={<Download size={18} />} label="Request" to="transfer" />
            <QuickAction icon={<Plus size={18} />} label="Top-up" to="wallet" />
          </div>
        </div>
      </Card>

      {/* Recent header */}
      <div className="flex items-center justify-between px-1">
        <h2 className="font-semibold text-ink-900">Recent transactions</h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" leftIcon={<Filter size={14} />} onClick={() => setFilterOpen((v) => !v)}>
            Filter
            <ChevronDown size={14} />
          </Button>
          <Button variant="primary" size="sm" leftIcon={<Sparkles size={14} />} onClick={() => toggleCopilot(true)}>
            Copilot
          </Button>
        </div>
      </div>

      {filterOpen && <FilterBar />}

      {/* List */}
      <Card className="overflow-hidden">
        <div className="divide-y divide-ink-100">
          {shown.map((t) => (
            <TxRow key={t.tx_id} tx={t} onClick={() => setSelected(t)} />
          ))}
          {shown.length === 0 && (
            <p className="text-center text-ink-500 py-10">No transactions match these filters.</p>
          )}
        </div>
        {visible < txs.length && (
          <button
            onClick={() => setVisible((v) => v + PAGE)}
            className="w-full py-3 text-sm font-medium text-brand-600 hover:bg-brand-50"
          >
            Load more
          </button>
        )}
      </Card>

      <Modal open={!!selected} onClose={() => setSelected(null)} title="Transaction detail" size="md">
        {selected && <TxDetail tx={selected} />}
      </Modal>
    </div>
  );
}

function QuickAction({ icon, label, to }: { icon: React.ReactNode; label: string; to: string }) {
  return (
    <a
      href={`#/${to}`}
      className="flex flex-col items-center gap-1.5 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 transition-colors"
    >
      <span className="h-9 w-9 rounded-full bg-white/20 flex items-center justify-center">{icon}</span>
      <span className="text-xs font-medium">{label}</span>
    </a>
  );
}

function FilterBar() {
  const { filters, setFilters } = useStore();
  return (
    <Card className="p-4 space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <label className="text-sm">
          <span className="text-ink-500">Min amount</span>
          <input
            type="number"
            value={filters.minAmount ?? ''}
            onChange={(e) => setFilters({ minAmount: e.target.value ? Number(e.target.value) : undefined })}
            className="mt-1 w-full h-10 px-3 rounded-lg border border-ink-200 focus:border-brand-400"
          />
        </label>
        <label className="text-sm">
          <span className="text-ink-500">Max amount</span>
          <input
            type="number"
            value={filters.maxAmount ?? ''}
            onChange={(e) => setFilters({ maxAmount: e.target.value ? Number(e.target.value) : undefined })}
            className="mt-1 w-full h-10 px-3 rounded-lg border border-ink-200 focus:border-brand-400"
          />
        </label>
      </div>
      <div className="flex gap-2 flex-wrap">
        {(['all', 'success', 'pending', 'flagged', 'failed'] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFilters({ status: s })}
            className={
              'px-3 py-1.5 rounded-full text-xs font-medium capitalize ' +
              (filters.status === s ? 'bg-brand-500 text-white' : 'bg-ink-100 text-ink-700')
            }
          >
            {s}
          </button>
        ))}
      </div>
    </Card>
  );
}
