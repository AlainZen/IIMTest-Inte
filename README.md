# PokéWishlist

[![CI](https://github.com/AlainZen/IIMTest-Inte/actions/workflows/ci.yml/badge.svg)](https://github.com/AlainZen/IIMTest-Inte/actions/workflows/ci.yml)
[![Couverture des tests](https://raw.githubusercontent.com/AlainZen/IIMTest-Inte/badges/coverage.svg)](https://github.com/AlainZen/IIMTest-Inte/actions/workflows/ci.yml)

Application Nuxt pour choisir les 6 Pokémon à capturer. Elle cherche les Pokémon avec [PokeAPI](https://pokeapi.co) et garde la wishlist dans l'[API Hono](https://github.com/AlainZen/IIMTest-API), qui l'enregistre dans PostgreSQL.

- **Ma wishlist** (`/`) : cherche, ajoute, renomme ou supprime un Pokémon.
- **Liste complète** (`/liste-complete`) : parcours tous les Pokémon, filtre-les et ajoute ceux que tu veux.
- **Fiche** (`/pokemon/[name]`) : les informations d'un Pokémon, lues sur PokeAPI, à partir de son nom ou de son numéro.

L'interface existe en anglais (par défaut), français, espagnol et allemand. Les traductions sont dans `app/locales`.

La règle des 6 Pokémon est dans `app/utils/wishlistRules.ts`, les types partagés dans `app/types/pokemon.ts`. La langue est gardée dans un cookie pour que le serveur la connaisse. Le `localStorage` ne garde que les surnoms et le réglage des prénoms.

## Lancer le projet

Lance d'abord l'API, dans son propre dossier. Puis, ici :

```bash
npm ci
npm run dev
```

L'application tourne sur `http://localhost:3000` et appelle l'API sur `http://localhost:3001`. Pour viser une autre adresse, définis la variable `NUXT_PUBLIC_API_BASE`.

## Rendu et pré-génération

L'application est rendue côté serveur (SSR) : une fiche arrive déjà remplie dans le HTML. Au build, `nuxt.config.ts` demande la liste des noms à PokeAPI et injecte les routes `/pokemon/[name]` dans `prerender`. Par défaut, les 151 premiers Pokémon sont générés en HTML, les autres sont rendus à la demande. La variable `PRERENDER_LIMIT` change ce nombre, et `0` désactive la pré-génération.

## Vérifier le code

```bash
npm run lint
npm run format:check
npm run check:locales
npm run typecheck
npm run test:unit
npm run test:coverage
npm run build
```

Les tests unitaires (Vitest, `tests/unit`) simulent `fetch` et `localStorage` : ils passent sans connexion.

## Tests e2e

```bash
npx playwright install chromium
npm run test:e2e
```

Playwright construit et démarre le front et l'API, qui doit être dans `../IIMTest-API`. Seule PokeAPI est remplacée par un faux serveur. Coupe tes `npm run dev` avant : les ports 3000, 3001 et 3002 doivent être libres. **Ces tests vident la base de `TEST_DATABASE_URL`**, lue dans le `.env` de l'API.

## Intégration continue

GitHub Actions lance neuf contrôles séparés à chaque push : lint, Prettier, clés de traduction, typecheck, Vitest et couverture, build, site statique, tests e2e, audit de sécurité. Le résultat apparaît aussi sur la pull request de la branche.

Sur `main`, si tous les contrôles sont verts, deux derniers jobs mettent le site en ligne. Chacun s'ignore tant que ses secrets GitHub manquent :

| Job              | Résultat                                                 | Secrets                                                   |
| ---------------- | -------------------------------------------------------- | --------------------------------------------------------- |
| Vercel           | Le site rendu par le serveur (SSR)                       | `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`      |
| S3 et CloudFront | Le site statique (SSG) : generate, sync S3, invalidation | `AWS_ROLE_ARN`, `S3_BUCKET`, `CLOUDFRONT_DISTRIBUTION_ID` |

Les adresses publiques sont des variables GitHub : `API_URL`, `SSR_URL` et `SSG_URL`. Le job **Contrôle de la production** s'en sert après le déploiement :

```bash
API_URL=... SSR_URL=... SSG_URL=... npm run smoke
SSR_URL=... SSG_URL=... npm run check:seo
```

`smoke` vérifie l'API, une page SSR, une page SSG, les codes HTTP et le CORS. `check:seo` lit le HTML sans JavaScript et compare le titre et le contenu des fiches en SSR et en SSG. Si l'un des deux échoue, la CD passe au rouge.

Chaque push affiche le taux de couverture dans le résumé du run et garde le rapport HTML dans l'artifact `rapport-couverture`. Un push sur `main` met aussi à jour le badge ci-dessus.

## Revenir à la version précédente

Dans l'onglet Actions, lance le workflow **Rollback** sur `main`. Sans commit précisé, il restaure le dernier commit de `main` dont la CI et la CD sont passées, en dehors de la version en ligne, sur Vercel et sur S3, puis contrôle la production. Le prochain merge sur `main` redéploie `main`.

## Site statique

```bash
npm run generate
npm run check:static
```

`nuxt generate` écrit le site dans `.output/public`, avec un fichier HTML pour chacune des 1025 fiches. `check:static` échoue s'il manque une fiche ou si l'une d'elles est vide. Le bucket S3 est configuré en site web, avec `index.html` comme page d'accueil et `404.html` comme page d'erreur.

## Noms des Pokémon

PokeAPI ne cherche que par numéro ou par nom anglais. `app/data/pokemon-names.json` fait le lien entre les noms en quatre langues et les numéros. Pour le régénérer :

```bash
node scripts/generate-names.mjs
```
