import { useState } from 'react';
import { useStore } from '@/store/appStore';
import { Button } from '@/components/ui/Button';
import { Phone, Lock, ArrowLeft, User } from 'lucide-react';

interface Props {
  onBack: () => void;
}

export function Login({ onBack }: Props) {
  const { login, register, authLoading, authError } = useStore();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!phone.trim() || !password.trim()) {
      setError('Phone and password are required.');
      return;
    }
    try {
      if (mode === 'login') {
        await login(phone.trim(), password);
      } else {
        await register(phone.trim(), password, name.trim() || undefined);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed');
    }
  };

  return (
    <div className="min-h-screen bg-ink-50 flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-br from-brand-500 to-brand-700 text-white px-5 pt-12 pb-16 rounded-b-3xl">
        <button onClick={onBack} className="flex items-center gap-1.5 text-brand-50/80 hover:text-white text-sm mb-6">
          <ArrowLeft size={16} /> Back
        </button>
        <div className="flex items-center gap-2 mb-3">
          <div className="h-10 w-10 rounded-xl bg-white/20 flex items-center justify-center font-bold text-lg">P</div>
          <span className="font-bold text-xl">Pulse</span>
        </div>
        <h1 className="text-2xl font-bold">
          {mode === 'login' ? 'Welcome back' : 'Create your account'}
        </h1>
        <p className="text-brand-50/80 text-sm mt-1">
          {mode === 'login'
            ? 'Sign in with your phone number to start a session.'
            : 'Sign up with your phone number to get started.'}
        </p>
      </div>

      {/* Form */}
      <div className="flex-1 px-5 -mt-8">
        <div className="bg-white rounded-2xl shadow-card border border-ink-100 p-5">
          <form onSubmit={submit} className="space-y-4">
            {mode === 'signup' && (
              <Field
                icon={<User size={16} />}
                label="Display name (optional)"
                value={name}
                onChange={setName}
                placeholder="e.g. Adaeze N."
                type="text"
              />
            )}
            <Field
              icon={<Phone size={16} />}
              label="Phone number"
              value={phone}
              onChange={setPhone}
              placeholder="+234 803 123 4567"
              type="tel"
              autoComplete="tel"
            />
            <Field
              icon={<Lock size={16} />}
              label="Password"
              value={password}
              onChange={setPassword}
              placeholder="••••••••"
              type="password"
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            />

            {(error || authError) && (
              <p className="text-sm text-danger bg-red-50 rounded-lg px-3 py-2">{error || authError}</p>
            )}

            <Button type="submit" block size="lg" loading={authLoading}>
              {mode === 'login' ? 'Sign in & start session' : 'Create account'}
            </Button>
          </form>

          <div className="mt-4 text-center text-sm text-ink-500">
            {mode === 'login' ? (
              <>
                No account?{' '}
                <button onClick={() => setMode('signup')} className="text-brand-600 font-medium hover:underline">
                  Sign up
                </button>
              </>
            ) : (
              <>
                Already have an account?{' '}
                <button onClick={() => setMode('login')} className="text-brand-600 font-medium hover:underline">
                  Sign in
                </button>
              </>
            )}
          </div>
        </div>

        <p className="text-center text-xs text-ink-400 mt-4 px-4">
          Your phone number is your username. Pulse uses it to start a fraud-detection session the moment you sign in.
        </p>
      </div>
    </div>
  );
}

function Field({
  icon, label, value, onChange, placeholder, type, autoComplete,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  type: string;
  autoComplete?: string;
}) {
  return (
    <label className="block text-sm">
      <span className="text-ink-500 font-medium">{label}</span>
      <div className="mt-1 relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400">{icon}</span>
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          type={type}
          autoComplete={autoComplete}
          className="w-full h-12 pl-10 pr-3 rounded-xl border border-ink-200 focus:border-brand-400 text-sm"
        />
      </div>
    </label>
  );
}
