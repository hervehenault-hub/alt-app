import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';
import type * as GoogleSigninModule from '@react-native-google-signin/google-signin';
import { Platform } from 'react-native';

import { getGoogleClientIds } from '@/config/env';

import { signInWithIdToken, type AuthUser } from './session';

/** L'utilisateur a fermé la fenêtre de connexion : ce n'est pas une erreur à afficher. */
export class SignInCancelledError extends Error {
  constructor() {
    super('Connexion annulée');
    this.name = 'SignInCancelledError';
  }
}

/** Les identifiants du fournisseur ne sont pas encore configurés (compte à créer). */
export class ProviderNotConfiguredError extends Error {
  constructor(provider: string) {
    super(`Connexion ${provider} non configurée`);
    this.name = 'ProviderNotConfiguredError';
  }
}

function isCancel(error: unknown): boolean {
  const code = (error as { code?: unknown } | null)?.code;
  return code === 'ERR_REQUEST_CANCELED' || code === 'SIGN_IN_CANCELLED' || code === '12501';
}

/** Connexion Apple disponible : iOS uniquement (T3.2). */
export async function isAppleSignInAvailable(): Promise<boolean> {
  if (Platform.OS !== 'ios') return false;
  try {
    return await AppleAuthentication.isAvailableAsync();
  } catch {
    return false;
  }
}

/**
 * Connexion Apple → `signInWithIdToken`. Portées demandées : nom et e-mail seulement.
 * Le nonce brut est envoyé à Supabase, son empreinte SHA-256 à Apple.
 */
export async function signInWithApple(): Promise<AuthUser> {
  const rawNonce = Crypto.randomUUID();
  const hashedNonce = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, rawNonce);
  let credential: AppleAuthentication.AppleAuthenticationCredential;
  try {
    credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
      nonce: hashedNonce,
    });
  } catch (error) {
    if (isCancel(error)) throw new SignInCancelledError();
    throw error;
  }
  if (!credential.identityToken) throw new Error('Apple n’a pas renvoyé de jeton.');
  return signInWithIdToken('apple', credential.identityToken, rawNonce);
}

type GoogleModule = typeof GoogleSigninModule;

/** Chargé à la demande : le module natif n'existe pas dans Expo Go ni sur le web. */
function loadGoogle(): GoogleModule | null {
  if (Platform.OS === 'web') return null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports -- chargement paresseux du module natif
    return require('@react-native-google-signin/google-signin') as GoogleModule;
  } catch {
    return null;
  }
}

/** Le bouton Google est proposé si les identifiants OAuth sont renseignés. */
export function isGoogleSignInConfigured(): boolean {
  return Platform.OS !== 'web' && Boolean(getGoogleClientIds().webClientId);
}

/** Connexion Google → `signInWithIdToken` (T3.3). */
export async function signInWithGoogle(): Promise<AuthUser> {
  const { webClientId, iosClientId } = getGoogleClientIds();
  const google = loadGoogle();
  if (!google || !webClientId) throw new ProviderNotConfiguredError('Google');
  const { GoogleSignin } = google;
  GoogleSignin.configure({ webClientId, iosClientId, scopes: ['email', 'profile'] });
  try {
    await GoogleSignin.hasPlayServices();
    const response = await GoogleSignin.signIn();
    if (response.type === 'cancelled') throw new SignInCancelledError();
    const token = response.data.idToken;
    if (!token) throw new Error('Google n’a pas renvoyé de jeton.');
    return await signInWithIdToken('google', token);
  } catch (error) {
    if (error instanceof SignInCancelledError || isCancel(error)) throw new SignInCancelledError();
    throw error;
  }
}
