import type { TripRepository } from '@/domain/trip/repositories/TripRepository';
import { httpClient } from '@/infrastructure/http/httpClient';
import type { Trip, TripInput, TripSummary } from '@shared/types/trip';

export class HttpTripRepository implements TripRepository {
  list(): Promise<TripSummary[]> {
    return httpClient.get<TripSummary[]>('/trips');
  }

  getById(id: string): Promise<Trip> {
    return httpClient.get<Trip>(`/trips/${id}`);
  }

  create(input?: TripInput): Promise<Trip> {
    return httpClient.post<Trip>('/trips', input);
  }

  update(id: string, input: TripInput): Promise<Trip> {
    return httpClient.put<Trip>(`/trips/${id}`, input);
  }

  remove(id: string): Promise<void> {
    return httpClient.delete<void>(`/trips/${id}`);
  }
}

/** Instance partagée du repository. */
export const tripRepository: TripRepository = new HttpTripRepository();
