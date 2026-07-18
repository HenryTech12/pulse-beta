import { type ReactNode } from 'react';
import { cn } from '@/lib/cn';

type Tone = 'neutral' | 'success' | 'warning' | 'danger' | 'info' | 'brand';

const tones: Record<Tone, string> = {
  neutral: 'bg-ink-100 text-ink-700',
  success: 'bg-green-100 text-green-700',
  warning: 'bg-amber-100 text-amber-700',
  danger: 'bg-red-100 text-red-700',
  info: 'bg-blue-100 text-blue-700',
  brand: 'bg-brand-50 text-brand-700',
};

export function Badge({ tone = 'neutral', children, className }: { tone?: Tone; children: ReactNode; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium', tones[tone], className)}>
      {children}
    </span>
  );
}
