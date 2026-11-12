import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import type { Route } from './+types/tidslinje';
import { useMoving } from '~/components/moving-provider';
import { TaskDetail, TaskList, TimelineView } from '~/components/plan-views';
import { HouseIllustration, Icon, Shell } from '~/components/ui';
import { demoState, formatDate, hasMoveDate, validDate, generatePlan, getProgress, summarize } from '~/lib/moving-plan';

export function meta({}: Route.MetaArgs) {
  return [{ title: 'Din flytteplan – Flyttehjelpen' }, { name: 'description', content: 'Se oppgaver for overtakelse og innflytting som tidslinje eller som en liste du kan krysse av.' }];
}

type View = 'tidslinje' | 'oppgaver';

export default function Plan() {
  const { state, update, reset, ready } = useMoving();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const view: View = params.get('visning') === 'oppgaver' ? 'oppgaver' : 'tidslinje';
  const tasks = generatePlan(state.profile);
  const stats = summarize(tasks, state);
  const next = tasks.find((task) => getProgress(state, task.id).status !== 'done');
  const selected = params.get('oppgave');
  const [showTimeline, setShowTimeline] = useState(true);
  const current = tasks.find((task) => task.id === selected) ?? next ?? tasks[0];
  const detail = useRef<HTMLDivElement>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const resetDialog = useRef<HTMLDialogElement>(null);
  const p = state.profile;

  useEffect(() => {
    // Wait for the saved profile before resolving missing or outdated task IDs.
    if (!ready || !state.created || !current || selected === current.id) return;
    setParams((previous) => {
      const updated = new URLSearchParams(previous);
      updated.set('oppgave', current.id);
      return updated;
    }, { replace: true, preventScrollReset: true });
  }, [ready, state.created, current?.id, selected, setParams]);

  useEffect(() => {
    if (confirmReset) resetDialog.current?.showModal();
    else resetDialog.current?.close();
  }, [confirmReset]);

  function setView(next: View) {
    setParams((previous) => {
      const updated = new URLSearchParams(previous);
      if (next === 'oppgaver') updated.set('visning', 'oppgaver');
      else updated.delete('visning');
      return updated;
    }, { replace: true, preventScrollReset: true });
  }

  function select(id: string) {
    setParams((previous) => {
      const updated = new URLSearchParams(previous);
      updated.set('oppgave', id);
      updated.delete('visning');
      return updated;
    }, { preventScrollReset: true });
    window.setTimeout(() => detail.current?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'nearest' }), 0);
  }

  if (ready && !state.created) return <Shell><main className="mx-auto max-w-xl px-5 py-16 text-center"><HouseIllustration /><h1 className="text-3xl font-semibold tracking-tight">Flytteplanen din starter her</h1><p className="mt-3 text-kveld-500">Fortell oss hvor, når og med hvem du flytter, så lager vi en plan som passer deg.</p><Link className="button-primary mt-6" to="/">Lag min flytteplan<Icon name="arrow" /></Link></main></Shell>;

  return <Shell><main className="mx-auto max-w-5xl px-5 pb-8 pt-8 sm:px-8 sm:pt-12">
    <div className="flex flex-wrap items-center justify-between gap-3"><p className="eyebrow">Din flytteplan</p><Link className="text-sm font-semibold text-syrin-600 underline underline-offset-4" to="/">Endre svarene mine</Link></div>
    <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">Din vei til et nytt hjem</h1>

    <div className="mt-6 grid gap-3 sm:grid-cols-[1fr_auto]">
      <div className="flex flex-wrap items-center gap-x-5 gap-y-3 rounded-2xl bg-kveld-50 px-5 py-4 text-sm">
        <div className="flex min-w-0 items-center gap-2.5"><Icon name="pin" className="text-syrin-600" /><div className="min-w-0"><p className="text-xs text-kveld-500">Fra{validDate(p.moveOutDate) ? ` · ut ${formatDate(p.moveOutDate)}` : ''}</p><p className="break-words font-medium">{p.fromAddress}</p></div></div>
        <Icon name="arrow" className="hidden text-kveld-300 sm:block" />
        <div className="flex min-w-0 items-center gap-2.5"><Icon name="home" className="text-syrin-600" /><div className="min-w-0"><p className="text-xs text-kveld-500">Til</p><p className="break-words font-medium">{p.toAddress}</p><p className="mt-1 text-xs text-kveld-500">Overtakelse: {validDate(p.handoverDate) ? formatDate(p.handoverDate, true) : 'Ikke avklart'}</p><p className="mt-1 text-xs text-kveld-500">Innflytting: {hasMoveDate(p) ? formatDate(p.moveDate, true) : 'Ikke avklart'}</p></div></div>
      </div>
      <div className="flex items-center gap-4 rounded-2xl bg-sol px-5 py-4">
        <p className="text-3xl font-semibold tracking-tight">{stats.done}<span className="text-base font-normal text-kveld-500"> / {stats.total}</span></p>
        <div><p className="text-sm font-semibold">oppgaver gjort</p><progress aria-label="Gjennomførte oppgaver" className="mt-1.5 h-1.5 w-28 overflow-hidden rounded-full [&::-moz-progress-bar]:bg-syrin-500 [&::-webkit-progress-bar]:bg-white [&::-webkit-progress-value]:bg-syrin-500" value={stats.done} max={Math.max(stats.total, 1)} /></div>
      </div>
    </div>

    <div role="group" aria-label="Velg visning" className="mt-8 inline-flex rounded-full bg-kveld-50 p-1 shadow-[inset_0_0_0_1px_var(--color-kveld-100)]">
      {([['tidslinje', 'Tidslinje', 'timeline'], ['oppgaver', 'Oppgaver', 'list']] as const).map(([id, label, icon]) => <button key={id} type="button" aria-pressed={view === id} onClick={() => setView(id)}
        className={`inline-flex min-h-11 items-center gap-2 rounded-full px-5 text-sm font-semibold transition ${view === id ? 'bg-white text-kveld-900 shadow-[0_2px_8px_-2px_rgba(20,26,69,0.2)]' : 'text-kveld-500 hover:text-kveld-900'}`}><Icon name={icon} className="h-4 w-4" />{label}</button>)}
    </div>

    <div className="mt-6">
      {view === 'tidslinje' ? <>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-kveld-500">{showTimeline ? <>Trykk på en oppgave for å se hva du skal gjøre.<span className="sm:hidden"> Sveip sidelengs for å se hele tidslinjen.</span></> : 'Tidslinjen er skjult. Vis den igjen for å velge en annen oppgave.'}</p>
          <button type="button" className="button-secondary shrink-0" aria-expanded={showTimeline} aria-controls="plan-timeline" onClick={() => setShowTimeline((shown) => !shown)}>
            <Icon name="timeline" className="h-4 w-4" />{showTimeline ? 'Skjul tidslinje' : 'Vis tidslinje'}
          </button>
        </div>
        <div id="plan-timeline" hidden={!showTimeline}><TimelineView tasks={tasks} selected={current?.id ?? null} onSelect={select} /></div>
        <div ref={detail} className="mx-auto mt-6 max-w-2xl scroll-mt-6">{current && <TaskDetail task={current} />}</div>
      </> : <TaskList tasks={tasks} onShowInTimeline={(id) => { setShowTimeline(true); select(id); }} />}
    </div>

    <p className="mt-10 text-xs leading-6 text-kveld-500">Tidspunktene er anbefalinger, ikke bindende frister. Sjekk avtaler og gjeldende regler hos den aktuelle tjenesten.</p>
    <button type="button" className="mt-2 text-xs font-medium text-kveld-500 underline underline-offset-4" onClick={() => setConfirmReset(true)}>Start på nytt</button>

    <dialog ref={resetDialog} onCancel={() => setConfirmReset(false)} onClose={() => setConfirmReset(false)} aria-labelledby="reset-title" className="fixed inset-0 m-auto max-w-md rounded-3xl border-0 p-6 text-kveld-900 shadow-2xl backdrop:bg-kveld-900/40">
      <h2 id="reset-title" className="text-xl font-semibold">Starte med blanke ark?</h2><p className="mt-3 text-sm leading-6 text-kveld-500">Dette erstatter svar og avkryssinger i denne nettleseren.</p>
      <div className="mt-5 flex flex-col gap-2"><button className="button-primary" type="button" onClick={() => { reset(); setConfirmReset(false); void navigate('/'); }}>Slett planen og start på nytt</button><button className="button-secondary" type="button" onClick={() => { update(() => demoState()); setParams((previous) => { const updated = new URLSearchParams(previous); updated.delete('oppgave'); return updated; }, { replace: true, preventScrollReset: true }); setConfirmReset(false); }}>Start eksempelreisen på nytt</button><button autoFocus className="button-secondary" type="button" onClick={() => setConfirmReset(false)}>Behold planen</button></div>
    </dialog>
  </main></Shell>;
}
