/** Query string values. Empty strings, null and undefined are left out of the URL. */
export type QueryParams = Record<string, string | number | boolean | null | undefined>;
