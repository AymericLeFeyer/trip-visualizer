import { useState } from 'react';
import { Lock, LockOpen } from 'lucide-react';
import { useAdminMode } from '@/presentation/mode/AdminModeProvider';
import { cn } from '@/shared/lib/cn';
import { Button } from './ui/Button';
import { Input } from './ui/Input';

/** Cadenas discret : saisie du code pour passer en mode admin (édition). */
export function AdminLock() {
  const { isAdmin, unlock, lock } = useAdminMode();
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState('');
  const [error, setError] = useState(false);

  if (isAdmin) {
    return (
      <Button variant="ghost" size="icon" title="Quitter le mode admin" onClick={lock}>
        <LockOpen className="h-4 w-4 text-primary" />
      </Button>
    );
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (unlock(code)) {
      setOpen(false);
      setCode('');
      setError(false);
    } else {
      setError(true);
    }
  };

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        title="Mode admin"
        onClick={() => setOpen((o) => !o)}
      >
        <Lock className="h-4 w-4" />
      </Button>
      {open && (
        <div className="absolute right-0 top-full z-[1400] mt-1 w-48 rounded-md border border-border bg-card p-2 shadow-lg">
          <form onSubmit={submit}>
            <Input
              autoFocus
              type="password"
              value={code}
              placeholder="Code admin"
              onChange={(e) => {
                setCode(e.target.value);
                setError(false);
              }}
              className={cn(error && 'border-red-500 focus-visible:ring-red-500')}
            />
            {error && <p className="mt-1 text-xs text-red-600">Code incorrect</p>}
          </form>
        </div>
      )}
    </div>
  );
}
