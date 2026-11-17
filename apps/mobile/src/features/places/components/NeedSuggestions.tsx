import type { NeedSuggestion } from '@alt/shared';
import Lightbulb from 'lucide-react-native/icons/lightbulb';
import { Pressable, StyleSheet, View } from 'react-native';

import { Icon, Text } from '@/components';
import { t } from '@/i18n';
import { colors, MIN_TOUCH_TARGET, radii, spacing } from '@/theme';

export interface NeedSuggestionsProps {
  suggestions: readonly NeedSuggestion[];
  onSelect: (suggestion: NeedSuggestion) => void;
}

/** Suggestions de besoins (3 au plus), sous forme de liste de boutons accessibles. */
export function NeedSuggestions({ suggestions, onSelect }: NeedSuggestionsProps) {
  if (suggestions.length === 0) return null;
  return (
    <View
      style={styles.list}
      accessibilityRole="list"
      accessibilityLabel={t('places.search.suggestionsLabel')}
      testID="need-suggestions"
    >
      {suggestions.slice(0, 3).map((s) => (
        <Pressable
          key={s.id}
          accessibilityRole="button"
          accessibilityLabel={s.label}
          accessibilityHint={t('places.search.suggestionHint')}
          onPress={() => onSelect(s)}
          style={({ pressed, focused }: { pressed: boolean; focused?: boolean }) => [
            styles.item,
            (pressed || focused) && styles.itemActive,
          ]}
          testID={`need-suggestion-${s.id}`}
        >
          <Icon icon={Lightbulb} size={18} />
          <Text>{s.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.divider,
    overflow: 'hidden',
  },
  item: {
    minHeight: MIN_TOUCH_TARGET,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  itemActive: { backgroundColor: colors.pastelSaffron },
});
