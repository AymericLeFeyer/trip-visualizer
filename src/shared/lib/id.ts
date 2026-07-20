import { nanoid } from 'nanoid';

/** Génère un identifiant court pour les entités locales (étapes, lieux…). */
export function newId(): string {
  return nanoid(8);
}
