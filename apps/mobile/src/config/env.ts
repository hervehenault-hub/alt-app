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
