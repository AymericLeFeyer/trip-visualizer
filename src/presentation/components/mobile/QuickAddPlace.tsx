import { useState } from 'react';
import { Check, X } from 'lucide-react';
import type { PlaceCategory, Trip } from '@shared/types/trip';
import { PLACE_CATEGORIES } from '@/shared/constants/catalog';
import type { GeoSuggestion } from '@/infrastructure/geocoding/nominatim';
import { createPlace } from '@/domain/trip/services/tripFactory';
import { addPlace } from '@/domain/trip/services/tripMutations';
import { cn } from '@/shared/lib/cn';
import { AddressAutocomplete } from '../AddressAutocomplete';
import { Button } from '../ui/Button';
import { Field } from '../ui/Field';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';

interface QuickAddPlaceProps {
  trip: Trip;
  defaultStageId?: string;
  mutate: (updater: (trip: Trip) => Trip) => void;
  onClose: () => void;
}

const CATEGORIES = Object.entries(PLACE_CATEGORIES) as [
  PlaceCategory,
  { label: string; emoji: string },
][];

/**
 * Capture rapide d'un lieu à visiter (mobile, admin) : pensé pour ajouter en
 * quelques secondes un spot repéré sur Instagram — nom, adresse, lien.
 */
export function QuickAddPlace({ trip, defaultStageId, mutate, onClose }: QuickAddPlaceProps) {
  const [stageId, setStageId] = useState(defaultStageId ?? trip.stages[0]?.id ?? '');
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [location, setLocation] = useState<GeoSuggestion['location'] | undefined>();
  const [link, setLink] = useState('');
  const [category, setCategory] = useState<PlaceCategory>('sight');
  const [justSaved, setJustSaved] = useState(false);

  const canSave = Boolean(stageId && name.trim());

  const reset = () => {
    setName('');
    setAddress('');
    setLocation(undefined);
    setLink('');
    setCategory('sight');
  };

  const save = (keepOpen: boolean) => {
    if (!canSave) return;
    const place = createPlace(name.trim());
    place.category = category;
    if (address) place.address = address;
    if (location) place.location = location;
    if (link) place.googleMapsUrl = link;
    mutate((t) => addPlace(t, stageId, place));
    if (keepOpen) {
      reset();
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 1600);
    } else {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[1500] flex flex-col justify-end">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} aria-hidden />

      <div className="relative z-10 flex max-h-[92dvh] flex-col rounded-t-2xl border border-border bg-card shadow-2xl">
        <header className="flex shrink-0 items-center justify-between border-b border-border px-4 py-3">
          <h2 className="font-semibold">Ajouter un lieu</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </header>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4 scroll-thin">
          <Field label="Nom du lieu">
            <Input
              autoFocus
              value={name}
              placeholder="Ex : Ramen Nakiryu"
              onChange={(e) => setName(e.target.value)}
            />
          </Field>

          <Field label="Adresse">
            <AddressAutocomplete
              value={address}
              placeholder="Rechercher l'adresse…"
              onChange={(text) => {
                setAddress(text);
                setLocation(undefined);
              }}
              onSelect={(s) => {
                setAddress(s.label);
                setLocation(s.location);
              }}
            />
            {location && (
              <span className="mt-1 block text-xs text-muted-foreground">
                📍 {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
              </span>
            )}
          </Field>

          <Field label="Lien (Google Maps, Instagram…)">
            <Input
              value={link}
              inputMode="url"
              placeholder="Colle le lien du spot"
              onChange={(e) => setLink(e.target.value)}
            />
          </Field>

          <Field label="Catégorie">
            <div className="flex flex-wrap gap-1.5">
              {CATEGORIES.map(([key, { label, emoji }]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setCategory(key)}
                  className={cn(
                    'flex items-center gap-1 rounded-full border px-2.5 py-1.5 text-xs transition-colors',
                    category === key
                      ? 'border-primary bg-primary/10 text-foreground'
                      : 'border-border text-muted-foreground hover:bg-muted',
                  )}
                >
                  <span>{emoji}</span>
                  {label}
                </button>
              ))}
            </div>
          </Field>

          {trip.stages.length > 1 && (
            <Field label="Rattacher à l'étape">
              <Select value={stageId} onChange={(e) => setStageId(e.target.value)}>
                {trip.stages.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.emoji ? `${s.emoji} ` : ''}
                    {s.name}
                  </option>
                ))}
              </Select>
            </Field>
          )}
        </div>

        <footer className="flex shrink-0 items-center gap-2 border-t border-border p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
          <Button
            variant="secondary"
            className="flex-1"
            disabled={!canSave}
            onClick={() => save(true)}
          >
            {justSaved ? <Check className="h-4 w-4 text-green-600" /> : null}
            {justSaved ? 'Ajouté !' : 'Enregistrer et continuer'}
          </Button>
          <Button className="flex-1" disabled={!canSave} onClick={() => save(false)}>
            Enregistrer
          </Button>
        </footer>
      </div>
    </div>
  );
}
