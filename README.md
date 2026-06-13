# Piece-Meal

Decide what to cook with what you already have. Save recipes, search them by
the ingredients in your kitchen, and use cooking mode to keep your screen
awake while you cook.

Built with Next.js (App Router) and [Supabase](https://supabase.com)
(Postgres + Google sign-in), with a hand-rolled design system targeting
**WCAG 2.2 Level AAA**.

## Features

- **Find recipes** — add the ingredients you have one at a time and see
  which of your saved recipes use all of them (results have shareable URLs).
- **Saved recipes** — browse, open, and delete your recipes (deletes ask for
  confirmation first). Recipes can be tagged healthy/quick/easy, the list
  filters on each tag and its negation, and a "Just decide for us" button
  picks a random recipe from whatever matches the current filters.
- **Add a recipe** — name, then ingredients and instruction steps entered
  one at a time into removable lists (bulleted ingredients, numbered steps),
  with accessible inline validation and screen-reader announcements. A
  paste-a-list option adds many at once from a copied document, stripping
  bullets and numbering automatically.
  Ingredients can be split into named groups (e.g. "Salmon" / "Avocado
  salsa") that render as their own subheaded lists on the recipe page.
- **Shopping list** — add a recipe's ingredients to a household-shared
  list, edit or remove items and check them off (with strikethrough) as
  you shop in the browser, and export to Apple Reminders (.ics, tappable
  checkboxes on iPhone) or a plain-text checklist (.txt, for Apple/Samsung
  Notes).
- **Household sharing** — accounts share one recipe collection: create a
  household, share its invite code, and everyone in it sees, searches, and
  can edit each other's recipes with separate sign-ins. A user can belong
  to several households; each sees all of that user's recipes.
- **Cooking mode** — on a recipe page, keeps the screen awake via the Screen
  Wake Lock API (needs HTTPS; gracefully explains itself on unsupported
  browsers).
- **Accessibility** — 7:1 contrast in light and dark themes, 44px minimum
  targets, skip link, visible focus, reduced-motion support, no time limits.
  Theming lives entirely in the custom properties at the top of
  `src/app/globals.css`, so re-skinning the site is a one-file change.

## Setup

### 1. Supabase project

You can reuse an existing Supabase project or create one at
[database.new](https://database.new).

1. Run the SQL files in `supabase/migrations/` in filename order
   (Supabase dashboard → SQL Editor). They create the `recipes` table with
   row-level security so each user can only see their own recipes.
2. Enable the Google provider: dashboard → Authentication → Providers →
   Google. Follow the linked instructions to create an OAuth client in the
   [Google Cloud Console](https://console.cloud.google.com/apis/credentials):
   - Application type: **Web application**
   - Authorized redirect URI:
     `https://<your-project-ref>.supabase.co/auth/v1/callback`
   - Copy the client ID and secret into the Supabase Google provider form.
3. Set the redirect allow-list: dashboard → Authentication → URL
   Configuration. Add `http://localhost:3000/**` for development (and your
   production URL once deployed, see below).

### 2. Environment variables

```bash
cp .env.example .env.local
```

Fill in `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` from
the Supabase dashboard → Settings → API.

### 3. Run

```bash
npm install
npm run dev
```

Open <http://localhost:3000>.

## Deploying with a custom domain

1. Deploy to [Vercel](https://vercel.com/new) (import the GitHub repo, add
   the two environment variables, deploy).
2. Buy a domain from any registrar (Namecheap, Cloudflare, Porkbun, …).
3. In Vercel → Project → Settings → Domains, add the domain. Vercel shows
   the DNS records to create at your registrar: an `A` record for the apex
   (`76.76.21.21`) and/or a `CNAME` for `www` pointing to
   `cname.vercel-dns.com`.
4. Update auth for the new domain:
   - Supabase → Authentication → URL Configuration: set the Site URL to
     `https://yourdomain.com` and add `https://yourdomain.com/**` to the
     redirect allow-list.
   - No Google Cloud change is needed as long as sign-in continues to
     redirect through `https://<project-ref>.supabase.co/auth/v1/callback`.
     (Optionally configure a [custom auth domain](https://supabase.com/docs/guides/platform/custom-domains)
     so the Google consent screen shows your domain instead of supabase.co.)

## Project structure

```
src/
├── middleware.ts              Refreshes the Supabase session cookie
├── app/
│   ├── layout.tsx             Skip link, header/nav, footer
│   ├── page.tsx               Ingredient search (GET form, works without JS)
│   ├── login/                 Sign-in page; shows auth errors out loud
│   ├── auth/
│   │   ├── signin/route.ts    Starts the Google OAuth flow
│   │   ├── callback/route.ts  Exchanges the OAuth code for a session
│   │   └── signout/route.ts   Signs out
│   ├── recipes/
│   │   ├── page.tsx           Saved recipes
│   │   ├── new/page.tsx       Add a recipe
│   │   ├── [id]/page.tsx      Recipe detail + cooking mode
│   │   └── actions.ts         Server actions (create/delete)
│   └── accessibility/         Accessibility statement
├── components/                NavBar, forms, CookingMode (wake lock)
├── lib/
│   ├── recipes.ts             Ingredient parsing/matching
│   └── supabase/              Server + middleware Supabase clients
└── types/recipe.ts
supabase/migrations/           Database schema (run in Supabase SQL editor)
```
