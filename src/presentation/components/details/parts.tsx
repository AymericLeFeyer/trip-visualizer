import type { ReactNode } from 'react';
import { ChevronRight, ExternalLink, Locate, MapPin, X } from 'lucide-react';
import type { Accommodation, LatLng, Place } from '@shared/types/trip';
import { PLACE_CATEGORIES } from '@/shared/constants/catalog';
import { distanceLabel } from '@/shared/lib/geo';
import { formatLongDate } from '@/shared/lib/date';
import { mapsSearchUrl } from '@/shared/lib/maps';
import { Button } from '../ui/Button';

/** Bouton ouvrant Google Maps sur l'adresse/le nom (recherche, sans clé). */
export function MapsSearchButton({ query }: { query?: string }) {
  const q = query?.trim();
  if (!q) return null;
  return (
    <a
      href={mapsSearchUrl(q)}
      target="_blank"
      rel="noreferrer"
      onClick={(e) => e.stopPropagation()}
      className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-medium text-primary hover:bg-muted"
    >
      <MapPin className="h-3.5 w-3.5" /> Ouvrir dans Google Maps
    </a>
  );
}

/** Bouton « Focus » : recentre et zoome la carte sur l'élément. */
export function FocusButton({ onClick }: { onClick: () => void }) {
  return (
    <Button variant="ghost" size="icon" title="Centrer sur la carte" onClick={onClick}>
      <Locate className="h-4 w-4 text-primary" />
    </Button>
  );
}

/** En-tête d'une vue détail dans la modale (titre + focus + fermeture). */
export function DetailHeader({
  title,
  onFocus,
  onClose,
}: {
  title: ReactNode;
  onFocus?: () => void;
  onClose?: () => void;
}) {
  return (
    <header className="flex shrink-0 items-center justify-between gap-2 border-b border-border px-4 py-3">
      <div className="flex min-w-0 items-center gap-2 font-semibold">{title}</div>
      <div className="flex shrink-0 items-center gap-1">
        {onFocus && <FocusButton onClick={onFocus} />}
        {onClose && (
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </header>
  );
}

export function InfoLine({ label, children }: { label: string; children: ReactNode }) {
  if (!children) return null;
  return (
    <div className="flex gap-2 text-sm">
      <span className="shrink-0 text-muted-foreground">{label}</span>
      <span className="min-w-0 flex-1 break-words">{children}</span>
    </div>
  );
}

export function MapsLink({ url }: { url?: string }) {
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

/** Bloc hébergement en lecture seule (réutilisé modale + mobile). */
export function AccommodationBlock({ acc }: { acc: Accommodation }) {
  return (
    <div className="space-y-1 rounded-md bg-muted/50 p-2.5">
      <div className="text-sm font-medium">🛏️ {acc.name}</div>
      <InfoLine label="Adresse">{acc.address}</InfoLine>
      <InfoLine label="Séjour">
        {[acc.checkInDate, acc.checkOutDate].filter(Boolean).map(formatLongDate).join(' → ')}
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
      <div className="flex flex-wrap items-center gap-2 pt-1">
        <MapsLink url={acc.googleMapsUrl} />
        <MapsSearchButton query={acc.address || acc.name} />
      </div>
    </div>
  );
}

/**
 * Ligne d'un lieu à visiter en lecture seule (réutilisée modale + mobile).
 * Si `onClick` est fourni, la ligne devient un bouton (ouvre la modale du lieu).
 */
export function PlaceLine({
  place,
  origin,
  onClick,
}: {
  place: Place;
  /** Point de l'étape (hébergement) pour estimer la distance à vol d'oiseau. */
  origin?: LatLng | null;
  onClick?: () => void;
}) {
  const distance = distanceLabel(origin, place.location);
  const inner = (
    <>
      <div className="flex items-center gap-1.5">
        <span>{PLACE_CATEGORIES[place.category].emoji}</span>
        <span className={place.visited ? 'text-muted-foreground line-through' : ''}>
          {place.name}
        </span>
        {distance && (
          <span className="shrink-0 text-xs font-normal text-muted-foreground">· {distance}</span>
        )}
        {onClick && <ChevronRight className="ml-auto h-4 w-4 shrink-0 text-muted-foreground" />}
      </div>
      {place.notes && <p className="mt-0.5 text-xs text-muted-foreground">{place.notes}</p>}
      {!onClick && <MapsLink url={place.googleMapsUrl} />}
    </>
  );

  if (onClick) {
    return (
      <li>
        <button
          type="button"
          onClick={onClick}
          className="w-full rounded-md border border-border p-2 text-left text-sm transition-colors hover:bg-muted"
        >
          {inner}
        </button>
      </li>
    );
  }

  return <li className="rounded-md border border-border p-2 text-sm">{inner}</li>;
}
