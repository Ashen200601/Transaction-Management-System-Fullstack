import { describe, expect, it, vi } from 'vitest';

import { ApiError } from '@/lib/api/errors';
import { render, screen, userEvent } from '@/test/test-utils';

import { EmptyState, ErrorState, LoadingState } from './states';

describe('LoadingState', () => {
  it('announces loading to assistive technology', () => {
    render(<LoadingState label="Loading transactions" />);
    expect(screen.getByRole('status')).toHaveTextContent('Loading transactions');
  });
});

describe('EmptyState', () => {
  it('shows a title, description and optional action', () => {
    render(
      <EmptyState
        title="No transactions yet"
        description="Sales you record will appear here."
        action={<button type="button">New transaction</button>}
      />,
    );

    expect(screen.getByRole('heading', { name: 'No transactions yet' })).toBeInTheDocument();
    expect(screen.getByText('Sales you record will appear here.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'New transaction' })).toBeInTheDocument();
  });
});

describe('ErrorState', () => {
  it('shows the error message in an alert', () => {
    render(<ErrorState error={new Error('Server unavailable')} />);
    expect(screen.getByRole('alert')).toHaveTextContent('Server unavailable');
  });

  it('uses friendly wording for API errors', () => {
    render(<ErrorState error={new ApiError({ status: 0, code: 'NETWORK_ERROR', message: 'Failed to fetch' })} />);
    expect(screen.getByRole('alert')).toHaveTextContent('Unable to reach the server');
  });

  it('offers a retry when a handler is given', async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();
    render(<ErrorState error={new Error('Server unavailable')} onRetry={onRetry} />);

    await user.click(screen.getByRole('button', { name: /try again/i }));

    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('hides the retry button without a handler', () => {
    render(<ErrorState error={new Error('Server unavailable')} />);
    expect(screen.queryByRole('button', { name: /try again/i })).not.toBeInTheDocument();
  });
});
