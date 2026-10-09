import { describe, expect, it } from 'vitest';

import { render, screen } from '@/test/test-utils';

import { StatTile } from './stat-tile';

describe('StatTile', () => {
  it('shows the label and value', () => {
    render(<StatTile label="Sales today" value="$1,250.00" />);

    expect(screen.getByText('Sales today')).toBeInTheDocument();
    expect(screen.getByText('$1,250.00')).toBeInTheDocument();
  });

  it.each([
    [0.125, '+12.5%'],
    [-0.04, '-4.0%'],
    [0, '0.0%'],
  ])('shows a change of %s as %s', (change, text) => {
    render(<StatTile label="Sales today" value="$1,250.00" change={change} />);
    expect(screen.getByText(text)).toBeInTheDocument();
  });

  it('leaves out the change when there is none', () => {
    render(<StatTile label="Sales today" value="$1,250.00" />);
    expect(screen.queryByText(/%/)).not.toBeInTheDocument();
  });
});
