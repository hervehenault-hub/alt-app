import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { t } from '@/i18n';
import { HOME_CATEGORIES } from '@/lib/categories';
import { colors, MIN_TOUCH_TARGET, radii, spacing } from '@/theme';

/** Écran d'accueil provisoire. */
export default function HomeScreen() {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text accessibilityRole="header" style={styles.title}>
        {t('common.appName')}
      </Text>
      <Text style={styles.subtitle}>{t('home.tagline')}</Text>

      <Text accessibilityRole="header" style={styles.sectionTitle}>
        {t('home.categoriesTitle')}
      </Text>
      <View style={styles.categories}>
        {HOME_CATEGORIES.map((category) => {
          const label = t(`categories.${category}`);
          return (
            <Pressable
              key={category}
              accessibilityRole="button"
              accessibilityLabel={label}
              accessibilityHint={t('home.categoryHint', { category: label })}
              style={({ pressed }) => [styles.chip, pressed && styles.chipPressed]}
            >
              <Text style={styles.chipText}>{label}</Text>
            </Pressable>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
    backgroundColor: colors.background,
  },
  title: { fontSize: 40, fontWeight: '700', color: colors.text },
  subtitle: { marginTop: 12, fontSize: 16, textAlign: 'center', color: colors.text },
  sectionTitle: { marginTop: 32, fontSize: 18, fontWeight: '600', color: colors.text },
  categories: {
    marginTop: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  // Cible tactile ≥ 44 pt (règle d'accessibilité du projet).
  chip: {
    minHeight: MIN_TOUCH_TARGET,
    minWidth: MIN_TOUCH_TARGET,
    paddingHorizontal: spacing.md,
    justifyContent: 'center',
    borderRadius: radii.pill,
    backgroundColor: colors.pastelSky,
  },
  chipPressed: { opacity: 0.7 },
  chipText: { fontSize: 16, color: colors.text },
});
