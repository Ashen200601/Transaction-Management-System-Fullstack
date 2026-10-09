import { useQuery, useQueryClient } from '@tanstack/react-query';
import { createContext, useCallback, useContext, useEffect, useMemo, useSyncExternalStore, type ReactNode } from 'react';

import { ErrorState, LoadingState } from '@/components/common/states';

import { activeBusinessStore } from './active-business-store';
import { businessKeys, listBusinesses } from './api';
import { hasPermission } from './permissions';
import type { Business, Permission } from './types';

export interface TenantContextValue {
  businesses: Business[];
  /** Null until the user picks a business (or belongs to none). */
  activeBusiness: Business | null;
  selectBusiness: (businessId: string) => void;
}

export const TenantContext = createContext<TenantContextValue | null>(null);

export function useTenant(): TenantContextValue {
  const value = useContext(TenantContext);
  if (!value) throw new Error('useTenant must be used inside a TenantProvider');
  return value;
}

/** Whether the user's role in the active business grants `permission`. */
export function useCan(permission: Permission): boolean {
  return hasPermission(useTenant().activeBusiness?.role, permission);
}

/** Loads the user's businesses and tracks which one they are working in. */
export function TenantProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const businessesQuery = useQuery({ queryKey: businessKeys.all, queryFn: listBusinesses });
  const storedId = useSyncExternalStore(activeBusinessStore.subscribe, activeBusinessStore.get, () => null);

  const businesses = useMemo(() => businessesQuery.data ?? [], [businessesQuery.data]);
  const activeBusiness =
    businesses.find((business) => business.id === storedId) ?? (businesses.length === 1 ? businesses[0] : null);

  // Remember an automatic pick (single business), and forget a business the
  // user no longer belongs to.
  useEffect(() => {
    if (!businessesQuery.isSuccess) return;
    if (activeBusiness && activeBusiness.id !== storedId) activeBusinessStore.set(activeBusiness.id);
    if (!activeBusiness && storedId) activeBusinessStore.clear();
  }, [activeBusiness, storedId, businessesQuery.isSuccess]);

  const selectBusiness = useCallback(
    (businessId: string) => {
      activeBusinessStore.set(businessId);
      // Data from the previous business must never show under the new one.
      queryClient.removeQueries({ predicate: (query) => query.queryKey[0] !== businessKeys.all[0] });
    },
    [queryClient],
  );

  const value = useMemo(
    () => ({ businesses, activeBusiness, selectBusiness }),
    [businesses, activeBusiness, selectBusiness],
  );

  if (businessesQuery.isPending) return <LoadingState label="Loading your businesses…" />;
  if (businessesQuery.isError) {
    return <ErrorState error={businessesQuery.error} onRetry={() => void businessesQuery.refetch()} />;
  }
  // Wait until the pick is stored: API requests read the business id from the store.
  if (activeBusiness && activeBusiness.id !== storedId) return <LoadingState />;

  return <TenantContext.Provider value={value}>{children}</TenantContext.Provider>;
}
