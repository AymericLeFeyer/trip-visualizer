import { useMemo } from 'react';
import { ChevronRight, MapPin } from 'lucide-react';
import type { Trip } from '@shared/types/trip';
import type { Selection } from '@/presentation/types';
import { PLACE_CATEGORIES, TRANSPORT_MODES } from '@/shared/constants/catalog';
import { buildItinerary } from '@/shared/lib/itinerary';
import { formatLongDate } from '@/shared/lib/date';
import { DetailHeader } from '../details/parts';

interface DayDetailProps {
  trip: Trip;
  date: string;
  /** Empile un nouveau tiroir (lieu, transport, vol, étape) par-dessus la journée. */
  onPush: (sel: NonNullable<Selection>) => void;
  onFocus?: () => void;
  onClose?: () => void;
}

interface ProgramItem {
  key: string;
  time?: string;
  emoji: string;
  label: string;
  sub?: string;
  onClick: () => void;
}

/** Ligne cliquable du programme d'une journée. */
function ProgramRow({ item }: { item: ProgramItem }) {
  return (
    <li>
      <button
        type="button"
        onClick={item.onClick}
        className="flex w-full items-center gap-3 rounded-lg border border-border p-2.5 text-left transition-colors hover:bg-muted"
      >
        <span className="w-11 shrink-0 text-xs font-semibold tabular-nums text-primary">
          {item.time ?? '—'}
        </span>
        <span className="text-lg">{item.emoji}</span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium">{item.label}</span>
          {item.sub && <span className="block truncate text-xs text-muted-foreground">{item.sub}</span>}
        </span>
        <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
      </button>
    </li>
  );
}

/**
 * Vue détail d'une journée (mode « vue par jour »). Un seul programme
 * chronologique fusionnant vols, **transports (= étapes à faire du jour)** et
 * lieux planifiés. Chaque item empile un tiroir (`onPush`).
 */
export function DayDetail({ trip, date, onPush, onFocus, onClose }: DayDetailProps) {
  const day = useMemo(() => buildItinerary(trip).find((d) => d.date === date), [trip, date]);

  const program = useMemo<ProgramItem[]>(() => {
    if (!day) return [];
    const items: ProgramItem[] = [];

    for (const f of day.flights) {
      items.push({
        key: `flight-${f.side}`,
        time: f.flight.legs[0]?.departureTime,
        emoji: '✈️',
        label: f.side === 'outbound' ? 'Vol aller' : 'Vol retour',
        sub: f.flight.airport,
        onClick: () => onPush({ kind: 'flight', side: f.side }),
      });
    }
    for (const l of day.legs) {
      items.push({
        key: `leg-${l.stage.id}`,
        time: l.leg.departureTime,
        emoji: TRANSPORT_MODES[l.leg.mode].emoji,
        label: l.leg.label || `${l.stage.name}${l.nextStage ? ` → ${l.nextStage.name}` : ''}`,
        sub: [l.leg.from, l.leg.to].filter(Boolean).join(' → ') || undefined,
        onClick: () => onPush({ kind: 'leg', stageId: l.stage.id }),
      });
    }
    for (const p of day.places) {
      items.push({
        key: `place-${p.place.id}`,
        time: p.place.plannedTime,
        emoji: PLACE_CATEGORIES[p.place.category].emoji,
        label: p.place.name,
        sub: p.place.address,
        onClick: () => onPush({ kind: 'place', stageId: p.stage.id, placeId: p.place.id }),
      });
    }

    return items.sort((a, b) => (a.time ?? '99:99').localeCompare(b.time ?? '99:99'));
  }, [day, onPush]);

  return (
    <div className="flex min-h-0 flex-col">
      <DetailHeader
        onFocus={onFocus}
        onClose={onClose}
        title={<span className="truncate capitalize">🗓️ {formatLongDate(date)}</span>}
      />

      <div className="flex-1 min-h-0 space-y-4 overflow-y-auto p-4 scroll-thin">
        {/* Base de la nuit */}
        {day?.stage && (
          <button
            type="button"
            onClick={() => onPush({ kind: 'stage', stageId: day.stage!.id })}
            className="flex w-full items-center gap-3 rounded-lg border border-border bg-muted/40 p-3 text-left transition-colors hover:bg-muted"
          >
            <span
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
              style={{ background: day.stage.color }}
            >
              {day.stage.emoji ?? trip.stages.findIndex((s) => s.id === day.stage!.id) + 1}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold">{day.stage.name}</span>
              {day.stage.accommodation?.name && (
                <span className="block truncate text-xs text-muted-foreground">
                  🛏️ {day.stage.accommodation.name}
                </span>
              )}
            </span>
            <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
          </button>
        )}

        {day?.arrivalStage && day.arrivalStage.id !== day.stage?.id && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4 shrink-0 text-primary" /> Arrivée à {day.arrivalStage.name}
          </div>
        )}

        {/* Programme du jour (vols + transports + lieux) */}
        <div className="space-y-2">
          <h3 className="text-sm font-semibold">Programme du jour ({program.length})</h3>
          {program.length > 0 ? (
            <ul className="space-y-1.5">
              {program.map((item) => (
                <ProgramRow key={item.key} item={item} />
              ))}
            </ul>
          ) : (
            <p className="rounded-lg border border-dashed border-border px-3 py-6 text-center text-xs text-muted-foreground">
              {day?.stage ? `Journée libre à ${day.stage.name}.` : 'Rien de planifié ce jour.'}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
