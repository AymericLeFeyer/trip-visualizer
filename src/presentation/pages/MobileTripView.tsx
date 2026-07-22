import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Check,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Eye,
  Locate,
  Pencil,
  Plus,
  Share2,
  Wallet,
} from 'lucide-react';
import type { Flight, LatLng, Place, Stage, Trip } from '@shared/types/trip';
import { PLACE_CATEGORIES, TRANSPORT_MODES } from '@/shared/constants/catalog';
import { createStage, createTransport } from '@/domain/trip/services/tripFactory';
import { addStage, setTransportLeg, updatePlace } from '@/domain/trip/services/tripMutations';
import type { FlightSide } from '@/domain/trip/services/tripMutations';
import { formatTransportSummary } from '@/shared/lib/transport';
import { formatLongDate, nightsLabel } from '@/shared/lib/date';
import { distanceLabel } from '@/shared/lib/geo';
import type { SaveStatus } from '@/presentation/hooks/useTrip';
import type { MapSelection } from '@/presentation/types';
import { ThemeToggle } from '@/presentation/components/ThemeToggle';
import { AdminLock } from '@/presentation/components/AdminLock';
import { TripMap } from '@/presentation/components/map/TripMap';
import { MobileSheet, type SheetSnap } from '@/presentation/components/mobile/MobileSheet';
import { QuickAddPlace } from '@/presentation/components/mobile/QuickAddPlace';
import { MapsSearchButton } from '@/presentation/components/details/parts';
import { BudgetModal } from '@/presentation/components/panels/BudgetModal';
import { cn } from '@/shared/lib/cn';

interface MobileTripViewProps {
  trip: Trip;
  isAdmin: boolean;
  saveStatus: SaveStatus;
  mapSelection: MapSelection;
  placingMode: boolean;
  focusTarget?: { location: LatLng; nonce: number } | null;
  mutate: (updater: (trip: Trip) => Trip) => void;
  onSelectStage: (stageId: string) => void;
  onSelectPlace: (stageId: string, placeId: string) => void;
  onSelectLeg: (stageId: string) => void;
  onSelectFlight: (side: FlightSide) => void;
  onMapClick: (location: LatLng) => void;
}

type Active =
  | { type: 'stage'; id: string }
  | { type: 'place'; stageId: string; placeId: string }
  | { type: 'flight'; side: FlightSide }
  | null;

// --- Rail (navigation horizontale entre étapes) ---

function RailPill({
  active,
  color,
  onClick,
  children,
}: {
  active: boolean;
  color?: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-1.5 text-sm font-medium transition-colors',
        active
          ? 'border-transparent text-white shadow-sm'
          : 'border-border bg-card text-foreground hover:bg-muted',
        active && !color && 'bg-primary text-primary-foreground',
      )}
      style={active && color ? { background: color } : undefined}
    >
      {children}
    </button>
  );
}

// --- Contenu d'une étape dans le sheet ---

function FocusPill({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1 rounded-full border border-border px-2.5 py-1 text-xs text-primary hover:bg-muted"
    >
      <Locate className="h-3.5 w-3.5" /> Sur la carte
    </button>
  );
}

function MapsLink({ url }: { url?: string }) {
  if (!url) return null;
  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      onClick={(e) => e.stopPropagation()}
      className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border text-primary hover:bg-muted"
      title="Ouvrir dans Maps"
    >
      <ExternalLink className="h-4 w-4" />
    </a>
  );
}

function VisitedToggle({ visited, onToggle }: { visited: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      title={visited ? 'Marquer à visiter' : 'Marquer comme visité'}
      className={cn(
        'flex h-9 w-9 shrink-0 items-center justify-center rounded-full border transition-colors',
        visited
          ? 'border-green-600 bg-green-600 text-white'
          : 'border-border text-muted-foreground hover:bg-muted',
      )}
    >
      <Check className="h-4 w-4" />
    </button>
  );
}

function PlaceCard({
  place,
  origin,
  isAdmin,
  onOpen,
  onToggleVisited,
}: {
  place: Place;
  origin?: LatLng | null;
  isAdmin: boolean;
  onOpen: () => void;
  onToggleVisited: () => void;
}) {
  const cat = PLACE_CATEGORIES[place.category];
  const distance = distanceLabel(origin, place.location);
  return (
    <div className="flex items-center gap-2 rounded-xl border border-border bg-card p-2.5">
      <button onClick={onOpen} className="flex min-w-0 flex-1 items-center gap-3 text-left">
        <span className="text-2xl leading-none">{cat.emoji}</span>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className={cn('truncate font-medium', place.visited && 'text-muted-foreground line-through')}>
              {place.name}
            </span>
            {distance && (
              <span className="shrink-0 text-xs font-normal text-muted-foreground">· {distance}</span>
            )}
          </div>
          {place.address && (
            <div className="truncate text-xs text-muted-foreground">{place.address}</div>
          )}
        </div>
      </button>
      <MapsLink url={place.googleMapsUrl} />
      {isAdmin && <VisitedToggle visited={place.visited} onToggle={onToggleVisited} />}
    </div>
  );
}

interface StageContentProps {
  trip: Trip;
  stage: Stage;
  isAdmin: boolean;
  onEditStage: () => void;
  onOpenPlace: (placeId: string) => void;
  onAddPlace: () => void;
  onEditLeg: () => void;
  onAddLeg: () => void;
  onToggleVisited: (placeId: string, visited: boolean) => void;
  onFocus: (location?: LatLng) => void;
}

function StageContent({
  trip,
  stage,
  isAdmin,
  onEditStage,
  onOpenPlace,
  onAddPlace,
  onEditLeg,
  onAddLeg,
  onToggleVisited,
  onFocus,
}: StageContentProps) {
  const order = trip.stages.findIndex((s) => s.id === stage.id) + 1;
  const acc = stage.accommodation;
  const index = order - 1;
  const isLast = index === trip.stages.length - 1;
  const leg = stage.transportToNext;
  const nights = nightsLabel(acc?.checkInDate, acc?.checkOutDate);

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3">
        <span
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-xl font-bold text-white"
          style={{ background: stage.color }}
        >
          {stage.emoji ?? order}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h2 className="truncate text-lg font-bold leading-tight">{stage.name}</h2>
            {nights && (
              <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                {nights}
              </span>
            )}
          </div>
          {(acc?.checkInDate || acc?.checkOutDate) && (
            <p className="text-xs text-muted-foreground">
              {[acc?.checkInDate, acc?.checkOutDate].filter(Boolean).map(formatLongDate).join(' → ')}
            </p>
          )}
        </div>
        {isAdmin && (
          <button
            onClick={onEditStage}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border text-muted-foreground hover:bg-muted"
            title="Éditer l'étape"
          >
            <Pencil className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Hébergement */}
      {acc?.name && (
        <div className="space-y-2 rounded-xl border border-border bg-muted/40 p-3">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="font-semibold">🛏️ {acc.name}</div>
              {acc.address && (
                <div className="text-xs text-muted-foreground">{acc.address}</div>
              )}
            </div>
            <MapsLink url={acc.googleMapsUrl} />
          </div>
          {(acc.arrivalTime || acc.departureTime) && (
            <div className="text-xs text-muted-foreground">
              {[
                acc.arrivalTime && `arrivée ${acc.arrivalTime}`,
                acc.departureTime && `départ ${acc.departureTime}`,
              ]
                .filter(Boolean)
                .join(' · ')}
            </div>
          )}
          {acc.price != null && (
            <div className="text-xs text-muted-foreground">
              Prix : {acc.price}
              {acc.currency ?? '€'}
            </div>
          )}
          {acc.modalities && (
            <p className="whitespace-pre-wrap text-xs text-muted-foreground">{acc.modalities}</p>
          )}
          <div className="flex flex-wrap items-center gap-2 pt-0.5">
            {acc.location && <FocusPill onClick={() => onFocus(acc.location)} />}
            <MapsSearchButton query={acc.address || acc.name} />
          </div>
        </div>
      )}

      {/* Lieux à visiter */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">
            À visiter{' '}
            <span className="text-muted-foreground">({stage.places.length})</span>
          </h3>
          {isAdmin && (
            <button
              onClick={onAddPlace}
              className="inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground shadow-sm"
            >
              <Plus className="h-3.5 w-3.5" /> Lieu
            </button>
          )}
        </div>

        {stage.places.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border px-3 py-6 text-center text-xs text-muted-foreground">
            {isAdmin ? 'Ajoute les spots que tu veux voir.' : 'Aucun lieu pour cette étape.'}
          </p>
        ) : (
          <div className="space-y-2">
            {stage.places.map((place) => (
              <PlaceCard
                key={place.id}
                place={place}
                origin={stage.accommodation?.location}
                isAdmin={isAdmin}
                onOpen={() => onOpenPlace(place.id)}
                onToggleVisited={() => onToggleVisited(place.id, !place.visited)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Transport vers l'étape suivante */}
      {!isLast &&
        (leg ? (
          <button
            onClick={onEditLeg}
            className="flex w-full items-center gap-2 rounded-xl border border-border p-3 text-left transition-colors hover:bg-muted"
          >
            <span className="text-lg">{TRANSPORT_MODES[leg.mode].emoji}</span>
            <span className="min-w-0 flex-1 truncate text-sm text-muted-foreground">
              Vers {trip.stages[index + 1]?.name} · {formatTransportSummary(leg) || TRANSPORT_MODES[leg.mode].label}
            </span>
            <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
          </button>
        ) : isAdmin ? (
          <button
            onClick={onAddLeg}
            className="flex w-full items-center gap-1.5 rounded-xl border border-dashed border-border p-3 text-sm text-muted-foreground hover:bg-muted"
          >
            <Plus className="h-4 w-4" /> Ajouter le transport vers {trip.stages[index + 1]?.name}
          </button>
        ) : null)}

      {stage.notes && (
        <p className="whitespace-pre-wrap rounded-xl border border-border p-3 text-sm text-muted-foreground">
          {stage.notes}
        </p>
      )}
    </div>
  );
}

function PlaceContent({
  stage,
  place,
  isAdmin,
  onBack,
  onEdit,
  onToggleVisited,
  onFocus,
}: {
  stage: Stage;
  place: Place;
  isAdmin: boolean;
  onBack: () => void;
  onEdit: () => void;
  onToggleVisited: () => void;
  onFocus: (location?: LatLng) => void;
}) {
  const cat = PLACE_CATEGORIES[place.category];
  const distance = distanceLabel(stage.accommodation?.location, place.location);
  return (
    <div className="space-y-4">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" /> {stage.name}
      </button>

      <div className="flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-muted text-2xl">
          {cat.emoji}
        </span>
        <div className="min-w-0 flex-1">
          <h2 className={cn('text-lg font-bold leading-tight', place.visited && 'line-through')}>
            {place.name}
          </h2>
          <p className="text-xs text-muted-foreground">
            {cat.label}
            {distance && ` · ${distance} de l'hébergement`}
            {place.visited && ' · déjà visité'}
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={onEdit}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border text-muted-foreground hover:bg-muted"
            title="Éditer le lieu"
          >
            <Pencil className="h-4 w-4" />
          </button>
        )}
      </div>

      {place.address && <p className="text-sm text-muted-foreground">{place.address}</p>}

      {place.notes && (
        <p className="whitespace-pre-wrap rounded-xl border border-border p-3 text-sm text-muted-foreground">
          {place.notes}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-2">
        {place.location && <FocusPill onClick={() => onFocus(place.location)} />}
        <MapsSearchButton query={place.address || place.name} />
        {place.googleMapsUrl && (
          <a
            href={place.googleMapsUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 rounded-full border border-border px-2.5 py-1 text-xs text-primary hover:bg-muted"
          >
            <ExternalLink className="h-3.5 w-3.5" /> Ouvrir le lien
          </a>
        )}
        {isAdmin && (
          <button
            onClick={onToggleVisited}
            className={cn(
              'inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs transition-colors',
              place.visited
                ? 'border-green-600 text-green-700 dark:text-green-500'
                : 'border-border text-muted-foreground hover:bg-muted',
            )}
          >
            <Check className="h-3.5 w-3.5" />
            {place.visited ? 'Visité' : 'Marquer visité'}
          </button>
        )}
      </div>
    </div>
  );
}

function FlightContent({
  side,
  flight,
  isAdmin,
  onEdit,
  onFocus,
}: {
  side: FlightSide;
  flight: Flight;
  isAdmin: boolean;
  onEdit: () => void;
  onFocus: (location?: LatLng) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-2xl">
          ✈️
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-bold leading-tight">
            {side === 'outbound' ? 'Vol aller' : 'Vol retour'}
          </h2>
          {flight.airport && (
            <p className="truncate text-xs text-muted-foreground">{flight.airport}</p>
          )}
        </div>
        {isAdmin && (
          <button
            onClick={onEdit}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border text-muted-foreground hover:bg-muted"
            title="Éditer le vol"
          >
            <Pencil className="h-4 w-4" />
          </button>
        )}
      </div>

      {flight.legs.map((leg, i) => (
        <div key={leg.id} className="rounded-xl border border-border p-3 text-sm">
          <div className="font-medium">{leg.flightNumber || `Segment ${i + 1}`}</div>
          {(leg.from || leg.to) && (
            <div className="text-muted-foreground">
              {[leg.from, leg.to].filter(Boolean).join(' → ')}
            </div>
          )}
          {(leg.departureTime || leg.arrivalTime) && (
            <div className="text-muted-foreground">
              {[leg.departureTime, leg.arrivalTime].filter(Boolean).join(' – ')}
            </div>
          )}
        </div>
      ))}

      {flight.price != null && (
        <p className="text-sm text-muted-foreground">
          Prix : {flight.price}
          {flight.currency ?? '€'}
        </p>
      )}
      {flight.notes && (
        <p className="whitespace-pre-wrap rounded-xl border border-border p-3 text-sm text-muted-foreground">
          {flight.notes}
        </p>
      )}
      {flight.airportLocation && <FocusPill onClick={() => onFocus(flight.airportLocation)} />}
    </div>
  );
}

export function MobileTripView({
  trip,
  isAdmin,
  saveStatus,
  mapSelection,
  placingMode,
  focusTarget,
  mutate,
  onSelectStage,
  onSelectPlace,
  onSelectLeg,
  onSelectFlight,
  onMapClick,
}: MobileTripViewProps) {
  const [copied, setCopied] = useState(false);
  const [snap, setSnap] = useState<SheetSnap>('half');
  const [addOpen, setAddOpen] = useState(false);
  const [budgetOpen, setBudgetOpen] = useState(false);
  const [mapFocus, setMapFocus] = useState<
    { location: LatLng; nonce: number; bottomInset?: number } | null | undefined
  >(focusTarget);

  const defaultActive = useMemo<Active>(() => {
    if (trip.stages[0]) return { type: 'stage', id: trip.stages[0].id };
    if (trip.outboundFlight) return { type: 'flight', side: 'outbound' };
    return null;
  }, [trip.stages, trip.outboundFlight]);
  const [active, setActive] = useState<Active>(defaultActive);

  // Recentre la sélection si l'étape/le lieu actif disparaît.
  useEffect(() => {
    const stageId =
      active?.type === 'stage' ? active.id : active?.type === 'place' ? active.stageId : null;
    if (stageId && !trip.stages.some((s) => s.id === stageId)) {
      setActive(defaultActive);
    }
  }, [trip.stages, active, defaultActive]);

  // Suit les demandes de focus émises par les boutons « Focus » des modales.
  useEffect(() => {
    if (!focusTarget) return;
    setSnap('peek');
    setMapFocus({
      location: focusTarget.location,
      nonce: focusTarget.nonce,
      bottomInset: Math.round(window.innerHeight * 0.22),
    });
  }, [focusTarget]);

  // Laisse voir la carte quand on place un point.
  useEffect(() => {
    if (placingMode) setSnap('peek');
  }, [placingMode]);

  // Hauteur du sheet selon le cran → padding bas pour ne pas masquer le point.
  const sheetInset = (s: SheetSnap) =>
    Math.round(window.innerHeight * (s === 'full' ? 0.9 : s === 'half' ? 0.5 : 0.22));
  const flyTo = (loc: LatLng | undefined, insetSnap: SheetSnap) => {
    if (!loc) return;
    setMapFocus({ location: loc, nonce: Date.now(), bottomInset: sheetInset(insetSnap) });
  };
  // Bouton « Sur la carte » : replie le sheet pour bien voir le point.
  const focusOnMap = (loc?: LatLng) => {
    setSnap('peek');
    flyTo(loc, 'peek');
  };

  const share = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard indisponible */
    }
  };

  const handleAddStage = () => {
    const stage = createStage(trip.stages.length);
    mutate((t) => addStage(t, stage));
    setActive({ type: 'stage', id: stage.id });
    onSelectStage(stage.id);
  };

  const stageLoc = (id: string) => trip.stages.find((s) => s.id === id)?.accommodation?.location;
  const placeLoc = (stageId: string, placeId: string) =>
    trip.stages.find((s) => s.id === stageId)?.places.find((p) => p.id === placeId)?.location;
  const flightLoc = (side: FlightSide) =>
    (side === 'outbound' ? trip.outboundFlight : trip.returnFlight)?.airportLocation;

  // Sélection depuis le rail OU la carte : recadre la carte + montre le détail en bas.
  const pickStage = (id: string) => {
    setActive({ type: 'stage', id });
    setSnap('half');
    flyTo(stageLoc(id), 'half');
  };
  const pickPlace = (stageId: string, placeId: string) => {
    setActive({ type: 'place', stageId, placeId });
    setSnap('half');
    flyTo(placeLoc(stageId, placeId), 'half');
  };
  const pickFlight = (side: FlightSide) => {
    setActive({ type: 'flight', side });
    setSnap('half');
    flyTo(flightLoc(side), 'half');
  };

  const activeStage =
    active?.type === 'stage' ? trip.stages.find((s) => s.id === active.id) : undefined;
  const activePlaceStage =
    active?.type === 'place' ? trip.stages.find((s) => s.id === active.stageId) : undefined;
  const activePlace =
    active?.type === 'place'
      ? activePlaceStage?.places.find((p) => p.id === active.placeId)
      : undefined;
  const activeFlight =
    active?.type === 'flight'
      ? active.side === 'outbound'
        ? trip.outboundFlight
        : trip.returnFlight
      : undefined;

  // Mobile : les taps sur la carte pilotent toujours le bottom sheet (jamais de modale).
  const mapHandlers = {
    onSelectStage: (id: string) => pickStage(id),
    onSelectPlace: (stageId: string, placeId: string) => pickPlace(stageId, placeId),
    onSelectLeg: (stageId: string) => pickStage(stageId),
    onSelectFlight: (side: FlightSide) => pickFlight(side),
  };

  const activeStageId =
    active?.type === 'stage' ? active.id : active?.type === 'place' ? active.stageId : null;
  const selectedStageId = mapSelection.selectedStageId ?? activeStageId;
  const selectedPlaceId =
    mapSelection.selectedPlaceId ?? (active?.type === 'place' ? active.placeId : null);
  const selectedFlight = mapSelection.selectedFlight ?? (active?.type === 'flight' ? active.side : null);

  return (
    <div className="relative h-full overflow-hidden">
      {/* Carte plein écran */}
      <div className="absolute inset-0">
        <TripMap
          trip={trip}
          selectedStageId={selectedStageId}
          selectedPlaceId={selectedPlaceId}
          selectedLegStageId={mapSelection.selectedLegStageId}
          selectedFlight={selectedFlight}
          placingMode={placingMode}
          focusTarget={mapFocus}
          onMapClick={onMapClick}
          {...mapHandlers}
        />
      </div>

      {/* Barre supérieure flottante */}
      <header className="pointer-events-none absolute inset-x-0 top-0 z-[950] flex items-center gap-2 p-3 pt-[calc(0.75rem+env(safe-area-inset-top))]">
        <div className="pointer-events-auto flex min-w-0 flex-1 items-center gap-2 rounded-full border border-border bg-card/90 px-3 py-2 shadow-sm backdrop-blur">
          <Link to="/" className="text-muted-foreground" aria-label="Retour">
            ←
          </Link>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-sm font-bold leading-tight">{trip.title}</h1>
            <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
              {isAdmin ? (
                <>
                  <Pencil className="h-2.5 w-2.5" />
                  {saveStatus === 'saving'
                    ? 'Enregistrement…'
                    : saveStatus === 'error'
                      ? 'Erreur de sauvegarde'
                      : 'Édition'}
                </>
              ) : (
                <>
                  <Eye className="h-2.5 w-2.5" /> Lecture seule
                </>
              )}
            </span>
          </div>
        </div>
        <div className="pointer-events-auto flex items-center rounded-full border border-border bg-card/90 shadow-sm backdrop-blur">
          <button
            onClick={share}
            className="flex h-9 w-9 items-center justify-center text-foreground"
            title="Partager"
          >
            {copied ? <Check className="h-4 w-4 text-green-600" /> : <Share2 className="h-4 w-4" />}
          </button>
          {isAdmin && (
            <button
              onClick={() => setBudgetOpen(true)}
              className="flex h-9 w-9 items-center justify-center text-foreground"
              title="Budget"
            >
              <Wallet className="h-4 w-4" />
            </button>
          )}
          <AdminLock />
          <ThemeToggle />
        </div>
      </header>

      {/* FAB capture rapide (admin) */}
      {isAdmin && !placingMode && (
        <button
          onClick={() => setAddOpen(true)}
          className="absolute bottom-[calc(20dvh+env(safe-area-inset-bottom))] right-4 z-[960] flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg active:scale-95"
          title="Ajouter un lieu"
        >
          <Plus className="h-6 w-6" />
        </button>
      )}

      {/* Bottom sheet : rail + détail de l'élément actif */}
      <MobileSheet
        snap={snap}
        onSnapChange={setSnap}
        rail={
          <div className="flex gap-2 overflow-x-auto px-4 pb-3 pt-0.5 scroll-thin">
            {(trip.outboundFlight || isAdmin) && (
              <RailPill
                active={active?.type === 'flight' && active.side === 'outbound'}
                onClick={() => pickFlight('outbound')}
              >
                ✈️ Aller
              </RailPill>
            )}
            {trip.stages.map((s, i) => (
              <RailPill
                key={s.id}
                color={s.color}
                active={
                  (active?.type === 'stage' && active.id === s.id) ||
                  (active?.type === 'place' && active.stageId === s.id)
                }
                onClick={() => pickStage(s.id)}
              >
                <span>{s.emoji ?? i + 1}</span>
                {s.name}
              </RailPill>
            ))}
            {(trip.returnFlight || isAdmin) && (
              <RailPill
                active={active?.type === 'flight' && active.side === 'return'}
                onClick={() => pickFlight('return')}
              >
                ✈️ Retour
              </RailPill>
            )}
            {isAdmin && (
              <RailPill active={false} onClick={handleAddStage}>
                <Plus className="h-3.5 w-3.5" /> Étape
              </RailPill>
            )}
          </div>
        }
      >
        {trip.description && snap === 'full' && (
          <p className="mb-3 text-sm text-muted-foreground">{trip.description}</p>
        )}

        {activePlace && activePlaceStage ? (
          <PlaceContent
            stage={activePlaceStage}
            place={activePlace}
            isAdmin={isAdmin}
            onBack={() => setActive({ type: 'stage', id: activePlaceStage.id })}
            onEdit={() => onSelectPlace(activePlaceStage.id, activePlace.id)}
            onToggleVisited={() =>
              mutate((t) =>
                updatePlace(t, activePlaceStage.id, activePlace.id, { visited: !activePlace.visited }),
              )
            }
            onFocus={(loc) => focusOnMap(loc)}
          />
        ) : activeStage ? (
          <StageContent
            trip={trip}
            stage={activeStage}
            isAdmin={isAdmin}
            onEditStage={() => onSelectStage(activeStage.id)}
            onOpenPlace={(placeId) => pickPlace(activeStage.id, placeId)}
            onAddPlace={() => setAddOpen(true)}
            onEditLeg={() => onSelectLeg(activeStage.id)}
            onAddLeg={() => {
              mutate((t) => setTransportLeg(t, activeStage.id, createTransport()));
              onSelectLeg(activeStage.id);
            }}
            onToggleVisited={(placeId, visited) =>
              mutate((t) => updatePlace(t, activeStage.id, placeId, { visited }))
            }
            onFocus={(loc) => focusOnMap(loc)}
          />
        ) : activeFlight && active?.type === 'flight' ? (
          <FlightContent
            side={active.side}
            flight={activeFlight}
            isAdmin={isAdmin}
            onEdit={() => onSelectFlight(active.side)}
            onFocus={(loc) => focusOnMap(loc)}
          />
        ) : (
          <p className="rounded-xl border border-dashed border-border px-3 py-8 text-center text-sm text-muted-foreground">
            {isAdmin ? 'Ajoute ta première étape avec le bouton « Étape ».' : 'Ce voyage est vide.'}
          </p>
        )}
      </MobileSheet>

      {addOpen && (
        <QuickAddPlace
          trip={trip}
          defaultStageId={active?.type === 'stage' ? active.id : undefined}
          mutate={mutate}
          onClose={() => setAddOpen(false)}
        />
      )}

      <BudgetModal trip={trip} open={budgetOpen} onClose={() => setBudgetOpen(false)} />
    </div>
  );
}
