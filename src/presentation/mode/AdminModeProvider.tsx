import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { ADMIN_CODE } from '@/shared/constants/admin';

interface AdminModeValue {
  /** Mode admin actif (édition autorisée). Sinon : visualisation (lecture seule). */
  isAdmin: boolean;
  /** Tente de passer en admin avec un code. Renvoie true si le code est bon. */
  unlock: (code: string) => boolean;
  /** Repasse en mode visualisation. */
  lock: () => void;
}

const STORAGE_KEY = 'trip-visualizer.admin';
const AdminModeContext = createContext<AdminModeValue | null>(null);

export function AdminModeProvider({ children }: { children: ReactNode }) {
  const [isAdmin, setIsAdmin] = useState<boolean>(() => localStorage.getItem(STORAGE_KEY) === '1');

  useEffect(() => {
    if (isAdmin) localStorage.setItem(STORAGE_KEY, '1');
    else localStorage.removeItem(STORAGE_KEY);
  }, [isAdmin]);

  const value = useMemo<AdminModeValue>(
    () => ({
      isAdmin,
      unlock: (code) => {
        if (code === ADMIN_CODE) {
          setIsAdmin(true);
          return true;
        }
        return false;
      },
      lock: () => setIsAdmin(false),
    }),
    [isAdmin],
  );

  return <AdminModeContext.Provider value={value}>{children}</AdminModeContext.Provider>;
}

export function useAdminMode(): AdminModeValue {
  const ctx = useContext(AdminModeContext);
  if (!ctx) throw new Error('useAdminMode doit être utilisé dans un AdminModeProvider');
  return ctx;
}
