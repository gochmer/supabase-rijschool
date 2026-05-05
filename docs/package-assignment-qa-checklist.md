# Package Assignment QA Checklist

Doel: valideren dat een pakket niet meer losstaat van de leerling, maar betrouwbaar doorwerkt naar planning, betaling, voortgang en zichtbaarheid per rol.

## Rollen

### Admin

- [ ] Ziet leerlingen zonder pakket in `/admin/leerlingen`.
- [ ] Kan een leerling selecteren en een pakket koppelen.
- [ ] Ziet pakketnaam, pakketstatus, toegewezen datum, betalingstatus en lesverbruik.
- [ ] Kan een pakket alleen vervangen met een bewuste bevestiging.
- [ ] Kan een pakket loskoppelen en ziet daarna dat planning niet meer vrijgegeven is.
- [ ] Mag alle leerlingen en pakketten beheren.

### Instructeur

- [ ] Ziet alleen leerlingen uit de eigen werkplek in `/instructeur/leerlingen`.
- [ ] Ziet gekoppeld pakket, status, betalingstatus en resterende lessen.
- [ ] Kan alleen eigen pakketten koppelen.
- [ ] Kan geplande lessen blijven openen nadat een pakket gekoppeld is.
- [ ] Ziet duidelijke waarschuwing wanneer een leerling nog geen pakket heeft.

### Leerling

- [ ] Ziet eigen pakket op `/leerling/profiel`.
- [ ] Ziet pakketstatus en lesverbruik op `/leerling/voortgang`.
- [ ] Ziet pakketstatus en betalingactie op `/leerling/betalingen`.
- [ ] Ziet in `/leerling/boekingen` waarom plannen wel of niet mogelijk is.
- [ ] Ziet nooit pakketdata van een andere leerling.

## End-to-End Flow

- [ ] Leerling start zonder pakket.
- [ ] Admin of instructeur koppelt pakket.
- [ ] Betaling wordt automatisch aangemaakt of hergebruikt.
- [ ] Planningrechten worden vrijgegeven.
- [ ] Bestaande open/geplande lessen worden aan het pakket gekoppeld.
- [ ] Betaling kan op `betaald` komen.
- [ ] Status wordt `Actief` wanneer betaling klaar is en er lessen over zijn.
- [ ] Lessen tellen mee als gepland/gevolgd.
- [ ] Status wordt `Volledig gebruikt` wanneer alle lessen gepland of gevolgd zijn.

## Edge Cases

- [ ] Zelfde pakket opnieuw koppelen maakt geen dubbele betaling aan.
- [ ] Pakket vervangen vereist bewuste bevestiging.
- [ ] Oude open betaling wordt gesloten bij vervangen of loskoppelen.
- [ ] Geplande lessen worden omgehangen naar het nieuwe pakket.
- [ ] Afgeronde historische lessen blijven gekoppeld aan hun oorspronkelijke pakket.
- [ ] Betaling `mislukt` toont dat betaling nodig blijft.
- [ ] Inactief pakket toont `Verlopen`.
- [ ] Loskoppelen zet `leerlingen.pakket_id` terug naar leeg.
- [ ] Loskoppelen zet zelf-inplannen uit.

## Audit Trail

Geautomatiseerd via `public.audit_events`. Elke gevoelige pakketactie schrijft een support- en debuggingregel met actor, leerling, pakket, betaling en metadata.

- [ ] `package_assigned` legt vast wie pakket X aan leerling Y koppelde.
- [ ] `package_replaced` legt vast welk pakket bewust is vervangen.
- [ ] `package_unlinked` legt vast wanneer een pakket is losgekoppeld.
- [ ] `package_payment_created` of `package_payment_reused` legt vast welke betaling bij het pakket hoort.
- [ ] `package_payment_closed` legt vast welke open betaling automatisch is gesloten.
- [ ] `package_payment_paid` legt vast wanneer Stripe een pakketbetaling bevestigt.
- [ ] `package_lessons_attached` legt vast hoeveel open/geplande lessen aan het pakket zijn gekoppeld.
- [ ] `package_planning_released` en `package_planning_disabled` leggen vast wanneer zelf plannen aan of uit is gezet.
- [ ] Admin ziet de tijdlijn per leerling in `/admin/leerlingen`.
- [ ] Instructeur ziet de tijdlijn bij de geselecteerde leerling in `/instructeur/leerlingen`.
- [ ] Support kan filteren op pakket-, betaling-, planning- en lesacties.
- [ ] Support kan een auditregel openen en metadata zien zonder databaseconsole.
- [ ] Admin kan in `/admin/audit` alle auditregels zoeken, filteren en exporteren.
- [ ] CSV-export loopt via een admin-only serverroute met datum-, actor-, leerling-, pakket- en betalingfilters.

RLS-regel: admins mogen alles zien, instructeurs alleen auditregels van eigen leerlingen/werkplek en leerlingen alleen eigen auditregels.

## Automatische Check

Draai:

```bash
npm run qa:packages
```

Deze check maakt tijdelijke testgebruikers aan, test de keten per rol en ruimt de testdata daarna weer op.
De check valideert ook dat de belangrijkste auditregels in `audit_events` ontstaan.
