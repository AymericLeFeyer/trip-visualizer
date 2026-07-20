import { ArrowRight, Trash2, X } from 'lucide-react';
import type { Trip } from '@shared/types/trip';
import { removeTransportLeg, updateTransportLeg } from '@/domain/trip/services/tripMutations';
import { Button } from '../ui/Button';
import { TransportFields } from './TransportFields';

interface TransportLegEditorProps {
  trip: Trip;
  stageId: string;
  mutate: (updater: (trip: Trip) => Trip) => void;
  onClose: () => void;
}

export function TransportLegEditor({ trip, stageId, mutate, onClose }: TransportLegEditorProps) {
  const index = trip.stages.findIndex((s) => s.id === stageId);
  const stage = trip.stages[index];
  const nextStage = trip.stages[index + 1];
  const leg = stage?.transportToNext;

  if (!stage || !leg) return null;

  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-1.5 text-sm font-semibold">
          <span className="truncate">{stage.name}</span>
          <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
          <span className="truncate">{nextStage?.name ?? '…'}</span>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </header>

      <div className="flex-1 space-y-4 overflow-y-auto p-4 scroll-thin">
        <TransportFields
          transport={leg}
          hideLabel
          onPatch={(patch) => mutate((t) => updateTransportLeg(t, stageId, patch))}
        />

        <Button
          variant="danger"
          className="w-full"
          onClick={() => {
            mutate((t) => removeTransportLeg(t, stageId));
            onClose();
          }}
        >
          <Trash2 className="h-4 w-4" /> Supprimer ce transport
        </Button>
      </div>
    </div>
  );
}
