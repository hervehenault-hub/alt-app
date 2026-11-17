import type { ConfigContext, ExpoConfig } from 'expo/config';

/**
 * Complète app.json avec les variables d'environnement PUBLIQUES (fichier .env, voir .env.example).
 * Seules l'URL Supabase et la clé publique (anon) sont autorisées ici : tout ce qui est dans
 * `extra` est embarqué dans l'application et donc lisible par n'importe qui.
 */
export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: config.name ?? 'Alt.',
  slug: config.slug ?? 'alt',
  extra: {
    ...config.extra,
    supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
    supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
  },
});
