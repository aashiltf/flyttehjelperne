import { AddressField } from './address-field';
import { HomeTypePreview } from './home-type';
import { Icon } from './ui';
import type { MovingProfile, Tenure } from '~/lib/moving-plan';

type ProfileFieldsProps = { profile: MovingProfile; patch: (changes: Partial<MovingProfile>) => void };

function TenureChoice({ value, onChange, label, name }: { value: Tenure; onChange: (value: Tenure) => void; label: string; name: string }) {
  return <fieldset><legend className="mb-2 text-xs font-semibold text-kveld-500">{label}</legend><div className="grid max-w-sm grid-cols-3 gap-1 rounded-xl border border-kveld-200 bg-white p-1">
    {([['own', 'Eie'], ['rent', 'Leie'], ['other', 'Annet']] as const).map(([id, title]) => <label key={id} className={`relative flex min-h-11 cursor-pointer items-center justify-center rounded-lg px-3 text-sm font-medium ${value === id ? 'bg-syrin-500 text-white' : 'text-kveld-500 hover:bg-kveld-50'}`}><input className="peer sr-only" type="radio" name={name} value={id} checked={value === id} onChange={() => onChange(id)} /><span className="pointer-events-none absolute inset-0 rounded-lg peer-focus-visible:outline-3 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-syrin-500" />{title}</label>)}
  </div></fieldset>;
}

function DateField({ id, label, value, onChange, help }: { id: string; label: string; value: string; onChange: (value: string) => void; help?: string }) {
  return <div><div className="mb-2 flex items-center gap-2"><label className="block text-xs font-semibold text-kveld-500" htmlFor={id}>{label} <span className="font-normal">· valgfritt</span></label>{help && <details className="relative"><summary aria-label={`Hjelp om ${label.toLowerCase()}`} className="grid h-8 w-8 list-none place-items-center rounded-full text-kveld-500 hover:bg-white [&::-webkit-details-marker]:hidden"><Icon name="help" className="h-4 w-4" /></summary><p className="absolute right-0 top-full z-10 mt-1 w-56 rounded-xl border border-kveld-200 bg-white p-3 text-xs leading-5 text-kveld-500 shadow-md">{help}</p></details>}</div>
    <div className="flex gap-2"><input id={id} type="date" className="text-input max-w-48" value={value} onChange={(event) => onChange(event.target.value)} />{value && <button type="button" className="shrink-0 rounded-xl px-3 text-xs font-semibold text-syrin-600 underline underline-offset-4" onClick={() => onChange('')}>Fjern<span className="sr-only"> {label.toLowerCase()}sdato</span></button>}</div>
  </div>;
}

export function HousingFields({ profile, patch }: ProfileFieldsProps) {
  return <div className="space-y-5">
    <div className="space-y-4 rounded-2xl bg-kveld-50 p-4">
      <AddressField label="Jeg flytter fra" value={profile.fromAddress} onChange={(fromAddress) => patch({ fromAddress, fromHomeKind: 'leilighet' })} />
      <HomeTypePreview key={profile.fromAddress} address={profile.fromAddress} kind={profile.fromHomeKind} label="for boligen du flytter fra" onChange={(fromHomeKind) => patch({ fromHomeKind })} />
      <TenureChoice label="Boligen jeg flytter fra" name="fromTenure" value={profile.fromTenure} onChange={(fromTenure) => patch({ fromTenure })} />
      <DateField id="move-out-date" label="Utflytting" value={profile.moveOutDate} onChange={(moveOutDate) => patch({ moveOutDate })} />
    </div>
    <div className="space-y-4 rounded-2xl bg-syrin-50 p-4">
      <AddressField label="Jeg flytter til" value={profile.toAddress} onChange={(toAddress) => patch({ toAddress, toHomeKind: 'enebolig' })} />
      <HomeTypePreview key={profile.toAddress} address={profile.toAddress} kind={profile.toHomeKind} label="for den nye boligen" onChange={(toHomeKind) => patch({ toHomeKind })} />
      <TenureChoice label="Den nye boligen" name="toTenure" value={profile.toTenure} onChange={(toTenure) => patch({ toTenure })} />
      <DateField id="handover-date" label="Overtakelse" value={profile.handoverDate} onChange={(handoverDate) => patch({ handoverDate })} help="Overtakelse er når du får nøklene og overtar boligen. Innflytting er når du faktisk flytter inn. Det kan være samme dag eller to ulike datoer." />
      <DateField id="move-date" label="Innflytting" value={profile.moveDate} onChange={(moveDate) => patch({ moveDate, dateUnknown: false })} />
    </div>
  </div>;
}

export function HouseholdFields({ profile, patch }: ProfileFieldsProps) {
  return <div>
    <fieldset><legend className="sr-only">Hvem flytter du med?</legend><div className="grid gap-3 sm:grid-cols-2">
      {([{ value: 'alone', title: 'Alene', icon: 'person' }, { value: 'partner', title: 'Ektefelle/samboer', icon: 'users' }] as const).map((option) => <label key={option.value} className={`choice-card flex items-center gap-3 ${profile.household === option.value ? 'choice-selected' : ''}`}>
        <input type="radio" name="household" value={option.value} checked={profile.household === option.value} onChange={() => patch({ household: option.value })} className="sr-only" />
        <span className={`rounded-xl p-2.5 ${profile.household === option.value ? 'bg-syrin-500 text-white' : 'bg-syrin-100 text-syrin-600'}`}><Icon name={option.icon} /></span><span className="font-semibold">{option.title}</span>
      </label>)}
    </div></fieldset>
    <label className={`choice-small mt-3 ${profile.children ? 'choice-selected' : ''}`}><input className="check-input" type="checkbox" checked={profile.children} onChange={(event) => patch({ children: event.target.checked, ...(event.target.checked ? {} : { schoolChange: false }) })} />Vi har med barn</label>
    {profile.children && <fieldset className="mt-4"><legend className="field-label">Skal barna bytte skole eller barnehage?</legend><div className="flex gap-3">{([true, false] as const).map((value) => <label key={String(value)} className={`choice-small ${profile.schoolChange === value ? 'choice-selected' : ''}`}><input className="check-input" type="radio" name="schoolChange" checked={profile.schoolChange === value} onChange={() => patch({ schoolChange: value })} />{value ? 'Ja' : 'Nei'}</label>)}</div></fieldset>}
  </div>;
}
