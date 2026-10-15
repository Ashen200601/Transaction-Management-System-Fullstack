import { PlusCircle, RotateCcw, Search } from 'lucide-react';
import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router';

import { EmptyState, ErrorState, LoadingState } from '@/components/common/states';
import { Button, buttonVariants } from '@/components/ui/button';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { NativeSelect } from '@/components/ui/native-select';
import { useToast } from '@/components/ui/toast';
import { listItems } from '@/lib/api';
import { getErrorMessage, isApiError } from '@/lib/api/errors';
import { apiFieldErrors, issuesToFieldErrors } from '@/lib/form-errors';

import { itemSearchSchema, type ItemSearchInput, type ItemSearchValues } from '../schemas';
import { ITEM_UNITS, type Item } from '../types';

const EMPTY_SEARCH: ItemSearchInput = { itemCode: '', itemName: '', unit: '', minPrice: '', maxPrice: '' };

/** 2550 → "25.50" */
function formatPrice(cents: number) {
  return (cents / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function unitLabel(unit: string) {
  return ITEM_UNITS.find((option) => option.value === unit)?.label ?? unit;
}

function hasFilters(search: Partial<ItemSearchValues>) {
  return Object.values(search).some((value) => value !== undefined && value !== '');
}

export function ItemListPage() {
  const toast = useToast();
  const [values, setValues] = useState(EMPTY_SEARCH);
  const [errors, setErrors] = useState<Record<string, string>>({});
  /** The filters of the search on screen, so "Try again" repeats it. */
  const [applied, setApplied] = useState<Partial<ItemSearchValues>>({});
  const [items, setItems] = useState<Item[] | null>(null);
  const [error, setError] = useState<unknown>(null);

  const runSearch = useCallback(
    async (search: Partial<ItemSearchValues>) => {
      setApplied(search);
      setError(null);
      setItems(null);
      try {
        setItems(await listItems(search));
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

  const set = (key: keyof ItemSearchInput, value: string) => setValues((previous) => ({ ...previous, [key]: value }));

  function handleSearch(event: FormEvent) {
    event.preventDefault();
    const result = itemSearchSchema.safeParse(values);
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
  const searching = items === null && error === null;

  return (
    <div className="grid gap-6">
      <form
        role="search"
        aria-label="Search items"
        onSubmit={handleSearch}
        noValidate
        className="grid gap-5 rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6"
      >
        <h2 className="text-base font-semibold">Search items</h2>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
          <FormField label="Item code" error={errors.itemCode}>
            {(control) => (
              <Input
                {...control}
                className="h-11 uppercase placeholder:normal-case"
                autoCapitalize="characters"
                spellCheck={false}
                placeholder="Any code"
                value={values.itemCode}
                onChange={(event) => set('itemCode', event.target.value)}
              />
            )}
          </FormField>

          <FormField label="Item name" error={errors.itemName}>
            {(control) => (
              <Input
                {...control}
                className="h-11"
                placeholder="Any name"
                value={values.itemName}
                onChange={(event) => set('itemName', event.target.value)}
              />
            )}
          </FormField>

          <FormField label="Unit" error={errors.unit}>
            {(control) => (
              <NativeSelect
                {...control}
                className="h-11"
                value={values.unit}
                onChange={(event) => set('unit', event.target.value)}
              >
                <option value="">Any unit</option>
                {ITEM_UNITS.map((unit) => (
                  <option key={unit.value} value={unit.value}>
                    {unit.label}
                  </option>
                ))}
              </NativeSelect>
            )}
          </FormField>

          <FormField label="Price from" error={errors.minPrice}>
            {(control) => (
              <Input
                {...control}
                className="h-11"
                inputMode="decimal"
                placeholder="0.00"
                value={values.minPrice}
                onChange={(event) => set('minPrice', event.target.value)}
              />
            )}
          </FormField>

          <FormField label="Price to" error={errors.maxPrice}>
            {(control) => (
              <Input
                {...control}
                className="h-11"
                inputMode="decimal"
                placeholder="No limit"
                value={values.maxPrice}
                onChange={(event) => set('maxPrice', event.target.value)}
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
          <ErrorState title="Couldn't load the items" error={error} onRetry={() => void runSearch(applied)} />
        ) : items === null ? (
          <LoadingState label="Searching items…" />
        ) : items.length === 0 ? (
          filtered ? (
            <EmptyState
              title="No items match these filters"
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
              title="No items yet"
              description="Items you create show up here."
              action={
                <Link to="/items" className={buttonVariants()}>
                  <PlusCircle aria-hidden />
                  Create item
                </Link>
              }
            />
          )
        ) : (
          <>
            <p role="status" className="border-b border-border px-5 py-3 text-sm text-muted-foreground">
              {filtered
                ? `${items.length} ${items.length === 1 ? 'item matches' : 'items match'} your search`
                : `${items.length} ${items.length === 1 ? 'item' : 'items'}`}
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-border bg-muted text-xs tracking-wide text-muted-foreground uppercase">
                  <tr>
                    <th scope="col" className="px-5 py-3 font-medium">Code</th>
                    <th scope="col" className="px-5 py-3 font-medium">Name</th>
                    <th scope="col" className="px-5 py-3 font-medium">Description</th>
                    <th scope="col" className="px-5 py-3 font-medium">Unit</th>
                    <th scope="col" className="px-5 py-3 text-right font-medium">Price</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {items.map((item) => (
                    <tr key={item.id} className="hover:bg-muted/50">
                      <td className="px-5 py-3 font-mono text-xs font-medium whitespace-nowrap">{item.itemCode}</td>
                      <td className="px-5 py-3 font-medium">{item.itemName}</td>
                      <td className="max-w-md px-5 py-3 text-muted-foreground">{item.description ?? '—'}</td>
                      <td className="px-5 py-3 whitespace-nowrap">{unitLabel(item.unit)}</td>
                      <td className="px-5 py-3 text-right tabular-nums whitespace-nowrap">{formatPrice(item.price)}</td>
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
