import { authHandlers } from './auth';
import { catalogHandlers } from './catalog';
import { coreHandlers } from './core';
import { documentHandlers } from './documents';
import { integrationHandlers } from './integrations';
import { transactionHandlers } from './transactions';

export const handlers = [
  ...authHandlers,
  ...coreHandlers,
  ...transactionHandlers,
  ...catalogHandlers,
  ...documentHandlers,
  ...integrationHandlers,
];
