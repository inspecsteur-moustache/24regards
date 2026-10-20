# 24 Regards

Site éditorial statique en français : magazines PDF feuilletables, articles en carnet et fiches de rédaction.

## Démarrer

Depuis la racine du projet, avec **Node.js 24** accessible dans le terminal :

```sh
npm ci
npm run dev
```

Sous Windows, le lanceur peut utiliser la copie locale de Node.js 24 dans `.tools/`, si elle est présente :

```powershell
powershell -NoProfile -File scripts/run-local.ps1 -Task ci
powershell -NoProfile -File scripts/run-local.ps1 -Task dev
```

> **Note :** `ci` installe les dépendances au premier lancement ou après leur mise à jour; il n’est pas nécessaire à chaque démarrage. `dev` lance le serveur local. C’est la tâche par défaut du lanceur Windows : `-Task dev` peut être omis.

Ces deux méthodes exécutent les mêmes tâches npm. Le lanceur Windows vérifie la version de Node et privilégie la copie locale, sans modifier l’installation système.

Le démarrage prépare automatiquement les PDF, les ressources PDF.js et les notices de licences. Ouvrir ensuite l’adresse affichée par Vite. Les commandes de vérification et les détails Windows sont dans le [guide de travail quotidien](documentation/05-travail-quotidien.md).

## Documentation

Le [guide développeur](documentation/README.md) indique où intervenir et comment valider une modification :

- [Vue d’ensemble](documentation/01-vue-ensemble.md) et [technologies](documentation/02-technologies.md).
- [Architecture SOLID](documentation/03-architecture.md) et [fonctionnement des lecteurs](documentation/04-parcours.md).
- [Travail quotidien](documentation/05-travail-quotidien.md) : contenus, fonctionnalités, vérifications et publication.
- [Choix et contraintes](documentation/06-choix-et-contraintes.md) : import WordPress, configuration, chemins, redirections et ressources.

Le déploiement de test utilise `https://inspecsteur-moustache.github.io/24regards/`, sans domaine personnalisé. Voir la [procédure de publication](documentation/05-travail-quotidien.md#publier). La section suivante décrit l’option future avec un domaine personnalisé.

## GitHub Pages

Le workflow `.github/workflows/pages.yml` vérifie les types, l’architecture et les tests, génère le site, puis teste les parcours dans Chromium. Les pull requests exécutent les contrôles; `main` publie `build/` avec les actions officielles Pages.

Dans le dépôt GitHub, choisir **Settings → Pages → Source: GitHub Actions**, saisir **le24regards.ca** comme domaine personnalisé, configurer les DNS du domaine puis activer HTTPS. Le workflow ne modifie ni les DNS ni les paramètres du compte.

La base est vide pour le domaine personnalisé. Pour un hébergement sous un chemin, définir `BASE_PATH=/24regards` au moment de la construction. Toutes les routes, ressources locales et URL du worker suivent cette base. `paths.relative: false` garantit des liens cohérents lors des accès directs aux pages pré-rendues.

Le scénario `npm run test:base` vérifie spécifiquement ce chemin. Il s’exécute après une construction avec `BASE_PATH=/24regards`, en conservant cette variable pour l’aperçu. Reconstruire ensuite avec une base vide avant de publier sur le domaine principal.

Les anciennes adresses d’articles, de rédacteurs et de numéros disposent de pages HTML de redirection avec lien de secours. Elles utilisent une redirection côté navigateur, adaptée à GitHub Pages.

## Sources et licences

Les textes, photos et éléments d’identité proviennent de [le24regards.ca](https://le24regards.ca/). Les crédits existants sont conservés dans `credits.json` et affichés sur `/citations/`. Les dépendances conservent leurs licences respectives, notamment MIT pour Svelte, SvelteKit et OpenPageFlip, et Apache 2.0 pour PDF.js.
