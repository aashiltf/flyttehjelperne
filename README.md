# Flyttehjelpen

En mobiltilpasset demo som lager en personlig flyttetidslinje fra boligtype,
husstand, datoer for overtakelse og innflytting og valgfrie behov. Bygget med React 19, React Router 8,
TypeScript og Tailwind CSS 4.

## Kjør lokalt

```bash
npm install
npm run dev
```

Åpne http://localhost:5173. Velg «Prøv en eksempelreise» for en ferdig utfylt
samboerflytting fra leid til eid bolig, med innflytting 35 dager frem i tid
og overtakelse én uke før innflytting.

## Demoens funksjoner

- Forside med to utvidbare felt: «Hvor og når» (fra/til, leie/eie, utflytting,
  overtakelse av ny bolig og innflytting) og «Hvem flytter du med». Alle datoene
  er valgfrie; overtakelse og innflytting kan være samme eller ulike dager. Feltene åpnes ved klikk inni og
  lukkes ved klikk utenfor, og viser et sammendrag når de er lukket.
- Planen på `/tidslinje` kan vises som tidslinje eller som oppgaveliste
  (`?visning=oppgaver`). Aktiv oppgave lagres i URL-en, for eksempel
  `?oppgave=insurance`, og beholdes ved oppdatering og tilbake-/fremnavigasjon.
  Ukjente eller ikke lenger relevante oppgave-ID-er erstattes med en oppgave
  fra den lokale planen. Lenken deler ikke selve planen med andre nettlesere.
- Oppgaver for forsikring, strøm, forberedelse og dokumentasjon knyttes til
  overtakelsen. Pakking, transport og en egen innflyttingsoppgave følger innflytting.
- Tidslinjen viser markører for i dag, utflytting, overtakelse og innflytting.
  Med begge datoer kjent plasseres oppgavene på en felles tidsakse. Ellers er
  plasseringen skjematisk og merket som dette; hver oppgave viser hvilken milepæl
  tidspunktet gjelder. Valgt oppgave vises i et kort under, med et
   lite Gjensidige-påheng (demo). Forsikringsoppgaven viser Gjensidige
   innboforsikring med logo og «Best i test» for Innbo Pluss, med kilde og testdato.
- Oppgavelisten er gruppert i Formelle, Praktiske og Annet, og kan krysses av.
- Farger fra palett v2 («lett og trygg», se `../palett/v2.html`).
- «Start på nytt» for å slette planen eller laste eksempelreisen på nytt.

## Lagring og avgrensning

Kartlegging (inkludert adresser), sist besøkte kartleggingssteg, oppgavesvar,
avkryssinger og statuser lagres i `localStorage` under `flyttehjelpen:v1`.
Data valideres ved innlesing. Lagring skjer først etter innlesing, ved endringer.
Oppgaver som blir irrelevante etter endret kartlegging skjules, men beholder
status hvis de senere kommer tilbake. Endringer i dato flytter anbefalte
tidspunkter uten å nullstille svar. «Start på nytt» sletter den lokale planen.
Eldre planer uten overtakelsesdato leses inn med denne datoen tom; eksisterende
innflyttingsdato og oppgavestatus beholdes.

Planen deles ikke mellom nettlesere eller enheter. Det finnes ingen innlogging,
backend, søknadsinnsending eller kjøpsintegrasjon. Kartverkets adressesøk mottar
søkestrengen når brukeren skriver i et adressefelt; manuelt skrevet adresse
godtas også hvis tjenesten ikke svarer. Ingen miljøvariabler kreves.

Oppgaveinnhold er veiledende demoeksempler. Anbefalte tidspunkter er ikke
juridiske frister. Dekning og aktuelle krav må avklares hos riktig tilbyder
eller offentlig tjeneste.

## Partnertilbud (mock)

- `app/lib/partner-offers.ts` definerer tilbudskontrakten, hvilke oppgaver som
  har tilbud, og en asynkron `PartnerOfferSource`. Legg til en oppgave-ID i
  `offersByTask` for å vise ett eller flere tilbud på den oppgaven.
- `app/routes/partner-offers.tsx` henter tilbud gjennom en `clientLoader`.
  `app/components/partner-offers.tsx` bruker en React Router-fetcher og viser
  lasting, tomt resultat og feil med mulighet til å prøve igjen.
- Mocken sender ingen profilopplysninger. Prisen på 149 kr/måned er fiktiv og
  overføres ikke til nettbutikken. «Kjøp forsikring» går til innboflyten på
  `www.testgjensidige.no`. Tilbud påvirker ikke oppgavens fullføring. Logoen i
  `public/gjensidige-logo.svg` er hentet fra Gjensidiges offentlige nettside.
  Testmerket gjelder Innbo Pluss i Smarte pengers test fra oktober 2024,
  slik det er beskrevet på Gjensidiges produktside.
- For et ekte API: bytt standardkilden i `getPartnerOffers` med et kall til en
  backend som returnerer `PartnerOffer[]`. Viderefør `AbortSignal`, håndter
  HTTP-feil og valider svaret (inkludert logo og tillatte HTTPS-lenker) før det
  returneres til visningen. Oppgaveregisteret kan beholdes separat fra tilbudsdata.
  Med dagens statiske hosting må backend driftes separat. Alternativt kan appen
  få serverkjøring og en server-loader med en `.server`-integrasjon. API-nøkler
  og leverandørkall med hemmeligheter skal aldri ligge i klienten. Eventuell
  deling av personopplysninger må avklares før integrasjonen tas i bruk.

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
Prøv også overtakelse før innflytting, begge på samme dag, bare én kjent dato
og ingen datoer. Sjekk at datoendringer flytter oppgavene uten å miste avkryssinger.

## Publisering

`react-router.config.ts` bruker `ssr: false`. Publiser `build/client/` til en
statisk host med fallback til `index.html` for klientruter som `/tidslinje`.
Nettleser-API-er brukes kun i effekter og hendelser, slik at bygg/prerendering
ikke krever `window`, `document` eller `localStorage`.
