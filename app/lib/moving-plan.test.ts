import assert from 'node:assert/strict';
import test from 'node:test';
import { demoState, emptyState, generatePlan, getProgress, parseStoredState, profileErrors, relativeLabel, suggestedDate, summarize, taskAnchorDate, taskDeadlineDates, taskTimingLabel, taskTimelineDay, validDate } from './moving-plan.ts';

test('address reporting has a hard window anchored to moving, not handover', () => {
  const profile = { ...demoState().profile, moveDate: '2028-03-01', handoverDate: '2028-02-01' };
  const task = generatePlan(profile).find((task) => task.id === 'address')!;
  assert.deepEqual(task.deadlineWindow, { earliest: -31, latest: 8, subject: 'Folkeregisteret' });
  assert.equal(task.offset, -31);
  assert.equal(taskTimelineDay(profile, task), -31);
  assert.equal(task.dateAnchor, 'move');
  assert.deepEqual(task.checkHeadings, { 0: 'Folkeregisteret', 1: 'Posten' });
  assert.match(task.checkDescriptions![0], /tidligst 31 dager før og senest 8 dager etter/);
  assert.match(task.checkDescriptions![1], /minst fire virkedager før/);
  assert.match(taskTimingLabel(task), /Frist for Folkeregisteret:/);
  assert.deepEqual(task.checkLinks, {
    0: { label: 'Meld flytting hos Skatteetaten', href: 'https://www.skatteetaten.no/person/folkeregister/flytte/i-norge/' },
    1: { label: 'Meld flytting hos Posten', href: 'https://www.posten.no/adressetjenester/adresseendring' },
  });
  assert.match(taskTimingLabel(task), /31 dager før–8 dager etter innflytting/);
  assert.deepEqual(taskDeadlineDates(profile, task), {
    earliest: suggestedDate('2028-01-30', 0),
    latest: suggestedDate('2028-03-09', 0),
  });
  assert.equal(taskDeadlineDates({ ...profile, dateUnknown: true }, task), null);
  assert.equal(taskDeadlineDates({ ...profile, moveDate: '' }, task), null);
  const packing = generatePlan(profile).find((task) => task.id === 'packing')!;
  assert.equal(taskDeadlineDates(profile, packing), null);
  assert.equal(taskTimingLabel(packing), relativeLabel(packing.offset, packing.dateAnchor));
});

test('personalizes housing, household and life phase without duplicate tasks', () => {
  const state = demoState();
  const ids = generatePlan(state.profile).map((task) => task.id);
  assert.ok(ids.includes('shared-home'));
  assert.ok(ids.includes('end-lease'));
  assert.ok(!ids.includes('old-home'));
  assert.ok(!ids.includes('school'));
  assert.equal(new Set(ids).size, ids.length);
  const profile = { ...state.profile, household: 'alone' as const, fromTenure: 'own' as const, children: true, schoolChange: true, student: true, newParent: true };
  const other = generatePlan(profile).map((task) => task.id);
  assert.ok(!other.includes('shared-home'));
  assert.ok(other.includes('old-home'));
  for (const id of ['school', 'student', 'new-parent', 'neighborhood']) assert.ok(other.includes(id));
  assert.ok(!generatePlan({ ...profile, children: false }).some((task) => task.id === 'school'));
});

test('school task includes official municipal information and NAV guidance', () => {
  const profile = { ...demoState().profile, children: true, schoolChange: true };
  const tasks = generatePlan(profile);
  const school = tasks.find((task) => task.id === 'school');
  assert.ok(school?.resources);
  assert.equal(taskTimingLabel(school), 'Frist 45 dager før innflytting');
  assert.equal(school.offset, -45);
  assert.equal(school.dateAnchor, 'move');
  assert.match(school.resources.description, /eksempler fra Oslo/);
  assert.deepEqual(school.resources.links.map((link) => link.href), [
    'https://www.oslo.kommune.no/skole-og-utdanning/',
    'https://www.oslo.kommune.no/barnehage/',
    'https://www.nav.no/barnetilsyn-enslig',
  ]);
  for (const link of school.resources.links) {
    assert.ok(link.title);
    assert.ok(link.description);
  }
  assert.ok(tasks.filter((task) => task.id !== 'school').every((task) => !task.resources));
});

test('life insurance is a separate task in the insurance category with its own progress', () => {
  const state = demoState();
  const tasks = generatePlan(state.profile);
  const housing = tasks.find((task) => task.id === 'insurance')!;
  const life = tasks.find((task) => task.id === 'life-insurance')!;
  assert.ok(life);
  assert.equal(life.title, 'Kjøp livsforsikring');
  assert.equal(life.category, 'insurance');
  assert.equal(life.phase, housing.phase);
  assert.equal(life.offset, housing.offset);
  assert.equal(life.dateAnchor, housing.dateAnchor);
  state.progress[life.id] = { status: 'todo', checks: { '0': true, '1': true, '2': true }, answer: '' };
  assert.equal(getProgress(state, life).status, 'done');
  assert.equal(getProgress(state, housing).status, 'todo');
});

test('handover walkthrough has ten checks for the new home without reusing old check progress', () => {
  const state = demoState();
  state.profile.fromTenure = 'own';
  const task = generatePlan(state.profile).find((task) => task.id === 'old-home')!;
  assert.equal(task.title, 'Gjennomgang ved overtakelse');
  assert.equal(task.checks.length, 10);
  assert.match(task.summary, /den nye boligen/);
  assert.match(task.checks[9], /overtakelsesprotokollen/);
  assert.equal(new Set(task.checkKeys).size, 10);
  state.progress[task.id] = { status: 'done', checks: { '0': true, '1': true }, answer: '' };
  assert.equal(getProgress(state, task).status, 'todo');
  for (const key of task.checkKeys!) state.progress[task.id].checks[key] = true;
  assert.equal(getProgress(state, task).status, 'done');
});

test('progress excludes irrelevant tasks and waiting is not completion', () => {
  const state = demoState();
  state.progress.insurance = { status: 'todo', checks: { '0': true, '1': true }, answer: '' };
  state.progress.address = { status: 'waiting', checks: {}, answer: '' };
  state.progress.packing = { status: 'irrelevant', checks: {}, answer: '' };
  const tasks = generatePlan(state.profile);
  const stats = summarize(tasks, state);
  assert.equal(stats.total, tasks.length - 1);
  assert.equal(stats.done, 1);
  assert.equal(stats.waiting, 1);
  assert.equal(stats.remaining, stats.total - 1);
  for (const task of tasks) state.progress[task.id] = { status: 'irrelevant', checks: {}, answer: '' };
  assert.equal(summarize(tasks, state).percent, 0);
});

test('completion follows every subtask, not the saved status or unrelated checks', () => {
  const state = demoState();
  const task = generatePlan(state.profile).find((task) => task.id === 'insurance')!;
  assert.equal(getProgress(state, task).status, 'todo');
  state.progress[task.id] = { status: 'done', checks: { '0': true, '99': true }, answer: 'Ja' };
  assert.equal(getProgress(state, task).status, 'todo');
  state.progress[task.id].checks['1'] = true;
  assert.equal(getProgress(state, task).status, 'done');
  assert.equal(summarize([task], state).percent, 100);
  state.progress[task.id].checks['0'] = false;
  assert.equal(getProgress(state, task).status, 'todo');
  assert.equal(summarize([task], state).percent, 0);
  const restored = parseStoredState(JSON.stringify(state));
  assert.equal(getProgress(restored, task).status, 'todo');
  restored.progress[task.id].checks['0'] = true;
  restored.progress[task.id].status = 'waiting';
  assert.equal(getProgress(restored, task).status, 'done');
  assert.equal(getProgress(restored, { ...task, checks: [] }).status, 'waiting');
});

test('dates handle month boundaries, leap years and unknown dates', () => {
  assert.equal(validDate('2026-02-30'), false);
  assert.equal(validDate('2028-02-29'), true);
  assert.equal(validDate('invalid'), false);
  assert.equal(suggestedDate('', -7), '');
  assert.match(suggestedDate('2026-03-01', -1), /28.*feb/);
  assert.equal(profileErrors({ ...emptyState().profile, dateUnknown: true }, 2).length, 0);
  const demo = demoState(new Date(2026, 11, 20));
  assert.equal(demo.profile.moveDate, '2027-01-24');
});

test('storage round-trip preserves partial checks, answers and hidden tasks', () => {
  const state = demoState();
  state.progress.insurance = { status: 'waiting', checks: { '0': true, '1': false }, answer: 'Ja' };
  const restored = parseStoredState(JSON.stringify(state));
  assert.deepEqual(restored, state);
  assert.deepEqual(parseStoredState(JSON.stringify(emptyState())), emptyState());
  restored.profile.household = 'alone';
  assert.equal(restored.progress.insurance.checks['0'], true);
});

test('invalid stored state is rejected instead of trusted', () => {
  assert.throws(() => parseStoredState('{'));
  assert.throws(() => parseStoredState(JSON.stringify({ ...demoState(), version: 2 })));
  const invalid = demoState();
  invalid.profile.moveDate = '2026-02-30';
  assert.throws(() => parseStoredState(JSON.stringify(invalid)));
  assert.throws(() => parseStoredState(JSON.stringify({ ...emptyState(), created: true })));
  assert.throws(() => parseStoredState(JSON.stringify({ ...demoState(), progress: { insurance: { status: 'done', checks: { '0': 'yes' }, answer: '' } } })));
});

test('every task has a category, and older saved plans without move-out date still load', () => {
  const tasks = generatePlan(demoState().profile);
  for (const task of tasks) assert.ok(['formal', 'insurance', 'practical', 'other'].includes(task.category));
  assert.ok(tasks.some((task) => task.id === 'subscriptions' && task.category === 'other'));
  assert.equal(tasks.find((task) => task.id === 'address')?.category, 'formal');
  const old = demoState();
  const { moveOutDate: _, ...profile } = old.profile;
  assert.equal(parseStoredState(JSON.stringify({ ...old, profile })).profile.moveOutDate, '');
});

test('handover and moving tasks use separate dates and timeline positions', () => {
  const profile = { ...demoState().profile, handoverDate: '2026-12-01', moveDate: '2026-12-15' };
  const tasks = generatePlan(profile);
  assert.ok(!tasks.some((task) => task.id === 'handover'));
  const moveIn = tasks.find((task) => task.id === 'move-in')!;
  const prepare = tasks.find((task) => task.id === 'prepare-handover')!;
  assert.equal(taskAnchorDate(profile, prepare), '2026-12-01');
  assert.equal(taskAnchorDate(profile, moveIn), '2026-12-15');
  assert.equal(taskTimelineDay(profile, prepare), -21);
  assert.equal(taskTimelineDay(profile, moveIn), 0);
  assert.equal(relativeLabel(prepare.offset, prepare.dateAnchor), '1 uke før overtakelse');
  assert.equal(relativeLabel(moveIn.offset, moveIn.dateAnchor), 'På innflyttingsdagen');
  for (const id of ['insurance', 'utilities', 'prepare-handover']) {
    assert.equal(tasks.find((task) => task.id === id)?.dateAnchor, 'handover');
  }
  for (const id of ['packing', 'address', 'settle']) {
    assert.equal(tasks.find((task) => task.id === id)?.dateAnchor, 'move');
  }
  const sameDay = { ...profile, handoverDate: profile.moveDate };
  assert.equal(taskTimelineDay(sameDay, prepare), -7);
  assert.equal(taskTimelineDay(sameDay, moveIn), 0);
});

test('unknown milestone dates never borrow the other milestone date', () => {
  const profile = demoState().profile;
  const tasks = generatePlan(profile);
  const handover = tasks.find((task) => task.id === 'prepare-handover')!;
  const moveIn = tasks.find((task) => task.id === 'move-in')!;
  assert.equal(taskAnchorDate({ ...profile, handoverDate: '' }, handover), '');
  assert.equal(taskAnchorDate({ ...profile, moveDate: '' }, moveIn), '');
  assert.equal(taskAnchorDate({ ...profile, dateUnknown: true }, moveIn), '');
  assert.equal(taskAnchorDate({ ...profile, dateUnknown: true }, handover), profile.handoverDate);
  assert.equal(taskTimelineDay({ ...profile, moveDate: '' }, handover), -7);
  assert.equal(taskTimelineDay({ ...profile, handoverDate: '' }, handover), -7);
  assert.deepEqual(profileErrors({ ...profile, moveDate: '', handoverDate: '' }, 2), []);
});

test('older plans load without inventing a handover date or losing progress', () => {
  const state = demoState();
  state.progress.handover = { status: 'done', checks: { '0': true }, answer: '' };
  const { handoverDate: _, ...profile } = state.profile;
  const restored = parseStoredState(JSON.stringify({ ...state, profile }));
  assert.equal(restored.profile.handoverDate, '');
  assert.equal(restored.profile.moveDate, state.profile.moveDate);
  assert.deepEqual(restored.progress, state.progress);
  const changed = { ...restored, profile: { ...restored.profile, handoverDate: '2026-12-01' } };
  assert.deepEqual(parseStoredState(JSON.stringify(changed)), changed);
});

test('invalid handover dates are rejected in the form and stored data', () => {
  const state = demoState();
  for (const handoverDate of ['2026-02-30', 'not-a-date']) {
    const profile = { ...state.profile, handoverDate };
    assert.ok(profileErrors(profile, 2).includes('Overtakelsesdatoen er ikke gyldig.'));
    assert.throws(() => parseStoredState(JSON.stringify({ ...state, profile })));
  }
  for (const handoverDate of [null, 123, true, {}]) {
    assert.throws(() => parseStoredState(JSON.stringify({ ...state, profile: { ...state.profile, handoverDate } })));
  }
});
