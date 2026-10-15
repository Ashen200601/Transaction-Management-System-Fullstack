import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { Button } from './button';
import { ToastProvider, useToast } from './toast';

function Triggers() {
  const toast = useToast();
  return (
    <>
      <Button onClick={() => toast.success('Item saved.')}>Succeed</Button>
      <Button onClick={() => toast.error('Another item already uses this code.')}>Fail</Button>
    </>
  );
}

function renderToasts() {
  render(
    <ToastProvider>
      <Triggers />
    </ToastProvider>,
  );
}

describe('toasts', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('shows a success message in green and an error in red', async () => {
    const user = userEvent.setup();
    renderToasts();

    await user.click(screen.getByRole('button', { name: 'Succeed' }));
    await user.click(screen.getByRole('button', { name: 'Fail' }));

    expect(screen.getByRole('status')).toHaveTextContent('Item saved.');
    expect(screen.getByRole('status')).toHaveClass('bg-success');
    expect(screen.getByRole('alert')).toHaveTextContent('Another item already uses this code.');
    expect(screen.getByRole('alert')).toHaveClass('bg-destructive');
  });

  it('closes when the close button is pressed', async () => {
    const user = userEvent.setup();
    renderToasts();

    await user.click(screen.getByRole('button', { name: 'Succeed' }));
    await user.click(screen.getByRole('button', { name: 'Close' }));

    expect(screen.getByRole('status')).toHaveClass('animate-toast-out');
    await vi.waitFor(() => expect(screen.queryByRole('status')).not.toBeInTheDocument());
  });

  it('closes on its own, success after 4 seconds and errors after 7', () => {
    vi.useFakeTimers();
    renderToasts();

    act(() => screen.getByRole('button', { name: 'Succeed' }).click());
    act(() => screen.getByRole('button', { name: 'Fail' }).click());

    act(() => vi.advanceTimersByTime(4300));
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(screen.getByRole('alert')).toBeInTheDocument();

    act(() => vi.advanceTimersByTime(3000));
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
