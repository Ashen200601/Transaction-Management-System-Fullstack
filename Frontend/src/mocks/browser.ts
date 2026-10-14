import { setupWorker } from 'msw/browser';

import { env } from '@/config/env';

import { handlers } from './handlers';
import { selectHandlers } from './select-handlers';

export const worker = setupWorker(...selectHandlers(handlers, env.mocksExcept, env.apiBaseUrl));
