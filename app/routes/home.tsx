import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import type { Route } from './+types/home';
import { AddressField } from '~/components/address-field';
import { ExpandableField } from '~/components/expandable-field';
import { HomeTypePreview, homeKindLabel } from '~/components/home-type';
import { useMoving } from '~/components/moving-provider';
import { Icon, Shell } from '~/components/ui';
import { demoState, formatDate, profileErrors, validDate, type MovingProfile, type Tenure } from '~/lib/moving-plan';

export function meta({}: Route.MetaArgs) {
  return [{ title: 'Flyttehjelpen – din personlige flytteplan' }, { name: 'description', content: 'Litt mindre kaos, litt mer hjemme. Fortell oss hvor, når og med hvem du flytter, så lager vi en personlig flytteplan.' }];
}

type FieldId = 'where' | 'who';

function TenureChoice({ value, onChange, label, name }: { value: Tenure; onChange: (value: Tenure) => void; label: string; name: string }) {
  return <fieldset><legend className="mb-2 text-xs font-semibold text-kveld-500">{label}</legend><div className="grid grid-cols-2 gap-2">
    {([['rent', 'Leier'], ['own', 'Eier']] as const).map(([id, title]) => <label key={id} className={`choice-small !py-2.5 ${value === id ? 'choice-selected' : ''}`}><input className="check-input" type="radio" name={name} value={id} checked={value === id} onChange={() => onChange(id)} />{title}</label>)}
  </div></fieldset>;
}

function DateField({ id, label, value, onChange }: { id: string; label: string; value: string; onChange: (value: string) => void }) {
  return <div><label className="mb-2 block text-xs font-semibold text-kveld-500" htmlFor={id}>{label} <span className="font-normal">· valgfritt</span></label>
    <div className="flex gap-2"><input id={id} type="date" className="text-input" value={value} onChange={(event) => onChange(event.target.value)} />{value && <button type="button" className="shrink-0 rounded-xl px-3 text-xs font-semibold text-syrin-600 underline underline-offset-4" onClick={() => onChange('')}>Fjern<span className="sr-only"> {label.toLowerCase()}sdato</span></button>}</div>
  </div>;
}

function shortAddress(value: string) {
  return value.split(',')[0]?.trim() ?? value;
}

function whereErrors(profile: MovingProfile) {
  return [...profileErrors(profile, 1), ...profileErrors(profile, 2)];
}

function whereSummary(p: MovingProfile) {
  if (!p.fromAddress && !p.toAddress && !p.moveDate) return 'Legg inn adressene, og datoene hvis du vet dem';
  const side = (address: string, date: string, prefix: string) => {
    if (!address) return '…';
    const kind = homeKindLabel(address);
    return [shortAddress(address), kind && kind.toLowerCase(), validDate(date) && `${prefix} ${formatDate(date)}`].filter(Boolean).join(', ');
  };
  return <span className="block font-medium text-kveld-900">{side(p.fromAddress, p.moveOutDate, 'ut')} → {side(p.toAddress, p.moveDate, 'inn')}</span>;
}

function whoSummary(p: MovingProfile) {
  if (!p.household) return 'Alene, med samboer, med barn?';
  const parts = [p.household === 'partner' ? 'Med samboer' : 'Alene'];
  if (p.children) parts.push(p.schoolChange ? 'med barn som bytter skole' : 'med barn');
  if (p.student) parts.push('student');
  if (p.newParent) parts.push('nybakte foreldre');
  if (p.retired) parts.push('pensjonist');
  return <span className="font-medium text-kveld-900">{parts.join(' · ')}</span>;
}

export default function Home() {
  const { state, update, ready } = useMoving();
  const navigate = useNavigate();
  const { profile } = state;
  const [openField, setOpenField] = useState<FieldId | null>(null);
  const initialised = useRef(false);
  const [showErrors, setShowErrors] = useState(false);
  const [building, setBuilding] = useState(false);
  const errorSummary = useRef<HTMLDivElement>(null);

  const where = whereErrors(profile);
  const who = profileErrors(profile, 0);
  const errors = [...where, ...who];

  useEffect(() => { if (showErrors && errors.length) errorSummary.current?.focus(); }, [showErrors]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    // Åpne første felt for nye besøkende, først når lagrede svar er lest inn.
    if (!ready || initialised.current) return;
    initialised.current = true;
    if (!profile.fromAddress && !profile.toAddress) setOpenField('where');
  }, [ready, profile.fromAddress, profile.toAddress]);

  const close = useCallback(() => setOpenField(null), []);

  function patch(changes: Partial<MovingProfile>) {
    update((saved) => ({ ...saved, profile: { ...saved.profile, ...changes } }));
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (errors.length) {
      setShowErrors(true);
      setOpenField(where.length ? 'where' : 'who');
      return;
    }
    setBuilding(true);
    update((saved) => ({ ...saved, created: true }));
    await navigate('/tidslinje');
  }

  return <Shell><main className="relative overflow-x-clip">
    <div aria-hidden="true" className="absolute inset-x-0 top-0 h-[32rem] bg-gradient-to-b from-himmel via-kveld-50 to-white" />
    <div aria-hidden="true" className="absolute -right-10 top-8 h-40 w-40 rounded-full bg-sol sm:right-[8%] sm:top-12 sm:h-60 sm:w-60" />
    <div aria-hidden="true" className="absolute -right-48 top-[24rem] hidden h-[30rem] w-[30rem] rounded-full bg-eng lg:block" />
    <div aria-hidden="true" className="absolute -left-40 top-[44rem] hidden h-72 w-72 rounded-full bg-syrin-100 lg:block" />
    <div>
      <div className="relative mx-auto max-w-2xl px-5 pb-10 pt-12 sm:px-8 sm:pt-20">
        {state.created && <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white/90 px-5 py-3 text-sm text-kveld-700 shadow-[0_0_0_1px_var(--color-kveld-100)]"><span>Du har allerede en flytteplan. Endrer du svarene, oppdateres den.</span><Link className="font-semibold text-syrin-600 underline underline-offset-4" to="/tidslinje">Til planen min →</Link></div>}
        <p className="eyebrow">Flyttehjelpen</p>
        <h1 className="mt-3 max-w-xl text-4xl font-semibold leading-[1.08] tracking-tight sm:text-6xl">Flytting kan være kaos. <span className="text-syrin-500">Planen trenger ikke være det.</span></h1>
        <p className="mt-5 max-w-lg text-lg leading-8 text-kveld-500">Fortell oss hvor, når og med hvem du flytter. Så lager vi en plan med alt du må huske.</p>
      </div>
    </div>

    <form onSubmit={submit} noValidate className="relative mx-auto max-w-2xl space-y-4 px-5 pb-10 sm:px-8">
      {showErrors && errors.length > 0 && <div ref={errorSummary} tabIndex={-1} role="alert" className="rounded-2xl bg-feil-100 p-4 text-sm text-feil-500"><p className="font-semibold">Vi mangler litt informasjon</p><ul className="mt-1 list-inside list-disc">{errors.map((error) => <li key={error}>{error}</li>)}</ul></div>}

      <ExpandableField number={1} title="Hvor og når flytter du?" summary={whereSummary(profile)} complete={where.length === 0} open={openField === 'where'} onOpen={() => setOpenField('where')} onClose={close}>
        <div className="space-y-5">
          <div className="space-y-4 rounded-2xl bg-kveld-50 p-4">
            <AddressField label="Jeg flytter fra" value={profile.fromAddress} onChange={(fromAddress) => patch({ fromAddress })} />
            <HomeTypePreview address={profile.fromAddress} />
            <TenureChoice label="Boligen jeg flytter fra" name="fromTenure" value={profile.fromTenure} onChange={(fromTenure) => patch({ fromTenure })} />
            <DateField id="move-out-date" label="Utflytting" value={profile.moveOutDate} onChange={(moveOutDate) => patch({ moveOutDate, dateUnknown: false })} />
          </div>
          <div className="space-y-4 rounded-2xl bg-syrin-50 p-4">
            <AddressField label="Jeg flytter til" value={profile.toAddress} onChange={(toAddress) => patch({ toAddress })} />
            <HomeTypePreview address={profile.toAddress} />
            <TenureChoice label="Den nye boligen" name="toTenure" value={profile.toTenure} onChange={(toTenure) => patch({ toTenure })} />
            <DateField id="move-date" label="Innflytting" value={profile.moveDate} onChange={(moveDate) => patch({ moveDate, dateUnknown: false })} />
          </div>
          <p className="text-xs leading-5 text-kveld-500">Vet du ikke datoene ennå? Det går fint. Da viser vi planen i uker før og etter flyttedagen, og du kan legge inn datoene senere.</p>
          {showErrors && where.length > 0 && <p className="text-sm text-feil-500">{where[0]}</p>}
          <div className="flex justify-end"><button type="button" className="button-secondary" onClick={() => setOpenField(where.length ? 'where' : 'who')}>Neste: hvem flytter<Icon name="arrow" className="h-4 w-4" /></button></div>
        </div>
      </ExpandableField>

      <ExpandableField number={2} title="Hvem flytter du med?" summary={whoSummary(profile)} complete={who.length === 0} open={openField === 'who'} onOpen={() => setOpenField('who')} onClose={close}>
        <fieldset><legend className="sr-only">Hvem flytter du med?</legend><div className="grid grid-cols-2 gap-3">
          {([{ value: 'alone', title: 'Alene', icon: 'person' }, { value: 'partner', title: 'Med samboer', icon: 'users' }] as const).map((option) => <label key={option.value} className={`choice-card flex items-center gap-3 ${profile.household === option.value ? 'choice-selected' : ''}`}>
            <input type="radio" name="household" value={option.value} checked={profile.household === option.value} onChange={() => patch({ household: option.value })} className="sr-only" />
            <span className={`rounded-xl p-2.5 ${profile.household === option.value ? 'bg-syrin-500 text-white' : 'bg-syrin-100 text-syrin-600'}`}><Icon name={option.icon} /></span>
            <span className="font-semibold">{option.title}</span>
          </label>)}
        </div></fieldset>
        <label className={`choice-small mt-3 ${profile.children ? 'choice-selected' : ''}`}><input className="check-input" type="checkbox" checked={profile.children} onChange={(event) => patch({ children: event.target.checked, ...(event.target.checked ? {} : { schoolChange: false }) })} />Vi har med barn</label>
        {profile.children && <label className="mt-2 ml-7 flex items-center gap-3 text-sm text-kveld-700"><input className="check-input" type="checkbox" checked={profile.schoolChange} onChange={(event) => patch({ schoolChange: event.target.checked })} />Barn skal bytte skole eller barnehage</label>}
        <fieldset className="mt-5"><legend className="mb-2 text-xs font-semibold text-kveld-500">Passer noe av dette? <span className="font-normal">Valgfritt</span></legend><div className="flex flex-wrap gap-2">
          {([{ key: 'student', label: 'Student' }, { key: 'newParent', label: 'Nybakte foreldre' }, { key: 'retired', label: 'Pensjonist' }] as const).map((option) => <label key={option.key} className={`inline-flex cursor-pointer items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition ${profile[option.key] ? 'bg-syrin-500 text-white' : 'bg-white text-kveld-700 shadow-[inset_0_0_0_1px_var(--color-kveld-200)] hover:shadow-[inset_0_0_0_1px_var(--color-syrin-300)]'}`}><input className="sr-only" type="checkbox" checked={profile[option.key]} onChange={(event) => patch({ [option.key]: event.target.checked })} />{profile[option.key] && <Icon name="check" className="h-4 w-4" />}{option.label}</label>)}
        </div></fieldset>
        {showErrors && who.length > 0 && <p className="mt-4 text-sm text-feil-500">{who[0]}</p>}
      </ExpandableField>

      <div className="pt-4">
        <button type="submit" disabled={building} className="button-primary w-full !min-h-14 !text-base">{building ? 'Lager planen din …' : state.created ? 'Oppdater flytteplanen' : 'Lag min flytteplan'}<Icon name="arrow" /></button>
        <div className="mt-4 flex flex-wrap justify-center gap-x-5 gap-y-2 text-xs font-medium text-kveld-500"><span className="inline-flex items-center gap-1.5"><Icon name="check" className="h-4 w-4 text-ok-500" /> Ingen innlogging</span><span className="inline-flex items-center gap-1.5"><Icon name="check" className="h-4 w-4 text-ok-500" /> Lagres bare hos deg</span><span className="inline-flex items-center gap-1.5"><Icon name="check" className="h-4 w-4 text-ok-500" /> Kan endres når som helst</span></div>
        {!state.created && <p className="mt-6 text-center text-sm text-kveld-500">Bare nysgjerrig? <button type="button" className="font-semibold text-syrin-600 underline underline-offset-4" onClick={() => { update(() => demoState()); void navigate('/tidslinje'); }}>Prøv en eksempelreise</button></p>}
      </div>
    </form>
  </main></Shell>;
}
