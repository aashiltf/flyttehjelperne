import { useEffect, useId, useRef, useState } from 'react';
import { searchAddresses, type Address } from '~/lib/address-search';
import { Icon } from './ui';

export function AddressField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  const id = useId();
  const [suggestions, setSuggestions] = useState<Address[]>([]);
  const [status, setStatus] = useState<'idle' | 'loading' | 'empty' | 'error'>('idle');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [manual, setManual] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const selected = useRef(value);
  const requestId = useRef(0);

  useEffect(() => {
    const request = ++requestId.current;
    setSuggestions([]);
    setActive(-1);
    if (manual) return;
    setStatus('idle');
    if (value.trim().length < 3 || value === selected.current || !open) return;
    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      setStatus('loading');
      try {
        const addresses = await searchAddresses(value, controller.signal);
        if (request === requestId.current) { setSuggestions(addresses); setStatus(addresses.length ? 'idle' : 'empty'); }
      } catch {
        if (!controller.signal.aborted && request === requestId.current) {
          setStatus('error');
          setManual(true);
          setOpen(false);
        }
      }
    }, 300);
    return () => { window.clearTimeout(timeout); controller.abort(); };
  }, [value, open, manual]);

  function toggleManual() {
    setManual(!manual);
    setStatus('idle');
    setSuggestions([]);
    setActive(-1);
    setOpen(manual);
    input.current?.focus();
  }

  function choose(address: Address) {
    const text = `${address.adressetekst}, ${address.postnummer} ${address.poststed}`;
    selected.current = text;
    onChange(text);
    setOpen(false);
    setSuggestions([]);
  }

  return <div className="relative">
    <label htmlFor={id} className="field-label">{label}</label>
    <div className="relative">
      <Icon name="pin" className="pointer-events-none absolute left-3.5 top-3.5 text-kveld-300" />
      <input ref={input} id={id} className="text-input pl-11" value={value} maxLength={200} required autoComplete="off" placeholder={manual ? 'Gateadresse, postnummer og sted' : 'Gateadresse og sted'}
        role={manual ? undefined : 'combobox'} aria-expanded={manual ? undefined : open && suggestions.length > 0} aria-autocomplete={manual ? undefined : 'list'} aria-controls={!manual && open && suggestions.length > 0 ? `${id}-suggestions` : undefined} aria-activedescendant={!manual && open && active >= 0 ? `${id}-option-${active}` : undefined} aria-describedby={`${id}-help`}
        onFocus={() => { if (!manual) setOpen(true); }} onBlur={() => setOpen(false)}
        onChange={(event) => { onChange(event.target.value); if (!manual) setOpen(true); }}
        onKeyDown={(event) => {
          if (event.key === 'Escape') { if (open && suggestions.length) event.preventDefault(); setOpen(false); setActive(-1); }
          if (suggestions.length && open && (event.key === 'ArrowDown' || event.key === 'ArrowUp')) {
            event.preventDefault();
            setActive((index) => event.key === 'ArrowDown' ? (index + 1) % suggestions.length : (index <= 0 ? suggestions.length - 1 : index - 1));
          }
          if (event.key === 'Enter' && open && active >= 0 && suggestions[active]) { event.preventDefault(); choose(suggestions[active]); }
        }} />
    </div>
    {open && suggestions.length > 0 && <ul id={`${id}-suggestions`} role="listbox" aria-label={`Adresseforslag for ${label}`} className="absolute z-20 mt-2 w-full rounded-xl border border-kveld-200 bg-white p-1 shadow-xl">
      {suggestions.map((address, index) => <li key={`${address.adressetekst}-${address.postnummer}`} id={`${id}-option-${index}`} role="option" aria-selected={active === index} onMouseDown={(event) => event.preventDefault()} onClick={() => choose(address)} className={`cursor-pointer rounded-lg px-3 py-2.5 text-sm hover:bg-syrin-50 ${active === index ? 'bg-syrin-50' : ''}`}>
        <span className="block font-semibold">{address.adressetekst}</span><span className="text-kveld-500">{address.postnummer} {address.poststed}</span>
      </li>)}
    </ul>}
    <p id={`${id}-help`} role="status" className={status === 'idle' && !manual ? 'sr-only' : 'mt-2 text-xs leading-5 text-kveld-500'}>
      {manual ? `${status === 'error' ? 'Adressesøket er utilgjengelig. ' : ''}Skriv inn gateadresse, postnummer og sted selv. Du kan fortsette uten å velge et adresseforslag.` : status === 'loading' ? 'Søker etter adresser …' : status === 'empty' ? 'Ingen forslag funnet. Du kan bruke adressen du har skrevet.' : ''}
    </p>
    <button type="button" className="mt-2 min-h-11 rounded px-1 text-xs font-semibold text-syrin-600 underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-syrin-500" onClick={toggleManual}>
      {manual ? 'Prøv adressesøk igjen' : 'Skriv inn adresse manuelt'}
      <span className="sr-only"> – {label.toLowerCase()}</span>
    </button>
  </div>;
}
