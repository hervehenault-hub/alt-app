/** Impact évité et économies (lot 7). Uniquement des formulations positives. */
export const impact = {
  title: 'Impact',
  intro: 'Ce que vos gestes ont déjà permis, avec la méthode derrière chaque chiffre.',
  monthSaving: 'Économisés ce mois-ci',
  yearSaving: 'Économisés cette année',
  euros: '{{amount}} €',
  impactTitle: 'Impact évité',
  impactValue: '≈ {{quantity}}',
  impactEquivalence: 'en équivalent : {{label}}',
  impactKgValue: '{{kg}} kg',
  impactKgUnit: 'de CO₂e évités',
  actionsCount: 'Actions réalisées',
  figureA11y: '{{label}} : {{value}}',
  howComputed: 'Méthode et sources',
  howComputedHint: 'Explique comment ce chiffre est calculé',
  zeroTitle: 'Tout commence par un premier geste',
  zeroMessage:
    'Faites une action de votre parcours : vos économies et votre impact s’afficheront ici.',
  zeroCta: 'Voir mon parcours',
  collectiveTitle: 'À l’échelle de Bordeaux',
  collectiveDemo:
    '{{count}} actions réalisées par {{people}} habitants, ≈ {{amount}} € économisés.',
  collectiveSoon: 'Le total de la communauté bordelaise s’affichera ici.',
  demoNote: 'Chiffres de démonstration.',
  method: {
    back: 'Retour',
    title: 'Méthode et sources',
    version: 'Version de la méthode : {{version}}',
    saving: {
      title: 'Les euros économisés',
      formula:
        'Pour chaque action réalisée, on ajoute une économie moyenne prudente (arrondie vers le bas). Elle compare le geste à l’achat ou au service habituel.',
    },
    impact: {
      title: 'L’impact évité',
      formula:
        'Pour chaque action réalisée, on multiplie le nombre de fois par un facteur d’émissions évitées (kg CO₂e), issu de bases publiques. On convertit ensuite le total en équivalence concrète.',
    },
    count: {
      title: 'Les actions réalisées',
      formula:
        'Chaque « Je l’ai fait » compte pour une action, y compris quand une habitude est refaite.',
    },
    city: {
      title: 'Le total de la ville',
      formula:
        'Somme des actions de tous les habitants, recalculée chaque heure, sans aucune donnée individuelle affichée.',
    },
    factorsTitle: 'Facteurs utilisés',
    factorValue: '{{value}} {{unit}}',
    uncertainty: 'Incertitude : {{text}}',
    openSource: 'Voir la source',
    openSourceHint: 'Ouvre la source dans le navigateur',
    noFactor: 'Aucun facteur pour ce chiffre : il est calculé directement.',
  },
} as const;
