import type { Route } from './+types/partner-offers';
import { getPartnerOffers } from '~/lib/partner-offers';

export async function clientLoader({ params, request }: Route.ClientLoaderArgs) {
  try {
    const offers = await getPartnerOffers(params.taskId, request.signal);
    return { ok: true as const, offers };
  } catch (error) {
    if (request.signal.aborted) throw error;
    return { ok: false as const, error: 'Vi klarte ikke å hente tilbudet. Prøv igjen.' };
  }
}

// This client-only data route also works with the app's static SPA hosting.
export default function PartnerOffersData() {
  return null;
}
