import { Save } from 'lucide-react';
import { useState, type FormEvent } from 'react';

import { Button } from '@/components/ui/button';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/toast';
import { createStakeholder } from '@/lib/api';
import { getErrorMessage, isApiError } from '@/lib/api/errors';
import { apiFieldErrors, issuesToFieldErrors } from '@/lib/form-errors';

import { StakeholderTypeCheckboxes } from '../components/stakeholder-type-checkboxes';
import { stakeholderFormSchema, type StakeholderFormInput } from '../schemas';

const EMPTY_FORM: StakeholderFormInput = {
  stakeholderTypeIds: [],
  stakeholderCode: '',
  stakeholderName: '',
  phone: '',
  email: '',
  address: '',
  taxNo: '',
};

type TextField = Exclude<keyof StakeholderFormInput, 'stakeholderTypeIds'>;

export function StakeholderCreatePage() {
  const [values, setValues] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isPending, setIsPending] = useState(false);
  const toast = useToast();

  const set = (key: TextField, value: string) => setValues((previous) => ({ ...previous, [key]: value }));

  function clearForm() {
    setValues(EMPTY_FORM);
    setErrors({});
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const result = stakeholderFormSchema.safeParse(values);
    if (!result.success) {
      setErrors(issuesToFieldErrors(result.error.issues));
      return;
    }
    setErrors({});
    setIsPending(true);
    try {
      const stakeholder = await createStakeholder(result.data);
      clearForm();
      toast.success(`${stakeholder.stakeholderName} (${stakeholder.stakeholderCode}) was saved.`);
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
        {/* Header: what part the stakeholder plays. */}
        <div className="border-b border-border pb-7">
          <StakeholderTypeCheckboxes
            value={values.stakeholderTypeIds}
            onChange={(stakeholderTypeIds) => setValues((previous) => ({ ...previous, stakeholderTypeIds }))}
            error={errors.stakeholderTypeIds}
          />
        </div>

        <div className="grid gap-7 md:grid-cols-2">
          <FormField label="Stakeholder code" error={errors.stakeholderCode} hint="Unique in your business, e.g. ABC-TRADERS.">
            {(control) => (
              <Input
                {...control}
                className="h-10 uppercase"
                autoCapitalize="characters"
                spellCheck={false}
                placeholder="ABC-TRADERS"
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
                placeholder="ABC Traders (Pvt) Ltd"
                value={values.stakeholderName}
                onChange={(event) => set('stakeholderName', event.target.value)}
              />
            )}
          </FormField>
        </div>

        <div className="grid gap-7 md:grid-cols-3">
          <FormField label="Phone" error={errors.phone} hint="Optional.">
            {(control) => (
              <Input
                {...control}
                className="h-10"
                type="tel"
                inputMode="tel"
                placeholder="+94 77 123 4567"
                value={values.phone}
                onChange={(event) => set('phone', event.target.value)}
              />
            )}
          </FormField>

          <FormField label="Email" error={errors.email} hint="Optional.">
            {(control) => (
              <Input
                {...control}
                className="h-10"
                type="email"
                inputMode="email"
                spellCheck={false}
                placeholder="accounts@abctraders.com"
                value={values.email}
                onChange={(event) => set('email', event.target.value)}
              />
            )}
          </FormField>

          <FormField label="Tax / registration no." error={errors.taxNo} hint="Optional. VAT or business registration number.">
            {(control) => (
              <Input
                {...control}
                className="h-10"
                spellCheck={false}
                placeholder="PV 12345"
                value={values.taxNo}
                onChange={(event) => set('taxNo', event.target.value)}
              />
            )}
          </FormField>
        </div>

        <FormField label="Address" error={errors.address} hint="Optional.">
          {(control) => (
            <Textarea
              {...control}
              rows={3}
              placeholder="No. 12, Main Street, Colombo 03"
              value={values.address}
              onChange={(event) => set('address', event.target.value)}
            />
          )}
        </FormField>

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button variant="outline" size="lg" onClick={clearForm} disabled={isPending}>
            Clear
          </Button>
          <Button type="submit" size="lg" disabled={isPending}>
            <Save aria-hidden />
            {isPending ? 'Saving…' : 'Save stakeholder'}
          </Button>
        </div>
      </form>
    </div>
  );
}
