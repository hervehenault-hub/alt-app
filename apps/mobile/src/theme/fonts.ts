import { Inter_400Regular } from '@expo-google-fonts/inter/400Regular';
import { Inter_500Medium } from '@expo-google-fonts/inter/500Medium';
import { Inter_600SemiBold } from '@expo-google-fonts/inter/600SemiBold';
import { PlayfairDisplay_700Bold } from '@expo-google-fonts/playfair-display/700Bold';
import { useFonts } from 'expo-font';

import { fontFamilies } from './tokens';

/**
 * Fichiers de polices chargés au démarrage. Import par graisse (sous-chemins) pour
 * n'embarquer que les fichiers utilisés.
 */
export const FONT_ASSETS = {
  [fontFamilies.displayBold]: PlayfairDisplay_700Bold,
  [fontFamilies.regular]: Inter_400Regular,
  [fontFamilies.medium]: Inter_500Medium,
  [fontFamilies.semiBold]: Inter_600SemiBold,
} as const;

/**
 * Charge les polices de l'app. Renvoie `true` quand l'interface peut s'afficher :
 * polices prêtes, OU échec de chargement (on retombe alors sur la police système
 * plutôt que de bloquer l'utilisateur).
 */
export function useAppFonts(): boolean {
  const [loaded, error] = useFonts(FONT_ASSETS);
  return loaded || error !== null;
}
