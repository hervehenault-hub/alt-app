# apps/mobile

Application mobile Expo (initialisée à la tâche T0.2).

## Design system « Soleil et éditorial » (lot 1)

| Où                          | Quoi                                                                              |
| --------------------------- | --------------------------------------------------------------------------------- |
| `src/theme/tokens.ts`       | couleurs, espacements, rayons, ombres, typo — **seul fichier avec des couleurs**  |
| `src/theme/contrast.ts`     | associations texte/fond autorisées (testées ≥ 4,5:1, ≥ 3:1 grands titres)         |
| `src/theme/fonts.ts`        | Playfair Display (grands titres ≥ 24 pt) et Inter (tout le reste)                 |
| `src/theme/icons.ts`        | icône de chaque catégorie et domaine d'accueil                                    |
| `src/components/`           | `Text`, `Button`, `Card`, `Chip`, `EmptyState`, `Skeleton`, `ReliabilityBadge`, … |
| `src/app/(tabs)/`           | onglets Explorer, Parcours, Impact, Entraide, Profil                              |
| `src/app/dev/catalogue.tsx` | catalogue de tous les composants (**développement uniquement**)                   |

Règles vérifiées par les tests :

- aucune couleur en dur hors de `tokens.ts` ; jamais de blanc sur corail ;
- icônes importées une par une (`lucide-react-native/icons/<nom>`), pour garder un bundle léger ;
- cibles tactiles ≥ 44 pt, texte agrandissable (testé à l'échelle 2,0), états annoncés.

Le catalogue s'ouvre depuis l'onglet Profil (bouton visible en développement) ou via
`alt:///dev/catalogue`. `pnpm export` vérifie ensuite qu'il est absent du bundle de production
(`pnpm check:prod-bundle [dossier]` pour un export fait ailleurs).
