const HINT_KEY = 'finovex.hasSession';

// The session lives in an HttpOnly cookie that scripts can't see. This flag only remembers that
// one may exist, so a visitor who never signed in doesn't send a refresh request on every page
// load. It holds no secret: the flag alone signs nobody in.

/** True when an earlier sign-in may still be alive (or when storage can't tell). */
export function hasSessionHint(): boolean {
  try {
    return localStorage.getItem(HINT_KEY) === '1';
  } catch {
    // Storage blocked: ask the API rather than forget a live session.
    return true;
  }
}

export function setSessionHint() {
  try {
    localStorage.setItem(HINT_KEY, '1');
  } catch {
    // Storage blocked: the next page load asks the API anyway.
  }
}

export function clearSessionHint() {
  try {
    localStorage.removeItem(HINT_KEY);
  } catch {
    // Nothing stored.
  }
}
