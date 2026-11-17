import type { LucideIcon } from 'lucide-react-native';
import { View } from 'react-native';

import { colors, ICON_STROKE_WIDTH, type ColorToken } from '@/theme';

export interface IconProps {
  /** Icône `lucide-react-native` (ex. `import Store from 'lucide-react-native/icons/store'` : import par icône, pour ne pas embarquer toute la bibliothèque). */
  icon: LucideIcon;
  size?: number;
  /** Couleur du trait (défaut : marine). */
  color?: ColorToken;
  /**
   * Libellé si l'icône porte une information seule. Sans libellé, l'icône est
   * considérée comme décorative et masquée aux lecteurs d'écran.
   */
  label?: string;
  testID?: string;
}

/** Icône au trait (marine par défaut), taille et épaisseur homogènes. */
export function Icon({
  icon: LucideComponent,
  size = 24,
  color = 'text',
  label,
  testID,
}: IconProps) {
  const glyph = (
    <LucideComponent
      size={size}
      color={colors[color]}
      strokeWidth={ICON_STROKE_WIDTH}
      absoluteStrokeWidth
    />
  );
  if (label) {
    return (
      <View accessible accessibilityRole="image" accessibilityLabel={label} testID={testID}>
        {glyph}
      </View>
    );
  }
  return (
    <View
      testID={testID}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {glyph}
    </View>
  );
}
