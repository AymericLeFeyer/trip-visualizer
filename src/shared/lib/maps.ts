/**
 * URL de recherche Google Maps à partir d'une adresse/nom (ou de coordonnées).
 * Ouvre directement le lieu dans Google Maps, sans clé API.
 */
export function mapsSearchUrl(query: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}
