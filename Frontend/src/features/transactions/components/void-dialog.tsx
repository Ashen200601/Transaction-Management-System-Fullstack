import { useState, type FormEvent } from 'react';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { FormField } from '@/components/ui/form-field';
import { Textarea } from '@/components/ui/textarea';
import { getErrorMessage } from '@/lib/api/errors';

import { voidTransactionSchema } from '../schemas';

interface VoidTransactionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Shown so the user knows exactly which transaction they are voiding. */
  reference: string;
  onConfirm: (reason: string) => Promise<void> | void;
  isPending?: boolean;
  /** A failed void, shown inside the dialog. */
  error?: unknown;
}

export function VoidTransactionDialog({ open, onOpenChange, ...formProps }: VoidTransactionDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <VoidForm {...formProps} onCancel={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}

function VoidForm({
  reference,
  onConfirm,
  onCancel,
  isPending = false,
  error,
}: Omit<VoidTransactionDialogProps, 'open' | 'onOpenChange'> & { onCancel: () => void }) {
  const [reason, setReason] = useState('');
  const [reasonError, setReasonError] = useState<string>();

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const result = voidTransactionSchema.safeParse({ reason });
    if (!result.success) {
      setReasonError(result.error.issues[0]?.message);
      return;
    }
    setReasonError(undefined);
    try {
      await onConfirm(result.data.reason);
    } catch {
      // The parent passes the failure back in through `error`.
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4" noValidate>
      <DialogHeader>
        <DialogTitle>Void transaction</DialogTitle>
        <DialogDescription>
          {reference} will be marked as voided and its stock returned. This can&apos;t be undone.
        </DialogDescription>
      </DialogHeader>

      <FormField label="Reason" error={reasonError} hint="Recorded on the transaction for the audit trail.">
        {(control) => (
          <Textarea {...control} value={reason} maxLength={250} onChange={(event) => setReason(event.target.value)} />
        )}
      </FormField>

      {error != null && (
        <p role="alert" className="text-sm text-destructive">
          {getErrorMessage(error)}
        </p>
      )}

      <DialogFooter>
        <Button variant="outline" onClick={onCancel} disabled={isPending}>
          Cancel
        </Button>
        <Button type="submit" variant="destructive" disabled={isPending}>
          {isPending ? 'Voiding…' : 'Void transaction'}
        </Button>
      </DialogFooter>
    </form>
  );
}
