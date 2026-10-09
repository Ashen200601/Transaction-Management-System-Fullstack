import { describe, expect, it } from 'vitest';

import { ApiError, getErrorMessage, isApiError, parseApiError } from './errors';

describe('parseApiError', () => {
  it('reads RFC 7807 problem details', () => {
    const error = parseApiError(422, {
      type: 'https://finovex.app/problems/validation',
      title: 'Validation failed',
      status: 422,
      detail: 'One or more fields are invalid.',
      code: 'VALIDATION_ERROR',
      traceId: 'trace-123',
      errors: { 'lines.0.quantity': ['Must be greater than 0'] },
    });

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({
      name: 'ApiError',
      status: 422,
      code: 'VALIDATION_ERROR',
      message: 'One or more fields are invalid.',
      traceId: 'trace-123',
      fieldErrors: { 'lines.0.quantity': ['Must be greater than 0'] },
    });
  });

  it('falls back to the title when there is no detail', () => {
    expect(parseApiError(409, { title: 'Transaction already voided' }).message).toBe(
      'Transaction already voided',
    );
  });

  it('builds a generic error from non-JSON or empty bodies', () => {
    expect(parseApiError(502, '<html>Bad gateway</html>')).toMatchObject({
      status: 502,
      code: 'HTTP_502',
      message: 'Request failed with status 502',
      fieldErrors: {},
    });
    expect(parseApiError(500, null).code).toBe('HTTP_500');
  });
});

describe('isApiError', () => {
  it('recognises ApiError instances only', () => {
    expect(isApiError(new ApiError({ status: 404, code: 'NOT_FOUND', message: 'Not found' }))).toBe(true);
    expect(isApiError(new Error('Not found'))).toBe(false);
    expect(isApiError({ status: 404 })).toBe(false);
  });
});

describe('getErrorMessage', () => {
  it('uses the message from the API', () => {
    const error = new ApiError({ status: 409, code: 'ALREADY_VOIDED', message: 'Transaction already voided' });
    expect(getErrorMessage(error)).toBe('Transaction already voided');
  });

  it('explains network failures', () => {
    const error = new ApiError({ status: 0, code: 'NETWORK_ERROR', message: 'Failed to fetch' });
    expect(getErrorMessage(error)).toBe('Unable to reach the server. Check your connection and try again.');
  });

  it('explains expired sessions', () => {
    const error = new ApiError({ status: 401, code: 'UNAUTHORIZED', message: 'Unauthorized' });
    expect(getErrorMessage(error)).toBe('Your session has expired. Please sign in again.');
  });

  it('uses the message of plain errors', () => {
    expect(getErrorMessage(new Error('Camera permission denied'))).toBe('Camera permission denied');
  });

  it.each(['oops', undefined, null, 42])('has a fallback for %s', (value) => {
    expect(getErrorMessage(value)).toBe('Something went wrong. Please try again.');
  });
});
