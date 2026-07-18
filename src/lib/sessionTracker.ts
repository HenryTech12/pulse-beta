// Accumulates real behavioral signal (keystroke timing + screen sequence)
// client-side across a session and produces ONE batched SessionEventRequest,
// matching the real backend contract (Frontend Integration Fix Brief, §3.1 —
// "one request per session, sent once, not a stream of micro-events").

import type { ScreenName, SessionEventRequest } from '@/types/contract';

function stableDeviceHash(): string {
  const KEY = 'pulse_device_hash';
  let h = localStorage.getItem(KEY);
  if (!h) {
    h = 'dev_' + Math.random().toString(36).slice(2, 10);
    localStorage.setItem(KEY, h);
  }
  return h;
}

function guessNetworkType(): string {
  const conn = (navigator as unknown as { connection?: { type?: string; effectiveType?: string } }).connection;
  if (conn?.type === 'wifi') return 'wifi_home';
  if (conn?.type === 'cellular') return 'mobile_data';
  if (conn?.effectiveType) return conn.effectiveType.includes('4g') ? 'mobile_data' : 'wifi_home';
  return 'wifi_home';
}

class SessionTracker {
  private startedAt = Date.now();
  private lastKeystrokeAt: number | null = null;
  private intervals: number[] = [];
  private screens: ScreenName[] = [];
  private deviceHash = stableDeviceHash();
  private networkType = guessNetworkType();

  /** Call on every screen/route change. Skips consecutive duplicates. */
  recordScreen(screen: ScreenName) {
    if (this.screens[this.screens.length - 1] !== screen) {
      this.screens.push(screen);
    }
  }

  /** Call on every keydown in a tracked input. Records the ms since the
   * previous keystroke anywhere in the session. */
  recordKeystroke() {
    const now = Date.now();
    if (this.lastKeystrokeAt != null) {
      this.intervals.push(now - this.lastKeystrokeAt);
    }
    this.lastKeystrokeAt = now;
  }

  hasSignal(): boolean {
    return this.screens.length > 0;
  }

  /** Builds the batched request for everything captured so far. */
  buildRequest(userId: string, transactionAmount?: number): SessionEventRequest {
    const now = new Date();
    return {
      user_id: userId,
      keystroke_intervals: [...this.intervals],
      session_duration_sec: Math.max(1, Math.round((Date.now() - this.startedAt) / 1000)),
      screen_sequence: [...this.screens],
      hour_of_day: now.getHours() + now.getMinutes() / 60,
      device_hash: this.deviceHash,
      network_type: this.networkType,
      ...(transactionAmount != null ? { transaction_amount: transactionAmount } : {}),
    };
  }

  /** Starts a fresh accumulation window — call after a session event has
   * been sent, so the next batch doesn't resend old signal. */
  reset() {
    this.startedAt = Date.now();
    this.lastKeystrokeAt = null;
    this.intervals = [];
    this.screens = [];
  }
}

export const sessionTracker = new SessionTracker();
