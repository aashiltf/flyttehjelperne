import assert from 'node:assert/strict';
import test from 'node:test';
import { demoState, emptyState, generatePlan, parseStoredState, profileErrors, suggestedDate, summarize, validDate } from './moving-plan.ts';

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

test('progress excludes irrelevant tasks and waiting is not completion', () => {
  const state = demoState();
  state.progress.insurance = { status: 'done', checks: {}, answer: '' };
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
