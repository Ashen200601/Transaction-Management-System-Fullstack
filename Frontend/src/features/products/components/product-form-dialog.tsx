import { useState, type FormEvent } from 'react';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { getErrorMessage, isApiError } from '@/lib/api/errors';
import { apiFieldErrors, issuesToFieldErrors } from '@/lib/form-errors';
import { toDecimalInput } from '@/lib/money';

import { useSaveProduct } from '../api';
import { productFormSchema, type ProductFormInput } from '../schemas';
import type { Product } from '../types';

interface ProductFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Edit this product; omit to create a new one. */
  product?: Product;
}

export function ProductFormDialog({ open, onOpenChange, product }: ProductFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <ProductForm product={product} onClose={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}

function toFormInput(product?: Product): ProductFormInput {
  return {
    name: product?.name ?? '',
    sku: product?.sku ?? '',
    price: toDecimalInput(product?.price),
    cost: toDecimalInput(product?.cost),
    reorderLevel: String(product?.reorderLevel ?? 0),
    active: product?.active ?? true,
  };
}

function ProductForm({ product, onClose }: { product?: Product; onClose: () => void }) {
  const [values, setValues] = useState(() => toFormInput(product));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const save = useSaveProduct(product?.id);

  const set = <K extends keyof ProductFormInput>(key: K, value: ProductFormInput[K]) =>
    setValues((previous) => ({ ...previous, [key]: value }));

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const result = productFormSchema.safeParse(values);
    if (!result.success) {
      setErrors(issuesToFieldErrors(result.error.issues));
      return;
    }
    setErrors({});
    save.mutate(result.data, {
      onSuccess: onClose,
      onError: (error) => {
        if (isApiError(error)) setErrors(apiFieldErrors(error.fieldErrors));
      },
    });
  }

  const showGeneralError = save.isError && !(isApiError(save.error) && Object.keys(save.error.fieldErrors).length > 0);

  return (
    <form onSubmit={handleSubmit} noValidate className="grid gap-4">
      <DialogHeader>
        <DialogTitle>{product ? 'Edit product' : 'Add product'}</DialogTitle>
        <DialogDescription>Prices are in the business currency.</DialogDescription>
      </DialogHeader>

      <FormField label="Name" error={errors.name}>
        {(control) => (
          <Input {...control} value={values.name} onChange={(event) => set('name', event.target.value)} autoFocus />
        )}
      </FormField>

      <FormField label="SKU" error={errors.sku} hint="Your stock code, e.g. ESP-1KG.">
        {(control) => (
          <Input
            {...control}
            value={values.sku}
            autoCapitalize="characters"
            onChange={(event) => set('sku', event.target.value)}
          />
        )}
      </FormField>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Price" error={errors.price}>
          {(control) => (
            <Input
              {...control}
              inputMode="decimal"
              placeholder="0.00"
              value={values.price}
              onChange={(event) => set('price', event.target.value)}
            />
          )}
        </FormField>
        <FormField label="Cost price" error={errors.cost} hint="Optional. Used for margins.">
          {(control) => (
            <Input
              {...control}
              inputMode="decimal"
              placeholder="0.00"
              value={values.cost}
              onChange={(event) => set('cost', event.target.value)}
            />
          )}
        </FormField>
      </div>

      <FormField label="Reorder level" error={errors.reorderLevel} hint="Stock at or below this is flagged as low.">
        {(control) => (
          <Input
            {...control}
            inputMode="numeric"
            value={values.reorderLevel}
            onChange={(event) => set('reorderLevel', event.target.value)}
          />
        )}
      </FormField>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          className="size-4 accent-primary"
          checked={values.active}
          onChange={(event) => set('active', event.target.checked)}
        />
        Available for sale
      </label>

      {showGeneralError && (
        <p role="alert" className="text-sm text-destructive">
          {getErrorMessage(save.error)}
        </p>
      )}

      <DialogFooter>
        <Button variant="outline" onClick={onClose} disabled={save.isPending}>
          Cancel
        </Button>
        <Button type="submit" disabled={save.isPending}>
          {save.isPending ? 'Saving…' : 'Save product'}
        </Button>
      </DialogFooter>
    </form>
  );
}
