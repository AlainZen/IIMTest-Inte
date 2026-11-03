# PokéWishlist

Application Nuxt pour choisir les 6 Pokémon à capturer. Elle cherche les Pokémon avec [PokeAPI](https://pokeapi.co) et garde la wishlist dans l'[API Hono](https://github.com/AlainZen/IIMTest-API), qui l'enregistre dans PostgreSQL.

- **Ma wishlist** (`/`) : cherche, ajoute, renomme ou supprime un Pokémon.
- **Liste complète** (`/liste-complete`) : parcours tous les Pokémon, filtre-les et ajoute ceux que tu veux.
- **Fiche** (`/pokemon/[name]`) : les informations d'un Pokémon, lues sur PokeAPI, à partir de son nom ou de son numéro.

L'interface existe en anglais (par défaut), français, espagnol et allemand. Les traductions sont dans `app/locales`.

La règle des 6 Pokémon est dans `app/utils/wishlistRules.ts`, les types partagés dans `app/types/pokemon.ts`. Le `localStorage` ne garde que la langue, les surnoms et le réglage des prénoms.

## Lancer le projet

Lance d'abord l'API, dans son propre dossier. Puis, ici :

```bash
npm ci
npm run dev
```

L'application tourne sur `http://localhost:3000` et appelle l'API sur `http://localhost:3001`. Pour viser une autre adresse, définis la variable `NUXT_PUBLIC_API_BASE`.

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

Playwright construit et démarre le front et l'API, qui doit être dans `../IIMTest-API`. Seule PokeAPI est simulée. Coupe tes `npm run dev` avant : les ports 3000 et 3001 doivent être libres. **Ces tests vident la base de `TEST_DATABASE_URL`**, lue dans le `.env` de l'API.

## Intégration continue

GitHub Actions lance huit contrôles séparés à chaque push : lint, Prettier, clés de traduction, typecheck, Vitest et couverture, build, tests e2e, audit de sécurité. Le résultat apparaît aussi sur la pull request de la branche.

## Noms des Pokémon

PokeAPI ne cherche que par numéro ou par nom anglais. `app/data/pokemon-names.json` fait le lien entre les noms en quatre langues et les numéros. Pour le régénérer :

```bash
node scripts/generate-names.mjs
```
