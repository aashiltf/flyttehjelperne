import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import type { Route } from './+types/home';
import { AddressField } from '~/components/address-field';
import { useMoving } from '~/components/moving-provider';
import { HouseIllustration, Icon, Shell } from '~/components/ui';
import { demoState, profileErrors, type MovingProfile, type Tenure } from '~/lib/moving-plan';

export function meta({}: Route.MetaArgs) {
  return [{ title: 'Flyttehjelpen – din personlige flytteplan' }, { name: 'description', content: 'Litt mindre kaos, litt mer hjemme. Lag en personlig tidslinje og få oversikt over boligbyttet.' }];
}

const steps = ['Hvem flytter?', 'Fra og til', 'Dato og behov'];

function TenureChoice({ value, onChange, label, name }: { value: Tenure; onChange: (value: Tenure) => void; label: string; name: string }) {
  return <fieldset><legend className="field-label">{label}</legend><div className="grid grid-cols-2 gap-3">
    {([['rent', 'Leier'], ['own', 'Eier']] as const).map(([id, title]) => <label key={id} className={`choice-small ${value === id ? 'choice-selected' : ''}`}><input className="accent-teal-700" type="radio" name={name} value={id} checked={value === id} onChange={() => onChange(id)} />{title}</label>)}
  </div></fieldset>;
}

export default function Home() {
  const { state, update, ready } = useMoving();
  const navigate = useNavigate();
  const [errors, setErrors] = useState<string[]>([]);
  const [building, setBuilding] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const errorSummary = useRef<HTMLDivElement>(null);
  const { profile, step } = state;

  useEffect(() => { if (errors.length) errorSummary.current?.focus(); }, [errors]);
  useEffect(() => { if (ready) heading.current?.focus(); }, [step, ready]);

  function patch(changes: Partial<MovingProfile>) {
    update((saved) => ({ ...saved, profile: { ...saved.profile, ...changes } }));
    if (errors.length) setErrors([]);
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const validation = profileErrors(profile, step);
    if (validation.length) { setErrors(validation); return; }
    if (step < 2) { update((saved) => ({ ...saved, step: step + 1 })); return; }
    const allErrors = [0, 1, 2].flatMap((index) => profileErrors(profile, index));
    if (allErrors.length) { setErrors(allErrors); return; }
    setBuilding(true);
    update((saved) => ({ ...saved, created: true }));
    await navigate('/tidslinje');
  }

  return <Shell><main className="mx-auto max-w-6xl px-5 pb-8 pt-8 sm:px-8 sm:pt-12">
    {state.created && <div className="mb-7 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-teal-200 bg-teal-50 px-5 py-3 text-sm text-teal-900"><span>Du har allerede en flytteplan. Her kan du tilpasse svarene dine.</span><Link className="font-semibold underline underline-offset-4" to="/tidslinje">Tilbake til tidslinjen →</Link></div>}
    <div className="grid items-start gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
      <section className="lg:sticky lg:top-10 lg:pt-6">
        <p className="eyebrow">Fra flyttekaos til flyttekontroll</p>
        <h1 className="mt-4 max-w-lg text-4xl font-semibold leading-[1.13] tracking-tight text-slate-900 sm:text-5xl">Et nytt hjem.<br /><span className="text-teal-700">En litt enklere vei dit.</span></h1>
        <p className="mt-5 max-w-md text-base leading-7 text-slate-600">Papirer, avtaler og alt du ikke visste du måtte huske. Vi samler det i én plan, tilpasset din flytting.</p>
        <div className="hidden lg:block"><HouseIllustration /></div>
        <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-xs font-medium text-slate-600 lg:mt-0"><span className="inline-flex items-center gap-1.5"><Icon name="check" className="h-4 w-4 text-teal-700" /> Ingen innlogging</span><span className="inline-flex items-center gap-1.5"><Icon name="check" className="h-4 w-4 text-teal-700" /> Ditt tempo</span><span className="inline-flex items-center gap-1.5"><Icon name="check" className="h-4 w-4 text-teal-700" /> Full oversikt</span></div>
      </section>
      <section className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-[0_12px_60px_-35px_rgba(15,118,110,0.3)] sm:p-8">
        <ol className="mb-8 grid grid-cols-3 gap-3" aria-label="Steg i kartleggingen">{steps.map((title, index) => <li key={title} aria-current={step === index ? 'step' : undefined}><div className={`mb-2 h-1 rounded-full ${index <= step ? 'bg-teal-700' : 'bg-slate-100'}`} /><span className={`text-xs font-semibold ${index === step ? 'text-teal-800' : 'text-slate-500'}`}>{index + 1}. {title}</span></li>)}</ol>
        <p className="eyebrow">Steg {step + 1} av 3</p>
        <h2 tabIndex={-1} ref={heading} className="mt-2 text-2xl font-semibold tracking-tight outline-none">{['Hvem skal flytte?', 'Hvor går flyttelasset?', 'Når begynner neste kapittel?'][step]}</h2>
        <p className="mb-7 mt-2 text-sm leading-6 text-slate-500">{['Vi tilpasser planen til deg og de du flytter med.', 'Boligene dine hjelper oss å finne de riktige oppgavene.', 'Vi legger oppgavene rundt flyttedagen din.'][step]}</p>
        <form onSubmit={submit} noValidate>
          {errors.length > 0 && <div ref={errorSummary} tabIndex={-1} role="alert" className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"><p className="font-semibold">Vi mangler litt informasjon</p><ul className="mt-1 list-inside list-disc">{errors.map((error) => <li key={error}>{error}</li>)}</ul></div>}
          {step === 0 && <fieldset><legend className="sr-only">Hvem skal flytte?</legend><div className="grid gap-4 sm:grid-cols-2">
            {([{ value: 'alone', title: 'Jeg flytter alene', description: 'En plan bare for meg', icon: 'person' }, { value: 'partner', title: 'Med samboer', description: 'Vi starter et nytt kapittel', icon: 'users' }] as const).map((option) => <label key={option.value} className={`choice-card ${profile.household === option.value ? 'choice-selected' : ''}`}>
              <span className="flex items-center justify-between"><span className="rounded-xl bg-teal-50 p-3 text-teal-700"><Icon name={option.icon} className="h-6 w-6" /></span><input type="radio" name="household" value={option.value} checked={profile.household === option.value} onChange={() => patch({ household: option.value })} className="h-4 w-4 accent-teal-700" /></span>
              <span className="mt-5 block font-semibold">{option.title}</span><span className="mt-1 block text-xs leading-5 text-slate-500">{option.description}</span>
            </label>)}
          </div><div className="mt-6 flex items-start gap-3 rounded-xl bg-[#f7f8f3] p-4 text-sm leading-6 text-slate-600"><Icon name="spark" className="mt-0.5 text-teal-700" /><p>En plan som passer livet ditt. Vi viser deg hva som er relevant, ett steg om gangen.</p></div></fieldset>}
          {step === 1 && <div className="space-y-6">
            <div className="space-y-4 rounded-2xl bg-slate-50 p-4 sm:p-5"><AddressField label="Jeg flytter fra" value={profile.fromAddress} onChange={(fromAddress) => patch({ fromAddress })} /><TenureChoice label="Boligen jeg flytter fra" name="fromTenure" value={profile.fromTenure} onChange={(fromTenure) => patch({ fromTenure })} /></div>
            <div className="space-y-4 rounded-2xl bg-teal-50/50 p-4 sm:p-5"><AddressField label="Jeg flytter til" value={profile.toAddress} onChange={(toAddress) => patch({ toAddress })} /><TenureChoice label="Den nye boligen" name="toTenure" value={profile.toTenure} onChange={(toTenure) => patch({ toTenure })} /></div>
          </div>}
          {step === 2 && <div className="space-y-6">
            <div><label className="field-label" htmlFor="move-date">Innflyttingsdato</label><input id="move-date" type="date" className="text-input" value={profile.moveDate} disabled={profile.dateUnknown} onChange={(event) => patch({ moveDate: event.target.value })} /><label className="mt-3 flex items-center gap-3 text-sm"><input className="check-input" type="checkbox" checked={profile.dateUnknown} onChange={(event) => patch({ dateUnknown: event.target.checked })} />Datoen er ikke bestemt</label></div>
            <fieldset><legend className="field-label">Vil du tilpasse planen litt mer? <span className="font-normal text-slate-500">Valgfritt</span></legend><p className="mb-3 text-xs leading-5 text-slate-500">Velg det som passer. Du kan endre dette senere.</p><div className="grid gap-3 sm:grid-cols-2">{([{ key: 'student', label: 'Student' }, { key: 'children', label: 'Flytter med barn' }, { key: 'newParent', label: 'Nybakte foreldre' }, { key: 'retired', label: 'Pensjonist' }] as const).map((option) => <label key={option.key} className={`choice-small ${profile[option.key] ? 'choice-selected' : ''}`}><input className="check-input" type="checkbox" checked={profile[option.key]} onChange={(event) => patch({ [option.key]: event.target.checked })} />{option.label}</label>)}</div>
              {profile.children && <label className="mt-4 flex items-start gap-3 rounded-xl bg-teal-50 p-4 text-sm"><input className="check-input mt-0.5" type="checkbox" checked={profile.schoolChange} onChange={(event) => patch({ schoolChange: event.target.checked })} />Barn skal bytte skole eller barnehage</label>}
            </fieldset>
          </div>}
          <div className="mt-8 flex items-center gap-3">{step > 0 && <button type="button" className="button-secondary" onClick={() => { setErrors([]); update((saved) => ({ ...saved, step: step - 1 })); }}>Tilbake</button>}<button type="submit" disabled={building} className="button-primary flex-1">{building ? 'Lager planen din …' : step === 2 ? state.created ? 'Oppdater flytteplanen' : 'Lag min flytteplan' : 'Neste steg'}<Icon name="arrow" /></button></div>
        </form>
        {!state.created && <div className="mt-6 border-t border-slate-100 pt-5 text-center"><p className="mb-2 text-xs text-slate-500">Bare nysgjerrig på hvordan det ser ut?</p><button type="button" className="text-sm font-semibold text-teal-800 underline underline-offset-4" onClick={() => { update(() => demoState()); void navigate('/tidslinje'); }}>Prøv en eksempelreise →</button></div>}
      </section>
    </div>
  </main></Shell>;
}
