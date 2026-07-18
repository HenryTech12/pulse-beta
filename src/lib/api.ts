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

// Only two endpoints exist on the real PULSE backend (api.py). Everything
// else the old frontend called (/transactions, /cases) was never built —
// see PULSE_Frontend_Integration_Fix_Brief.docx §3.4. Those now live purely
// client-side in src/lib/mock/fixtures.ts and are never routed through here.
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
};
