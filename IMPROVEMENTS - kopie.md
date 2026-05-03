# Verbeteringen in deze versie

## Security

- `.env.local` met echte credentials is verwijderd uit de distributie.
- README waarschuwt expliciet dat Supabase/Resend secrets direct geroteerd moeten worden als ze ooit gedeeld zijn.
- Hardcoded testmailadressen in Playwright scripts zijn vervangen door een neutrale placeholder.
- Next.js security headers toegevoegd:
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: SAMEORIGIN`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Permissions-Policy`
- `poweredByHeader` uitgezet.

## Developer workflow

- `npm run typecheck` toegevoegd.
- `npm run doctor` toegevoegd voor preflight checks op Node versie, environment variables en mogelijke secrets.
- `npm run verify` toegevoegd als centrale quality gate.
- `.node-version` en `.nvmrc` toegevoegd voor consistente Node 20 runtime.
- `.env.example` uitgebreid met `PAYMENT_REMINDER_CRON_SECRET`.

## Stability

- `next.config.ts` crasht niet meer hard bij een ongeldige `NEXT_PUBLIC_SUPABASE_URL`; de Supabase image remotePattern wordt dan veilig overgeslagen met een waarschuwing.

## Uitgevoerde checks

Geslaagd:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://example.supabase.co \
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_dummy \
SUPABASE_SERVICE_ROLE_KEY=dummy \
npm run doctor

npm run typecheck
node scripts/check-internal-links.mjs
```

Niet volledig uitgevoerd in deze sandbox:

```bash
npm run build
npm run lint
```

Reden: de aangeleverde zip bevatte een platform-specifieke `node_modules` map met alleen de Windows Next SWC binary (`@next/swc-win32-x64-msvc`). Op Linux probeert Next daardoor de Linux SWC binary te downloaden, wat in deze omgeving geblokkeerd is. Voer lokaal eerst `rm -rf node_modules && npm ci` uit en draai daarna `npm run verify`.
