import { useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Check, ExternalLink, Eye, Share2 } from 'lucide-react';
import type { Stage, Trip } from '@shared/types/trip';
import { PLACE_CATEGORIES, TRANSPORT_MODES } from '@/shared/constants/catalog';
import { ThemeToggle } from '@/presentation/components/ThemeToggle';
import { TripMap } from '@/presentation/components/map/TripMap';
import { Button } from '@/presentation/components/ui/Button';

const noop = () => {};

function InfoLine({ label, children }: { label: string; children: ReactNode }) {
  if (!children) return null;
  return (
    <div className="flex gap-2 text-sm">
      <span className="shrink-0 text-muted-foreground">{label}</span>
      <span className="min-w-0 flex-1">{children}</span>
    </div>
  );
}

function MapsLink({ url }: { url?: string }) {
  if (!url) return null;
  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-1 text-sm text-primary"
    >
      <ExternalLink className="h-3.5 w-3.5" /> Google Maps
    </a>
  );
}

function LegCard({ stage }: { stage: Stage }) {
  const leg = stage.transportToNext;
  if (!leg) return null;
  const mode = TRANSPORT_MODES[leg.mode];
  const time = [leg.departureTime, leg.arrivalTime].filter(Boolean).join(' – ');
  return (
    <div className="ml-4 flex items-center gap-2 border-l-2 border-dashed border-border py-2 pl-4 text-sm">
      <span className="text-base">{mode.emoji}</span>
      <span className="text-muted-foreground">
        {leg.label || mode.label}
        {time && ` · ${time}`}
        {leg.price != null && ` · ${leg.price}${leg.currency ?? '¥'}`}
      </span>
    </div>
  );
}

export function MobileTripView({ trip }: { trip: Trip }) {
  const [copied, setCopied] = useState(false);

  const share = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard indisponible */
    }
  };

  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center gap-2 border-b border-border p-3">
        <Link to="/" className="text-sm text-muted-foreground">
          ←
        </Link>
        <div className="min-w-0 flex-1">
          <h1 className="truncate font-bold leading-tight">{trip.title}</h1>
          <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <Eye className="h-3 w-3" /> Lecture seule
          </span>
        </div>
        <Button variant="ghost" size="icon" onClick={share} title="Partager">
          {copied ? <Check className="h-4 w-4" /> : <Share2 className="h-4 w-4" />}
        </Button>
        <ThemeToggle />
      </header>

      <div className="h-[40vh] shrink-0 border-b border-border">
        <TripMap
          trip={trip}
          selectedStageId={null}
          selectedPlaceId={null}
          selectedLegStageId={null}
          placingMode={false}
          onSelectStage={noop}
          onSelectPlace={noop}
          onSelectLeg={noop}
          onMapClick={noop}
        />
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto p-4 scroll-thin">
        {trip.description && <p className="text-sm text-muted-foreground">{trip.description}</p>}

        {trip.stages.map((stage, index) => {
          const acc = stage.accommodation;
          return (
            <div key={stage.id}>
              <div className="rounded-lg border border-border p-3">
                <div className="mb-2 flex items-center gap-2">
                  <span
                    className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-white"
                    style={{ background: stage.color }}
                  >
                    {index + 1}
                  </span>
                  <h2 className="font-semibold">{stage.name}</h2>
                </div>

                {acc && (
                  <div className="space-y-1 rounded-md bg-muted/50 p-2.5">
                    <div className="text-sm font-medium">🛏️ {acc.name}</div>
                    <InfoLine label="Adresse">{acc.address}</InfoLine>
                    <InfoLine label="Séjour">
                      {[acc.checkInDate, acc.checkOutDate].filter(Boolean).join(' → ')}
                    </InfoLine>
                    <InfoLine label="Horaires">
                      {[
                        acc.arrivalTime && `arrivée ${acc.arrivalTime}`,
                        acc.departureTime && `départ ${acc.departureTime}`,
                      ]
                        .filter(Boolean)
                        .join(' · ')}
                    </InfoLine>
                    <InfoLine label="Modalités">{acc.modalities}</InfoLine>
                    <InfoLine label="Notes">{acc.notes}</InfoLine>
                    <MapsLink url={acc.googleMapsUrl} />
                  </div>
                )}

                {stage.places.length > 0 && (
                  <ul className="mt-2 space-y-1.5">
                    {stage.places.map((place) => (
                      <li key={place.id} className="rounded-md border border-border p-2 text-sm">
                        <div className="flex items-center gap-1.5">
                          <span>{PLACE_CATEGORIES[place.category].emoji}</span>
                          <span className={place.visited ? 'text-muted-foreground line-through' : ''}>
                            {place.name}
                          </span>
                        </div>
                        {place.notes && (
                          <p className="mt-0.5 text-xs text-muted-foreground">{place.notes}</p>
                        )}
                        <MapsLink url={place.googleMapsUrl} />
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <LegCard stage={stage} />
            </div>
          );
        })}

        {trip.transports.length > 0 && (
          <div className="rounded-lg border border-border p-3">
            <h2 className="mb-2 font-semibold">🚆 Autres trajets</h2>
            <ul className="space-y-1.5">
              {trip.transports.map((tr) => {
                const time = [tr.departureTime, tr.arrivalTime].filter(Boolean).join(' – ');
                return (
                  <li key={tr.id} className="text-sm">
                    {TRANSPORT_MODES[tr.mode].emoji} {tr.label}
                    {time && <span className="text-muted-foreground"> · {time}</span>}
                    {tr.price != null && (
                      <span className="text-muted-foreground">
                        {' '}
                        · {tr.price}
                        {tr.currency ?? '¥'}
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
