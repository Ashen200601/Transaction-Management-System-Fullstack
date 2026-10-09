// Money is stored and calculated as integer minor units (cents). Decimal
// amounts only exist at the edges: form input and display.

const DECIMAL_PATTERN = /^-?\d+(\.\d+)?$/;

/** Rounds to the nearest integer, halves away from zero, and never returns -0. */
function roundHalfAwayFromZero(value: number) {
  // toPrecision absorbs binary floating-point noise such as 100.49999999999999.
  const cleaned = Number(value.toPrecision(15));
  return Math.sign(cleaned) * Math.round(Math.abs(cleaned)) || 0;
}

export function toMinorUnits(amount: number | string): number {
  const value = typeof amount === 'string' ? (DECIMAL_PATTERN.test(amount.trim()) ? Number(amount) : Number.NaN) : amount;
  if (!Number.isFinite(value)) {
    throw new RangeError(`Invalid money amount: ${String(amount)}`);
  }
  return roundHalfAwayFromZero(value * 100);
}

export function fromMinorUnits(minor: number): number {
  return minor / 100;
}

const formatters = new Map<string, Intl.NumberFormat>();

export function formatMoney(minor: number, currency: string, locale = 'en-US'): string {
  const key = `${locale}|${currency}`;
  let formatter = formatters.get(key);
  if (!formatter) {
    formatter = new Intl.NumberFormat(locale, { style: 'currency', currency });
    formatters.set(key, formatter);
  }
  return formatter.format(fromMinorUnits(minor));
}

/** Formats minor units as a plain decimal for form inputs, e.g. 2500 → "25.00". */
export function toDecimalInput(minor: number | null | undefined): string {
  return minor == null ? '' : (minor / 100).toFixed(2);
}

export function sumMinorUnits(values: readonly number[]): number {
  return values.reduce((sum, value) => {
    if (!Number.isInteger(value)) {
      throw new RangeError(`Minor units must be whole numbers, got ${value}`);
    }
    return sum + value;
  }, 0);
}

/** `ratePercent`% of `amount`, rounded to whole minor units (half away from zero). */
export function percentageOf(amount: number, ratePercent: number): number {
  return roundHalfAwayFromZero((amount * ratePercent) / 100);
}
