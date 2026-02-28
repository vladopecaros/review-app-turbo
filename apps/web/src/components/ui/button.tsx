import * as React from 'react';

import { cn } from '@/lib/utils';

type ButtonVariant = 'default' | 'secondary' | 'ghost' | 'destructive' | 'outline';
type ButtonSize = 'sm' | 'md' | 'lg';

export function buttonVariants({
  variant = 'default',
  size = 'md',
  className,
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
}) {
  const base =
    'inline-flex items-center justify-center gap-2 rounded-lg border text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500';

  const variants: Record<ButtonVariant, string> = {
    default: 'border-blue-500 bg-blue-500 text-white hover:bg-blue-600 hover:border-blue-600',
    secondary: 'border-[color:var(--border)] bg-[color:var(--surface-2)] text-[color:var(--text)] hover:bg-[color:var(--muted)]',
    ghost: 'border-transparent bg-transparent text-[color:var(--text)] hover:bg-white/5',
    destructive: 'border-red-500 bg-red-500 text-white hover:bg-red-600 hover:border-red-600',
    outline: 'border-[color:var(--border)] bg-transparent text-[color:var(--text)] hover:bg-white/5',
  };

  const sizes: Record<ButtonSize, string> = {
    sm: 'h-9 px-3',
    md: 'h-10 px-4',
    lg: 'h-11 px-5 text-sm',
  };

  return cn(base, variants[variant], sizes[size], className);
}

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = 'default', size = 'md', type = 'button', ...props },
  ref,
) {
  return (
    <button ref={ref} type={type} className={buttonVariants({ variant, size, className })} {...props} />
  );
});
