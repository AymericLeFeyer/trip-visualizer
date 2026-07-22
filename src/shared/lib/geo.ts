import type { LatLng } from '@shared/types/trip';

/** Distance à vol d'oiseau entre deux points (km), formule de Haversine. */
export function haversineKm(a: LatLng, b: LatLng): number {
  const R = 6371; // rayon terrestre moyen en km
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** Formate une distance en km de façon lisible : « 850 m », « 2,3 km », « 14 km ». */
export function formatDistanceKm(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  if (km < 10) return `${km.toFixed(1).replace('.', ',')} km`;
  return `${Math.round(km)} km`;
}

/**
 * Libellé de distance à vol d'oiseau entre deux points (ex. distance d'un lieu
 * au point de l'étape). Renvoie `null` si l'un des deux points manque.
 */
export function distanceLabel(origin?: LatLng | null, target?: LatLng | null): string | null {
  if (!origin || !target) return null;
  return formatDistanceKm(haversineKm(origin, target));
}
