/**
 * LoginPage a11y testi — WCAG 2.1 AA zero-tolerance.
 *
 * axe ihlali varsa build kırmızı. WCAG AAA için warning logu vereceğiz,
 * ihlali blocker değil ama gelecek iterasyon için issue açılmalı.
 */
import { describe, it, expect } from 'vitest';
import { axe } from 'vitest-axe';
import { waitFor } from '@testing-library/react';
import { renderWithProviders } from '../../../test/renderWithProviders';
import LoginPage from '../LoginPage';

describe('LoginPage a11y', () => {
  it('WCAG 2.0 + 2.1 AA ihlali içermez', async () => {
    const { container } = renderWithProviders(<LoginPage />);

    // Component'in tam render olmasını bekle
    await waitFor(() => {
      expect(container.querySelector('form')).toBeInTheDocument();
    });

    const results = await axe(container, {
      runOnly: {
        type: 'tag',
        values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'],
      },
    });

    expect(results).toHaveNoViolations();
  });
});
