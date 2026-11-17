# Architecture d'Alt.

## Vue d'ensemble

```
┌───────────────────────┐        ┌──────────────────────────────────────────┐
│ apps/mobile (Expo)    │  HTTPS │ Supabase (région UE)                     │
│  Expo Router, RN      │ ─────► │  Postgres + PostGIS, Auth, Storage,      │
│  clé publique (anon)  │        │  Edge Functions, pg_cron, RLS partout    │
└──────────┬────────────┘        └──────────────────────────────────────────┘
           │ importe                          ▲
┌──────────▼────────────┐                     │ types générés (pnpm db:types)
│ packages/shared       │ ◄───────────────────┘
│  zod, types, logique  │
└──────────▲────────────┘
           │ importe (plus tard)
┌──────────┴────────────┐
│ apps/admin (Vite)     │  back-office — réservé
└───────────────────────┘
```

Le client ne détient **jamais** de secret : toute la sécurité des données repose sur les politiques
RLS de Postgres. Les opérations privilégiées iront dans des Edge Functions (côté serveur).

## Arborescence

```
.
├── .github/workflows/ci.yml   # CI : install, lint, typecheck, tests, anti-secret, bundle, Supabase + pgTAP
├── apps/
│   ├── admin/                 # back-office web (réservé, README seulement)
│   └── mobile/                # app Expo « Alt. »
│       ├── app.json           # nom, schéma alt://, identifiant app.alt.mobile (provisoire)
│       ├── app.config.ts      # ajoute les variables publiques (.env) dans `extra`
│       ├── .env.example       # modèle des variables d'environnement
│       ├── jest.config.js     # preset jest-expo
│       └── src/
│           ├── app/           # écrans (Expo Router : un fichier = une route)
│           ├── config/env.ts  # lecture + validation des variables via expo-constants
│           ├── i18n/          # t() typée + fr/<fonctionnalité>.ts
│           ├── lib/           # code applicatif sans UI
│           └── __tests__/     # tests Jest / RNTL
├── packages/
│   └── shared/                # @alt/shared
│       └── src/
│           ├── schemas/       # schémas zod (+ types inférés)
│           ├── geo/           # fonctions pures (distance, formatage…)
│           ├── database.types.ts  # GÉNÉRÉ par `pnpm db:types`
│           └── index.ts
├── supabase/
│   ├── config.toml            # config locale de la CLI
│   ├── migrations/            # migrations horodatées (`supabase migration new`)
│   └── tests/                 # tests pgTAP (*.test.sql)
├── scripts/                   # garde-fous (anti-secret, règle i18n)
├── eslint.config.mjs          # ESLint partagé (flat config)
├── tsconfig.base.json         # options TS strictes partagées
└── .prettierrc.json
```

Chemins gérés par d'autres sessions : `content/` (actions, facteurs d'impact), `content/legal/`,
`docs/rgpd/`, `docs/beta/`.

## Choix techniques

| Sujet            | Choix                                                                                               |
| ---------------- | --------------------------------------------------------------------------------------------------- |
| Gestion du dépôt | pnpm workspaces, `node-linker=hoisted` (le plus fiable avec Metro/Expo)                             |
| TypeScript       | 6.0 (version supportée par Expo SDK 58 et typescript-eslint), `strict` + `noUncheckedIndexedAccess` |
| Lint / format    | ESLint 9 (flat config, `eslint-config-expo` pour l'app) + Prettier                                  |
| Navigation       | Expo Router, routes typées (`experiments.typedRoutes`)                                              |
| Traductions      | maison, sans dépendance : objets `as const` par fonctionnalité, clés typées, `{{param}}`            |
| Configuration    | `.env` → `app.config.ts` (`extra`) → `expo-constants` → validation zod (`src/config/env.ts`)        |
| Base de données  | migrations SQL versionnées, PostGIS dans le schéma `extensions`, tests pgTAP via `supabase test db` |
| Tests du paquet  | Jest + `@swc/jest` (rapide, sans Babel)                                                             |

## Garde-fous automatiques

- **Texte en dur** : `react/jsx-no-literals` + `no-restricted-syntax` sur les props textuelles
  (`accessibilityLabel`, `placeholder`, `title`…) dans `apps/mobile/src/**/*.tsx` ;
  `scripts/check-i18n-lint-rule.mjs` vérifie que la règle reste active.
- **Secrets** : `scripts/check-no-service-role.mjs` refuse `service_role`, sa forme encodée JWT
  et les clés `sb_secret_…` partout dans `apps/`.
- **Types de base à jour** : la CI régénère les types Supabase et échoue s'ils diffèrent du dépôt.

## Ce qui n'est pas encore en place

- Builds EAS (T0.9) : nécessite le compte Expo du propriétaire.
- Client Supabase dans l'app, authentification, premières tables (avec RLS et tests RLS).
- Back-office `apps/admin`, tests de bout en bout Maestro.
