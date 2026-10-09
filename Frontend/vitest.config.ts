import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    restoreMocks: true,
    env: {
      VITE_API_BASE_URL: 'http://api.test',
      VITE_AUTH_MODE: 'mock',
      VITE_ENABLE_MOCKS: 'false',
    },
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/test/**', 'src/mocks/**', 'src/**/*.test.{ts,tsx}', 'src/main.tsx'],
    },
  },
});
