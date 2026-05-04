/**
 * MSW Node server — used in Vitest (Node environment).
 * Import and use server.use() to override handlers per-test.
 */
import { setupServer } from 'msw/node';
import { handlers } from './handlers';

export const server = setupServer(...handlers);
