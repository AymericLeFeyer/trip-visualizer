import { Lock } from 'lucide-react';
import { useAdminMode } from '@/presentation/mode/AdminModeProvider';

/**
 * Bloc « informations confidentielles » (codes d'accès, n° de réservation…).
 * Ne s'affiche **que** si le code admin a été saisi (`isAdmin`). En lecture seule
 * (visiteur sans code), il est totalement masqué. Sûr à poser n'importe où :
 * il s'auto-protège via `useAdminMode`.
 */
export function ConfidentialBlock({ text }: { text?: string }) {
  const { isAdmin } = useAdminMode();
  if (!isAdmin || !text?.trim()) return null;
  return (
    <div className="space-y-1 rounded-md border border-amber-300 bg-amber-50/60 p-2.5 dark:border-amber-500/40 dark:bg-amber-500/5">
      <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-800 dark:text-amber-300">
        <Lock className="h-3.5 w-3.5" /> Informations confidentielles
      </div>
      <p className="whitespace-pre-wrap text-sm text-foreground">{text}</p>
    </div>
  );
}
