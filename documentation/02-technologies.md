# 2. Technologies

[Sommaire](README.md) · [← Vue d’ensemble](01-vue-ensemble.md) · [Architecture →](03-architecture.md)

## Bibliothèques et outils

Les versions installées sont définies dans [package.json](../package.json) et verrouillées dans [package-lock.json](../package-lock.json). Le projet utilise Svelte 5 et SvelteKit 3. Pour une évolution de dépendance, vérifier les API de la version réellement installée.

| Technologie                    | Rôle dans 24 Regards                                                                                                                                                          | Où la retrouver                                                                                                      |
| ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| **Svelte**                     | Décrit les composants, leur HTML, leurs styles et leur état réactif. `$state`, `$derived` et `$effect` pilotent notamment les sélections et les lecteurs.                     | [components](../src/lib/components), fichiers `+page.svelte` et `+layout.svelte`.                                    |
| **SvelteKit**                  | Organise les routes, les loaders, les métadonnées et la navigation entre les pages. Assure le pré-rendu HTML.                                                                 | [src/routes](../src/routes), [vite.config.ts](../vite.config.ts).                                                    |
| **TypeScript**                 | Décrit les modèles, interfaces et paramètres afin de détecter les incohérences pendant le développement. Les JSON bénéficient aussi d’une validation explicite à l’exécution. | [models.ts](../src/lib/domain/models.ts), [ports.ts](../src/lib/domain/ports.ts), [tsconfig.json](../tsconfig.json). |
| **Vite**                       | Démarre le serveur local avec actualisation des modifications et exécute la chaîne de compilation intégrée à SvelteKit.                                                       | [vite.config.ts](../vite.config.ts), commandes `dev`, `build` et `preview`.                                          |
| **`@sveltejs/adapter-static`** | Écrit les pages pré-rendues et les ressources sous une forme publiable sur GitHub Pages.                                                                                      | Option `adapter` de [vite.config.ts](../vite.config.ts).                                                             |
| **PDF.js, via `pdfjs-dist`**   | Ouvre les PDF, obtient leurs dimensions et dessine leurs pages sur un canvas, ensuite converti en image. Le traitement utilise un worker local.                               | [pdf-rasterizer.ts](../src/lib/infrastructure/browser/pdf-rasterizer.ts).                                            |
| **`@openpageflip/core`**       | Anime le feuilletage d’éléments HTML. Reçoit les images du magazine ou les pages déjà composées d’un article.                                                                 | [openpageflip.ts](../src/lib/infrastructure/browser/openpageflip.ts).                                                |
| **CSS**                        | Définit la présentation, les mises en page réactives, les couleurs du thème et les lignes du carnet.                                                                          | Styles intégrés aux composants et [global.css](../src/lib/styles/global.css).                                        |
| **Node.js 24 et npm**          | Exécutent les scripts d’import, de validation, de compilation et de test; installent les dépendances. Node n’est pas nécessaire sur l’hébergement final.                      | [.node-version](../.node-version), [.npmrc](../.npmrc), [package.json](../package.json).                             |
| **Vitest**                     | Vérifie les règles de sélection, les catalogues, la validation et les fonctions de gestion du lecteur sans navigateur.                                                        | [vitest.config.ts](../vitest.config.ts), [tests/unit](../tests/unit).                                                |
| **Playwright**                 | Exécute de vrais parcours dans un navigateur : lecteurs, navigation, historique, thèmes et tailles d’écran. Utilise Edge sous Windows et Chromium dans la CI Linux.           | [playwright.config.ts](../playwright.config.ts), [playwright.base.config.ts](../playwright.base.config.ts).          |
| **Prettier**                   | Uniformise la présentation du code et de la documentation.                                                                                                                    | [.prettierrc.json](../.prettierrc.json), [.prettierignore](../.prettierignore).                                      |
| **GitHub Actions / Pages**     | Vérifie le dépôt, construit l’artefact et publie les fichiers statiques.                                                                                                      | [.github/workflows/pages.yml](../.github/workflows/pages.yml).                                                       |

PDF.js et OpenPageFlip ont des responsabilités distinctes : PDF.js produit les images, OpenPageFlip manipule les pages HTML qui les contiennent. La pagination d’un article est réalisée par le code du projet avant de transmettre les pages à OpenPageFlip.

## Commandes disponibles

Exécuter les commandes depuis la racine du dépôt avec Node.js 24. Le guide [Travail quotidien](05-travail-quotidien.md) détaille leur ordre et les variantes Windows.

| Commande                 | Effet                                                                                                                      |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------------- |
| `npm ci`                 | Réinstalle les dépendances selon le verrouillage de `package-lock.json`.                                                   |
| `npm run dev`            | Prépare les ressources publiques puis démarre Vite sur `127.0.0.1`.                                                        |
| `npm run check`          | Synchronise les types SvelteKit, vérifie Svelte/TypeScript et contrôle certaines règles de dépendance entre couches.       |
| `npm test`               | Exécute les tests unitaires avec Vitest.                                                                                   |
| `npm run build`          | Prépare les ressources, valide les contenus et génère le site statique.                                                    |
| `npm run preview`        | Sert une construction existante pour la vérifier localement. Il faut reconstruire pour y voir les dernières modifications. |
| `npm run test:e2e`       | Lance les tests navigateur du site construit. Playwright démarre le serveur d’aperçu sur le port 4173.                     |
| `npm run test:base`      | Vérifie une construction réalisée avec `BASE_PATH=/24regards`, via le port 4174.                                           |
| `npm run format`         | Réécrit la mise en forme des fichiers selon Prettier. Examiner le diff avant de conserver ces changements.                 |
| `npm run import:content` | Relance explicitement la migration WordPress. Remplace les contenus importés; ce n’est pas une étape du travail quotidien. |

`npm run check` ne remplace pas la validation des fichiers PDF et médias faite pendant `build`. Les tests navigateur vérifient la construction servie par `preview`, et non le serveur `dev`.

## Repères dans les dossiers

| Chemin                                                             | Nature et conservation                                                                             |
| ------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------- |
| `src/`                                                             | Sources de l’application, données éditoriales et styles, conservés dans Git.                       |
| `PDFs/`                                                            | PDF originaux, conservés dans Git.                                                                 |
| `static/media/`                                                    | Identité visuelle, images originales et copies d’affichage, conservées dans Git.                   |
| `static/pdfs/`, `static/vendor/`, `static/THIRD_PARTY_NOTICES.txt` | Ressources préparées automatiquement, ignorées par Git. Elles seront incluses dans le site publié. |
| `scripts/`, `tests/`, `.github/`, configurations à la racine       | Outils, vérifications et automatisations, conservés dans Git.                                      |
| `documentation/`                                                   | Guide du projet conservé dans Git; ne crée pas de route publique.                                  |
| `build/`, `.svelte-kit/`                                           | Résultats de construction et fichiers générés par SvelteKit, ignorés par Git.                      |
| `node_modules/`, `.tools/`, `.cache/`                              | Dépendances installées, éventuelle copie locale de Node et fichiers temporaires, ignorés par Git.  |
| `test-results/`, `playwright-report/`                              | Captures, traces et rapports générés, ignorés par Git.                                             |

La liste effective des exclusions reste [.gitignore](../.gitignore). Le dossier `static` expose ses fichiers à la racine du site : `static/media/favicon.png` devient `/media/favicon.png`, avec le préfixe de déploiement éventuel.
