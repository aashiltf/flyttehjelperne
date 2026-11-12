import assert from 'node:assert/strict';
import test from 'node:test';
import { searchAddresses } from './address-search.ts';
import { emptyState, generatePlan, profileErrors } from './moving-plan.ts';

const address = { adressetekst: 'Storgata 1', postnummer: '0155', poststed: 'OSLO' };

test('address search returns valid suggestions and encodes the query', async (t) => {
  t.mock.method(globalThis, 'fetch', async (url: string) => {
    assert.equal(new URL(url).searchParams.get('sok'), 'Øvre gate 1 & 2');
    return Response.json({ adresser: [address, null, { adressetekst: 123 }] });
  });
  assert.deepEqual(await searchAddresses('Øvre gate 1 & 2', new AbortController().signal), [address]);
});

test('address search supports no matches', async (t) => {
  t.mock.method(globalThis, 'fetch', async () => Response.json({ adresser: [] }));
  assert.deepEqual(await searchAddresses('Ukjent', new AbortController().signal), []);
});

test('address search rejects HTTP errors, network errors and invalid responses', async (t) => {
  for (const response of [new Response(null, { status: 503 }), Response.json({}), new Response('invalid json')]) {
    const mock = t.mock.method(globalThis, 'fetch', async () => response);
    await assert.rejects(searchAddresses('Storgata', new AbortController().signal));
    mock.mock.restore();
  }
  t.mock.method(globalThis, 'fetch', async () => { throw new TypeError('Network error'); });
  await assert.rejects(searchAddresses('Storgata', new AbortController().signal));
});

test('address search aborts after five seconds so manual entry can take over', async (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  t.mock.method(globalThis, 'fetch', (_url: string, init: RequestInit) => new Promise<Response>((_resolve, reject) => {
    init.signal!.addEventListener('abort', () => reject(init.signal!.reason), { once: true });
  }));
  const result = searchAddresses('Storgata', new AbortController().signal);
  const rejection = assert.rejects(result, /tok for lang tid/);
  t.mock.timers.tick(5_000);
  await rejection;
});

test('address search cancels an obsolete request', async (t) => {
  t.mock.method(globalThis, 'fetch', (_url: string, init: RequestInit) => new Promise<Response>((_resolve, reject) => {
    init.signal!.addEventListener('abort', () => reject(init.signal!.reason), { once: true });
  }));
  const controller = new AbortController();
  const result = searchAddresses('Storgata', controller.signal);
  const rejection = assert.rejects(result, { name: 'AbortError' });
  controller.abort();
  await rejection;
});

test('manually entered addresses are accepted without an API selection', () => {
  const profile = { ...emptyState().profile, fromAddress: 'Min gamle vei 12, 0123 Oslo', toAddress: 'Min nye vei 34, 5000 Bergen', fromTenure: 'rent' as const, toTenure: 'own' as const };
  assert.deepEqual(profileErrors(profile, 1), []);
  assert.ok(generatePlan(profile).length > 0);
  assert.ok(profileErrors({ ...profile, toAddress: '   ' }, 1).includes('Skriv inn adressen du flytter til.'));
});
