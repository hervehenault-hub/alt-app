# Contenu éditorial d'Alt.

> Statut : **à valider** par le propriétaire (textes et chiffres).

Ce dossier contient deux fichiers de données lus par l'application :

| Fichier | Rôle |
|---|---|
| `actions.json` | Catalogue des 30 actions du parcours pas à pas (10 par domaine) |
| `impact-factors.json` | Facteurs d'impact carbone utilisés par les actions, et équivalences concrètes |

Les deux fichiers commencent par `"status": "a_valider"`. Après relecture, passer la valeur à `"valide"`.

## Schéma de `actions.json`

Racine :

| Champ | Type | Valeurs |
|---|---|---|
| `status` | string | `"a_valider"` \| `"valide"` |
| `schema_version` | integer | `1` |
| `actions` | array d'`Action` | 30 éléments, `id` uniques |

`Action` (tous les champs sont obligatoires, aucun champ supplémentaire) :

| Champ | Type | Valeurs permises / règles |
|---|---|---|
| `id` | string | slug : `^[a-z0-9]+(-[a-z0-9]+)*$`, unique |
| `domain` | enum | `alimentation` \| `quotidien_dechets` \| `reparation_reemploi` |
| `title` | string | court (≤ 70 caractères), à l'infinitif ou à l'impératif doux |
| `body` | string | 1 à 3 phrases, ≤ 400 caractères |
| `effort` | enum | `faible` \| `moyen` |
| `kind` | enum | `ponctuelle` \| `habitude` |
| `saving_eur_per_occurrence` | number | ≥ 0, en euros, par occurrence (voir l'unité implicite dans `saving_basis`) |
| `saving_basis` | string | une phrase qui explique l'hypothèse de prix |
| `impact_factor_id` | string \| null | doit exister dans `impact-factors.json` → `factors[].id` ; `null` si aucune source fiable |
| `linked_category` | enum \| null | `vrac` \| `producteurs` \| `anti_gaspi` \| `reparation` \| `ressourcerie` \| `collecte` \| `null` |

Contraintes de contenu (à tester) :

- 10 actions par domaine, dont au moins 6 avec `effort: "faible"`.
- Mots interdits dans `title`, `body`, `saving_basis` (insensible à la casse) : « échec », « vous devez », « il faut », « mauvais », « coupable », « empreinte à réduire », « polluer » (et dérivés « pollu… »). Pas de ton catastrophiste.
- Aucun nom de commerce ou de marque.
- Registre : vouvoiement (choix à confirmer par le propriétaire).

## Schéma de `impact-factors.json`

Racine :

| Champ | Type | Valeurs |
|---|---|---|
| `status` | string | `"a_valider"` \| `"valide"` |
| `schema_version` | integer | `1` |
| `notes` | string | contexte de collecte |
| `factors` | array de `Factor` | facteurs référencés par `actions[].impact_factor_id` |
| `equivalences` | array de `Factor` | repères pour traduire des kgCO2e (km en voiture, repas, douches) |

`Factor` (même forme pour `factors` et `equivalences`) :

| Champ | Type | Valeurs permises / règles |
|---|---|---|
| `id` | string | slug unique dans tout le fichier ; les équivalences commencent par `eq-` |
| `label` | string | description en français |
| `value` | number \| null | > 0 ; `null` seulement si `status` = `a_verifier` |
| `unit` | string | ex. « kgCO2e évités par repas », « kgCO2e par km » |
| `source_name` | string | nom de la source |
| `source_url` | string (URL https) | page ou fichier réellement consulté |
| `upstream_source_url` | string (URL https), optionnel | base d'origine citée par la source (Agribalyse, Base Empreinte), **non consultée directement** |
| `method` | string | calcul effectué |
| `uncertainty` | string | courte description de l'incertitude |
| `version` | string \| null | version des données |
| `retrieved_at` | string (date `AAAA-MM-JJ`) \| null | date de consultation |
| `status` | enum | `verifie_code_source` (valeur lue dans les données ouvertes ADEME) \| `verifie` (recoupée sur le site officiel) \| `a_verifier` (non vérifiée, ne pas afficher) |

Règle pour l'application : n'afficher un chiffre d'impact que si `value` n'est pas `null` et `status` ≠ `a_verifier`. Une équivalence se calcule ainsi : `kgCO2e évités ÷ equivalence.value`.

## Sources et méthode

Les sites de l'ADEME (impactco2.fr, agribalyse.ademe.fr, base-empreinte.ademe.fr) étaient inaccessibles depuis l'environnement de travail (réseau bloqué). Les valeurs ont donc été lues dans **les données ouvertes du simulateur Impact CO2 de l'ADEME**, publiées dans son dépôt public (`incubateur-ademe/impactco2`, commit `901613a`, consulté le 17/11/2026). Ce sont les mêmes chiffres que ceux affichés sur impactco2.fr, eux-mêmes issus d'Agribalyse 3.2 et de la Base Empreinte. Les liens `source_url` pointent vers la ligne exacte du fichier.

Choix de calcul :

- **Repas** : différence entre deux repas types d'Impact CO2.
- **Objets réparés ou achetés d'occasion** : on compte la fabrication et la distribution d'un objet neuf évitées. L'usage et la fin de vie sont exclus (ils existent dans les deux cas). Les pièces de rechange et les déplacements ne sont pas comptés.
- **Eau** : différence eau en bouteille − eau du robinet, par litre.

Actions sans facteur (`impact_factor_id: null`) : vrac, panier anti-gaspi, légumineuses, producteurs, restes, liste de courses, pain congelé, sac, savon solide, stop-pub, nettoyant maison, carrés lavables, piles, textiles, compost, couches lavables, don en ressourcerie, emprunt d'outil, jouets et livres, couture. Aucune valeur ADEME directement applicable n'a été trouvée ; mieux vaut ne rien afficher qu'un chiffre inventé.

## Hypothèses de prix

Prix indicatifs, constatés couramment en France en 2026, à relire par le propriétaire. « Occurrence » = une fois l'action faite.

| Action | Économie retenue | Hypothèse |
|---|---|---|
| vrac-pates-cereales | 0 € | prix au kilo proche du paquet |
| panier-anti-gaspi | 6 € | panier ~4 € pour 10-12 € de produits |
| repas-vegetarien-hebdo | 1,50 € / repas / pers. | portion de poulet ~120 g à 12 €/kg |
| boeuf-vers-plat-vegetarien | 2,50 € / repas / pers. | bœuf haché ~150 g à 18 €/kg vs lentilles ~0,20 € |
| legumineuses-au-placard | 0 € | geste de préparation |
| legumes-producteur-saison | 0 € | prix proches en saison |
| restes-dejeuner-lendemain | 5 € | déjeuner dehors 8-10 € vs portion maison 2-3 € |
| liste-courses-depuis-frigo | 3 € / course | achats imprévus évités |
| eau-robinet-carafe | 0,25 € / litre | bouteille ~0,25 €/L vs robinet ~0,004 €/L |
| congeler-le-pain | 0,60 € | demi-baguette non jetée |
| sac-reutilisable | 0,10 € | sac de caisse |
| gourde-remplie-robinet | 1 € / gourde | petite bouteille 50 cl achetée en route |
| savon-shampoing-solide | 0 € | 1 pain ≈ 2 flacons, coût proche |
| autocollant-stop-pub | 0 € | gratuit |
| nettoyant-maison | 2 € | spray ~3 € vs vinaigre < 1 € |
| carres-lavables | 0,15 € / jour | 5 lingettes à 0,03 € ; achat initial non déduit |
| deposer-piles-ampoules | 0 € | gratuit |
| deposer-textiles-borne | 0 € | gratuit |
| composter-biodechets | 0 € | pas d'économie directe |
| couches-lavables-essai | 0,80 € / jour | 5 couches à 0,25 € moins ~0,40 € de lavage ; achat initial non déduit |
| faire-reparer-petit-appareil | 50 € | aspirateur neuf ~100 € vs réparation 30-50 € |
| reparer-telephone | 200 € | smartphone neuf ~300 € vs écran/batterie 60-120 € |
| ressemeler-chaussures | 40 € | paire neuve ~80 € vs ressemelage 30-50 € |
| meuble-ressourcerie | 25 € | chaise neuve ~40 € vs 10-15 € |
| vetements-enfant-seconde-main | 4 € / vêtement | t-shirt enfant ~7 € vs 2-3 € |
| jean-seconde-main | 20 € | jean neuf ~40 € vs 15-20 € |
| donner-a-une-ressourcerie | 0 € | don gratuit |
| emprunter-un-outil | 40 € | perceuse d'entrée de gamme |
| jouets-livres-occasion | 6 € / objet | ~10 € neuf vs 3-5 € |
| recoudre-un-vetement | 10 € | petite retouche en atelier |

## Reste à vérifier

1. Recouper les 13 valeurs sur impactco2.fr quand le réseau le permet, puis passer leur `status` à `verifie`.
2. Équivalence « douche » : aucune valeur dans Impact CO2 ; à calculer depuis la Base Empreinte (`status: a_verifier`, `value: null`).
3. Vêtements d'enfant : le facteur utilisé est celui d'un t-shirt adulte (probablement surestimé).
4. Relire toutes les hypothèses de prix ci-dessus.
