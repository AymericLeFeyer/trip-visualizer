/**
 * Formate une date ISO (`YYYY-MM-DD`, telle que saisie via `<input type="date">`)
 * au format long français : « lundi 16 janvier 2026 ».
 * Renvoie la valeur brute si elle n'est pas parsable, `''` si absente.
 */
export function formatLongDate(iso?: string): string {
  if (!iso) return '';
  // On force midi UTC pour éviter tout décalage de fuseau qui reculerait d'un jour.
  const date = new Date(`${iso}T12:00:00Z`);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date);
}

/**
 * Formate une date ISO au format court français : « lun. 16 janv. ».
 * Renvoie la valeur brute si non parsable, `''` si absente.
 */
export function formatShortDate(iso?: string): string {
  if (!iso) return '';
  const date = new Date(`${iso}T12:00:00Z`);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat('fr-FR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  }).format(date);
}

/**
 * Libellé compact d'un créneau prévu : « lun. 16 janv. · 14:30 », « 14:30 »
 * ou « lun. 16 janv. » selon les champs renseignés. `null` si rien.
 */
export function formatPlanned(date?: string, time?: string): string | null {
  const parts = [formatShortDate(date), time].filter(Boolean);
  return parts.length ? parts.join(' · ') : null;
}

/**
 * Nombre de nuits entre deux dates ISO (`checkIn` → `checkOut`).
 * Renvoie `null` si une date manque, est invalide, ou si l'écart est négatif.
 */
export function nightsBetween(checkIn?: string, checkOut?: string): number | null {
  if (!checkIn || !checkOut) return null;
  const start = new Date(`${checkIn}T12:00:00Z`).getTime();
  const end = new Date(`${checkOut}T12:00:00Z`).getTime();
  if (Number.isNaN(start) || Number.isNaN(end)) return null;
  const nights = Math.round((end - start) / 86_400_000);
  return nights >= 0 ? nights : null;
}

/** Libellé « 1 nuit » / « 3 nuits » à partir d'un nombre de nuits, `null` sinon. */
export function nightsLabel(checkIn?: string, checkOut?: string): string | null {
  const nights = nightsBetween(checkIn, checkOut);
  if (nights == null) return null;
  return `${nights} ${nights <= 1 ? 'nuit' : 'nuits'}`;
}
