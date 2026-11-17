# Import OpenStreetMap → lieux Alt. (T2.13)

Module **pur** (sans réseau ni base) qui convertit des éléments OpenStreetMap, au format JSON
renvoyé par l'API Overpass, en lieux Alt. L'insertion en base sera branchée à la **vague 3**.

| Fichier                           | Rôle                                                            |
| --------------------------------- | --------------------------------------------------------------- |
| `src/categories.ts`               | correspondance tags OSM → 6 catégories Alt.                     |
| `src/opening-hours.ts`            | `opening_hours` OSM → créneaux `{ weekday 1-7, opens, closes }` |
| `src/convert.ts`                  | élément Overpass → lieu (nom, adresse, coordonnées, source…)    |
| `src/overpass.ts`                 | requête Overpass (bbox Bordeaux) et appel HTTP injectable       |
| `src/cli.ts`                      | squelette du script (**non exécuté**, ni en CI)                 |
| `fixtures/bordeaux-overpass.json` | 20 éléments **fictifs** inspirés de Bordeaux                    |

Commandes : `pnpm --filter @alt/import-osm test`, `… typecheck`. Le script réel (`… fetch`,
Node 22 exécute directement le TypeScript) écrirait `out/places.json` ; il n'a pas encore été lancé.

## Tags retenus

L'ordre compte : la **première** règle satisfaite donne la catégorie principale (`category`) ;
toutes les règles satisfaites sont listées dans `categories`. On regarde d'abord la nature du
lieu, puis ses attributs secondaires.

| Catégorie Alt. | Tags OSM                                                            | Remarque                                           |
| -------------- | ------------------------------------------------------------------- | -------------------------------------------------- |
| `vrac`         | `shop=zero_waste`                                                   | nature principale                                  |
| `producteurs`  | `shop=farm`, `amenity=marketplace`                                  | vente à la ferme, marchés                          |
| `ressourcerie` | `shop=second_hand`, `shop=charity`                                  | seconde main, boutiques solidaires                 |
| `reparation`   | `repair_cafe=yes`, `craft=shoemaker`, `craft=tailor`, `shop=repair` | nature principale                                  |
| `collecte`     | `amenity=recycling`                                                 | conteneurs et déchèteries                          |
| `vrac`         | `bulk_purchase=yes` ou `only`                                       | attribut : magasin bio, épicerie…                  |
| `reparation`   | `shop=*` avec `repair=*` (sauf `repair=no`)                         | attribut : boutique de téléphones, d'informatique… |
| `reparation`   | `service:bicycle:repair=yes`                                        | attribut : magasin de vélos                        |
| `anti_gaspi`   | **aucun**                                                           | voir ci-dessous                                    |

Exemple : `shop=second_hand` + `repair=yes` → `ressourcerie` (principale) et `reparation`.

Éléments écartés (listés dans `skipped` avec leur raison) :

- `hors_categorie` : aucun tag ci-dessus, ou `access=private|no` ;
- `sans_coordonnees` : way ou relation sans `center` (la requête demande `out center`) ;
- `sans_nom` : pas de `name`, sauf pour `collecte` (les conteneurs n'ont presque jamais de nom :
  ils reçoivent « Point de collecte ») ;
- `doublon` : même `type/id` déjà vu.

### Pourquoi pas d'anti-gaspi automatique

OSM n'a pas de tag établi pour les paniers d'invendus ou les épiceries anti-gaspillage. Les pistes
existantes (`amenity=give_box`, frigos solidaires, `social_facility=food_bank`) sont rares,
irrégulières et ne correspondent pas à la catégorie (aide alimentaire ≠ anti-gaspi). Les lieux
`anti_gaspi` seront donc saisis à la main dans le back-office.

## Champs produits

`name`, `category`, `categories`, `latitude`, `longitude` (nœud : `lat`/`lon` ; way/relation :
`center`), `address` (`street` = numéro + rue, `postcode`, `city`, `formatted`), `website`,
`phone` (ou `contact:*`), `opening_hours_raw`, `opening_hours`, `source = "osm"`,
`source_ref = "node/123"`, `license = "ODbL"`, `attribution`.

**Licence** : les données OSM sont sous ODbL. L'app doit afficher l'attribution
« © les contributeurs d'OpenStreetMap » partout où ces lieux apparaissent.

## Horaires (`opening_hours`)

Gérés : `24/7` ; règles séparées par `;` de la forme `<jours> <plages>` — jours `Mo`, `Mo-Fr`,
`Mo,We,Fr`, `Sa-Mo` (absents = tous les jours) ; plages `09:00-12:00,14:00-19:00`, ou
`off`/`closed` ; une règle plus loin remplace les précédentes pour ses jours (sémantique OSM) ;
`PH off` est ignoré. Fermeture jusqu'à `24:00`.

Renvoie `null` (valeur brute conservée) pour tout le reste : `PH` ouvert, mois, semaines,
`Sa[1]`, `sunrise`, `+`, plages après minuit, commentaires, heures sur un chiffre… Mieux vaut
pas d'horaires que des horaires faux.

## Requête Overpass

Bbox de Bordeaux (sud, ouest, nord, est) : `44.79, -0.66, 44.92, -0.52`. Un filtre `nwr` par
règle ci-dessus, `out center tags`. User-Agent générique : `alt-import-osm/0.1 (import de lieux,
projet Alt.)` — aucune donnée personnelle. Respecter les conditions d'usage d'Overpass
(requêtes rares, pas d'import en boucle).

## Reste à faire (vague 3)

- Insérer `places` en base côté serveur (upsert sur `source` + `source_ref`), avec le schéma de la
  session A ; aligner les noms de colonnes.
- Décider du sort des lieux disparus d'OSM entre deux imports.
