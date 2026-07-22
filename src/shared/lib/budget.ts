import type { Trip } from '@shared/types/trip';

/** Catégories de dépense agrégées dans la page stats. */
export type BudgetCategory = 'flights' | 'accommodation' | 'transport';

export interface BudgetLine {
  category: BudgetCategory;
  label: string;
  /** Montant tel que saisi. */
  amount: number;
  currency: string;
  /** Montant converti en euros (base). */
  eur: number;
}

export interface BudgetBreakdown {
  lines: BudgetLine[];
  /** Total par catégorie, en euros. */
  byCategory: Record<BudgetCategory, number>;
  totalEur: number;
  totalJpy: number;
}

const YEN = '¥';

/**
 * Convertit un montant vers l'euro (devise de base).
 * `rate` = nombre de yens pour 1 € (taux variable saisi par l'utilisateur).
 * Le voyage étant au Japon, seuls ¥ et € sont vraiment gérés ; les autres
 * devises sont traitées comme des équivalents euro (cas non réaliste ici).
 */
export function toEur(amount: number, currency: string | undefined, rate: number): number {
  if (currency === YEN) return rate > 0 ? amount / rate : 0;
  return amount;
}

/** Agrège tous les prix saisis (vols, hébergements, transports) en un budget. */
export function computeBudget(trip: Trip, rate: number): BudgetBreakdown {
  const lines: BudgetLine[] = [];
  const push = (
    category: BudgetCategory,
    label: string,
    price: number | undefined,
    currency: string | undefined,
    defaultCurrency: string,
  ) => {
    if (price == null || Number.isNaN(price)) return;
    const cur = currency ?? defaultCurrency;
    lines.push({ category, label, amount: price, currency: cur, eur: toEur(price, cur, rate) });
  };

  if (trip.outboundFlight) {
    push('flights', 'Vol aller', trip.outboundFlight.price, trip.outboundFlight.currency, '€');
  }
  if (trip.returnFlight) {
    push('flights', 'Vol retour', trip.returnFlight.price, trip.returnFlight.currency, '€');
  }

  trip.stages.forEach((stage) => {
    const acc = stage.accommodation;
    if (acc) push('accommodation', acc.name || stage.name, acc.price, acc.currency, '€');

    const leg = stage.transportToNext;
    if (leg) push('transport', leg.label || `${stage.name} · transport`, leg.price, leg.currency, '¥');
  });

  const byCategory: Record<BudgetCategory, number> = {
    flights: 0,
    accommodation: 0,
    transport: 0,
  };
  for (const line of lines) byCategory[line.category] += line.eur;

  const totalEur = lines.reduce((sum, line) => sum + line.eur, 0);
  return { lines, byCategory, totalEur, totalJpy: totalEur * rate };
}

const eurFormat = new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 0,
});
const jpyFormat = new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'JPY',
  maximumFractionDigits: 0,
});

export function formatEur(amount: number): string {
  return eurFormat.format(amount);
}

export function formatJpy(amount: number): string {
  return jpyFormat.format(amount);
}
