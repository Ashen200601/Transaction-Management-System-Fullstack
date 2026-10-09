import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ACTIVE_BUSINESS_STORAGE_KEY, activeBusinessStore } from './active-business-store';

describe('activeBusinessStore', () => {
  beforeEach(() => {
    activeBusinessStore.clear();
  });

  it('has no active business by default', () => {
    expect(activeBusinessStore.get()).toBeNull();
  });

  it('persists the selected business', () => {
    activeBusinessStore.set('biz_0001');

    expect(activeBusinessStore.get()).toBe('biz_0001');
    expect(localStorage.getItem(ACTIVE_BUSINESS_STORAGE_KEY)).toBe('biz_0001');
  });

  it('reads a selection saved in an earlier session', () => {
    localStorage.setItem(ACTIVE_BUSINESS_STORAGE_KEY, 'biz_0042');
    expect(activeBusinessStore.get()).toBe('biz_0042');
  });

  it('clears the selection', () => {
    activeBusinessStore.set('biz_0001');
    activeBusinessStore.clear();

    expect(activeBusinessStore.get()).toBeNull();
    expect(localStorage.getItem(ACTIVE_BUSINESS_STORAGE_KEY)).toBeNull();
  });

  it('notifies subscribers until they unsubscribe', () => {
    const listener = vi.fn();
    const unsubscribe = activeBusinessStore.subscribe(listener);

    activeBusinessStore.set('biz_0001');
    activeBusinessStore.clear();
    unsubscribe();
    activeBusinessStore.set('biz_0002');

    expect(listener.mock.calls).toEqual([['biz_0001'], [null]]);
  });

  it('treats blocked storage as "no selection" instead of crashing', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new DOMException('Storage is disabled', 'SecurityError');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('Storage is disabled', 'SecurityError');
    });

    expect(activeBusinessStore.get()).toBeNull();
    expect(() => activeBusinessStore.set('biz_0001')).not.toThrow();
  });
});
