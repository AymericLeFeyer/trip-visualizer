import type { Trip, TripInput, TripSummary } from '@shared/types/trip';

/** Contrat d'accès aux voyages (implémenté côté infrastructure). */
export interface TripRepository {
  list(): Promise<TripSummary[]>;
  getById(id: string): Promise<Trip>;
  create(input?: TripInput): Promise<Trip>;
  update(id: string, input: TripInput): Promise<Trip>;
  remove(id: string): Promise<void>;
}
