import type { FlightSide } from '@/domain/trip/services/tripMutations';

/** Élément actuellement sélectionné pour édition/détail dans la modale. */
export type Selection =
  | { kind: 'stage'; stageId: string }
  | { kind: 'place'; stageId: string; placeId: string }
  | { kind: 'leg'; stageId: string }
  | { kind: 'flight'; side: FlightSide }
  | { kind: 'day'; date: string }
  | null;

/** Cible en attente de placement au clic sur la carte. */
export type PlacingTarget =
  | { kind: 'accommodation'; stageId: string }
  | { kind: 'place'; stageId: string; placeId: string }
  | { kind: 'flightAirport'; side: FlightSide }
  | null;

/** Identifiants dérivés de la sélection pour surligner les marqueurs de la carte. */
export interface MapSelection {
  selectedStageId: string | null;
  selectedPlaceId: string | null;
  selectedLegStageId: string | null;
  selectedFlight: FlightSide | null;
}

export function deriveMapSelection(selection: Selection): MapSelection {
  return {
    selectedStageId:
      selection?.kind === 'stage' || selection?.kind === 'place' ? selection.stageId : null,
    selectedPlaceId: selection?.kind === 'place' ? selection.placeId : null,
    selectedLegStageId: selection?.kind === 'leg' ? selection.stageId : null,
    selectedFlight: selection?.kind === 'flight' ? selection.side : null,
  };
}
