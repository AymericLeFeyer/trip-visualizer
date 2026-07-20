import type {
  Accommodation,
  Place,
  Stage,
  Transport,
  Trip,
} from '@shared/types/trip';

/**
 * Fonctions de mutation pures : elles renvoient toujours un nouveau Trip
 * sans muter l'original (facilite l'autosave et l'undo éventuel).
 */

export function patchTrip(trip: Trip, patch: Partial<Pick<Trip, 'title' | 'description'>>): Trip {
  return { ...trip, ...patch };
}

// --- Étapes ---

export function addStage(trip: Trip, stage: Stage): Trip {
  return { ...trip, stages: [...trip.stages, stage] };
}

export function updateStage(trip: Trip, stageId: string, patch: Partial<Stage>): Trip {
  return {
    ...trip,
    stages: trip.stages.map((s) => (s.id === stageId ? { ...s, ...patch } : s)),
  };
}

export function removeStage(trip: Trip, stageId: string): Trip {
  return { ...trip, stages: trip.stages.filter((s) => s.id !== stageId) };
}

export function moveStage(trip: Trip, stageId: string, direction: -1 | 1): Trip {
  const index = trip.stages.findIndex((s) => s.id === stageId);
  const target = index + direction;
  if (index === -1 || target < 0 || target >= trip.stages.length) return trip;
  const stages = [...trip.stages];
  const [moved] = stages.splice(index, 1);
  stages.splice(target, 0, moved);
  return { ...trip, stages };
}

export function setAccommodation(
  trip: Trip,
  stageId: string,
  patch: Partial<Accommodation>,
): Trip {
  return {
    ...trip,
    stages: trip.stages.map((s) => {
      if (s.id !== stageId) return s;
      const base: Accommodation = s.accommodation ?? { name: 'Hébergement' };
      return { ...s, accommodation: { ...base, ...patch } };
    }),
  };
}

// --- Transport entre deux étapes (jambe de trajet) ---

export function setTransportLeg(trip: Trip, stageId: string, transport: Transport): Trip {
  return {
    ...trip,
    stages: trip.stages.map((s) =>
      s.id === stageId ? { ...s, transportToNext: transport } : s,
    ),
  };
}

export function updateTransportLeg(
  trip: Trip,
  stageId: string,
  patch: Partial<Transport>,
): Trip {
  return {
    ...trip,
    stages: trip.stages.map((s) => {
      if (s.id !== stageId || !s.transportToNext) return s;
      return { ...s, transportToNext: { ...s.transportToNext, ...patch } };
    }),
  };
}

export function removeTransportLeg(trip: Trip, stageId: string): Trip {
  return {
    ...trip,
    stages: trip.stages.map((s) => {
      if (s.id !== stageId) return s;
      const { transportToNext: _drop, ...rest } = s;
      return rest;
    }),
  };
}

// --- Lieux ---

export function addPlace(trip: Trip, stageId: string, place: Place): Trip {
  return {
    ...trip,
    stages: trip.stages.map((s) =>
      s.id === stageId ? { ...s, places: [...s.places, place] } : s,
    ),
  };
}

export function updatePlace(
  trip: Trip,
  stageId: string,
  placeId: string,
  patch: Partial<Place>,
): Trip {
  return {
    ...trip,
    stages: trip.stages.map((s) =>
      s.id === stageId
        ? { ...s, places: s.places.map((p) => (p.id === placeId ? { ...p, ...patch } : p)) }
        : s,
    ),
  };
}

export function removePlace(trip: Trip, stageId: string, placeId: string): Trip {
  return {
    ...trip,
    stages: trip.stages.map((s) =>
      s.id === stageId ? { ...s, places: s.places.filter((p) => p.id !== placeId) } : s,
    ),
  };
}

// --- Transports ---

export function addTransport(trip: Trip, transport: Transport): Trip {
  return { ...trip, transports: [...trip.transports, transport] };
}

export function updateTransport(trip: Trip, id: string, patch: Partial<Transport>): Trip {
  return {
    ...trip,
    transports: trip.transports.map((t) => (t.id === id ? { ...t, ...patch } : t)),
  };
}

export function removeTransport(trip: Trip, id: string): Trip {
  return { ...trip, transports: trip.transports.filter((t) => t.id !== id) };
}
