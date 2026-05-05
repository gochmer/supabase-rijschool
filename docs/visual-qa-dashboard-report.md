# Visual QA Dashboard Report

Datum: 5 mei 2026

Doel: controleren of de belangrijkste dashboardroutes visueel gezond blijven op mobiel, 1280px en 4K na de nieuwe modulebalk en recente structuurwijzigingen.

## Uitgevoerde Check

Command:

```bash
npm run playwright:dashboards
```

Resultaat:

```text
[dashboards] leerling: ok (tijdelijk testaccount)
[dashboards] instructeur: ok (tijdelijk testaccount)
[dashboards] admin: ok (tijdelijk testaccount)
[dashboards] Visual dashboard check afgerond.
```

## Geteste Viewports

| Viewport | Afmeting |
| --- | --- |
| Mobiel | 390 x 844 |
| 1280px | 1280 x 900 |
| 4K | 3840 x 2160 |

## Geteste Leerlingroutes

- `/leerling/dashboard`
- `/leerling/voortgang`
- `/leerling/profiel`
- `/leerling/boekingen`
- `/leerling/betalingen`
- `/leerling/berichten`
- `/leerling/documenten`
- `/leerling/lesmateriaal`

## Geteste Instructeurroutes

- `/instructeur/regie`
- `/instructeur/dashboard`
- `/instructeur/lessen`
- `/instructeur/beschikbaarheid`
- `/instructeur/aanvragen`
- `/instructeur/leerlingen`
- `/instructeur/pakketten`
- `/instructeur/instellingen`
- `/instructeur/inkomsten`

## Geteste Adminroutes

- `/admin/dashboard`
- `/admin/leerlingen`
- `/admin/lessen`
- `/admin/betalingen`
- `/admin/instructeurs`
- `/admin/support`
- `/admin/audit`
- `/admin/instellingen`

## Wat De Check Controleert

- Geen fatale runtime/error-tekst op de pagina.
- Geen horizontale overflow buiten de viewport.
- Geen vrijwel lege pagina's.
- De routes laden voor de juiste rol.
- Tijdelijke testaccounts kunnen inloggen en worden na afloop opgeruimd.

## Conclusie

De kritieke dashboardroutes zijn geslaagd op mobiel, 1280px en 4K. De nieuwe modulebalk veroorzaakt geen horizontale overflow en de belangrijkste leerling-, instructeur- en adminflows renderen zonder fatale fouten.

## Volgende Refactorstap

Nu de visuele basis groen is, kunnen grote bestanden veilig in kleinere onderdelen worden verdeeld. De beste volgorde:

1. `components/instructor/students-board.tsx` opsplitsen rond tabs, dialogs en statuskaarten.
2. `app/(dashboard)/instructeur/inkomsten/page.tsx` opsplitsen in cockpit, facturen, kosten, cashflow en exportsecties.
3. Daarna pas kleinere dubbele presentational components vergelijken, zoals `TrendCard`.
