/** First message per field from validation issues, keyed by dotted path ("lines.0.quantity"). */
export function issuesToFieldErrors(
  issues: ReadonlyArray<{ path: ReadonlyArray<PropertyKey>; message: string }>,
): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const issue of issues) {
    const key = issue.path.map(String).join('.');
    errors[key] ??= issue.message;
  }
  return errors;
}

/** First message per field from an API validation error. */
export function apiFieldErrors(fieldErrors: Record<string, string[]>): Record<string, string> {
  return Object.fromEntries(
    Object.entries(fieldErrors)
      .filter(([, messages]) => messages.length > 0)
      .map(([field, messages]) => [field, messages[0]]),
  );
}
