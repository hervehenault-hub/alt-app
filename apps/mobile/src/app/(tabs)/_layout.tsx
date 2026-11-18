import { Redirect } from 'expo-router';
import { Tabs } from 'expo-router/js-tabs';
import type { LucideIcon } from 'lucide-react-native';
import CircleUser from 'lucide-react-native/icons/circle-user';
import Compass from 'lucide-react-native/icons/compass';
import HandHeart from 'lucide-react-native/icons/hand-heart';
import Route from 'lucide-react-native/icons/route';
import Sparkles from 'lucide-react-native/icons/sparkles';
import { Platform, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components';
import { t, type TranslationKey } from '@/i18n';
import { useOnboarding } from '@/lib/onboarding';
import { isOnboardingDone } from '@alt/shared';
import { colors, fontFamilies, radii, spacing } from '@/theme';

interface TabDefinition {
  name: string;
  labelKey: TranslationKey;
  icon: LucideIcon;
}

/** Les 5 onglets, dans l'ordre d'affichage. */
export const TABS: readonly TabDefinition[] = [
  { name: 'index', labelKey: 'navigation.tabs.explore', icon: Compass },
  { name: 'parcours', labelKey: 'navigation.tabs.journey', icon: Route },
  { name: 'impact', labelKey: 'navigation.tabs.impact', icon: Sparkles },
  { name: 'entraide', labelKey: 'navigation.tabs.mutualAid', icon: HandHeart },
  { name: 'profil', labelKey: 'navigation.tabs.profile', icon: CircleUser },
];

function TabIcon({ icon, focused }: { icon: LucideIcon; focused: boolean }) {
  // Onglet actif : pastille safran pâle + trait marine (pas seulement la couleur).
  return (
    <View style={[styles.iconPill, focused && styles.iconPillFocused]}>
      <Icon icon={icon} size={22} color={focused ? 'text' : 'textMuted'} />
    </View>
  );
}

export default function TabsLayout() {
  const onboarding = useOnboarding();
  const insets = useSafeAreaInsets();
  // Premier lancement : onboarding (sautable) avant l'exploration.
  if (!onboarding.loaded) return null;
  if (!isOnboardingDone(onboarding.state)) return <Redirect href="/onboarding" />;
  const bottomSpace = Math.max(
    insets.bottom,
    Platform.OS === 'web' ? WEB_BOTTOM_SPACE : spacing.xs,
  );
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.text,
        tabBarInactiveTintColor: colors.textMuted,
        // Barre plus haute : libellés jamais coupés, au-dessus de la barre système du téléphone
        // (et des coins arrondis du cadre de la démo web).
        tabBarStyle: [
          styles.tabBar,
          {
            height: TAB_BAR_HEIGHT + bottomSpace,
            paddingBottom: bottomSpace,
          },
        ],
        tabBarItemStyle: styles.item,
        tabBarLabelStyle: styles.label,
        tabBarAllowFontScaling: true,
        sceneStyle: { backgroundColor: colors.background },
      }}
    >
      {TABS.map(({ name, labelKey, icon }) => {
        const title = t(labelKey);
        return (
          <Tabs.Screen
            key={name}
            name={name}
            options={{
              title,
              tabBarLabel: title,
              tabBarAccessibilityLabel: title,
              tabBarIcon: ({ focused }) => <TabIcon icon={icon} focused={focused} />,
            }}
          />
        );
      })}
    </Tabs>
  );
}

/** Hauteur de la zone des onglets, hors marge du bas. */
const TAB_BAR_HEIGHT = 64;
/** Démo web : les coins arrondis du cadre de téléphone mangent le bas de l'écran. */
const WEB_BOTTOM_SPACE = 20;

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.surface,
    borderTopColor: colors.divider,
    paddingTop: spacing.xs,
  },
  item: { justifyContent: 'center', gap: 2 },
  label: { fontFamily: fontFamilies.medium, fontSize: 12, lineHeight: 16 },
  iconPill: {
    minWidth: 48,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    alignItems: 'center',
    borderRadius: radii.pill,
  },
  iconPillFocused: { backgroundColor: colors.pastelSaffron },
});
