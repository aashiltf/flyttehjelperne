import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import type { Route } from './+types/tidslinje';
import { useMoving } from '~/components/moving-provider';
import { HouseIllustration, Icon, Shell } from '~/components/ui';
import { TaskCard } from '~/components/task-card';
import { demoState, generatePlan, getProgress, phases, suggestedDate, summarize, type TaskStatus } from '~/lib/moving-plan';

export function meta({}: Route.MetaArgs) {
  return [{ title: 'Din flyttetidslinje – Flyttehjelpen' }, { name: 'description', content: 'Din personlige flytteplan. Se neste steg, kryss av oppgaver og få oversikt over det som gjenstår.' }];
}

const filters: { id: 'all' | TaskStatus; label: string }[] = [
  { id: 'all', label: 'Alle oppgaver' }, { id: 'todo', label: 'Gjenstår' }, { id: 'waiting', label: 'Venter på svar' }, { id: 'done', label: 'Ferdig' }, { id: 'irrelevant', label: 'Gjelder ikke' },
];

export default function Timeline() {
  const { state, update, reset, ready } = useMoving();
  const navigate = useNavigate();
  const [filter, setFilter] = useState<'all' | TaskStatus>('all');
  const [openTask, setOpenTask] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const resetDialog = useRef<HTMLDialogElement>(null);
  const tasks = generatePlan(state.profile);
  const stats = summarize(tasks, state);
  const next = tasks.find((task) => getProgress(state, task.id).status === 'todo');
  const visible = tasks.filter((task) => filter === 'all' || getProgress(state, task.id).status === filter);
  const p = state.profile;

  useEffect(() => {
    if (confirmReset) resetDialog.current?.showModal();
    else resetDialog.current?.close();
  }, [confirmReset]);

  function showNext() {
    if (!next) return;
    setFilter('all');
    setOpenTask(next.id);
    window.setTimeout(() => {
      const card = document.getElementById(`task-${next.id}`);
      card?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' });
      card?.querySelector('button')?.focus({ preventScroll: true });
    }, 0);
  }

  return <Shell>{ready && !state.created ? <main className="mx-auto max-w-xl px-5 py-16 text-center"><HouseIllustration /><h1 className="text-3xl font-semibold tracking-tight">Flytteplanen din starter her</h1><p className="mt-3 text-slate-600">Svar på noen korte spørsmål, så lager vi en tidslinje som passer flyttingen din.</p><Link className="button-primary mt-6" to="/">Lag min flytteplan<Icon name="arrow" /></Link></main> : <main className="mx-auto max-w-6xl px-5 pb-8 pt-8 sm:px-8 sm:pt-12">
    <div className="flex flex-wrap items-center justify-between gap-3"><p className="eyebrow">Ditt neste kapittel</p><Link className="text-xs font-semibold text-teal-800 underline underline-offset-4" to="/">Endre svarene mine</Link></div>
    <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">Din vei til et nytt hjem</h1>
    <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">{p.household === 'partner' ? 'Tilpasset dere som flytter sammen' : 'Tilpasset deg som flytter alene'}{p.fromTenure === 'rent' && p.toTenure === 'own' ? ', fra leid til eid bolig' : p.toTenure === 'rent' ? ', til en leid bolig' : ', til en eid bolig'}. Ta ett steg om gangen — vi hjelper deg å holde oversikten.</p>
    <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-3 rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm">
      <div className="flex min-w-0 items-center gap-3"><Icon name="pin" className="text-teal-700" /><div className="min-w-0"><p className="text-xs text-slate-500">Fra</p><p className="break-words font-medium">{p.fromAddress}</p></div></div>
      <Icon name="arrow" className="hidden text-slate-400 sm:block" />
      <div className="flex min-w-0 items-center gap-3"><Icon name="home" className="text-teal-700" /><div className="min-w-0"><p className="text-xs text-slate-500">Til</p><p className="break-words font-medium">{p.toAddress}</p></div></div>
      <div className="flex items-center gap-3 sm:ml-auto"><Icon name="calendar" className="text-teal-700" /><div><p className="text-xs text-slate-500">Innflytting</p><p className="font-medium">{p.dateUnknown ? 'Dato ikke bestemt' : suggestedDate(p.moveDate, 0)}</p></div></div>
    </div>
    <div className="mt-8 grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_300px] lg:gap-10">
      <div>
        <div className="mb-6 flex flex-wrap gap-2" role="group" aria-label="Filtrer oppgaver">{filters.map(({ id, label }) => <button key={id} type="button" aria-pressed={filter === id} onClick={() => setFilter(id)} className={`min-h-10 rounded-full border px-3.5 py-2 text-xs font-semibold transition ${filter === id ? 'border-teal-700 bg-teal-700 text-white' : 'border-slate-200 bg-white text-slate-600 hover:border-teal-500'}`}>{label}{id === 'done' && ` (${stats.done})`}</button>)}</div>
        {!visible.length && <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center"><Icon name="check" className="mx-auto mb-3 text-teal-700" /><h2 className="font-semibold">Ingen oppgaver her akkurat nå</h2><p className="mt-2 text-sm text-slate-500">{filter === 'todo' ? 'Du har ingen oppgaver med status «Gjenstår». Se også oppgaver som venter på svar.' : 'Oppgavene dukker opp her når du endrer status.'}</p><button className="mt-4 text-sm font-semibold text-teal-800 underline underline-offset-4" type="button" onClick={() => setFilter('all')}>Vis alle oppgaver</button></div>}
        <div className="space-y-8">{phases.map((phase, index) => {
          const phaseTasks = visible.filter((task) => task.phase === phase.id);
          if (!phaseTasks.length) return null;
          return <section key={phase.id} aria-labelledby={`phase-${phase.id}`}>
            <div className="mb-4 flex items-center gap-3"><span className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-teal-200 bg-teal-50 text-xs font-bold text-teal-800">{index + 1}</span><div><h2 id={`phase-${phase.id}`} className="text-lg font-semibold tracking-tight">{phase.title}</h2><p className="text-xs text-slate-500">{phase.description}</p></div><span className="ml-auto text-xs text-slate-500">{phaseTasks.length} oppgaver</span></div>
            <div className="space-y-3 border-l-2 border-teal-100 pl-3 sm:ml-4 sm:pl-5">{phaseTasks.map((task) => <TaskCard key={task.id} task={task} open={openTask === task.id} onToggle={() => setOpenTask(openTask === task.id ? null : task.id)} />)}</div>
          </section>;
        })}</div>
        <p className="mt-6 text-xs leading-6 text-slate-500">Tidspunktene er anbefalinger, ikke bindende frister. Sjekk avtaler og gjeldende regler hos den aktuelle tjenesten.</p>
      </div>
      <aside className="order-first space-y-5 lg:sticky lg:top-6 lg:order-last" aria-label="Din fremdrift">
        <section className="rounded-2xl bg-[#e7f0e9] p-5 sm:p-6">
          <div className="flex items-center justify-between"><h2 className="text-sm font-semibold text-teal-950">Du er på vei</h2><Icon name="spark" className="text-teal-700" /></div>
          <p className="mt-5 text-3xl font-semibold tracking-tight text-teal-950">{stats.done}<span className="text-lg font-normal text-teal-800"> av {stats.total}</span></p><p className="mt-1 text-xs text-teal-900">relevante oppgaver fullført</p>
          <progress aria-label="Fullførte relevante oppgaver" className="mt-4 h-2 w-full overflow-hidden rounded-full [&::-moz-progress-bar]:bg-teal-700 [&::-webkit-progress-bar]:bg-white/70 [&::-webkit-progress-value]:bg-teal-700" value={stats.done} max={Math.max(stats.total, 1)} />
          <p className="mt-3 text-xs leading-6 text-teal-900" aria-live="polite">{stats.remaining} gjenstår{stats.waiting > 0 ? `, hvorav ${stats.waiting} venter på svar` : ''}.</p>
          {next ? <div className="mt-5 border-t border-teal-900/10 pt-5"><p className="eyebrow !text-[10px]">Ditt neste steg</p><h3 className="mt-2 text-sm font-semibold leading-6 text-teal-950">{next.title}</h3><button type="button" onClick={showNext} className="button-primary mt-4 w-full">Ta neste steg<Icon name="arrow" className="h-4 w-4" /></button></div> : <div className="mt-5 border-t border-teal-900/10 pt-4"><p className="text-sm font-semibold text-teal-950">{stats.waiting ? 'Du har gjort ditt for nå.' : stats.total === 0 ? 'Planen er tilpasset deg.' : 'Godt jobbet. Du har oversikten!'}</p><p className="mt-2 text-xs leading-6 text-teal-900">{stats.waiting ? 'Følg opp oppgavene som venter på svar når du hører noe.' : 'Du kan åpne oppgaver igjen og endre svarene dine når som helst.'}</p></div>}
        </section>
        <div className="hidden rounded-2xl border border-slate-200 bg-white p-5 lg:block"><p className="text-sm font-semibold">En ting om gangen er nok.</p><p className="mt-2 text-xs leading-6 text-slate-500">Du trenger ikke ordne alt i dag. Planen husker hvor du er, også når du tar en pause.</p></div>
        <div className="flex flex-wrap gap-4 px-1 text-xs"><button type="button" className="font-medium text-slate-500 underline underline-offset-4" onClick={() => setConfirmReset(true)}>Start på nytt</button></div>
      </aside>
    </div>
    <dialog ref={resetDialog} onCancel={() => setConfirmReset(false)} onClose={() => setConfirmReset(false)} aria-labelledby="reset-title" className="fixed inset-0 m-auto max-w-md rounded-2xl border-0 p-6 shadow-2xl backdrop:bg-slate-900/40">
      <h2 id="reset-title" className="text-xl font-semibold">Starte med blanke ark?</h2><p className="mt-3 text-sm leading-6 text-slate-600">Dette erstatter svar og avkryssinger i denne nettleseren. Velg en tom plan eller en ferdig utfylt eksempelreise.</p>
      <div className="mt-5 flex flex-col gap-2"><button className="button-primary" type="button" onClick={() => { reset(); setConfirmReset(false); void navigate('/'); }}>Slett planen og start på nytt</button><button className="button-secondary" type="button" onClick={() => { update(() => demoState()); setOpenTask(null); setFilter('all'); setConfirmReset(false); }}>Start eksempelreisen på nytt</button><button autoFocus className="button-secondary" type="button" onClick={() => setConfirmReset(false)}>Behold planen</button></div>
    </dialog>
  </main>}</Shell>;
}
