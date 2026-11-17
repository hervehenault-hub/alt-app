/**
 * Squelette du script d'import (NON exécuté pour l'instant, ni en CI).
 * Usage prévu : `pnpm --filter @alt/import-osm fetch` → écrit out/places.json.
 * L'insertion en base (Supabase, côté serveur) sera branchée à la vague 3.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { convertOverpassResponse } from './convert.ts';
import { buildOverpassQuery, fetchOverpass } from './overpass.ts';

async function main(): Promise<void> {
  const query = buildOverpassQuery();
  const response = await fetchOverpass(query);
  const report = convertOverpassResponse(response);
  const outDir = new URL('../out/', import.meta.url);
  await mkdir(outDir, { recursive: true });
  await writeFile(new URL('places.json', outDir), `${JSON.stringify(report, null, 2)}\n`);
  console.log(`${report.places.length} lieux convertis, ${report.skipped.length} écartés.`);
  // TODO vague 3 : insérer report.places en base (upsert sur source + source_ref).
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
