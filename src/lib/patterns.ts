import type { PatternRule, Transaction } from '@/types/contract';

// Thresholds in naira (NGN). ₦50,000 ≈ $30, ₦100,000 ≈ $60.
const LARGE_AMOUNT_NGN = 50_000;

export const PATTERN_RULES: PatternRule[] = [
  {
    id: 'large_amount',
    name: 'Large amount',
    description: 'Transaction exceeds ₦50,000.',
    severity: 'medium',
    match: (t) => t.amount_ngn > LARGE_AMOUNT_NGN,
  },
  {
    id: 'geo_anomaly',
    name: 'Geo / IP anomaly',
    description: 'Session geo country differs from user home country.',
    severity: 'high',
    match: (t) => t.flags?.includes('geo_anomaly') || t.counterparty_country !== 'NG',
  },
  {
    id: 'rapid_repeat',
    name: 'Rapid repeat',
    description: 'Multiple similar transactions within 5 minutes.',
    severity: 'high',
    match: (t) => !!t.flags?.includes('rapid_repeat'),
  },
  {
    id: 'off_hours',
    name: 'Off-hours activity',
    description: 'Transaction submitted between 1am and 5am local time.',
    severity: 'low',
    match: (t) => {
      const h = new Date(t.ts).getHours();
      return h >= 1 && h < 5;
    },
  },
];

export const LARGE_AMOUNT_THRESHOLD = LARGE_AMOUNT_NGN;

export interface PatternHit {
  rule: PatternRule;
  tx: Transaction;
}

export function evaluatePatterns(txs: Transaction[]): PatternHit[] {
  const hits: PatternHit[] = [];
  for (const t of txs) {
    for (const rule of PATTERN_RULES) {
      if (rule.match(t)) hits.push({ rule, tx: t });
    }
  }
  return hits;
}

export function confidenceFor(tx: Transaction): number {
  if (tx.risk_score != null) return tx.risk_score;
  const hits = PATTERN_RULES.filter((r) => r.match(tx));
  const weight = { low: 0.15, medium: 0.3, high: 0.5 } as const;
  return Math.min(0.99, hits.reduce((s, r) => s + weight[r.severity], 0.1));
}
