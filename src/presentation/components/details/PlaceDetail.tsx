import type { Place, Stage } from '@shared/types/trip';
import { PLACE_CATEGORIES } from '@/shared/constants/catalog';
import { distanceLabel } from '@/shared/lib/geo';
import { formatPlanned } from '@/shared/lib/date';
import { ConfidentialBlock } from './ConfidentialBlock';
import {
  DetailHeader,
  InfoLine,
  MapsLink,
  MapsSearchButton,
  NoteText,
  ReservedBadge,
  StageImage,
  formatPrice,
} from './parts';

interface PlaceDetailProps {
  stage: Stage;
  place: Place;
  onFocus?: () => void;
  onClose?: () => void;
}

/** Vue détail (lecture seule) d'un lieu à visiter. */
export function PlaceDetail({ stage, place, onFocus, onClose }: PlaceDetailProps) {
  const cat = PLACE_CATEGORIES[place.category];
  const distance = distanceLabel(stage.accommodation?.location, place.location);
  const price = formatPrice(place.price, place.currency);
  const planned = formatPlanned(place.plannedDate, place.plannedTime);
  return (
    <div className="flex min-h-0 flex-col">
      <DetailHeader
        onFocus={onFocus}
        onClose={onClose}
        title={
          <>
            <span className="text-lg">{cat.emoji}</span>
            <span className="truncate">{place.name}</span>
            {place.reserved && <ReservedBadge />}
          </>
        }
      />

      <div className="flex-1 space-y-2 overflow-y-auto p-4 scroll-thin">
        <StageImage url={place.imageUrl} className="mb-2" />
        <InfoLine label="Étape">{stage.name}</InfoLine>
        <InfoLine label="Catégorie">{cat.label}</InfoLine>
        {planned && <InfoLine label="Prévu">{planned}</InfoLine>}
        <InfoLine label="Statut">{place.visited ? 'Déjà visité' : 'À visiter'}</InfoLine>
        {place.reserved && <InfoLine label="Réservation">Réservé / billet pris</InfoLine>}
        {price && (
          <InfoLine label="Prix">
            {price}
            {place.persons != null && place.persons > 1 && ` · ${place.persons} pers.`}
          </InfoLine>
        )}
        {distance && <InfoLine label="Distance">{distance} de l'hébergement</InfoLine>}
        <InfoLine label="Adresse">{place.address}</InfoLine>
        <NoteText>{place.notes}</NoteText>
        <ConfidentialBlock text={place.confidential} />
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <MapsLink url={place.googleMapsUrl} />
          <MapsSearchButton query={place.address || place.name} />
        </div>
      </div>
    </div>
  );
}
