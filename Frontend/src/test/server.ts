import { setupServer } from 'msw/node';

// Starts with no handlers: each test registers what it needs with server.use().
export const server = setupServer();
