#!/usr/bin/env node
/**
 * Démo web (mode démo, sans serveur) : `pnpm demo:build`.
 *
 * 1. copie le « worker » de la carte (maplibre-gl) dans public/maplibre ;
 * 2. exporte l'app pour le web avec EXPO_PUBLIC_DEMO=1 dans dist-demo/ ;
 * 3. ajoute le cadre de téléphone (grand écran) et les métadonnées françaises ;
 * 4. crée alt-demo-web.zip (à envoyer tel quel sur un hébergement, voir docs/DEMO.md).
 *
 * Sous-dossier d'un site (ex. https://exemple.fr/alt/) : DEMO_BASE_URL=/alt pnpm demo:build
 */
import { execFileSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const out = join(root, 'dist-demo');
const zipPath = join(root, 'alt-demo-web.zip');
const require = createRequire(import.meta.url);

// 1. Worker de la carte
const maplibreDist = join(dirname(require.resolve('maplibre-gl/package.json')), 'dist');
const publicMaplibre = join(root, 'public', 'maplibre');
mkdirSync(publicMaplibre, { recursive: true });
for (const file of ['maplibre-gl-worker.mjs', 'maplibre-gl-shared.mjs']) {
  copyFileSync(join(maplibreDist, file), join(publicMaplibre, file));
}

// 2. Export web
rmSync(out, { recursive: true, force: true });
execFileSync('npx', ['expo', 'export', '--platform', 'web', '--output-dir', out, '--clear'], {
  cwd: root,
  stdio: 'inherit',
  env: { ...process.env, EXPO_PUBLIC_DEMO: '1' },
});

// 3. Cadre de téléphone et métadonnées
const indexPath = join(out, 'index.html');
const frameCss = `
    <style id="alt-demo-frame">
      body { background: #FBE6C6; }
      @media (min-width: 700px) and (min-height: 560px) {
        body { display: flex; align-items: center; justify-content: center; gap: 48px; }
        #root {
          flex: 0 0 auto; width: 390px; height: min(844px, calc(100vh - 32px));
          border: 12px solid #101A4A; border-radius: 48px; overflow: hidden;
          box-shadow: 0 30px 60px -20px rgba(16, 26, 74, 0.45); background: #FFF3E0;
        }
      }
      #alt-demo-aside {
        display: none; max-width: 320px; color: #101A4A;
        font-family: system-ui, -apple-system, 'Segoe UI', sans-serif; line-height: 1.5;
      }
      @media (min-width: 1000px) and (min-height: 560px) {
        #alt-demo-aside { display: block; }
      }
      #alt-demo-aside h1 { font-family: Georgia, serif; font-size: 44px; margin: 0 0 12px; }
      #alt-demo-aside p { margin: 0 0 12px; font-size: 16px; }
      #alt-demo-aside small { color: #47507A; }
    </style>`;
const aside = `
    <aside id="alt-demo-aside" aria-label="À propos de cette démonstration">
      <h1>Alt.</h1>
      <p>Trouver près de chez soi des alternatives écologiques : vrac, réparation, réemploi, anti-gaspi, producteurs locaux.</p>
      <p>Ville pilote : Bordeaux.</p>
      <small>Version de démonstration : lieux et données fictifs, rien n’est envoyé.</small>
    </aside>`;
let html = readFileSync(indexPath, 'utf8')
  .replace('<html lang="en">', '<html lang="fr">')
  .replace(
    '<title>Alt.</title>',
    '<title>Alt. — démo</title>\n    <meta name="description" content="Démonstration de l’application Alt. (Bordeaux)" />\n    <meta name="theme-color" content="#FFF3E0" />',
  )
  .replace('</head>', `${frameCss}\n  </head>`)
  .replace('<body>', `<body>${aside}`);
writeFileSync(indexPath, html);

// 4. Archive
rmSync(zipPath, { force: true });
if (existsSync('/usr/bin/zip') || existsSync('/opt/homebrew/bin/zip')) {
  execFileSync('zip', ['-qr', zipPath, '.'], { cwd: out });
  console.log(`\nDémo prête : ${out}\nArchive : ${zipPath}`);
} else {
  console.log(`\nDémo prête : ${out} (zip indisponible : compressez ce dossier vous-même)`);
}
