import { Link2, Link2Off, RefreshCw } from 'lucide-react';

import { PageHeader } from '@/components/common/page-header';
import { ErrorState, LoadingState } from '@/components/common/states';
import { Badge, type BadgeTone } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { getErrorMessage } from '@/lib/api/errors';
import { formatDateTime } from '@/lib/dates';

import { useIntegrationAction, useIntegrations } from '../api';
import type { IntegrationStatus } from '../types';

const STATUS: Record<IntegrationStatus, { label: string; tone: BadgeTone }> = {
  connected: { label: 'Connected', tone: 'success' },
  disconnected: { label: 'Not connected', tone: 'neutral' },
  error: { label: 'Needs attention', tone: 'danger' },
};

const CATEGORY_LABELS = { accounting: 'Accounting', ecommerce: 'Online store', payments: 'Payments' } as const;

export function IntegrationsPage() {
  const query = useIntegrations();
  const action = useIntegrationAction();
  const busyId = action.isPending ? action.variables?.id : undefined;

  return (
    <>
      <PageHeader title="Integrations" description="Keep your accounting and online sales in step with Finovex." />

      {action.isError && (
        <p role="alert" className="mb-4 text-sm text-destructive">
          {getErrorMessage(action.error)}
        </p>
      )}

      {query.isPending ? (
        <LoadingState label="Loading integrations…" />
      ) : query.isError ? (
        <ErrorState error={query.error} onRetry={() => void query.refetch()} />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {query.data.map((integration) => {
            const status = STATUS[integration.status];
            const isBusy = busyId === integration.id;
            return (
              <Card key={integration.id} className="flex flex-col gap-3 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="font-semibold">{integration.name}</h2>
                    <p className="text-xs text-muted-foreground">{CATEGORY_LABELS[integration.category]}</p>
                  </div>
                  <Badge tone={status.tone}>{status.label}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">{integration.description}</p>
                {integration.error && <p className="text-sm text-destructive">{integration.error}</p>}
                {integration.lastSyncedAt && (
                  <p className="text-xs text-muted-foreground">Last synced {formatDateTime(integration.lastSyncedAt)}</p>
                )}
                <div className="mt-auto flex flex-wrap gap-2 pt-2">
                  {integration.status !== 'connected' && (
                    <Button size="sm" disabled={isBusy} onClick={() => action.mutate({ id: integration.id, action: 'connect' })}>
                      <Link2 aria-hidden />
                      {integration.status === 'error' ? 'Reconnect' : 'Connect'}
                    </Button>
                  )}
                  {integration.status !== 'disconnected' && (
                    <>
                      {integration.status === 'connected' && (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={isBusy}
                          onClick={() => action.mutate({ id: integration.id, action: 'sync' })}
                        >
                          <RefreshCw aria-hidden className={isBusy ? 'animate-spin' : undefined} />
                          Sync now
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={isBusy}
                        onClick={() => action.mutate({ id: integration.id, action: 'disconnect' })}
                      >
                        <Link2Off aria-hidden />
                        Disconnect
                      </Button>
                    </>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}
