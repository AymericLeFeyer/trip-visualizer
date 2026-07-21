/**
 * Types partagés entre le frontend et le backend.
 * Le voyage complet est stocké tel quel (document JSON) côté SQLite.
 */

export interface LatLng {
  lat: number;
  lng: number;
}

/** Lieu où l'on dort / base d'une étape. */
export interface Accommodation {
  name: string;
  address?: string;
  location?: LatLng;
  googleMapsUrl?: string;
  /** Date d'arrivée (YYYY-MM-DD). */
  checkInDate?: string;
  /** Date de départ (YYYY-MM-DD). */
  checkOutDate?: string;
  /** Heure d'arrivée / check-in (HH:MM). */
  arrivalTime?: string;
  /** Heure de départ / check-out (HH:MM). */
  departureTime?: string;
  /** Modalités : code d'accès, dépôt de bagages, caution, etc. */
  modalities?: string;
  notes?: string;
}

/** Catégorie de lieu à visiter (sert au style du marqueur). */
export type PlaceCategory =
  | 'sight'
  | 'food'
  | 'shopping'
  | 'nature'
  | 'culture'
  | 'nightlife'
  | 'other';

/** Point d'intérêt satellite, sans ordre précis, rattaché à une étape. */
export interface Place {
  id: string;
  name: string;
  category: PlaceCategory;
  address?: string;
  location?: LatLng;
  googleMapsUrl?: string;
  notes?: string;
  visited: boolean;
}

/** Étape = une base (là où l'on dort), les étapes sont ordonnées. */
export interface Stage {
  id: string;
  name: string;
  /** Couleur d'accent de l'étape (hex). */
  color: string;
  /** Emoji illustrant l'étape (affiché dans le marqueur, sinon le numéro). */
  emoji?: string;
  accommodation?: Accommodation;
  places: Place[];
  /** Transport vers l'étape suivante (jambe de trajet). */
  transportToNext?: Transport;
  notes?: string;
}

export type TransportMode = 'train' | 'shinkansen' | 'bus' | 'plane' | 'ferry' | 'car' | 'walk' | 'other';

/** Segment de transport (jambe entre deux étapes ou trajet libre). */
export interface Transport {
  id: string;
  mode: TransportMode;
  label: string;
  from?: string;
  to?: string;
  /** Date (YYYY-MM-DD). */
  date?: string;
  departureTime?: string;
  arrivalTime?: string;
  /** Distance du trajet en kilomètres. */
  distanceKm?: number;
  /** N° de train / de réservation / voie. */
  reference?: string;
  /** Prix à prévoir. */
  price?: number;
  /** Devise (¥, €, $…). */
  currency?: string;
  notes?: string;
}

/** Segment d'un vol (une correspondance = un segment supplémentaire). */
export interface FlightLeg {
  id: string;
  /** Numéro de vol (ex. AF276). */
  flightNumber?: string;
  from?: string;
  to?: string;
  departureTime?: string;
  arrivalTime?: string;
}

/**
 * Vol d'aller ou de retour, traité comme une étape « bout de voyage ».
 * `airport`/`airportLocation` = l'aéroport du pays visité affiché sur la carte
 * (arrivée pour l'aller, départ pour le retour).
 */
export interface Flight {
  airport?: string;
  airportLocation?: LatLng;
  /** Date (YYYY-MM-DD). */
  date?: string;
  /** Segments dans l'ordre (≥ 2 = avec correspondance(s)). */
  legs: FlightLeg[];
  price?: number;
  currency?: string;
  notes?: string;
}

export interface Trip {
  id: string;
  title: string;
  description?: string;
  /** Vol d'aller (avant la première étape). */
  outboundFlight?: Flight;
  stages: Stage[];
  /** Vol de retour (après la dernière étape). */
  returnFlight?: Flight;
  createdAt: string;
  updatedAt: string;
}

/** Vue résumée d'un voyage (liste sur la page d'accueil). */
export interface TripSummary {
  id: string;
  title: string;
  updatedAt: string;
  stageCount: number;
}

/** Payload accepté pour créer/mettre à jour un voyage. */
export type TripInput = Omit<Trip, 'id' | 'createdAt' | 'updatedAt'>;
