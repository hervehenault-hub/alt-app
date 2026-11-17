import { z } from 'zod';

/** Coordonnées WGS 84 (celles du GPS du téléphone et de PostGIS en SRID 4326). */
export const coordinatesSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});

export type Coordinates = z.infer<typeof coordinatesSchema>;
