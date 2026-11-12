import { useEffect, useState } from 'react';
import { useMoving } from './moving-provider';
import { Icon } from './ui';
import { PartnerOffers } from './partner-offers';
import { hasPartnerOffers } from '~/lib/partner-offers';
import { addDays, categories, hasMoveDate, getProgress, relativeLabel, taskAnchorDate, taskTimelineDay, type Category, type MovingTask, type TaskProgress } from '~/lib/moving-plan';

const categoryStyle: Record<Category, string> = {
  formal: 'bg-himmel text-kveld-900',
  practical: 'bg-eng text-kveld-900',
  other: 'bg-sol text-kveld-900',
};
const categoryName = Object.fromEntries(categories.map((category) => [category.id, category.title])) as Record<Category, string>;

function taskDate(profile: Parameters<typeof hasMoveDate>[0], task: MovingTask) {
  const date = addDays(taskAnchorDate(profile, task), task.offset);
  return date ? new Intl.DateTimeFormat('nb-NO', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' }).format(date) : '';
}

function useTaskProgress(task: MovingTask) {
  const { state, update } = useMoving();
  const progress = getProgress(state, task);
  function change(patch: Partial<TaskProgress>) {
    update((saved) => ({ ...saved, progress: { ...saved.progress, [task.id]: { ...getProgress(saved, task), ...patch } } }));
  }
  return { progress, done: progress.status === 'done', change };
}

/* ---------- Liste ---------- */

function TaskRow({ task, onShowInTimeline }: { task: MovingTask; onShowInTimeline: () => void }) {
  const { state } = useMoving();
  const { done } = useTaskProgress(task);
  const date = taskDate(state.profile, task);
  return <li className={`flex items-start gap-3 rounded-2xl p-4 transition ${done ? 'bg-kveld-50' : 'bg-white shadow-[0_0_0_1px_var(--color-kveld-100)]'}`}>
    <span role="img" aria-label={done ? 'Gjennomført' : 'Ikke fullført'} className={`mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full ${done ? 'bg-ok-300 text-white' : 'bg-white shadow-[inset_0_0_0_2px_var(--color-kveld-300)]'}`}>
      {done && <Icon name="check" className="h-4 w-4" />}
    </span>
    <div className="min-w-0 flex-1">
      <button type="button" onClick={onShowInTimeline} className={`block rounded-sm text-left font-semibold ${done ? 'text-kveld-500 line-through decoration-kveld-300' : 'text-kveld-900'}`}>{task.title}</button>
      <span className={`mt-0.5 block text-sm leading-6 ${done ? 'text-kveld-300' : 'text-kveld-500'}`}>{task.summary}</span>
      <span className="mt-1.5 block text-xs font-medium text-kveld-500">{relativeLabel(task.offset, task.dateAnchor)}{date && ` · ${date}`}</span>
    </div>
    <button type="button" onClick={onShowInTimeline} className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-syrin-600 hover:bg-syrin-50" aria-label={`Vis «${task.title}» i tidslinjen`}><Icon name="timeline" /></button>
  </li>;
}

export function TaskList({ tasks, onShowInTimeline }: { tasks: MovingTask[]; onShowInTimeline: (id: string) => void }) {
  const { state } = useMoving();
  return <div className="space-y-10">{categories.map((category) => {
    const group = tasks.filter((task) => task.category === category.id).sort((a, b) => taskTimelineDay(state.profile, a) - taskTimelineDay(state.profile, b));
    if (!group.length) return null;
    const done = group.filter((task) => getProgress(state, task).status === 'done').length;
    return <section key={category.id} aria-labelledby={`cat-${category.id}`}>
      <div className="mb-4 flex items-end justify-between gap-4">
        <div className="flex items-center gap-3"><span aria-hidden="true" className={`h-8 w-8 shrink-0 rounded-full ${categoryStyle[category.id]}`} /><div><h2 id={`cat-${category.id}`} className="text-xl font-semibold tracking-tight">{category.title}</h2><p className="text-sm text-kveld-500">{category.description}</p></div></div>
        <span className="shrink-0 text-sm font-medium text-kveld-500">{done} av {group.length}</span>
      </div>
      <ul className="space-y-2">{group.map((task) => <TaskRow key={task.id} task={task} onShowInTimeline={() => onShowInTimeline(task.id)} />)}</ul>
    </section>;
  })}</div>;
}

/* ---------- Oppgavekort med valgfrie partnertilbud ---------- */

export function TaskDetail({ task }: { task: MovingTask }) {
  const { state } = useMoving();
  const { progress, done, change } = useTaskProgress(task);
  const date = taskDate(state.profile, task);

  return <div aria-live="polite">
    <article className="relative z-10 rounded-3xl bg-white p-5 shadow-[0_0_0_1px_var(--color-kveld-100),0_24px_60px_-34px_rgba(20,26,69,0.35)] sm:p-7">
      <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
        <span className={`rounded-full px-2.5 py-1 ${categoryStyle[task.category]}`}>{categoryName[task.category]}</span>
        <span className="text-kveld-500">{relativeLabel(task.offset, task.dateAnchor)}{date && ` · ${date}`}</span>
        {done && <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-ok-100 px-2.5 py-1 text-ok-500"><Icon name="check" className="h-3.5 w-3.5" />Gjennomført</span>}
      </div>
      <h2 className="mt-4 text-2xl font-semibold tracking-tight">{task.title}</h2>
      <p className="mt-2 text-base leading-7 text-kveld-500">{task.summary}</p>
      {task.resources && <section aria-label="Nyttige lenker" className="mt-5 rounded-2xl bg-syrin-50 p-4">
        <h3 className="text-sm font-semibold">Nyttige lenker</h3>
        <p className="mt-2 text-sm leading-6 text-kveld-700">{task.resources.description}</p>
        <ul className="mt-3 space-y-3">
          {task.resources.links.map((link) => <li key={link.href}>
            <a href={link.href} className="rounded-sm text-sm font-semibold text-syrin-600 underline underline-offset-4">{link.title}</a>
            <p className="mt-1 text-sm leading-6 text-kveld-700">{link.description}</p>
          </li>)}
        </ul>
      </section>}
      <fieldset className="mt-5"><legend className="text-sm font-semibold">Oppgaver</legend><div className="mt-2 space-y-1">
        {task.checks.map((text, index) => {
          const key = task.checkKeys?.[index] ?? String(index);
          return <label key={key} className="flex cursor-pointer items-start gap-3 rounded-lg py-2 text-sm leading-6 text-kveld-700"><input type="checkbox" className="check-input mt-1" checked={progress.checks[key] ?? false} onChange={(event) => change({ checks: { ...progress.checks, [key]: event.target.checked } })} /><span>{text}</span></label>;
        })}
      </div></fieldset>
      {task.doneWhen?.trim() && <p className="mt-3 rounded-2xl bg-kveld-50 p-3 text-sm leading-6 text-kveld-700"><strong className="font-semibold">Du er ferdig når:</strong> {task.doneWhen}</p>}
    </article>
    {hasPartnerOffers(task.id) && <PartnerOffers key={task.id} taskId={task.id} />}
  </div>;
}
