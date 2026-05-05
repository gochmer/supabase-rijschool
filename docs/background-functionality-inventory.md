# Background Functionality Inventory

Datum: 5 mei 2026

Doel: vastleggen welke bestaande achtergrondfunctionaliteiten, scripts en componenten al zichtbaar zijn, welke intern moeten blijven en welke nog beter in de juiste gebruikersflow geplaatst moeten worden.

Deze inventarisatie hoort bij `docs/background-functionality-audit-plan.md`.

## Scanbereik

Gecontroleerde gebieden:

- `lib/actions/`: 30 action-bestanden
- `lib/data/`: 21 data-bestanden
- `app/api/`: 4 API-routes
- `scripts/`: 14 scripts
- `components/`: 145+ component- en helperbestanden
- `app/(dashboard)/`: leerling-, instructeur- en adminroutes

## Hoofdconclusie

Het platform heeft al veel functionaliteit netjes zichtbaar gemaakt. Vooral pakketkoppeling, audit, voortgang, documenten, voertuigen, support, berichten, betalingen en regie zijn al verwerkt in concrete pagina's en flows.

De belangrijkste resterende kans is niet "meer knoppen toevoegen", maar een paar bestaande achtergrondfuncties beter plaatsen op het moment dat de gebruiker ze nodig heeft.

## Goed zichtbaar en behouden

| Functionaliteit | Locatie | Rol | Huidige UI | Status | Advies |
| --- | --- | --- | --- | --- | --- |
| Pakket koppelen, vervangen en loskoppelen | `lib/actions/student-package-assignment.ts`, `components/admin/package-assignment-select.tsx`, `components/instructor/student-package-dialog.tsx` | Admin, instructeur | `/admin/leerlingen`, `/instructeur/leerlingen` | `zichtbaar-en-goed` | Behouden en blijven testen met `npm run qa:packages`. |
| Audit tijdlijn per leerling | `components/shared/student-audit-timeline.tsx` | Admin, instructeur | `/admin/leerlingen`, `/instructeur/leerlingen` | `zichtbaar-en-goed` | Behouden. Goed voor support/debugging. |
| Admin audit logboek en CSV-export | `app/(dashboard)/admin/audit`, `app/api/admin/audit/export` | Admin | `/admin/audit` | `admin-only` | Behouden. Volgende stap: retentiebeleid en exportbeleid. |
| Leerlingvoortgang en skills | `lib/actions/student-progress.ts`, `components/progress/*`, `components/instructor/progress-tracking-system-panel.tsx` | Leerling, instructeur | `/leerling/voortgang`, `/leerling/profiel`, `/instructeur/leerlingen` | `zichtbaar-en-goed` | Behouden. Extra koppeling maken vanuit afgeronde les. |
| Lesnotities en feedback | `saveStudentProgressLessonNoteAction`, `StudentProgressLessonNoteEditor` | Instructeur, leerling | `/instructeur/leerlingen`, leerling voortgang/profiel read-only | `zichtbaar-en-goed` | Behouden. Actie openen na "les afgerond". |
| Lesson compass | `lib/actions/lesson-compass.ts`, `components/lessons/shared-lesson-compass.tsx` | Leerling, instructeur | `/leerling/dashboard` | `zichtbaar-maar-kan-beter` | Ook tonen bij boekingen/lesdetail, zodat het niet alleen dashboard-afhankelijk is. |
| Les check-ins | `lib/actions/lesson-checkins.ts`, `components/lessons/lesson-checkin-board.tsx` | Leerling, instructeur | `/leerling/dashboard` | `zichtbaar-maar-kan-beter` | Ook bereikbaar maken via volgende les/boekingen. |
| Leerling documenten | `lib/actions/learner-experience.ts` | Leerling | `/leerling/documenten` | `zichtbaar-en-goed` | Behouden. Later documentstatus sterker terug laten komen op dashboard. |
| Leerling supporttickets | `createLearnerSupportTicketFormAction` | Leerling | `/leerling/support` | `zichtbaar-en-goed` | Behouden. Later supportstatus op dashboard tonen bij open tickets. |
| Leerling leerpreferenties | `updateLearnerLearningPreferencesFormAction` | Leerling | `/leerling/lesmateriaal`, `/leerling/voortgang` | `zichtbaar-en-goed` | Behouden. Later gebruiken voor gepersonaliseerde tips. |
| Checkout/betalingen | `startStudentCheckoutFormAction` | Leerling | `/leerling/betalingen` | `zichtbaar-en-goed` | Behouden. Stripe webhook blijft intern. |
| Instructeur documenten | `uploadInstructorDocumentAction`, `deleteInstructorDocumentAction` | Instructeur | `/instructeur/documenten`, `/instructeur/regie` signalen | `zichtbaar-en-goed` | Behouden. |
| Instructeur voertuigen | `createInstructorVehicleAction`, `updateInstructorVehicleAction`, `deleteInstructorVehicleAction` | Instructeur | `/instructeur/voertuigen`, `/instructeur/regie` signalen | `zichtbaar-en-goed` | Behouden. |
| Instellingen voor online boeken, lesduur en annuleren | `instructor-online-booking`, `instructor-lesson-durations`, `instructor-lesson-cancellation` | Instructeur | `/instructeur/instellingen` | `zichtbaar-en-goed` | Behouden. |
| Smart week planning | `SmartWeekPlanningPanel`, `buildSmartWeekPlanningModel` | Instructeur | `/instructeur/regie` | `zichtbaar-en-goed` | Behouden. Later uitbreiden naar bevestigbare planningvoorstellen. |
| Slimme berichttemplates | `getInstructorMessageSmartTemplates`, `MessageCenter` | Instructeur | `/instructeur/berichten` | `zichtbaar-en-goed` | Behouden. |
| Inkomsten, ledger, reminders en groei-inzichten | `instructor-income-ledger`, `InstructorIncomeTabs`, `InstructorGrowthRadar` | Instructeur | `/instructeur/inkomsten` | `zichtbaar-en-goed` | Behouden. Let op: reminder-acties blijven rolgebonden. |
| Reviews, replies, reports en moderatie | `reviews.ts`, review componenten | Leerling, instructeur, admin | `/leerling/reviews`, `/instructeur/reviews`, `/admin/reviews` | `zichtbaar-en-goed` | Behouden. |

## Verborgen maar bruikbaar

Deze onderdelen bestaan technisch al, maar kunnen nog beter in de gebruikersreis worden geplaatst.

| Functionaliteit | Locatie | Rol | Huidige status | Risico | Aanbevolen UI-bestemming | Actie |
| --- | --- | --- | --- | --- | --- | --- |
| Proeflesstatus en blokkaderegel | `lib/data/trial-lessons.ts`, meerdere lesson actions | Leerling, instructeur, admin | Wordt technisch afgedwongen, maar status is niet overal duidelijk zichtbaar | Middel | `/leerling/boekingen`, `/instructeur/leerlingen`, `/admin/leerlingen` | Voeg statuskaart toe: beschikbaar, aangevraagd, gepland, afgerond, niet beschikbaar. |
| Driver journey status sync | `lib/data/driver-journey.ts` | Leerling, instructeur | Wordt intern gesynchroniseerd | Middel | Leerlingdashboard, instructeur leerlingdetail | Toon compacte journey status en volgende stap. |
| Les check-in vanuit lescontext | `lesson-checkins`, `lesson-checkin-board` | Leerling, instructeur | Vooral zichtbaar op leerlingdashboard | Laag | `/leerling/boekingen`, `/instructeur/lessen` detail | Maak check-in bereikbaar vanuit de eerstvolgende les. |
| Lesson compass vanuit lescontext | `lesson-compass`, `shared-lesson-compass` | Leerling, instructeur | Vooral zichtbaar op leerlingdashboard | Laag | `/leerling/boekingen`, `/instructeur/lessen` detail | Toon compasskaart bij relevante les of leerling. |
| Feedback/progress na afgeronde les | `updateLessonAttendanceAction`, `saveStudentProgress*` | Instructeur | Functionaliteit bestaat los | Middel | `/instructeur/lessen` en `/instructeur/leerlingen` | Na "les afgerond" direct feedback/voortgang openen. |
| Cron verwerking zichtbaar maken als status | `app/api/cron/*`, `lib/lesson-reminders`, `lib/payment-reminders` | Admin | Intern en secret-protected | Hoog | `/admin/instellingen` of later `/admin/systeem` | Alleen read-only status tonen: geconfigureerd/niet geconfigureerd, geen handmatige run zonder extra bevestiging. |
| Productie-QA scripts als checklist | `scripts/playwright-*`, `scripts/package-assignment-qa-check.mjs` | Intern/admin ontwikkeling | Alleen CLI | Hoog | Documentatie, niet in app | Niet zichtbaar maken voor gebruikers. Wel opnemen in productie-checklist. |

## Intern houden

Deze onderdelen mogen niet als normale UI-actie zichtbaar worden.

| Onderdeel | Locatie | Reden | Advies |
| --- | --- | --- | --- |
| Demo seed | `scripts/supabase-seed-demo.mjs` | Schrijft demo-data naar Supabase | Alleen development/handmatig via script. Nooit in productie-UI. |
| QA scripts | `scripts/playwright-*.mjs`, `scripts/package-assignment-qa-check.mjs` | Maakt testaccounts/data aan en verwijdert data | Intern houden. Alleen documenteren in release/QA-flow. |
| Doctor en linkcheck | `scripts/doctor.mjs`, `scripts/check-internal-links.mjs` | Ontwikkeltools | Intern houden. Eventueel in docs noemen. |
| Stripe webhook | `app/api/stripe/webhook/route.ts` | Externe webhook met signature-check | Niet zichtbaar maken. Alleen status/logging via admin mogelijk. |
| Cron endpoints | `app/api/cron/*` | Secret-protected verwerking | Geen publieke knop. Alleen admin read-only status of strikt bevestigde run. |
| Runtime safety helpers | `lib/data/runtime-safety.ts` | Productie/data-fallback bewaking | Intern houden. Resultaat zichtbaar via lege/error states, niet als functie. |
| Scheduling conflict engine | `lib/data/scheduling-conflicts.ts` | Beslislogica | Intern houden. Resultaat tonen als conflictmelding in planningflows. |

## Mogelijke duplicatie of opruimkansen

| Onderdeel | Locatie | Observatie | Advies |
| --- | --- | --- | --- |
| `TrendCard` bestaat twee keer | `components/dashboard/trend-card.tsx`, `components/income/trend-card.tsx` | Waarschijnlijk visueel vergelijkbaar maar domeinspecifiek | Later vergelijken en eventueel centraliseren. Nu niet zomaar verwijderen. |
| Dashboard versus domeincomponenten | `components/dashboard/*`, `components/instructor/*`, `components/learners/*` | Sommige dashboardcomponenten zijn compositie, andere domeinlogica | Dashboard als shell/compositie houden; domeinlogica in domeinfolders houden. |
| Grote pagina `/instructeur/inkomsten` | `app/(dashboard)/instructeur/inkomsten/page.tsx` | Veel UI en forms in één routebestand | Later opsplitsen in kleinere componenten, zonder gedrag te wijzigen. |
| Grote component `students-board.tsx` | `components/instructor/students-board.tsx` | Veel leerlingbeheer, voortgang en dialogs in één component | Later verder opdelen rond tabs/dialogs. Eerst stabiel houden. |

## Prioriteiten

### Prioriteit 1

1. Proeflesstatus zichtbaar maken op leerling-, instructeur- en adminplekken.
2. Na "les afgerond" direct voortgang/feedback laten openen.
3. Lesson compass en check-ins koppelen aan boekingen/lesdetail, niet alleen dashboard.

### Prioriteit 2

1. Admin systeemstatus maken voor cron/webhook/omgeving, read-only.
2. Driver journey status compacter tonen op leerlingdashboard en instructeur leerlingdetail.
3. Productie-QA scripts opnemen in `production-readiness-checklist.md`.

### Prioriteit 3

1. Duplicatie tussen dashboard- en domeincomponenten opruimen.
2. Grote routebestanden opdelen.
3. Admin instellingen omzetten van placeholder/roadmap naar echte beheerblokken wanneer de onderliggende data bestaat.

## Beslissing per rol

### Leerling

Nu al goed zichtbaar:

- Dashboard
- Voortgang
- Boekingen
- Betalingen
- Documenten
- Lesmateriaal
- Berichten
- Support
- Reviews

Nog beter maken:

- Proeflesstatus duidelijk tonen.
- Check-in en lescompass bij de volgende les tonen.
- Open supporttickets en documentstatus compacter op dashboard tonen.

### Instructeur

Nu al goed zichtbaar:

- Regie
- Lessen/planning
- Beschikbaarheid
- Aanvragen
- Leerlingenbeheer
- Voortgang
- Documenten
- Voertuigen
- Inkomsten
- Berichten met slimme templates

Nog beter maken:

- Feedbackflow automatisch starten na afronden les.
- Proeflesstatus bij leerlingdetail tonen.
- Smart week planning uitbreiden naar bevestigbare voorstellen.

### Admin

Nu al goed zichtbaar:

- Gebruikers
- Instructeurs
- Leerlingen
- Lessen
- Betalingen
- Pakketten
- Reviews
- Support
- Audit

Nog beter maken:

- Read-only systeemstatus voor cron/webhook/env.
- Proeflesstatus en journey status in leerlingbeheer.
- Compliancebeleid voor auditretentie en exportbevestiging.

## Aanbevolen volgende stap

Start met de proeflesstatus, omdat die functioneel belangrijk is en nu vooral technisch wordt afgedwongen. Maak één gedeelde statuspresentatie en gebruik die op:

- `/leerling/boekingen`
- `/instructeur/leerlingen`
- `/admin/leerlingen`

Daarna pas de feedbackflow na afgeronde les oppakken.
