# RijBasis

RijBasis is een Next.js en Supabase platform voor rijscholen, instructeurs en leerlingen. De app combineert publieke SEO-pagina's met dashboards voor leerlingen, instructeurs en beheerders.

## Rollen

- Leerling: zoekt instructeurs, vraagt proeflessen of pakketten aan, beheert boekingen, betalingen, berichten en reviews.
- Instructeur: beheert profiel, pakketten, beschikbaarheid, aanvragen, leerlingen, lessen, berichten en inkomsten.
- Admin: beheert gebruikers, instructeurs, leerlingen, lessen, betalingen, pakketten, reviews, support en instellingen.

## Stack

- Next.js 16 App Router
- React 19
- TypeScript
- Supabase Auth, Database, Realtime en Storage
- Tailwind CSS 4
- shadcn/Radix UI componenten
- Playwright scripts voor belangrijke flows

## Belangrijke routes

Publiek:

- `/`
- `/instructeurs`
- `/instructeurs/[slug]`
- `/pakketten`
- `/tips`
- `/vergelijk`
- `/rijschool/[stad]`
- `/automaat/[stad]`
- `/schakel/[stad]`
- `/proefles/[stad]`
- `/spoedcursus/[stad]`

Dashboards:

- `/dashboard` redirect naar het juiste dashboard op basis van rol
- `/leerling/profiel`
- `/leerling/boekingen`
- `/leerling/instructeurs`
- `/instructeur/dashboard`
- `/instructeur/beschikbaarheid`
- `/instructeur/aanvragen`
- `/admin/dashboard`
- `/admin/gebruikers`

API:

- `/auth/callback`
- `/api/cron/lesson-reminders`

## Vereisten

- Node.js 20 of nieuwer
- npm
- Een Supabase project
- Supabase CLI voor database migrations en type generatie

## Installatie

```bash
npm ci
npm run dev
```

Open daarna `http://localhost:3000`.

## Environment variables

Kopieer `.env.example` naar `.env.local` en vul de waarden in. De app gebruikt deze variabelen:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
# Of, voor oudere Supabase projecten:
NEXT_PUBLIC_SUPABASE_ANON_KEY=

SUPABASE_SERVICE_ROLE_KEY=
# Alternatief in development voor admin key lookup:
SUPABASE_ACCESS_TOKEN=

NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SITE_URL=http://localhost:3000

LESSON_REMINDER_CRON_SECRET=local-lesson-reminder-secret

RESEND_API_KEY=
NOTIFICATION_FROM_EMAIL=
NOTIFICATION_REPLY_TO_EMAIL=
NOTIFICATION_TEST_TO_EMAIL=

PLAYWRIGHT_BASE_URL=http://localhost:3000
PLAYWRIGHT_NOTIFICATION_TEST_EMAIL=
PLAYWRIGHT_TEST_PASSWORD=
```

`SUPABASE_SERVICE_ROLE_KEY` en `RESEND_API_KEY` zijn server-only secrets. Zet ze nooit in clientcode.

## Supabase

Database migrations staan in `supabase/migrations`.

Handige commando's:

```bash
npx supabase db push --linked
npm run supabase:types
npm run supabase:seed:demo
```

`npm run supabase:types` werkt `lib/supabase/database.types.ts` bij op basis van het gekoppelde Supabase project.

## Scripts

```bash
npm run dev
npm run lint
npm run build
npm run check:links
npm run start
npm run playwright:clickcheck
npm run supabase:seed:demo
npm run supabase:types
```

## Checks voor wijzigingen

Draai minimaal:

```bash
npm run lint
npm run build
```

Voor booking, notificaties en reviews zijn er extra Playwright scripts in `scripts/`, zoals:

```bash
node scripts/playwright-direct-booking-check.mjs
node scripts/playwright-notification-flows-check.mjs
node scripts/playwright-review-flow-check.mjs
```

## Projectstructuur

- `app/`: routes, layouts, dashboards, auth en API endpoints.
- `components/`: UI componenten, dashboard onderdelen, instructeur flows en marketingblokken.
- `lib/actions/`: server actions voor mutaties.
- `lib/data/`: data loaders en query helpers.
- `lib/supabase/`: Supabase clients en gegenereerde database types.
- `lib/seo-*`: SEO configuratie voor steden, intenties, tips en vergelijkingspagina's.
- `supabase/migrations/`: database schema, policies en storage wijzigingen.
- `scripts/`: demo seed en Playwright flow checks.

## Ontwikkelprioriteiten

1. Houd `npm run lint` en `npm run build` groen.
2. Bescherm de booking flow: proefles, pakket aanvraag, beschikbaarheid, self-scheduling en annuleren.
3. Houd dashboards taakgericht per rol.
4. Verhoog SEO-kwaliteit met unieke content, interne links en structured data.
5. Houd Supabase RLS en storage policies scherp bij iedere databasewijziging.
