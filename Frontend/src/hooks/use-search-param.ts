import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router';

import { useDebouncedValue } from './use-debounced-value';

/**
 * A search box backed by a URL param. The input updates immediately; the URL
 * (and therefore the query) follows once typing pauses, and goes back to page 1.
 */
export function useSearchParam(key = 'search', delayMs = 300) {
  const [searchParams, setSearchParams] = useSearchParams();
  const applied = searchParams.get(key) ?? '';
  const [input, setInput] = useState(applied);
  const debounced = useDebouncedValue(input.trim(), delayMs);
  const lastSynced = useRef(applied);

  // Typing: push the settled value into the URL.
  useEffect(() => {
    if (debounced === lastSynced.current) return;
    lastSynced.current = debounced;
    setSearchParams(
      (previous) => {
        const params = new URLSearchParams(previous);
        if (debounced) params.set(key, debounced);
        else params.delete(key);
        params.delete('page');
        return params;
      },
      { replace: true },
    );
  }, [debounced, key, setSearchParams]);

  // Back/forward or a link changed the URL: show that search in the box.
  useEffect(() => {
    if (applied === lastSynced.current) return;
    lastSynced.current = applied;
    setInput(applied);
  }, [applied]);

  return { input, setInput, search: applied };
}
