import { env } from '@/config/env';

import { createHttpClient, type HttpClientConfig } from './http-client';

export * from './errors';
export * from './http-client';
export * from './types';

type RuntimeConfig = Required<Omit<HttpClientConfig, 'baseUrl'>>;

const runtime: RuntimeConfig = {
  getAccessToken: () => null,
  getBusinessId: () => null,
  onUnauthorized: () => {},
};

/** Wires the shared client to the signed-in session and the active business. */
export function configureApiClient(config: Partial<RuntimeConfig>) {
  Object.assign(runtime, config);
}

/** The client every feature API module uses. */
export const apiClient = createHttpClient({
  baseUrl: env.apiBaseUrl,
  getAccessToken: () => runtime.getAccessToken(),
  getBusinessId: () => runtime.getBusinessId(),
  onUnauthorized: () => runtime.onUnauthorized(),
});
