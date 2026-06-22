/**
 * PatientSearch testleri — debounce'lu arama, liste render, yeni hasta dialog'u.
 */
import { describe, it, expect } from 'vitest';
import { http, HttpResponse } from 'msw';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../test/renderWithProviders';
import { server } from '../../mocks/server';
import { makePatient } from '../../test/factories';
import PatientSearch from './PatientSearch';

const BASE = 'http://localhost:8000/api';

describe('PatientSearch', () => {
  it('hasta listesi yüklendikten sonra render edilir', async () => {
    server.use(
      http.get(`${BASE}/patients/`, () =>
        HttpResponse.json({
          count: 2,
          results: [
            makePatient({ first_name: 'Ali', last_name: 'Yılmaz' }),
            makePatient({ first_name: 'Veli', last_name: 'Demir' }),
          ],
        }),
      ),
    );

    renderWithProviders(<PatientSearch />, { authenticated: true });

    await waitFor(() => {
      expect(screen.getByText('Ali Yılmaz')).toBeInTheDocument();
      expect(screen.getByText('Veli Demir')).toBeInTheDocument();
    });
  });

  it('search input\'a yazınca API\'ye debounce sonrası istek gider', async () => {
    let searchParam = '';
    server.use(
      http.get(`${BASE}/patients/`, ({ request }) => {
        const url = new URL(request.url);
        searchParam = url.searchParams.get('search') ?? '';
        return HttpResponse.json({ count: 0, results: [] });
      }),
    );

    renderWithProviders(<PatientSearch />, { authenticated: true });

    const search = await screen.findByPlaceholderText(/ara|search/i);
    await userEvent.type(search, 'Mehmet');

    // Debounce 300ms, timeout 500ms ile yetiyor.
    await waitFor(() => expect(searchParam).toBe('Mehmet'), { timeout: 1500 });
  });

  it('"Yeni Hasta" butonu PatientDialog\'u açar', async () => {
    server.use(
      http.get(`${BASE}/patients/`, () =>
        HttpResponse.json({ count: 0, results: [] }),
      ),
    );

    renderWithProviders(<PatientSearch />, { authenticated: true });

    const newBtn = await screen.findByRole('button', {
      name: /Yeni Hasta|Add new|New Patient/i,
    });
    await userEvent.click(newBtn);

    // Dialog açıldığında genelde role="dialog" elementi olur.
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });

  it('API hatası error mesajı render eder', async () => {
    server.use(
      http.get(`${BASE}/patients/`, () =>
        HttpResponse.json({ detail: 'oops' }, { status: 500 }),
      ),
    );

    renderWithProviders(<PatientSearch />, { authenticated: true });

    await waitFor(() => {
      expect(
        screen.getByText(/hata|error|yüklenemedi|alınamadı/i),
      ).toBeInTheDocument();
    });
  });
});
