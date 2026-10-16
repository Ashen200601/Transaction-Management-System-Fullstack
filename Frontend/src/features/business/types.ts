export interface Business {
  id: string;
  name: string;
  /** ISO 4217 code, e.g. USD. Prices are in its minor units. */
  currency: string;
}
