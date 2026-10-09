import { useCallback } from 'react';
import { useSearchParams } from 'react-router';

function parsePage(value: string | null) {
  return value && /^\d+$/.test(value) && Number(value) >= 1 ? Number(value) : 1;
}

/** The current page, kept in the `?page=` URL param so it survives reloads and links. */
export function usePageParam(): [number, (page: number) => void] {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = parsePage(searchParams.get('page'));

  const setPage = useCallback(
    (next: number) => {
      setSearchParams((previous) => {
        const params = new URLSearchParams(previous);
        if (next <= 1) params.delete('page');
        else params.set('page', String(next));
        return params;
      });
    },
    [setSearchParams],
  );

  return [page, setPage];
}
