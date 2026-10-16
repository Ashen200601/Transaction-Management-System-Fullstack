import { Save } from 'lucide-react';
import { useState, type FormEvent } from 'react';

import { Button } from '@/components/ui/button';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/toast';
import { UnitSelect } from '@/features/units/components/unit-select';
import { createItem } from '@/lib/api';
import { getErrorMessage, isApiError } from '@/lib/api/errors';
import { apiFieldErrors, issuesToFieldErrors } from '@/lib/form-errors';

import { itemFormSchema, type ItemFormInput } from '../schemas';

const EMPTY_FORM: ItemFormInput = {
  itemName: '',
  itemCode: '',
  description: '',
  price: '',
  unitId: '',
};

export function ItemCreatePage() {
  const [values, setValues] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isPending, setIsPending] = useState(false);
  const toast = useToast();

  const set = (key: keyof ItemFormInput, value: string) => setValues((previous) => ({ ...previous, [key]: value }));

  function clearForm() {
    setValues(EMPTY_FORM);
    setErrors({});
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const result = itemFormSchema.safeParse(values);
    if (!result.success) {
      setErrors(issuesToFieldErrors(result.error.issues));
      return;
    }
    setErrors({});
    setIsPending(true);
    try {
      const item = await createItem(result.data);
      clearForm();
      toast.success(`${item.itemName} (${item.itemCode}) was saved.`);
    } catch (caught) {
      // The server's message goes in a toast; field problems also show under their fields.
      toast.error(getErrorMessage(caught));
      if (isApiError(caught)) setErrors(apiFieldErrors(caught.fieldErrors));
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div className="grid gap-6">
      <form onSubmit={handleSubmit} noValidate className="grid gap-7 rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-8 lg:p-10 [&_label]:text-base">
        <div className="grid gap-7 md:grid-cols-2">
          <FormField label="Item name" error={errors.itemName}>
            {(control) => (
              <Input
                {...control}
                className="h-10"
                placeholder="Espresso Beans 1kg"
                value={values.itemName}
                onChange={(event) => set('itemName', event.target.value)}
                autoFocus
              />
            )}
          </FormField>

          <FormField label="Item code" error={errors.itemCode} hint="Unique in your business, e.g. ESP-1KG.">
            {(control) => (
              <Input
                {...control}
                className="h-10 uppercase"
                autoCapitalize="characters"
                spellCheck={false}
                placeholder="ESP-1KG"
                value={values.itemCode}
                onChange={(event) => set('itemCode', event.target.value)}
              />
            )}
          </FormField>
        </div>

        <FormField label="Description" error={errors.description} hint="Optional.">
          {(control) => (
            <Textarea
              {...control}
              rows={4}
              placeholder="Single-origin beans, medium roast."
              value={values.description}
              onChange={(event) => set('description', event.target.value)}
            />
          )}
        </FormField>

        <div className="grid gap-7 md:grid-cols-2">
          <FormField label="Price" error={errors.price}>
            {(control) => (
              <Input
                {...control}
                className="h-10"
                inputMode="decimal"
                placeholder="0.00"
                value={values.price}
                onChange={(event) => set('price', event.target.value)}
              />
            )}
          </FormField>

          <FormField label="Unit" error={errors.unitId}>
            {(control) => (
              <UnitSelect
                {...control}
                className="h-10"
                placeholder="Choose a unit"
                value={values.unitId}
                onChange={(event) => set('unitId', event.target.value)}
              />
            )}
          </FormField>
        </div>

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button variant="outline" size="lg" onClick={clearForm} disabled={isPending}>
            Clear
          </Button>
          <Button type="submit" size="lg" disabled={isPending}>
            <Save aria-hidden />
            {isPending ? 'Saving…' : 'Save item'}
          </Button>
        </div>
      </form>
    </div>
  );
}
