import { useEffect, useState } from 'react';
import { searchAddress, type GeoSuggestion } from '@/infrastructure/geocoding/nominatim';
import { useDebouncedValue } from './useDebouncedValue';

interface GeocodeState {
  suggestions: GeoSuggestion[];
  loading: boolean;
}

/** Autocomplétion d'adresses débouncée + annulable. */
export function useGeocodeSearch(query: string): GeocodeState {
  const debounced = useDebouncedValue(query, 400);
  const [suggestions, setSuggestions] = useState<GeoSuggestion[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (debounced.trim().length < 3) {
      setSuggestions([]);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    setLoading(true);
    searchAddress(debounced, controller.signal)
      .then((results) => setSuggestions(results))
      .catch(() => {
        /* requête annulée ou échec réseau : on ignore */
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [debounced]);

  return { suggestions, loading };
}
