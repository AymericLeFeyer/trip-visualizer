import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import type { LatLng } from '@shared/types/trip';
import { setAccommodation, updatePlace } from '@/domain/trip/services/tripMutations';
import { useTrip } from '@/presentation/hooks/useTrip';
import { useIsMobile } from '@/presentation/hooks/useMediaQuery';
import type { PlacingTarget, Selection } from '@/presentation/types';
import { Sidebar } from '@/presentation/components/panels/Sidebar';
import { EditorPanel } from '@/presentation/components/panels/EditorPanel';
import { TripMap } from '@/presentation/components/map/TripMap';
import { MobileTripView } from './MobileTripView';

export function TripPage() {
  const { id = '' } = useParams();
  const { trip, loading, loadError, saveStatus, mutate } = useTrip(id);
  const isMobile = useIsMobile();

  const [selection, setSelection] = useState<Selection>(null);
  const [placingTarget, setPlacingTarget] = useState<PlacingTarget>(null);

  const selectStage = (stageId: string) => setSelection({ kind: 'stage', stageId });
  const selectPlace = (stageId: string, placeId: string) =>
    setSelection({ kind: 'place', stageId, placeId });
  const selectLeg = (stageId: string) => setSelection({ kind: 'leg', stageId });

  const handleMapClick = (location: LatLng) => {
    if (!placingTarget) return;
    if (placingTarget.kind === 'accommodation') {
      mutate((t) => setAccommodation(t, placingTarget.stageId, { location }));
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

  // Mobile : vue en lecture seule (l'édition reste sur tablette et plus).
  if (isMobile) {
    return <MobileTripView trip={trip} />;
  }

  const selectedStageId =
    selection?.kind === 'stage'
      ? selection.stageId
      : selection?.kind === 'place'
        ? selection.stageId
        : null;
  const selectedPlaceId = selection?.kind === 'place' ? selection.placeId : null;
  const selectedLegStageId = selection?.kind === 'leg' ? selection.stageId : null;

  return (
    <div className="flex h-full">
      <Sidebar
        trip={trip}
        selection={selection}
        saveStatus={saveStatus}
        mutate={mutate}
        onSelectStage={selectStage}
        onSelectLeg={selectLeg}
        onSelectTransports={() => setSelection({ kind: 'transports' })}
      />

      <main className="relative flex-1">
        <TripMap
          trip={trip}
          selectedStageId={selectedStageId}
          selectedPlaceId={selectedPlaceId}
          selectedLegStageId={selectedLegStageId}
          placingMode={placingTarget !== null}
          onSelectStage={selectStage}
          onSelectPlace={selectPlace}
          onSelectLeg={selectLeg}
          onMapClick={handleMapClick}
        />

        {placingTarget && (
          <div className="absolute left-1/2 top-4 z-[1000] -translate-x-1/2 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-lg">
            Clique sur la carte pour placer le point
            <button
              className="ml-3 underline opacity-90"
              onClick={() => setPlacingTarget(null)}
            >
              annuler
            </button>
          </div>
        )}

        <EditorPanel
          trip={trip}
          selection={selection}
          placingTarget={placingTarget}
          mutate={mutate}
          setPlacingTarget={setPlacingTarget}
          onSelectStage={selectStage}
          onSelectPlace={selectPlace}
          onClose={() => setSelection(null)}
        />
      </main>
    </div>
  );
}
