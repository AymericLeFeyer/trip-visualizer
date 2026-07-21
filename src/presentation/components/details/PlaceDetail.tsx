import type { Place, Stage } from '@shared/types/trip';
import { PLACE_CATEGORIES } from '@/shared/constants/catalog';
import { DetailHeader, InfoLine, MapsLink, MapsSearchButton } from './parts';

interface PlaceDetailProps {
  stage: Stage;
  place: Place;
  onFocus?: () => void;
  onClose?: () => void;
}

/** Vue détail (lecture seule) d'un lieu à visiter. */
export function PlaceDetail({ stage, place, onFocus, onClose }: PlaceDetailProps) {
  const cat = PLACE_CATEGORIES[place.category];
  return (
    <div className="flex min-h-0 flex-col">
      <DetailHeader
        onFocus={onFocus}
        onClose={onClose}
        title={
          <>
            <span className="text-lg">{cat.emoji}</span>
            <span className="truncate">{place.name}</span>
          </>
        }
      />

      <div className="flex-1 space-y-2 overflow-y-auto p-4 scroll-thin">
        <InfoLine label="Étape">{stage.name}</InfoLine>
        <InfoLine label="Catégorie">{cat.label}</InfoLine>
        <InfoLine label="Statut">{place.visited ? 'Déjà visité' : 'À visiter'}</InfoLine>
        <InfoLine label="Adresse">{place.address}</InfoLine>
        <InfoLine label="Notes">
          {place.notes && <span className="whitespace-pre-wrap">{place.notes}</span>}
        </InfoLine>
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <MapsLink url={place.googleMapsUrl} />
          <MapsSearchButton query={place.address || place.name} />
        </div>
      </div>
    </div>
  );
}
