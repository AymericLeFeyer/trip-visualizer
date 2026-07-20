import type { ReactNode } from 'react';
import { cn } from '@/shared/lib/cn';

interface FieldProps {
  label: string;
  htmlFor?: string;
  className?: string;
  children: ReactNode;
}

export function Field({ label, htmlFor, className, children }: FieldProps) {
  return (
    <div className={cn('space-y-1', className)}>
      <label
        htmlFor={htmlFor}
        className="text-xs font-medium uppercase tracking-wide text-muted-foreground"
      >
        {label}
      </label>
      {children}
    </div>
  );
}
