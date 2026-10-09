export const ACTIVE_BUSINESS_STORAGE_KEY = 'finovex.activeBusinessId';

type Listener = (businessId: string | null) => void;

const listeners = new Set<Listener>();

// Used when storage is blocked (private mode, browser policies), so the
// selection still works for the current page load.
let inMemoryId: string | null = null;

function notify(businessId: string | null) {
  for (const listener of listeners) listener(businessId);
}

/** The business the user is working in, remembered across reloads. */
export const activeBusinessStore = {
  get(): string | null {
    try {
      return localStorage.getItem(ACTIVE_BUSINESS_STORAGE_KEY);
    } catch {
      return inMemoryId;
    }
  },

  set(businessId: string) {
    inMemoryId = businessId;
    try {
      localStorage.setItem(ACTIVE_BUSINESS_STORAGE_KEY, businessId);
    } catch {
      // Kept in memory only.
    }
    notify(businessId);
  },

  clear() {
    inMemoryId = null;
    try {
      localStorage.removeItem(ACTIVE_BUSINESS_STORAGE_KEY);
    } catch {
      // Nothing to remove.
    }
    notify(null);
  },

  subscribe(listener: Listener) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
};
