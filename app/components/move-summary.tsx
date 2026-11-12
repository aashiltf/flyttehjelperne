import { useEffect, useRef, useState } from 'react';
import { formatDate, hasMoveDate, profileErrors, subscriptionOptions, validDate, type MovingProfile, type Subscription } from '~/lib/moving-plan';
import { homeKindLabel } from './home-type';
import { useMoving } from './moving-provider';
import { HouseholdFields, HousingFields } from './profile-fields';
import { Icon } from './ui';

const tenureLabel = { own: 'Eier', rent: 'Leier', other: 'Annet', '': 'Ikke valgt' };

export function MoveSummary() {
  const { state, update } = useMoving();
  const p = state.profile;
  const [expanded, setExpanded] = useState(false);
  const [extras, setExtras] = useState(false);
  const [draft, setDraft] = useState<MovingProfile | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const errorSummary = useRef<HTMLDivElement>(null);
  const editButton = useRef<HTMLButtonElement>(null);
  const editHeading = useRef<HTMLHeadingElement>(null);

  useEffect(() => { if (errors.length) errorSummary.current?.focus(); }, [errors]);
  useEffect(() => { if (draft) editHeading.current?.focus(); }, [Boolean(draft)]);

  function finishEditing() {
    setDraft(null);
    setErrors([]);
    requestAnimationFrame(() => editButton.current?.focus());
  }

  function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!draft) return;
    const validation = [0, 1, 2].flatMap((step) => profileErrors(draft, step));
    setErrors(validation);
    if (validation.length) return;
    update((saved) => ({ ...saved, profile: { ...saved.profile, ...draft } }));
    finishEditing();
  }

  function toggleSubscription(id: Subscription, checked: boolean) {
    update((saved) => {
      return {
        ...saved,
        profile: { ...saved.profile, subscriptions: checked ? [...new Set([...saved.profile.subscriptions, id])] : saved.profile.subscriptions.filter((value) => value !== id) },
      };
    });
  }

  return <section aria-label="Flytteopplysninger" className="min-w-0 rounded-2xl border border-syrin-300 bg-syrin-100 px-4 pb-4 pt-2 sm:px-5 sm:pb-5">
    <div className="flex items-center justify-between gap-3">
      <h2 className="text-lg font-semibold text-kveld-900">Flyttingen din</h2>
      <button type="button" className="flex min-h-11 items-center gap-2 rounded-lg px-2 text-xs font-semibold text-syrin-600 hover:bg-syrin-100" aria-expanded={expanded} aria-controls="move-summary-details" disabled={draft !== null} onClick={() => setExpanded(!expanded)}>{expanded ? 'Vis mindre' : 'Vis mer'}<Icon name="chevron" className={`h-4 w-4 ${expanded ? '-rotate-90' : 'rotate-90'}`} /></button>
    </div>
    <div className="mt-2 grid items-start gap-5 text-sm sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
      <div className="grid min-w-0 grid-cols-[auto_minmax(0,1fr)] items-start gap-x-2.5 gap-y-1">
        <Icon name="pin" className="row-span-2 text-syrin-600" /><p className="text-xs text-kveld-500">Fra</p><p className="break-words font-medium">{p.fromAddress}</p>
        <p className="col-start-2 text-xs text-kveld-500">Utflytting: {validDate(p.moveOutDate) ? formatDate(p.moveOutDate, true) : 'Ikke avklart'}</p>
      </div>
      <Icon name="arrow" className="mt-4 hidden text-syrin-300 sm:block" />
      <div className="grid min-w-0 grid-cols-[auto_minmax(0,1fr)] items-start gap-x-2.5 gap-y-1">
        <Icon name="home" className="row-span-2 text-syrin-600" /><p className="text-xs text-kveld-500">Til</p><p className="break-words font-medium">{p.toAddress}</p>
        <p className="col-start-2 text-xs text-kveld-500">Overtakelse: {validDate(p.handoverDate) ? formatDate(p.handoverDate, true) : 'Ikke avklart'}</p><p className="col-start-2 text-xs text-kveld-500">Innflytting: {hasMoveDate(p) ? formatDate(p.moveDate, true) : 'Ikke avklart'}</p>
      </div>
    </div>
    <div id="move-summary-details" hidden={!expanded}>
      {draft ? <form onSubmit={save} noValidate className="mt-5 space-y-5 border-t border-syrin-200 pt-5">
        <h3 ref={editHeading} tabIndex={-1} className="text-lg font-semibold">Endre flytteopplysninger</h3>
        {errors.length > 0 && <div ref={errorSummary} tabIndex={-1} role="alert" className="rounded-xl bg-feil-100 p-4 text-sm text-feil-500"><p className="font-semibold">Sjekk opplysningene</p><ul className="mt-2 list-inside list-disc">{errors.map((error) => <li key={error}>{error}</li>)}</ul></div>}
        <HousingFields profile={draft} patch={(changes) => setDraft((saved) => saved && { ...saved, ...changes })} />
        <h3 className="font-semibold">Hvem flytter?</h3>
        <HouseholdFields profile={draft} patch={(changes) => setDraft((saved) => saved && { ...saved, ...changes })} />
        <div className="flex flex-wrap gap-3"><button type="submit" className="button-primary">Lagre endringer</button><button type="button" className="button-secondary" onClick={finishEditing}>Avbryt</button></div>
      </form> : <div className="mt-5 border-t border-syrin-200 pt-5">
        <dl className="grid gap-x-5 gap-y-4 text-sm sm:grid-cols-[minmax(0,1fr)_1.25rem_minmax(0,1fr)]">
          <div className="pl-[30px]"><dt className="text-xs text-kveld-500">Boligen du flytter fra</dt><dd className="mt-1">{homeKindLabel(p.fromAddress, p.fromHomeKind)} · {tenureLabel[p.fromTenure]}</dd></div>
          <div className="pl-[30px] sm:col-start-3"><dt className="text-xs text-kveld-500">Den nye boligen</dt><dd className="mt-1">{homeKindLabel(p.toAddress, p.toHomeKind)} · {tenureLabel[p.toTenure]}</dd></div>
          <div className="pl-[30px]"><dt className="text-xs text-kveld-500">Hvem flytter?</dt><dd className="mt-1">{p.household === 'partner' ? 'Med ektefelle/samboer' : 'Alene'}</dd></div>
          <div className="pl-[30px] sm:col-start-3"><dt className="text-xs text-kveld-500">Barn</dt><dd className="mt-1">{p.children ? p.schoolChange ? 'Med barn · bytter skole eller barnehage' : 'Med barn · bytter ikke skole eller barnehage' : 'Ingen barn med på flyttingen'}</dd></div>
        </dl>
        <button type="button" className="ml-[30px] mt-5 inline-flex min-h-11 items-center gap-2 rounded-lg text-sm font-semibold text-syrin-600 hover:bg-syrin-200" aria-expanded={extras} aria-controls="subscription-options" onClick={() => setExtras(!extras)}><Icon name={extras ? 'close' : 'plus'} className="h-4 w-4" />{extras ? 'Skjul ekstra' : 'Legg til ekstra'}</button>
        <div id="subscription-options" hidden={!extras} className="ml-[30px] mt-2 rounded-xl bg-white p-4">
          <fieldset><legend className="text-sm font-semibold">Abonnementer du må følge opp</legend><p className="mt-1 text-xs leading-5 text-kveld-500">Velg det du må si opp eller endre adresse på. Vi legger det til i abonnementsoppgaven.</p><div className="mt-3 flex flex-wrap gap-3">{subscriptionOptions.map((option) => <label key={option.id} className={`choice-small ${p.subscriptions.includes(option.id) ? 'choice-selected' : ''}`}><input className="check-input" type="checkbox" checked={p.subscriptions.includes(option.id)} onChange={(event) => toggleSubscription(option.id, event.target.checked)} />{option.label}</label>)}</div></fieldset>
        </div>
        <button ref={editButton} type="button" className="ml-[30px] mt-5 inline-flex min-h-11 items-center gap-2 rounded-lg text-sm font-semibold text-syrin-600 hover:bg-syrin-200" onClick={() => { setDraft({ ...p }); setErrors([]); }}><Icon name="edit" className="h-4 w-4" />Endre</button>
      </div>}
    </div>
  </section>;
}
