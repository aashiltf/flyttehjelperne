import { useEffect, useRef, useState } from 'react';
import { useMoving } from './moving-provider';
import { Icon } from './ui';
import { PartnerOffers } from './partner-offers';
import { hasPartnerOffers } from '~/lib/partner-offers';
import { addDays, categories, hasMoveDate, daysBetween, getProgress, relativeLabel, taskAnchorDate, taskTimelineDay, toIsoDate, validDate, type Category, type MovingTask, type TaskProgress } from '~/lib/moving-plan';

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

/* ---------- Tidslinje ---------- */

type Marker = { id: string; label: string; day: number; className: string; line: string };

const CHIP = 168;
const LANE = 100;

function lanes<T>(items: T[], x: (item: T) => number, gap: number) {
  const ends: number[] = [];
  return items.map((item) => {
    const position = x(item);
    let lane = ends.findIndex((end) => end + gap <= position);
    if (lane === -1) { lane = ends.length; ends.push(position); } else ends[lane] = position;
    return lane;
  });
}

export function TimelineView({ tasks, selected, onSelect }: { tasks: MovingTask[]; selected: string | null; onSelect: (id: string) => void }) {
  const { state } = useMoving();
  const p = state.profile;
  const track = useRef<HTMLDivElement>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const scrolled = useRef(false);
  const [width, setWidth] = useState(760);
  const [today, setToday] = useState('');

  useEffect(() => {
    setToday(toIsoDate(new Date()));
    const element = track.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => setWidth(Math.max(760, entry.contentRect.width)));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const known = hasMoveDate(p);
  const handoverKnown = validDate(p.handoverDate);
  const referenceDate = known ? p.moveDate : handoverKnown ? p.handoverDate : '';
  const dayFor = (date: string) => referenceDate && validDate(date) ? daysBetween(referenceDate, date) : 0;
  const dayOf = (task: MovingTask) => taskTimelineDay(p, task);
  const markers: Marker[] = [
    { id: 'in', label: known ? 'Innflytting' : 'Innflytting · ukjent dato', day: 0, className: 'bg-syrin-500 text-white', line: 'bg-syrin-500' },
    { id: 'handover', label: handoverKnown ? 'Overtakelse' : 'Overtakelse · ukjent dato', day: dayFor(p.handoverDate), className: 'bg-ok-100 text-kveld-900', line: 'bg-ok-300' },
  ];
  if (referenceDate && validDate(p.moveOutDate)) markers.push({ id: 'out', label: 'Utflytting', day: dayFor(p.moveOutDate), className: 'bg-varsel-300 text-kveld-900', line: 'bg-varsel-300' });
  if (referenceDate && today) markers.push({ id: 'today', label: 'I dag', day: dayFor(today), className: 'bg-kveld-900 text-white', line: 'bg-kveld-900' });

  const days = [...tasks.map(dayOf), ...markers.map((marker) => marker.day)];
  const start = Math.min(...days) - 6;
  const end = Math.max(...days) + 6;
  const x = (day: number) => 24 + ((day - start) / (end - start)) * (width - 48);

  const sortedMarkers = [...markers].sort((a, b) => a.day - b.day);
  const markerLanes = lanes(sortedMarkers, (marker) => x(marker.day), 176);
  const markerRows = Math.max(...markerLanes) + 1;
  const sorted = [...tasks].sort((a, b) => dayOf(a) - dayOf(b));
  const taskLanes = lanes(sorted, (task) => x(dayOf(task)), CHIP + 8);
  const taskRows = Math.max(0, ...taskLanes) + 1;

  const axisY = markerRows * 32 + 34;
  const height = axisY + 28 + taskRows * LANE;
  const ticks: number[] = [];
  for (let day = Math.ceil(start / 7) * 7; day <= end; day += 7) if (day !== 0) ticks.push(day);

  const selectedTask = sorted.find((task) => task.id === selected);
  const focusDay = markers.find((marker) => marker.id === 'today')?.day ?? (selectedTask ? dayOf(selectedTask) : 0);
  useEffect(() => {
    const element = scroller.current;
    if (!element || scrolled.current || !today && known) return;
    scrolled.current = true;
    if (element.scrollWidth > element.clientWidth) element.scrollLeft = x(focusDay) - element.clientWidth / 3;
  });

  return <>
    {(!known || !handoverKnown) && <p className="mb-4 rounded-2xl bg-himmel p-4 text-sm leading-6 text-kveld-700">Dato for {!known && !handoverKnown ? 'overtakelse og innflytting er ikke avklart' : !known ? 'innflytting er ikke avklart' : 'overtakelse er ikke avklart'}. Tidslinjen er skjematisk frem til begge datoene er lagt inn. Milepæler på samme sted betyr ikke nødvendigvis samme dag. Se tidspunktet på hver oppgave.</p>}
    <p className="mb-3 text-xs text-kveld-500">Ukemarkeringene viser tid før og etter {known || !handoverKnown ? 'innflytting' : 'overtakelse'}.</p>
    <div ref={scroller} className="-mx-5 overflow-x-auto px-5 pb-2 sm:mx-0 sm:px-0">
    <div ref={track} className="relative min-w-[760px] rounded-3xl bg-kveld-50" style={{ height }}>
      {/* markører: i dag, utflytting, overtakelse, innflytting */}
      {sortedMarkers.map((marker, index) => <div key={marker.id} aria-hidden="true">
        <span className={`absolute w-0.5 ${marker.line} ${marker.id === 'out' ? 'opacity-80' : ''}`} style={{ left: x(marker.day) - 1, top: markerLanes[index] * 32 + 34, bottom: 12 }} />
        <span className={`absolute z-20 -translate-x-1/2 whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold ${marker.className}`} style={{ left: x(marker.day), top: markerLanes[index] * 32 + 10 }}>{marker.label}</span>
      </div>)}
      {/* uker */}
      {ticks.map((day) => <span key={day} aria-hidden="true" className="absolute -translate-x-1/2 text-[11px] font-medium text-kveld-500" style={{ left: x(day), top: axisY - 24 }}>{Math.abs(day / 7)} u {day < 0 ? 'før' : 'etter'}</span>)}
      <span aria-hidden="true" className="absolute h-1 rounded-full bg-kveld-200" style={{ left: 24, right: 24, top: axisY - 2 }} />
      {ticks.map((day) => <span key={`t${day}`} aria-hidden="true" className="absolute h-2 w-px bg-kveld-300" style={{ left: x(day), top: axisY - 4 }} />)}

      {/* oppgaver */}
      <ol aria-label="Oppgaver i tidslinjen">{sorted.map((task, index) => {
        const done = getProgress(state, task).status === 'done';
        const active = selected === task.id;
        const cx = x(dayOf(task));
        const left = Math.min(Math.max(cx - CHIP / 2, 8), width - CHIP - 8);
        const top = axisY + 24 + taskLanes[index] * LANE;
        return <li key={task.id}>
          <span aria-hidden="true" className={`absolute w-px ${active ? 'bg-syrin-500' : 'bg-kveld-300'}`} style={{ left: cx, top: axisY, height: top - axisY }} />
          <span aria-hidden="true" className={`absolute z-10 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full ring-3 ring-kveld-50 ${done ? 'bg-ok-300' : active ? 'bg-syrin-500' : 'bg-white shadow-[inset_0_0_0_2px_var(--color-kveld-500)]'}`} style={{ left: cx, top: axisY }} />
          <button type="button" aria-pressed={active} onClick={() => onSelect(task.id)} style={{ left, top, width: CHIP }}
            className={`absolute z-10 flex h-[84px] flex-col justify-between rounded-2xl px-3 py-2 text-left transition ${active ? 'bg-syrin-500 text-white shadow-[0_12px_30px_-12px_rgba(91,67,214,0.7)]' : done ? 'bg-white/70 text-kveld-500 shadow-[0_0_0_1px_var(--color-kveld-100)]' : 'bg-white text-kveld-900 shadow-[0_0_0_1px_var(--color-kveld-200)] hover:shadow-[0_0_0_1.5px_var(--color-syrin-300)]'}`}>
            <span className={`line-clamp-2 text-xs font-semibold leading-4 ${done && !active ? 'line-through decoration-kveld-300' : ''}`}>{task.title}</span>
            <span className={`flex items-center gap-1 text-[11px] ${active ? 'text-syrin-100' : 'text-kveld-500'}`}>{done && <Icon name="check" className="h-3 w-3 shrink-0 text-ok-500" />}{relativeLabel(task.offset, task.dateAnchor)}</span>
          </button>
        </li>;
      })}</ol>
    </div>
  </div></>;
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
        {task.checks.map((text, index) => <label key={text} className="flex cursor-pointer items-start gap-3 rounded-lg py-2 text-sm leading-6 text-kveld-700"><input type="checkbox" className="check-input mt-1" checked={progress.checks[String(index)] ?? false} onChange={(event) => change({ checks: { ...progress.checks, [index]: event.target.checked } })} /><span>{text}</span></label>)}
      </div></fieldset>
      {task.doneWhen?.trim() && <p className="mt-3 rounded-2xl bg-kveld-50 p-3 text-sm leading-6 text-kveld-700"><strong className="font-semibold">Du er ferdig når:</strong> {task.doneWhen}</p>}
    </article>
    {hasPartnerOffers(task.id) && <PartnerOffers key={task.id} taskId={task.id} />}
  </div>;
}
