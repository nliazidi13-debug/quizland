# Quizland

Quiz de culture générale — 14 domaines, 5 niveaux de difficulté. Implémentation
de la **Variante B — Gaming** (inspirée Kahoot / Quizizz / Brawl Stars) du
handoff design, construite avec Next.js (App Router), TypeScript, Tailwind CSS
et shadcn/ui.

## Stack

- Next.js 16 (App Router, Turbopack)
- TypeScript
- Tailwind CSS v4
- shadcn/ui (Base UI primitives)
- Polices : Baloo 2 (titres) / Poppins (texte)

## Démarrer

```bash
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000).

## Structure

- `src/app/(site)` — pages avec navigation globale (landing, catalogue,
  niveau, classement, défis, connexion, profil, admin)
- `src/app/(game)` — pages en mode focus sans navigation (quiz, résultats)
- `src/lib/data.ts` — domaines, classement, défis, niveaux (mock)
- `src/lib/questions.ts` — banque de 112 questions (8 par domaine × 14 domaines)
- `src/lib/player.ts` — profil joueur et historique persistés en
  `localStorage`/`sessionStorage` (pas de backend)
- `src/components/quizland/` — composants de marque (bouton pill 3D, badges,
  navbar, lecteur de quiz)

## Déploiement (Cloudflare Pages)

L'app est exportée en site 100 % statique (`output: "export"` dans
`next.config.ts`) : aucun serveur Node requis.

```bash
npm run build
```

Génère le dossier `out/` — c'est lui qu'il faut publier.

Sur Cloudflare Pages :
- **Build command** : `npm run build`
- **Build output directory** : `out`

Ou en CLI, une fois le build fait :

```bash
npx wrangler pages deploy out --project-name=quizland
```

Prévisualiser le dossier `out/` en local avant de publier :

```bash
npm run start
```

(sert `out/` sur [http://localhost:4250](http://localhost:4250) avec `serve`)

## Notes

- Il n'y a pas de backend : le classement et les domaines sont des données
  mock, le profil joueur et l'historique de quiz sont stockés dans le
  navigateur.
- Les 5 niveaux de difficulté partagent la même banque de questions par
  domaine (pas de contenu différencié par niveau pour l'instant).
