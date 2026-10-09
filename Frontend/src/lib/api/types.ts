export interface Paginated<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

/** Query string values. Empty strings, null and undefined are left out of the URL. */
export type QueryParams = Record<string, string | number | boolean | null | undefined>;
