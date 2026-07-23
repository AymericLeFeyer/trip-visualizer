import { ChevronDown, ChevronUp, MapPin, Plus, Trash2, X } from 'lucide-react';
import type { Stage, Trip } from '@shared/types/trip';
import { PLACE_CATEGORIES, STAGE_COLORS, STAGE_EMOJIS } from '@/shared/constants/catalog';
import { createPlace } from '@/domain/trip/services/tripFactory';
import {
  addPlace,
  moveStage,
  removePlace,
  removeStage,
  setAccommodation,
  updatePlace,
  updateStage,
} from '@/domain/trip/services/tripMutations';
import type { PlacingTarget } from '@/presentation/types';
import { cn } from '@/shared/lib/cn';
import { Button } from '../ui/Button';
import { Field } from '../ui/Field';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { FocusButton } from '../details/parts';
import { LocationField } from './LocationField';
import { PriceField } from './PriceField';

interface StageEditorProps {
  trip: Trip;
  stage: Stage;
  placingTarget: PlacingTarget;
  mutate: (updater: (trip: Trip) => Trip) => void;
  setPlacingTarget: (target: PlacingTarget) => void;
  onSelectPlace: (stageId: string, placeId: string) => void;
  onFocus?: () => void;
  onClose: () => void;
}

export function StageEditor({
  trip,
  stage,
  placingTarget,
  mutate,
  setPlacingTarget,
  onSelectPlace,
  onFocus,
  onClose,
}: StageEditorProps) {
  const acc = stage.accommodation;
  const accPlacing =
    placingTarget?.kind === 'accommodation' && placingTarget.stageId === stage.id;

  const handleAddPlace = () => {
    const place = createPlace();
    mutate((t) => addPlace(t, stage.id, place));
    onSelectPlace(stage.id, place.id);
  };

  return (
    <div className="flex min-h-0 flex-col">
      <header className="flex shrink-0 items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <span
            className="flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold text-white"
            style={{ background: stage.color }}
          >
            {trip.stages.findIndex((s) => s.id === stage.id) + 1}
          </span>
          <h2 className="font-semibold">Étape</h2>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            title="Monter"
            onClick={() => mutate((t) => moveStage(t, stage.id, -1))}
          >
            <ChevronUp className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            title="Descendre"
            onClick={() => mutate((t) => moveStage(t, stage.id, 1))}
          >
            <ChevronDown className="h-4 w-4" />
          </Button>
          {onFocus && <FocusButton onClick={onFocus} />}
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </header>

      <div className="flex-1 min-h-0 overflow-y-auto p-4 scroll-thin">
        <div className="grid gap-x-8 gap-y-5 md:grid-cols-2 md:items-start">
          {/* Colonne gauche : détails & hébergement */}
          <div className="space-y-5">
        <Field label="Nom de l'étape">
          <Input
            value={stage.name}
            onChange={(e) => mutate((t) => updateStage(t, stage.id, { name: e.target.value }))}
          />
        </Field>

        <Field label="Couleur">
          <div className="flex flex-wrap gap-1.5">
            {STAGE_COLORS.map((color) => (
              <button
                key={color}
                type="button"
                className={cn(
                  'h-6 w-6 rounded-full border-2 transition-transform hover:scale-110',
                  stage.color === color ? 'border-foreground' : 'border-transparent',
                )}
                style={{ background: color }}
                onClick={() => mutate((t) => updateStage(t, stage.id, { color }))}
              />
            ))}
          </div>
        </Field>

        <Field label="Emoji (marqueur)">
          <div className="flex items-center gap-2">
            <Input
              value={stage.emoji ?? ''}
              maxLength={4}
              placeholder="🏙️"
              className="w-16 text-center text-lg"
              onChange={(e) =>
                mutate((t) => updateStage(t, stage.id, { emoji: e.target.value || undefined }))
              }
            />
            <div className="flex flex-wrap gap-1">
              {STAGE_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-md border text-lg transition-colors hover:bg-muted',
                    stage.emoji === emoji ? 'border-primary bg-primary/5' : 'border-border',
                  )}
                  onClick={() => mutate((t) => updateStage(t, stage.id, { emoji }))}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        </Field>

        {/* --- Hébergement / nuit --- */}
        <section className="space-y-3 rounded-lg border border-border bg-muted/40 p-3">
          <h3 className="flex items-center gap-1.5 text-sm font-semibold">
            <MapPin className="h-4 w-4 text-primary" /> Hébergement (nuit)
          </h3>

          <Field label="Nom de l'hébergement">
            <Input
              value={acc?.name ?? ''}
              placeholder="Hôtel, ryokan, Airbnb…"
              onChange={(e) =>
                mutate((t) => setAccommodation(t, stage.id, { name: e.target.value }))
              }
            />
          </Field>

          <LocationField
            address={acc?.address ?? ''}
            location={acc?.location}
            googleMapsUrl={acc?.googleMapsUrl ?? ''}
            placing={accPlacing}
            onAddressChange={(text) =>
              mutate((t) => setAccommodation(t, stage.id, { address: text }))
            }
            onSelectSuggestion={(s) =>
              mutate((t) =>
                setAccommodation(t, stage.id, { address: s.label, location: s.location }),
              )
            }
            onGoogleMapsUrlChange={(url) =>
              mutate((t) => setAccommodation(t, stage.id, { googleMapsUrl: url }))
            }
            onTogglePlacing={() =>
              setPlacingTarget(accPlacing ? null : { kind: 'accommodation', stageId: stage.id })
            }
          />

          <div className="grid grid-cols-2 gap-2">
            <Field label="Date d'arrivée">
              <Input
                type="date"
                value={acc?.checkInDate ?? ''}
                onChange={(e) =>
                  mutate((t) => setAccommodation(t, stage.id, { checkInDate: e.target.value }))
                }
              />
            </Field>
            <Field label="Date de départ">
              <Input
                type="date"
                value={acc?.checkOutDate ?? ''}
                onChange={(e) =>
                  mutate((t) => setAccommodation(t, stage.id, { checkOutDate: e.target.value }))
                }
              />
            </Field>
            <Field label="Heure d'arrivée">
              <Input
                type="time"
                value={acc?.arrivalTime ?? ''}
                onChange={(e) =>
                  mutate((t) => setAccommodation(t, stage.id, { arrivalTime: e.target.value }))
                }
              />
            </Field>
            <Field label="Heure de départ">
              <Input
                type="time"
                value={acc?.departureTime ?? ''}
                onChange={(e) =>
                  mutate((t) => setAccommodation(t, stage.id, { departureTime: e.target.value }))
                }
              />
            </Field>
          </div>

          <PriceField
            label="Prix du séjour"
            price={acc?.price}
            currency={acc?.currency}
            persons={acc?.persons}
            onChange={(patch) => mutate((t) => setAccommodation(t, stage.id, patch))}
          />

          <Field label="Modalités">
            <Textarea
              value={acc?.modalities ?? ''}
              placeholder="Check-in, code d'accès, dépôt de bagages, caution…"
              onChange={(e) =>
                mutate((t) => setAccommodation(t, stage.id, { modalities: e.target.value }))
              }
            />
          </Field>

          <Field label="Notes hébergement">
            <Textarea
              value={acc?.notes ?? ''}
              onChange={(e) =>
                mutate((t) => setAccommodation(t, stage.id, { notes: e.target.value }))
              }
            />
          </Field>
        </section>
          </div>

          {/* Colonne droite : lieux, notes, suppression */}
          <div className="space-y-5">
        {/* --- Lieux à visiter --- */}
        <section className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Lieux à visiter ({stage.places.length})</h3>
            <Button size="sm" variant="secondary" onClick={handleAddPlace}>
              <Plus className="h-3.5 w-3.5" /> Ajouter
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Sans ordre précis, ils rayonnent autour de l'hébergement.
          </p>

          <ul className="space-y-1">
            {stage.places.map((place) => (
              <li
                key={place.id}
                className={cn(
                  'flex items-center gap-2 rounded-md border px-2 py-1.5',
                  place.reserved
                    ? 'border-amber-300 bg-amber-50/60 dark:border-amber-500/40 dark:bg-amber-500/5'
                    : 'border-border',
                )}
              >
                <input
                  type="checkbox"
                  checked={place.visited}
                  title="Visité"
                  onChange={(e) =>
                    mutate((t) =>
                      updatePlace(t, stage.id, place.id, { visited: e.target.checked }),
                    )
                  }
                />
                <button
                  type="button"
                  className="flex min-w-0 flex-1 items-center gap-1.5 truncate text-left text-sm hover:text-primary"
                  onClick={() => onSelectPlace(stage.id, place.id)}
                >
                  <span>{PLACE_CATEGORIES[place.category].emoji}</span>
                  <span className="truncate">{place.name}</span>
                  {place.reserved && <span title="Réservé">🎟️</span>}
                </button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-red-600"
                  onClick={() => mutate((t) => removePlace(t, stage.id, place.id))}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </li>
            ))}
            {stage.places.length === 0 && (
              <li className="rounded-md border border-dashed border-border px-3 py-4 text-center text-xs text-muted-foreground">
                Aucun lieu pour l'instant.
              </li>
            )}
          </ul>
        </section>

        <Field label="Notes de l'étape">
          <Textarea
            value={stage.notes ?? ''}
            onChange={(e) => mutate((t) => updateStage(t, stage.id, { notes: e.target.value }))}
          />
        </Field>

        <Button
          variant="danger"
          className="w-full"
          onClick={() => {
            mutate((t) => removeStage(t, stage.id));
            onClose();
          }}
        >
          <Trash2 className="h-4 w-4" /> Supprimer l'étape
        </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
