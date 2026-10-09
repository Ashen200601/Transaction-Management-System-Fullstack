import { describe, expect, it } from 'vitest';

import { act, currentLocation, renderHookWithProviders } from '@/test/test-utils';

import { usePageParam } from './use-page-param';

function renderPageParam(route: string) {
  return renderHookWithProviders(() => usePageParam(), { route });
}

describe('usePageParam', () => {
  it('defaults to page 1', () => {
    const { result } = renderPageParam('/transactions');
    expect(result.current[0]).toBe(1);
  });

  it('reads the page from the URL', () => {
    const { result } = renderPageParam('/transactions?page=3');
    expect(result.current[0]).toBe(3);
  });

  it.each(['0', '-2', 'abc', '1.5', ''])('falls back to page 1 for "%s"', (value) => {
    const { result } = renderPageParam(`/transactions?page=${value}`);
    expect(result.current[0]).toBe(1);
  });

  it('writes the page to the URL and keeps other params', () => {
    const { result } = renderPageParam('/transactions?status=voided');

    act(() => result.current[1](4));

    expect(result.current[0]).toBe(4);
    const location = currentLocation();
    expect(location.pathname).toBe('/transactions');
    expect(location.searchParams.get('status')).toBe('voided');
    expect(location.searchParams.get('page')).toBe('4');
  });

  it('drops the param when going back to page 1', () => {
    const { result } = renderPageParam('/transactions?page=3&status=voided');

    act(() => result.current[1](1));

    expect(currentLocation().search).toBe('?status=voided');
  });
});
