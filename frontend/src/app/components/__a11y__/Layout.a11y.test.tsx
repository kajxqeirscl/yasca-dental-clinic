import { describe, it, expect, vi } from 'vitest';
import { axe } from 'vitest-axe';
import { waitFor } from '@testing-library/react';
import { renderWithProviders } from '../../../test/renderWithProviders';
import Layout from '../Layout';

describe('Layout a11y', () => {
  it('WCAG 2.1 AA ihlali içermez', async () => {
    const { container } = renderWithProviders(
      <Layout
        userName="Test User"
        userRole="Hekim"
        onLogout={vi.fn()}
      >
        <main>İçerik</main>
      </Layout>,
    );

    await waitFor(() => {
      expect(container.querySelector('nav')).toBeInTheDocument();
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
