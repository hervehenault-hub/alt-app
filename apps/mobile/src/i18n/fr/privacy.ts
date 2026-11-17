/** Résumé de la politique de confidentialité (version complète : docs/rgpd). */
export const privacy = {
  title: 'Vos données',
  intro: 'Alt. collecte le minimum, et seulement pour faire fonctionner l’app.',
  points: {
    account:
      'Compte : avec Apple ou Google, nous recevons seulement votre nom et votre e-mail (Apple peut masquer l’e-mail).',
    location:
      'Position : utilisée sur votre téléphone pour trier les lieux par distance. Elle n’est pas enregistrée.',
    analytics:
      'Mesure d’usage : des événements anonymes (ouverture, fiche vue) pour améliorer l’app. Désactivable dans le profil.',
    hosting: 'Hébergement : serveurs situés dans l’Union européenne.',
    rights:
      'Vous pouvez demander l’accès, la correction ou la suppression de vos données à tout moment.',
  },
  bullet: '• {{text}}',
  back: 'Retour',
} as const;
