import { describe, it, expect } from 'vitest';
import { axe } from 'vitest-axe';
import { http, HttpResponse } from 'msw';
import { waitFor } from '@testing-library/react';
import { renderWithProviders } from '../../../test/renderWithProviders';
import { server } from '../../../mocks/server';
import PatientSearch from '../PatientSearch';

const BASE = 'http://localhost:8000/api';

describe('PatientSearch a11y', () => {
  it('WCAG 2.1 AA ihlali içermez', async () => {
    server.use(
      http.get(`${BASE}/patients/`, () =>
        HttpResponse.json({ count: 0, results: [] }),
      ),
    );

    const { container } = renderWithProviders(<PatientSearch />, {
      authenticated: true,
    });

    await waitFor(() => {
      expect(container.querySelector('input')).toBeInTheDocument();
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
