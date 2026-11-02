# Mon Pokédex

Application Nuxt à deux pages :

- **Ma wishlist** (`/`) : cherche un Pokémon avec [PokeAPI](https://pokeapi.co), ajoute-le, renomme-le ou supprime-le. La wishlist est gardée dans le `localStorage` et reste là après un rafraîchissement.
- **Liste complète** (`/liste-complete`) : parcours tous les Pokémon, filtre-les et ajoute ceux que tu veux.

Les types partagés (`Pokemon`, `WishlistItem`…) sont dans `app/types/pokemon.ts`.

## Lancer le projet

```bash
npm install
npm run dev
```

L'application tourne sur `http://localhost:3000`.

## Vérifier le code

```bash
npm run lint
npm run format:check
npm run typecheck
npm run test:unit
npm run test:coverage
npm run build
npx playwright install chromium
npm run test:e2e
```

- **Tests unitaires** (Vitest, `tests/unit`) : `fetch` et `localStorage` sont simulés, les tests passent sans connexion à PokeAPI.
- **Tests e2e** (Playwright, `tests/e2e`) : l'application construite tourne dans un vrai navigateur, avec PokeAPI simulée. Lance `npm run build` avant.

## Intégration continue

GitHub Actions lance sept contrôles séparés à chaque pull request et à chaque push sur `main` : lint, Prettier, typecheck, Vitest et couverture, build, tests e2e, audit de sécurité. Chacun repart d'un `npm ci`.

## Noms français

PokeAPI ne cherche que par numéro ou par nom anglais. `app/data/pokemon-fr.json` fait le lien entre les noms français et les numéros. Pour le régénérer :

```bash
node scripts/generate-fr-names.mjs
```
