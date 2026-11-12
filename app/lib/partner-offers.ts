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
  link?: { label: string; href: string; variant?: 'subtle' };
  demoButtonLabel?: string;
  secondaryLink?: { label: string; href: string };
};

/** Replace the mock with a backend request returning this same contract. */
export type PartnerOfferSource = (taskId: string, signal: AbortSignal) => Promise<PartnerOffer[]>;

// Add task IDs here to enable the reusable offer panel on more tasks.
const offersByTask: Record<string, PartnerOffer[]> = {
  'shared-home': [{
    id: 'nordea-advice-demo',
    provider: 'Nordea',
    product: 'Trenger dere rådgivning fra Nordea?',
    description: 'Når dere flytter sammen, kan det være nyttig å snakke med en rådgiver om felles økonomi. Nordea kan hjelpe dere med spørsmål om felles konto, sparing, boliglån og fordeling av utgifter.',
    isDemo: true,
    disclaimer: '',
    demoButtonLabel: 'book rådgivning',
  }],
  'move-in': [{
    id: 'handyman-demo',
    provider: 'Eksempelpartner',
    product: '10 % rabatt på håndverkerhjelp',
    description: 'Trenger du hjelp til å gjøre den nye boligen klar? Gjennom en samarbeidspartner kan du få 10 % rabatt på håndverkertjenester, for eksempel maling, montering og mindre oppussingsjobber.',
    isDemo: true,
    disclaimer: 'Dette er et demoeksempel, ikke et aktivt tilbud. Rabatten på 10 % er kun et eksempel. Partner og vilkår er ikke avklart.',
  }],
  address: [{
    id: 'huseierne-membership',
    provider: 'Huseierne',
    product: 'Gode rabatter når du flytter',
    description: 'Huseierne har gode rabatter og tilbud som kan komme godt med i en flytteprosess. Som medlem får du tilgang til fordeler for deg og den nye boligen din.',
    isDemo: false,
    disclaimer: 'Medlemskap koster penger. Sjekk gjeldende medlemspris og vilkår for rabattene hos Huseierne.',
    link: { label: 'Bli medlem her', href: 'https://bli-medlem.huseierne.no/privat/bli-medlem', variant: 'subtle' },
    secondaryLink: { label: 'Sjekk rabatter', href: 'https://www.huseierne.no/medlemskap/medlemsfordeler/rabatter/' },
  }],
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
