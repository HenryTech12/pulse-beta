import { NavLink } from 'react-router-dom';
import { Home, Send, Phone, Gamepad2, Wallet, Settings as SettingsIcon, Radio, FileText } from 'lucide-react';
import { cn } from '@/lib/cn';

const tabs = [
  { to: '/', label: 'Home', icon: Home, end: true },
  { to: '/transfer', label: 'Transfer', icon: Send },
  { to: '/airtime', label: 'Airtime', icon: Phone },
  { to: '/betting', label: 'Betting', icon: Gamepad2 },
  { to: '/wallet', label: 'Wallet', icon: Wallet },
  { to: '/cases', label: 'Cases', icon: FileText },
  { to: '/simulator', label: 'Sim', icon: Radio },
  { to: '/settings', label: 'Settings', icon: SettingsIcon },
];

export function TabBar() {
  return (
    <nav
      aria-label="Primary"
      className="fixed bottom-0 inset-x-0 z-20 bg-white border-t border-ink-100 lg:max-w-2xl lg:left-1/2 lg:-translate-x-1/2"
    >
      <div className="flex overflow-x-auto scroll-thin">
        {tabs.map((t) => (
          <NavLink
            key={t.to}
            to={t.to}
            end={t.end}
            className={({ isActive }) =>
              cn(
                'flex-1 min-w-[64px] flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium transition-colors',
                isActive ? 'text-brand-600' : 'text-ink-500 hover:text-ink-700',
              )
            }
          >
            <t.icon size={20} />
            {t.label}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
