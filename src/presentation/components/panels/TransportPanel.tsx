import { Plus, Trash2, X } from 'lucide-react';
import type { Trip } from '@shared/types/trip';
import { createTransport } from '@/domain/trip/services/tripFactory';
import { addTransport, removeTransport, updateTransport } from '@/domain/trip/services/tripMutations';
import { Button } from '../ui/Button';
import { TransportFields } from './TransportFields';

interface TransportPanelProps {
  trip: Trip;
  mutate: (updater: (trip: Trip) => Trip) => void;
  onClose: () => void;
}

export function TransportPanel({ trip, mutate, onClose }: TransportPanelProps) {
  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center justify-between border-b border-border px-4 py-3">
        <div>
          <h2 className="font-semibold">🚆 Autres trajets</h2>
          <p className="text-xs text-muted-foreground">
            Excursions, aéroport… (les trajets entre étapes se gèrent sur la ligne du voyage)
          </p>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </header>

      <div className="flex-1 space-y-3 overflow-y-auto p-4 scroll-thin">
        <Button
          variant="secondary"
          className="w-full"
          onClick={() => mutate((t) => addTransport(t, createTransport()))}
        >
          <Plus className="h-4 w-4" /> Ajouter un trajet
        </Button>

        {trip.transports.length === 0 && (
          <p className="rounded-md border border-dashed border-border px-3 py-6 text-center text-xs text-muted-foreground">
            Aucun trajet enregistré.
          </p>
        )}

        {trip.transports.map((tr) => (
          <div key={tr.id} className="space-y-2 rounded-lg border border-border p-3">
            <div className="flex items-center justify-end">
              <Button
                variant="ghost"
                size="icon"
                className="text-red-600"
                onClick={() => mutate((t) => removeTransport(t, tr.id))}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            <TransportFields
              transport={tr}
              onPatch={(patch) => mutate((t) => updateTransport(t, tr.id, patch))}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
