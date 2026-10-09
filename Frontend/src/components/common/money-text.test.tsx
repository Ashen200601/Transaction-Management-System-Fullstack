import { describe, expect, it } from 'vitest';

import { render, screen } from '@/test/test-utils';

import { MoneyText } from './money-text';

describe('MoneyText', () => {
  it('formats minor units as currency', () => {
    render(<MoneyText amount={275050} currency="USD" />);
    expect(screen.getByText('$2,750.50')).toBeInTheDocument();
  });

  it('formats negative amounts', () => {
    render(<MoneyText amount={-1250} currency="USD" />);
    expect(screen.getByText('-$12.50')).toBeInTheDocument();
  });

  it('uses tabular figures so columns of amounts line up', () => {
    render(<MoneyText amount={100} currency="USD" />);
    expect(screen.getByText('$1.00')).toHaveClass('tabular-nums');
  });
});
