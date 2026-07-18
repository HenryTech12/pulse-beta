import { useEffect, useState } from 'react';
import { useStore } from '@/store/appStore';
import { AppShell } from '@/components/AppShell';
import { Landing } from '@/screens/Landing';
import { Login } from '@/screens/Login';
import { Sparkles } from 'lucide-react';

type View = 'landing' | 'login' | 'app';

export default function App() {
  const { initAuth, authReady, session, init, ready, logout } = useStore();
  const [view, setView] = useState<View>('landing');

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  // Once auth is ready, decide the view
  useEffect(() => {
    if (!authReady) return;
    if (session?.user) {
      if (view !== 'app') setView('app');
      if (!ready) init();
    }
  }, [authReady, session, ready, init, view]);

  if (!authReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ink-50">
        <div className="flex items-center gap-2 text-brand-600">
          <Sparkles className="animate-pulse" size={20} />
          <span className="font-medium">Loading Pulse…</span>
        </div>
      </div>
    );
  }

  // Not signed in
  if (!session?.user) {
    if (view === 'login') return <Login onBack={() => setView('landing')} />;
    return <Landing onEnter={() => setView('login')} onLogin={() => setView('login')} />;
  }

  // Signed in — show the app
  return <AppShell onLogout={logout} />;
}
