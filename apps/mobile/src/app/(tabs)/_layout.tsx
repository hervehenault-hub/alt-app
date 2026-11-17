import { Tabs } from 'expo-router/js-tabs';
import type { LucideIcon } from 'lucide-react-native';
import CircleUser from 'lucide-react-native/icons/circle-user';
import Compass from 'lucide-react-native/icons/compass';
import HandHeart from 'lucide-react-native/icons/hand-heart';
import Route from 'lucide-react-native/icons/route';
import Sparkles from 'lucide-react-native/icons/sparkles';
import { StyleSheet, View } from 'react-native';

import { Icon } from '@/components';
import { t, type TranslationKey } from '@/i18n';
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
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.text,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: styles.tabBar,
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

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.surface,
    borderTopColor: colors.divider,
  },
  label: { fontFamily: fontFamilies.medium, fontSize: 12 },
  iconPill: {
    minWidth: 48,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    alignItems: 'center',
    borderRadius: radii.pill,
  },
  iconPillFocused: { backgroundColor: colors.pastelSaffron },
});
