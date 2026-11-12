import { useEffect, useState } from 'react';
import { addDays, formatDate, getProgress, hasMoveDate, relativeLabel, taskAnchorDate, validDate, type MovingProfile, type MovingTask } from '~/lib/moving-plan';
import { useMoving } from './moving-provider';
import { TaskDetail } from './plan-views';
import { DoneBadge, Icon } from './ui';

type DateGroup = { id: string; date: string; tasks: MovingTask[]; milestones: string[]; today: boolean };

export function timelineGroups(profile: MovingProfile, tasks: MovingTask[], today: string): DateGroup[] {
  const groups = new Map<string, DateGroup>();
  function group(id: string, date = '') {
    let value = groups.get(id);
    if (!value) { value = { id, date, tasks: [], milestones: [], today: false }; groups.set(id, value); }
    return value;
  }
  for (const task of tasks) {
    const date = addDays(taskAnchorDate(profile, task), task.offset)?.toISOString().slice(0, 10) ?? '';
    group(date || `unknown-${task.dateAnchor}-${task.offset}`, date).tasks.push(task);
  }
  if (today) group(today, today).today = true;
  for (const [label, date] of [
    ['Utflytting', profile.moveOutDate],
    ['Overtakelse', profile.handoverDate],
    ['Innflytting', hasMoveDate(profile) ? profile.moveDate : ''],
  ]) if (validDate(date)) group(date, date).milestones.push(label);
  return [...groups.values()].sort((a, b) => {
    if (a.date && b.date) return a.date.localeCompare(b.date);
    if (a.date) return -1;
    if (b.date) return 1;
    return (a.tasks[0]?.offset ?? 0) - (b.tasks[0]?.offset ?? 0);
  });
}

const specialDays = [
  { anchor: 'move-out', title: 'Utflyttingsdagen', icon: 'arrow' },
  { anchor: 'handover', title: 'Overtakelsesdagen', icon: 'key' },
  { anchor: 'move', title: 'Innflyttingsdagen', icon: 'home' },
] as const;

function DayCard({ task, title, icon, open, onToggle, today }: { task: MovingTask; title: string; icon: 'arrow' | 'key' | 'home'; open: boolean; onToggle: () => void; today: boolean }) {
  const { state, update } = useMoving();
  const progress = getProgress(state, task);
  return <section className={`w-full rounded-2xl border-[3px] text-kveld-900 ${progress.status === 'done' ? 'border-syrin-300 bg-syrin-50' : 'border-syrin-500 bg-syrin-100'}`}>
    <h3><button type="button" className="flex w-full items-center gap-3 p-4 text-left" aria-expanded={open} aria-controls={`day-${task.id}`} onClick={onToggle}>
      <Icon name={icon} className="text-syrin-600" /><span className="min-w-0 flex-1 text-base font-semibold">{title}</span>{progress.status === 'done' && <DoneBadge />}<Icon name="chevron" className={`h-4 w-4 text-syrin-600 ${open ? '-rotate-90' : 'rotate-90'}`} />
    </button></h3>
    <div id={`day-${task.id}`} hidden={!open} className="border-t border-syrin-300 px-4 pb-4 pt-3">
      {today && <p className="mb-2 text-sm font-semibold">Dette skjer i dag</p>}
      <p className="text-sm leading-6 text-kveld-700">{task.summary}</p>
      <fieldset className="mt-4"><legend className="text-sm font-semibold">Gjøremål</legend><div className="mt-2 space-y-3">{task.checks.map((text, index) => {
        const key = task.checkKeys?.[index] ?? String(index);
        return <label key={key} className="flex cursor-pointer items-start gap-3 rounded-xl border border-syrin-300 bg-white p-3 text-sm leading-6"><input type="checkbox" className="check-input mt-1" checked={progress.checks[key] ?? false} onChange={(event) => {
          const checked = event.target.checked;
          update((saved) => ({ ...saved, progress: { ...saved.progress, [task.id]: { ...getProgress(saved, task), checks: { ...getProgress(saved, task).checks, [key]: checked } } } }));
        }} /><span>{text}</span></label>;
      })}</div></fieldset>
    </div>
  </section>;
}

export function TimelineView({ tasks, selected, onSelect }: { tasks: MovingTask[]; selected: string | null; onSelect: (id: string) => void }) {
  const { state } = useMoving();
  const [today, setToday] = useState('');
  const [expandedDays, setExpandedDays] = useState<Record<string, boolean>>({});
  useEffect(() => {
    const refresh = () => {
      const now = new Date();
      setToday(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`);
    };
    refresh();
    const timer = window.setInterval(refresh, 60_000);
    return () => window.clearInterval(timer);
  }, []);
  const groups = timelineGroups(state.profile, tasks, today);
  function toggleDay(id: string) {
    setExpandedDays((saved) => ({ ...saved, [id]: !(saved[id] ?? selected === id) }));
  }
  return <div className="w-full max-w-[704px]">
    <p className="mb-4 inline-flex items-center gap-2 rounded-xl border border-kveld-700 bg-kveld-900 px-4 py-2 text-sm font-semibold text-white"><Icon name="calendar" className="h-4 w-4" />{today ? <>I dag: <time dateTime={today}>{formatDate(today, true)}</time></> : 'Henter dagens dato …'}</p>
    <ol aria-label="Oppgaver på tidslinjen">{groups.map((group) => {
      const days = specialDays.flatMap((day) => group.tasks.filter((task) => task.offset === 0 && task.dateAnchor === day.anchor && ['move-out', 'old-home', 'handover', 'move-in'].includes(task.id)).map((task) => ({ ...day, task })));
      const regular = group.tasks.filter((task) => !days.some((day) => day.task.id === task.id));
      return <li key={group.id} className="relative grid grid-cols-[2rem_minmax(0,1fr)] gap-x-3 pb-6 sm:grid-cols-[2.75rem_minmax(0,1fr)] sm:gap-x-5">
        <span aria-hidden="true" className="absolute bottom-0 left-[14px] top-5 w-1 bg-syrin-500 sm:left-5" />
        <span aria-hidden="true" className={`relative z-10 mt-3 grid h-8 w-8 place-items-center rounded-full border-2 sm:ml-1.5 ${days.length ? 'border-syrin-600 bg-syrin-200 text-syrin-600' : group.today ? 'border-kveld-900 bg-kveld-900 text-white' : 'border-syrin-600 bg-white text-syrin-600'}`}>{days.length ? <Icon name={days[0].icon} className="h-4 w-4" /> : <span className="h-2 w-2 rounded-full bg-current" />}</span>
        <div className="min-w-0">
          <div className="mb-3 flex min-h-11 flex-wrap items-center gap-2"><h2 className="text-sm font-bold text-kveld-900">{group.date ? <time dateTime={group.date}>{formatDate(group.date, true)}</time> : 'Dato ikke avklart'}</h2>{group.today && <span className="rounded-lg bg-kveld-900 px-2 py-1 text-xs font-semibold text-white">I dag</span>}</div>
          <div className="space-y-4">
            {days.map((day) => <DayCard key={day.task.id} task={day.task} title={day.title} icon={day.icon} today={group.today} open={expandedDays[day.task.id] ?? selected === day.task.id} onToggle={() => toggleDay(day.task.id)} />)}
            {regular.map((task) => <div key={task.id} className="w-full">
              {selected === task.id ? <><button type="button" className="mb-2 min-h-11 text-sm font-semibold text-syrin-600" onClick={() => onSelect(task.id)}>Lukk oppgaven</button><TaskDetail task={task} hideTiming={Boolean(group.date)} /></> : <button type="button" className={`flex w-full items-start gap-3 rounded-2xl border p-4 text-left text-kveld-900 ${getProgress(state, task).status === 'done' ? 'border-syrin-200 bg-syrin-50 hover:border-syrin-300' : 'border-syrin-300 bg-syrin-100 hover:border-syrin-600'}`} aria-expanded={false} onClick={() => onSelect(task.id)}><span className="min-w-0 flex-1"><span className="block text-sm font-semibold">{task.title}</span><span className="mt-1 block text-sm leading-6 text-kveld-700">{task.summary}</span>{!group.date && <span className="mt-2 block text-xs text-kveld-700">{relativeLabel(task.offset, task.dateAnchor)}</span>}</span>{getProgress(state, task).status === 'done' ? <DoneBadge /> : <Icon name="chevron" className="h-4 w-4 text-syrin-600" />}</button>}
            </div>)}
          </div>
        </div>
      </li>;
    })}</ol>
  </div>;
}
