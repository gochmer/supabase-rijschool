# Productiechecklist

Deze checklist is bedoeld als laatste controle voordat er weer nieuwe grote
features bijkomen. Eerst de bestaande flows betrouwbaar en rustig maken, daarna
pas verder uitbreiden.

## Leerling

- Registratie en login werken zonder handmatige hulp.
- Proefles kan maar een keer worden aangevraagd of ingepland.
- Na proefles is duidelijk wat de volgende stap is: pakket kiezen of vervolgles.
- Pakketstatus is zichtbaar: totaal, gebruikt, gepland en resterend.
- Volgende les staat op dashboard, boekingen en voortgang consistent.
- Feedback van instructeur verschijnt in voortgang en lesmateriaal.
- Betaling kan worden gestart, geannuleerd en bevestigd zonder dubbele status.
- Documenten uploaden, openen en verwijderen werkt gecontroleerd.
- Supportvraag kan worden aangemaakt zonder dubbele tickets.
- Notificaties kunnen per stuk en in bulk gelezen worden.

## Instructeur

- `/instructeur/regie` is de primaire startpagina na login.
- Aanvragen kunnen vanuit regie of aanvragenlijst worden geaccepteerd/geweigerd.
- Les plannen vanuit agenda/slot opent dezelfde planningservaring.
- Les afronden opent of ondersteunt voortgang en feedback.
- Leerlingprogressie, pakketstatus en signalen zijn consistent zichtbaar.
- Documenten uploaden/verwijderen werkt zonder halve opslagrecords.
- Voertuigen toevoegen/bewerken/verwijderen voorkomt dubbele kentekens.
- Beschikbaarheid, lessen en aanvragen gebruiken dezelfde planningstaal.
- Regie toont alleen echte acties en geen demo/fallbackdata.

## Admin

- Admin dashboards tonen lege states wanneer er geen data is.
- Gebruikers, instructeurs, leerlingen en lessen laden zonder `SELECT *`-risico.
- Betalingen tonen echte betaalstatus en geen mockdata.
- Supportoverzicht toont tickets vanuit Supabase.
- Pakketten en reviews zijn beheerbaar zonder dubbele statusvelden.
- Admin kan productiestatus controleren zonder leerling/instructeurflow te breken.

## Visuele QA

- Test minimaal desktop 1440px, laptop 1280px en mobiel 390px breed.
- Controleer dat dashboards niet horizontaal scrollen.
- Controleer dialogs op 1280px en mobiel.
- Controleer lege states, error states en loading skeletons.
- Controleer dat de sidebar niet te vol voelt per rol.

## End-to-end flow

1. Leerling registreert.
2. Leerling boekt proefles.
3. Instructeur accepteert proefles.
4. Proefles wordt afgerond.
5. Pakket wordt gekozen of gekoppeld.
6. Vervolglessen worden ingepland.
7. Instructeur vult feedback en skills in.
8. Leerling ziet voortgang en volgende actie.
9. Betaling wordt gestart en bevestigd.
10. Notificaties verschijnen op de juiste momenten.

Pas als deze flow groen is, is het verstandig om weer verder te bouwen aan
agenda-integratie, auto-planning of AI-suggesties.
