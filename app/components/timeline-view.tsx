import { useEffect, useState } from 'react';
import { addDays, formatDate, getProgress, hasMoveDate, relativeLabel, taskAnchorDate, validDate, type MovingProfile, type MovingTask } from '~/lib/moving-plan';
import { useMoving } from './moving-provider';
import { TaskDetail } from './plan-views';
import { Icon } from './ui';

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

export function TimelineView({ tasks, selected, onSelect, vertical }: { tasks: MovingTask[]; selected: string | null; onSelect: (id: string) => void; vertical: boolean }) {
  const { state } = useMoving();
  const [today, setToday] = useState('');
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
  const dated = groups.filter((group) => group.date);
  const undated = groups.filter((group) => !group.date);
  const selectedGroup = groups.find((group) => group.tasks.some((task) => task.id === selected));
  const current = selectedGroup?.tasks.find((task) => task.id === selected);
  const title = (group: DateGroup) => group.date ? formatDate(group.date, true) : 'Dato ikke avklart';

  function circle(group: DateGroup) {
    const active = group === selectedGroup;
    const done = group.tasks.length > 0 && group.tasks.every((task) => getProgress(state, task).status === 'done');
    const count = group.tasks.length;
    const dot = <span className={`grid h-7 w-7 place-items-center rounded-full border-2 text-xs font-semibold ${active ? 'border-syrin-500 bg-syrin-500 text-white' : done ? 'border-ok-500 bg-eng text-ok-500' : group.today ? 'border-kveld-900 bg-kveld-900 text-white' : 'border-syrin-500 bg-white text-syrin-600'}`}>{count > 1 ? count : done ? <Icon name="check" className="h-3.5 w-3.5" /> : <span className="h-1.5 w-1.5 rounded-full bg-current" />}</span>;
    return count ? <button type="button" className="relative z-10 flex h-11 w-11 items-center justify-center rounded-full hover:bg-syrin-100" aria-pressed={active} aria-label={`${title(group)}: ${count} ${count === 1 ? 'oppgave' : 'oppgaver'}${done ? ', gjennomført' : ''}`} onClick={() => onSelect(group.tasks[0].id)}>{dot}</button> : <span aria-hidden="true" className="relative z-10 grid h-11 w-11 place-items-center">{dot}</span>;
  }

  return <div>
    <p className="mb-4 flex items-center gap-2 text-sm font-semibold text-kveld-700"><Icon name="calendar" className="h-4 w-4" />{today ? <>I dag: <time dateTime={today}>{formatDate(today, true)}</time></> : 'Henter dagens dato …'}</p>
    {vertical ? <ol aria-label="Oppgaver på tidslinjen" className="space-y-0">{groups.map((group) => <li key={group.id} className="relative grid grid-cols-[2.75rem_minmax(0,1fr)] gap-x-3 pb-7 sm:gap-x-5">
      <span aria-hidden="true" className="absolute bottom-0 left-[21px] top-5 w-0.5 bg-syrin-200" />
      <div>{circle(group)}</div>
      <div className="min-w-0 pt-2">
        <div className="mb-3 flex flex-wrap items-center gap-2"><h2 className="text-sm font-semibold">{group.date ? <time dateTime={group.date}>{title(group)}</time> : title(group)}</h2>{group.today && <span className="rounded-full bg-kveld-900 px-2 py-1 text-xs font-semibold text-white">I dag</span>}{group.milestones.map((label) => <span key={label} className="rounded-full bg-eng px-2 py-1 text-xs font-medium">{label}</span>)}</div>
        <div className="space-y-5">{group.tasks.map((task) => <div key={task.id}>
          {selected === task.id ? <><button type="button" className="mb-3 min-h-11 text-sm font-semibold text-syrin-600 underline underline-offset-4" onClick={() => onSelect(task.id)}>Lukk oppgaven</button><TaskDetail task={task} /></> : <button type="button" className="flex w-full items-start gap-3 rounded-2xl border border-kveld-200 bg-white p-4 text-left hover:border-syrin-300" aria-expanded={false} onClick={() => onSelect(task.id)}><span className="min-w-0 flex-1"><span className="block text-sm font-semibold">{task.title}</span><span className="mt-1 block text-sm leading-6 text-kveld-500">{task.summary}</span>{!group.date && <span className="mt-2 block text-xs text-kveld-500">{relativeLabel(task.offset, task.dateAnchor)}</span>}</span>{getProgress(state, task).status === 'done' ? <Icon name="check" className="text-ok-500" /> : <Icon name="chevron" className="h-4 w-4 text-syrin-600" />}</button>}
        </div>)}</div>
      </div>
    </li>)}</ol> : <>
      <div className="overflow-x-auto rounded-2xl bg-kveld-50 px-3 py-5 sm:px-5" tabIndex={0} role="region" aria-label="Vannrett tidslinje. Bla sidelengs for å se alle datoene.">
        <ol aria-label="Datoer med oppgaver og milepæler" className="flex min-w-full">{dated.map((group) => <li key={group.id} className="relative flex min-w-32 flex-1 flex-col items-center text-center">
          <div className="flex h-16 flex-col justify-end gap-1 pb-2">{group.today && <span className="mx-auto rounded-full bg-kveld-900 px-2 py-1 text-xs font-semibold text-white">I dag</span>}<time dateTime={group.date} className={`text-xs font-semibold ${group === selectedGroup ? 'text-syrin-600' : 'text-kveld-700'}`}>{title(group)}</time></div>
          <span aria-hidden="true" className="absolute inset-x-0 top-[85px] h-0.5 bg-syrin-200" />{circle(group)}
          <div className="mt-2 flex max-w-32 flex-col gap-1 px-2">{group.milestones.map((label) => <span key={label} className="rounded-md bg-eng px-2 py-1 text-xs font-medium">{label}</span>)}</div>
        </li>)}</ol>
      </div>
      {undated.length > 0 && <section className="mt-4 rounded-2xl border border-kveld-200 p-4"><h2 className="text-sm font-semibold">Dato ikke avklart</h2><p className="mt-1 text-xs leading-5 text-kveld-500">Legg inn dato for overtakelse eller innflytting i flytteopplysningene for å datofeste disse oppgavene.</p><ol className="mt-3 flex flex-wrap gap-4">{undated.map((group) => <li key={group.id} className="flex items-center gap-2">{circle(group)}<span className="max-w-48 text-xs text-kveld-500">{relativeLabel(group.tasks[0].offset, group.tasks[0].dateAnchor)}</span></li>)}</ol></section>}
      {selectedGroup && current && <section className="mx-auto mt-6 max-w-2xl" aria-label={`Oppgaver ${title(selectedGroup).toLowerCase()}`}>
        <div className="mb-3 flex items-center justify-between gap-3"><h2 className="font-semibold">{title(selectedGroup)}</h2><button type="button" className="grid h-11 w-11 place-items-center rounded-full text-kveld-500 hover:bg-kveld-50" aria-label="Lukk valgt oppgave" onClick={() => onSelect(current.id)}><Icon name="close" /></button></div>
        {selectedGroup.tasks.length > 1 && <div role="group" aria-label="Velg oppgave for datoen" className="mb-4 flex flex-wrap gap-2">{selectedGroup.tasks.map((task) => <button key={task.id} type="button" aria-pressed={task.id === selected} className={`min-h-11 rounded-xl border px-3 py-2 text-left text-sm ${task.id === selected ? 'border-syrin-500 bg-syrin-100 font-semibold text-syrin-600' : 'border-kveld-200 bg-white hover:border-syrin-300'}`} onClick={() => onSelect(task.id)}>{task.title}</button>)}</div>}
        <TaskDetail task={current} />
      </section>}
    </>}
  </div>;
}
