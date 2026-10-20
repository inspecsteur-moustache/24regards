# 6. Choix et contraintes

[Sommaire](README.md) · [← Travail quotidien](05-travail-quotidien.md)

## Pourquoi cette architecture et cette pile

| Choix                                       | Raison dans ce projet                                                                                                                          | Conséquence lors d’une évolution                                                                                                                                                                     |
| ------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Génération statique et GitHub Pages         | Le contenu éditorial change lors des publications et peut être construit à l’avance. L’hébergement distribue simplement les fichiers produits. | Toute mise à jour publiée exige une reconstruction. Une fonction nécessitant un traitement serveur permanent demande un service externe ou une autre architecture.                                   |
| JSON versionnés                             | Les collections et leurs modifications restent lisibles dans Git, utilisables sans CMS pendant les constructions ordinaires.                   | Modifier les références ensemble, valider les données et revoir les attentes de tests liées au catalogue. Il n’y a ni interface d’administration ni brouillon éditorial dans l’application actuelle. |
| SvelteKit et TypeScript                     | Les routes, le pré-rendu et les vues réactives partagent des modèles explicites.                                                               | Maintenir les données initiales pré-rendues et isoler les opérations réservées au navigateur.                                                                                                        |
| Couches et ports ciblés                     | Les règles éditoriales peuvent évoluer sans être liées au DOM, à PDF.js ou au moteur de feuilletage.                                           | Un nouvel adaptateur doit conserver les contrats de sélection, d’annulation, de retour et de nettoyage.                                                                                              |
| PDF.js et OpenPageFlip séparés              | Le dessin des pages et l’animation du livre sont deux responsabilités différentes.                                                             | Pour une image floue, examiner le rasterizer; pour un geste ou une disposition, examiner le feuilletage et le dimensionnement.                                                                       |
| Styles des composants et variables globales | La présentation locale reste près du composant, avec des couleurs et mesures communes.                                                         | Réutiliser les variables de [global.css](../src/lib/styles/global.css), notamment pour les thèmes, contrôles et lignes du carnet.                                                                    |
| Ressources hébergées localement             | Les PDF, images, ressources PDF.js et worker sont servis avec le site.                                                                         | Vérifier leur préparation, leurs chemins et leurs notices lors d’une mise à jour de dépendance.                                                                                                      |

## Migration WordPress

[import-content.mjs](../scripts/import-content.mjs) est un outil de migration explicite. Il interroge l’API publique WordPress.com du site d’origine et reconstitue les JSON et médias locaux. La commande `npm run import:content` n’est appelée ni par `dev` ni par `build`.

Le périmètre initial est défini dans le script : six articles (**L’Agent secret, Him, Le Mois d’horreur 2025, Eddington, Weapons et Super Happy Forever**), quatre profils (**Billy B., JA, Mathieu Giroux et Tarek Ammi**) et trois fiches de magazines. Les PDF sont fournis dans `PDFs/`; le script ne les télécharge ni ne les modifie.

L’import conserve les textes, signatures, dates, emphases, intertitres, listes, images et crédits disponibles. Il retire les éléments actifs et l’habillage WordPress, réécrit les liens connus, supprime le paragraphe de vote historique et télécharge l’identité visuelle. Les images originales restent locales; leurs copies `display-*` sont limitées à 1 200 px et liées à l’original.

Une réimportation **réécrit** `articles.json`, `authors.json`, `magazines.json`, `credits.json` et `site.json`, ainsi que les médias téléchargés. Le script préserve actuellement les champs locaux `instagramUrl` et `newsletter` de `site.json`; les autres champs de configuration sont reconstruits. Avant une réimportation, conserver les modifications éditoriales locales dans Git et examiner ensuite le diff. Le script contient des assertions sur le périmètre initial, notamment les 16 images d’articles : l’étendre demande de revoir ces attentes.

Les constructions ordinaires utilisent les JSON, médias et dépendances déjà présents localement. Elles ne contactent pas WordPress. L’installation des dépendances et les liens externes utilisés par les visiteurs restent des opérations distinctes.

## Validation et HTML éditorial

[validation.ts](../src/lib/domain/validation.ts) vérifie notamment les identifiants et slugs uniques des collections, les dates exploitables, le format du mois d’un numéro, les références aux auteurs et textes, les chemins PDF attendus, certains champs de configuration et l’absence de motifs HTML actifs interdits.

[validate-content.mjs](../scripts/validate-content.mjs) vérifie aussi l’existence des PDF publics, des médias référencés par les attributs locaux `src` et `href` entre guillemets doubles, du logo et de l’icône. Il rejette les chemins médias contenant `..` et les liens de vote obsolètes.

Les interfaces TypeScript et les conversions `as` ne valident pas à elles seules les JSON. La validation actuelle ne couvre pas exhaustivement chaque champ, chaque URL ou les crédits. Elle filtre des motifs HTML interdits; elle ne remplace pas un assainisseur complet pour du contenu arbitraire fourni par des visiteurs. Le HTML est un contenu éditorial relu, conservé dans Git et inséré avec `{@html}`. En cas d’ouverture future à des soumissions non fiables, revoir ce mécanisme avant leur affichage.

Préserver les textes alternatifs et crédits, et utiliser des structures HTML sémantiques. Une nouvelle propriété obligatoire implique d’adapter le modèle, les JSON concernés, la validation, l’import éventuel et les vues qui la consomment.

## Chemins de publication et métadonnées

Le domaine principal prévu est `https://le24regards.ca`, configuré dans [site.json](../src/lib/content/site.json). Conserver `siteUrl` sans `/` final, comme dans la configuration actuelle. [metadata.ts](../src/lib/composition/metadata.ts), [sitemap.xml](../src/routes/sitemap.xml/+server.ts) et [robots.txt](../src/routes/robots.txt/+server.ts) l’utilisent pour les adresses publiques.

Dans [vite.config.ts](../vite.config.ts), `BASE_PATH` vaut une chaîne vide par défaut. Pour une vérification sous `/24regards`, la CI reconstruit avec cette variable, exécute [base.spec.ts](../tests/base/base.spec.ts), puis reconstruit sans préfixe avant publication sur le domaine principal.

Les liens et médias de l’interface utilisent la base fournie par [paths.ts](../src/lib/composition/paths.ts); le carnet préfixe également les liens locaux présents dans le HTML des articles. `paths.relative: false` conserve des chemins cohérents lors d’un accès direct aux pages. Éviter de coder `/media/...` ou `/articles/...` directement dans une vue sans passer par la base prévue.

Les adresses canoniques et le sitemap restent fondés sur le domaine principal, y compris lors du test sous `/24regards`. Ce scénario valide les liens et ressources sous un préfixe; pour adopter réellement un autre domaine ou sous-chemin comme site de production, revoir aussi les métadonnées, le sitemap et la configuration GitHub Pages.

[+layout.ts](../src/routes/+layout.ts) impose le pré-rendu et la barre finale. Les routes dynamiques doivent fournir leurs entrées. Le fichier de repli `404.html` défini dans l’adaptateur complète l’hébergement statique; il ne dispense pas de générer les pages connues.

## Anciennes adresses

La route [[legacy]/+page.ts](../src/routes/%5Blegacy%5D/+page.ts) construit actuellement trois groupes d’alias :

- un slug d’article à la racine, par exemple `/critique-him/`, vers `/articles/critique-him/`;
- un slug de rédacteur à la racine, par exemple `/billy-b/`, vers `/redaction/billy-b/`;
- le `legacyPath` d’un magazine, par exemple `/n11-octobre-2025/`, vers `/?numero=11`.

[La page de redirection](../src/routes/%5Blegacy%5D/+page.svelte) utilise un rafraîchissement HTML, `location.replace` après montage et un lien visible. Ce sont des redirections réalisées côté navigateur, sans règle HTTP 301 configurée sur un serveur applicatif.

Cette route accepte un seul segment. Les alias doivent rester uniques entre eux et ne pas entrer en conflit avec les routes réservées comme `/articles/`. Changer un slug ou retirer un élément du catalogue retire son ancien alias automatique; conserver les adresses nécessaires par des entrées explicites dans la table. Un chemin historique à plusieurs segments demanderait une adaptation de route.

Les noms historiques et les libellés éditoriaux peuvent différer. Le numéro 11 affiche octobre malgré « septembre » dans son nom de PDF; le numéro 9 affiche juin tout en conservant `/n9-mai-2025/` comme ancienne adresse. Ne pas corriger ces identifiants automatiquement d’après le mois affiché.

## Ressources et compatibilité des lecteurs

- **PDF :** conserver la mise à l’échelle uniforme et `object-fit: contain`. Le livre prend le rapport de la première page; les autres formats sont contenus dans cet emplacement. La hauteur sur mobile en paysage est limitée par [magazine-sizing.ts](../src/lib/infrastructure/browser/magazine-sizing.ts), tout en laissant le zoom tactile agrandir les pages.
- **Charge de rendu :** [raster-window.ts](../src/lib/application/raster-window.ts) limite le travail à deux tâches simultanées et six images en cache. [pdf-rasterizer.ts](../src/lib/infrastructure/browser/pdf-rasterizer.ts) limite la densité de rendu et révoque ses URL temporaires. Augmenter ces budgets peut accroître la consommation de mémoire, surtout sur téléphone.
- **Annulation :** les sélections possèdent leur propre contrôleur. Les réponses dépassées sont écartées; les observateurs et abonnements sont retirés au nettoyage. Préserver ces garanties en ajoutant un chargement ou une interaction.
- **Compatibilité PDF.js :** le lecteur et le worker utilisent tous deux la distribution `legacy`. Les tests simulent l’absence des méthodes récentes `Map.getOrInsertComputed` et `Map.getOrInsert` dans la page et le worker. Une mise à jour de PDF.js doit conserver ce test et vérifier les ressources de [prepare-assets.mjs](../scripts/prepare-assets.mjs).
- **Carnet :** découpe, mesure et fond ligné partagent le même interligne. Une police, une marge ou une structure HTML modifiée peut changer toute la pagination. Préserver le texte et les images et garder la lecture continue disponible.
- **Accessibilité :** conserver libellés, focus visible et commandes clavier limitées au lecteur focalisé. L’adaptateur de navigation respecte la préférence de réduction des animations. Les PDF et photos gardent leurs couleurs d’origine en mode sombre.

## Configuration publique et limites actuelles

L’infolettre utilise un formulaire HTML natif vers un fournisseur externe. [site.json](../src/lib/content/site.json) ne doit contenir que l’adresse publique de soumission, le nom du champ courriel et les champs cachés publics nécessaires. Le fournisseur traite confirmation et vérifications complémentaires. Sans adresse de soumission, le composant affiche l’état indisponible. Instagram utilise également une valeur vide tant que le lien n’est pas configuré.

La clé de thème `24regards-theme` est lue avant affichage et réutilisée par le bouton. Modifier son nom demande de garder cohérents [app.html](../src/app.html) et [theme-store.ts](../src/lib/infrastructure/browser/theme-store.ts). Le thème initial suit le navigateur sans choix sauvegardé, puis reste manuel pendant la navigation.

Les fichiers publics et la configuration intégrée au site sont téléchargeables par les visiteurs. Conserver les secrets éventuels hors du contenu et des ressources distribuées. Les notices des bibliothèques sont générées dans `static/THIRD_PARTY_NOTICES.txt`; les crédits éditoriaux restent dans [credits.json](../src/lib/content/credits.json).

Enfin, certains tests décrivent encore précisément les contenus de la migration initiale. Ils doivent évoluer lors d’une publication légitime. La procédure de [Travail quotidien](05-travail-quotidien.md) identifie les fichiers à adapter et les contrôles fonctionnels à conserver.
