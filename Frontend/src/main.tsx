import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { App } from '@/app/app';
import { env } from '@/config/env';

import '@/styles/globals.css';

/** In development, serve the API from in-browser mocks (VITE_ENABLE_MOCKS=true). */
async function startMockApi() {
  if (!env.enableMocks) return;
  const { worker } = await import('./mocks/browser');
  await worker.start({ onUnhandledRequest: 'bypass', quiet: true });
  console.info('[Finovex] Mock API is on: data lives in this browser tab and resets on reload.');
}

void startMockApi().then(() => {
  const root = document.getElementById('root');
  if (!root) throw new Error('Missing #root element in index.html');
  createRoot(root).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
});
