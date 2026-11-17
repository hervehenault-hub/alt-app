/** Connexion (T3.2 à T3.4, T3.7). */
export const auth = {
  title: 'Bienvenue sur Alt.',
  intro:
    'Un compte sert à garder votre parcours, votre impact et à participer. Tout le reste est accessible sans compte.',
  apple: 'Continuer avec Apple',
  google: 'Continuer avec Google',
  googleHint: 'Ouvre la connexion Google',
  demo: 'Entrer en mode démo',
  demoHint: 'Se connecte avec un compte fictif, sans rien envoyer',
  demoNotice: 'Version de démonstration : aucune donnée n’est envoyée.',
  continueWithout: 'Continuer sans compte',
  continueWithoutHint: 'Revient à l’écran précédent',
  privacyLink: 'Comment nous protégeons vos données',
  privacyLinkHint: 'Ouvre la politique de confidentialité',
  errorTitle: 'La connexion n’a pas abouti',
  errorGeneric: 'Réessayez dans un instant. Si le problème continue, contactez-nous.',
  errorNotConfigured: 'Cette méthode de connexion n’est pas encore disponible.',
  signedInAs: 'Connecté·e en tant que {{name}}',
  signedInAnonymousName: 'vous',
  signOut: 'Se déconnecter',
  signOutHint: 'Ferme votre session sur cet appareil',
} as const;
