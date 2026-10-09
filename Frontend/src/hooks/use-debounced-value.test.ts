import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useDebouncedValue } from './use-debounced-value';

describe('useDebouncedValue', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns the initial value straight away', () => {
    const { result } = renderHook(() => useDebouncedValue('coffee', 300));
    expect(result.current).toBe('coffee');
  });

  it('updates only after the value has been stable for the delay', () => {
    const { result, rerender } = renderHook(({ value }) => useDebouncedValue(value, 300), {
      initialProps: { value: 'c' },
    });

    rerender({ value: 'co' });
    act(() => vi.advanceTimersByTime(299));
    expect(result.current).toBe('c');

    act(() => vi.advanceTimersByTime(1));
    expect(result.current).toBe('co');
  });

  it('restarts the delay on every change', () => {
    const { result, rerender } = renderHook(({ value }) => useDebouncedValue(value, 300), {
      initialProps: { value: 'c' },
    });

    rerender({ value: 'co' });
    act(() => vi.advanceTimersByTime(200));
    rerender({ value: 'cof' });
    act(() => vi.advanceTimersByTime(200));
    expect(result.current).toBe('c');

    act(() => vi.advanceTimersByTime(100));
    expect(result.current).toBe('cof');
  });
});
