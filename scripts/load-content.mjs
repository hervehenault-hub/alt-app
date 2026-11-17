#!/usr/bin/env node
/**
 * T6.3 — Charge le contenu éditorial (content/actions.json, content/impact-factors.json) dans la base.
 * Rejouable sans doublon : chaque ligne est insérée ou mise à jour (« upsert ») par son identifiant.
 *
 *   pnpm content:sql                    # affiche le SQL
 *   pnpm content:load                   # l'applique à la base locale (pnpm db:start)
 *   DATABASE_URL=postgres://… pnpm content:load   # autre base (jamais de secret dans le dépôt)
 */
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (file) => JSON.parse(readFileSync(join(root, 'content', file), 'utf8'));

/** Littéral SQL sûr (texte entre apostrophes doublées, NULL, nombre). */
export function literal(value) {
  if (value === null || value === undefined) return 'null';
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) throw new Error(`Nombre invalide : ${value}`);
    return String(value);
  }
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  return `'${String(value).replaceAll("'", "''")}'`;
}

function upsert(table, columns, rows, casts = {}) {
  if (rows.length === 0) return '';
  const values = rows
    .map((row) => `  (${columns.map((c) => literal(row[c]) + (casts[c] ?? '')).join(', ')})`)
    .join(',\n');
  const updates = columns
    .filter((c) => c !== 'id')
    .map((c) => `${c} = excluded.${c}`)
    .join(', ');
  return `insert into public.${table} (${columns.join(', ')}) values\n${values}\non conflict (id) do update set ${updates};\n`;
}

export function contentSql() {
  const factorsFile = read('impact-factors.json');
  const actionsFile = read('actions.json');
  const factorColumns = [
    'id',
    'label',
    'value',
    'unit',
    'source_name',
    'source_url',
    'upstream_source_url',
    'method',
    'uncertainty',
    'version',
    'retrieved_at',
    'status',
  ];
  const factorCasts = { retrieved_at: '::date', status: '::public.impact_factor_status' };
  const actionColumns = [
    'id',
    'domain',
    'title',
    'body',
    'effort',
    'kind',
    'saving_eur_per_occurrence',
    'saving_basis',
    'impact_factor_id',
    'linked_category',
  ];
  const actionCasts = { effort: '::public.action_effort', kind: '::public.action_kind' };
  return [
    '-- Généré par scripts/load-content.mjs : ne pas modifier à la main.',
    'begin;',
    upsert('impact_factors', factorColumns, factorsFile.factors, factorCasts),
    upsert('equivalences', factorColumns, factorsFile.equivalences, factorCasts),
    upsert('actions', actionColumns, actionsFile.actions, actionCasts),
    'commit;',
    '',
  ].join('\n');
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
  const sql = contentSql();
  if (process.argv.includes('--apply')) {
    const url =
      process.env.DATABASE_URL ?? 'postgresql://postgres:postgres@127.0.0.1:54322/postgres';
    execFileSync('psql', [url, '-v', 'ON_ERROR_STOP=1', '-q', '-f', '-'], {
      input: sql,
      stdio: ['pipe', 'inherit', 'inherit'],
    });
    console.log('Contenu chargé (actions, facteurs, équivalences).');
  } else {
    process.stdout.write(sql);
  }
}
