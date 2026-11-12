import { useEffect, useState } from 'react';
import { addDays, formatDate, getProgress, hasMoveDate, relativeLabel, taskAnchorDate, validDate, type MovingProfile, type MovingTask } from '~/lib/moving-plan';
import { useMoving } from './moving-provider';
import { TaskDetail } from './plan-views';
import { Icon } from './ui';

type DateGroup = { id: string; date: string; tasks: MovingTask[]; milestones: string[]; today: boolean };

const milestoneStyles: Record<string, string> = {
  Utflytting: 'border-varsel-500 bg-sol text-kveld-900',
  Overtakelse: 'border-ok-500 bg-eng text-kveld-900',
  Innflytting: 'border-syrin-600 bg-syrin-200 text-kveld-900',
};

function Milestones({ group }: { group: DateGroup }) {
  return <>{group.today && <span className="rounded-lg border border-kveld-900 bg-kveld-900 px-2.5 py-1 text-xs font-bold text-white">I dag</span>}{group.milestones.map((label) => <span key={label} className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-bold ${milestoneStyles[label]}`}><Icon name={label === 'Overtakelse' ? 'key' : label === 'Innflytting' ? 'home' : 'arrow'} className="h-4 w-4" />{label === 'Overtakelse' ? 'Overtakelsesdagen' : label === 'Innflytting' ? 'Innflyttingsdagen' : 'Utflyttingsdagen'}</span>)}</>;
}

function HandoverDay({ task, today }: { task: MovingTask; today: boolean }) {
  const { state, update } = useMoving();
  const progress = getProgress(state, task);
  return <section aria-label="Gjøremål på overtakelsesdagen" className="mb-5 rounded-2xl border-2 border-ok-500 bg-eng p-4 text-kveld-900 sm:p-5">
    <div className="flex items-center gap-3"><Icon name="key" /><h3 className="text-lg font-semibold">{today ? 'Dette skjer i dag' : 'På overtakelsesdagen'}</h3></div>
    <p className="mt-2 text-sm leading-6">Gå gjennom boligen før du overtar. Dokumenter tilstanden og avklar det praktiske ved overleveringen.</p>
    <fieldset className="mt-4"><legend className="text-sm font-semibold">Gjøremål ved overtakelsen</legend><div className="mt-2 space-y-3">{task.checks.map((text, index) => {
      const key = task.checkKeys?.[index] ?? String(index);
      return <label key={key} className="flex cursor-pointer items-start gap-3 rounded-xl border border-ok-500/40 bg-white p-3 text-sm leading-6"><input type="checkbox" className="check-input mt-1" checked={progress.checks[key] ?? false} onChange={(event) => {
        const checked = event.target.checked;
        update((saved) => ({ ...saved, progress: { ...saved.progress, [task.id]: { ...getProgress(saved, task), checks: { ...getProgress(saved, task).checks, [key]: checked } } } }));
      }} /><span>{text}</span></label>;
    })}</div></fieldset>
  </section>;
}

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
  const [pickedDate, setPickedDate] = useState<string | null>(null);
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
  const selectedGroup = groups.find((group) => pickedDate === group.id) ?? groups.find((group) => group.tasks.some((task) => task.id === selected));
  const current = selectedGroup?.tasks.find((task) => task.id === selected);
  const title = (group: DateGroup) => group.date ? formatDate(group.date, true) : 'Dato ikke avklart';
  const handoverTask = tasks.find((task) => task.id === 'handover');

  useEffect(() => { setPickedDate(null); }, [selected, state.profile.handoverDate, state.profile.moveDate, state.profile.moveOutDate]);

  function chooseDate(group: DateGroup) {
    setPickedDate((picked) => picked === group.id ? null : group.id);
  }

  function chooseTask(id: string) {
    setPickedDate(null);
    onSelect(id);
  }

  function dateLabel(group: DateGroup) {
    return <button type="button" className="min-h-11 rounded-lg px-2 text-left text-sm font-bold text-kveld-900 hover:bg-syrin-200" aria-expanded={group === selectedGroup} aria-label={`Vis dagen ${title(group)}${group.milestones.length ? `, ${group.milestones.join(', ')}` : ''}`} onClick={() => chooseDate(group)}>{group.date ? <time dateTime={group.date}>{title(group)}</time> : title(group)}</button>;
  }

  function handoverBox(group: DateGroup) {
    return group === selectedGroup && group.milestones.includes('Overtakelse') && handoverTask ? <HandoverDay task={handoverTask} today={group.today} /> : null;
  }

  function circle(group: DateGroup) {
    const active = group === selectedGroup;
    const done = group.tasks.length > 0 && group.tasks.every((task) => getProgress(state, task).status === 'done');
    const count = group.tasks.length;
    const milestone = group.milestones.includes('Overtakelse') ? 'Overtakelse' : group.milestones[0];
    const dot = <span className={`grid h-8 w-8 place-items-center rounded-full border-2 text-xs font-bold ${active ? 'border-syrin-600 bg-syrin-600 text-white' : milestone ? milestoneStyles[milestone] : done ? 'border-ok-500 bg-eng text-ok-500' : group.today ? 'border-kveld-900 bg-kveld-900 text-white' : 'border-syrin-600 bg-white text-syrin-600'}`}>{milestone ? <Icon name={milestone === 'Overtakelse' ? 'key' : milestone === 'Innflytting' ? 'home' : 'arrow'} className="h-4 w-4" /> : count > 1 ? count : done ? <Icon name="check" className="h-3.5 w-3.5" /> : <span className="h-2 w-2 rounded-full bg-current" />}</span>;
    return <button type="button" className="relative z-10 flex h-11 w-11 items-center justify-center rounded-full hover:bg-syrin-200" aria-pressed={active} aria-label={`${title(group)}${group.milestones.length ? `, ${group.milestones.join(', ')}` : ''}: ${count} ${count === 1 ? 'oppgave' : 'oppgaver'}${done ? ', gjennomført' : ''}`} onClick={() => chooseDate(group)}>{dot}</button>;
  }

  return <div>
    <p className="mb-4 inline-flex items-center gap-2 rounded-xl border border-kveld-700 bg-kveld-900 px-4 py-2 text-sm font-semibold text-white"><Icon name="calendar" className="h-4 w-4" />{today ? <>I dag: <time dateTime={today}>{formatDate(today, true)}</time></> : 'Henter dagens dato …'}</p>
    {vertical ? <ol aria-label="Oppgaver på tidslinjen" className="space-y-0">{groups.map((group) => <li key={group.id} className="relative grid grid-cols-[2.75rem_minmax(0,1fr)] gap-x-3 pb-7 sm:gap-x-5">
      <span aria-hidden="true" className="absolute bottom-0 left-[20px] top-5 w-1 bg-syrin-500" />
      <div>{circle(group)}</div>
      <div className="min-w-0 pt-2">
        <div className={`mb-3 flex flex-wrap items-center gap-2 rounded-xl border px-2 ${group.milestones.length ? 'border-syrin-300 bg-himmel py-2' : 'border-transparent'}`}><h2>{dateLabel(group)}</h2><Milestones group={group} /></div>
        {handoverBox(group)}
        <div className="space-y-5">{group.tasks.map((task) => <div key={task.id}>
          {selected === task.id ? <><button type="button" className="mb-3 min-h-11 text-sm font-semibold text-syrin-600" onClick={() => chooseTask(task.id)}>Lukk oppgaven</button><TaskDetail task={task} hideTiming={Boolean(group.date)} /></> : <button type="button" className="flex w-full items-start gap-3 rounded-2xl border border-syrin-300 bg-syrin-100 p-4 text-left text-kveld-900 hover:border-syrin-600" aria-expanded={false} onClick={() => chooseTask(task.id)}><span className="min-w-0 flex-1"><span className="block text-sm font-semibold">{task.title}</span><span className="mt-1 block text-sm leading-6 text-kveld-700">{task.summary}</span>{!group.date && <span className="mt-2 block text-xs text-kveld-700">{relativeLabel(task.offset, task.dateAnchor)}</span>}</span>{getProgress(state, task).status === 'done' ? <Icon name="check" className="text-ok-500" /> : <Icon name="chevron" className="h-4 w-4 text-syrin-600" />}</button>}
        </div>)}</div>
      </div>
    </li>)}</ol> : <>
      <div className="rounded-2xl border border-syrin-300 bg-himmel px-2 py-4 sm:px-4">
        <ol aria-label="Datoer med oppgaver og milepæler, i kronologisk rekkefølge" className="relative flex w-full items-center py-4">{dated.map((group) => {
          const done = group.tasks.length > 0 && group.tasks.every((task) => getProgress(state, task).status === 'done');
          const milestone = group.milestones.includes('Overtakelse') ? 'Overtakelse' : group.milestones[0];
          return <li key={group.id} className="relative min-w-0 flex-1">
          <span aria-hidden="true" className={`absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 ${group.date < today ? 'bg-kveld-500' : 'bg-syrin-500'}`} />
          <button type="button" title={`${title(group)}${group.milestones.length ? ` · ${group.milestones.join(', ')}` : ''} · ${group.tasks.length} oppgaver`} aria-label={`${title(group)}${group.today ? ', i dag' : ''}${group.milestones.length ? `, ${group.milestones.join(', ')}` : ''}, ${group.tasks.length} oppgaver${done ? ', gjennomført' : ''}`} aria-pressed={group === selectedGroup} onClick={() => chooseDate(group)} className="relative z-10 flex min-h-11 w-full items-center justify-center rounded-full focus-visible:z-20">
            <span className={`grid shrink-0 place-items-center rounded-full border-2 ${group === selectedGroup ? 'h-5 w-5 border-syrin-600 bg-syrin-600 text-white ring-2 ring-white' : group.today ? 'h-5 w-5 border-kveld-900 bg-kveld-900 text-white ring-2 ring-white' : milestone ? `h-5 w-5 sm:h-7 sm:w-7 ${milestoneStyles[milestone]}` : done ? 'h-3 w-3 border-ok-500 bg-ok-500' : 'h-3 w-3 border-syrin-600 bg-white'}`}>
              {milestone && <Icon name={milestone === 'Overtakelse' ? 'key' : milestone === 'Innflytting' ? 'home' : 'arrow'} className="h-3 w-3 sm:h-4 sm:w-4" />}
            </span>
          </button>
          {group.today && <span className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] font-bold text-kveld-900">I dag</span>}
        </li>; })}</ol>
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2 border-t border-syrin-300 pt-3">{dated.filter((group) => group.milestones.length > 0).map((group) => <button key={group.id} type="button" className="flex min-h-11 flex-wrap items-center gap-2 rounded-lg text-left text-xs font-semibold text-kveld-900" onClick={() => chooseDate(group)} aria-pressed={group === selectedGroup}><Milestones group={{ ...group, today: false }} /><time dateTime={group.date}>{formatDate(group.date)}</time></button>)}</div>
      </div>
      {undated.length > 0 && <section className="mt-4 rounded-2xl border border-kveld-200 p-4"><h2 className="text-sm font-semibold">Dato ikke avklart</h2><p className="mt-1 text-xs leading-5 text-kveld-500">Legg inn dato for overtakelse eller innflytting i flytteopplysningene for å datofeste disse oppgavene.</p><ol className="mt-3 flex flex-wrap gap-4">{undated.map((group) => <li key={group.id} className="flex items-center gap-2">{circle(group)}<span className="max-w-48 text-xs text-kveld-500">{relativeLabel(group.tasks[0].offset, group.tasks[0].dateAnchor)}</span></li>)}</ol></section>}
      {selectedGroup && <section className="mx-auto mt-6 max-w-2xl" aria-label={`Oppgaver ${title(selectedGroup).toLowerCase()}`}>
        <div className="mb-3 flex flex-wrap items-center gap-2"><h2 className="font-semibold">{title(selectedGroup)}</h2><Milestones group={selectedGroup} /></div>
        {handoverBox(selectedGroup)}
        {selectedGroup.tasks.length > 0 ? <div role="group" aria-label="Velg oppgave for datoen" className="mb-4 flex flex-wrap gap-2">{selectedGroup.tasks.map((task) => <button key={task.id} type="button" aria-pressed={task.id === selected} className={`min-h-11 rounded-xl border px-3 py-2 text-left text-sm ${task.id === selected ? 'border-syrin-600 bg-syrin-200 font-semibold text-kveld-900' : 'border-syrin-300 bg-white hover:border-syrin-600'}`} onClick={() => chooseTask(task.id)}>{task.title}</button>)}</div> : <p className="text-sm text-kveld-700">Ingen oppgaver lagt til for denne dagen.</p>}
        {current && <TaskDetail task={current} hideTiming={Boolean(selectedGroup.date)} />}
      </section>}
    </>}
  </div>;
}
