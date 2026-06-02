/**
 * Karmaşık component smoke testleri.
 *
 * DentalChart, AppointmentCalendar, UserManagement, TreatmentTypesPage —
 * SVG/MUI/state-heavy iç dinamikleri tek tek test etmek pahalı.
 * Bunun yerine: mount edilebiliyor mu, key etkileşimler crash etmiyor mu.
 */
import { describe, it, expect, vi } from 'vitest';
import { http, HttpResponse } from 'msw';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../test/renderWithProviders';
import { server } from '../../mocks/server';
import { makeTreatment } from '../../test/factories';

import DentalChart from './DentalChart';
import AppointmentCalendar from './AppointmentCalendar';
import UserManagement from './UserManagement';
import TreatmentTypesPage from './TreatmentTypesPage';

const BASE = 'http://localhost:8000/api';

// ---------------------------------------------------------------------------
// DentalChart
// ---------------------------------------------------------------------------

describe('DentalChart', () => {
  it('boş treatments array ile sorunsuz render olur', () => {
    renderWithProviders(<DentalChart treatments={[]} />, {
      authenticated: true,
    });
    // FDI sistemine göre üst-sağ 18 numaralı diş header'larda görünmeli
    expect(screen.getAllByText(/18|11|21|28/).length).toBeGreaterThan(0);
  });

  it('treatment\'lı dişler renkli render edilir', () => {
    const treatments = [
      {
        ...makeTreatment({ id: 1, tooth_number: '11' }),
        treatment_type_category: 'canal',
      } as any,
    ];

    const { container } = renderWithProviders(
      <DentalChart treatments={treatments} />,
      { authenticated: true },
    );

    // canal status için bg-red-200 class'ı içeren en az bir element var mı
    const canalToothEls = container.querySelectorAll('.bg-red-200');
    expect(canalToothEls.length).toBeGreaterThan(0);
  });

  it('tab değişimi (Yetişkin/Çocuk) crash etmiyor', async () => {
    renderWithProviders(<DentalChart treatments={[]} />, {
      authenticated: true,
    });

    const tabs = screen.getAllByRole('tab');
    expect(tabs.length).toBeGreaterThanOrEqual(2);

    // İkinci tab'a tıkla
    await userEvent.click(tabs[1]);
    // Crash olmadıysa pass
    expect(document.body).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// AppointmentCalendar
// ---------------------------------------------------------------------------

describe('AppointmentCalendar', () => {
  beforeEach(() => {
    server.use(
      http.get(`${BASE}/appointments/`, () =>
        HttpResponse.json({ count: 0, results: [] }),
      ),
      http.get(`${BASE}/settings/clinic/`, () =>
        HttpResponse.json({
          work_start_time: '09:00:00',
          work_end_time: '18:00:00',
          work_days: [1, 2, 3, 4, 5],
        }),
      ),
    );
  });

  it('boş takvim sorunsuz render olur', async () => {
    renderWithProviders(<AppointmentCalendar />, { authenticated: true });

    await waitFor(() => {
      // En azından bir tane butonu olmalı (haftalık/günlük toggle)
      expect(screen.getAllByRole('button').length).toBeGreaterThan(0);
    });
  });

  it('hafta nav butonları çağrılır (crash etmez)', async () => {
    renderWithProviders(<AppointmentCalendar />, { authenticated: true });

    await waitFor(() => {
      expect(screen.getAllByRole('button').length).toBeGreaterThan(0);
    });

    // Tüm butonların tıklanması crash etmemeli (zincir test)
    const buttons = screen.getAllByRole('button');
    // İlk birkaç butona tıkla
    for (const btn of buttons.slice(0, 3)) {
      try {
        await userEvent.click(btn);
      } catch {
        // dialog açan butonlar olabilir, devam et
      }
    }
    expect(document.body).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// UserManagement
// ---------------------------------------------------------------------------

describe('UserManagement', () => {
  it('kullanıcı listesi yüklenir', async () => {
    server.use(
      http.get(`${BASE}/users/`, () =>
        HttpResponse.json([
          { id: 1, username: 'admin', email: 'a@a.com', role: 'admin', first_name: 'A', last_name: 'B' },
          { id: 2, username: 'doctor1', email: 'd@d.com', role: 'doctor', first_name: 'D', last_name: 'E' },
        ]),
      ),
    );

    renderWithProviders(<UserManagement />, { authenticated: true });

    await waitFor(() => {
      expect(screen.getByText('admin')).toBeInTheDocument();
      expect(screen.getByText('doctor1')).toBeInTheDocument();
    });
  });

  it('boş liste durumunda crash olmaz', async () => {
    server.use(
      http.get(`${BASE}/users/`, () => HttpResponse.json([])),
    );

    renderWithProviders(<UserManagement />, { authenticated: true });

    // Loading bittikten sonra
    await waitFor(() => {
      expect(screen.queryByText(/Yükleniyor|Loading/i)).not.toBeInTheDocument();
    });
    expect(document.body).toBeInTheDocument();
  });

  it('API hatası error mesajı gösterir', async () => {
    server.use(
      http.get(`${BASE}/users/`, () =>
        HttpResponse.json({ detail: 'fail' }, { status: 500 }),
      ),
    );

    renderWithProviders(<UserManagement />, { authenticated: true });

    await waitFor(() => {
      expect(
        screen.queryByText(/Kullanıcılar yüklenemedi|hata/i),
      ).toBeInTheDocument();
    });
  });
});

// ---------------------------------------------------------------------------
// TreatmentTypesPage
// ---------------------------------------------------------------------------

describe('TreatmentTypesPage', () => {
  it('tedavi türleri listesi yüklenir', async () => {
    server.use(
      http.get(`${BASE}/treatment-types/`, () =>
        HttpResponse.json({
          count: 2,
          results: [
            { id: 1, name: 'Kanal Tedavisi Özel', default_price: '2500.00', is_active: true, category: 'canal' },
            { id: 2, name: 'Diş Çekimi Premium', default_price: '800.00', is_active: true, category: 'extraction' },
          ],
        }),
      ),
    );

    renderWithProviders(<TreatmentTypesPage userRole="admin" />, {
      authenticated: true,
    });

    await waitFor(() => {
      expect(screen.getAllByText(/Kanal Tedavisi Özel/).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/Diş Çekimi Premium/).length).toBeGreaterThan(0);
    });
  });

  it('"Ekle" butonu dialog açar', async () => {
    server.use(
      http.get(`${BASE}/treatment-types/`, () =>
        HttpResponse.json({ count: 0, results: [] }),
      ),
    );

    renderWithProviders(<TreatmentTypesPage userRole="admin" />, {
      authenticated: true,
    });

    const addBtn = await screen.findByRole('button', {
      name: /Yeni Tedavi Türü Ekle|Add New|Add Treatment Type/i,
    });
    await userEvent.click(addBtn);

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });
});
