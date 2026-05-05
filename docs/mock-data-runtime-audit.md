# Mock Data & Runtime Data Audit

Datum: 5 mei 2026

Doel: controleren waar de applicatie nog mock-, demo-, fallback- of placeholderdata gebruikt en bepalen of die data zichtbaar mag blijven, vervangen moet worden door Supabase-data of alleen intern/demo-only mag bestaan.

## Hoofdconclusie

De belangrijkste dashboardflows gebruiken echte Supabase-data. Er is geen brede stille fallback gevonden waarbij productiepagina's automatisch demo-leerlingen, demo-lessen, demo-betalingen of demo-pakketten tonen wanneer Supabase faalt.

Wel zijn er drie categorieen die bewust uit elkaar gehouden moeten worden:

1. **Echte productrecords**: lessen, leerlingen, pakketten, betalingen, documenten, audit, reviews, support en notificaties.
2. **Statische contentbibliotheken**: teksten zoals lesmateriaal, scenario-uitleg, labels, opties, filters, lege states en microcopy.
3. **Interne test/demo-scripts**: Playwright QA en `supabase-seed-demo.mjs`, alleen voor development/test.

## Direct Aangepast

`/admin/instellingen` was nog te veel een placeholder met tekst over toekomstige instellingen. Dit is vervangen door een echte read-only systeemstatus:

- Supabase configuratie;
- demo mode status;
- cron secrets voor les- en betalingsherinneringen;
- Stripe webhook status;
- admin-only audit export;
- veilige beheerlinks naar support, reviews en leerlingbeheer.

Bestand:

- `app/(dashboard)/admin/instellingen/page.tsx`

## Uitgevoerde QA

Commands:

```bash
npm run playwright:dashboards
npm run playwright:clickcheck
```

Resultaat:

- leerling dashboard visual check: ok;
- instructeur dashboard visual check: ok;
- admin dashboard visual check: ok;
- publieke routes: 200;
- leerlingroutes: 200;
- instructeurroutes: 200;
- adminroutes: 200;
- belangrijkste aanvraag-/pakketdialogen openen en gebruiken live agenda/slotpickers;
- tijdelijke testaccounts zijn na afloop opgeruimd.

## Gecontroleerde Gebieden

| Gebied | Bevinding | Status |
| --- | --- | --- |
| Leerlingdashboard | Gebruikt profiel, lessen, aanvragen, pakketten, voortgang en notificaties uit Supabase. | Goed |
| Leerlingboekingen | Gebruikt echte lessen/aanvragen, proeflesstatus en lege states. | Goed |
| Leerlingbetalingen | Gebruikt echte pakket- en betaalstatus. | Goed |
| Leerlingdocumenten | Gebruikt documentrecords en uploadacties. | Goed |
| Leerlinglesmateriaal | Heeft statische basisbibliotheek, maar combineert die met echte voortgang, lesnotities en voorkeuren. | Bewust content, geen mockrecords |
| Instructeurregie | Gebruikt echte lessen, aanvragen, documenten, voertuigen, feedbacktodos en leerling-signalen. | Goed |
| Instructeurlessen | Weekplanner, taken, deadlines en tips worden afgeleid uit echte lessen, aanvragen, leerlingen en beschikbaarheid. | Goed |
| Instructeurleerlingen | Gebruikt echte leerlingrecords, pakketten, voortgang, audit en proeflesstatus. | Goed |
| Instructeurdocumenten | Expliciet live uit Supabase/documententabel, geen demodocumenten. | Goed |
| Instructeurvoertuigen | Expliciet live uit Supabase, geen demo-auto's. | Goed |
| Instructeurinkomsten | Gebruikt echte ledger-, betaling-, pakket- en kostenrecords. Grafieken gebruiken afgeleide reeksen, geen fake transacties. | Goed, later technisch opsplitsen |
| Admin dashboard | Gebruikt echte gebruikers, support, reviews, betalingen en goedkeuringsqueue. | Goed |
| Admin leerlingen | Gebruikt echte leerlingrecords, pakketten, proeflesstatus en audit. | Goed |
| Admin audit | Echte auditregels met server-side export en admin-only toegang. | Goed |
| Admin instellingen | Was placeholder, nu read-only systeemstatus. | Aangepast |

## Demo/Testdata

| Onderdeel | Locatie | Toegestaan? | Advies |
| --- | --- | --- | --- |
| Demo seed script | `scripts/supabase-seed-demo.mjs` | Alleen development/test | Niet zichtbaar maken in UI. Alleen handmatig gebruiken. |
| Playwright scripts | `scripts/playwright-*.mjs` | Alleen QA/test | Behouden als interne QA. Niet als gebruikersfunctie tonen. |
| Package QA script | `scripts/package-assignment-qa-check.mjs` | Alleen QA/test | Behouden en documenteren. |
| Demo mode helper | `lib/data/runtime-safety.ts` | Alleen development/test met expliciete env | Behouden. Productie toont geen automatische demo fallback. |

## Bewuste Statische Content

Deze onderdelen zijn geen mockrecords, maar vaste productcontent of UI-configuratie:

- lesmateriaal-basiskaarten;
- filteropties;
- statuslabels;
- icoon- en kleurkeuzes;
- lege-state teksten;
- onboardingchecklists;
- compliancechecklists;
- pakketvisuals;
- feedbacktemplate-types.

Deze mogen blijven zolang ze niet doen alsof er echte leerling-, betaling-, pakket- of lesrecords bestaan.

## Resterende Hardening

De meeste datafuncties loggen Supabase-fouten en geven daarna een lege lijst terug. Dat is production-safe omdat er geen fake data verschijnt, maar het verschil tussen "geen data" en "databasefout" is in sommige UI's nog niet altijd zichtbaar.

Aanbevolen vervolgstap:

- Introduceer per kritisch dashboard een `DataResult<T>` patroon:
  - `status: "success" | "empty" | "error"`;
  - `data`;
  - `message`;
  - `source`.

Begin niet overal tegelijk. Start met:

1. `/admin/dashboard`
2. `/instructeur/leerlingen`
3. `/instructeur/lessen`
4. `/leerling/dashboard`
5. `/leerling/boekingen`

## Controleprincipes Voor Nieuwe Features

Elke nieuwe kaart, knop of statistiek moet voldoen aan deze regels:

1. Toont echte Supabase-data, of duidelijk statische content.
2. Toont een lege state wanneer er geen records zijn.
3. Toont een foutstate wanneer een kritieke query faalt.
4. Is alleen zichtbaar voor de juiste rol.
5. Heeft een werkende actie of link als het klikbaar oogt.
6. Gebruikt geen demo-, seed- of hardcoded records in productie.

## Conclusie

De website is op de hoofdflows betrouwbaar genoeg om verder te hardenen. De belangrijkste zichtbare mockachtige placeholder is aangepakt. Het volgende kwaliteitsniveau zit in expliciete error states per kritieke dataquery, zodat "geen data" en "data kon niet geladen worden" niet meer hetzelfde aanvoelen.
