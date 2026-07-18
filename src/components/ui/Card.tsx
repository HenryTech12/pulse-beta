import { type HTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/lib/cn';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  hover?: boolean;
}

export function Card({ children, hover, className, ...rest }: CardProps) {
  return (
    <div
      className={cn(
        'bg-white rounded-2xl shadow-card border border-ink-100',
        hover && 'transition-shadow hover:shadow-cardHover',
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

export function CardBody({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('p-4', className)}>{children}</div>;
}
