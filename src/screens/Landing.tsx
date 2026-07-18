import { ShieldCheck, Activity, Brain, MapPin, Keyboard, FileText, ArrowRight, CheckCircle2, Lock, Zap, Globe } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface Props {
  onEnter: () => void;
  onLogin: () => void;
}

export function Landing({ onEnter, onLogin }: Props) {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="sticky top-0 z-30 bg-white/90 backdrop-blur border-b border-ink-100">
        <div className="max-w-5xl mx-auto px-5 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl bg-brand-500 text-white flex items-center justify-center font-bold text-lg">P</div>
            <span className="font-bold text-lg text-ink-900">Pulse</span>
          </div>
          <div className="hidden sm:flex items-center gap-6 text-sm text-ink-600">
            <a href="#problem" className="hover:text-brand-600">Problem</a>
            <a href="#solution" className="hover:text-brand-600">Solution</a>
            <a href="#features" className="hover:text-brand-600">Features</a>
            <a href="#how" className="hover:text-brand-600">How it works</a>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={onLogin}>Sign in</Button>
            <Button size="sm" onClick={onEnter} rightIcon={<ArrowRight size={14} />}>Get started</Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-brand-50/60 to-white" />
        <div className="relative max-w-5xl mx-auto px-5 pt-16 pb-20 sm:pt-24 sm:pb-28">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-50 text-brand-700 text-xs font-medium border border-brand-100 mb-6">
            <ShieldCheck size={14} /> Fraud detection built for African wallets
          </div>
          <h1 className="text-4xl sm:text-6xl font-bold text-ink-900 leading-tight tracking-tight max-w-3xl">
            Stop fraud before it moves. <span className="text-brand-600">Catch it in the session.</span>
          </h1>
          <p className="mt-5 text-lg text-ink-600 max-w-2xl leading-relaxed">
            Pulse watches every tap, keystroke, and screen transition in real time — then routes the suspicious ones to your analysts with an AI copilot that drafts the case for you.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3">
            <Button size="lg" onClick={onEnter} rightIcon={<ArrowRight size={18} />}>
              Explore the demo
            </Button>
            <Button variant="outline" size="lg" onClick={onLogin}>
              Sign in with phone
            </Button>
          </div>
          <div className="mt-10 flex flex-wrap gap-6 text-sm text-ink-500">
            <span className="flex items-center gap-1.5"><CheckCircle2 size={16} className="text-brand-500" /> No backend setup</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 size={16} className="text-brand-500" /> Session replay built in</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 size={16} className="text-brand-500" /> Analyst copilot included</span>
          </div>
        </div>
      </section>

      {/* Stats band */}
      <section className="bg-ink-900 text-white">
        <div className="max-w-5xl mx-auto px-5 py-12 grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
          <Stat value="₦760K" label="flagged in demo" />
          <Stat value="3" label="patterns matched" />
          <Stat value="92%" label="confidence score" />
          <Stat value="<2s" label="case drafted" />
        </div>
      </section>

      {/* Problem */}
      <section id="problem" className="max-w-5xl mx-auto px-5 py-20">
        <div className="max-w-2xl">
          <p className="text-brand-600 font-semibold text-sm uppercase tracking-wide">The problem</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-ink-900 mt-2">
            Fraud moves faster than manual review.
          </h2>
          <p className="mt-4 text-ink-600 text-lg leading-relaxed">
            Digital wallets process millions of transactions a day. By the time a suspicious transfer is flagged, the money has already moved. Analysts drown in alerts with no context — no replay, no keystroke timing, no geo evidence — and cases take hours to assemble.
          </p>
        </div>
        <div className="mt-10 grid sm:grid-cols-3 gap-4">
          <ProblemCard icon={<Zap />} title="Speed" body="Fraudsters move funds in seconds. Rule-only systems flag too late." />
          <ProblemCard icon={<FileText />} title="No context" body="Alerts arrive as rows in a table — no session, no behaviour, no story." />
          <ProblemCard icon={<Brain />} title="Alert fatigue" body="Analysts review hundreds of cases a day with no AI assistance." />
        </div>
      </section>

      {/* Solution */}
      <section id="solution" className="bg-brand-50/50 border-y border-brand-100">
        <div className="max-w-5xl mx-auto px-5 py-20">
          <div className="max-w-2xl">
            <p className="text-brand-600 font-semibold text-sm uppercase tracking-wide">The solution</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-ink-900 mt-2">
              Capture the session. Surface the evidence. Draft the case.
            </h2>
            <p className="mt-4 text-ink-600 text-lg leading-relaxed">
              Pulse captures the whole session — screen path and keystroke timing — and sends one batched request to the live PULSE risk API. A pattern engine adds local context, and an analyst copilot turns evidence into a routed case — in under two seconds.
            </p>
          </div>
          <div className="mt-12 grid md:grid-cols-2 gap-6">
            <SolutionStep n="01" title="Capture" icon={<Keyboard />} body="Keystroke timing and the full screen path for the session are captured client-side and sent as one batched request to POST /session/event." />
            <SolutionStep n="02" title="Detect" icon={<Activity />} body="A pattern engine evaluates large amounts, geo anomalies, rapid repeats, and off-hours activity — assigning a confidence score." />
            <SolutionStep n="03" title="Investigate" icon={<Brain />} body="The analyst copilot runs natural-language queries, surfaces evidence cards, and recommends an action." />
            <SolutionStep n="04" title="Route" icon={<FileText />} body="A case with evidence, recommended action, and owner is created and routed to Compliance or CS — with session replay attached." />
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="max-w-5xl mx-auto px-5 py-20">
        <div className="max-w-2xl">
          <p className="text-brand-600 font-semibold text-sm uppercase tracking-wide">Features</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-ink-900 mt-2">Everything an analyst needs, in one panel.</h2>
        </div>
        <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <Feature icon={<Brain />} title="Analyst Copilot" body="Natural-language queries: 'show suspicious transactions over ₦50,000'. Evidence cards and recommended actions included." />
          <Feature icon={<Activity />} title="Session replay" body="Scrub through screen transitions and keystroke timing heatmaps for any flagged session." />
          <Feature icon={<MapPin />} title="Geo / IP anomaly" body="Detect when a session originates from a country that doesn't match the user's home." />
          <Feature icon={<Keyboard />} title="Keystroke biometrics" body="Hold and flight timing per key, surfaced as a heatmap to spot bot or mimic behaviour." />
          <Feature icon={<FileText />} title="Case routing" body="Create a case with evidence, recommended action, and owner. Assign to Compliance or CS with notes." />
          <Feature icon={<ShieldCheck />} title="Decision enforcement" body="Approve, soft challenge, or block — mapped to the UI and applied to the transaction." />
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="bg-ink-900 text-white">
        <div className="max-w-5xl mx-auto px-5 py-20">
          <p className="text-brand-400 font-semibold text-sm uppercase tracking-wide">How it works</p>
          <h2 className="text-3xl sm:text-4xl font-bold mt-2">From tap to routed case in seconds.</h2>
          <div className="mt-12 space-y-4">
            <FlowRow step="1" title="User opens the wallet" body="A session begins. Screen views and keystroke timing accumulate locally." />
            <FlowRow step="2" title="A suspicious transfer is submitted" body="The pattern engine flags large amount + geo anomaly + rapid repeat. Risk score: 92%." />
            <FlowRow step="3" title="Copilot surfaces the evidence" body="The analyst asks 'show suspicious transactions over ₦50,000'. Evidence cards appear." />
            <FlowRow step="4" title="A case is created and routed" body="One tap drafts a case with evidence, recommended action (block), and routes to Compliance." />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-5xl mx-auto px-5 py-20 text-center">
        <h2 className="text-3xl sm:text-4xl font-bold text-ink-900">See Pulse in action.</h2>
        <p className="mt-4 text-ink-600 text-lg max-w-xl mx-auto">
          Explore the full demo — dashboard, simulator, copilot, and case routing — no signup required.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
          <Button size="lg" onClick={onEnter} rightIcon={<ArrowRight size={18} />}>Open the demo</Button>
          <Button variant="outline" size="lg" onClick={onLogin}>Sign in</Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-ink-100 bg-ink-50">
        <div className="max-w-5xl mx-auto px-5 py-10 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-brand-500 text-white flex items-center justify-center font-bold">P</div>
            <span className="font-semibold text-ink-900">Pulse</span>
            <span className="text-sm text-ink-500 ml-2">Fraud detection for digital wallets</span>
          </div>
          <div className="flex gap-6 text-sm text-ink-500">
            <span className="flex items-center gap-1"><Lock size={14} /> SOC2 ready</span>
            <span className="flex items-center gap-1"><Globe size={14} /> Built for Africa</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <p className="text-3xl font-bold text-brand-400">{value}</p>
      <p className="text-sm text-ink-400 mt-1">{label}</p>
    </div>
  );
}

function ProblemCard({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-ink-100 p-5 bg-white">
      <div className="h-10 w-10 rounded-xl bg-danger/10 text-danger flex items-center justify-center mb-3">{icon}</div>
      <h3 className="font-semibold text-ink-900">{title}</h3>
      <p className="text-sm text-ink-500 mt-1">{body}</p>
    </div>
  );
}

function SolutionStep({ n, title, icon, body }: { n: string; title: string; icon: React.ReactNode; body: string }) {
  return (
    <div className="rounded-2xl bg-white border border-ink-100 p-6">
      <div className="flex items-center gap-3 mb-3">
        <div className="h-10 w-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center">{icon}</div>
        <span className="text-xs font-mono text-ink-400">{n}</span>
      </div>
      <h3 className="font-semibold text-lg text-ink-900">{title}</h3>
      <p className="text-sm text-ink-600 mt-1">{body}</p>
    </div>
  );
}

function Feature({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-ink-100 p-5 hover:shadow-cardHover transition-shadow">
      <div className="h-10 w-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center mb-3">{icon}</div>
      <h3 className="font-semibold text-ink-900">{title}</h3>
      <p className="text-sm text-ink-500 mt-1">{body}</p>
    </div>
  );
}

function FlowRow({ step, title, body }: { step: string; title: string; body: string }) {
  return (
    <div className="flex items-start gap-4 rounded-2xl bg-ink-800 p-5">
      <div className="h-10 w-10 rounded-full bg-brand-500 text-white flex items-center justify-center font-bold shrink-0">{step}</div>
      <div>
        <h3 className="font-semibold text-white">{title}</h3>
        <p className="text-sm text-ink-400 mt-1">{body}</p>
      </div>
    </div>
  );
}
