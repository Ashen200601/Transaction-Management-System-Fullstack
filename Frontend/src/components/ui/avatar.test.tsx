import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Avatar, initialsOf } from './avatar';

describe('Avatar', () => {
  it.each([
    ['Jane Perera', 'JP'],
    ['jane', 'J'],
    ['  Jane   Anne Perera ', 'JP'],
    ['', '?'],
  ])('uses "%s" → "%s" as initials', (name, initials) => {
    expect(initialsOf(name)).toBe(initials);
  });

  it('shows the initials until there is a photo, then the photo', () => {
    const { container, rerender } = render(<Avatar name="Jane Perera" />);
    expect(container).toHaveTextContent('JP');
    expect(container.querySelector('img')).toBeNull();

    rerender(<Avatar name="Jane Perera" imageUrl="/photos/jane.jpg" />);
    expect(container.querySelector('img')).toHaveAttribute('src', '/photos/jane.jpg');
    expect(container).not.toHaveTextContent('JP');
  });
});
