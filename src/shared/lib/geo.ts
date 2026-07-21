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
