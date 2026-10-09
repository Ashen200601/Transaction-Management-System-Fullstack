import { useState, type FormEvent } from 'react';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { getErrorMessage } from '@/lib/api/errors';
import { issuesToFieldErrors } from '@/lib/form-errors';

import { useAdjustStock } from '../api';
import type { InventoryItem } from '../types';

const adjustmentSchema = z.object({
  change: z
    .string()
    .trim()
    .regex(/^[+-]?\d+$/, 'Enter a whole number, e.g. 12 or -3')
    .transform(Number)
    .refine((value) => value !== 0, 'Enter a change other than 0'),
  reason: z.string().trim().min(1, 'Say why the stock changed').max(200),
});

interface AdjustStockDialogProps {
  item: InventoryItem | null;
  onOpenChange: (open: boolean) => void;
}

export function AdjustStockDialog({ item, onOpenChange }: AdjustStockDialogProps) {
  return (
    <Dialog open={item !== null} onOpenChange={onOpenChange}>
      <DialogContent>{item && <AdjustForm item={item} onClose={() => onOpenChange(false)} />}</DialogContent>
    </Dialog>
  );
}

function AdjustForm({ item, onClose }: { item: InventoryItem; onClose: () => void }) {
  const [change, setChange] = useState('');
  const [reason, setReason] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const adjust = useAdjustStock(item.productId);

  const parsedChange = /^[+-]?\d+$/.test(change.trim()) ? Number(change) : 0;

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const result = adjustmentSchema.safeParse({ change, reason });
    if (!result.success) {
      setErrors(issuesToFieldErrors(result.error.issues));
      return;
    }
    setErrors({});
    adjust.mutate(result.data, { onSuccess: onClose });
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="grid gap-4">
      <DialogHeader>
        <DialogTitle>Adjust stock</DialogTitle>
        <DialogDescription>
          {item.productName} · {item.onHand} on hand
        </DialogDescription>
      </DialogHeader>

      <FormField
        label="Change"
        error={errors.change}
        hint={parsedChange ? `New stock level: ${item.onHand + parsedChange}` : 'Use a minus sign to remove stock.'}
      >
        {(control) => (
          <Input {...control} inputMode="numeric" placeholder="e.g. 12 or -3" value={change} onChange={(event) => setChange(event.target.value)} />
        )}
      </FormField>

      <FormField label="Reason" error={errors.reason}>
        {(control) => (
          <Input
            {...control}
            placeholder="Delivery received, damaged, stock count…"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
          />
        )}
      </FormField>

      {adjust.isError && (
        <p role="alert" className="text-sm text-destructive">
          {getErrorMessage(adjust.error)}
        </p>
      )}

      <DialogFooter>
        <Button variant="outline" onClick={onClose} disabled={adjust.isPending}>
          Cancel
        </Button>
        <Button type="submit" disabled={adjust.isPending}>
          {adjust.isPending ? 'Saving…' : 'Save adjustment'}
        </Button>
      </DialogFooter>
    </form>
  );
}
