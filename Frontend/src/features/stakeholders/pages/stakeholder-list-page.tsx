import { RotateCcw, Search, UserPlus } from 'lucide-react';
import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router';

import { EmptyState, ErrorState, LoadingState } from '@/components/common/states';
import { Button, buttonVariants } from '@/components/ui/button';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/toast';
import { listStakeholders } from '@/lib/api';
import { getErrorMessage, isApiError } from '@/lib/api/errors';
import { apiFieldErrors, issuesToFieldErrors } from '@/lib/form-errors';

import { StakeholderTypeSelect } from '../components/stakeholder-type-select';
import { stakeholderSearchSchema, type StakeholderSearchInput, type StakeholderSearchValues } from '../schemas';
import type { Stakeholder } from '../types';

const EMPTY_SEARCH: StakeholderSearchInput = { stakeholderCode: '', stakeholderName: '', stakeholderTypeId: '' };

function hasFilters(search: Partial<StakeholderSearchValues>) {
  return Object.values(search).some((value) => value !== undefined && value !== '');
}

export function StakeholderListPage() {
  const toast = useToast();
  const [values, setValues] = useState(EMPTY_SEARCH);
  const [errors, setErrors] = useState<Record<string, string>>({});
  /** The filters of the search on screen, so "Try again" repeats it. */
  const [applied, setApplied] = useState<Partial<StakeholderSearchValues>>({});
  const [stakeholders, setStakeholders] = useState<Stakeholder[] | null>(null);
  const [error, setError] = useState<unknown>(null);

  const runSearch = useCallback(
    async (search: Partial<StakeholderSearchValues>) => {
      setApplied(search);
      setError(null);
      setStakeholders(null);
      try {
        setStakeholders(await listStakeholders(search));
      } catch (caught) {
        setError(caught);
        toast.error(getErrorMessage(caught));
        if (isApiError(caught)) setErrors(apiFieldErrors(caught.fieldErrors));
      }
    },
    [toast],
  );

  useEffect(() => {
    void runSearch({});
  }, [runSearch]);

  const set = (key: keyof StakeholderSearchInput, value: string) =>
    setValues((previous) => ({ ...previous, [key]: value }));

  function handleSearch(event: FormEvent) {
    event.preventDefault();
    const result = stakeholderSearchSchema.safeParse(values);
    if (!result.success) {
      setErrors(issuesToFieldErrors(result.error.issues));
      return;
    }
    setErrors({});
    void runSearch(result.data);
  }

  function handleReset() {
    setValues(EMPTY_SEARCH);
    setErrors({});
    void runSearch({});
  }

  const filtered = hasFilters(applied);
  const searching = stakeholders === null && error === null;

  return (
    <div className="grid gap-6">
      <form
        role="search"
        aria-label="Search stakeholders"
        onSubmit={handleSearch}
        noValidate
        className="grid gap-5 rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6"
      >
        <h2 className="text-base font-semibold">Search stakeholders</h2>

        <div className="grid gap-5 sm:grid-cols-3">
          <FormField label="Stakeholder code" error={errors.stakeholderCode}>
            {(control) => (
              <Input
                {...control}
                className="h-10 uppercase placeholder:normal-case"
                autoCapitalize="characters"
                spellCheck={false}
                placeholder="Any code"
                value={values.stakeholderCode}
                onChange={(event) => set('stakeholderCode', event.target.value)}
              />
            )}
          </FormField>

          <FormField label="Stakeholder name" error={errors.stakeholderName}>
            {(control) => (
              <Input
                {...control}
                className="h-10"
                placeholder="Any name"
                value={values.stakeholderName}
                onChange={(event) => set('stakeholderName', event.target.value)}
              />
            )}
          </FormField>

          <FormField label="Stakeholder type" error={errors.stakeholderTypeId}>
            {(control) => (
              <StakeholderTypeSelect
                {...control}
                className="h-10"
                value={values.stakeholderTypeId}
                onChange={(event) => set('stakeholderTypeId', event.target.value)}
              />
            )}
          </FormField>
        </div>

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button variant="outline" size="lg" onClick={handleReset} disabled={searching}>
            <RotateCcw aria-hidden />
            Reset
          </Button>
          <Button type="submit" size="lg" disabled={searching}>
            <Search aria-hidden />
            {searching ? 'Searching…' : 'Search'}
          </Button>
        </div>
      </form>

      <section aria-label="Search results" className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        {error !== null ? (
          <ErrorState title="Couldn't load the stakeholders" error={error} onRetry={() => void runSearch(applied)} />
        ) : stakeholders === null ? (
          <LoadingState label="Searching stakeholders…" />
        ) : stakeholders.length === 0 ? (
          filtered ? (
            <EmptyState
              title="No stakeholders match these filters"
              description="Try fewer or different filters."
              action={
                <Button variant="outline" onClick={handleReset}>
                  <RotateCcw aria-hidden />
                  Reset filters
                </Button>
              }
            />
          ) : (
            <EmptyState
              title="No stakeholders yet"
              description="Stakeholders you create show up here."
              action={
                <Link to="/people-and-profiles/stakeholders" className={buttonVariants()}>
                  <UserPlus aria-hidden />
                  Create stakeholder
                </Link>
              }
            />
          )
        ) : (
          <>
            <p role="status" className="border-b border-border px-5 py-3 text-sm text-muted-foreground">
              {filtered
                ? `${stakeholders.length} ${stakeholders.length === 1 ? 'stakeholder matches' : 'stakeholders match'} your search`
                : `${stakeholders.length} ${stakeholders.length === 1 ? 'stakeholder' : 'stakeholders'}`}
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-border bg-muted text-xs tracking-wide text-muted-foreground uppercase">
                  <tr>
                    <th scope="col" className="px-5 py-3 font-medium">Code</th>
                    <th scope="col" className="px-5 py-3 font-medium">Name</th>
                    <th scope="col" className="px-5 py-3 font-medium">Type</th>
                    <th scope="col" className="px-5 py-3 font-medium">Phone</th>
                    <th scope="col" className="px-5 py-3 font-medium">Email</th>
                    <th scope="col" className="px-5 py-3 font-medium">Tax no.</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {stakeholders.map((stakeholder) => (
                    <tr key={stakeholder.id} className="hover:bg-muted/50">
                      <td className="px-5 py-3 font-mono text-xs font-medium whitespace-nowrap">{stakeholder.stakeholderCode}</td>
                      <td className="px-5 py-3 font-medium">{stakeholder.stakeholderName}</td>
                      <td className="px-5 py-3">
                        <ul className="flex flex-wrap gap-1.5">
                          {stakeholder.stakeholderTypes.map((type) => (
                            <li key={type.id} className="rounded-full bg-accent px-2.5 py-0.5 text-xs font-medium text-accent-foreground">
                              {type.stakeholderTypeName}
                            </li>
                          ))}
                        </ul>
                      </td>
                      <td className="px-5 py-3 whitespace-nowrap text-muted-foreground">{stakeholder.phone ?? '—'}</td>
                      <td className="px-5 py-3 text-muted-foreground">{stakeholder.email ?? '—'}</td>
                      <td className="px-5 py-3 whitespace-nowrap text-muted-foreground">{stakeholder.taxNo ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
