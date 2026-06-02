import { describe, it, expect } from 'vitest';
import { axe } from 'vitest-axe';
import { http, HttpResponse } from 'msw';
import { waitFor } from '@testing-library/react';
import { renderWithProviders } from '../../../test/renderWithProviders';
import { server } from '../../../mocks/server';
import Dashboard from '../Dashboard';

const BASE = 'http://localhost:8000/api';

describe('Dashboard a11y', () => {
  it('WCAG 2.1 AA ihlali içermez (boş data)', async () => {
    server.use(
      http.get(`${BASE}/dashboard/today/`, () =>
        HttpResponse.json({
          today_appointments: [],
          today_total: 0,
          today_completed: 0,
          total_patients: 0,
        }),
      ),
    );

    const { container } = renderWithProviders(<Dashboard />, {
      authenticated: true,
    });

    await waitFor(() => {
      // Stat card'lar render olmuş
      expect(container.textContent?.length).toBeGreaterThan(0);
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
