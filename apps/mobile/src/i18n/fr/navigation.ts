/** Onglets de navigation et écrans d'accueil de chaque onglet (provisoires). */
export const navigation = {
  tabs: {
    explore: 'Explorer',
    journey: 'Parcours',
    impact: 'Impact',
    mutualAid: 'Entraide',
    profile: 'Profil',
  },
  explore: {
    title: 'Le bon plan, juste à côté',
    intro: 'Vrac, réparation, réemploi, anti-gaspi, producteurs : tout près de chez vous.',
    introHighlight: 'juste à côté',
    domainsTitle: 'Par où commencer ?',
    categoriesTitle: 'Toutes les catégories',
    comingSoon: 'La carte des lieux arrive très bientôt.',
  },
  journey: {
    title: 'Votre parcours',
    intro: 'Des petits pas, à votre rythme. Chaque geste compte, aucun n’est obligatoire.',
  },
  impact: {
    title: 'Impact',
    intro: 'Ce que la communauté bordelaise change, ensemble.',
    collectiveTitle: 'À l’échelle de Bordeaux',
    collectiveBody: 'Les premiers chiffres de la communauté apparaîtront ici.',
    personalTitle: 'Votre impact',
  },
  mutualAid: {
    title: 'Entraide',
    intro: 'Prêter, donner, demander un coup de main près de chez vous.',
  },
  profile: {
    title: 'Profil',
    intro: 'Vos préférences et vos informations.',
    aboutTitle: 'À propos d’Alt.',
    aboutBody: 'Alt. vous aide à trouver des alternatives écologiques, sans pression.',
  },
} as const;
