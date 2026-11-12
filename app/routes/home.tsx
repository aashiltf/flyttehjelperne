import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import type { Route } from './+types/home';
import { ExpandableField } from '~/components/expandable-field';
import { homeKindLabel } from '~/components/home-type';
import { HouseholdFields, HousingFields } from '~/components/profile-fields';
import { useMoving } from '~/components/moving-provider';
import { Icon, Shell } from '~/components/ui';
import {
  formatDate,
  profileErrors,
  validDate,
  type HomeKind,
  type MovingProfile,
} from '~/lib/moving-plan';

export function meta({}: Route.MetaArgs) {
  return [
    { title: 'Planlegg flyttingen – Flyttehjelpen' },
    {
      name: 'description',
      content:
        'Legg inn adresser og datoer. Få en oversikt over oppgaver og frister for flyttingen.',
    },
  ];
}

type FieldId = 'where' | 'who';

function shortAddress(value: string) {
  return value.split(',')[0]?.trim() ?? value;
}

function whereErrors(profile: MovingProfile) {
  return [...profileErrors(profile, 1), ...profileErrors(profile, 2)];
}

function whereSummary(p: MovingProfile) {
  if (!p.fromAddress && !p.toAddress && !p.moveDate)
    return 'Legg inn adressene, og datoene hvis du vet dem';
  const side = (
    address: string,
    kind: HomeKind,
    date: string,
    prefix: string,
  ) => {
    if (!address) return '…';
    const type = homeKindLabel(address, kind);
    return [
      shortAddress(address),
      type && type.toLowerCase(),
      validDate(date) && `${prefix} ${formatDate(date)}`,
    ]
      .filter(Boolean)
      .join(', ');
  };
  return (
    <span className="block font-medium text-kveld-900">
      {side(p.fromAddress, p.fromHomeKind, p.moveOutDate, 'ut')} →{' '}
      {side(p.toAddress, p.toHomeKind, p.moveDate, 'inn')}
      {validDate(p.handoverDate) &&
        ` · overtakelse ${formatDate(p.handoverDate)}`}
    </span>
  );
}

function whoSummary(p: MovingProfile) {
  if (!p.household) return 'Velg hvem som flytter';
  const parts = [p.household === 'partner' ? 'Med ektefelle/samboer' : 'Alene'];
  if (p.children)
    parts.push(p.schoolChange ? 'med barn som bytter skole' : 'med barn');
  return (
    <span className="font-medium text-kveld-900">{parts.join(' · ')}</span>
  );
}

export default function Home() {
  const { state, update } = useMoving();
  const navigate = useNavigate();
  const { profile } = state;
  const [openField, setOpenField] = useState<FieldId | null>(null);
  const [showErrors, setShowErrors] = useState(false);
  const [building, setBuilding] = useState(false);
  const errorSummary = useRef<HTMLDivElement>(null);

  const where = whereErrors(profile);
  const who = profileErrors(profile, 0);
  const errors = [...where, ...who];

  useEffect(() => {
    if (showErrors && errors.length) errorSummary.current?.focus();
  }, [showErrors]); // eslint-disable-line react-hooks/exhaustive-deps

  const close = useCallback(() => setOpenField(null), []);

  function patch(changes: Partial<MovingProfile>) {
    update((saved) => ({
      ...saved,
      profile: { ...saved.profile, ...changes },
    }));
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (errors.length) {
      setShowErrors(true);
      setOpenField(where.length ? 'where' : 'who');
      return;
    }
    setBuilding(true);
    update((saved) => ({ ...saved, created: true }));
    await navigate('/tidslinje');
  }

  return (
    <Shell showFooter={false}>
      <main className="relative min-h-[calc(100vh-5rem)] overflow-x-clip">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-[32rem] bg-gradient-to-b from-himmel via-kveld-50 to-white"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-10 top-8 h-40 w-40 rounded-full bg-sol sm:right-[8%] sm:top-12 sm:h-60 sm:w-60"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-48 top-[24rem] hidden h-[30rem] w-[30rem] rounded-full bg-eng lg:block"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -left-40 top-[44rem] hidden h-72 w-72 rounded-full bg-syrin-100 lg:block"
        />
        <div className="relative mx-auto max-w-2xl px-5 pb-10 pt-12 sm:px-8 sm:pt-20">
          <section className="mb-8 sm:mb-10">
            <h1 className="max-w-xl text-3xl font-semibold leading-tight tracking-tight text-kveld-900 sm:text-5xl">
              Fra kaos til kontroll
            </h1>
            <p className="mt-5 max-w-lg text-lg leading-8 text-kveld-500 sm:text-xl">
              Se hva du må gjøre før, under og etter flyttingen.
            </p>
          </section>
          <form
            onSubmit={submit}
            noValidate
            aria-label="Opplysninger om flyttingen"
            className="min-w-0 space-y-4"
          >
            {showErrors && errors.length > 0 && (
              <div
                ref={errorSummary}
                tabIndex={-1}
                role="alert"
                className="rounded-2xl bg-feil-100 p-4 text-sm text-feil-500"
              >
                <p className="font-semibold">Vi mangler litt informasjon</p>
                <ul className="mt-1 list-inside list-disc">
                  {errors.map((error) => (
                    <li key={error}>{error}</li>
                  ))}
                </ul>
              </div>
            )}

            <ExpandableField
              number={1}
              title="Hvor flytter du til?"
              summary={whereSummary(profile)}
              complete={where.length === 0}
              open={openField === 'where'}
              onOpen={() => setOpenField('where')}
              onClose={close}
            >
              <div className="space-y-5">
                <HousingFields profile={profile} patch={patch} />
                {showErrors && where.length > 0 && (
                  <p className="text-sm text-feil-500">{where[0]}</p>
                )}
                <div className="flex justify-end">
                  <button
                    type="button"
                    className="button-secondary"
                    onClick={() => setOpenField(where.length ? 'where' : 'who')}
                  >
                    Neste: hvem flytter
                    <Icon name="arrow" className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </ExpandableField>

            <ExpandableField
              number={2}
              title="Hvem flytter?"
              summary={whoSummary(profile)}
              complete={who.length === 0}
              open={openField === 'who'}
              onOpen={() => setOpenField('who')}
              onClose={close}
            >
              <HouseholdFields profile={profile} patch={patch} />
              {showErrors && who.length > 0 && (
                <p className="mt-4 text-sm text-feil-500">{who[0]}</p>
              )}
            </ExpandableField>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={building}
                className="button-primary w-full sm:w-auto"
              >
                {building ? 'Henter planen …' : 'Se planen min'}
                <Icon name="arrow" />
              </button>
            </div>
          </form>
        </div>
      </main>
    </Shell>
  );
}
