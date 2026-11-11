# Flyttehjelpen

En mobiltilpasset demo som lager en personlig flyttetidslinje fra boligtype,
husstand, flyttedato og valgfrie behov. Bygget med React 19, React Router 8,
TypeScript og Tailwind CSS 4.

## Kjør lokalt

```bash
npm install
npm run dev
```

Åpne http://localhost:5173. Velg «Prøv en eksempelreise» for en ferdig utfylt
samboerflytting fra leid til eid bolig, med innflytting 35 dager frem i tid.

## Demoens funksjoner

- Tre kartleggingssteg, med manuell adresse eller adresseforslag fra Kartverket.
- Personlig tidslinje på `/tidslinje`, med anbefalte tidspunkter og neste steg.
- Oppgavesvar, avkryssinger og statusene gjenstår, venter, ferdig og gjelder ikke.
- Filtrering og fremdrift basert på relevante oppgaver.
- Et generisk forsikringsrelatert partnertilbud, tydelig merket demo.
- «Start på nytt» for å slette planen eller laste eksempelreisen på nytt.

## Lagring og avgrensning

Kartlegging (inkludert adresser), sist besøkte kartleggingssteg, oppgavesvar,
avkryssinger og statuser lagres i `localStorage` under `flyttehjelpen:v1`.
Data valideres ved innlesing. Lagring skjer først etter innlesing, ved endringer.
Oppgaver som blir irrelevante etter endret kartlegging skjules, men beholder
status hvis de senere kommer tilbake. Endringer i dato flytter anbefalte
tidspunkter uten å nullstille svar. «Start på nytt» sletter den lokale planen.

Planen deles ikke mellom nettlesere eller enheter. Det finnes ingen innlogging,
backend, søknadsinnsending eller kjøpsintegrasjon. Kartverkets adressesøk mottar
søkestrengen når brukeren skriver i et adressefelt; manuelt skrevet adresse
godtas også hvis tjenesten ikke svarer. Ingen miljøvariabler kreves.

Oppgaveinnhold er veiledende demoeksempler. Anbefalte tidspunkter er ikke
juridiske frister. Dekning og aktuelle krav må avklares hos riktig tilbyder
eller offentlig tjeneste.

## Kvalitetssjekker

Node.js 22.18+ anbefales (testene bruker innebygd TypeScript-støtte).

```bash
npm test
npm run typecheck
npm run build
```

Manuell gjennomgang: kartlegg alene/samboer, velg leid/eid, lag planen,
åpne forsikringssteget, endre svar og avkryssinger, oppdater siden, fullfør og
angre oppgaver, prøv filtrene og endre kartlegging. Kontroller mobilbredde,
tastaturnavigasjon, ukjent dato, manuell adresse og tilbakestilling.

## Publisering

`react-router.config.ts` bruker `ssr: false`. Publiser `build/client/` til en
statisk host med fallback til `index.html` for klientruter som `/tidslinje`.
Nettleser-API-er brukes kun i effekter og hendelser, slik at bygg/prerendering
ikke krever `window`, `document` eller `localStorage`.
