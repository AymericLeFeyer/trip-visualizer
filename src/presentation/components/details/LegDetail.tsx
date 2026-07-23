import { ArrowRight } from 'lucide-react';
import type { Stage } from '@shared/types/trip';
import { TRANSPORT_MODES } from '@/shared/constants/catalog';
import { formatLongDate } from '@/shared/lib/date';
import { DetailHeader, InfoLine, NoteText } from './parts';

interface LegDetailProps {
  stage: Stage;
  nextStage?: Stage;
  onFocus?: () => void;
  onClose?: () => void;
}

/** Vue détail (lecture seule) d'un trajet entre deux étapes. */
export function LegDetail({ stage, nextStage, onFocus, onClose }: LegDetailProps) {
  const leg = stage.transportToNext;
  if (!leg) return null;
  const mode = TRANSPORT_MODES[leg.mode];

  return (
    <div className="flex min-h-0 flex-col">
      <DetailHeader
        onFocus={onFocus}
        onClose={onClose}
        title={
          <>
            <span className="text-lg">{mode.emoji}</span>
            <span className="truncate">{stage.name}</span>
            <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span className="truncate">{nextStage?.name ?? '…'}</span>
          </>
        }
      />

      <div className="flex-1 space-y-2 overflow-y-auto p-4 scroll-thin">
        <InfoLine label="Transport">{mode.label}</InfoLine>
        <InfoLine label="Départ">{leg.from}</InfoLine>
        <InfoLine label="Arrivée">{leg.to}</InfoLine>
        <InfoLine label="Date">{formatLongDate(leg.date)}</InfoLine>
        <InfoLine label="Horaires">
          {[leg.departureTime, leg.arrivalTime].filter(Boolean).join(' – ')}
        </InfoLine>
        <InfoLine label="Distance">{leg.distanceKm != null && `${leg.distanceKm} km`}</InfoLine>
        <InfoLine label="Référence">{leg.reference}</InfoLine>
        <InfoLine label="Prix">{leg.price != null && `${leg.price}${leg.currency ?? '¥'}`}</InfoLine>
        <NoteText>{leg.notes}</NoteText>
      </div>
    </div>
  );
}
