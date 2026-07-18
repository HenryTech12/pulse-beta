import { env } from './env';
import type { Evidence, Transaction, RecommendedAction } from '@/types/contract';
import { evaluatePatterns, confidenceFor, LARGE_AMOUNT_THRESHOLD } from './patterns';
import { ngn } from '@/types/contract';

export interface CopilotResponse {
  content: string;
  evidence: Evidence[];
  matched_tx_ids: string[];
  recommended_action?: RecommendedAction;
}

export interface CopilotProvider {
  id: string;
  run(prompt: string, ctx: CopilotContext): Promise<CopilotResponse>;
}

export interface CopilotContext {
  transactions: Transaction[];
}

// --- Prompt templates ----------------------------------------------------

export const PROMPTS = {
  suspiciousOver: (ngnAmount: number) =>
    `List transactions flagged as suspicious with amount greater than ${ngn(ngnAmount)}. For each, include matched rules and a confidence score.`,
  crossCheckCountry: (country: string, hours: number) =>
    `Cross-check all transfers to ${country} in the last ${hours} hours. Flag geo anomalies and rapid repeats.`,
  createCase: (txId: string, reason: string) =>
    `Create a fraud case for transaction ${txId} with reason: ${reason}. Include evidence and a recommended action.`,
} as const;

// --- Mock provider (local, no network) -----------------------------------

const mockProvider: CopilotProvider = {
  id: 'mock',
  async run(prompt, ctx) {
    const p = prompt.toLowerCase();
    const txs = ctx.transactions;

    // "suspicious transactions over ₦50000" or "over 50000"
    if (/suspicious.*over|over\s*₦?\s*(\d+)/.test(p)) {
      const m = p.match(/over\s*₦?\s*(\d[\d,]*)/);
      const threshold = m ? Number(m[1].replace(/,/g, '')) : LARGE_AMOUNT_THRESHOLD;
      const matched = txs.filter((t) => t.amount_ngn > threshold && (t.status === 'flagged' || (t.risk_score ?? 0) > 0.5));
      const evidence = matched.flatMap((t) => buildEvidence(t));
      return {
        content: matched.length
          ? `Found ${matched.length} suspicious transaction(s) over ${ngn(threshold)}. Highest risk: ${matched[0]?.tx_id} at ${Math.round((matched[0]?.risk_score ?? 0) * 100)}% confidence.`
          : `No suspicious transactions over ${ngn(threshold)} found.`,
        evidence,
        matched_tx_ids: matched.map((t) => t.tx_id),
        recommended_action: matched[0] ? recommend(matched[0]) : 'approve',
      };
    }

    if (/cross.?check|nigeria|24\s*hour|last\s*24/.test(p)) {
      const since = Date.now() - 24 * 3600_000;
      const matched = txs.filter((t) => t.ts >= since && (t.counterparty_country === 'NG' || /nigeria/.test(p)));
      const evidence = matched.flatMap((t) => buildEvidence(t));
      return {
        content: matched.length
          ? `Cross-checked ${matched.length} transfer(s) to NG in the last 24h. ${matched.filter((t) => (t.risk_score ?? 0) > 0.5).length} flagged.`
          : 'No transfers to NG in the last 24h.',
        evidence,
        matched_tx_ids: matched.map((t) => t.tx_id),
        recommended_action: 'review',
      };
    }

    if (/create\s+case|case\s+for/.test(p)) {
      const txMatch = txs.find((t) => p.includes(t.tx_id.toLowerCase()));
      if (!txMatch) return { content: 'Could not find that transaction id.', evidence: [], matched_tx_ids: [] };
      const evidence = buildEvidence(txMatch);
      return {
        content: `Case drafted for ${txMatch.tx_id}. Recommended action: ${recommend(txMatch)}. Assign to Compliance for review.`,
        evidence,
        matched_tx_ids: [txMatch.tx_id],
        recommended_action: recommend(txMatch),
      };
    }

    return {
      content: 'I can search suspicious transactions, cross-check transfers by country, or draft a case. Try a suggested prompt.',
      evidence: [],
      matched_tx_ids: [],
    };
  },
};

// --- Remote LLM provider (optional) --------------------------------------

const remoteProvider: CopilotProvider = {
  id: 'remote',
  async run(prompt, ctx) {
    const body = {
      prompt,
      transactions: ctx.transactions.map((t) => ({
        tx_id: t.tx_id,
        amount_ngn: t.amount_ngn,
        status: t.status,
        risk_score: t.risk_score,
        counterparty_country: t.counterparty_country,
        flags: t.flags,
      })),
    };
    const res = await fetch(env.llmEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`LLM ${res.status}`);
    return (await res.json()) as CopilotResponse;
  },
};

export function getProvider(): CopilotProvider {
  return env.llmEndpoint ? remoteProvider : mockProvider;
}

// --- helpers -------------------------------------------------------------

function buildEvidence(t: Transaction): Evidence[] {
  const ev: Evidence[] = [];
  const hits = evaluatePatterns([t]);
  for (const h of hits) {
    ev.push({
      kind: 'pattern_match',
      title: h.rule.name,
      summary: h.rule.description,
      confidence: confidenceFor(t),
      data: { rule_id: h.rule.id, severity: h.rule.severity, tx_id: t.tx_id },
    });
  }
  if (t.session_id) {
    ev.push({
      kind: 'session_replay',
      title: 'Session replay',
      summary: `Session ${t.session_id} — screen sequence and keystroke timing sent to PULSE for this transaction.`,
      confidence: confidenceFor(t),
      data: { session_id: t.session_id },
    });
  }
  if (t.decision) {
    ev.push({
      kind: 'pulse_decision',
      title: 'PULSE decision',
      summary: `Live risk engine returned "${t.decision}" for this transaction.`,
      confidence: t.risk_score ?? confidenceFor(t),
      data: { decision: t.decision, risk_score: t.risk_score },
    });
  }
  if (t.flags?.includes('geo_anomaly') || t.counterparty_country !== 'NG') {
    ev.push({
      kind: 'geo_ip_anomaly',
      title: 'Geo / IP anomaly',
      summary: `Counterparty country ${t.counterparty_country} differs from home NG.`,
      confidence: 0.85,
      data: { country: t.counterparty_country },
    });
  }
  return ev;
}

function recommend(t: Transaction): RecommendedAction {
  const c = confidenceFor(t);
  if (c > 0.8) return 'block';
  if (c > 0.5) return 'soft_challenge';
  return 'approve';
}

export { buildEvidence, recommend };
