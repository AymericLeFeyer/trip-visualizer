import { useMemo, useState } from 'react';
import type { Trip } from '@shared/types/trip';
import {
  computeBudget,
  formatEur,
  formatJpy,
  type BudgetCategory,
} from '@/shared/lib/budget';
import { Modal } from '../ui/Modal';
import { DetailHeader } from '../details/parts';
import { Input } from '../ui/Input';

const RATE_KEY = 'trip-visualizer.jpyRate';
const DEFAULT_RATE = 165;

function loadRate(): number {
  const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(RATE_KEY) : null;
  const value = raw ? Number(raw) : NaN;
  return Number.isFinite(value) && value > 0 ? value : DEFAULT_RATE;
}

const CATEGORY_META: Record<BudgetCategory, { label: string; emoji: string }> = {
  flights: { label: 'Vols', emoji: '✈️' },
  accommodation: { label: 'Hébergements', emoji: '🛏️' },
  transport: { label: 'Transports', emoji: '🚆' },
};

const CATEGORY_ORDER: BudgetCategory[] = ['flights', 'accommodation', 'transport'];

interface BudgetModalProps {
  trip: Trip;
  open: boolean;
  onClose: () => void;
}

/** Page stats (admin) : total dépensé par catégorie avec conversion € ↔ ¥. */
export function BudgetModal({ trip, open, onClose }: BudgetModalProps) {
  const [rate, setRate] = useState<number>(loadRate);

  const budget = useMemo(() => computeBudget(trip, rate), [trip, rate]);

  const updateRate = (value: number) => {
    setRate(value);
    if (value > 0) localStorage.setItem(RATE_KEY, String(value));
  };

  return (
    <Modal open={open} onClose={onClose} className="w-full max-w-lg">
      <div className="flex min-h-0 flex-col">
        <DetailHeader title={<span>💴 Budget du voyage</span>} onClose={onClose} />

        <div className="flex-1 min-h-0 space-y-4 overflow-y-auto p-4 scroll-thin">
          {/* Taux de change variable */}
          <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-muted/40 p-3">
            <div className="min-w-0">
              <div className="text-sm font-medium">Taux de change</div>
              <p className="text-xs text-muted-foreground">Utilisé pour convertir ¥ ↔ €.</p>
            </div>
            <div className="flex items-center gap-1.5 whitespace-nowrap text-sm">
              <span>1 € =</span>
              <Input
                type="number"
                inputMode="decimal"
                min={1}
                value={rate}
                className="w-24 text-right"
                onChange={(e) => updateRate(Number(e.target.value))}
              />
              <span>¥</span>
            </div>
          </div>

          {/* Total mis en avant */}
          <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 text-center">
            <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Total dépensé
            </div>
            <div className="mt-1 text-3xl font-bold text-primary">{formatEur(budget.totalEur)}</div>
            <div className="text-sm text-muted-foreground">≈ {formatJpy(budget.totalJpy)}</div>
          </div>

          {/* Détail par catégorie */}
          <div className="space-y-2">
            {CATEGORY_ORDER.map((category) => {
              const meta = CATEGORY_META[category];
              const eur = budget.byCategory[category];
              const lines = budget.lines.filter((l) => l.category === category);
              return (
                <div key={category} className="rounded-lg border border-border">
                  <div className="flex items-center justify-between gap-2 px-3 py-2">
                    <div className="flex items-center gap-2 font-medium">
                      <span>{meta.emoji}</span>
                      {meta.label}
                      <span className="text-xs text-muted-foreground">({lines.length})</span>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">{formatEur(eur)}</div>
                      <div className="text-xs text-muted-foreground">≈ {formatJpy(eur * rate)}</div>
                    </div>
                  </div>

                  {lines.length > 0 && (
                    <ul className="border-t border-border">
                      {lines.map((line, index) => (
                        <li
                          key={`${line.label}-${index}`}
                          className="flex items-center justify-between gap-2 px-3 py-1.5 text-sm"
                        >
                          <span className="min-w-0 truncate text-muted-foreground">{line.label}</span>
                          <span className="shrink-0 tabular-nums">
                            {line.amount}
                            {line.currency}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>

          {budget.lines.length === 0 && (
            <p className="rounded-lg border border-dashed border-border px-3 py-6 text-center text-xs text-muted-foreground">
              Aucun prix renseigné pour l'instant. Ajoute des prix aux vols, hébergements et
              transports pour voir le total.
            </p>
          )}

          <p className="text-center text-[11px] text-muted-foreground">
            Total calculé à partir des prix saisis, convertis en euros au taux ci-dessus.
          </p>
        </div>
      </div>
    </Modal>
  );
}
