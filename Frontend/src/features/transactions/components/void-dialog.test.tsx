import { describe, expect, it, vi } from 'vitest';

import { renderWithProviders, screen } from '@/test/test-utils';

import { VoidTransactionDialog } from './void-dialog';

function renderDialog({ isPending = false } = {}) {
  const onConfirm = vi.fn(async (_reason: string) => {});
  const onOpenChange = vi.fn();
  const view = renderWithProviders(
    <VoidTransactionDialog
      open
      reference="TXN-000042"
      isPending={isPending}
      onConfirm={onConfirm}
      onOpenChange={onOpenChange}
    />,
  );
  return { ...view, onConfirm, onOpenChange };
}

describe('VoidTransactionDialog', () => {
  it('names the transaction being voided', () => {
    renderDialog();
    expect(screen.getByRole('dialog')).toHaveTextContent('TXN-000042');
  });

  it('requires a reason before voiding', async () => {
    const { user, onConfirm } = renderDialog();

    await user.click(screen.getByRole('button', { name: /void transaction/i }));

    expect(screen.getByRole('textbox', { name: /reason/i })).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByText(/enter a reason/i)).toBeInTheDocument();
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('confirms with the trimmed reason', async () => {
    const { user, onConfirm } = renderDialog();

    await user.type(screen.getByRole('textbox', { name: /reason/i }), '  Duplicate sale  ');
    await user.click(screen.getByRole('button', { name: /void transaction/i }));

    expect(onConfirm).toHaveBeenCalledWith('Duplicate sale');
  });

  it('closes without voiding on cancel', async () => {
    const { user, onConfirm, onOpenChange } = renderDialog();

    await user.click(screen.getByRole('button', { name: /cancel/i }));

    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('blocks a second submit while the void is in progress', () => {
    renderDialog({ isPending: true });
    expect(screen.getByRole('button', { name: /voiding/i })).toBeDisabled();
  });
});
