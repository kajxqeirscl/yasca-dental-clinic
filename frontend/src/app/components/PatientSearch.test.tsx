/**
 * PatientSearch testleri — debounce'lu arama, liste render, yeni hasta dialog'u.
 */
import { describe, it, expect } from 'vitest';
import { http, HttpResponse } from 'msw';
import { screen, waitFor, fireEvent } from '@testing-library/react';
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

  it('shows currency selector when total_debt is selected and queries with currency param', async () => {
    let capturedCurrency = '';
    server.use(
      http.get(`${BASE}/patients/`, ({ request }) => {
        const url = new URL(request.url);
        capturedCurrency = url.searchParams.get('currency') ?? '';
        return HttpResponse.json({ count: 0, results: [] });
      }),
      http.get(`${BASE}/clinic/settings/`, () =>
        HttpResponse.json({ default_currency: 'TRY' }),
      ),
    );

    renderWithProviders(<PatientSearch />, { authenticated: true });

    // Initially currency selector should not be visible
    expect(screen.queryByLabelText(/para birimi seçin/i)).not.toBeInTheDocument();

    // Select "total_debt" from sorting select
    const sortTrigger = screen.getByLabelText(/sıralama ölçütü seçin/i);
    fireEvent.pointerDown(sortTrigger, { pointerId: 1, button: 0 });
    fireEvent.keyDown(sortTrigger, { key: 'ArrowDown' });

    const debtOption = await screen.findByRole('option', { name: /toplam borç/i });
    fireEvent.click(debtOption);

    // Now currency select should be visible
    const currSelect = await screen.findByLabelText(/para birimi seçin/i);
    expect(currSelect).toBeInTheDocument();

    // Change currency to USD
    await userEvent.selectOptions(currSelect, 'USD');

    await waitFor(() => {
      expect(capturedCurrency).toBe('USD');
    });
  });
});
