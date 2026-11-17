import { z } from 'zod';

/** Familles d'alternatives écologiques proposées par Alt. */
export const CATEGORIES = [
  'vrac',
  'reparation',
  'reemploi',
  'anti_gaspi',
  'producteur_local',
] as const;

export const categorySchema = z.enum(CATEGORIES);

export type Category = z.infer<typeof categorySchema>;

export function isCategory(value: unknown): value is Category {
  return categorySchema.safeParse(value).success;
}
