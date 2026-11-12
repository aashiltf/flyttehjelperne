export type PartnerOffer = {
  id: string;
  provider: string;
  logo?: { src: string; width: number; height: number };
  product: string;
  description: string;
  price?: { amount: number; currency: 'NOK'; period: 'month' | 'year' };
  award?: { label: string; source: string; href: string };
  isDemo: boolean;
  disclaimer: string;
  link: { label: string; href: string };
};

/** Replace the mock with a backend request returning this same contract. */
export type PartnerOfferSource = (taskId: string, signal: AbortSignal) => Promise<PartnerOffer[]>;

// Add task IDs here to enable the reusable offer panel on more tasks.
const offersByTask: Record<string, PartnerOffer[]> = {
  insurance: [{
    id: 'gjensidige-contents-demo',
    provider: 'Gjensidige',
    logo: { src: '/gjensidige-logo.svg', width: 155, height: 39 },
    product: 'Innboforsikring',
    description: 'Innboforsikringen dekker tingene dine ved blant annet tyveri, brann eller vannskader.',
    price: { amount: 149, currency: 'NOK', period: 'month' },
    isDemo: true,
    disclaimer: '',
    link: { label: 'Kjøp forsikring', href: 'https://www.testgjensidige.no/applications/nettbutikk-privat/nettbutikk-innbo' },
  }],
};

export function hasPartnerOffers(taskId: string): boolean {
  return Object.hasOwn(offersByTask, taskId);
}

export const mockPartnerOfferSource: PartnerOfferSource = async (taskId, signal) => {
  signal.throwIfAborted();
  return structuredClone(hasPartnerOffers(taskId) ? offersByTask[taskId] : []);
};

export async function getPartnerOffers(taskId: string, signal: AbortSignal, source: PartnerOfferSource = mockPartnerOfferSource): Promise<PartnerOffer[]> {
  signal.throwIfAborted();
  return source(taskId, signal);
}
