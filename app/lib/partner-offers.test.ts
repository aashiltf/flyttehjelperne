import assert from 'node:assert/strict';
import test from 'node:test';
import { getPartnerOffers, hasPartnerOffers, type PartnerOfferSource } from './partner-offers.ts';

test('shared-home has a Nordea advice demo about shared finances', async () => {
  assert.equal(hasPartnerOffers('shared-home'), true);
  const offers = await getPartnerOffers('shared-home', new AbortController().signal);
  assert.equal(offers.length, 1);
  assert.equal(offers[0].provider, 'Nordea');
  assert.equal(offers[0].product, 'Trenger dere rådgivning fra Nordea?');
  assert.match(offers[0].description, /felles økonomi/);
  assert.equal(offers[0].isDemo, true);
  assert.equal(offers[0].disclaimer, '');
  assert.equal(offers[0].demoButtonLabel, 'book rådgivning');
  assert.equal(offers[0].link, undefined);
});

test('move-in has a generic demo discount on handyman services without a booking link', async () => {
  assert.equal(hasPartnerOffers('move-in'), true);
  const offers = await getPartnerOffers('move-in', new AbortController().signal);
  assert.equal(offers.length, 1);
  assert.equal(offers[0].provider, 'Eksempelpartner');
  assert.equal(offers[0].product, '10 % rabatt på håndverkerhjelp');
  assert.match(offers[0].description, /10 % rabatt/);
  assert.equal(offers[0].isDemo, true);
  assert.match(offers[0].disclaimer, /ikke et aktivt tilbud/);
  assert.equal(offers[0].link, undefined);
  assert.equal(offers[0].price, undefined);
});

test('address task offers Huseierne membership and discounts, not address reporting partners', async () => {
  assert.equal(hasPartnerOffers('address'), true);
  const offers = await getPartnerOffers('address', new AbortController().signal);
  assert.equal(offers.length, 1);
  const [offer] = offers;
  assert.equal(offer.provider, 'Huseierne');
  assert.match(offer.description, /rabatter og tilbud.*flytteprosess/);
  assert.equal(offer.isDemo, false);
  assert.equal(offer.price, undefined);
  assert.match(offer.disclaimer, /Medlemskap koster penger/);
  assert.deepEqual(offer.link, {
    label: 'Bli medlem her', href: 'https://bli-medlem.huseierne.no/privat/bli-medlem', variant: 'subtle',
  });
  assert.deepEqual(offer.secondaryLink, {
    label: 'Sjekk rabatter', href: 'https://www.huseierne.no/medlemskap/medlemsfordeler/rabatter/',
  });
});

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
  assert.ok(offers[0].link);
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
