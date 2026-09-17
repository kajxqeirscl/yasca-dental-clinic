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
// Mock pointer capture and scroll for Radix UI in jsdom
if (typeof window !== 'undefined') {
  if (!window.HTMLElement.prototype.hasPointerCapture) {
    window.HTMLElement.prototype.hasPointerCapture = () => false;
  }
  if (!window.HTMLElement.prototype.setPointerCapture) {
    window.HTMLElement.prototype.setPointerCapture = () => {};
  }
  if (!window.HTMLElement.prototype.releasePointerCapture) {
    window.HTMLElement.prototype.releasePointerCapture = () => {};
  }
  if (!window.HTMLElement.prototype.scrollIntoView) {
    window.HTMLElement.prototype.scrollIntoView = () => {};
  }
}

afterAll(() => server.close());
