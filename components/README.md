# Components structuur

Deze map is bedoeld als UI-laag. Houd componenten zo veel mogelijk klein, herbruikbaar en logisch gegroepeerd per domein.

## Indeling

| Map                                                          | Doel                                                                                          |
| ------------------------------------------------------------ | --------------------------------------------------------------------------------------------- |
| `ui/`                                                        | Basiscomponenten zoals knoppen, inputs, badges, cards, dialogs en tabs. Geen domeinlogica.    |
| `dashboard/`                                                 | Dashboard-shell, module-tabs, performance/skeletons en dashboard-compositie.                  |
| `instructor/`                                                | Instructeurflows zoals leerlingen, lessen, beschikbaarheid, feedback en planning.             |
| `learner/` en `learners/`                                    | Leerlinggerichte UI. Bij nieuwe code liever `learner/` gebruiken en later dubbeling opruimen. |
| `admin/`                                                     | Beheer- en supportcomponenten. Alleen admin-specifieke acties.                                |
| `calendar/`, `lessons/`, `progress/`, `packages/`, `income/` | Domeinspecifieke bouwblokken die door meerdere pagina's gebruikt kunnen worden.               |
| `shared/`                                                    | Rol-overstijgende componenten zoals audit-tijdlijnen en statuskaarten.                        |

## UI-regels

- Gebruik eerst `components/ui/*` voordat je nieuwe styling zelf uitschrijft.
- Gebruik `Card size="sm"` voor compacte dashboardpanelen.
- Grote dashboards moeten bestaan uit kleine sectiecomponenten, geen lange monolieten.
- Sidebar en module-tabs tonen hoofdstructuur; details horen in pagina-tabs of panels.
- Lege states moeten altijd uitleg plus een logische vervolgstap tonen.
- Databasefouten mogen niet hetzelfde voelen als "geen data".
- Houd radius meestal op `rounded-lg` of `rounded-xl`; gebruik grotere radius alleen voor echte modals of hero-achtige vlakken.
- Vermijd zware gradients in standaardpanelen. Gebruik kleur vooral voor status, iconen en badges.

## Volgende opschoonstappen

1. `components/instructor/students-board.tsx` opsplitsen in tabs/panels.
2. `components/instructor/lessons-board.tsx` opsplitsen in kalender, lijsten en dialogs.
3. `components/packages/package-studio.tsx` opsplitsen in catalogus, editor en validatie.
4. Dubbeling tussen `learner/` en `learners/` inventariseren voordat er iets wordt verplaatst.
