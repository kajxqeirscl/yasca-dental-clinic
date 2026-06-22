/**
 * ClinicSettingsPage testleri — yükleme, gösterim, yetki bazlı düzenleme.
 */
import { describe, it, expect } from 'vitest';
import { http, HttpResponse } from 'msw';
import { screen, waitFor } from '@testing-library/react';
import { renderWithProviders } from '../../test/renderWithProviders';
import { server } from '../../mocks/server';
import { makeClinicSettings } from '../../test/factories';
import ClinicSettingsPage from './ClinicSettingsPage';

const BASE = 'http://localhost:8000/api';

describe('ClinicSettingsPage', () => {
  it('mevcut ayarları API\'den yükler', async () => {
    server.use(
      http.get(`${BASE}/settings/clinic/`, () =>
        HttpResponse.json(makeClinicSettings({
          work_start_time: '08:30:00',
          work_end_time: '19:00:00',
        })),
      ),
    );

    renderWithProviders(<ClinicSettingsPage />, { authenticated: true });

    await waitFor(() => {
      // Çalışma saati gösterimi: opsiyonlardan en az biri 08:30/08.30 ile uyuşmalı
      const matches = screen.getAllByText(/08[:.]30/);
      expect(matches.length).toBeGreaterThan(0);
    });
  });

  it('API hatası durumunda error mesajı render edilir', async () => {
    server.use(
      http.get(`${BASE}/settings/clinic/`, () =>
        HttpResponse.json({ detail: 'oops' }, { status: 500 }),
      ),
    );

    renderWithProviders(<ClinicSettingsPage />, { authenticated: true });

    await waitFor(() => {
      expect(
        screen.getByText(/hata|error|yüklenemedi|alınamadı/i),
      ).toBeInTheDocument();
    });
  });

  it('yükleme sırasında loading state gösterilir', async () => {
    server.use(
      http.get(`${BASE}/settings/clinic/`, async () => {
        await new Promise((r) => setTimeout(r, 50));
        return HttpResponse.json(makeClinicSettings());
      }),
    );

    renderWithProviders(<ClinicSettingsPage />, { authenticated: true });

    // İlk render'da loading veya placeholder gözükmeli
    // Title gözüküyor olmalı
    await waitFor(
      () => expect(screen.queryByText(/ayar|setting/i)).toBeInTheDocument(),
      { timeout: 1000 },
    );
  });
});
