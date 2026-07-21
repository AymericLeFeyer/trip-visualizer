import type { Flight, FlightLeg, Place, Stage, Transport } from '@shared/types/trip';
import { STAGE_COLORS } from '@/shared/constants/catalog';
import { newId } from '@/shared/lib/id';

export function createStage(index: number): Stage {
  return {
    id: newId(),
    name: `Étape ${index + 1}`,
    color: STAGE_COLORS[index % STAGE_COLORS.length],
    places: [],
  };
}

export function createPlace(name = 'Nouveau lieu'): Place {
  return {
    id: newId(),
    name,
    category: 'sight',
    visited: false,
  };
}

export function createTransport(): Transport {
  return {
    id: newId(),
    mode: 'train',
    label: 'Nouveau trajet',
  };
}

export function createFlightLeg(): FlightLeg {
  return { id: newId() };
}

export function createFlight(): Flight {
  return { legs: [createFlightLeg()], currency: '€' };
}
