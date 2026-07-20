import { ArrowLeft, Trash2, X } from 'lucide-react';
import type { Place, PlaceCategory, Trip } from '@shared/types/trip';
import { PLACE_CATEGORIES } from '@/shared/constants/catalog';
import { removePlace, updatePlace } from '@/domain/trip/services/tripMutations';
import type { PlacingTarget } from '@/presentation/types';
import { Button } from '../ui/Button';
import { Field } from '../ui/Field';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Textarea } from '../ui/Textarea';
import { LocationField } from './LocationField';

interface PlaceEditorProps {
  trip: Trip;
  stageId: string;
  place: Place;
  placingTarget: PlacingTarget;
  mutate: (updater: (trip: Trip) => Trip) => void;
  setPlacingTarget: (target: PlacingTarget) => void;
  onBackToStage: (stageId: string) => void;
  onClose: () => void;
}

export function PlaceEditor({
  trip,
  stageId,
  place,
  placingTarget,
  mutate,
  setPlacingTarget,
  onBackToStage,
  onClose,
}: PlaceEditorProps) {
  const stage = trip.stages.find((s) => s.id === stageId);
  const placing =
    placingTarget?.kind === 'place' &&
    placingTarget.stageId === stageId &&
    placingTarget.placeId === place.id;

  const patch = (p: Partial<Place>) => mutate((t) => updatePlace(t, stageId, place.id, p));

  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center justify-between border-b border-border px-4 py-3">
        <button
          type="button"
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
          onClick={() => onBackToStage(stageId)}
        >
          <ArrowLeft className="h-4 w-4" />
          {stage?.name ?? 'Étape'}
        </button>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </header>

      <div className="flex-1 space-y-4 overflow-y-auto p-4 scroll-thin">
        <Field label="Nom du lieu">
          <Input value={place.name} onChange={(e) => patch({ name: e.target.value })} />
        </Field>

        <div className="grid grid-cols-2 gap-2">
          <Field label="Catégorie">
            <Select
              value={place.category}
              onChange={(e) => patch({ category: e.target.value as PlaceCategory })}
            >
              {Object.entries(PLACE_CATEGORIES).map(([key, { label, emoji }]) => (
                <option key={key} value={key}>
                  {emoji} {label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Statut">
            <label className="flex h-9 items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={place.visited}
                onChange={(e) => patch({ visited: e.target.checked })}
              />
              Déjà visité
            </label>
          </Field>
        </div>

        <LocationField
          address={place.address ?? ''}
          location={place.location}
          googleMapsUrl={place.googleMapsUrl ?? ''}
          placing={placing}
          onAddressChange={(text) => patch({ address: text })}
          onSelectSuggestion={(s) => patch({ address: s.label, location: s.location })}
          onGoogleMapsUrlChange={(url) => patch({ googleMapsUrl: url })}
          onTogglePlacing={() =>
            setPlacingTarget(placing ? null : { kind: 'place', stageId, placeId: place.id })
          }
        />

        <Field label="Notes">
          <Textarea
            value={place.notes ?? ''}
            placeholder="Horaires, tarif, réservation, astuces…"
            onChange={(e) => patch({ notes: e.target.value })}
          />
        </Field>

        <Button
          variant="danger"
          className="w-full"
          onClick={() => {
            mutate((t) => removePlace(t, stageId, place.id));
            onBackToStage(stageId);
          }}
        >
          <Trash2 className="h-4 w-4" /> Supprimer le lieu
        </Button>
      </div>
    </div>
  );
}
