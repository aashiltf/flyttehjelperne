import { Link } from 'react-router';
import type { ReactNode } from 'react';
import { useMoving } from './moving-provider';

export function Icon({ name, className = '' }: { name: 'home' | 'arrow' | 'check' | 'pin' | 'users' | 'person' | 'calendar' | 'shield' | 'spark' | 'chevron' | 'clock' | 'list' | 'timeline' | 'close'; className?: string }) {
  const paths: Record<typeof name, ReactNode> = {
    home: <><path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1Z" /><path d="M9 21v-7h6v7" /></>,
    arrow: <path d="M4 12h16m-6-6 6 6-6 6" />,
    check: <path d="m5 12 4 4L19 6" />,
    pin: <><path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.5" /></>,
    users: <><circle cx="9" cy="8" r="3" /><path d="M3 21v-3a6 6 0 0 1 12 0v3M16 5a3 3 0 0 1 0 6m2 3a5 5 0 0 1 3 4v3" /></>,
    person: <><circle cx="12" cy="7" r="4" /><path d="M5 21v-3a7 7 0 0 1 14 0v3" /></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 11h18m-13 5h2m4 0h2" /></>,
    shield: <><path d="m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6l8-3Z" /><path d="m8 12 3 3 5-6" /></>,
    spark: <><path d="m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5L12 3Z" /></>,
    chevron: <path d="m9 5 7 7-7 7" />,
    clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
    list: <><path d="M9 6h11M9 12h11M9 18h11" /><path d="m3.5 6 1 1 2-2M3.5 12l1 1 2-2M3.5 18l1 1 2-2" /></>,
    timeline: <><path d="M3 12h18" /><circle cx="7" cy="12" r="2" /><circle cx="14" cy="12" r="2" /><path d="M7 6v4M14 14v4M19 8v8" /></>,
    close: <path d="M6 6l12 12M18 6 6 18" />,
  };
  return <svg aria-hidden="true" className={`h-5 w-5 shrink-0 ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>;
}

export function Shell({ children }: { children: ReactNode }) {
  const { storageError, ready } = useMoving();
  return <div className="min-h-screen text-kveld-900">
    <header className="border-b border-kveld-100 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-5 sm:px-8">
        <Link to="/" className="flex items-center gap-2.5 text-lg font-bold tracking-tight text-kveld-900" aria-label="Flyttehjelpen hjem">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-syrin-500 text-white"><Icon name="home" /></span>
          <span>flytte<span className="text-syrin-600">hjelpen</span></span>
        </Link>
        <span className="hidden text-sm text-kveld-500 sm:block">Litt mindre kaos. Litt mer hjemme.</span>
        <span className="rounded-full border border-syrin-200 px-3 py-1 text-xs font-semibold text-syrin-600">Demo</span>
      </div>
    </header>
    {storageError && <div role="alert" className="mx-auto mt-5 max-w-5xl rounded-xl border border-varsel-300 bg-varsel-100 p-4 text-sm text-varsel-500">{storageError}</div>}
    {ready ? children : <main className="mx-auto max-w-3xl px-5 py-24 text-center" role="status">Henter flytteplanen din …</main>}
    <footer className="mx-auto max-w-6xl px-5 py-8 text-center text-xs leading-6 text-kveld-500 sm:px-8">
      <span className="inline-flex items-center gap-1.5"><Icon name="shield" className="h-4 w-4" /> Svarene dine lagres lokalt i denne nettleseren.</span>
      <p>En veiledende flytteplan. Ingen søknader, bestillinger eller avtaler sendes fra demoen.</p>
    </footer>
  </div>;
}

export function HouseIllustration() {
  return <svg viewBox="0 0 360 260" className="mx-auto w-full max-w-sm" fill="none" aria-hidden="true">
    <ellipse cx="182" cy="235" rx="151" ry="13" fill="#C8F2DA" />
    <circle cx="190" cy="121" r="108" fill="#D6ECFF" />
    <path d="M80 133 178 52l98 81v99H80Z" fill="#FFFFFF" />
    <path d="m65 135 113-95 113 95" stroke="#141A45" strokeWidth="13" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M229 80V43h24v57" fill="#A89BFF" />
    <rect x="153" y="157" width="49" height="75" rx="5" fill="#6A50E8" />
    <circle cx="190" cy="199" r="3" fill="#FFFFFF" />
    <rect x="104" y="141" width="30" height="38" rx="3" fill="#DCD5FF" />
    <path d="M119 141v38m-15-19h30" stroke="#FFFFFF" strokeWidth="3" />
    <rect x="224" y="141" width="30" height="38" rx="3" fill="#DCD5FF" />
    <path d="M239 141v38m-15-19h30" stroke="#FFFFFF" strokeWidth="3" />
    <rect x="44" y="199" width="49" height="34" rx="3" fill="#F2E27A" />
    <path d="M68 199v13" stroke="#FBF6B4" strokeWidth="7" />
    <rect x="262" y="186" width="51" height="47" rx="3" fill="#FBF6B4" />
    <path d="M287 186v17" stroke="#F2E27A" strokeWidth="8" />
    <path d="M318 225v-55m0 32c-25-3-31-18-28-25 16-2 28 12 28 25Zm0-13c22-5 25-21 20-26-16 0-22 14-20 26Z" stroke="#0D6B4A" strokeWidth="4" fill="#C8F2DA" strokeLinejoin="round" />
    <circle cx="64" cy="67" r="19" fill="#F2B53A" />
    <path d="m58 67 4 4 8-9" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
  </svg>;
}
