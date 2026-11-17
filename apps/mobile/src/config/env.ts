import Constants from 'expo-constants';
import { z } from 'zod';

/**
 * Configuration publique de l'app, lue via expo-constants (renseignée par app.config.ts).
 * Uniquement l'URL Supabase et la clé publique (anon) : aucun secret côté client.
 */
const publicEnvSchema = z.object({
  supabaseUrl: z.url({ message: 'EXPO_PUBLIC_SUPABASE_URL doit être une URL valide.' }),
  supabaseAnonKey: z.string().min(1, { message: 'EXPO_PUBLIC_SUPABASE_ANON_KEY est vide.' }),
});

export type PublicEnv = z.infer<typeof publicEnvSchema>;

export function parsePublicEnv(extra: unknown): PublicEnv {
  const result = publicEnvSchema.safeParse(extra ?? {});
  if (!result.success) {
    const details = result.error.issues.map((issue) => `- ${issue.message}`).join('\n');
    throw new Error(
      `Configuration manquante ou invalide (voir apps/mobile/.env.example) :\n${details}`,
    );
  }
  return result.data;
}

let cached: PublicEnv | undefined;

/** Renvoie la configuration publique (validée une seule fois). */
export function getPublicEnv(): PublicEnv {
  cached ??= parsePublicEnv(Constants.expoConfig?.extra);
  return cached;
}

/**
 * Mode démo (EXPO_PUBLIC_DEMO=1) : l'app fonctionne sans serveur, avec des données fictives
 * embarquées et une connexion simulée. Sert aux présentations (version web en ligne).
 */
export function isDemoMode(): boolean {
  return process.env.EXPO_PUBLIC_DEMO === '1' || Constants.expoConfig?.extra?.demoMode === true;
}

/**
 * Identifiants OAuth Google (publics par nature : ils identifient l'app auprès de Google,
 * ce ne sont pas des secrets). `undefined` tant que l'utilisateur ne les a pas créés.
 */
export function getGoogleClientIds(): { webClientId?: string; iosClientId?: string } {
  const extra = (Constants.expoConfig?.extra ?? {}) as Record<string, unknown>;
  const read = (key: string) =>
    typeof extra[key] === 'string' && extra[key] !== '' ? (extra[key] as string) : undefined;
  return { webClientId: read('googleWebClientId'), iosClientId: read('googleIosClientId') };
}
