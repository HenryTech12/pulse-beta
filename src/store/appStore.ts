import { create } from 'zustand';
import { api } from '@/lib/api';
import { mockFixtures } from '@/lib/mock/fixtures';
import { sessionTracker } from '@/lib/sessionTracker';
import { runSimulatedPayment, type PaymentResult } from '@/lib/payments';
import { getProvider, buildEvidence, recommend, type CopilotContext } from '@/lib/copilot';
import { confidenceFor } from '@/lib/patterns';
import { signInWithPhone, signUpWithPhone, signOut, fetchProfile } from '@/lib/auth';
import { getSupabase } from '@/lib/env';
import type {
  Case,
  CopilotMessage,
  DemoProfile,
  Evidence,
  Personalization,
  RecommendedAction,
  RiskDecision,
  ScreenName,
  SessionEventResponse,
  SessionLogEntry,
  Transaction,
} from '@/types/contract';

interface Filters {
  dateFrom?: number;
  dateTo?: number;
  minAmount?: number;
  maxAmount?: number;
  status?: Transaction['status'] | 'all';
}

interface AppState {
  ready: boolean;
  authReady: boolean;
  session: { user: { id: string } | null } | null;
  userId: string;
  profile: DemoProfile | null; // identity — Supabase-backed
  personalization: Personalization | null; // real PULSE risk-personalization payload
  transactions: Transaction[];
  cases: Case[];
  copilotOpen: boolean;
  copilotMessages: CopilotMessage[];
  copilotLoading: boolean;
  filters: Filters;
  authLoading: boolean;
  authError: string | null;

  // Decision gate — the visible outcome of the last /session/event call.
  pendingDecision: { response: SessionEventResponse; amountNgn?: number; onResolved: (proceed: boolean) => void } | null;
  lastSessionLog: SessionLogEntry | null;
  sessionLogs: SessionLogEntry[];
  paymentResult: PaymentResult | null;

  initAuth: () => Promise<void>;
  login: (phone: string, password: string) => Promise<void>;
  register: (phone: string, password: string, name?: string) => Promise<void>;
  logout: () => Promise<void>;

  init: () => Promise<void>;
  setUserId: (id: string) => void;
  setFilters: (f: Partial<Filters>) => void;
  filteredTxs: () => Transaction[];

  /** Call on every route/screen change to feed the session accumulator. */
  trackScreen: (screen: ScreenName) => void;
  /** Call on every keydown in a tracked field. */
  trackKeystroke: () => void;
  /**
   * Fires the ONE batched /session/event call for everything captured so
   * far, resolves the risk decision, and — for soft_challenge/block —
   * blocks the caller until the user has gone through the UI gate.
   * Returns true if the action should proceed, false if blocked/cancelled.
   */
  submitSession: (amountNgn?: number) => Promise<boolean>;
  resolvePendingDecision: (proceed: boolean) => void;
  runPayment: (amountNgn: number) => Promise<PaymentResult>;
  clearPaymentResult: () => void;
  ingestTransaction: (t: Transaction) => void;

  toggleCopilot: (open?: boolean) => void;
  runCopilot: (prompt: string) => Promise<void>;
  applyDecision: (txId: string, action: RecommendedAction) => void;
  createCaseFromTx: (txId: string, reason: string, owner?: Case['owner']) => Promise<Case>;
  assignCase: (caseId: string, owner: Case['owner']) => Promise<void>;
  addCaseNote: (caseId: string, body: string) => Promise<void>;
}

const uid = () => Math.random().toString(36).slice(2, 10);

export const useStore = create<AppState>((set, get) => ({
  ready: false,
  authReady: false,
  session: null,
  userId: 'u_demo',
  profile: null,
  personalization: null,
  transactions: [],
  cases: [],
  copilotOpen: false,
  copilotMessages: [
    {
      id: 'welcome',
      role: 'assistant',
      content: 'Hi, I’m the Pulse analyst copilot. Ask me to surface suspicious transactions, cross-check transfers, or draft a case.',
      ts: Date.now(),
    },
  ],
  copilotLoading: false,
  filters: { status: 'all' },
  authLoading: false,
  authError: null,
  pendingDecision: null,
  lastSessionLog: null,
  sessionLogs: [],
  paymentResult: null,

  async initAuth() {
    const supabase = getSupabase();
    const { data: { session } } = await supabase.auth.getSession();
    set({ session, authReady: true, userId: session?.user?.id ?? 'u_demo' });

    supabase.auth.onAuthStateChange((_event, sess) => {
      (async () => {
        set({ session: sess, userId: sess?.user?.id ?? 'u_demo' });
        if (sess?.user) {
          const profile = await fetchProfile(sess.user.id);
          if (profile) set({ profile });
          await get().init();
        } else {
          set({ profile: null, personalization: null, transactions: [], cases: [], ready: false });
        }
      })();
    });
  },

  async login(phone, password) {
    set({ authLoading: true, authError: null });
    try {
      const data = await signInWithPhone(phone, password);
      if (data.user) {
        const profile = await fetchProfile(data.user.id);
        set({ profile, userId: data.user.id });
        sessionTracker.reset();
        get().trackScreen('login');
        await get().init();
      }
    } catch (e) {
      set({ authError: e instanceof Error ? e.message : 'Login failed' });
      throw e;
    } finally {
      set({ authLoading: false });
    }
  },

  async register(phone, password, name) {
    set({ authLoading: true, authError: null });
    try {
      const data = await signUpWithPhone(phone, password, name);
      if (data.user) {
        const profile = await fetchProfile(data.user.id);
        set({ profile, userId: data.user.id });
        sessionTracker.reset();
        get().trackScreen('login');
        await get().init();
      }
    } catch (e) {
      set({ authError: e instanceof Error ? e.message : 'Sign up failed' });
      throw e;
    } finally {
      set({ authLoading: false });
    }
  },

  async logout() {
    get().trackScreen('logout');
    // Flush whatever's left of this session before tearing down, best-effort.
    if (sessionTracker.hasSignal()) {
      await get().submitSession().catch(() => undefined);
    }
    await signOut();
    set({ session: null, profile: null, personalization: null, transactions: [], cases: [], ready: false, copilotOpen: false });
  },

  async init() {
    let p: Personalization | null = null;
    try {
      p = await api.getPersonalization(get().userId);
    } catch {
      p = null;
    }
    set({
      personalization: p,
      transactions: mockFixtures.getTransactions(),
      cases: mockFixtures.getCases(),
      ready: true,
    });
  },

  setUserId(id) {
    set({ userId: id });
    api.getPersonalization(id).then((p) => set({ personalization: p })).catch(() => undefined);
  },

  setFilters(f) {
    set((s) => ({ filters: { ...s.filters, ...f } }));
  },

  filteredTxs() {
    const { transactions, filters } = get();
    return transactions.filter((t) => {
      if (filters.dateFrom && t.ts < filters.dateFrom) return false;
      if (filters.dateTo && t.ts > filters.dateTo) return false;
      if (filters.minAmount != null && t.amount_ngn < filters.minAmount) return false;
      if (filters.maxAmount != null && t.amount_ngn > filters.maxAmount) return false;
      if (filters.status && filters.status !== 'all' && t.status !== filters.status) return false;
      return true;
    });
  },

  trackScreen(screen) {
    sessionTracker.recordScreen(screen);
  },

  trackKeystroke() {
    sessionTracker.recordKeystroke();
  },

  async submitSession(amountNgn) {
    const userId = get().userId;
    const request = sessionTracker.buildRequest(userId, amountNgn);
    const log: SessionLogEntry = { session_id: 'S-' + uid(), started_at: Date.now(), request, response: null };

    let response: SessionEventResponse;
    try {
      response = await api.sendSessionEvent(request);
    } catch (e) {
      log.error = e instanceof Error ? e.message : String(e);
      set((s) => ({ lastSessionLog: log, sessionLogs: [log, ...s.sessionLogs].slice(0, 20) }));
      sessionTracker.reset();
      // Backend unreachable — fail safe to soft_challenge rather than
      // silently letting a high-risk action through.
      response = { user_id: userId, risk_score: 0.5, is_cold_start: true, decision: 'soft_challenge', reasoning: 'PULSE API unreachable — defaulting to a verification step rather than failing open.', source: 'fallback' };
    }
    log.response = response;
    set((s) => ({ lastSessionLog: log, sessionLogs: [log, ...s.sessionLogs].slice(0, 20) }));
    sessionTracker.reset();

    // Log a demo-layer transaction row so Dashboard/Cases reflect what
    // PULSE actually decided, when this was a transfer.
    if (amountNgn != null) {
      const tx: Transaction = {
        tx_id: 'TX-' + uid().toUpperCase(),
        user_id: userId,
        counterparty: 'Simulated recipient',
        counterparty_country: 'NG',
        direction: 'out',
        channel: 'transfer',
        amount_ngn: amountNgn,
        currency: 'NGN',
        status: response.decision === 'block' ? 'failed' : response.decision === 'soft_challenge' ? 'flagged' : 'success',
        ts: Date.now(),
        session_id: log.session_id,
        risk_score: response.risk_score,
        decision: response.decision,
        flags: response.decision !== 'approve' ? [response.decision] : [],
      };
      get().ingestTransaction(tx);
    }

    if (response.decision === 'approve') return true;

    // soft_challenge / block — surface the decision gate and wait for the
    // user (or the gate's own logic) to resolve it.
    return new Promise<boolean>((resolve) => {
      set({
        pendingDecision: {
          response,
          amountNgn,
          onResolved: (proceed) => {
            set({ pendingDecision: null });
            resolve(proceed);
          },
        },
      });
    });
  },

  resolvePendingDecision(proceed) {
    const pending = get().pendingDecision;
    if (pending) pending.onResolved(proceed);
  },

  async runPayment(amountNgn) {
    const result = await runSimulatedPayment(amountNgn);
    set({ paymentResult: result });
    return result;
  },

  clearPaymentResult() {
    set({ paymentResult: null });
  },

  ingestTransaction(t) {
    mockFixtures.addTransaction(t);
    set((s) => ({ transactions: [t, ...s.transactions] }));
  },

  toggleCopilot(open) {
    set((s) => ({ copilotOpen: open ?? !s.copilotOpen }));
  },

  async runCopilot(prompt) {
    const userMsg: CopilotMessage = { id: uid(), role: 'user', content: prompt, ts: Date.now() };
    set((s) => ({ copilotMessages: [...s.copilotMessages, userMsg], copilotLoading: true }));
    try {
      const ctx: CopilotContext = { transactions: get().transactions };
      const res = await getProvider().run(prompt, ctx);
      const assistantMsg: CopilotMessage = {
        id: uid(),
        role: 'assistant',
        content: res.content,
        ts: Date.now(),
        evidence: res.evidence,
        matched_tx_ids: res.matched_tx_ids,
        actions: res.recommended_action
          ? [
              { label: 'Approve', kind: 'approve' },
              { label: 'Soft Challenge', kind: 'soft_challenge' },
              { label: 'Block', kind: 'block' },
            ]
          : undefined,
      };
      set((s) => ({ copilotMessages: [...s.copilotMessages, assistantMsg] }));
    } catch (e) {
      const err = e instanceof Error ? e.message : String(e);
      set((s) => ({
        copilotMessages: [...s.copilotMessages, { id: uid(), role: 'assistant', content: `Error: ${err}`, ts: Date.now() }],
      }));
    } finally {
      set({ copilotLoading: false });
    }
  },

  applyDecision(txId, action) {
    set((s) => ({
      transactions: s.transactions.map((t) =>
        t.tx_id === txId
          ? { ...t, status: action === 'approve' ? 'success' : action === 'block' ? 'failed' : 'flagged' }
          : t,
      ),
    }));
  },

  async createCaseFromTx(txId, reason, owner = 'Compliance') {
    const tx = get().transactions.find((t) => t.tx_id === txId);
    if (!tx) throw new Error('tx not found');
    const evidence: Evidence[] = buildEvidence(tx);
    const c = mockFixtures.createCase({
      transaction_ids: [txId],
      evidence,
      recommended_action: recommend(tx),
      owner,
      status: 'open',
      notes: [{ author: 'copilot', body: reason, ts: Date.now() }],
      confidence: confidenceFor(tx),
    });
    set((s) => ({
      cases: [c, ...s.cases],
      copilotMessages: s.copilotMessages.map((m) =>
        m.matched_tx_ids?.includes(txId) && !m.case_id ? { ...m, case_id: c.case_id } : m,
      ),
    }));
    return c;
  },

  async assignCase(caseId, owner) {
    const c = mockFixtures.updateCase(caseId, { owner });
    set((s) => ({ cases: s.cases.map((x) => (x.case_id === caseId ? c : x)) }));
  },

  async addCaseNote(caseId, body) {
    const prev = get().cases.find((c) => c.case_id === caseId);
    if (!prev) return;
    const note = { author: 'analyst', body, ts: Date.now() };
    const c = mockFixtures.updateCase(caseId, { notes: [...prev.notes, note] });
    set((s) => ({ cases: s.cases.map((x) => (x.case_id === caseId ? c : x)) }));
  },
}));

export type { RiskDecision };
