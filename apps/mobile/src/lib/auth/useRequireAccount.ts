import { useRouter } from 'expo-router';
import { useCallback } from 'react';

import { getAuthState } from './session';

/**
 * Garde de compte (T3.7) : une action réservée aux comptes ouvre la connexion,
 * puis reprend l'action après succès (`resumePendingAction`, appelé par l'écran de connexion).
 */
type PendingAction = () => void;

let pending: PendingAction | null = null;

export function useRequireAccount(): (action: PendingAction) => void {
  const router = useRouter();
  return useCallback(
    (action: PendingAction) => {
      if (getAuthState().status === 'signedIn') {
        action();
        return;
      }
      pending = action;
      router.push('/sign-in');
    },
    [router],
  );
}

/** Exécute (une seule fois) l'action mise en attente. Renvoie `true` si une action a repris. */
export function resumePendingAction(): boolean {
  const action = pending;
  pending = null;
  if (!action) return false;
  action();
  return true;
}

/** Abandonne l'action en attente (connexion annulée). */
export function clearPendingAction(): void {
  pending = null;
}

export function hasPendingAction(): boolean {
  return pending !== null;
}
