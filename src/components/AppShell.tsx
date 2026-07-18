import { Suspense, lazy, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useStore } from '@/store/appStore';
import { CopilotPanel } from '@/components/CopilotPanel';
import { DecisionGate } from '@/components/DecisionGate';
import { TabBar } from '@/components/TabBar';
import type { ScreenName } from '@/types/contract';
import { Dashboard } from '@/screens/Dashboard';
import { Transfer, Airtime, Betting, Wallet, Settings } from '@/screens/Services';
import { Sparkles, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { env } from '@/lib/env';

const Simulator = lazy(() => import('@/screens/Simulator').then((m) => ({ default: m.Simulator })));
const Cases = lazy(() => import('@/screens/Cases').then((m) => ({ default: m.Cases })));

export function AppShell({ onLogout }: { onLogout?: () => void }) {
  return (
    <HashRouter>
      <a href="#main" className="skip-link">Skip to content</a>
      <div className="min-h-screen max-w-md mx-auto bg-ink-50 lg:max-w-2xl lg:mx-auto flex flex-col">
        <ScreenTracker />
        <Header onLogout={onLogout} />
        <main id="main" className="flex-1 px-4 pt-4 pb-28">
          <Suspense fallback={<div className="text-center py-10 text-ink-500">Loading…</div>}>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/transfer" element={<Transfer />} />
              <Route path="/airtime" element={<Airtime />} />
              <Route path="/betting" element={<Betting />} />
              <Route path="/wallet" element={<Wallet />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/simulator" element={<Simulator />} />
              <Route path="/cases" element={<Cases />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </main>
        <TabBar />
      </div>
      <CopilotPanel />
      <CopilotFab />
      <DecisionGate />
    </HashRouter>
  );
}

// Real screen names required by the PULSE risk model (§2.3 of the
// integration brief) don't map 1:1 to our routes ("/" is "dashboard",
// "/wallet" is "balance"). This keeps the accumulator fed on every
// navigation without polluting each screen component with tracking calls.
const ROUTE_TO_SCREEN: Record<string, ScreenName> = {
  '/': 'dashboard',
  '/dashboard': 'dashboard',
  '/transfer': 'transfer',
  '/wallet': 'balance',
  '/settings': 'settings',
};

function ScreenTracker() {
  const loc = useLocation();
  const trackScreen = useStore((s) => s.trackScreen);
  useEffect(() => {
    const screen = ROUTE_TO_SCREEN[loc.pathname];
    if (screen) trackScreen(screen);
  }, [loc.pathname, trackScreen]);
  return null;
}

function CopilotFab() {
  const { copilotOpen, toggleCopilot } = useStore();
  if (copilotOpen) return null;
  return (
    <button
      onClick={() => toggleCopilot(true)}
      aria-label="Open analyst copilot"
      className="fixed bottom-20 right-4 lg:right-8 z-30 h-14 w-14 rounded-full bg-brand-500 text-white shadow-lg hover:bg-brand-600 animate-pulseRing flex items-center justify-center focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2"
    >
      <Sparkles size={22} />
    </button>
  );
}

function Header({ onLogout }: { onLogout?: () => void }) {
  const { profile } = useStore();
  const loc = useLocation();
  const titles: Record<string, string> = {
    '/': 'Pulse',
    '/dashboard': 'Pulse',
    '/transfer': 'Transfer',
    '/airtime': 'Airtime',
    '/betting': 'Betting',
    '/wallet': 'Wallet',
    '/settings': 'Settings',
    '/simulator': 'Simulator',
    '/cases': 'Cases',
  };
  const title = titles[loc.pathname] ?? 'Pulse';

  return (
    <header className="sticky top-0 z-20 bg-white/90 backdrop-blur border-b border-ink-100">
      <div className="px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-brand-500 text-white flex items-center justify-center font-bold">P</div>
          <h1 className="font-bold text-ink-900">{title}</h1>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={
              'hidden sm:inline text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full ' +
              (env.useMock ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700')
            }
            title={env.useMock ? 'Using local mock decisions — set VITE_USE_MOCK=false to hit the real API' : `Live: ${env.apiBaseUrl}`}
          >
            {env.useMock ? 'Mock mode' : 'Live'}
          </span>
          <span className="text-sm text-ink-500 hidden sm:inline">{profile?.display_name}</span>
          {onLogout && (
            <Button variant="ghost" size="sm" onClick={onLogout} leftIcon={<LogOut size={14} />}>
              Sign out
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
