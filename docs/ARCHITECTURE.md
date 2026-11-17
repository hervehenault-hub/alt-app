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
│   ├── seed.sql               # données de test locales (Testville, 40 lieux, 5 comptes)
│   └── tests/                 # tests pgTAP (*.test.sql) ; _lib/helpers.psql = outils communs
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

## Base de données (lot 2)

Toutes les tables sont dans le schéma `public`, avec la RLS activée. Extensions : PostGIS, `pg_trgm`,
`unaccent` (schéma `extensions`) et `pg_cron`. Recherche française sans accents : configuration
`public.fr_unaccent` et fonctions `immutable_unaccent()` / `normalize_search_text()`.

| Domaine       | Tables                                                                                                                                                            |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Référentiels  | `cities`, `domains`, `categories`, `needs` + `need_categories` (recherche : `search_needs(q)`)                                                                    |
| Lieux         | `places`, `opening_hours` (fonction `is_open_now(place_id, at)`, heure locale), `place_owners`                                                                    |
| Profils       | `profiles` (créé à l'inscription ; rôle `user` / `merchant` / `admin` modifiable seulement par un admin)                                                          |
| Contributions | `place_submissions`, `place_reports` (marque le lieu « à revérifier »), `place_confirmations` (3 confirmations → `multi_confirmed`)                               |
| Impact        | `impact_factors`, `equivalences` (format de `content/impact-factors.json`, source https obligatoire)                                                              |
| Parcours      | `actions` (format de `content/actions.json`), `user_actions`, `user_journeys`                                                                                     |
| Entraide      | `neighborhoods`, `community_rules_versions`, `community_rules_acceptances`, `help_posts`, `conversations`, `messages`, `user_blocks`, `content_reports`, `thanks` |
| Mesure        | `analytics_events` (écriture seule)                                                                                                                               |

Fonctions d'aide aux politiques (`SECURITY DEFINER`, sans boucle de RLS) : `is_admin()`,
`current_user_role()`, `is_place_owner(place_id)`, `has_accepted_community_rules()`, `is_blocked_with(other)`.

Règles notables :

- un anonyme ne lit que les lieux **publiés** (et leurs horaires) ; un commerçant lit et met à jour les
  lieux auxquels un admin l'a lié, sans pouvoir toucher aux champs de modération (`published`,
  `source`, `license`…) ; sa mise à jour passe le lieu en `merchant_confirmed` ;
- l'historique du parcours (`user_actions`, `user_journeys`) et les conversations privées ne sont
  lisibles que par leurs propriétaires — **pas même par un admin** ;
- entraide : aucune adresse exacte (quartier seulement), règles en vigueur acceptées pour publier ou
  écrire, blocage dans les deux sens, annonces de 30 jours maximum, annonces expirées ou masquées non
  listées ;
- `analytics_events` : insertion par tous, aucune lecture client ; événements ignorés si
  `analytics_opt_out`.

### Matrice RLS

Vérifiée case par case par `supabase/tests/rls_matrix.test.sql` (✅ autorisé, ❌ refusé). Le test
échoue aussi si une table publique n'a pas la RLS ou n'est pas couverte par la matrice.
« Utilisateur » = compte `user` propriétaire des données testées (proposition, parcours, annonce…) ;
« Commerçant » = compte `merchant` lié au lieu publié testé, étranger aux autres données.

| Table                         | Opération testée                                   | Anonyme | Utilisateur | Commerçant | Admin |
| ----------------------------- | -------------------------------------------------- | :-----: | :---------: | :--------: | :---: |
| `cities`                      | lecture — lire                                     |   ✅    |     ✅      |     ✅     |  ✅   |
| `cities`                      | écriture — créer                                   |   ❌    |     ❌      |     ❌     |  ✅   |
| `domains`                     | lecture — lire                                     |   ✅    |     ✅      |     ✅     |  ✅   |
| `domains`                     | écriture — modifier                                |   ❌    |     ❌      |     ❌     |  ✅   |
| `categories`                  | lecture — lire                                     |   ✅    |     ✅      |     ✅     |  ✅   |
| `categories`                  | écriture — créer                                   |   ❌    |     ❌      |     ❌     |  ✅   |
| `needs`                       | lecture — lire                                     |   ✅    |     ✅      |     ✅     |  ✅   |
| `needs`                       | lecture — rechercher (search_needs)                |   ✅    |     ✅      |     ✅     |  ✅   |
| `needs`                       | écriture — créer                                   |   ❌    |     ❌      |     ❌     |  ✅   |
| `need_categories`             | lecture — lire                                     |   ✅    |     ✅      |     ✅     |  ✅   |
| `need_categories`             | écriture — supprimer                               |   ❌    |     ❌      |     ❌     |  ✅   |
| `places`                      | lecture — lire un lieu publié                      |   ✅    |     ✅      |     ✅     |  ✅   |
| `places`                      | lecture — lire un lieu non publié                  |   ❌    |     ❌      |     ❌     |  ✅   |
| `places`                      | écriture — créer                                   |   ❌    |     ❌      |     ❌     |  ✅   |
| `places`                      | écriture — modifier le lieu du commerçant          |   ❌    |     ❌      |     ✅     |  ✅   |
| `places`                      | écriture — modifier un autre lieu                  |   ❌    |     ❌      |     ❌     |  ✅   |
| `places`                      | écriture — supprimer                               |   ❌    |     ❌      |     ❌     |  ✅   |
| `opening_hours`               | lecture — lire (lieu publié)                       |   ✅    |     ✅      |     ✅     |  ✅   |
| `opening_hours`               | lecture — lire (lieu non publié)                   |   ❌    |     ❌      |     ❌     |  ✅   |
| `opening_hours`               | écriture — ajouter (lieu du commerçant)            |   ❌    |     ❌      |     ✅     |  ✅   |
| `opening_hours`               | écriture — ajouter (autre lieu)                    |   ❌    |     ❌      |     ❌     |  ✅   |
| `place_owners`                | lecture — lire le lien du commerçant               |   ❌    |     ❌      |     ✅     |  ✅   |
| `place_owners`                | écriture — créer un lien                           |   ❌    |     ❌      |     ❌     |  ✅   |
| `place_owners`                | écriture — supprimer un lien                       |   ❌    |     ❌      |     ❌     |  ✅   |
| `profiles`                    | lecture — lire le profil de l'utilisateur          |   ❌    |     ✅      |     ❌     |  ✅   |
| `profiles`                    | écriture — modifier le profil de l'utilisateur     |   ❌    |     ✅      |     ❌     |  ✅   |
| `profiles`                    | écriture — changer le rôle de l'utilisateur        |   ❌    |     ❌      |     ❌     |  ✅   |
| `place_submissions`           | lecture — lire la proposition de l'utilisateur     |   ❌    |     ✅      |     ❌     |  ✅   |
| `place_submissions`           | écriture — proposer                                |   ❌    |     ✅      |     ✅     |  ✅   |
| `place_submissions`           | écriture — modérer                                 |   ❌    |     ❌      |     ❌     |  ✅   |
| `place_reports`               | lecture — lire le signalement de l'utilisateur     |   ❌    |     ✅      |     ❌     |  ✅   |
| `place_reports`               | écriture — signaler                                |   ❌    |     ✅      |     ✅     |  ✅   |
| `place_reports`               | écriture — traiter                                 |   ❌    |     ❌      |     ❌     |  ✅   |
| `place_confirmations`         | lecture — lire la confirmation de l'utilisateur    |   ❌    |     ✅      |     ❌     |  ✅   |
| `place_confirmations`         | écriture — confirmer un lieu publié                |   ❌    |     ✅      |     ✅     |  ✅   |
| `impact_factors`              | lecture — lire                                     |   ✅    |     ✅      |     ✅     |  ✅   |
| `impact_factors`              | écriture — modifier                                |   ❌    |     ❌      |     ❌     |  ✅   |
| `equivalences`                | lecture — lire                                     |   ✅    |     ✅      |     ✅     |  ✅   |
| `equivalences`                | écriture — modifier                                |   ❌    |     ❌      |     ❌     |  ✅   |
| `actions`                     | lecture — lire                                     |   ✅    |     ✅      |     ✅     |  ✅   |
| `actions`                     | écriture — modifier                                |   ❌    |     ❌      |     ❌     |  ✅   |
| `user_actions`                | lecture — lire l'historique de l'utilisateur       |   ❌    |     ✅      |     ❌     |  ❌   |
| `user_actions`                | écriture — enregistrer une action pour soi         |   ❌    |     ✅      |     ✅     |  ✅   |
| `user_journeys`               | lecture — lire le parcours de l'utilisateur        |   ❌    |     ✅      |     ❌     |  ❌   |
| `user_journeys`               | écriture — modifier le parcours de l'utilisateur   |   ❌    |     ✅      |     ❌     |  ❌   |
| `neighborhoods`               | lecture — lire                                     |   ✅    |     ✅      |     ✅     |  ✅   |
| `neighborhoods`               | écriture — créer                                   |   ❌    |     ❌      |     ❌     |  ✅   |
| `community_rules_versions`    | lecture — lire                                     |   ✅    |     ✅      |     ✅     |  ✅   |
| `community_rules_versions`    | écriture — publier une version                     |   ❌    |     ❌      |     ❌     |  ✅   |
| `community_rules_acceptances` | lecture — lire l'acceptation de l'utilisateur      |   ❌    |     ✅      |     ❌     |  ❌   |
| `community_rules_acceptances` | écriture — accepter pour soi                       |   ❌    |     ✅      |     ✅     |  ✅   |
| `help_posts`                  | lecture — lister une annonce ouverte               |   ❌    |     ✅      |     ✅     |  ✅   |
| `help_posts`                  | lecture — lister une annonce masquée               |   ❌    |     ❌      |     ❌     |  ✅   |
| `help_posts`                  | écriture — publier                                 |   ❌    |     ✅      |     ✅     |  ✅   |
| `help_posts`                  | écriture — modifier l'annonce de l'utilisateur     |   ❌    |     ✅      |     ❌     |  ✅   |
| `conversations`               | lecture — lire la conversation utilisateur ↔ autre |   ❌    |     ✅      |     ❌     |  ❌   |
| `conversations`               | écriture — répondre à l'annonce de l'utilisateur   |   ❌    |     ❌      |     ✅     |  ✅   |
| `messages`                    | lecture — lire les messages de la conversation     |   ❌    |     ✅      |     ❌     |  ❌   |
| `messages`                    | écriture — écrire dans la conversation             |   ❌    |     ✅      |     ❌     |  ❌   |
| `user_blocks`                 | lecture — lire le blocage de l'utilisateur         |   ❌    |     ✅      |     ❌     |  ❌   |
| `user_blocks`                 | écriture — bloquer quelqu'un                       |   ❌    |     ✅      |     ✅     |  ✅   |
| `content_reports`             | lecture — lire le signalement de l'utilisateur     |   ❌    |     ✅      |     ❌     |  ✅   |
| `content_reports`             | écriture — signaler un contenu                     |   ❌    |     ✅      |     ✅     |  ✅   |
| `content_reports`             | écriture — traiter un signalement                  |   ❌    |     ❌      |     ❌     |  ✅   |
| `thanks`                      | lecture — lire un merci reçu par l'utilisateur     |   ❌    |     ✅      |     ❌     |  ❌   |
| `thanks`                      | écriture — remercier après un échange              |   ❌    |     ✅      |     ❌     |  ❌   |
| `analytics_events`            | lecture — lire                                     |   ❌    |     ❌      |     ❌     |  ❌   |
| `analytics_events`            | écriture — envoyer un événement                    |   ✅    |     ✅      |     ✅     |  ✅   |

## Garde-fous automatiques

- **Texte en dur** : `react/jsx-no-literals` + `no-restricted-syntax` sur les props textuelles
  (`accessibilityLabel`, `placeholder`, `title`…) dans `apps/mobile/src/**/*.tsx` ;
  `scripts/check-i18n-lint-rule.mjs` vérifie que la règle reste active.
- **Secrets** : `scripts/check-no-service-role.mjs` refuse `service_role`, sa forme encodée JWT
  et les clés `sb_secret_…` partout dans `apps/`.
- **Types de base à jour** : la CI régénère les types Supabase et échoue s'ils diffèrent du dépôt.

## Ce qui n'est pas encore en place

- Builds EAS (T0.9) : nécessite le compte Expo du propriétaire.
- Client Supabase dans l'app, authentification (le schéma de base et sa RLS sont en place).
- Import du contenu `content/*.json` (actions, facteurs) dans les tables correspondantes.
- Back-office `apps/admin`, tests de bout en bout Maestro.
