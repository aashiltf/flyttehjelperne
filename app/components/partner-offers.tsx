import { useEffect } from 'react';
import { useFetcher } from 'react-router';
import type { clientLoader } from '~/routes/partner-offers';
import { Icon } from './ui';

export function PartnerOffers({ taskId }: { taskId: string }) {
  const fetcher = useFetcher<typeof clientLoader>();
  const { load } = fetcher;
  const path = `/partnertilbud/${encodeURIComponent(taskId)}`;

  useEffect(() => { void load(path); }, [load, path]);

  const loading = fetcher.state !== 'idle' || !fetcher.data;

  return <aside aria-label="Tilbud fra samarbeidspartner" aria-busy={loading} className="mx-3 -mt-5 rounded-b-3xl bg-syrin-100 px-5 pb-5 pt-9 sm:mx-6 sm:px-6">
    <div aria-live="polite">
      {loading ? <p role="status" className="mt-3 text-sm text-kveld-700">Henter tilbud …</p> : !fetcher.data?.ok ? <div className="mt-3">
        <p role="alert" className="text-sm text-kveld-700">{fetcher.data?.error}</p>
        <button type="button" className="button-secondary mt-3" onClick={() => { void load(path); }}>Prøv igjen</button>
      </div> : fetcher.data.offers.length === 0 ? <p className="mt-3 text-sm text-kveld-700">Ingen tilbud tilgjengelig akkurat nå.</p> : <ul className="space-y-4">
        {fetcher.data.offers.map((offer) => <li key={offer.id}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            {offer.logo ? <img src={offer.logo.src} alt={offer.provider} width={offer.logo.width} height={offer.logo.height} className="h-auto w-36" /> : <p className="text-sm font-semibold text-syrin-600">{offer.provider}</p>}
            {offer.award && <span className="inline-flex items-center gap-1.5 rounded-full bg-sol px-3 py-1.5 text-xs font-semibold text-kveld-900"><span aria-hidden="true">★</span>{offer.award.label}</span>}
          </div>
          <h3 className="mt-4 text-lg font-semibold">{offer.product}</h3>
          <p className="mt-3 text-sm leading-6 text-kveld-700">{offer.description}</p>
          {offer.award && <a href={offer.award.href} className="mt-2 inline-block text-xs text-kveld-700 underline underline-offset-4">{offer.award.source}</a>}
          <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
            {offer.price && <p><span className="text-3xl font-semibold tracking-tight">{new Intl.NumberFormat('nb-NO', { style: 'currency', currency: offer.price.currency, maximumFractionDigits: 2 }).format(offer.price.amount)}</span><span className="text-sm text-kveld-700"> / {offer.price.period === 'month' ? 'måned' : 'år'}</span></p>}
             <a className={offer.link.variant === 'subtle' ? 'inline-flex items-center gap-2 rounded-sm py-2 text-sm font-medium text-kveld-700 underline underline-offset-4 hover:text-syrin-600' : 'button-primary'} href={offer.link.href}>{offer.link.label}<Icon name="arrow" className="h-4 w-4" /></a>
             {offer.secondaryLink && <a className="button-secondary" href={offer.secondaryLink.href}>{offer.secondaryLink.label}<Icon name="arrow" className="h-4 w-4" /></a>}
          </div>
          {offer.disclaimer && <p className="mt-3 text-xs leading-5 text-kveld-700">{offer.disclaimer}</p>}
        </li>)}
      </ul>}
    </div>
  </aside>;
}
