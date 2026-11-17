import { useEffect, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  StyleSheet,
  View,
  type DimensionValue,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { colors, radii } from '@/theme';

export interface SkeletonProps {
  width?: DimensionValue;
  height?: DimensionValue;
  radius?: number;
  /**
   * Libellé annoncé (ex. `t('ui.loading')`). À donner sur UN seul squelette par
   * zone : sans libellé, le squelette est masqué aux lecteurs d'écran.
   */
  label?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

/** Hook : vrai si l'utilisateur a demandé de réduire les animations. */
function useReduceMotion(): boolean {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    let mounted = true;
    void AccessibilityInfo.isReduceMotionEnabled()
      .then((value) => mounted && setReduce(value))
      .catch(() => undefined);
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduce);
    return () => {
      mounted = false;
      sub?.remove();
    };
  }, []);
  return reduce;
}

/** Bloc de chargement qui « respire » doucement (immobile si animations réduites). */
export function Skeleton({
  width = '100%',
  height = 16,
  radius = radii.sm,
  label,
  style,
  testID,
}: SkeletonProps) {
  const reduceMotion = useReduceMotion();
  const [opacity] = useState(() => new Animated.Value(1));

  useEffect(() => {
    if (reduceMotion) {
      opacity.setValue(1);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.5, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity, reduceMotion]);

  const a11y = label
    ? {
        accessible: true,
        accessibilityRole: 'progressbar' as const,
        accessibilityLabel: label,
        accessibilityState: { busy: true },
      }
    : {
        accessibilityElementsHidden: true,
        importantForAccessibility: 'no-hide-descendants' as const,
      };

  return (
    <View testID={testID} {...a11y}>
      <Animated.View
        style={[styles.block, { width, height, borderRadius: radius, opacity }, style]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  block: { backgroundColor: colors.skeleton },
});
