// Échoue si une clé ou une mention « service_role » (clé secrète Supabase) apparaît dans apps/.
// Tout le code de apps/ finit chez l'utilisateur (app mobile, back-office web) : aucun secret ne doit y être.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const TARGET = join(ROOT, 'apps');
const SKIPPED_DIRS = new Set([
  'node_modules',
  '.expo',
  'dist',
  'web-build',
  'ios',
  'android',
  'coverage',
]);

// Motifs interdits : le mot-clé, sa forme encodée dans un JWT (base64 de "service_role"),
// les nouvelles clés secrètes Supabase et la variable d'environnement habituelle.
const PATTERNS = [
  { regex: /service[_-]?role/i, label: 'mention « service_role »' },
  { regex: /c2VydmljZV9yb2xl/, label: 'JWT avec le rôle service_role' },
  { regex: /sb_secret_/, label: 'clé secrète Supabase (sb_secret_…)' },
];

function* walk(dir) {
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    const stats = statSync(path);
    if (stats.isDirectory()) {
      if (!SKIPPED_DIRS.has(entry)) yield* walk(path);
    } else if (stats.isFile() && stats.size < 2_000_000) {
      yield path;
    }
  }
}

const findings = [];
for (const file of walk(TARGET)) {
  const lines = readFileSync(file, 'utf8').split('\n');
  lines.forEach((line, index) => {
    for (const { regex, label } of PATTERNS) {
      if (regex.test(line)) findings.push(`${relative(ROOT, file)}:${index + 1} — ${label}`);
    }
  });
}

if (findings.length > 0) {
  console.error('✖ Secret Supabase interdit dans apps/ :');
  for (const finding of findings) console.error(`  ${finding}`);
  process.exit(1);
}
console.log('✔ Aucun secret service_role dans apps/.');
