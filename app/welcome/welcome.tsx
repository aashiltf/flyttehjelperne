import { useEffect, useRef, useState } from "react";

type Address = {
  adressetekst?: string;
  postnummer?: string;
  poststed?: string;
  kommunenavn?: string;
  representasjonspunkt?: { lat: number; lon: number };
};

type AddressFieldProps = {
  label: string;
  value: Address | null;
  onChange: (address: Address | null) => void;
  placeholder: string;
};

function AddressField({ label, value, onChange, placeholder }: AddressFieldProps) {
  const [query, setQuery] = useState(value?.adressetekst ?? "");
  const [suggestions, setSuggestions] = useState<Address[]>([]);
  const [loading, setLoading] = useState(false);
  const request = useRef(0);

  useEffect(() => {
    if (query.trim().length < 2 || value?.adressetekst === query) {
      setSuggestions([]);
      return;
    }

    const currentRequest = ++request.current;
    const timeout = window.setTimeout(async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `https://ws.geonorge.no/adresser/v1/sok?fuzzy=true&treffPerSide=6&sok=${encodeURIComponent(query)}`,
        );
        if (!response.ok) throw new Error("Kunne ikke søke etter adressen");
        const data = (await response.json()) as { adresser?: Address[] };
        if (currentRequest === request.current) setSuggestions(data.adresser ?? []);
      } catch {
        if (currentRequest === request.current) setSuggestions([]);
      } finally {
        if (currentRequest === request.current) setLoading(false);
      }
    }, 280);

    return () => window.clearTimeout(timeout);
  }, [query, value?.adressetekst]);

  function select(address: Address) {
    setQuery(address.adressetekst ?? "");
    setSuggestions([]);
    onChange(address);
  }

  return (
    <div className="relative">
      <label htmlFor={label} className="mb-2 block text-sm font-semibold text-slate-700">
        {label}
      </label>
      <div className="relative">
        <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true">
          <PinIcon />
        </span>
        <input
          id={label}
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            onChange(null);
          }}
          placeholder={placeholder}
          autoComplete="off"
          className="w-full rounded-xl border border-slate-200 bg-white py-4 pl-11 pr-10 text-slate-800 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:ring-4 focus:ring-teal-100"
          aria-autocomplete="list"
          aria-controls={`${label}-suggestions`}
        />
        {loading && <span className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin rounded-full border-2 border-slate-200 border-t-teal-600" aria-label="Søker" />}
      </div>
      {suggestions.length > 0 && (
        <ul id={`${label}-suggestions`} className="absolute z-10 mt-2 w-full overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-xl" role="listbox">
          {suggestions.map((address, index) => (
            <li key={`${address.adressetekst}-${index}`}>
              <button type="button" onClick={() => select(address)} className="flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-teal-50 focus:bg-teal-50 focus:outline-none" role="option">
                <PinIcon />
                <span>
                  <span className="block font-medium text-slate-800">{address.adressetekst}</span>
                  <span className="text-sm text-slate-500">{address.postnummer} {address.poststed}{address.kommunenavn ? ` · ${address.kommunenavn}` : ""}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function Welcome() {
  const [from, setFrom] = useState<Address | null>(null);
  const [to, setTo] = useState<Address | null>(null);
  const [submitted, setSubmitted] = useState(false);

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (from && to) setSubmitted(true);
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#f5f8f7] text-slate-900">
      <div className="mx-auto max-w-6xl px-5 pb-16 pt-6 sm:px-8 sm:pt-8">
        <header className="flex items-center justify-between">
          <a href="/" className="flex items-center gap-2.5 font-bold tracking-tight text-slate-900" aria-label="Flyttehjelpen hjem">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-teal-600 text-white"><HouseIcon /></span>
            <span>flytte<span className="text-teal-600">hjelpen</span></span>
          </a>
          <span className="hidden text-sm text-slate-500 sm:block">Trygt videre, sammen</span>
        </header>

        <section className="relative mx-auto mt-14 max-w-3xl text-center sm:mt-20">
          <div className="absolute left-1/2 top-[-120px] -z-0 h-64 w-64 -translate-x-1/2 rounded-full bg-teal-100/60 blur-3xl" />
          <p className="relative mb-4 text-sm font-bold uppercase tracking-[0.18em] text-teal-700">Start her</p>
          <h1 className="relative text-4xl font-bold tracking-tight text-slate-950 sm:text-6xl">Hvor skal du flytte?</h1>
          <p className="relative mx-auto mt-5 max-w-xl text-base leading-7 text-slate-600 sm:text-lg">Fortell oss hvor du bor i dag og hvor du skal. Så hjelper vi deg med å få oversikt over flyttingen.</p>
        </section>

        <section className="relative mx-auto mt-10 max-w-3xl rounded-3xl border border-slate-200/80 bg-white p-5 shadow-[0_20px_60px_-30px_rgba(15,118,110,0.35)] sm:mt-12 sm:p-9">
          <form onSubmit={submit}>
            <div className="grid gap-5 sm:grid-cols-[1fr_auto_1fr] sm:items-end">
              <AddressField label="Jeg flytter fra" value={from} onChange={setFrom} placeholder="Søk på gateadresse eller sted" />
              <div className="hidden h-10 w-10 items-center justify-center rounded-full bg-teal-50 text-teal-600 sm:flex" aria-hidden="true"><ArrowIcon /></div>
              <AddressField label="Jeg flytter til" value={to} onChange={setTo} placeholder="Søk på gateadresse eller sted" />
            </div>
            <button type="submit" disabled={!from || !to} className="mt-7 flex w-full items-center justify-center gap-2 rounded-xl bg-teal-600 px-5 py-4 font-semibold text-white transition hover:bg-teal-700 focus:outline-none focus:ring-4 focus:ring-teal-200 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400">
              Se hva flyttingen innebærer <ArrowIcon />
            </button>
            <p className="mt-4 text-center text-xs text-slate-400">Adressesøk levert av Kartverket · Vi lagrer ikke adressen din</p>
          </form>
          {submitted && from && to && (
            <div className="mt-6 rounded-2xl border border-teal-100 bg-teal-50 p-4 text-sm text-teal-900" role="status">
              <strong>Da er vi klare!</strong> Du flytter fra {from.adressetekst} til {to.adressetekst}. Neste steg kan hente relevant bolig- og flytteinformasjon for områdene.
            </div>
          )}
        </section>

        <div className="mx-auto mt-8 flex max-w-3xl flex-wrap justify-center gap-x-8 gap-y-3 text-sm text-slate-500">
          <span className="flex items-center gap-2"><CheckIcon /> Norsk og enkelt</span>
          <span className="flex items-center gap-2"><CheckIcon /> Basert på offentlige data</span>
          <span className="flex items-center gap-2"><CheckIcon /> Helt uforpliktende</span>
        </div>
      </div>
    </main>
  );
}

function PinIcon() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.5" /></svg>; }
function HouseIcon() { return <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1Z" /><path d="M9 21v-6h6v6" /></svg>; }
function ArrowIcon() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>; }
function CheckIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 4 4L19 6" /></svg>; }
