import { describe, it, expect, vi, beforeEach } from 'vitest';
import { axe } from 'vitest-axe';
import { render } from '@testing-library/react';
import ErrorBoundary from '../ErrorBoundary';

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

function ThrowOnRender() {
  throw new Error('test hatası');
}

describe('ErrorBoundary a11y', () => {
  it('hata durumunda fallback UI WCAG 2.1 AA ihlali içermez', async () => {
    const { container } = render(
      <ErrorBoundary>
        <ThrowOnRender />
      </ErrorBoundary>,
    );

    const results = await axe(container, {
      runOnly: {
        type: 'tag',
        values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'],
      },
    });

    expect(results).toHaveNoViolations();
  });
});
