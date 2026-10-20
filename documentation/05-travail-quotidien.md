# 5. Travail quotidien

[Sommaire](README.md) · [← Parcours](04-parcours.md) · [Choix et contraintes →](06-choix-et-contraintes.md)

## Installer et démarrer

Ouvrir un terminal à la racine du dépôt. Utiliser **Node.js 24** avec npm; la contrainte de version est vérifiée par [.npmrc](../.npmrc) et [package.json](../package.json).

```sh
node --version
npm --version
npm ci
npm run dev
```

`node --version` doit commencer par `v24.`. Une erreur `EBADENGINE` avec Node 16 indique que le terminal utilise une version incompatible. Installer Node.js 24 et rouvrir le terminal, ou utiliser la copie locale décrite ci-dessous. Conserver `package-lock.json` pour reproduire les dépendances du projet.

Vite affiche l’adresse locale, généralement `http://127.0.0.1:5173/`. Les scripts préparent les PDF et ressources techniques avant le démarrage. Les changements de code et de JSON sont visibles pendant le développement; la version publiée exige une nouvelle construction.

### Variante Windows avec la copie locale de Node

Si `.tools/node-v24.22.0-win-x64/` existe sur la machine, [run-local.ps1](../scripts/run-local.ps1) permet de lancer les tâches sans changer l’installation système :

```powershell
powershell -NoProfile -File scripts/run-local.ps1 -Task ci
powershell -NoProfile -File scripts/run-local.ps1 -Task dev
```

Dans un autre terminal, les tâches `check`, `test`, `build`, `preview` et `test:e2e` sont également acceptées par `-Task`. Cette copie de Node est ignorée par Git; elle ne sera pas présente automatiquement dans un nouveau clone.

Pour employer les commandes npm et npx directement dans **la session PowerShell courante**, y compris `test:base` qui n’est pas une valeur du lanceur :

```powershell
$localNodePath = Join-Path (Get-Location).Path '.tools\node-v24.22.0-win-x64'
$env:PATH = $localNodePath + ';' + $env:PATH
node --version
```

Les commandes suivantes supposent que Node.js 24 est disponible dans le terminal où elles sont exécutées.

## Ajouter un magazine

1. Déposer le PDF original dans `PDFs/`. Utiliser un nom stable, sans dépendre du titre visible.
2. Ajouter un objet dans le tableau de [magazines.json](../src/lib/content/magazines.json). Exemple fictif à adapter :

   ```json
   {
     "id": "12",
     "number": 12,
     "title": "N°12 — Novembre 2026",
     "publicationMonth": "2026-11",
     "pdfFile": "/pdfs/24-regards-n12-novembre-2026.pdf",
     "legacyPath": "/n12-novembre-2026/"
   }
   ```

3. Respecter l’unicité de `id`, choisir un numéro distinct et fournir le mois au format `YYYY-MM`. `pdfFile` désigne la copie publique; le fichier source correspondant doit exister dans `PDFs/`. `legacyPath` décrit un alias à un seul segment, qui sera pré-rendu.
4. Ajouter les attributions nécessaires dans [credits.json](../src/lib/content/credits.json). Pour faire apparaître un texte du numéro dans un profil, ajouter dans le tableau `texts` du rédacteur concerné :

   ```json
   {
     "title": "Titre du texte dans le numéro 12",
     "kind": "magazine",
     "target": "12"
   }
   ```

5. Exécuter les vérifications ci-dessous et ajuster les attentes de test liées au numéro par défaut. Le numéro le plus élevé devient automatiquement la sélection initiale; le compteur affiché vient de la longueur du catalogue.
6. Vérifier le menu, `/?numero=12`, le téléchargement, l’ouverture dans un nouvel onglet, le feuilletage et le profil lié. Tester portrait et paysage sur téléphone ainsi qu’une double page sur ordinateur.

La préparation des ressources copie automatiquement le PDF vers `static/pdfs/`. Ne modifier que le mois affiché si le fichier doit garder son nom : le numéro 11 est présenté comme **Octobre 2025** tout en utilisant `24-regards-n11-septembre-2025.pdf`.

## Ajouter un article

1. Ajouter un objet dans [articles.json](../src/lib/content/articles.json). Exemple fictif :

   ```json
   {
     "id": "article-exemple",
     "slug": "nouvelle-critique",
     "title": "Une nouvelle critique",
     "publishedAt": "2026-11-01T12:00:00.000Z",
     "authorSlug": "mathieu-giroux",
     "sourceUrl": "https://le24regards.ca/articles/nouvelle-critique/",
     "contentHtml": "<p>Un premier paragraphe avec une <em>emphase</em>.</p><h2>Un intertitre</h2><p>La suite du texte.</p>"
   }
   ```

2. Choisir un `id` et un `slug` uniques. Employer des lettres minuscules sans accents, chiffres et tirets pour le slug. Il définit l’adresse `/articles/nouvelle-critique/`. Conserver une date ISO complète avec fuseau; le classement utilise la chaîne de date, donc préférer le format UTC montré ci-dessus.
3. Renseigner `authorSlug` avec un slug existant dans [authors.json](../src/lib/content/authors.json), ou omettre ce champ. Pour un nouveau rédacteur, créer sa fiche avec `slug`, `name`, `role`, `favorites` et `texts`. Le choix par défaut de la page Rédaction dépend actuellement de `mathieu-giroux`.
4. Écrire du HTML sémantique en blocs : paragraphes, `h2`, `h3`, listes, citations, emphases, liens et figures. Conserver les signatures et crédits éditoriaux nécessaires. Le titre principal est déjà affiché par la vue; les intertitres appartiennent au contenu.
5. Pour les images, déposer les fichiers dans `static/media/`, ajouter leurs crédits dans `credits.json` et utiliser des chemins locaux `/media/...` entre guillemets doubles. Une figure peut prendre cette forme dans le HTML :

   ```html
   <figure>
     <a href="/media/mon-image.jpg" target="_blank" rel="noopener noreferrer">
       <img
         src="/media/display-mon-image.jpg"
         alt="Description de la scène"
         width="1200"
         height="800"
         loading="lazy"
         decoding="async"
       />
     </a>
     <figcaption>Crédit de la photographie.</figcaption>
   </figure>
   ```

   Les deux images de cet exemple doivent exister. Une copie d’affichage allégée est recommandée; l’import historique en produit de 1 200 px au maximum. Une addition manuelle ne lance pas cet import et ne crée pas automatiquement cette copie. Dans une chaîne JSON, échapper les guillemets HTML avec `\"`.

6. Renseigner les attributions du texte et des images dans `credits.json` : `label`, `sourceUrl`, et selon le cas `credit` et `localPath`. L’adresse source et l’adresse publique de l’article ont des rôles distincts.
7. L’article est automatiquement ajouté aux textes de son rédacteur grâce à `authorSlug`. Ajouter une entrée explicite dans `authors.json` seulement si la liste doit porter un libellé éditorial particulier. Ne pas créer de doublon pour le même article.
8. Construire et vérifier l’accès direct à la nouvelle route, la liste, la signature, les liens, les images, le carnet et la lecture continue. Comparer le texte avant et après pagination.

Les données ne comprennent pas de statut « brouillon » ni de publication programmée. Tous les articles du catalogue sont publiés lors de la construction, même si leur date est future. Ne conserver dans le catalogue destiné à publier que des contenus prêts.

## Modifier ou supprimer un contenu

| Opération                                 | Actions et effets à prendre en compte                                                                                                                                                                                                                                 |
| ----------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Corriger un titre, une date ou un texte   | Modifier le JSON concerné. Un changement de date peut changer le classement et l’article par défaut. Un titre modifié peut aussi nécessiter de corriger les libellés explicites de `authors.json` et les crédits.                                                     |
| Remplacer un PDF                          | Mettre à jour le fichier dans `PDFs/`, puis reconstruire. Si le nom change, mettre à jour `pdfFile` et les crédits. Tester toutes les pages touchées et le téléchargement.                                                                                            |
| Changer un identifiant de magazine        | Mettre à jour les références `texts` de type `magazine`, les liens `?numero=...` concernés et les tests. Les liens déjà partagés avec l’ancien identifiant ne seront pas automatiquement réécrits.                                                                    |
| Changer le slug d’un article ou rédacteur | Mettre à jour les références et liens, puis conserver l’ancienne adresse dans la table des redirections de la route [[legacy]](../src/routes/%5Blegacy%5D/+page.ts). Les alias automatiques suivent le slug courant; `sourceUrl` ne crée pas d’alias supplémentaire.  |
| Supprimer un article                      | Retirer son objet, les références explicites `texts` vers son slug et les crédits devenus sans objet. Supprimer seulement les images qui ne sont plus utilisées ailleurs. Prévoir une destination pour ses anciennes adresses si elles doivent rester utilisables.    |
| Supprimer un magazine                     | Retirer son objet, les références `texts`, ses crédits et son PDF source. Retirer aussi l’ancienne copie de `static/pdfs/` : le script de préparation copie les fichiers présents, mais ne purge pas les copies obsolètes. Reconstruire et vérifier les redirections. |
| Supprimer un rédacteur                    | Retirer sa fiche et corriger les `authorSlug` des articles liés, ou les omettre. Si c’est le rédacteur par défaut, modifier aussi la sélection dans [catalog.ts](../src/lib/application/catalog.ts).                                                                  |

Conserver au moins un magazine : l’accueil attend actuellement une sélection disponible. La page Articles prévoit, elle, un état de catalogue vide. Pour une suppression ou un renommage, rechercher les références dans tout `src/` et `tests/`, puis vérifier le diff Git avant publication.

## Modifier une fonctionnalité

Commencer par la carte du [sommaire](README.md) et le [parcours correspondant](04-parcours.md). Déterminer si la modification concerne une donnée, une règle, un adaptateur technique ou la présentation.

| Changement                                 | Fichiers à examiner ensemble                                                                                                                                           | Validation adaptée                                                                                                     |
| ------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Couleurs, espacement, menu ou pied de page | [global.css](../src/lib/styles/global.css), composant ou [+layout.svelte](../src/routes/+layout.svelte)                                                                | Construction, vérification visuelle sur téléphone et ordinateur, deux thèmes et clavier.                               |
| Classement ou sélection par défaut         | [application/catalog.ts](../src/lib/application/catalog.ts), loaders concernés                                                                                         | `check`, tests unitaires, construction, URL et historique.                                                             |
| Rendu et taille des PDF                    | [MagazineReader.svelte](../src/lib/components/MagazineReader.svelte), adaptateur ou dimensionnement                                                                    | Tests unitaires concernés, construction, tests magazine, rotations, ombres, erreurs et nettoyage.                      |
| Découpe ou typographie du carnet           | [ArticleNotebook.svelte](../src/lib/components/ArticleNotebook.svelte), [article-paginator.ts](../src/lib/infrastructure/browser/article-paginator.ts), styles communs | Construction, tests de pagination et parcours carnet; comparer le texte intégral, les images et les grands caractères. |
| Thème initial ou bouton                    | [app.html](../src/app.html), [SiteHeader.svelte](../src/lib/components/SiteHeader.svelte), [theme-store.ts](../src/lib/infrastructure/browser/theme-store.ts)          | Préférences navigateur clair/sombre, choix mémorisé, rechargement et stockage indisponible.                            |
| Déploiement ou chemins                     | [vite.config.ts](../vite.config.ts), [paths.ts](../src/lib/composition/paths.ts), routes et médias                                                                     | Construction et tests ordinaires, puis construction et tests sous `/24regards/`.                                       |
| Documentation seule                        | Fichiers Markdown et leurs liens                                                                                                                                       | Vérifier la mise en forme, les liens locaux, les exemples et les schémas.                                              |

Ajouter ou adapter un test lorsqu’une règle ou un comportement peut régresser. Pour un ajustement visuel mineur, une vérification dans le navigateur est généralement plus utile qu’un test qui recopie les propriétés CSS.

## Vérifier avant publication

Voici la séquence complète utilisée comme base pour les changements fonctionnels :

```sh
npm run check
npm test
npm run build
npm run test:e2e
```

Sur Linux et macOS, installer Chromium avant la première exécution de Playwright :

```sh
npx playwright install chromium
```

Sous Windows, les configurations actuelles sélectionnent Microsoft Edge : son installation est nécessaire pour exécuter ces tests sans modifier leur configuration. Dans GitHub Actions, l’installation Chromium et de ses dépendances est déjà prévue.

Pour observer la construction manuellement :

```sh
npm run preview
```

Ne pas confondre le serveur de développement et l’aperçu compilé. Les tests lancent leur propre aperçu; éviter qu’un serveur manuel ancien n’occupe les ports 4173 et 4174. Les traces d’échec se trouvent dans `test-results/`; on peut ouvrir un fichier `trace.zip` avec `npx playwright show-trace <chemin-vers-trace.zip>`.

Les tests contiennent encore des attentes liées au contenu initial : six articles, numéro 11 et `critique-lagent-secret` par défaut, dix coups de cœur par fiche, certains profils, nombres d’images et PDF précis. Lors d’un ajout ou d’une suppression légitime, adapter les assertions correspondantes de [catalog.test.ts](../tests/unit/catalog.test.ts), [site.spec.ts](../tests/e2e/site.spec.ts) et [base.spec.ts](../tests/base/base.spec.ts). Préserver les contrôles fonctionnels : complétude du texte, références, proportions et navigation. Une construction valide ne garantit pas à elle seule que ces attentes restent à jour.

### Vérification sous un chemin de déploiement

Pour une modification des URL, routes, médias, ressources PDF.js ou paramètres de déploiement, exécuter également cette séquence dans PowerShell avec Node.js 24 :

```powershell
$env:BASE_PATH = '/24regards'
npm run build
npm run test:base
Remove-Item Env:BASE_PATH
npm run build
```

Attendre la réussite de chaque commande avant de passer à la suivante. Retirer `BASE_PATH` et reconstruire à la fin pour retrouver la version destinée au domaine principal. La variable doit être présente pendant la construction **et** l’aperçu utilisé par les tests.

## Publier

1. Examiner les fichiers modifiés avec `git diff` et `git status`. Conserver les sources, JSON, PDF originaux, images et mises à jour de documentation nécessaires. Les dossiers générés restent exclus selon [.gitignore](../.gitignore).
2. Proposer la modification par une branche et une pull request. Indiquer le comportement obtenu et les validations effectuées. GitHub Actions exécute `check`, les tests unitaires, les constructions et les tests navigateur.
3. Après revue, fusionner vers `main`. Un envoi sur `main` déclenche le workflow de publication; les pull requests seules ne publient pas.
4. Suivre le résultat dans **Actions → Vérifier et publier 24 Regards**, puis vérifier les pages et médias modifiés sur le domaine public.

Le dépôt doit être configuré dans **Settings → Pages → Source: GitHub Actions**. Le domaine personnalisé, ses DNS et HTTPS se configurent dans GitHub Pages et chez le gestionnaire du domaine. Le workflow publie `build/` mais ne change pas ces réglages. Le domaine principal prévu est `le24regards.ca`, avec une base vide.

Pour revenir à une version antérieure publiée, rétablir les sources voulues par un nouveau changement Git, puis laisser le même workflow les vérifier et les publier. Éviter les corrections manuelles uniquement dans `build/`, qui seraient perdues à la construction suivante.
