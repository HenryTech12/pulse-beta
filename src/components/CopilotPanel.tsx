import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useStore } from '@/store/appStore';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/cn';
import {
  Sparkles, X, Send, ShieldAlert, FileText, MapPin, Keyboard, Activity, CheckCircle2, AlertTriangle, Ban, MessageSquare,
} from 'lucide-react';
import type { CopilotMessage, Evidence, RecommendedAction } from '@/types/contract';

const SUGGESTIONS = [
  "Show me today's suspicious transactions over ₦50000",
  "Cross-check transfers to Nigeria in last 24 hours",
  "Create case for transaction TX-1006 with reason 'sender mismatch'",
];

export function CopilotPanel() {
  const { copilotOpen, toggleCopilot, copilotMessages, copilotLoading, runCopilot, createCaseFromTx, applyDecision } = useStore();
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo?.({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [copilotMessages, copilotLoading]);

  if (!copilotOpen) return null;

  const send = (text: string) => {
    if (!text.trim() || copilotLoading) return;
    runCopilot(text);
    setInput('');
  };

  return createPortal(
    <>
      {/* Desktop: right drawer; mobile: full-screen overlay */}
      <div className="fixed inset-0 z-40 bg-ink-900/30 backdrop-blur-sm lg:bg-transparent lg:backdrop-blur-none" onClick={() => toggleCopilot(false)} />
      <aside
        role="dialog"
        aria-label="Analyst copilot"
        className={cn(
          'fixed z-40 bg-white shadow-panel flex flex-col',
          'inset-x-0 bottom-0 top-auto max-h-[88vh] rounded-t-3xl animate-slideUp',
          'lg:inset-y-0 lg:right-0 lg:left-auto lg:w-[440px] lg:rounded-none lg:max-h-none',
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-ink-100 bg-brand-500 text-white lg:rounded-t-none rounded-t-3xl">
          <div className="flex items-center gap-2">
            <Sparkles size={18} />
            <h2 className="font-semibold">Analyst Copilot</h2>
            <Badge tone="brand" className="bg-white/20 text-white">LLM</Badge>
          </div>
          <button onClick={() => toggleCopilot(false)} aria-label="Close copilot" className="p-1.5 rounded-lg hover:bg-white/20">
            <X size={18} />
          </button>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 scroll-thin bg-ink-50">
          {copilotMessages.map((m) => (
            <MessageBubble
              key={m.id}
              msg={m}
              onCreateCase={(txId, reason) => createCaseFromTx(txId, reason)}
              onAction={(txId, action) => applyDecision(txId, action)}
            />
          ))}
          {copilotLoading && <Typing />}
        </div>

        {/* Suggestions */}
        <div className="px-4 pt-2 flex gap-2 overflow-x-auto pb-2 scroll-thin">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => send(s)}
              className="shrink-0 text-xs px-3 py-1.5 rounded-full bg-brand-50 text-brand-700 hover:bg-brand-100 border border-brand-100"
            >
              {s}
            </button>
          ))}
        </div>

        {/* Input */}
        <div className="p-3 border-t border-ink-100 bg-white">
          <form
            onSubmit={(e) => { e.preventDefault(); send(input); }}
            className="flex items-end gap-2"
          >
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(input); } }}
              placeholder="Ask copilot to investigate…"
              rows={1}
              className="flex-1 resize-none max-h-32 px-3 py-2.5 rounded-xl border border-ink-200 focus:border-brand-400 text-sm"
            />
            <Button type="submit" size="md" loading={copilotLoading} aria-label="Send prompt">
              <Send size={16} />
            </Button>
          </form>
        </div>
      </aside>
    </>,
    document.body,
  );
}

function MessageBubble({
  msg,
  onCreateCase,
  onAction,
}: {
  msg: CopilotMessage;
  onCreateCase: (txId: string, reason: string) => void;
  onAction: (txId: string, action: RecommendedAction) => void;
}) {
  const isUser = msg.role === 'user';
  return (
    <div className={cn('flex', isUser ? 'justify-end' : 'justify-start')}>
      <div className={cn('max-w-[88%] space-y-2', isUser ? 'items-end' : 'items-start')}>
        <div
          className={cn(
            'rounded-2xl px-3.5 py-2.5 text-sm',
            isUser ? 'bg-brand-500 text-white rounded-br-sm' : 'bg-white border border-ink-100 text-ink-800 rounded-bl-sm',
          )}
        >
          {msg.content}
        </div>

        {/* Evidence cards */}
        {msg.evidence && msg.evidence.length > 0 && (
          <div className="space-y-1.5">
            {msg.evidence.map((e, i) => <EvidenceCard key={i} evidence={e} />)}
          </div>
        )}

        {/* Matched transactions */}
        {msg.matched_tx_ids && msg.matched_tx_ids.length > 0 && (
          <div className="rounded-xl border border-ink-100 bg-white p-2 space-y-1">
            {msg.matched_tx_ids.map((id) => (
              <div key={id} className="flex items-center justify-between gap-2 text-xs">
                <span className="font-mono text-ink-700">{id}</span>
                <div className="flex gap-1">
                  <button onClick={() => onCreateCase(id, 'flagged by copilot')} className="px-2 py-1 rounded-md bg-amber-50 text-amber-700 hover:bg-amber-100 font-medium">
                    Create case
                  </button>
                  <button onClick={() => onAction(id, 'approve')} aria-label="Approve" className="p-1 rounded-md bg-green-50 text-green-700 hover:bg-green-100">
                    <CheckCircle2 size={14} />
                  </button>
                  <button onClick={() => onAction(id, 'soft_challenge')} aria-label="Soft challenge" className="p-1 rounded-md bg-blue-50 text-blue-700 hover:bg-blue-100">
                    <MessageSquare size={14} />
                  </button>
                  <button onClick={() => onAction(id, 'block')} aria-label="Block" className="p-1 rounded-md bg-red-50 text-red-700 hover:bg-red-100">
                    <Ban size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Case created confirmation */}
        {msg.case_id && (
          <div className="rounded-xl bg-brand-50 border border-brand-100 px-3 py-2 text-xs text-brand-700 flex items-center gap-2">
            <FileText size={14} /> Case <span className="font-mono font-semibold">{msg.case_id}</span> created & routed.
          </div>
        )}
      </div>
    </div>
  );
}

const evidenceIcon = {
  session_replay: Activity,
  keystroke_heatmap: Keyboard,
  geo_ip_anomaly: MapPin,
  personalization_score: ShieldAlert,
  pattern_match: AlertTriangle,
  pulse_decision: ShieldAlert,
} as const;

function EvidenceCard({ evidence }: { evidence: Evidence }) {
  const Icon = evidenceIcon[evidence.kind];
  return (
    <div className="rounded-xl border border-ink-100 bg-white p-2.5 flex items-start gap-2">
      <div className="h-7 w-7 rounded-lg bg-ink-100 text-ink-700 flex items-center justify-center shrink-0">
        <Icon size={14} />
      </div>
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-xs font-semibold text-ink-900">{evidence.title}</p>
          <Badge tone={evidence.confidence > 0.7 ? 'danger' : evidence.confidence > 0.4 ? 'warning' : 'neutral'}>
            {Math.round(evidence.confidence * 100)}%
          </Badge>
        </div>
        <p className="text-xs text-ink-500">{evidence.summary}</p>
      </div>
    </div>
  );
}

function Typing() {
  return (
    <div className="flex justify-start">
      <div className="rounded-2xl bg-white border border-ink-100 px-4 py-3 flex gap-1">
        <Dot /> <Dot delay="0.15s" /> <Dot delay="0.3s" />
      </div>
    </div>
  );
}

function Dot({ delay = '0s' }: { delay?: string }) {
  return <span className="h-1.5 w-1.5 rounded-full bg-ink-400 animate-bounce" style={{ animationDelay: delay }} />;
}
