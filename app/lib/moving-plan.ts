export type Household = '' | 'alone' | 'partner';
export type Tenure = '' | 'rent' | 'own';
export type TaskStatus = 'todo' | 'waiting' | 'done' | 'irrelevant';
export type Phase = 'now' | 'before' | 'moving' | 'after';
export type Category = 'formal' | 'practical' | 'other';
export type DateAnchor = 'move' | 'handover';

export const categories: { id: Category; title: string; description: string }[] = [
  { id: 'formal', title: 'Formelle', description: 'Melding, søknader og avtaler med offentlige og utleier' },
  { id: 'practical', title: 'Praktiske', description: 'Flyttefolk, pakking og selve overtakelsen' },
  { id: 'other', title: 'Annet', description: 'Abonnementer, forsikring og det som er lett å glemme' },
];

export type MovingProfile = {
  household: Household;
  fromAddress: string;
  toAddress: string;
  fromTenure: Tenure;
  toTenure: Tenure;
  moveDate: string;
  handoverDate: string;
  moveOutDate: string;
  dateUnknown: boolean;
  student: boolean;
  children: boolean;
  schoolChange: boolean;
  newParent: boolean;
  retired: boolean;
};

export type TaskProgress = {
  status: TaskStatus;
  checks: Record<string, boolean>;
  answer: string;
};

export type MovingState = {
  version: 1;
  step: number;
  created: boolean;
  profile: MovingProfile;
  progress: Record<string, TaskProgress>;
};

export type MovingTask = {
  id: string;
  title: string;
  summary: string;
  why: string;
  phase: Phase;
  offset: number;
  dateAnchor: DateAnchor;
  checks: string[];
  doneWhen: string;
  resources?: {
    description: string;
    links: { title: string; href: string; description: string }[];
  };
  question?: { text: string; options: string[] };
  partner?: boolean;
  category: Category;
  product: { name: string; text: string };
};

type DraftTask = Omit<MovingTask, 'category' | 'product' | 'dateAnchor'> & { dateAnchor?: DateAnchor };

const categoryById: Record<string, Category> = {
  'end-lease': 'formal', school: 'formal', address: 'formal', student: 'formal', 'new-parent': 'formal',
  'old-home': 'practical', packing: 'practical', handover: 'practical', 'prepare-handover': 'practical', 'move-in': 'practical',
  'shared-home': 'other', insurance: 'other', utilities: 'other', subscriptions: 'other', settle: 'other', neighborhood: 'other',
};

function productFor(id: string, p: MovingProfile): MovingTask['product'] {
  switch (id) {
    case 'insurance': return { name: 'Innboforsikring', text: p.household === 'partner' ? 'Én innboforsikring kan dekke hele husstanden. Sjekk at begge står på avtalen.' : 'Innboforsikringen følger deg til ny adresse. Sjekk at boligstørrelse og dekning stemmer.' };
    case 'handover': return p.toTenure === 'own' ? { name: 'Husforsikring', text: 'Eier du boligen, må huset være forsikret fra overtakelsesdagen.' } : { name: 'Innboforsikring', text: 'Ta bilder av tingene dine når du pakker ut. Det gjør et eventuelt skadeoppgjør enklere.' };
    case 'old-home': return { name: 'Husforsikring', text: 'Avslutt eller overfør husforsikringen når den nye eieren overtar.' };
    case 'shared-home': return { name: 'Samle forsikringene', text: 'Flytter dere sammen, kan dere ofte samle forsikringene og unngå å betale dobbelt.' };
    case 'address': return { name: 'Oppdater adressen hos Gjensidige', text: 'Bil, innbo og reise henger sammen med adressen din. Endre den på Min side.' };
    case 'packing': return { name: 'Verdisakforsikring', text: 'Smykker, kamera og andre verdisaker kan trenge ekstra dekning, også under flyttingen.' };
    case 'school': return { name: 'Barneforsikring', text: 'Nytt nabolag og nye aktiviteter. Sjekk at barna er godt dekket.' };
    case 'settle': return { name: 'Gjensidige-appen', text: 'Se alle forsikringene dine samlet og meld skade direkte fra telefonen.' };
    default: return { name: 'Flytter du?', text: 'Vi hjelper deg å sjekke at forsikringene dine følger med til ny adresse.' };
  }
}

export const phases: { id: Phase; title: string; description: string }[] = [
  { id: 'now', title: 'Kom i gang', description: 'De første avklaringene' },
  { id: 'before', title: 'Før flytting', description: 'Få det praktiske på plass' },
  { id: 'moving', title: 'Overtakelse og innflytting', description: 'To milepæler, på samme eller ulike dager' },
  { id: 'after', title: 'Velkommen hjem', description: 'Land i ditt nye nabolag' },
];

export function emptyState(): MovingState {
  return {
    version: 1,
    step: 0,
    created: false,
    profile: {
      household: '', fromAddress: '', toAddress: '', fromTenure: '', toTenure: '',
      moveDate: '', handoverDate: '', moveOutDate: '', dateUnknown: false, student: false, children: false,
      schoolChange: false, newParent: false, retired: false,
    },
    progress: {},
  };
}

/** Innflyttingsdato er valgfri. Uten den vises planen relativt til flyttedagen. */
export function hasMoveDate(profile: MovingProfile): boolean {
  return !profile.dateUnknown && validDate(profile.moveDate);
}

export function validDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T12:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function profileErrors(profile: MovingProfile, step: number): string[] {
  if (step === 0) return profile.household ? [] : ['Velg om du flytter alene eller med samboer.'];
  if (step === 1) {
    return [
      !profile.fromAddress.trim() && 'Skriv inn adressen du flytter fra.',
      !profile.toAddress.trim() && 'Skriv inn adressen du flytter til.',
      !profile.fromTenure && 'Velg om du leier eller eier boligen du flytter fra.',
      !profile.toTenure && 'Velg om du skal leie eller eie den nye boligen.',
    ].filter((message): message is string => Boolean(message));
  }
  return [
    profile.moveDate && !validDate(profile.moveDate) && 'Innflyttingsdatoen er ikke gyldig.',
    profile.handoverDate && !validDate(profile.handoverDate) && 'Overtakelsesdatoen er ikke gyldig.',
    profile.moveOutDate && !validDate(profile.moveOutDate) && 'Utflyttingsdatoen er ikke gyldig.',
  ].filter((message): message is string => Boolean(message));
}

export function isProfileComplete(profile: MovingProfile): boolean {
  return [0, 1, 2].every((step) => profileErrors(profile, step).length === 0);
}

export function generatePlan(p: MovingProfile): MovingTask[] {
  const tasks: DraftTask[] = [];
  if (p.fromTenure === 'rent') tasks.push({
    id: 'end-lease', title: 'Avklar oppsigelse av leieboligen', phase: 'now', offset: -60,
    summary: 'Finn oppsigelsesfristen og avtal veien videre med utleier.',
    why: 'Du flytter fra en leid bolig. Fristen og kravene i leieavtalen din avgjør hva du må gjøre.',
    checks: ['Jeg har lest oppsigelsesvilkårene i leieavtalen', 'Jeg har avklart oppsigelse og dato for tilbakelevering med utleier'],
    doneWhen: 'Oppsigelsen og tilbakeleveringen er avklart med utleier.',
  });
  if (p.fromTenure === 'own') tasks.push({
    id: 'old-home', title: 'Planlegg overlevering av boligen', phase: 'now', offset: -45,
    summary: 'Samle avtaler og avklar hva som skal følge med.',
    why: 'Du flytter fra en eid bolig. Hvis noen skal overta den, er det lurt å avklare overleveringen tidlig.',
    checks: ['Jeg har avklart overlevering eller annen bruk av den gamle boligen', 'Jeg vet hvilke avtaler jeg selv må avslutte eller flytte'],
    doneWhen: 'Du vet hva som skal skje med boligen og hvilke avtaler du har ansvar for.',
  });
  if (p.household === 'partner') tasks.push({
    id: 'shared-home', title: 'Ta en prat om det dere skal dele', phase: 'now', offset: -35,
    summary: 'Få oversikt over felles utgifter og avtaler.',
    why: 'Dere skal bo sammen. En liten avklaring nå kan spare dere for både dobbeltbetaling og usikkerhet.',
    checks: ['Vi har snakket om fordeling av felles utgifter', 'Vi har gått gjennom hvilke abonnementer vi vil beholde'],
    doneWhen: 'Dere har oversikt over felles utgifter og hvem som følger opp avtalene.',
  });
  if (p.children && p.schoolChange) tasks.push({
    id: 'school', title: 'Undersøk skole og barnehage', phase: 'now', offset: -45,
    summary: 'Finn riktig kontaktpunkt i kommunen dere flytter til.',
    why: 'Du har oppgitt at barn skal bytte skole eller barnehage. Søknadsprosess og frister må avklares med kommunen.',
    checks: ['Jeg har undersøkt kommunens informasjon om skole eller barnehage', 'Jeg har avklart søknad, dokumentasjon og aktuelle frister'],
    doneWhen: 'Du har avklart videre prosess og fulgt opp eventuell søknad hos kommunen.',
    resources: {
      description: 'Søk om skole- og barnehageplass hos kommunen dere flytter til, ikke hos NAV. Kommunelenkene under er eksempler fra Oslo. Flytter dere til en annen kommune, finner dere tilsvarende informasjon på kommunens nettsider.',
      links: [
        { title: 'Oslo kommune: skole og utdanning', href: 'https://www.oslo.kommune.no/skole-og-utdanning/', description: 'Finn informasjon om skolekrets, skolestart, skolebytte og aktivitetsskolen (AKS/SFO).' },
        { title: 'Oslo kommune: barnehage', href: 'https://www.oslo.kommune.no/barnehage/', description: 'Les om søknad, bytte av barnehage, frister og redusert foreldrebetaling.' },
        { title: 'NAV: stønad til barnetilsyn for enslig mor eller far', href: 'https://www.nav.no/barnetilsyn-enslig', description: 'Kan være aktuelt for deg som er alene med barn. Sjekk gjeldende vilkår for støtte til barnepass hos NAV.' },
      ],
    },
  });
  tasks.push({
    id: 'insurance', title: 'Sjekk forsikringene før overtakelsen', phase: 'before', offset: -21, dateAnchor: 'handover',
    summary: p.household === 'partner' ? 'Unngå dobbeltforsikring når dere flytter sammen.' : 'Sjekk eksisterende dekning før du kjøper noe nytt.',
    why: p.household === 'partner' ? 'Dere skal bo sammen. Avklar med forsikringsselskapet om en eksisterende innboforsikring kan dekke dere begge på ny adresse.' : 'Ny adresse og bolig kan påvirke forsikringen din. Start med å undersøke avtalen du allerede har.',
    checks: ['Jeg har sjekket eksisterende innboforsikring og hvem som er dekket', ...(p.toTenure === 'own' ? ['Jeg har avklart om bygningsforsikring er felles eller må ordnes separat'] : []), 'Jeg har avklart dekning, adresse og flyttedato med forsikringsselskapet', 'Jeg har avklart hvilken dekning jeg trenger fra overtakelsen og frem til innflytting'],
    doneWhen: 'Du vet hvilke forsikringer som gjelder, hvem de dekker og fra hvilken dato. Dekning fra overtakelse og under flyttingen er avklart.',
    question: { text: 'Har du eller en du flytter med innboforsikring i dag?', options: ['Ja', 'Nei', 'Vet ikke ennå'] },
    partner: true,
  });
  tasks.push({
    id: 'utilities', title: 'Finn ut hva som følger med boligen', phase: 'before', offset: -14, dateAnchor: 'handover',
    summary: 'Avklar strøm og internett før du bestiller nye avtaler.',
    why: p.toTenure === 'rent' ? 'Du skal leie. Noen tjenester kan være inkludert i husleien, så sjekk leieavtalen først.' : 'Du skal eie. Internett eller andre tjenester kan inngå i felleskostnadene.',
    checks: ['Jeg vet hva som er inkludert i den nye boligen', 'Jeg har ordnet det jeg trenger og avklart egne gamle avtaler', 'Ansvar for strøm fra overtakelsen og oppstart av internett er avklart'],
    question: { text: 'Følger internett med boligen?', options: ['Ja', 'Nei', 'Vet ikke ennå'] },
    doneWhen: 'Nødvendige tjenester er avklart, inkludert hvem som har ansvar for strøm fra overtakelsen og når internett skal være klart.',
  }, {
    id: 'address', title: 'Planlegg adresseendringen', phase: 'before', offset: -7,
    summary: 'Få oversikt over hvem som trenger den nye adressen.',
    why: 'Adresseendring hos Folkeregisteret og Posten er separate ting. Undersøk gjeldende regler og tidspunkt hos hver av dem.',
    checks: ['Jeg har sjekket hvordan og når jeg skal melde flytting til Folkeregisteret', 'Jeg har avklart adresseendring og eventuell videresending hos Posten', 'Jeg har fulgt opp andre som trenger adressen min'],
    doneWhen: 'Du har fulgt opp adresseendringene som gjelder for deg hos de aktuelle tjenestene.',
  }, {
    id: 'subscriptions', title: 'Endre eller si opp abonnementer', phase: 'before', offset: -10,
    summary: 'Strøm, internett, aviser, treningssenter og andre faste avtaler.',
    why: 'Mange abonnementer følger adressen din. Noen kan flyttes, andre må sies opp med oppsigelsestid.',
    checks: ['Jeg har listet opp abonnementene jeg betaler for', 'Jeg har flyttet eller sagt opp det som berøres av flyttingen'],
    doneWhen: 'Abonnementene dine er flyttet, sagt opp eller bekreftet på ny adresse.',
  }, {
    id: 'packing', title: 'Gjør klart til flyttedagen', phase: 'before', offset: -7,
    summary: 'Planlegg transport, pakking og hvem som hjelper til.',
    why: 'En enkel praktisk plan gjør det lettere å holde oversikten når dagen kommer.',
    checks: ['Transport og eventuell flyttehjelp er avtalt', 'Jeg har en plan for pakking, vask og nøkkeloverlevering'],
    doneWhen: 'Transport, pakking og de praktiske avtalene er på plass.',
  }, {
    id: 'prepare-handover', title: 'Avtal overtakelsen av den nye boligen', phase: 'before', offset: -7, dateAnchor: 'handover',
    summary: 'Avtal tidspunkt, nøkkeloverlevering og hvem som skal være med.',
    why: 'Overtakelse er dagen du får tilgang til boligen. Den kan være en annen dag enn du faktisk flytter inn.',
    checks: ['Tidspunkt og deltakere er avtalt med selger, megler eller utleier', 'Jeg vet hvilke dokumenter og nøkler som skal overleveres', 'Jeg har avklart tilgang til boligen frem til innflytting'],
    doneWhen: 'Du vet når og hvordan overtakelsen skal gjennomføres, og hva du må ha klart.',
  }, {
    id: 'handover', title: 'Dokumenter og overta boligen', phase: 'moving', offset: 0, dateAnchor: 'handover',
    summary: 'Gå gjennom boligen og ta vare på dokumentasjonen.',
    why: 'Dokumenter boligens tilstand ved overtakelsen, selv om du først skal flytte inn senere. Det gjør det lettere å følge opp feil, mangler og avtaler.',
    checks: ['Jeg har gått gjennom boligen og dokumentert tilstanden', 'Nøkler, eventuell målerstand og overtakelsesdokumenter er avklart'],
    doneWhen: 'Overtakelsen er gjennomført og relevant dokumentasjon er tatt vare på.',
  }, {
    id: 'move-in', title: 'Flytt inn og gjør boligen klar til bruk', phase: 'moving', offset: 0,
    summary: 'Ta imot flyttelasset og få det viktigste på plass.',
    why: 'Innflytting er dagen du begynner å bo i den nye boligen. Nøkler og overtakelsesdokumenter kan allerede være ordnet.',
    checks: ['Jeg har tilgang til boligen og har avklart parkering og adkomst for transporten', 'Flyttelasset er tatt imot og eventuelle transportskader er dokumentert', 'Soveplass, nødvendige ting og røykvarslere er på plass og sjekket'],
    doneWhen: 'Du har flyttet inn og det viktigste er klart for den første natten.',
  }, {
    id: 'settle', title: 'Sjekk at alt har kommet på plass', phase: 'after', offset: 7,
    summary: 'Ta en siste runde på avtaler og eventuelle mangler.',
    why: 'Når du har bodd der litt, er det lettere å se om noe mangler eller fortsatt må følges opp.',
    checks: ['Jeg har kontrollert at tjenester og avtaler fungerer', 'Jeg har fulgt opp eventuelle mangler med riktig kontaktperson'],
    doneWhen: 'Du har oversikt over det som eventuelt gjenstår etter innflytting.',
  });
  if (p.student) tasks.push({
    id: 'student', title: 'Oppdater det som gjelder studiene dine', phase: 'before', offset: -14,
    summary: 'Sjekk adresse og bosituasjon hos studiested og støtteordninger.',
    why: 'Du har valgt student. Flytting kan bety at opplysninger hos studiestedet eller Lånekassen må oppdateres.',
    checks: ['Jeg har sjekket hvilke opplysninger studiestedet trenger', 'Jeg har undersøkt om bosituasjonen må oppdateres hos Lånekassen'],
    doneWhen: 'Du har oppdatert de opplysningene som gjelder for deg.',
  });
  if (p.newParent) tasks.push({
    id: 'new-parent', title: 'Avklar oppfølging på helsestasjonen', phase: 'after', offset: 7,
    summary: 'Undersøk hvordan oppfølgingen videreføres etter flytting.',
    why: 'Du har valgt nybakte foreldre. Ved flytting kan det være relevant å avklare kontakt med helsestasjon i ny kommune.',
    checks: ['Jeg har avklart hvor vi skal få videre oppfølging', 'Jeg har fulgt opp eventuelle avtaler som må flyttes'],
    doneWhen: 'Du vet hvor familien får oppfølging og hva som skjer med avtalte timer.',
  });
  if (p.children || p.retired || p.student) tasks.push({
    id: 'neighborhood', title: 'Finn deg til rette i nabolaget', phase: 'after', offset: 14,
    summary: p.children ? 'Utforsk fritidsaktiviteter og møteplasser for familien.' : p.retired ? 'Utforsk lokale møteplasser og aktivitetstilbud.' : 'Bli kjent med studentmiljøet og lokale møteplasser.',
    why: 'Du har ønsket en tilpasset plan for livsfasen din. Dette er et valgfritt steg for å bli kjent med nærmiljøet.',
    checks: ['Jeg har sett på kommunens eller lokale foreningers aktivitetstilbud'],
    doneWhen: 'Du har funnet ut om det er noen lokale tilbud du vil utforske videre.',
  });
  return phases.flatMap((phase) => tasks.filter((task) => task.phase === phase.id))
    .map((task) => ({ ...task, dateAnchor: task.dateAnchor ?? 'move', category: categoryById[task.id] ?? 'other', product: productFor(task.id, p) }));
}

export function getProgress(state: MovingState, id: string): TaskProgress {
  return state.progress[id] ?? { status: 'todo', checks: {}, answer: '' };
}

export function summarize(tasks: MovingTask[], state: MovingState) {
  const relevant = tasks.filter((task) => getProgress(state, task.id).status !== 'irrelevant');
  const done = relevant.filter((task) => getProgress(state, task.id).status === 'done').length;
  const waiting = relevant.filter((task) => getProgress(state, task.id).status === 'waiting').length;
  return { total: relevant.length, done, waiting, remaining: relevant.length - done, percent: relevant.length ? Math.round(done / relevant.length * 100) : 0 };
}

export function suggestedDate(moveDate: string, offset: number): string {
  if (!validDate(moveDate)) return '';
  const date = new Date(`${moveDate}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + offset);
  return new Intl.DateTimeFormat('nb-NO', { day: 'numeric', month: 'short', timeZone: 'UTC' }).format(date);
}

export function relativeLabel(offset: number, anchor: DateAnchor = 'move'): string {
  const event = anchor === 'handover' ? 'overtakelse' : 'innflytting';
  if (offset === 0) return anchor === 'handover' ? 'På overtakelsesdagen' : 'På innflyttingsdagen';
  const days = Math.abs(offset);
  const amount = days >= 14 && days % 7 === 0 ? `${days / 7} uker` : days === 7 ? '1 uke' : `${days} dager`;
  return `${amount} ${offset < 0 ? 'før' : 'etter'} ${event}`;
}

/** Ukjente datoer beholdes relative til sin egen milepæl, aldri den andre datoen. */
export function taskAnchorDate(profile: MovingProfile, task: MovingTask): string {
  return task.dateAnchor === 'handover'
    ? (validDate(profile.handoverDate) ? profile.handoverDate : '')
    : (hasMoveDate(profile) ? profile.moveDate : '');
}

/** Felles tidsakse når begge datoer er kjent, ellers en skjematisk plassering. */
export function taskTimelineDay(profile: MovingProfile, task: MovingTask): number {
  const shift = task.dateAnchor === 'handover' && hasMoveDate(profile) && validDate(profile.handoverDate)
    ? daysBetween(profile.moveDate, profile.handoverDate) : 0;
  return shift + task.offset;
}

export function addDays(value: string, offset: number): Date | null {
  if (!validDate(value)) return null;
  const date = new Date(`${value}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + offset);
  return date;
}

export function toIsoDate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function daysBetween(from: string, to: string): number {
  return Math.round((new Date(`${to}T12:00:00Z`).getTime() - new Date(`${from}T12:00:00Z`).getTime()) / 86400000);
}

export function formatDate(value: string, withYear = false): string {
  if (!validDate(value)) return '';
  return new Intl.DateTimeFormat('nb-NO', { day: 'numeric', month: 'short', ...(withYear ? { year: 'numeric' } : {}), timeZone: 'UTC' }).format(new Date(`${value}T12:00:00Z`));
}

export function demoState(now = new Date()): MovingState {
  const state = emptyState();
  const date = new Date(now);
  date.setDate(date.getDate() + 35);
  const moveDate = toIsoDate(date);
  const out = new Date(date);
  out.setDate(out.getDate() + 3);
  const handover = new Date(date);
  handover.setDate(handover.getDate() - 7);
  return { ...state, created: true, profile: { ...state.profile, household: 'partner', fromAddress: 'Markveien 12, Oslo', toAddress: 'Bøkkerveien 8, Oslo', fromTenure: 'rent', toTenure: 'own', moveDate, handoverDate: toIsoDate(handover), moveOutDate: toIsoDate(out) } };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function parseStoredState(raw: string): MovingState {
  const value: unknown = JSON.parse(raw);
  if (!isRecord(value) || value.version !== 1 || !isRecord(value.profile) || !isRecord(value.progress)) throw new Error('Ugyldig lagret plan');
  const p = value.profile;
  if (!['', 'alone', 'partner'].includes(String(p.household)) || !['', 'rent', 'own'].includes(String(p.fromTenure)) || !['', 'rent', 'own'].includes(String(p.toTenure))) throw new Error('Ugyldige boligvalg');
  for (const key of ['fromAddress', 'toAddress', 'moveDate']) if (typeof p[key] !== 'string' || p[key].length > 500) throw new Error('Ugyldig tekst');
  if (p.handoverDate !== undefined && (typeof p.handoverDate !== 'string' || p.handoverDate.length > 20)) throw new Error('Ugyldig overtakelsesdato');
  for (const key of ['dateUnknown', 'student', 'children', 'schoolChange', 'newParent', 'retired']) if (typeof p[key] !== 'boolean') throw new Error('Ugyldig valg');
  if (!Number.isInteger(value.step) || Number(value.step) < 0 || Number(value.step) > 2 || typeof value.created !== 'boolean') throw new Error('Ugyldig steg');
  // Only copy known fields; do not merge arbitrary stored objects into application state.
  const profile: MovingProfile = {
    household: p.household as Household, fromTenure: p.fromTenure as Tenure, toTenure: p.toTenure as Tenure,
    fromAddress: p.fromAddress as string, toAddress: p.toAddress as string, moveDate: p.moveDate as string,
    moveOutDate: typeof p.moveOutDate === 'string' && p.moveOutDate.length <= 20 ? p.moveOutDate : '',
    handoverDate: typeof p.handoverDate === 'string' ? p.handoverDate : '',
    dateUnknown: p.dateUnknown as boolean, student: p.student as boolean, children: p.children as boolean,
    schoolChange: p.schoolChange as boolean, newParent: p.newParent as boolean, retired: p.retired as boolean,
  };
  if (profile.moveOutDate && !validDate(profile.moveOutDate)) throw new Error('Ugyldig utflyttingsdato');
  if (profile.handoverDate && !validDate(profile.handoverDate)) throw new Error('Ugyldig overtakelsesdato');
  if (profile.moveDate && !validDate(profile.moveDate)) throw new Error('Ugyldig dato');
  if (value.created && !isProfileComplete(profile)) throw new Error('Ufullstendig plan');
  const progress: Record<string, TaskProgress> = {};
  for (const [id, entry] of Object.entries(value.progress)) {
    if (!/^[a-z-]+$/.test(id) || !isRecord(entry) || !['todo', 'waiting', 'done', 'irrelevant'].includes(String(entry.status)) || !isRecord(entry.checks) || typeof entry.answer !== 'string' || entry.answer.length > 200) throw new Error('Ugyldig oppgavestatus');
    const checks: Record<string, boolean> = {};
    for (const [key, checked] of Object.entries(entry.checks)) {
      if (!/^\d+$/.test(key) || typeof checked !== 'boolean') throw new Error('Ugyldig avkryssing');
      checks[key] = checked;
    }
    progress[id] = { status: entry.status as TaskStatus, checks, answer: entry.answer };
  }
  return { version: 1, step: value.step as number, created: value.created, profile, progress };
}
