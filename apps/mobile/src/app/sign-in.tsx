import * as AppleAuthentication from 'expo-apple-authentication';
import { useRouter } from 'expo-router';
import KeyRound from 'lucide-react-native/icons/key-round';
import { useEffect, useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';

import { Button, Card, Icon, Screen, Text, TextWithHighlight } from '@/components';
import { isDemoMode } from '@/config/env';
import { t } from '@/i18n';
import {
  isAppleSignInAvailable,
  isGoogleSignInConfigured,
  ProviderNotConfiguredError,
  SignInCancelledError,
  signInWithApple,
  signInWithGoogle,
} from '@/lib/auth/providers';
import { signInDemo } from '@/lib/auth/session';
import { getSupabase } from '@/lib/supabase';
import { clearPendingAction, resumePendingAction } from '@/lib/auth/useRequireAccount';
import { MIN_TOUCH_TARGET, radii, spacing } from '@/theme';

type Method = 'apple' | 'google' | 'demo';

/** Sans serveur configuré (mode démo, ou .env absent en développement) : connexion simulée. */
function hasServer(): boolean {
  if (isDemoMode()) return false;
  try {
    return getSupabase() !== null;
  } catch {
    return false;
  }
}

/** Écran de connexion (T3.4) : Apple, Google, lien confidentialité, « Continuer sans compte ». */
export default function SignInScreen() {
  const router = useRouter();
  const demo = !hasServer();
  const [appleAvailable, setAppleAvailable] = useState(false);
  const [busy, setBusy] = useState<Method | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (demo) return;
    let alive = true;
    void isAppleSignInAvailable().then((ok) => alive && setAppleAvailable(ok));
    return () => {
      alive = false;
    };
  }, [demo]);

  const close = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/');
  };

  const run = async (method: Method) => {
    setError(null);
    setBusy(method);
    try {
      if (method === 'apple') await signInWithApple();
      else if (method === 'google') await signInWithGoogle();
      else await signInDemo();
      close();
      // L'action réservée reprend une fois l'écran de connexion fermé.
      setTimeout(() => resumePendingAction(), 0);
    } catch (e) {
      if (e instanceof SignInCancelledError) return;
      setError(
        e instanceof ProviderNotConfiguredError
          ? t('auth.errorNotConfigured')
          : t('auth.errorGeneric'),
      );
    } finally {
      setBusy(null);
    }
  };

  const continueWithout = () => {
    clearPendingAction();
    close();
  };

  return (
    <Screen testID="screen-sign-in">
      <View
        style={styles.hero}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      >
        <Icon icon={KeyRound} size={36} />
      </View>
      <TextWithHighlight variant="display" text={t('auth.title')} highlight={t('common.appName')} />
      <Text>{t('auth.intro')}</Text>

      {demo ? (
        <>
          <Button
            label={t('auth.demo')}
            accessibilityHint={t('auth.demoHint')}
            fullWidth
            loading={busy === 'demo'}
            onPress={() => void run('demo')}
            testID="sign-in-demo"
          />
          <Text variant="note">{t('auth.demoNotice')}</Text>
        </>
      ) : (
        <View style={styles.buttons}>
          {Platform.OS === 'ios' && appleAvailable ? (
            <AppleAuthentication.AppleAuthenticationButton
              buttonType={AppleAuthentication.AppleAuthenticationButtonType.CONTINUE}
              buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
              cornerRadius={radii.pill}
              style={styles.apple}
              onPress={() => void run('apple')}
            />
          ) : null}
          {isGoogleSignInConfigured() ? (
            <Button
              label={t('auth.google')}
              accessibilityHint={t('auth.googleHint')}
              variant="secondary"
              fullWidth
              loading={busy === 'google'}
              onPress={() => void run('google')}
              testID="sign-in-google"
            />
          ) : null}
        </View>
      )}

      {error ? (
        <Card tone="coral" testID="sign-in-error">
          <Text variant="label" accessibilityRole="alert">
            {t('auth.errorTitle')}
          </Text>
          <Text>{error}</Text>
        </Card>
      ) : null}

      <Button
        variant="tertiary"
        label={t('auth.continueWithout')}
        accessibilityHint={t('auth.continueWithoutHint')}
        onPress={continueWithout}
        testID="sign-in-skip"
      />
      <Button
        variant="tertiary"
        label={t('auth.privacyLink')}
        accessibilityHint={t('auth.privacyLinkHint')}
        onPress={() => router.push('/confidentialite')}
        testID="sign-in-privacy"
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { alignSelf: 'flex-start', padding: spacing.sm, borderRadius: radii.lg },
  buttons: { gap: spacing.sm },
  apple: { height: MIN_TOUCH_TARGET + 4, width: '100%' },
});
