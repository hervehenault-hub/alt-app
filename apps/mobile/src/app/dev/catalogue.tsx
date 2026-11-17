import { Redirect, Stack } from 'expo-router';
import type { ComponentType } from 'react';

import { t } from '@/i18n';

/**
 * Route de développement `/dev/catalogue`.
 *
 * Le module du catalogue n'est chargé que dans la branche `if (__DEV__)` : en
 * production, Metro remplace `__DEV__` par `false` et supprime toute la branche, `require`
 * compris — le catalogue n'est donc PAS embarqué (vérifié par `pnpm check:prod-bundle`
 * après `pnpm export`). Si la route est ouverte en production (lien profond), on
 * redirige vers l'accueil.
 */
export default function DevCatalogueRoute() {
  if (__DEV__) {
    // require() conditionnel (et non import) : c'est ce qui permet à Metro de l'éliminer.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Catalogue = (require('@/dev/CatalogueScreen') as { default: ComponentType }).default;
    return (
      <>
        <Stack.Screen options={{ headerShown: true, title: t('devCatalogue.title') }} />
        <Catalogue />
      </>
    );
  }
  return <Redirect href="/" />;
}
