import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import type { ServerResponse } from 'node:http';
import { fileURLToPath } from 'node:url';
import { defineConfig, loadEnv } from 'vite';

const projectRoot = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig(({ mode }) => {
  // Dev server only (no VITE_ prefix, so it never reaches the browser bundle).
  const { API_PROXY_TARGET } = loadEnv(mode, projectRoot, '');

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
    },
    server: {
      port: 5173,
      // The app calls /api on its own origin and the dev server forwards it to the backend:
      // no CORS in development, and the mock service worker can pass those calls through.
      proxy: API_PROXY_TARGET
        ? {
            '/api': {
              target: API_PROXY_TARGET,
              // Pass the browser's address on (X-Forwarded-For), so the login audit records it.
              xfwd: true,
              configure: (proxy) => {
                // Backend not running: answer like the API would, so the app shows a clear message.
                proxy.on('error', (_error, _request, response) => {
                  const res = response as ServerResponse;
                  if (!('writeHead' in res) || res.headersSent) return;
                  res.writeHead(502, { 'Content-Type': 'application/problem+json' });
                  res.end(
                    JSON.stringify({
                      type: 'about:blank',
                      title: 'Backend unavailable',
                      status: 502,
                      code: 'BACKEND_UNAVAILABLE',
                      detail: `The dev server couldn't reach the backend at ${API_PROXY_TARGET}. Is it running?`,
                    }),
                  );
                });
              },
            },
          }
        : undefined,
    },
  };
});
