import { type ReactNode, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '@/lib/cn';

interface Props {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function Modal({ open, onClose, title, children, className, size = 'md' }: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;
  const widths = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-3xl' };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-ink-900/40 backdrop-blur-sm animate-fadeIn" onClick={onClose} aria-hidden />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          'relative w-full bg-white rounded-t-3xl sm:rounded-2xl shadow-panel animate-slideUp',
          widths[size],
          className,
        )}
      >
        {title && (
          <div className="flex items-center justify-between px-5 py-4 border-b border-ink-100">
            <h2 className="text-base font-semibold text-ink-900">{title}</h2>
            <button
              onClick={onClose}
              aria-label="Close"
              className="p-1.5 rounded-lg text-ink-500 hover:bg-ink-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
            >
              <X size={18} />
            </button>
          </div>
        )}
        <div className="max-h-[80vh] overflow-y-auto">{children}</div>
      </div>
    </div>,
    document.body,
  );
}
