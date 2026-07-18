import { env } from './env';
import type { SessionEventRequest, SessionEventResponse, Personalization } from '@/types/contract';
import { mockDecisionFor, mockPersonalizationFor } from './mock/fixtures';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${env.apiBaseUrl}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
    ...init,
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`API ${res.status} ${path}: ${body}`);
  }
  return (await res.json()) as T;
}

/** Twilio Verify needs E.164 (+<countrycode><number>, no spaces/dashes).
 * Signup collects something like "+234 803 123 4567" -- strip formatting. */
export function toE164(phone: string): string {
  const trimmed = phone.trim();
  const digits = trimmed.replace(/[^\d]/g, '');
  return trimmed.startsWith('+') ? `+${digits}` : `+${digits}`;
}

export interface OtpSendResult {
  status: string; // "pending" | "simulated" | provider-specific
  simulated: boolean;
}

export interface OtpVerifyResult {
  approved: boolean;
  status: string;
  simulated: boolean;
}

// The real PULSE risk contract is exactly two endpoints on api.py --
// /session/event and /user/{id}/personalization -- and that's still all
// this file routes to the risk engine. /otp/send and /otp/verify below are
// NOT part of that contract: they're demo-app plumbing (backend/app.py,
// backed by Twilio Verify) that exists purely to make the soft_challenge
// step in DecisionGate a real verification instead of a cosmetic one.
// /transactions and /cases still don't exist anywhere on the backend --
// see PULSE_Frontend_Integration_Fix_Brief.docx §3.4 -- and stay local-only
// in src/lib/mock/fixtures.ts.
export const api = {
  /** POST /session/event — one call per session, full batched payload,
   * returns the real risk decision in the same response. */
  async sendSessionEvent(payload: SessionEventRequest): Promise<SessionEventResponse> {
    if (env.useMock) return mockDecisionFor(payload);
    return request('/session/event', { method: 'POST', body: JSON.stringify(payload) });
  },

  /** GET /user/{user_id}/personalization */
  async getPersonalization(userId: string): Promise<Personalization> {
    if (env.useMock) return mockPersonalizationFor(userId);
    return request(`/user/${encodeURIComponent(userId)}/personalization`);
  },

  /** POST /otp/send — triggers a real Twilio Verify SMS to the given phone.
   * If Twilio isn't configured server-side, the backend responds with
   * status "simulated" instead of failing, and verify() below accepts any
   * plausible code so the demo still works without live credentials. */
  async sendOtp(phone: string): Promise<OtpSendResult> {
    if (env.useMock) return { status: 'simulated', simulated: true };
    const res = await request<{ status: string }>('/otp/send', {
      method: 'POST',
      body: JSON.stringify({ phone: toE164(phone) }),
    });
    return { status: res.status, simulated: res.status === 'simulated' };
  },

  /** POST /otp/verify — checks the code against Twilio Verify. */
  async verifyOtp(phone: string, code: string): Promise<OtpVerifyResult> {
    if (env.useMock) return { approved: code.trim().length >= 4, status: 'simulated', simulated: true };
    const res = await request<{ approved: boolean; status: string }>('/otp/verify', {
      method: 'POST',
      body: JSON.stringify({ phone: toE164(phone), code: code.trim() }),
    });
    return { approved: res.approved, status: res.status, simulated: res.status === 'simulated' };
  },
};
