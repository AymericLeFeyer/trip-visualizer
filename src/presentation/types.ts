/** Élément actuellement sélectionné pour édition dans le panneau latéral. */
export type Selection =
  | { kind: 'stage'; stageId: string }
  | { kind: 'place'; stageId: string; placeId: string }
  | { kind: 'leg'; stageId: string }
  | { kind: 'transports' }
  | null;

/** Cible en attente de placement au clic sur la carte. */
export type PlacingTarget =
  | { kind: 'accommodation'; stageId: string }
  | { kind: 'place'; stageId: string; placeId: string }
  | null;
