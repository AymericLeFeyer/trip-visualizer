import { useMemo } from 'react';
import type { Trip } from '@shared/types/trip';
import { PLACE_CATEGORIES, TRANSPORT_MODES } from '@/shared/constants/catalog';
import { buildItinerary, type DaySummary } from '@/shared/lib/itinerary';
import { formatLongDate } from '@/shared/lib/date';
import { Modal } from '../ui/Modal';
import { DetailHeader } from '../details/parts';

interface ItineraryModalProps {
  trip: Trip;
  open: boolean;
  onClose: () => void;
}

function StageChip({ color, label }: { color: string; label: string }) {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium text-white"
      style={{ background: color }}
    >
      {label}
    </span>
  );
}

function DayCard({ day }: { day: DaySummary }) {
  const hasContent =
    day.flights.length > 0 || day.legs.length > 0 || day.places.length > 0 || day.arrivalStage;

  return (
    <div className="rounded-xl border border-border">
      <div className="flex items-center justify-between gap-2 border-b border-border px-3 py-2">
        <div className="text-sm font-semibold capitalize">{formatLongDate(day.date)}</div>
        {day.stage && <StageChip color={day.stage.color} label={`🛏️ ${day.stage.name}`} />}
      </div>

      <div className="space-y-1.5 p-3">
        {day.flights.map((f) => (
          <div key={f.side} className="flex items-center gap-2 text-sm">
            <span>✈️</span>
            <span className="text-muted-foreground">
              {f.side === 'outbound' ? 'Vol aller' : 'Vol retour'}
              {f.flight.airport ? ` · ${f.flight.airport}` : ''}
            </span>
          </div>
        ))}

        {day.arrivalStage && day.arrivalStage.id !== day.stage?.id && (
          <div className="flex items-center gap-2 text-sm">
            <span>📍</span>
            <span className="text-muted-foreground">Arrivée à {day.arrivalStage.name}</span>
          </div>
        )}

        {day.legs.map((l) => (
          <div key={l.stage.id} className="flex items-center gap-2 text-sm">
            <span>{TRANSPORT_MODES[l.leg.mode].emoji}</span>
            <span className="text-muted-foreground">
              {l.stage.name}
              {l.nextStage ? ` → ${l.nextStage.name}` : ''}
            </span>
          </div>
        ))}

        {day.places.length > 0 && (
          <ul className="space-y-1 pt-0.5">
            {day.places.map(({ place }) => (
              <li key={place.id} className="flex items-center gap-2 text-sm">
                <span className="w-12 shrink-0 text-xs font-medium tabular-nums text-primary">
                  {place.plannedTime ?? '—'}
                </span>
                <span>{PLACE_CATEGORIES[place.category].emoji}</span>
                <span className={place.visited ? 'text-muted-foreground line-through' : ''}>
                  {place.name}
                </span>
                {place.reserved && <span title="Réservé">🎟️</span>}
              </li>
            ))}
          </ul>
        )}

        {!hasContent && (
          <p className="text-sm text-muted-foreground">
            {day.stage ? `Journée libre à ${day.stage.name}.` : 'Journée libre.'}
          </p>
        )}
      </div>
    </div>
  );
}

/** Vue « jour par jour » du voyage : un résumé par journée (dates saisies). */
export function ItineraryModal({ trip, open, onClose }: ItineraryModalProps) {
  const days = useMemo(() => buildItinerary(trip), [trip]);

  return (
    <Modal open={open} onClose={onClose} className="w-full max-w-lg">
      <div className="flex min-h-0 flex-col">
        <DetailHeader title={<span>🗓️ Jour par jour</span>} onClose={onClose} />

        <div className="flex-1 min-h-0 space-y-3 overflow-y-auto p-4 scroll-thin">
          {days.length > 0 ? (
            days.map((day) => <DayCard key={day.date} day={day} />)
          ) : (
            <p className="rounded-lg border border-dashed border-border px-3 py-8 text-center text-sm text-muted-foreground">
              Renseigne des dates (séjours, vols, créneaux des lieux) pour générer l'itinéraire jour
              par jour.
            </p>
          )}
        </div>
      </div>
    </Modal>
  );
}
