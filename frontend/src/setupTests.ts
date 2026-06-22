// Extends Vitest's expect with @testing-library/jest-dom matchers
import '@testing-library/jest-dom';
import { beforeAll, afterEach, afterAll, expect } from 'vitest';
import * as axeMatchers from 'vitest-axe/matchers';
import { server } from './mocks/server';
import { resetSequence } from './test/factories';
import { clearAuth } from './app/services/api';

// vitest-axe matchers — `expect(container).toHaveNoViolations()` kullanımı için
expect.extend(axeMatchers);

// MSW: bütün testler için otomatik start/stop
beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }));
afterEach(() => {
  server.resetHandlers();
  localStorage.clear();
  clearAuth();
  resetSequence();
});
afterAll(() => server.close());
