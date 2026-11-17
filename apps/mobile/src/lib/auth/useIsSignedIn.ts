import { useSession } from './session';

/** `true` si une session est ouverte (Supabase Auth ou compte de démo). */
export function useIsSignedIn(): boolean {
  return useSession().status === 'signedIn';
}
