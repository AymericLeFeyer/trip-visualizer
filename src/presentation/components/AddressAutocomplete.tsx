import { useRef, useState } from 'react';
import { Loader2, MapPin } from 'lucide-react';
import type { GeoSuggestion } from '@/infrastructure/geocoding/nominatim';
import { useGeocodeSearch } from '@/presentation/hooks/useGeocodeSearch';
import { Input } from './ui/Input';

interface AddressAutocompleteProps {
  value: string;
  placeholder?: string;
  onChange: (text: string) => void;
  onSelect: (suggestion: GeoSuggestion) => void;
}

export function AddressAutocomplete({
  value,
  placeholder,
  onChange,
  onSelect,
}: AddressAutocompleteProps) {
  const [open, setOpen] = useState(false);
  const { suggestions, loading } = useGeocodeSearch(open ? value : '');
  const blurTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSelect = (s: GeoSuggestion) => {
    onSelect(s);
    setOpen(false);
  };

  return (
    <div className="relative">
      <div className="relative">
        <MapPin className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={value}
          placeholder={placeholder ?? 'Rechercher une adresse…'}
          className="pl-8"
          onChange={(e) => {
            onChange(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => {
            // Léger délai pour laisser le clic sur une suggestion se déclencher.
            blurTimer.current = setTimeout(() => setOpen(false), 150);
          }}
        />
        {loading && (
          <Loader2 className="absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
        )}
      </div>

      {open && suggestions.length > 0 && (
        <ul className="absolute z-[1200] mt-1 max-h-60 w-full overflow-auto rounded-md border border-border bg-card shadow-lg scroll-thin">
          {suggestions.map((s, i) => (
            <li key={`${s.label}-${i}`}>
              <button
                type="button"
                className="flex w-full items-start gap-2 px-3 py-2 text-left text-sm hover:bg-muted"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => handleSelect(s)}
              >
                <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                <span className="line-clamp-2">{s.label}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
