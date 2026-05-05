# Interface en structuur audit

Datum: 5 mei 2026

Doel: controleren of pagina's, kaarten, tabellen, knoppen, acties en statussen logisch geplaatst zijn en of de interface rustiger en professioneler kan aanvoelen zonder functies te verwijderen.

## Samenvatting

De basisstructuur is goed: leerling, instructeur en admin hebben duidelijke omgevingen en de modulebalk helpt om subpagina's logisch te groeperen. De grootste UX-risico's zitten nu in dichtheid en onderhoudbaarheid:

- sommige pagina's zijn erg groot;
- sommige dashboardblokken namen relatief veel verticale ruimte;
- module-tabs toonden te veel tekst tegelijk;
- tabellen en statcards konden compacter zonder informatieverlies;
- grote routebestanden maken toekomstige wijzigingen foutgevoeliger.

## Grootste bestanden

| Bestand                                              | Observatie                                                        | Advies                                                  |
| ---------------------------------------------------- | ----------------------------------------------------------------- | ------------------------------------------------------- |
| `app/(dashboard)/instructeur/inkomsten/page.tsx`     | Zeer groot routebestand met veel financieel gedrag.               | Opsplitsen in kleinere finance panels.                  |
| `components/instructor/lessons-board.tsx`            | Bevat agenda, lijst, dialogs en planninglogica.                   | Later splitsen in weekplanner, lijsten en dialog-regie. |
| `components/instructor/students-board.tsx`           | Bevat leerlingdetail, voortgang, planning, pakketten en feedback. | Eerst opsplitsen in tab/panel componenten.              |
| `components/packages/package-studio.tsx`             | Groot pakketbeheer.                                               | Later opdelen in catalogus, formulieren en validatie.   |
| `components/dashboard/instructor-command-center.tsx` | Veel cockpit-UI in een component.                                 | Later opsplitsen per sectie.                            |

## Doorgevoerde UI-verbeteringen

Er is bewust niet aan businesslogica of datastromen gezeten. De verbeteringen zijn op gedeelde UI-patronen toegepast:

- `PageHeader` compacter gemaakt;
- `MetricCard` compacter gemaakt;
- `DashboardStatCard` compacter gemaakt;
- `DataTableCard` compacter gemaakt;
- `DashboardModuleTabs` rustiger gemaakt door tabbeschrijvingen alleen nog als actieve modulecontext te tonen;
- `/instructeur/regie` compacter ingericht als cockpit: status bovenaan, neutrale KPI-kaarten, weekplanning naast acties en drie scanbare werkkaarten onderin;
- `/instructeur/dashboard` compacter gemaakt als analysepagina: rustige statusheader, neutralere KPI-kaarten, minder zware OS-panelen en een loading skeleton die dezelfde compacte structuur volgt;
- `/instructeur/leerlingen` opnieuw gesorteerd als werkruimte: status en primaire actie bovenaan, leerlingstatistieken en prioriteiten links, progress tracking rechts en daarna pas het volledige dossierbord;
- encoding van `Financiën` in modulelabels hersteld.

Effect: minder grote lege vlakken, minder verticale scroll en snellere scanbaarheid op dashboardpagina's.

## Rolstructuur

### Leerling

Logische hoofdflow:

1. Dashboard: volgende stap en status.
2. Leertraject: voortgang, boekingen en lesmateriaal.
3. Instructeurs: zoeken en koppelen.
4. Betalingen: pakket en betaalstatus.
5. Berichten: communicatie, notificaties en support.
6. Profiel: gegevens, documenten, reviews en instellingen.

Beoordeling: goed. Geen pagina's verwijderen. Wel blijven zorgen dat acties zoals betalen, les plannen en voortgang bekijken altijd vanuit het dashboard bereikbaar zijn.

### Instructeur

Logische hoofdflow:

1. Regie: dagelijkse cockpit.
2. Agenda: lessen, beschikbaarheid en aanvragen.
3. Leerlingen: voortgang, feedback, pakketten en audit.
4. Profiel: publieke presentatie en reviews.
5. Financiën: inkomsten en pakketten.
6. Instellingen: voorkeuren en feedbacktemplates.

Beoordeling: inhoudelijk sterk. Grootste winst zit nu in technische opsplitsing, niet in meer pagina's.

### Admin

Logische hoofdflow:

1. Dashboard: controlekamer.
2. Gebruikers: accounts, instructeurs en leerlingen.
3. Operatie: lessen, pakketten en betalingen.
4. Kwaliteit: reviews en support.
5. Audit/instellingen blijven subflows onder controlekamer.

Beoordeling: sidebar is nu rustiger en beheerfuncties blijven bereikbaar via module-tabs.

## Dubbel of mogelijk samenvoegen

| Onderdeel                                                            | Status                                                                    | Advies                                                                |
| -------------------------------------------------------------------- | ------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| `/instructeur/regie` en `/instructeur/dashboard`                     | Niet dubbel zolang dashboard analyse blijft en regie actiegericht blijft. | Behouden, maar dashboard niet als startpagina positioneren.           |
| `/leerling/berichten`, `/leerling/notificaties`, `/leerling/support` | Functioneel verwant.                                                      | Behouden als communicatie-module; later eventueel sterker integreren. |
| Admin gebruikers/instructeurs/leerlingen                             | Verwant, maar beheerbehoeftes verschillen.                                | Behouden, technisch componenten delen.                                |
| Instructeur pakketten/inkomsten                                      | Verwant onder financiën.                                                  | Behouden als subflows; inkomstenpagina later opsplitsen.              |

## UX-regels vanaf nu

- Sidebar toont hoofdmodules, geen losse subpagina-lijst.
- Module-tabs tonen subflows compact.
- Elke pagina moet bovenaan een duidelijke primaire actie of status hebben.
- Tabellen zijn beter voor beheer dan grote losse kaarten wanneer er veel records zijn.
- Grote kaarten alleen gebruiken wanneer ze echt besluitvorming ondersteunen.
- Lege states moeten uitleg + vervolgstap bevatten.
- Databasefouten mogen niet als lege state aanvoelen.

## Beste volgende stap

Splits grote componenten zonder gedrag te veranderen:

1. `components/instructor/students-board.tsx`
2. `components/instructor/lessons-board.tsx`
3. `app/(dashboard)/instructeur/inkomsten/page.tsx`

Daarna per rol een kliktest uitvoeren op de hoofdflows:

- leerling: les boeken, betaling afronden, voortgang bekijken;
- instructeur: aanvraag accepteren, les plannen, feedback opslaan;
- admin: pakket koppelen, audit zoeken, betaling controleren.
