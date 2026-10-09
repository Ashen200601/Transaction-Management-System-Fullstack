import { http, HttpResponse } from 'msw';

import { api, latency, problem, requireStore } from '../utils';

const ACTIONS = ['connect', 'disconnect', 'sync'] as const;

export const integrationHandlers = [
  http.get(api('/integrations'), async ({ request }) => {
    await latency();
    const store = requireStore(request);
    if (store instanceof Response) return store;
    return HttpResponse.json(store.integrations);
  }),

  http.post(api('/integrations/:id/:action'), async ({ request, params }) => {
    await latency();
    const store = requireStore(request);
    if (store instanceof Response) return store;
    const integration = store.integrations.find((candidate) => candidate.id === params.id);
    const action = ACTIONS.find((candidate) => candidate === params.action);
    if (!integration || !action) return problem(404, 'Integration not found', { code: 'NOT_FOUND' });

    const now = new Date().toISOString();
    if (action === 'connect') {
      Object.assign(integration, { status: 'connected', error: null, lastSyncedAt: now });
    } else if (action === 'disconnect') {
      Object.assign(integration, { status: 'disconnected', error: null });
    } else {
      if (integration.status !== 'connected') {
        return problem(409, `Reconnect ${integration.name} before syncing.`, { code: 'NOT_CONNECTED' });
      }
      integration.lastSyncedAt = now;
    }
    return HttpResponse.json(integration);
  }),
];
