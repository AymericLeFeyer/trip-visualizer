import { CircleCheck, Clock, MapPin, Milestone, Ruler, Tag, Ticket, Wallet } from 'lucide-react';
import type { Place, Stage } from '@shared/types/trip';
import { PLACE_CATEGORIES } from '@/shared/constants/catalog';
import { distanceLabel } from '@/shared/lib/geo';
import { formatPlanned } from '@/shared/lib/date';
import { ConfidentialBlock } from './ConfidentialBlock';
import {
  DetailHeader,
  IconLine,
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
        <IconLine icon={Milestone} title="Étape">{stage.name}</IconLine>
        <IconLine icon={Tag} title="Catégorie">{cat.label}</IconLine>
        {planned && <IconLine icon={Clock} title="Prévu">{planned}</IconLine>}
        <IconLine icon={CircleCheck} title="Statut">
          {place.visited ? 'Déjà visité' : 'À visiter'}
        </IconLine>
        {place.reserved && <IconLine icon={Ticket} title="Réservation">Réservé / billet pris</IconLine>}
        {price && (
          <IconLine icon={Wallet} title="Prix">
            {price}
            {place.persons != null && place.persons > 1 && ` · ${place.persons} pers.`}
          </IconLine>
        )}
        {distance && <IconLine icon={Ruler} title="Distance">{distance} de l'hébergement</IconLine>}
        <IconLine icon={MapPin} title="Adresse">{place.address}</IconLine>
        <NoteText>{place.notes}</NoteText>
        <ConfidentialBlock text={place.confidential} />
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <MapsSearchButton query={place.address || place.name} />
        </div>
      </div>
    </div>
  );
}
