/** Point d'entrée du paquet partagé (@alt/shared). */
export const APP_NAME = 'Alt.';

// Schémas zod et types dérivés
export { CATEGORIES, categorySchema, isCategory, type Category } from './schemas/category';
export { coordinatesSchema, type Coordinates } from './schemas/geo';

// Fonctions pures
export { distanceInMeters, formatDistance } from './geo/distance';

// Types de la base Supabase (générés par `pnpm db:types`, ne pas modifier à la main)
export type {
  CompositeTypes,
  Database,
  Enums,
  Json,
  Tables,
  TablesInsert,
  TablesUpdate,
} from './database.types';

// Contenu éditorial (content/actions.json, content/impact-factors.json)
export * from './content';

// Parcours pas à pas (T6.4)
export * from './journey';

// Impact des actions réalisées (T7.1)
export * from './impact';
export { parisCalendarDate, parisUtcOffsetHours, type CalendarDate } from './time/paris';
