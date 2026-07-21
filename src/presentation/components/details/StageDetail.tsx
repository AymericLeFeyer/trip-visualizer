import type { Stage, Trip } from '@shared/types/trip';
import { AccommodationBlock, DetailHeader, PlaceLine } from './parts';

interface StageDetailProps {
  trip: Trip;
  stage: Stage;
  onSelectPlace?: (placeId: string) => void;
  onFocus?: () => void;
  onClose?: () => void;
}

/** Vue détail (lecture seule) d'une étape : hébergement + lieux + notes. */
export function StageDetail({ trip, stage, onSelectPlace, onFocus, onClose }: StageDetailProps) {
  const order = trip.stages.findIndex((s) => s.id === stage.id) + 1;
  return (
    <div className="flex min-h-0 flex-col">
      <DetailHeader
        onFocus={onFocus}
        onClose={onClose}
        title={
          <>
            <span
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
              style={{ background: stage.color }}
            >
              {stage.emoji ?? order}
            </span>
            <span className="truncate">{stage.name}</span>
          </>
        }
      />

      <div className="flex-1 min-h-0 overflow-y-auto p-4 scroll-thin">
        <div className="grid gap-x-8 gap-y-4 md:grid-cols-2 md:items-start">
          {/* Colonne gauche : hébergement + notes */}
          <div className="space-y-4">
            {stage.accommodation ? (
              <AccommodationBlock acc={stage.accommodation} />
            ) : (
              <p className="text-sm text-muted-foreground">Aucun hébergement renseigné.</p>
            )}

            {stage.notes && (
              <div className="space-y-1">
                <h3 className="text-sm font-semibold">Notes</h3>
                <p className="whitespace-pre-wrap text-sm text-muted-foreground">{stage.notes}</p>
              </div>
            )}
          </div>

          {/* Colonne droite : lieux à visiter */}
          <div className="space-y-1.5">
            <h3 className="text-sm font-semibold">Lieux à visiter ({stage.places.length})</h3>
            {stage.places.length > 0 ? (
              <ul className="space-y-1.5">
                {stage.places.map((place) => (
                  <PlaceLine
                    key={place.id}
                    place={place}
                    onClick={onSelectPlace ? () => onSelectPlace(place.id) : undefined}
                  />
                ))}
              </ul>
            ) : (
              <p className="rounded-md border border-dashed border-border px-3 py-4 text-center text-xs text-muted-foreground">
                Aucun lieu pour cette étape.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
