/** Géolocalisation : écran explicatif avant la demande système (T3.6). */
export const location = {
  title: 'Trouver ce qui est près de vous',
  highlight: 'près de vous',
  intro:
    'Votre position sert seulement à trier les lieux par distance. Elle reste sur votre téléphone. Une position approximative suffit.',
  allow: 'Utiliser ma position',
  allowHint: 'Ouvre la demande d’autorisation du téléphone',
  later: 'Plus tard',
  laterHint: 'Utilise le centre-ville de Bordeaux',
  chooseNeighborhood: 'Ou choisissez votre quartier',
  neighborhoodHint: 'Utilise le centre de ce quartier',
  status: {
    device: 'Autour de vous',
    device_approximate: 'Autour de vous (position approximative)',
    neighborhood: 'Autour de {{name}}',
    city_center: 'Autour du centre de Bordeaux',
  },
  change: 'Changer',
  changeHint: 'Choisir comment situer les résultats',
  denied:
    'La localisation est désactivée. Vous pouvez l’activer dans les réglages du téléphone, ou choisir un quartier.',
} as const;
