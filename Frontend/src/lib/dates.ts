interface FormatOptions {
  timeZone?: string;
  locale?: string;
}

function toValidDate(value: string | Date | null | undefined) {
  if (value == null || value === '') return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** "Mar 5, 2026". Empty string for missing or invalid input. */
export function formatDate(value: string | Date | null | undefined, { timeZone, locale = 'en-US' }: FormatOptions = {}) {
  const date = toValidDate(value);
  return date ? new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeZone }).format(date) : '';
}

/** "Mar 5, 2026, 10:00 AM". Empty string for missing or invalid input. */
export function formatDateTime(
  value: string | Date | null | undefined,
  { timeZone, locale = 'en-US' }: FormatOptions = {},
) {
  const date = toValidDate(value);
  return date
    ? new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short', timeZone }).format(date)
    : '';
}

/** The local calendar date as YYYY-MM-DD. */
export function toIsoDate(date: Date) {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

/** True for a real calendar date written as YYYY-MM-DD. */
export function isValidIsoDate(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;
  const [year, month, day] = match.slice(1).map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}
