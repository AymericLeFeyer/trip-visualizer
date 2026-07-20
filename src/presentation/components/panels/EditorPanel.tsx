import type { Trip } from '@shared/types/trip';
import type { PlacingTarget, Selection } from '@/presentation/types';
import { PlaceEditor } from './PlaceEditor';
import { StageEditor } from './StageEditor';
import { TransportLegEditor } from './TransportLegEditor';
import { TransportPanel } from './TransportPanel';

interface EditorPanelProps {
  trip: Trip;
  selection: Selection;
  placingTarget: PlacingTarget;
  mutate: (updater: (trip: Trip) => Trip) => void;
  setPlacingTarget: (target: PlacingTarget) => void;
  onSelectStage: (stageId: string) => void;
  onSelectPlace: (stageId: string, placeId: string) => void;
  onClose: () => void;
}

export function EditorPanel({
  trip,
  selection,
  placingTarget,
  mutate,
  setPlacingTarget,
  onSelectStage,
  onSelectPlace,
  onClose,
}: EditorPanelProps) {
  if (!selection) return null;

  const renderContent = () => {
    if (selection.kind === 'transports') {
      return <TransportPanel trip={trip} mutate={mutate} onClose={onClose} />;
    }

    if (selection.kind === 'leg') {
      return (
        <TransportLegEditor
          trip={trip}
          stageId={selection.stageId}
          mutate={mutate}
          onClose={onClose}
        />
      );
    }

    if (selection.kind === 'stage') {
      const stage = trip.stages.find((s) => s.id === selection.stageId);
      if (!stage) return null;
      return (
        <StageEditor
          trip={trip}
          stage={stage}
          placingTarget={placingTarget}
          mutate={mutate}
          setPlacingTarget={setPlacingTarget}
          onSelectPlace={onSelectPlace}
          onClose={onClose}
        />
      );
    }

    // selection.kind === 'place'
    const stage = trip.stages.find((s) => s.id === selection.stageId);
    const place = stage?.places.find((p) => p.id === selection.placeId);
    if (!stage || !place) return null;
    return (
      <PlaceEditor
        trip={trip}
        stageId={stage.id}
        place={place}
        placingTarget={placingTarget}
        mutate={mutate}
        setPlacingTarget={setPlacingTarget}
        onBackToStage={onSelectStage}
        onClose={onClose}
      />
    );
  };

  return (
    <div className="absolute right-0 top-0 z-[1100] h-full w-[380px] max-w-[90vw] border-l border-border bg-card shadow-2xl">
      {renderContent()}
    </div>
  );
}
