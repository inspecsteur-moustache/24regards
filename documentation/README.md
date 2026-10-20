# Documentation de 24 Regards

Ce guide explique où modifier le site, comment les données deviennent des pages et comment vérifier une modification avant publication. Il décrit le code présent dans le dépôt; les fichiers cités permettent de retrouver chaque comportement.

## Parcours de lecture

| Partie                                                | Ce que vous saurez faire après lecture                                                                        |
| ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| [1. Vue d’ensemble](01-vue-ensemble.md)               | Identifier les pages, les fonctions du site et le rôle de GitHub Pages. Comprendre la vue globale du système. |
| [2. Technologies](02-technologies.md)                 | Distinguer le rôle de chaque bibliothèque et choisir la bonne commande de développement ou de vérification.   |
| [3. Architecture du code](03-architecture.md)         | Trouver la couche où intervenir et respecter les règles de dépendance. Lire le diagramme des couches.         |
| [4. Parcours de fonctionnement](04-parcours.md)       | Suivre un JSON jusqu’à son affichage, le chargement d’un PDF et la pagination d’un article.                   |
| [5. Travail quotidien](05-travail-quotidien.md)       | Installer le projet, gérer les publications, modifier une fonctionnalité, valider et publier.                 |
| [6. Choix et contraintes](06-choix-et-contraintes.md) | Comprendre les raisons des choix et les points à préserver pendant une évolution.                             |

Pour une première contribution, lire les trois premières parties, puis suivre la procédure correspondante dans **Travail quotidien**. Consulter les parcours et les contraintes avant de modifier un lecteur ou le déploiement.

## Trouver rapidement où intervenir

Tous les chemins ci-dessous partent de la racine du dépôt.

| Modification souhaitée                     | Point de départ                                                                                                                                          | Vérification à prévoir                                                                    |
| ------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Ajouter ou corriger un magazine            | [magazines.json](../src/lib/content/magazines.json) et le dossier `PDFs/`                                                                                | Construction, sélection, téléchargement, proportions du PDF et références des rédacteurs. |
| Ajouter ou corriger un article             | [articles.json](../src/lib/content/articles.json) et `static/media/`                                                                                     | Construction, carnet complet, lecture continue, auteur et images.                         |
| Modifier un profil                         | [authors.json](../src/lib/content/authors.json)                                                                                                          | Construction et parcours Rédaction, références vers les textes.                           |
| Modifier contact, réseaux ou infolettre    | [site.json](../src/lib/content/site.json)                                                                                                                | Liens, boîte de dialogue et état configuré ou indisponible.                               |
| Modifier la présentation commune           | [+layout.svelte](../src/routes/+layout.svelte), [SiteHeader.svelte](../src/lib/components/SiteHeader.svelte), [global.css](../src/lib/styles/global.css) | Téléphone et ordinateur, clair et sombre, clavier.                                        |
| Corriger le lecteur PDF                    | [MagazineReader.svelte](../src/lib/components/MagazineReader.svelte) et [son assemblage](../src/lib/composition/magazine-reader.ts)                      | Feuilletage, proportions, ombres, rotations et changement rapide de numéro.               |
| Corriger le carnet                         | [ArticleNotebook.svelte](../src/lib/components/ArticleNotebook.svelte) et [article-paginator.ts](../src/lib/infrastructure/browser/article-paginator.ts) | Aucun texte perdu ou dupliqué, images, interligne et redimensionnement.                   |
| Changer une règle de sélection             | [application/catalog.ts](../src/lib/application/catalog.ts)                                                                                              | Tests unitaires, URL, sélection par défaut et historique.                                 |
| Modifier une route ou une ancienne adresse | [src/routes](../src/routes)                                                                                                                              | Accès direct à la page compilée, navigation et redirections.                              |
| Modifier la publication                    | [pages.yml](../.github/workflows/pages.yml) et [vite.config.ts](../vite.config.ts)                                                                       | Construction normale et scénario sous `/24regards/`.                                      |

## Avant de proposer une modification

Vous devez pouvoir répondre à ces trois questions dans la description de votre changement :

1. **Où avez-vous modifié le projet ?** Données, règle, adaptateur, composant, route ou automatisation.
2. **Quel effet cela produit-il ?** Comportement visible, URL, sélection, mise en page ou fichiers publiés.
3. **Comment l’avez-vous validé ?** Commandes exécutées et vérifications manuelles pertinentes.

Les procédures et les commandes exactes sont dans [Travail quotidien](05-travail-quotidien.md). Cette documentation est conservée dans Git; elle n’est pas publiée comme une page du site.
