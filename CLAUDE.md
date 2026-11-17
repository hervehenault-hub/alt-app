# CLAUDE.md — règles du dépôt Alt.

Alt. est une application mobile (français uniquement) qui aide les 25-35 ans à trouver près de chez eux
des alternatives écologiques : vrac, réparation, réemploi, anti-gaspi, producteurs locaux.
Ville pilote : Bordeaux. Architecture détaillée : [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

## Stack

- Monorepo **pnpm** (`node-linker=hoisted`), **TypeScript strict** partout, Node 22.
- `apps/mobile` : **Expo SDK 58** (React Native 0.88, React 19.3) + **Expo Router** (`src/app/`).
- `apps/admin` : back-office web **Vite + React** — dossier réservé, pas encore initialisé.
- `packages/shared` (`@alt/shared`) : schémas **zod**, types (dont types Supabase générés), fonctions pures.
- `supabase/` : **Supabase** (Postgres + PostGIS, Auth, Storage, Edge Functions, pg_cron), région UE.
- Tests : **Jest** + **React Native Testing Library** ; **pgTAP** pour la base ; Maestro plus tard (E2E).
- CI : **GitHub Actions** (`.github/workflows/ci.yml`).

## Commandes (depuis la racine)

| Commande             | Rôle                                                                         |
| -------------------- | ---------------------------------------------------------------------------- |
| `pnpm install`       | installe tout le monorepo                                                    |
| `pnpm lint`          | ESLint (+ vérifie que la règle anti-texte en dur est active)                 |
| `pnpm format`        | Prettier (`format:check` en CI)                                              |
| `pnpm typecheck`     | `tsc --noEmit` dans chaque paquet                                            |
| `pnpm test`          | tests Jest de tous les paquets                                               |
| `pnpm check:secrets` | échoue si `service_role` (ou une clé secrète Supabase) apparaît dans `apps/` |
| `pnpm db:start`      | démarre Supabase en local (Docker requis) ; `db:stop` pour l'arrêter         |
| `pnpm db:reset`      | recrée la base locale en rejouant toutes les migrations                      |
| `pnpm test:db`       | tests pgTAP de `supabase/tests/`                                             |
| `pnpm db:types`      | régénère `packages/shared/src/database.types.ts` (base locale démarrée)      |

App mobile : `cd apps/mobile && pnpm start` ; bundle de vérification : `pnpm export`.

## Règles de travail (sessions parallèles)

1. **Une branche par tâche** (`feat/<lot>-<sujet>`, `fix/…`), une PR par branche, jamais de commit direct sur `main`.
2. **Migrations** : toujours créées avec `pnpm exec supabase migration new <nom>` (fichier horodaté).
   Ne jamais modifier une migration déjà fusionnée dans `main` : en créer une nouvelle.
3. **Avant chaque PR** : `git fetch && git rebase origin/main`, puis `pnpm db:reset` et `pnpm test:db`
   (en plus de lint / typecheck / test). Après une migration : `pnpm db:types` et commiter les types.
4. **Chaînes de l'interface** : un fichier par fonctionnalité dans `apps/mobile/src/i18n/fr/<fonctionnalité>.ts`,
   déclaré dans `i18n/fr/index.ts`. On **ajoute** des clés, on ne réécrit pas celles des autres.
   Dans le JSX, tout texte passe par `t('fonctionnalité.cle')` (règle ESLint bloquante).
5. **Tâche bloquée par une autre session** : s'arrêter, ne pas contourner, et le signaler clairement
   dans la description de sa PR (quoi, par quelle tâche/session).
6. Respecter les chemins réservés aux autres sessions (ex. `content/`, `docs/rgpd/`, `docs/beta/`)
   sauf si la tâche le demande explicitement.
7. Aucun compte externe créé, aucun secret commité. Côté client : uniquement l'URL Supabase et la clé
   publique (anon), via `apps/mobile/.env` (modèle : `apps/mobile/.env.example`) lu par `expo-constants`.

## Définition de « terminé »

- `pnpm lint`, `pnpm typecheck`, `pnpm test` passent — et `pnpm test:db` si la base est touchée.
- Les règles métier sont couvertes par des tests (de préférence fonctions pures dans `@alt/shared`).
- Toute table a des **politiques RLS** et des **tests RLS** pgTAP (accès autorisé ET refusé).
- Écrans : libellés d'accessibilité (`accessibilityRole`, `accessibilityLabel`/`Hint`),
  cibles tactiles **≥ 44 pt**, **aucun texte en dur**.
- Aucun secret dans le code ; `apps/mobile/.env.example` à jour si une variable change.
- La CI est verte sur la PR.

## Conventions

- Code (identifiants) en anglais ; commentaires, documentation, messages de commit et textes en français.
- Commits : `type(tâche): résumé` (ex. `feat(T1.2): …`, `fix: …`, `ci: …`), un commit par tâche.
- Imports dans l'app : alias `@/` → `apps/mobile/src/` ; code partagé via `@alt/shared`.
- Logique métier pure et testable dans `packages/shared` ; composants sans logique cachée.
- Ne pas modifier `packages/shared/src/database.types.ts` à la main (généré).
