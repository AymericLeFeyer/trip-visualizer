import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import type { LatLng } from '@shared/types/trip';
import { setAccommodation, setFlight, updatePlace } from '@/domain/trip/services/tripMutations';
import type { FlightSide } from '@/domain/trip/services/tripMutations';
import { createFlight } from '@/domain/trip/services/tripFactory';
import { useTrip } from '@/presentation/hooks/useTrip';
import { useIsMobile } from '@/presentation/hooks/useMediaQuery';
import { useAdminMode } from '@/presentation/mode/AdminModeProvider';
import { deriveMapSelection, type PlacingTarget, type Selection } from '@/presentation/types';
import { Sidebar } from '@/presentation/components/panels/Sidebar';
import { DetailModal } from '@/presentation/components/panels/DetailModal';
import { DetailDrawer } from '@/presentation/components/panels/DetailDrawer';
import { TripMap } from '@/presentation/components/map/TripMap';
import { MobileTripView } from './MobileTripView';

export function TripPage() {
  const { id = '' } = useParams();
  const { trip, loading, loadError, saveStatus, mutate } = useTrip(id);
  const isMobile = useIsMobile();
  const { isAdmin } = useAdminMode();

  // Pile de sélections (desktop = tiroirs empilés : étape → lieu). Le dessus = actif.
  const [stack, setStack] = useState<NonNullable<Selection>[]>([]);
  const selection: Selection = stack.length ? stack[stack.length - 1] : null;
  const [placingTarget, setPlacingTarget] = useState<PlacingTarget>(null);
  const [focusTarget, setFocusTarget] = useState<{ location: LatLng; nonce: number } | null>(null);

  const selectStage = (stageId: string) => setStack([{ kind: 'stage', stageId }]);
  // Un lieu ouvre un 2ᵉ tiroir par-dessus son étape (contexte conservé).
  const selectPlace = (stageId: string, placeId: string) =>
    setStack([
      { kind: 'stage', stageId },
      { kind: 'place', stageId, placeId },
    ]);
  const selectLeg = (stageId: string) => setStack([{ kind: 'leg', stageId }]);
  const selectFlight = (side: FlightSide) => {
    // En admin, créer le vol à la volée s'il n'existe pas encore.
    const exists = side === 'outbound' ? trip?.outboundFlight : trip?.returnFlight;
    if (isAdmin && !exists) mutate((t) => setFlight(t, side, createFlight()));
    setStack([{ kind: 'flight', side }]);
  };
  // Ferme le tiroir d'index i et tous ceux au-dessus.
  const closeFrom = (index: number) => setStack((s) => s.slice(0, index));
  const clearSelection = () => setStack([]);

  // « Focus » : recadre la carte sur le point et ferme les tiroirs.
  const focusOnMap = (location: LatLng) => {
    setFocusTarget({ location, nonce: Date.now() });
    clearSelection();
  };

  const handleMapClick = (location: LatLng) => {
    if (!placingTarget) return;
    if (placingTarget.kind === 'accommodation') {
      mutate((t) => setAccommodation(t, placingTarget.stageId, { location }));
    } else if (placingTarget.kind === 'flightAirport') {
      mutate((t) => setFlight(t, placingTarget.side, { airportLocation: location }));
    } else {
      mutate((t) => updatePlace(t, placingTarget.stageId, placingTarget.placeId, { location }));
    }
    setPlacingTarget(null);
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center gap-2 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" /> Chargement du voyage…
      </div>
    );
  }

  if (loadError || !trip) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
        <p className="text-lg font-semibold">Voyage introuvable</p>
        <p className="text-sm text-muted-foreground">{loadError ?? 'Ce lien ne correspond à aucun voyage.'}</p>
        <a href="/" className="text-sm text-primary underline">
          Retour à l'accueil
        </a>
      </div>
    );
  }

  const mapSelection = deriveMapSelection(selection);

  // Bandeau de placement (position fixed → partagé desktop/mobile).
  const placementBanner = placingTarget && (
    <div className="fixed left-1/2 top-4 z-[1300] -translate-x-1/2 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-lg">
      Clique sur la carte pour placer le point
      <button className="ml-3 underline opacity-90" onClick={() => setPlacingTarget(null)}>
        annuler
      </button>
    </div>
  );

  if (isMobile) {
    return (
      <>
        <MobileTripView
          trip={trip}
          isAdmin={isAdmin}
          saveStatus={saveStatus}
          mapSelection={mapSelection}
          placingMode={placingTarget !== null}
          focusTarget={focusTarget}
          mutate={mutate}
          onSelectStage={selectStage}
          onSelectPlace={selectPlace}
          onSelectLeg={selectLeg}
          onSelectFlight={selectFlight}
          onMapClick={handleMapClick}
        />
        {/* Mobile : l'édition passe par une modale (les taps carte pilotent le sheet). */}
        <DetailModal
          trip={trip}
          selection={selection}
          isAdmin={isAdmin}
          placingTarget={placingTarget}
          mutate={mutate}
          setPlacingTarget={setPlacingTarget}
          onSelectStage={selectStage}
          onSelectPlace={selectPlace}
          onFocus={focusOnMap}
          onClose={clearSelection}
        />
        {placementBanner}
      </>
    );
  }

  return (
    <div className="flex h-full">
      <Sidebar
        trip={trip}
        selection={selection}
        saveStatus={saveStatus}
        isAdmin={isAdmin}
        mutate={mutate}
        onSelectStage={selectStage}
        onSelectLeg={selectLeg}
        onSelectFlight={selectFlight}
      />

      {/* Desktop : tiroirs empilés redimensionnables (plus de modale), carte à droite. */}
      {stack.map((sel, i) => (
        <DetailDrawer
          key={i}
          trip={trip}
          selection={sel}
          isAdmin={isAdmin}
          placingTarget={placingTarget}
          mutate={mutate}
          setPlacingTarget={setPlacingTarget}
          onSelectStage={selectStage}
          onSelectPlace={selectPlace}
          onFocus={focusOnMap}
          onClose={() => closeFrom(i)}
        />
      ))}

      <main className="relative min-w-0 flex-1">
        <TripMap
          trip={trip}
          selectedStageId={mapSelection.selectedStageId}
          selectedPlaceId={mapSelection.selectedPlaceId}
          selectedLegStageId={mapSelection.selectedLegStageId}
          selectedFlight={mapSelection.selectedFlight}
          placingMode={placingTarget !== null}
          focusTarget={focusTarget}
          onSelectStage={selectStage}
          onSelectPlace={selectPlace}
          onSelectLeg={selectLeg}
          onSelectFlight={selectFlight}
          onMapClick={handleMapClick}
        />
      </main>

      {placementBanner}
    </div>
  );
}
