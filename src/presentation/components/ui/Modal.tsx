import { useEffect, type ReactNode } from 'react';
import { cn } from '@/shared/lib/cn';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  className?: string;
}

/**
 * Modale centrée maison (overlay + carte). Ferme au clic sur le fond et sur Échap.
 * Le contenu se cape à 85vh ; c'est à l'enfant de rendre un en-tête fixe + un
 * corps scrollable (`flex min-h-0 flex-col` / `flex-1 min-h-0 overflow-y-auto`).
 */
export function Modal({ open, onClose, children, className }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[1200] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          'relative z-10 flex max-h-[85vh] flex-col overflow-hidden rounded-xl border border-border bg-card shadow-2xl',
          // La largeur est entièrement pilotée par `className` si fournie.
          className ?? 'w-full max-w-md',
        )}
      >
        {children}
      </div>
    </div>
  );
}
