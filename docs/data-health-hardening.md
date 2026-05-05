# Data health hardening

Deze laag voorkomt dat kritieke pagina's een Supabase-fout stil tonen als een lege lijst.

## Wat is toegevoegd

- `lib/data/data-health.ts`
  - controleert per routegroep of belangrijke Supabase-bronnen bereikbaar zijn;
  - haalt alleen `id` op met `limit(1)`;
  - geeft per bron `available`, `empty` of `error` terug;
  - logt databasefouten via `logSupabaseDataError`.

- `components/dashboard/data-health-callout.tsx`
  - toont een duidelijke foutstatus bij databaseproblemen;
  - toont bij volledig lege bronnen dat de database wel bereikbaar is;
  - rendert niets wanneer data gezond is en bestaande lege states genoeg context geven.

## Toegepaste pagina's

- `/admin/dashboard`
- `/admin/leerlingen`
- `/admin/betalingen`
- `/admin/audit`
- `/instructeur/regie`
- `/instructeur/lessen`
- `/instructeur/beschikbaarheid`
- `/instructeur/aanvragen`
- `/instructeur/leerlingen`
- `/leerling/dashboard`
- `/leerling/boekingen`

## Belangrijk gedrag

- Geen schemawijziging.
- Geen Supabase policies aangepast.
- Geen demo- of mockdata toegevoegd.
- Geen brede `select("*")`.
- Bij databasefout krijgt de gebruiker een expliciete waarschuwing.
- Bij echt geen records blijft de app een nette lege state tonen.

## Beste vervolg

De volgende laag is sectie-specifieke `DataResult<T>` responses in de bestaande datafuncties zelf. Dan kan bijvoorbeeld alleen de betalingstabel een fout tonen zonder dat de rest van de pagina een routebrede waarschuwing nodig heeft.
