import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import type { Route } from './+types/tidslinje';
import { useMoving } from '~/components/moving-provider';
import { MoveSummary } from '~/components/move-summary';
import { TaskList } from '~/components/plan-views';
import { TimelineView } from '~/components/timeline-view';
import { HouseIllustration, Icon, Shell } from '~/components/ui';
import { demoState, generatePlan, summarize } from '~/lib/moving-plan';

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
  const selected = params.get('oppgave');
  const [verticalTimeline, setVerticalTimeline] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const resetDialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    // Remove stale links after profile edits; leave the timeline unselected on arrival.
    if (!ready || !selected || tasks.some((task) => task.id === selected)) return;
    setParams((previous) => {
      const updated = new URLSearchParams(previous);
      updated.delete('oppgave');
      return updated;
    }, { replace: true, preventScrollReset: true });
  }, [ready, selected, tasks, setParams]);

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
      if (updated.get('oppgave') === id) updated.delete('oppgave');
      else updated.set('oppgave', id);
      updated.delete('visning');
      return updated;
    }, { preventScrollReset: true });
  }

  if (ready && !state.created) return <Shell><main className="mx-auto max-w-xl px-5 py-16 text-center"><HouseIllustration /><h1 className="text-3xl font-semibold tracking-tight">Flytteplanen din starter her</h1><p className="mt-3 text-kveld-500">Fortell oss hvor, når og med hvem du flytter, så lager vi en plan som passer deg.</p><Link className="button-primary mt-6" to="/">Lag min flytteplan<Icon name="arrow" /></Link></main></Shell>;

  return <Shell><main className="mx-auto max-w-5xl px-5 pb-8 pt-8 sm:px-8 sm:pt-12">
    <p className="eyebrow">Din flytteplan</p>
    <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">Din vei til et nytt hjem</h1>

    <div className="mt-6 grid items-start gap-3 lg:grid-cols-[minmax(0,1fr)_auto]">
      <MoveSummary />
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
          <p className="text-sm text-kveld-500">{verticalTimeline ? 'Oppgavene står til høyre for linjen. Trykk for å åpne en oppgave.' : 'Trykk på en sirkel for å se oppgavene for datoen.'}</p>
          <button type="button" className="button-secondary shrink-0" aria-pressed={verticalTimeline} aria-controls="plan-timeline" onClick={() => setVerticalTimeline((shown) => !shown)}>
            <Icon name="timeline" className="h-4 w-4" />{verticalTimeline ? 'Vis kompakt tidslinje' : 'Vis oppgaver på tidslinjen'}
          </button>
        </div>
        <div id="plan-timeline"><TimelineView tasks={tasks} selected={selected} onSelect={select} vertical={verticalTimeline} /></div>
      </> : <TaskList tasks={tasks} onShowInTimeline={(id) => { setVerticalTimeline(false); select(id); }} />}
    </div>

    <p className="mt-10 text-xs leading-6 text-kveld-500">Tidspunktene er anbefalinger, ikke bindende frister. Sjekk avtaler og gjeldende regler hos den aktuelle tjenesten.</p>
    <button type="button" className="mt-2 text-xs font-medium text-kveld-500 underline underline-offset-4" onClick={() => setConfirmReset(true)}>Start på nytt</button>

    <dialog ref={resetDialog} onCancel={() => setConfirmReset(false)} onClose={() => setConfirmReset(false)} aria-labelledby="reset-title" className="fixed inset-0 m-auto max-w-md rounded-3xl border-0 p-6 text-kveld-900 shadow-2xl backdrop:bg-kveld-900/40">
      <h2 id="reset-title" className="text-xl font-semibold">Starte med blanke ark?</h2><p className="mt-3 text-sm leading-6 text-kveld-500">Dette erstatter svar og avkryssinger i denne nettleseren.</p>
      <div className="mt-5 flex flex-col gap-2"><button className="button-primary" type="button" onClick={() => { reset(); setConfirmReset(false); void navigate('/'); }}>Slett planen og start på nytt</button><button className="button-secondary" type="button" onClick={() => { update(() => demoState()); setParams((previous) => { const updated = new URLSearchParams(previous); updated.delete('oppgave'); return updated; }, { replace: true, preventScrollReset: true }); setConfirmReset(false); }}>Start eksempelreisen på nytt</button><button autoFocus className="button-secondary" type="button" onClick={() => setConfirmReset(false)}>Behold planen</button></div>
    </dialog>
  </main></Shell>;
}
