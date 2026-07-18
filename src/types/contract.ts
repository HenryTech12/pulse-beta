// ============================================================================
// REAL PULSE BACKEND CONTRACT — mirrors api.py exactly (see API_CONTRACT.md
// and PULSE_Frontend_Integration_Fix_Brief.docx). Only these two endpoints
// exist on the real backend. Everything below this block is demo-only UI
// state and is NEVER sent to /session/event or /user/{id}/personalization.
// ============================================================================

/** Exact screen identifiers the risk model was trained on. Labels shown to
 * the user can differ, but whatever is pushed into screen_sequence must be
 * one of these strings. */
export const SCREENS = [
  'login',
  'dashboard',
  'balance',
  'transfer',
  'confirm',
  'logout',
  'settings',
  'beneficiary_add',
  'limit_change',
] as const;

export type ScreenName = (typeof SCREENS)[number];

/** POST /session/event request body. One call per session — the full
 * keystroke and screen history batched together, not a stream of
 * micro-events. */
export interface SessionEventRequest {
  user_id: string;
  keystroke_intervals: number[]; // ms between keystrokes, whole session
  session_duration_sec: number;
  screen_sequence: ScreenName[]; // in order visited, this session
  hour_of_day: number; // 0-23, decimals allowed (e.g. 19.5)
  device_hash: string;
  network_type: string; // e.g. "wifi_home" | "mobile_data"
  transaction_amount?: number; // only when the session involves a transfer
}

export type RiskDecision = 'approve' | 'soft_challenge' | 'block';

/** POST /session/event response body. */
export interface SessionEventResponse {
  user_id: string;
  risk_score: number; // 0..1
  is_cold_start: boolean;
  decision: RiskDecision;
  reasoning: string;
  source: 'llm' | 'fallback' | string;
}

/** GET /user/{user_id}/personalization response body. */
export interface Personalization {
  user_id: string;
  archetype: string;
  preferred_check_day: number; // 0-6
  preferred_check_hour: number;
  estimated_recurring_amount: number;
  days_until_due: number;
  current_balance: number;
  projected_balance: number;
  shortfall_amount: number;
}

// Naira formatting helper — PULSE amounts are in NGN.
export function ngn(amount: number): string {
  return '₦' + Math.round(amount).toLocaleString('en-NG');
}

// ============================================================================
// DEMO-ONLY TYPES — power the mock banking UI, session simulator, and the
// fraud-ops "Cases" / "Copilot" screens built for the HackX presentation.
// None of this is sent to or read from the real PULSE API. There is no
// /transactions or /cases endpoint on the backend (confirmed in the
// Frontend Integration Fix Brief, §3.4) — these are local-only, clearly
// separated so judges aren't told they're talking to a live backend when
// they aren't.
// ============================================================================

/** Local identity/profile info (from Supabase auth), separate from the
 * real PULSE risk-personalization payload above. */
export interface DemoProfile {
  user_id: string;
  display_name: string;
  home_country: string;
  preferred_language: string;
  last_login_geo?: string;
}

export type TxStatus = 'success' | 'pending' | 'failed' | 'flagged';
export type TxDirection = 'in' | 'out';
export type TxChannel = 'transfer' | 'airtime' | 'betting' | 'wallet' | 'topup';

export interface Transaction {
  tx_id: string;
  user_id: string;
  counterparty: string;
  counterparty_country: string;
  direction: TxDirection;
  channel: TxChannel;
  amount_ngn: number;
  currency: string;
  status: TxStatus;
  ts: number; // epoch ms
  session_id?: string;
  risk_score?: number; // 0..1 — from the real decision when available
  decision?: RiskDecision;
  flags?: string[]; // matched local pattern-rule ids (demo heuristics only)
}

export type EvidenceKind =
  | 'session_replay'
  | 'keystroke_heatmap'
  | 'geo_ip_anomaly'
  | 'personalization_score'
  | 'pattern_match'
  | 'pulse_decision';

export interface Evidence {
  kind: EvidenceKind;
  title: string;
  summary: string;
  confidence: number; // 0..1
  data?: Record<string, unknown>;
}

export type RecommendedAction = 'approve' | 'soft_challenge' | 'block' | 'review';
export type CaseOwner = 'Compliance' | 'CS' | 'Unassigned';

export interface Case {
  case_id: string;
  transaction_ids: string[];
  evidence: Evidence[];
  recommended_action: RecommendedAction;
  owner: CaseOwner;
  status: 'open' | 'in_review' | 'resolved' | 'escalated';
  notes: { author: string; body: string; ts: number }[];
  created_at: number;
  confidence: number;
}

export interface PatternRule {
  id: string;
  name: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
  match: (tx: Transaction) => boolean;
}

export interface CopilotMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  ts: number;
  evidence?: Evidence[];
  matched_tx_ids?: string[];
  case_id?: string;
  actions?: { label: string; kind: RecommendedAction }[];
}

/** A single locally-captured keystroke, used only to build
 * keystroke_intervals for the real request. Never sent as-is. */
export interface KeystrokeSample {
  key: string;
  ts: number;
}

/** Local record of what was actually sent to /session/event and what came
 * back, kept for session replay / judge demo purposes. */
export interface SessionLogEntry {
  session_id: string;
  started_at: number;
  request: SessionEventRequest;
  response: SessionEventResponse | null;
  error?: string;
}
