# supabase/

Configuration Supabase locale (CLI), migrations, tests pgTAP et (plus tard) Edge Functions.

- `config.toml` : configuration locale (ports, auth, storage…).
- `migrations/` : migrations SQL horodatées, créées **uniquement** avec `pnpm exec supabase migration new <nom>`.
- `tests/` : tests pgTAP (`*.test.sql`), lancés par `pnpm test:db`.

Commandes (depuis la racine, Docker requis) :

| Commande        | Effet                                                   |
| --------------- | ------------------------------------------------------- |
| `pnpm db:start` | démarre la pile Supabase locale                         |
| `pnpm db:stop`  | l'arrête                                                |
| `pnpm db:reset` | recrée la base locale en rejouant toutes les migrations |
| `pnpm test:db`  | lance les tests pgTAP de `supabase/tests/`              |
