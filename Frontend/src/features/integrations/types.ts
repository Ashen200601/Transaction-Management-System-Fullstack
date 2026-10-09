export type IntegrationStatus = 'connected' | 'disconnected' | 'error';

/** An external system Finovex syncs with (accounting, online store, …). */
export interface Integration {
  id: string;
  name: string;
  category: 'accounting' | 'ecommerce' | 'payments';
  description: string;
  status: IntegrationStatus;
  lastSyncedAt: string | null;
  error: string | null;
}
