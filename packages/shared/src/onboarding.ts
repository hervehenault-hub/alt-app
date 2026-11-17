/**
 * Onboarding (T3.5) : réponses gardées localement, puis copiées dans le profil à la connexion.
 * Fonctions pures : aucune dépendance à React Native ni à Supabase.
 */
import { z } from 'zod';

import { DOMAINS } from './content/schemas';
import type { MainConstraint } from './journey';

export const MAIN_CONSTRAINTS = [
  'budget',
  'temps',
  'mobilite',
] as const satisfies readonly MainConstraint[];

/** Ville pilote présélectionnée. */
export const PILOT_CITY_SLUG = 'bordeaux';

export const onboardingAnswersSchema = z.object({
  /** Slug de la ville choisie ; `null` si « ma ville n'est pas couverte ». */
  citySlug: z.string().nullable().default(PILOT_CITY_SLUG),
  /** L'utilisateur a indiqué que sa ville n'est pas couverte. */
  cityNotCovered: z.boolean().default(false),
  interests: z.array(z.enum(DOMAINS)).default([]),
  mainConstraint: z.enum(MAIN_CONSTRAINTS).nullable().default(null),
});

export type OnboardingAnswers = z.infer<typeof onboardingAnswersSchema>;

export const onboardingStateSchema = z.object({
  /** `completed` : les 3 questions ont été vues ; `skipped` : « Passer ». */
  status: z.enum(['pending', 'completed', 'skipped']).default('pending'),
  answers: onboardingAnswersSchema.default(onboardingAnswersSchema.parse({})),
  /** Réponses déjà copiées dans le profil de ce compte. */
  syncedUserId: z.string().nullable().default(null),
});

export type OnboardingState = z.infer<typeof onboardingStateSchema>;

export const INITIAL_ONBOARDING_STATE: OnboardingState = onboardingStateSchema.parse({});

/** Lit un état stocké (JSON) en tolérant les données absentes ou corrompues. */
export function parseOnboardingState(raw: string | null | undefined): OnboardingState {
  if (!raw) return INITIAL_ONBOARDING_STATE;
  try {
    const result = onboardingStateSchema.safeParse(JSON.parse(raw));
    return result.success ? result.data : INITIAL_ONBOARDING_STATE;
  } catch {
    return INITIAL_ONBOARDING_STATE;
  }
}

/** L'onboarding est derrière l'utilisateur (fini ou sauté) : on ne le montre plus. */
export function isOnboardingDone(state: OnboardingState): boolean {
  return state.status !== 'pending';
}

/** Ajoute ou retire un domaine d'intérêt (ordre canonique conservé). */
export function toggleInterest(
  interests: readonly (typeof DOMAINS)[number][],
  domain: (typeof DOMAINS)[number],
): (typeof DOMAINS)[number][] {
  const set = new Set(interests);
  if (set.has(domain)) set.delete(domain);
  else set.add(domain);
  return DOMAINS.filter((d) => set.has(d));
}

/** Champs du profil (table `profiles`) à mettre à jour avec les réponses. */
export interface ProfilePatch {
  interests?: (typeof DOMAINS)[number][];
  main_constraint?: MainConstraint;
  city_id?: string | null;
}

/**
 * Calcule la mise à jour du profil. On n'écrase jamais une valeur du profil par une
 * réponse vide : seules les réponses données sont copiées.
 * @param cityIdBySlug identifiant de la ville en base (résolu par l'appelant), ou `undefined`.
 */
export function onboardingToProfilePatch(
  answers: OnboardingAnswers,
  cityIdBySlug?: string | null,
): ProfilePatch {
  const patch: ProfilePatch = {};
  if (answers.interests.length > 0) patch.interests = [...answers.interests];
  if (answers.mainConstraint) patch.main_constraint = answers.mainConstraint;
  if (answers.cityNotCovered) patch.city_id = null;
  else if (cityIdBySlug) patch.city_id = cityIdBySlug;
  return patch;
}

/** Faut-il copier les réponses dans le profil de `userId` ? */
export function needsProfileSync(state: OnboardingState, userId: string): boolean {
  return isOnboardingDone(state) && state.syncedUserId !== userId;
}
