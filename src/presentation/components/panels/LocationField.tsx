import { Crosshair, ExternalLink } from 'lucide-react';
import type { LatLng } from '@shared/types/trip';
import type { GeoSuggestion } from '@/infrastructure/geocoding/nominatim';
import { cn } from '@/shared/lib/cn';
import { AddressAutocomplete } from '../AddressAutocomplete';
import { MapsSearchButton } from '../details/parts';
import { Button } from '../ui/Button';
import { Field } from '../ui/Field';
import { Input } from '../ui/Input';

interface LocationFieldProps {
  address: string;
  location?: LatLng;
  googleMapsUrl: string;
  placing: boolean;
  onAddressChange: (text: string) => void;
  onSelectSuggestion: (s: GeoSuggestion) => void;
  onGoogleMapsUrlChange: (url: string) => void;
  onTogglePlacing: () => void;
}

export function LocationField({
  address,
  location,
  googleMapsUrl,
  placing,
  onAddressChange,
  onSelectSuggestion,
  onGoogleMapsUrlChange,
  onTogglePlacing,
}: LocationFieldProps) {
  return (
    <div className="space-y-2">
      <Field label="Adresse (autocomplétion)">
        <AddressAutocomplete
          value={address}
          onChange={onAddressChange}
          onSelect={onSelectSuggestion}
        />
      </Field>

      <div className="flex items-center gap-2">
        <Button
          type="button"
          size="sm"
          variant={placing ? 'primary' : 'secondary'}
          onClick={onTogglePlacing}
          className={cn(placing && 'ring-2 ring-ring')}
        >
          <Crosshair className="h-3.5 w-3.5" />
          {placing ? 'Clique sur la carte…' : 'Placer sur la carte'}
        </Button>
        {location && (
          <span className="text-xs text-muted-foreground">
            {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
          </span>
        )}
      </div>

      <MapsSearchButton query={address} />

      <Field label="Lien Google Maps">
        <div className="flex items-center gap-1.5">
          <Input
            value={googleMapsUrl}
            placeholder="https://maps.google.com/…"
            onChange={(e) => onGoogleMapsUrlChange(e.target.value)}
          />
          {googleMapsUrl && (
            <a
              href={googleMapsUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-muted"
              title="Ouvrir dans Google Maps"
            >
              <ExternalLink className="h-4 w-4" />
            </a>
          )}
        </div>
      </Field>
    </div>
  );
}
