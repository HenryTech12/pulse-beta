import { describe, it, expect } from 'vitest';
import { demoUserIdFor } from '@/lib/demoUser';

describe('demoUserIdFor', () => {
  it('maps a Supabase-style UUID into the seeded user_000..user_039 range', () => {
    const id = demoUserIdFor('ae28333e-e12e-4d10-b03b-b2d6be7fdc2d');
    expect(id).toMatch(/^user_0[0-3]\d$/);
  });

  it('is deterministic for the same input', () => {
    const a = demoUserIdFor('ae28333e-e12e-4d10-b03b-b2d6be7fdc2d');
    const b = demoUserIdFor('ae28333e-e12e-4d10-b03b-b2d6be7fdc2d');
    expect(a).toBe(b);
  });

  it('passes through an id that already looks like a seeded user', () => {
    expect(demoUserIdFor('user_007')).toBe('user_007');
  });

  it('distributes different inputs across different buckets', () => {
    const ids = new Set(
      Array.from({ length: 20 }, (_, i) => demoUserIdFor(`some-uuid-${i}`)),
    );
    // Not asserting perfect uniformity, just that it isn't collapsing
    // everything into one bucket.
    expect(ids.size).toBeGreaterThan(5);
  });
});
