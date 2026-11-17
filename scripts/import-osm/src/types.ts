import type { PlaceCategory } from '@alt/shared';

/** Élément renvoyé par l'API Overpass (`[out:json]`, `out center tags`). */
export type OverpassElement = {
  type: 'node' | 'way' | 'relation';
  id: number;
  /** Présents pour les nœuds. */
  lat?: number;
  lon?: number;
  /** Centre calculé par Overpass pour les ways et relations (`out center`). */
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
};

export type OverpassResponse = { elements: OverpassElement[] };

/** Créneau d'ouverture : jour 1 (lundi) à 7 (dimanche), heures « HH:MM » (fermeture jusqu'à 24:00). */
export type OpeningSlot = { weekday: 1 | 2 | 3 | 4 | 5 | 6 | 7; opens: string; closes: string };

export type PlaceAddress = {
  street: string | null;
  postcode: string | null;
  city: string | null;
  /** Adresse sur une ligne, ou null si aucune information. */
  formatted: string | null;
};

/** Lieu Alt. issu d'OpenStreetMap, prêt à être inséré (vague 3). */
export type OsmPlace = {
  name: string;
  /** Catégorie principale. */
  category: PlaceCategory;
  /** Toutes les catégories reconnues (la principale en premier). */
  categories: PlaceCategory[];
  latitude: number;
  longitude: number;
  address: PlaceAddress;
  website: string | null;
  phone: string | null;
  /** Valeur brute du tag `opening_hours`. */
  opening_hours_raw: string | null;
  /** Créneaux convertis ; null si le format n'est pas géré (ou absent). */
  opening_hours: OpeningSlot[] | null;
  source: 'osm';
  /** Référence OSM, ex. `node/123`. */
  source_ref: string;
  license: 'ODbL';
  attribution: string;
};

export type SkipReason = 'hors_categorie' | 'sans_coordonnees' | 'sans_nom' | 'doublon';
