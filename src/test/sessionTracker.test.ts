import { describe, it, expect, beforeEach } from 'vitest';
import { sessionTracker } from '@/lib/sessionTracker';

describe('sessionTracker', () => {
  beforeEach(() => {
    sessionTracker.reset();
    localStorage.clear();
  });

  it('builds one batched request, not per-event', () => {
    sessionTracker.recordScreen('login');
    sessionTracker.recordScreen('dashboard');
    sessionTracker.recordScreen('transfer');
    sessionTracker.recordScreen('confirm');
    sessionTracker.recordKeystroke();
    sessionTracker.recordKeystroke();
    sessionTracker.recordKeystroke();

    const req = sessionTracker.buildRequest('u_demo', 760000);

    expect(req.user_id).toBe('u_demo');
    expect(req.screen_sequence).toEqual(['login', 'dashboard', 'transfer', 'confirm']);
    // 3 keystrokes -> 2 intervals between them
    expect(req.keystroke_intervals.length).toBe(2);
    expect(req.transaction_amount).toBe(760000);
    expect(typeof req.device_hash).toBe('string');
    expect(req.network_type.length).toBeGreaterThan(0);
    expect(req.hour_of_day).toBeGreaterThanOrEqual(0);
    expect(req.hour_of_day).toBeLessThan(24);
  });

  it('omits transaction_amount when not provided', () => {
    sessionTracker.recordScreen('login');
    const req = sessionTracker.buildRequest('u_demo');
    expect(req.transaction_amount).toBeUndefined();
  });

  it('collapses consecutive duplicate screen views', () => {
    sessionTracker.recordScreen('dashboard');
    sessionTracker.recordScreen('dashboard');
    sessionTracker.recordScreen('transfer');
    const req = sessionTracker.buildRequest('u_demo');
    expect(req.screen_sequence).toEqual(['dashboard', 'transfer']);
  });

  it('reset clears accumulated signal for the next session', () => {
    sessionTracker.recordScreen('login');
    sessionTracker.recordKeystroke();
    sessionTracker.recordKeystroke();
    sessionTracker.reset();
    const req = sessionTracker.buildRequest('u_demo');
    expect(req.screen_sequence).toEqual([]);
    expect(req.keystroke_intervals).toEqual([]);
  });
});
