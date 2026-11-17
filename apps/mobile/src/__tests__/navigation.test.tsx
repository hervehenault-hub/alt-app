import { fireEvent, renderRouter, screen } from 'expo-router/testing-library';

import TabsLayout from '@/app/(tabs)/_layout';
import MutualAidScreen from '@/app/(tabs)/entraide';
import ImpactScreen from '@/app/(tabs)/impact';
import ExploreScreen from '@/app/(tabs)/index';
import JourneyScreen from '@/app/(tabs)/parcours';
import ProfileScreen from '@/app/(tabs)/profil';
import { useIsSignedIn } from '@/lib/auth/useIsSignedIn';

const ROUTES = {
  '(tabs)/_layout': TabsLayout,
  '(tabs)/index': ExploreScreen,
  '(tabs)/parcours': JourneyScreen,
  '(tabs)/impact': ImpactScreen,
  '(tabs)/entraide': MutualAidScreen,
  '(tabs)/profil': ProfileScreen,
};

const TABS = [
  { label: 'Explorer', path: '/', screen: 'screen-explore', signInPrompt: false },
  { label: 'Parcours', path: '/parcours', screen: 'screen-journey', signInPrompt: true },
  { label: 'Impact', path: '/impact', screen: 'screen-impact', signInPrompt: true },
  { label: 'Entraide', path: '/entraide', screen: 'screen-mutual-aid', signInPrompt: true },
  { label: 'Profil', path: '/profil', screen: 'screen-profile', signInPrompt: true },
] as const;

function tabButton(label: string) {
  return screen.getByLabelText(label);
}

describe('Navigation par onglets', () => {
  it('le hook provisoire useIsSignedIn renvoie false (remplacé en T3.1)', () => {
    expect(useIsSignedIn()).toBe(false);
  });

  it('ouvre Explorer par défaut et affiche les 5 onglets', async () => {
    await renderRouter(ROUTES, { initialUrl: '/' });
    expect(screen).toHavePathname('/');
    expect(screen.getByTestId('screen-explore')).toBeOnTheScreen();
    for (const { label } of TABS) expect(tabButton(label)).toBeOnTheScreen();
  });

  it('navigue entre les 5 onglets', async () => {
    await renderRouter(ROUTES, { initialUrl: '/' });
    for (const tab of [...TABS.slice(1), TABS[0]]) {
      await fireEvent.press(tabButton(tab.label));
      expect(screen).toHavePathname(tab.path);
      expect(screen.getByTestId(tab.screen)).toBeOnTheScreen();
      expect(tabButton(tab.label)).toBeSelected();
    }
  });

  it.each(TABS)(
    '$label : invitation à se connecter selon le besoin, bouton inactif',
    async ({ path, signInPrompt }) => {
      await renderRouter(ROUTES, { initialUrl: path });
      if (signInPrompt) {
        expect(screen.getByTestId('sign-in-prompt')).toBeOnTheScreen();
        expect(screen.getByRole('button', { name: 'Se connecter' })).toBeDisabled();
      } else {
        expect(screen.queryByTestId('sign-in-prompt')).toBeNull();
      }
    },
  );
});
