/** Onboarding en 3 écrans sautables (T3.5). */
export const onboarding = {
  skip: 'Passer',
  skipHint: 'Va directement à l’exploration',
  next: 'Suivant',
  finish: 'C’est parti',
  back: 'Retour',
  progress: 'Étape {{current}} sur {{total}}',
  city: {
    title: 'Où êtes-vous ?',
    highlight: 'Où',
    intro: 'Alt. démarre à Bordeaux. D’autres villes suivront.',
    pilot: 'Bordeaux et sa métropole',
    notCovered: 'Ma ville n’est pas couverte',
    notCoveredNote:
      'Merci ! Vous pouvez explorer Bordeaux en attendant ; nous vous préviendrons quand Alt. arrivera chez vous.',
  },
  domains: {
    title: 'Qu’est-ce qui vous intéresse ?',
    highlight: 'intéresse',
    intro: 'Choisissez autant de thèmes que vous voulez (ou aucun).',
    options: {
      alimentation: 'Alimentation',
      quotidien_dechets: 'Quotidien et déchets',
      reparation_reemploi: 'Réparation et réemploi',
    },
  },
  constraint: {
    title: 'Votre principale contrainte ?',
    highlight: 'contrainte',
    intro: 'Pour vous proposer d’abord ce qui vous convient.',
    budget: 'Le budget',
    temps: 'Le temps',
    mobilite: 'Les déplacements',
  },
} as const;
