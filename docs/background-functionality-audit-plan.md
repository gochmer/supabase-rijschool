# Background Functionality Audit Plan

Doel: alle bestaande achtergrondfunctionaliteiten, scripts, server-acties en verborgen flows controleren, beoordelen en waar relevant netjes zichtbaar maken in de juiste gebruikersinterface.

Het uitgangspunt is simpel: waardevolle functies mogen niet ongebruikt in de codebase blijven staan. Als een functie veilig, relevant en begrijpelijk is voor een gebruiker, moet deze logisch bereikbaar worden in de app. Als een functie technisch, intern of risicovol is, blijft deze afgeschermd en alleen beschikbaar voor de juiste rol of omgeving.

## Scope

Controleer alle bestaande onderdelen die mogelijk al waarde leveren maar nog niet of onvoldoende zichtbaar zijn:

- Server actions in `lib/actions/`
- Datafuncties in `lib/data/`
- API-routes in `app/api/`
- Scripts in `scripts/`
- Cron- en webhookflows
- Admin-only onderhoudsacties
- Notificatie-, audit-, betalings-, planning- en voortgangslogica
- Componenten die bestaan maar nog niet worden gebruikt
- Pagina's die bereikbaar zijn maar niet logisch in de navigatie of flow zitten

## Rolindeling

Elke functionaliteit moet expliciet aan een rol worden gekoppeld.

### Leerling

Functionaliteiten voor leerlingen horen bij:

- Dashboard
- Profiel
- Voortgang
- Boekingen
- Betalingen
- Documenten
- Lesmateriaal
- Notificaties
- Berichten
- Support

Voorbeelden van zichtbare vormen:

- Statuskaart
- Actieknop
- Volgende stap
- Waarschuwing
- Melding
- Detailoverzicht
- Uploadflow
- Betalingsactie

### Instructeur

Functionaliteiten voor instructeurs horen bij:

- Regie
- Leerlingenbeheer
- Planning
- Lessen
- Beschikbaarheid
- Aanvragen
- Voortgang
- Documenten
- Voertuigen
- Inkomsten

Voorbeelden van zichtbare vormen:

- Regiekaart
- Actielijst
- Leerling-signaal
- Planningvoorstel
- Feedbackactie
- Audit-tijdlijn
- Documentstatus
- Voertuigstatus

### Admin

Functionaliteiten voor admins horen bij:

- Admin dashboard
- Gebruikers
- Leerlingen
- Instructeurs
- Pakketten
- Betalingen
- Support
- Reviews
- Audit
- Instellingen

Voorbeelden van zichtbare vormen:

- Beheeractie
- Filterbaar overzicht
- Detaildrawer
- Auditregel
- Export
- Moderatieknop
- Statuscontrole
- Complianceoverzicht

## Beoordelingscriteria

Gebruik per functionaliteit deze vragen:

- Bestaat deze functie al technisch?
- Wordt deze functie ergens in de UI gebruikt?
- Voor welke rol is deze bedoeld?
- Is de functie veilig genoeg om zichtbaar te maken?
- Is extra autorisatie nodig?
- Past de functie in een bestaande pagina of is een nieuwe plek nodig?
- Heeft de gebruiker voldoende context om de actie te begrijpen?
- Is er een loading-, empty- en error-state?
- Is er logging of audit nodig?
- Moet deze functie worden getest in een QA-flow?

## Veiligheidsregels

Niet alles wat bestaat mag automatisch zichtbaar worden.

### Nooit publiek tonen

- Service-role acties
- Database-onderhoud
- Seed- of demo-scripts
- Cleanup-scripts
- Interne migratiehulpen
- Cron handmatige triggers zonder beveiliging
- Webhook-verwerking
- Debug- of testtools
- Gevoelige exports zonder admincontrole

### Alleen admin-only

- Audit export
- Gebruikersbeheer
- Betalingscorrecties
- Pakketcorrecties
- Moderatie
- Support escalatie
- Compliance-inzage
- Risicovolle correctie-acties

### Alleen instructeur

- Eigen leerlingen beheren
- Eigen planning beheren
- Feedback en voortgang vastleggen
- Beschikbaarheid aanpassen
- Pakketadvies geven
- Lesnotities bekijken of bewerken

### Alleen leerling

- Eigen boekingen
- Eigen betalingen
- Eigen voortgang
- Eigen documenten
- Eigen notificaties
- Eigen supportvragen

## Verwerkingsaanpak

### Stap 1: Inventarisatie

Maak een lijst van alle bestaande functies en scripts.

Te controleren locaties:

- `lib/actions/`
- `lib/data/`
- `app/api/`
- `scripts/`
- `components/`
- `app/(dashboard)/`

Noteer per item:

- Bestandsnaam
- Functienaam of route
- Doel
- Rol
- Huidige zichtbaarheid
- Risico
- Aanbevolen plek in UI
- Actie: zichtbaar maken, verplaatsen, afschermen, documenteren of verwijderen

### Stap 2: Classificatie

Gebruik deze statuslabels:

- `zichtbaar-en-goed`
- `verborgen-maar-bruikbaar`
- `admin-only`
- `intern-houden`
- `dubbel-of-verouderd`
- `verwijderen-na-controle`

### Stap 3: UI-koppeling

Vertaal bruikbare achtergrondfunctionaliteit naar een duidelijke interfacevorm:

- Knop
- Kaart
- Statusbadge
- Tabelactie
- Detaildrawer
- Tijdlijn
- Notificatie
- Empty-state actie
- Waarschuwingscallout

Elke UI-actie moet duidelijk benoemen:

- Wat gebeurt er?
- Voor wie geldt het?
- Is het definitief?
- Heeft het gevolgen voor planning, betaling of voortgang?

### Stap 4: Autorisatiecontrole

Controleer voordat iets zichtbaar wordt:

- Server-side role check
- RLS of service-role gebruik
- Geen gevoelige data naar client
- Geen admin-data voor instructeur of leerling
- Geen leerlingdata van andere leerlingen
- Geen instructeurdata buiten eigen werkgebied

### Stap 5: QA en regressie

Elke zichtbaar gemaakte functionaliteit krijgt een testpunt.

Minimaal controleren:

- Leerling ziet alleen eigen data
- Instructeur ziet alleen eigen leerlingen/workspace
- Admin ziet beheerdata
- Loading-state werkt
- Empty-state werkt
- Error-state werkt
- Actie schrijft auditregel als dat nodig is
- Geen demo/fallback-data in productie

## Audit Template

Gebruik deze tabel tijdens de controle.

| Onderdeel | Locatie | Rol | Huidige status | Risico | UI-bestemming | Actie |
| --- | --- | --- | --- | --- | --- | --- |
| Voorbeeld: audit export | `app/api/admin/audit/export` | Admin | Zichtbaar via `/admin/audit` | Hoog | Admin Audit | Behouden + QA |
| Voorbeeld: package assignment QA | `scripts/package-assignment-qa-check.mjs` | Intern | Script-only | Hoog | Niet tonen | Intern houden |

## Definition of Done

Deze audit is pas klaar wanneer:

- Alle achtergrondfunctionaliteiten zijn geïnventariseerd.
- Elke functie een rol en status heeft.
- Bruikbare functies logisch zichtbaar zijn in de juiste flow.
- Risicovolle functies afgeschermd blijven.
- Dubbele of verouderde onderdelen zijn gemarkeerd.
- UI-acties duidelijke microcopy hebben.
- Autorisatie server-side gecontroleerd is.
- QA-checks of handmatige testpunten zijn vastgelegd.
- De navigatie overzichtelijk blijft en niet voller wordt zonder reden.

## Belangrijk Productprincipe

Niet meer knoppen toevoegen om meer te tonen. Eerst bepalen waar een functie in de reis thuishoort.

De gebruiker moet nooit denken: "Wat doet dit?"

De gebruiker moet denken: "Dit is precies de volgende logische stap."
