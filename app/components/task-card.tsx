import { useState } from 'react';
import { useMoving } from './moving-provider';
import { Icon } from './ui';
import { getProgress, suggestedDate, type MovingTask, type TaskProgress, type TaskStatus } from '~/lib/moving-plan';

export const statusLabels: Record<TaskStatus, string> = { todo: 'Gjenstår', waiting: 'Venter på svar', done: 'Ferdig', irrelevant: 'Gjelder ikke' };

export function TaskCard({ task, open, onToggle }: { task: MovingTask; open: boolean; onToggle: () => void }) {
  const { state, update } = useMoving();
  const progress = getProgress(state, task.id);
  const [offerOpen, setOfferOpen] = useState(false);
  const isDone = progress.status === 'done';
  const date = state.profile.dateUnknown ? '' : suggestedDate(state.profile.moveDate, task.offset);

  function change(patch: Partial<TaskProgress>) {
    update((saved) => ({ ...saved, progress: { ...saved.progress, [task.id]: { ...getProgress(saved, task.id), ...patch } } }));
  }

  return <article id={`task-${task.id}`} className={`overflow-hidden rounded-2xl border bg-white transition ${open ? 'border-teal-300 shadow-[0_8px_30px_-20px_rgba(15,118,110,0.3)]' : 'border-slate-200'} ${progress.status === 'irrelevant' ? 'opacity-75' : ''}`}>
    <h3><button type="button" className="flex w-full items-start gap-3 p-4 text-left sm:gap-4 sm:p-5" aria-expanded={open} aria-controls={`details-${task.id}`} onClick={onToggle}>
      <span className={`mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full ${isDone ? 'bg-teal-700 text-white' : progress.status === 'waiting' ? 'bg-amber-100 text-amber-800' : 'border border-slate-200 bg-slate-50 text-slate-400'}`}>
        {isDone ? <Icon name="check" className="h-4 w-4" /> : progress.status === 'waiting' ? <Icon name="clock" className="h-4 w-4" /> : progress.status === 'irrelevant' ? <span aria-hidden="true">–</span> : <span className="h-2 w-2 rounded-full bg-current" />}
      </span>
      <span className="min-w-0 flex-1"><span className={`block text-sm font-semibold sm:text-base ${isDone ? 'text-teal-900' : 'text-slate-800'}`}>{task.title}</span><span className="mt-1 block text-sm font-normal leading-6 text-slate-500">{task.summary}</span><span className="mt-2 flex flex-wrap items-center gap-2 text-xs font-medium"><span className={`rounded-full px-2 py-0.5 ${isDone ? 'bg-teal-50 text-teal-800' : progress.status === 'waiting' ? 'bg-amber-50 text-amber-900' : 'bg-slate-100 text-slate-600'}`}>{statusLabels[progress.status]}</span>{date && <span className="font-normal text-slate-500">{task.offset === 0 ? 'Flyttedagen' : `Anbefalt ${date}`}</span>}</span></span>
      <Icon name="chevron" className={`mt-1 h-4 w-4 text-slate-400 transition ${open ? 'rotate-90' : ''}`} />
    </button></h3>
    {open && <div id={`details-${task.id}`} className="border-t border-slate-100 p-4 sm:p-6 sm:pt-5">
      <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-teal-700">Derfor er dette med i planen</p>
      <p className="text-sm leading-6 text-slate-600">{task.why}</p>
      {task.question && <fieldset className="mt-5"><legend className="mb-3 text-sm font-semibold">{task.question.text}</legend><div className="flex flex-wrap gap-2">{task.question.options.map((answer) => <label key={answer} className={`choice-small !px-3 !py-2 ${progress.answer === answer ? 'choice-selected' : ''}`}><input type="radio" className="accent-teal-700" name={`answer-${task.id}`} checked={progress.answer === answer} onChange={() => change({ answer })} />{answer}</label>)}</div></fieldset>}
      <fieldset className="mt-5"><legend className="text-sm font-semibold">Dette kan du gjøre</legend><div className="mt-2 space-y-1">{task.checks.map((text, index) => <label key={text} className="flex cursor-pointer items-start gap-3 rounded-lg px-1 py-2.5 text-sm leading-6"><input type="checkbox" className="check-input mt-1" checked={progress.checks[String(index)] ?? false} onChange={(event) => change({ checks: { ...progress.checks, [index]: event.target.checked } })} /><span>{text}</span></label>)}</div></fieldset>
      <p className="mt-3 rounded-xl bg-slate-50 p-3 text-xs leading-6 text-slate-600"><strong>Du er ferdig når:</strong> {task.doneWhen}</p>
      {task.partner && <aside aria-label="Generisk partnertilbud" className="mt-5 rounded-2xl border border-[#e6d9ba] bg-[#fcf8ee] p-4 sm:p-5">
        <p className="text-[10px] font-bold uppercase tracking-[0.13em] text-[#7b6739]">Partnertilbud · Demoeksempel</p>
        <div className="mt-2 flex items-start gap-3"><Icon name="shield" className="mt-0.5 text-[#8b743f]" /><div><h4 className="text-sm font-semibold text-slate-800">Trenger du hjelp til å sjekke innboforsikringen?</h4><p className="mt-2 text-sm leading-6 text-slate-600">En forsikringspartner kan hjelpe deg å vurdere behovet. Sjekk avtalen du allerede har først — du trenger kanskje ikke en ny.</p></div></div>
        <div className="mt-4 flex flex-wrap items-center gap-3"><button type="button" className="rounded-lg border border-[#d6c69f] bg-white px-3 py-2 text-xs font-semibold text-[#67542c]" onClick={() => setOfferOpen(!offerOpen)} aria-expanded={offerOpen}>Se demoeksempel</button><button type="button" className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700" onClick={() => change({ answer: 'Ja', status: 'done' })}>Dette har jeg allerede ordnet</button></div>
        {offerOpen && <div className="mt-4 border-t border-[#e6d9ba] pt-3 text-sm leading-6 text-slate-600"><p className="font-semibold text-slate-800">Eksempel: Veiledning om innboforsikring</p><p>Her vil du kunne gå videre til en partner for å sjekke dekning og få et eventuelt tilbud. Det er ingen pris, bestilling eller ekte partnerintegrasjon i denne demoen.</p></div>}
      </aside>}
      <div className="mt-5 flex flex-wrap gap-2">
        <button type="button" className={isDone ? 'button-secondary' : 'button-primary'} onClick={() => change({ status: isDone ? 'todo' : 'done' })}><Icon name={isDone ? 'arrow' : 'check'} className="h-4 w-4" />{isDone ? 'Åpne oppgaven igjen' : 'Marker som ferdig'}</button>
        <button type="button" className="button-secondary" onClick={() => change({ status: progress.status === 'waiting' ? 'todo' : 'waiting' })}>{progress.status === 'waiting' ? 'Tilbake til gjenstår' : 'Venter på svar'}</button>
        <button type="button" className="min-h-12 rounded-lg px-3 text-xs font-medium text-slate-600 underline underline-offset-4" onClick={() => change({ status: progress.status === 'irrelevant' ? 'todo' : 'irrelevant' })}>{progress.status === 'irrelevant' ? 'Gjelder meg likevel' : 'Gjelder ikke meg'}</button>
      </div>
    </div>}
  </article>;
}
