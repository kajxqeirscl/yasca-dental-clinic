/**
 * PatientProfile testleri — tab geçişleri, hasta detay yüklenmesi, loading/error.
 *
 * Karmaşık bir sayfa olduğu için temel render path'i + key user interaction'ları
 * test ediliyor; tüm dental chart & dialog interaksiyonu ayrı dosyalarda.
 */
import { describe, it, expect, vi } from 'vitest';
import { http, HttpResponse } from 'msw';
import { screen, waitFor } from '@testing-library/react';
import { renderWithProviders } from '../../test/renderWithProviders';
import { server } from '../../mocks/server';
import { makePatient } from '../../test/factories';

// useParams mock — testlerde id=1 olarak çözümlensin
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return {
    ...actual,
    useParams: () => ({ id: '1' }),
  };
});

import PatientProfile from './PatientProfile';

const BASE = 'http://localhost:8000/api';

const setupHandlers = (patientOverrides = {}) => {
  const patient = makePatient({ id: 1, ...patientOverrides });
  server.use(
    http.get(`${BASE}/patients/1/`, () =>
      HttpResponse.json({ ...patient, anamnesis: null }),
    ),
    http.get(`${BASE}/treatments/`, () =>
      HttpResponse.json({ count: 0, results: [] }),
    ),
    http.get(`${BASE}/appointments/`, () =>
      HttpResponse.json({ count: 0, results: [] }),
    ),
    http.get(`${BASE}/payments/`, () =>
      HttpResponse.json({ count: 0, results: [] }),
    ),
    http.get(`${BASE}/documents/`, () =>
      HttpResponse.json({ count: 0, results: [] }),
    ),
  );
  return patient;
};

describe('PatientProfile', () => {
  it('hasta detayı API\'den yüklenir ve isim form input\'unda gözükür', async () => {
    setupHandlers({ first_name: 'Mehmet', last_name: 'Aksoy' });

    renderWithProviders(<PatientProfile />, {
      authenticated: true,
      initialEntries: ['/hastalar/1'],
    });

    await waitFor(() => {
      // Loading bittiğinde body'de Mehmet ya da Aksoy olmalı (text node veya input value)
      const inputs = Array.from(
        document.querySelectorAll<HTMLInputElement>('input'),
      );
      const hasMehmet = inputs.some((i) => i.value.includes('Mehmet'));
      const hasInBody = document.body.textContent?.includes('Mehmet');
      expect(hasMehmet || hasInBody).toBe(true);
    });
  });

  it('hasta telefon numarası bir input içinde render edilir', async () => {
    setupHandlers({ phone: '+905551234567' });

    renderWithProviders(<PatientProfile />, {
      authenticated: true,
      initialEntries: ['/hastalar/1'],
    });

    await waitFor(() => {
      const inputs = Array.from(
        document.querySelectorAll<HTMLInputElement>('input'),
      );
      const hasPhone = inputs.some(
        (i) =>
          i.value.includes('5551234567') ||
          i.value.includes('555 123 45 67') ||
          i.value.includes('555 12 34'),
      );
      const hasInBody =
        document.body.textContent?.includes('5551234567') ?? false;
      expect(hasPhone || hasInBody).toBe(true);
    });
  });

  it('hasta yüklenemezse error gösterilir', async () => {
    server.use(
      http.get(`${BASE}/patients/1/`, () =>
        HttpResponse.json({ detail: 'oops' }, { status: 500 }),
      ),
      http.get(`${BASE}/treatments/`, () =>
        HttpResponse.json({ count: 0, results: [] }),
      ),
      http.get(`${BASE}/appointments/`, () =>
        HttpResponse.json({ count: 0, results: [] }),
      ),
      http.get(`${BASE}/payments/`, () =>
        HttpResponse.json({ count: 0, results: [] }),
      ),
      http.get(`${BASE}/documents/`, () =>
        HttpResponse.json({ count: 0, results: [] }),
      ),
    );

    renderWithProviders(<PatientProfile />, {
      authenticated: true,
      initialEntries: ['/hastalar/1'],
    });

    await waitFor(() => {
      expect(
        screen.queryByText(/hata|error|alınamadı|yüklenemedi/i),
      ).toBeInTheDocument();
    });
  });

  it('tab sekmeleri render edilir (en az bir tab listesi)', async () => {
    setupHandlers();

    renderWithProviders(<PatientProfile />, {
      authenticated: true,
      initialEntries: ['/hastalar/1'],
    });

    await waitFor(() => {
      // Radix tabs role="tablist"
      expect(screen.getByRole('tablist')).toBeInTheDocument();
    });
  });

  it('loading state başlangıçta gösterilir', () => {
    server.use(
      http.get(`${BASE}/patients/1/`, async () => {
        await new Promise((r) => setTimeout(r, 50));
        return HttpResponse.json(makePatient({ id: 1 }));
      }),
      http.get(`${BASE}/treatments/`, () =>
        HttpResponse.json({ count: 0, results: [] }),
      ),
      http.get(`${BASE}/appointments/`, () =>
        HttpResponse.json({ count: 0, results: [] }),
      ),
      http.get(`${BASE}/payments/`, () =>
        HttpResponse.json({ count: 0, results: [] }),
      ),
      http.get(`${BASE}/documents/`, () =>
        HttpResponse.json({ count: 0, results: [] }),
      ),
    );

    renderWithProviders(<PatientProfile />, {
      authenticated: true,
      initialEntries: ['/hastalar/1'],
    });

    expect(screen.queryByText(/Yükleniyor|Loading/i)).toBeInTheDocument();
  });
});
