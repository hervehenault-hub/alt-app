import { QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import { createQueryClient } from '@/features/places/api';
import { trackAppOpened } from '@/lib/analytics';
import { initAuth, useSession } from '@/lib/auth/session';
import { loadOnboarding, syncOnboardingToProfile } from '@/lib/onboarding';
import { getSupabase } from '@/lib/supabase';
import { colors } from '@/theme';
import { useAppFonts } from '@/theme/fonts';

const queryClient = createQueryClient();

// Garde l'écran de démarrage affiché tant que les polices ne sont pas prêtes.
void SplashScreen.preventAutoHideAsync().catch(() => undefined);

/** Copie les réponses d'onboarding dans le profil dès qu'un compte (réel) est connecté. */
function useOnboardingProfileSync() {
  const { user } = useSession();
  useEffect(() => {
    if (!user || user.isDemo) return;
    const client = getSupabase();
    if (client) void syncOnboardingToProfile(client, user.id).catch(() => undefined);
  }, [user]);
}

export default function RootLayout() {
  const ready = useAppFonts();
  useOnboardingProfileSync();

  useEffect(() => {
    void initAuth();
    void loadOnboarding();
    void trackAppOpened();
  }, []);

  useEffect(() => {
    if (ready) void SplashScreen.hideAsync().catch(() => undefined);
  }, [ready]);

  if (!ready) return null;

  return (
    <QueryClientProvider client={queryClient}>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}
      >
        <Stack.Screen name="sign-in" options={{ presentation: 'modal' }} />
        <Stack.Screen name="location" options={{ presentation: 'modal' }} />
        <Stack.Screen name="onboarding" options={{ gestureEnabled: false }} />
      </Stack>
    </QueryClientProvider>
  );
}
