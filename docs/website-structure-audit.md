# Website Structure Audit

Datum: 5 mei 2026

Doel: controleren of de website logisch is opgebouwd per rol, waar overlap zit, welke functies beter zichtbaar moeten worden en welke onderdelen later veilig opgeschoond kunnen worden.

## Hoofdconclusie

Het platform is inhoudelijk sterk en heeft inmiddels de belangrijkste productlagen:

- planning en aanvragen;
- voortgang, feedback en lesdetail;
- pakketten, betalingen en audit;
- regie, documenten, voertuigen en instellingen;
- leerlingdashboard, lesmateriaal, support en notificaties;
- adminbeheer voor gebruikers, lessen, betalingen, reviews, support en audit.

De grootste winst zit nu niet in meer pagina's, maar in ordening. Elke rol moet sneller begrijpen: waar ben ik, welke module bekijk ik, en wat is mijn volgende actie?

## Verbetering Doorgevoerd

Er is een gedeelde modulebalk toegevoegd voor alle dashboardrollen:

- leerling;
- instructeur;
- admin.

Deze modulebalk groepeert subpagina's onder logische modules zonder extra losse sidebar-items toe te voegen. De oude instructeur-specifieke modulebalk is vervangen door een generieke versie.

Nieuwe centrale component:

- `components/dashboard/dashboard-module-tabs.tsx`

Aangesloten op:

- `app/(dashboard)/leerling/layout.tsx`
- `app/(dashboard)/instructeur/layout.tsx`
- `app/(dashboard)/admin/layout.tsx`

## Gewenste Informatiearchitectuur

### Leerling

Hoofdmodules:

| Module | Pagina's | Functie |
| --- | --- | --- |
| Leertraject | Dashboard, Voortgang, Boekingen, Lesmateriaal | Alles rond leren, plannen en voortgang. |
| Instructeurs | Instructeurs zoeken | Vergelijken en kiezen. |
| Betalingen | Betalingen en pakketten | Financiele status en checkout. |
| Communicatie | Berichten, Meldingen, Support | Contact, updates en hulpvragen. |
| Profiel | Profiel, Documenten, Reviews, Instellingen | Account, dossier en voorkeuren. |

Beoordeling: logisch en bruikbaar. Support, notificaties, documenten en reviews hoeven niet prominenter in de sidebar, maar moeten wel duidelijk bereikbaar zijn binnen hun module. Dat is nu beter gemaakt met module-tabs.

### Instructeur

Hoofdmodules:

| Module | Pagina's | Functie |
| --- | --- | --- |
| Regie | Vandaag, Onboarding, Documenten, Voertuigen | Dagelijkse cockpit en operationele basis. |
| Profiel | Gegevens, Openbare gids, Reviews | Publieke presentatie en reputatie. |
| Agenda | Lessen, Beschikbaarheid, Aanvragen | Planning en lesaanvragen. |
| Leerlingen | Leerlingenbeheer | Pakketten, voortgang, audit en feedback. |
| Financien | Inkomsten, Pakketten | Geldstromen en aanbod. |

Beoordeling: `/instructeur/regie` is terecht de startpagina. `/instructeur/dashboard` kan blijven bestaan als analyse/rapportagepagina, maar mag niet de primaire werkcockpit worden.

### Admin

Hoofdmodules:

| Module | Pagina's | Functie |
| --- | --- | --- |
| Controlekamer | Dashboard, Audit, Instellingen | Platformstatus, logboek en globale instellingen. |
| Gebruikers | Gebruikers, Instructeurs, Leerlingen | Accounts, rollen en profielkwaliteit. |
| Operatie | Lessen, Pakketten, Betalingen | Kernprocessen en commerciele status. |
| Kwaliteit | Reviews, Support | Moderatie, vertrouwen en klantvragen. |

Beoordeling: admin heeft veel pagina's, maar dat is functioneel logisch. De nieuwe modulebalk maakt dit rustiger zonder beheerfunctionaliteit te verstoppen.

## Pagina's Die Nodig Zijn

### Leerling

Behouden:

- `/leerling/dashboard`
- `/leerling/voortgang`
- `/leerling/boekingen`
- `/leerling/lesmateriaal`
- `/leerling/instructeurs`
- `/leerling/betalingen`
- `/leerling/berichten`
- `/leerling/notificaties`
- `/leerling/support`
- `/leerling/profiel`
- `/leerling/documenten`
- `/leerling/reviews`
- `/leerling/instellingen`

Geen directe verwijderkandidaten. Wel blijven groeperen via modules, niet alles even zwaar in de navigatie behandelen.

### Instructeur

Behouden:

- `/instructeur/regie`
- `/instructeur/dashboard`
- `/instructeur/lessen`
- `/instructeur/beschikbaarheid`
- `/instructeur/aanvragen`
- `/instructeur/leerlingen`
- `/instructeur/berichten`
- `/instructeur/profiel`
- `/instructeur/reviews`
- `/instructeur/documenten`
- `/instructeur/voertuigen`
- `/instructeur/onboarding`
- `/instructeur/inkomsten`
- `/instructeur/pakketten`
- `/instructeur/instellingen`

Let op: `/instructeur/dashboard` en `/instructeur/regie` mogen niet hetzelfde worden. Regie is actiegericht; dashboard is analyse/overzicht.

### Admin

Behouden:

- `/admin/dashboard`
- `/admin/gebruikers`
- `/admin/instructeurs`
- `/admin/leerlingen`
- `/admin/lessen`
- `/admin/betalingen`
- `/admin/pakketten`
- `/admin/reviews`
- `/admin/support`
- `/admin/audit`
- `/admin/instellingen`

Geen directe verwijderkandidaten. Adminpagina's zijn domeinmatig logisch.

## Mogelijke Overlap

| Onderdeel | Observatie | Advies |
| --- | --- | --- |
| Instructeur dashboard vs regie | Beide kunnen overzicht tonen. | Regie blijft startpunt en actiecentrum. Dashboard alleen analyse/rapportage. |
| Aanvragen bij agenda en leerlingen | Aanvragen raken zowel planning als leerlinginstroom. | Prima onder Agenda houden. In leerlingen alleen contextueel tonen bij leerlingdetails. |
| Documenten op profiel en losse documentpagina | Documenten horen bij profiel/compliance, maar verdienen eigen werkplek. | Behouden als subflow. Niet als losse hoofdactie zwaarder maken. |
| Reviews bij profiel en adminkwaliteit | Reviews zijn profielwaarde, maar ook moderatie. | Per rol apart houden: leerling schrijft, instructeur reageert, admin modereert. |
| Grote inkomstenpagina | Veel functies in een routebestand. | Later technisch opdelen, niet functioneel verwijderen. |
| `students-board.tsx` | Veel leerlingbeheer in een grote component. | Later splitsen in tabs/dialogs, gedrag eerst stabiel houden. |
| `TrendCard` dubbel | Bestaat in dashboard en income. | Later vergelijken en eventueel centraliseren. Niet blind verwijderen. |

## Verborgen Functionaliteit Die Zichtbaar Moet Blijven

Deze functies zijn waardevol en moeten goed in de flow zichtbaar blijven:

- proeflesstatus bij leerling, instructeur en admin;
- feedback na afgeronde les;
- lesdetailtijdlijn;
- check-ins en lesson compass rond boekingen;
- pakketkoppeling en pakketstatus;
- audit timeline per leerling;
- admin audit logboek;
- feedbacktemplates in instructeurinstellingen;
- feedback openstaande taken op regie/dashboard.

Deze functies zijn intern en moeten niet als normale gebruikersknop zichtbaar worden:

- cron endpoints;
- Stripe webhook;
- QA scripts;
- demo seed scripts;
- runtime fallback/debug helpers.

## UX Verbeterpunten

1. Elke hoofdflow moet een duidelijke eerstvolgende actie tonen.
2. Lege states moeten uitleggen wat er ontbreekt en waar de gebruiker heen kan.
3. Detailflows moeten terug kunnen naar de juiste lijst of planning.
4. Mobiele weergave moet vooral getest worden op:
   - weekplanner;
   - leerlingenkaart;
   - inkomstenpagina;
   - admin tabellen;
   - profielpagina's.
5. Lange pagina's moeten niet steeds nieuwe features bovenaan krijgen. Zet acties bovenaan, details lager.

## Technische Verbeterpunten

1. Grote routebestanden later opdelen in domeincomponenten.
2. Dubbele presentational components pas verwijderen na importscan.
3. Navigatieconfiguratie centraal blijven houden in `lib/navigation.ts`.
4. Modulegroepering centraal houden in `components/dashboard/dashboard-module-tabs.tsx`.
5. Geen technische scripts in de UI tonen zonder rolcontrole en duidelijke bevestiging.

## Beslissing Nu

Niet verwijderen op dit moment.

Wel gedaan:

- modulelogica per rol toegevoegd;
- instructeur-only modulecomponent vervangen door gedeelde component;
- leerling en admin krijgen nu dezelfde duidelijke modulecontext;
- instellingen staan niet meer ongemerkt onder de instructeur-regiemodule.

## Beste Volgende Stap

Voer een visuele QA uit op drie breedtes:

- mobiel;
- 1280px;
- 4K.

Focus daarbij op de nieuwe modulebalk, de weekplanner, leerlingenbeheer, profielpagina's en admin tabellen. Daarna pas gericht opruimen of componenten opsplitsen.

Status: uitgevoerd en vastgelegd in `docs/visual-qa-dashboard-report.md`.

## Tweede Structuurcontrole

Datum: 5 mei 2026

Aanleiding: opnieuw controleren of alle pagina's per rol logisch staan, of de navigatie rustig genoeg is en of belangrijke flows bereikbaar blijven zonder dat de sidebar te vol wordt.

### Route-inventaris

| Rol | Aantal dashboardroutes | Beoordeling |
| --- | ---: | --- |
| Leerling | 13 | Functioneel logisch, maar sidebar moest rustiger. Detailroutes horen onder modules. |
| Instructeur | 15 | Logisch gegroepeerd rond regie, agenda, leerlingen, profiel en financiën. |
| Admin | 11 | Functioneel nodig, maar niet allemaal als hoofditem in de sidebar. |

### Doorgevoerde Structuurverbetering

De sidebar is verder vereenvoudigd naar hoofdmodules. Pagina's zijn niet verwijderd; ze blijven bereikbaar via module-tabs, actiekaarten en contextlinks.

Leerling sidebar:

- Dashboard
- Leertraject
- Instructeurs
- Betalingen
- Berichten
- Profiel

Onder `Leertraject` vallen nu actief:

- `/leerling/voortgang`
- `/leerling/boekingen`
- `/leerling/lesmateriaal`

Onder `Profiel` vallen nu actief:

- `/leerling/profiel`
- `/leerling/documenten`
- `/leerling/reviews`
- `/leerling/instellingen`

Admin sidebar:

- Dashboard
- Gebruikers
- Operatie
- Kwaliteit

Onder `Dashboard` vallen:

- `/admin/dashboard`
- `/admin/audit`
- `/admin/instellingen`

Onder `Gebruikers` vallen:

- `/admin/gebruikers`
- `/admin/instructeurs`
- `/admin/leerlingen`

Onder `Operatie` vallen:

- `/admin/lessen`
- `/admin/pakketten`
- `/admin/betalingen`

Onder `Kwaliteit` vallen:

- `/admin/reviews`
- `/admin/support`

### Beoordeling Per Rol

#### Leerling

De leerlingomgeving heeft nu een heldere volgorde:

1. Dashboard: waar sta ik en wat is mijn volgende stap?
2. Leertraject: voortgang, lessen, voorbereiding en lesmateriaal.
3. Instructeurs: zoeken en koppelen.
4. Betalingen: pakket en betaalstatus.
5. Berichten: contact, meldingen en support.
6. Profiel: account, documenten, reviews en instellingen.

Geen directe verwijderkandidaten. `Notificaties`, `Support`, `Documenten`, `Reviews` en `Instellingen` zijn terecht subflows en hoeven niet als sidebar-hoofditem terug te komen.

#### Instructeur

De instructeuromgeving blijft bewust rijker, omdat dit een dagelijkse werkplek is:

1. Regie: cockpit en prioriteiten.
2. Dashboard: analyse en rapportage.
3. Profiel: publieke presentatie en reviews.
4. Agenda: lessen, beschikbaarheid en aanvragen.
5. Leerlingen: voortgang, pakketten, feedback en audit.
6. Berichten: communicatie.
7. Financiën: inkomsten en pakketten.
8. Instellingen: voorkeuren en templates.

Geen functionele samenvoeging nodig. Wel blijft technisch opdelen belangrijk voor grote bestanden zoals `students-board.tsx` en `/instructeur/inkomsten/page.tsx`.

#### Admin

De adminomgeving is teruggebracht naar beheerclusters:

1. Dashboard: controlekamer, audit en systeemstatus.
2. Gebruikers: accounts, instructeurs en leerlingen.
3. Operatie: lessen, pakketten en betalingen.
4. Kwaliteit: reviews en support.

Dit maakt de adminsidebar veel rustiger zonder beheerfunctionaliteit te verstoppen.

### Wat Niet Is Verwijderd

Er zijn geen routes verwijderd. Dit is bewust gedaan omdat veel pagina's onderdeel zijn van belangrijke flows of rol-specifieke subflows.

### Nog Te Controleren Later

- Of `/instructeur/dashboard` genoeg analysewaarde heeft naast `/instructeur/regie`.
- Of `/leerling/berichten` en `/leerling/notificaties` later sterker kunnen worden samengevoegd in één communicatiecentrum.
- Of admin `Gebruikers`, `Instructeurs` en `Leerlingen` technisch meer gedeelde componenten kunnen gebruiken.
- Of grote componenten kunnen worden opgesplitst zonder gedrag te veranderen.

## Beste Volgende Stap Na Deze Controle

Voer een kliktest uit op de nieuwe sidebarclusters:

1. Leerling: open alle modules en check of subpagina's via module-tabs bereikbaar blijven.
2. Instructeur: check dat agenda-subflows actief blijven onder `Agenda`.
3. Admin: check dat `Audit`, `Instellingen`, `Pakketten`, `Betalingen` en `Support` vindbaar blijven via module-tabs.

Daarna is de beste technische stap: grote route/componentbestanden opsplitsen, te beginnen met `components/instructor/students-board.tsx` en `app/(dashboard)/instructeur/inkomsten/page.tsx`.
