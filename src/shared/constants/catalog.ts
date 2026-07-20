import type { PlaceCategory, TransportMode } from '@shared/types/trip';

export const PLACE_CATEGORIES: Record<PlaceCategory, { label: string; emoji: string }> = {
  sight: { label: 'Incontournable', emoji: '📍' },
  food: { label: 'Restaurant / Food', emoji: '🍜' },
  shopping: { label: 'Shopping', emoji: '🛍️' },
  nature: { label: 'Nature', emoji: '🌿' },
  culture: { label: 'Culture / Temple', emoji: '⛩️' },
  nightlife: { label: 'Vie nocturne', emoji: '🍶' },
  other: { label: 'Autre', emoji: '✨' },
};

export const TRANSPORT_MODES: Record<TransportMode, { label: string; emoji: string }> = {
  train: { label: 'Train', emoji: '🚆' },
  shinkansen: { label: 'Shinkansen', emoji: '🚄' },
  bus: { label: 'Bus', emoji: '🚌' },
  plane: { label: 'Avion', emoji: '✈️' },
  ferry: { label: 'Ferry', emoji: '⛴️' },
  car: { label: 'Voiture', emoji: '🚗' },
  walk: { label: 'À pied', emoji: '🚶' },
  other: { label: 'Autre', emoji: '➡️' },
};

/** Devises proposées (le Japon d'abord). */
export const CURRENCIES = ['¥', '€', '$', '£'];

/** Palette d'accents proposée pour les étapes. */
export const STAGE_COLORS = [
  '#e11d48',
  '#2563eb',
  '#16a34a',
  '#d97706',
  '#7c3aed',
  '#0891b2',
  '#db2777',
  '#4d7c0f',
];
