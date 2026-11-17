/**
 * Besoins en langage courant → catégories (copie de la table `needs`, migration 002).
 * Sert aux suggestions hors ligne (mode démo) ; la base reste la référence.
 */
import type { NeedDefinition } from './index';

export const NEEDS: readonly NeedDefinition[] = [
  {
    id: 'grille-pain-en-panne',
    label: 'Grille-pain en panne',
    synonyms: ['toaster', 'grille pain cassé', 'grille-pain ne chauffe plus'],
    categories: ['reparation'],
  },
  {
    id: 'petit-electromenager-en-panne',
    label: 'Petit électroménager en panne',
    synonyms: [
      'aspirateur',
      'bouilloire',
      'cafetière',
      'mixeur',
      'sèche-cheveux',
      'fer à repasser',
    ],
    categories: ['reparation'],
  },
  {
    id: 'telephone-casse',
    label: 'Téléphone cassé',
    synonyms: ['écran cassé', 'smartphone', 'portable', 'batterie faible', 'téléphone'],
    categories: ['reparation'],
  },
  {
    id: 'ordinateur-en-panne',
    label: 'Ordinateur lent ou en panne',
    synonyms: ['pc', 'ordinateur portable', 'informatique', 'tablette'],
    categories: ['reparation'],
  },
  {
    id: 'vetement-troue',
    label: 'Vêtement troué',
    synonyms: ['couture', 'retouche', 'ourlet', 'fermeture éclair', 'accroc', 'trou', 'recoudre'],
    categories: ['reparation'],
  },
  {
    id: 'chaussures-usees',
    label: 'Chaussures à ressemeler',
    synonyms: ['cordonnier', 'ressemelage', 'talon', 'semelle', 'chaussures abîmées'],
    categories: ['reparation'],
  },
  {
    id: 'velo-a-reparer',
    label: 'Vélo à réparer',
    synonyms: ['crevaison', 'chaîne', 'freins', 'atelier vélo', 'pneu', 'bicyclette'],
    categories: ['reparation'],
  },
  {
    id: 'emprunter-un-outil',
    label: 'Emprunter un outil',
    synonyms: ['perceuse', 'bricolage', 'outilthèque', 'scie', 'échelle'],
    categories: ['reparation', 'ressourcerie'],
  },
  {
    id: 'restes-de-legumes',
    label: 'Restes de légumes',
    synonyms: ['épluchures', 'compost', 'biodéchets', 'déchets alimentaires', 'composteur'],
    categories: ['collecte', 'anti_gaspi'],
  },
  {
    id: 'gourde',
    label: 'Gourde',
    synonyms: ['bouteille réutilisable', 'fontaine à eau', 'eau du robinet', 'remplir sa gourde'],
    categories: ['vrac'],
  },
  {
    id: 'pates-riz-cereales',
    label: 'Pâtes, riz et céréales au poids',
    synonyms: ['vrac', 'légumineuses', 'lentilles', 'sans emballage', 'épicerie vrac'],
    categories: ['vrac'],
  },
  {
    id: 'produits-menagers',
    label: 'Produits ménagers à recharger',
    synonyms: ['lessive', 'liquide vaisselle', 'recharge', 'vinaigre blanc', 'savon noir'],
    categories: ['vrac'],
  },
  {
    id: 'hygiene-solide',
    label: 'Savon et shampoing solides',
    synonyms: ['cosmétiques', 'hygiène', 'shampoing', 'dentifrice', 'zéro déchet'],
    categories: ['vrac'],
  },
  {
    id: 'bocaux-contenants',
    label: 'Bocaux et contenants',
    synonyms: ['bocal', 'boîte', 'contenant réutilisable', 'sac à vrac'],
    categories: ['vrac', 'ressourcerie'],
  },
  {
    id: 'fruits-legumes-saison',
    label: 'Fruits et légumes de saison',
    synonyms: ['maraîcher', 'ferme', 'amap', 'panier de légumes', 'marché'],
    categories: ['producteurs'],
  },
  {
    id: 'produits-fermiers',
    label: 'Œufs, lait et fromage fermiers',
    synonyms: ['oeufs', 'crèmerie', 'fromage', 'lait', 'yaourt', 'fermier'],
    categories: ['producteurs'],
  },
  {
    id: 'viande-locale',
    label: 'Viande d’un éleveur local',
    synonyms: ['boucherie', 'éleveur', 'volaille', 'colis de viande'],
    categories: ['producteurs'],
  },
  {
    id: 'panier-anti-gaspi',
    label: 'Panier anti-gaspi',
    synonyms: ['invendus', 'panier surprise', 'fin de journée', 'boulangerie invendus'],
    categories: ['anti_gaspi'],
  },
  {
    id: 'courses-petit-budget',
    label: 'Courses à petit prix',
    synonyms: ['épicerie solidaire', 'dates courtes', 'déstockage', 'petit budget'],
    categories: ['anti_gaspi'],
  },
  {
    id: 'meuble-occasion',
    label: 'Meuble d’occasion',
    synonyms: ['chaise', 'table', 'armoire', 'brocante', 'commode', 'canapé'],
    categories: ['ressourcerie'],
  },
  {
    id: 'vetements-seconde-main',
    label: 'Vêtements de seconde main',
    synonyms: ['friperie', 'fripes', 'jean', 'vêtements enfant', 'occasion'],
    categories: ['ressourcerie'],
  },
  {
    id: 'jouets-livres',
    label: 'Jouets et livres d’occasion',
    synonyms: ['jeux', 'bd', 'livres', 'puériculture'],
    categories: ['ressourcerie'],
  },
  {
    id: 'donner-des-objets',
    label: 'Donner des objets',
    synonyms: ['débarras', 'don', 'vider sa cave', 'déménagement', 'se débarrasser'],
    categories: ['ressourcerie', 'collecte'],
  },
  {
    id: 'piles-ampoules',
    label: 'Piles et ampoules usagées',
    synonyms: ['batteries', 'néon', 'cartouches d’encre', 'recyclage'],
    categories: ['collecte'],
  },
  {
    id: 'textiles-uses',
    label: 'Textiles usés',
    synonyms: ['borne textile', 'vêtements abîmés', 'linge usé', 'chaussures usées'],
    categories: ['collecte'],
  },
  {
    id: 'appareil-hors-usage',
    label: 'Appareil électrique hors d’usage',
    synonyms: ['deee', 'électroménager à jeter', 'déchetterie', 'gros électroménager'],
    categories: ['collecte'],
  },
];
