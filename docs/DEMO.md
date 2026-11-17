# Démo web d’Alt.

Une version **web** de l’application, pour présenter Alt. en ligne : elle fonctionne **sans serveur
ni compte**, avec des **lieux fictifs** placés dans de vrais quartiers de Bordeaux et une connexion
simulée (« Entrer en mode démo »). Rien n’est envoyé.

- Sur un ordinateur, l’app s’affiche dans un **cadre de téléphone**, avec une courte présentation.
- Sur un téléphone, elle s’affiche en **plein écran**.

## Fabriquer la démo

```bash
pnpm install
pnpm demo:build
```

Résultat :

- `apps/mobile/dist-demo/` : le site prêt à être mis en ligne ;
- `apps/mobile/alt-demo-web.zip` : le même dossier compressé.

## Mettre en ligne avec Dreamweaver (ou tout logiciel FTP)

La démo est faite de fichiers statiques (HTML, JavaScript, images) : **aucune base de données,
aucun PHP**. N’importe quel hébergement web convient.

### À la racine d’un site (ex. `https://demo.exemple.fr/`)

1. Décompressez `alt-demo-web.zip` (ou utilisez le dossier `dist-demo`).
2. Dans Dreamweaver : **Site > Gérer les sites**, choisissez votre site, puis ouvrez le panneau
   **Fichiers**.
3. Copiez **le contenu** du dossier (`index.html`, `_expo`, `assets`, `maplibre`, `metadata.json`)
   dans le dossier racine local du site.
4. Sélectionnez ces fichiers et cliquez sur **Placer** (flèche vers le haut) pour les envoyer.
5. Ouvrez l’adresse du site : la démo démarre sur l’écran d’accueil.

### Dans un sous-dossier (ex. `https://www.exemple.fr/alt/`)

Les chemins doivent connaître le nom du sous-dossier. Fabriquez la démo ainsi :

```bash
DEMO_BASE_URL=/alt pnpm demo:build
```

puis envoyez le contenu de `dist-demo` dans le dossier `alt/` du site.

### Bon à savoir

- **Commencez toujours par l’adresse principale** (`/` ou `/alt/`) : recharger directement une
  page intérieure (ex. `/search`) renvoie une erreur 404 sur un hébergement simple. Pour l’éviter
  sur Apache, ajoutez un fichier `.htaccess` à côté de `index.html` :

  ```apache
  RewriteEngine On
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . index.html [L]
  ```

- La **carte** charge les fonds de plan OpenStreetMap (OpenFreeMap) depuis Internet : il faut
  une connexion. Sans connexion, un message l’indique et la liste reste utilisable.
- Un site « local » (sur votre ordinateur seulement) n’est pas visible des autres : pour une
  présentation à distance, il faut un hébergement en ligne.

## Scénario de présentation (2 minutes)

1. **Accueil** : 3 questions sautables → « Passer ».
2. **Explorer** : la recherche est l’action principale ; touchez la tuile **Réparation**.
3. **Recherche** : tapez « grille » → suggestion « Grille-pain en panne » → le Repair Café apparaît.
4. **Fiche** : adresse, horaires de la semaine, économie estimée et « Comment c’est calculé ? ».
5. **Filtres** : « Ouvert maintenant », « Gratuit », tri par économie.
6. **Carte** : bascule Liste / Carte, la recherche est conservée.
7. **Profil** : « Se connecter » → « Entrer en mode démo ».
