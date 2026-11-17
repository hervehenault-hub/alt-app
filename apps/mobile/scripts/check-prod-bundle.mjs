// Vérifie qu'un bundle exporté (`expo export`) de PRODUCTION n'embarque pas le
// catalogue de développement (src/dev/CatalogueScreen.tsx, route /dev/catalogue).
// Usage : node scripts/check-prod-bundle.mjs [dossier d'export] (défaut : dist)
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';

const exportDir = resolve(process.argv[2] ?? 'dist');
// Marqueur présent uniquement dans le module du catalogue (CATALOGUE_MARKER).
const FORBIDDEN = 'alt-dev-catalogue-screen';
// Témoin : un identifiant de l'onglet Explorer, qui DOIT être présent (prouve que la recherche marche).
const EXPECTED = 'screen-explore';

function listBundles(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return listBundles(path);
    return /\.(hbc|js)$/.test(name) && path.includes(`${join('_expo', 'static', 'js')}`)
      ? [path]
      : [];
  });
}

const bundles = listBundles(exportDir);
if (bundles.length === 0) {
  console.error(`✖ Aucun bundle trouvé dans ${exportDir} (lancez d'abord « expo export »).`);
  process.exit(1);
}

let failed = false;
for (const bundle of bundles) {
  const content = readFileSync(bundle).toString('latin1');
  if (!content.includes(EXPECTED)) {
    console.error(`✖ ${bundle} : témoin « ${EXPECTED} » introuvable, vérification non fiable.`);
    failed = true;
  }
  if (content.includes(FORBIDDEN)) {
    console.error(`✖ ${bundle} : le catalogue de développement est embarqué en production.`);
    failed = true;
  }
}
if (failed) process.exit(1);
console.log(`✔ Catalogue de développement absent des ${bundles.length} bundle(s) de production.`);
