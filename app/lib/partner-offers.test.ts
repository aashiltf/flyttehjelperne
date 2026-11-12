import assert from 'node:assert/strict';
import test from 'node:test';
import { getPartnerOffers, hasPartnerOffers, type PartnerOfferSource } from './partner-offers.ts';

test('insurance has Gjensidige branding, a sourced award, price and test checkout', async () => {
  assert.equal(hasPartnerOffers('insurance'), true);
  const offers = await getPartnerOffers('insurance', new AbortController().signal);
  assert.equal(offers.length, 1);
  assert.equal(offers[0].provider, 'Gjensidige');
  assert.equal(offers[0].product, 'Innboforsikring');
  assert.equal(offers[0].logo?.src, '/gjensidige-logo.svg');
  assert.equal(offers[0].award?.label, 'Best i test');
  assert.equal(offers[0].award?.source, 'Innbo Pluss · Smarte penger, oktober 2024');
  assert.deepEqual(offers[0].price, { amount: 149, currency: 'NOK', period: 'month' });
  assert.equal(offers[0].isDemo, true);
  assert.match(offers[0].disclaimer, /Sjekk eksisterende forsikring/);
  assert.equal(new URL(offers[0].link.href).protocol, 'https:');
  assert.equal(offers[0].link.label, 'Kjøp forsikring');
  assert.equal(offers[0].link.href, 'https://www.testgjensidige.no/applications/nettbutikk-privat/nettbutikk-innbo');
});

test('unconfigured tasks have no offers, including inherited object names', async () => {
  for (const id of ['packing', 'unknown', '__proto__', 'constructor']) {
    assert.equal(hasPartnerOffers(id), false);
    assert.deepEqual(await getPartnerOffers(id, new AbortController().signal), []);
  }
});

test('mock responses are independent and cannot mutate future offers', async () => {
  const signal = new AbortController().signal;
  const first = await getPartnerOffers('insurance', signal);
  first[0].product = 'Changed';
  assert.equal((await getPartnerOffers('insurance', signal))[0].product, 'Innboforsikring');
});

test('data source can be replaced without changing the UI contract', async () => {
  const signal = new AbortController().signal;
  const source: PartnerOfferSource = async (taskId, requestSignal) => {
    assert.equal(taskId, 'insurance');
    assert.equal(requestSignal, signal);
    return [];
  };
  assert.deepEqual(await getPartnerOffers('insurance', signal, source), []);
  await assert.rejects(getPartnerOffers('insurance', signal, async () => { throw new Error('Unavailable'); }), /Unavailable/);
});

test('aborted requests never call the data source', async () => {
  const controller = new AbortController();
  controller.abort();
  await assert.rejects(getPartnerOffers('insurance', controller.signal, async () => {
    assert.fail('The source must not be called');
  }), { name: 'AbortError' });
});
