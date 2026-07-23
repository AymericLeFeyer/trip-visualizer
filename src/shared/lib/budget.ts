import type { Trip } from '@shared/types/trip';

/** Catégories de dépense agrégées dans la page stats. */
export type BudgetCategory = 'flights' | 'accommodation' | 'transport' | 'places';

export interface BudgetLine {
  category: BudgetCategory;
  label: string;
  /** Montant tel que saisi. */
  amount: number;
  currency: string;
  /** Nombre de personnes couvertes par ce montant. */
  persons: number;
  /** Montant total converti en euros (base). */
  eur: number;
  /** Montant par personne converti en euros. */
  eurPerPerson: number;
}

export interface BudgetBreakdown {
  lines: BudgetLine[];
  /** Total par catégorie, en euros. */
  byCategory: Record<BudgetCategory, number>;
  /** Total par personne et par catégorie, en euros. */
  byCategoryPerPerson: Record<BudgetCategory, number>;
  totalEur: number;
  totalEurPerPerson: number;
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

/** Agrège tous les prix saisis (vols, hébergements, transports, lieux) en un budget. */
export function computeBudget(trip: Trip, rate: number): BudgetBreakdown {
  const lines: BudgetLine[] = [];
  const push = (
    category: BudgetCategory,
    label: string,
    price: number | undefined,
    currency: string | undefined,
    defaultCurrency: string,
    persons: number | undefined,
  ) => {
    if (price == null || Number.isNaN(price)) return;
    const cur = currency ?? defaultCurrency;
    const eur = toEur(price, cur, rate);
    const pers = persons != null && persons > 0 ? persons : 1;
    lines.push({ category, label, amount: price, currency: cur, persons: pers, eur, eurPerPerson: eur / pers });
  };

  if (trip.outboundFlight) {
    const f = trip.outboundFlight;
    push('flights', 'Vol aller', f.price, f.currency, '€', f.persons);
  }
  if (trip.returnFlight) {
    const f = trip.returnFlight;
    push('flights', 'Vol retour', f.price, f.currency, '€', f.persons);
  }

  trip.stages.forEach((stage, index) => {
    const acc = stage.accommodation;
    if (acc) push('accommodation', acc.name || stage.name, acc.price, acc.currency, '€', acc.persons);

    const leg = stage.transportToNext;
    if (leg) {
      const next = trip.stages[index + 1];
      const label = next ? `${stage.name} → ${next.name}` : leg.label || `${stage.name} · transport`;
      push('transport', label, leg.price, leg.currency, '¥', leg.persons);
    }

    stage.places.forEach((place) => {
      push('places', place.name, place.price, place.currency, '€', place.persons);
    });
  });

  const byCategory: Record<BudgetCategory, number> = {
    flights: 0,
    accommodation: 0,
    transport: 0,
    places: 0,
  };
  const byCategoryPerPerson: Record<BudgetCategory, number> = {
    flights: 0,
    accommodation: 0,
    transport: 0,
    places: 0,
  };
  for (const line of lines) {
    byCategory[line.category] += line.eur;
    byCategoryPerPerson[line.category] += line.eurPerPerson;
  }

  const totalEur = lines.reduce((sum, line) => sum + line.eur, 0);
  const totalEurPerPerson = lines.reduce((sum, line) => sum + line.eurPerPerson, 0);
  return { lines, byCategory, byCategoryPerPerson, totalEur, totalEurPerPerson, totalJpy: totalEur * rate };
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
