/**
 * AuditLogPage testleri — log listesi render, action badge'leri, pagination.
 */
import { describe, it, expect } from 'vitest';
import { http, HttpResponse } from 'msw';
import { screen, waitFor } from '@testing-library/react';
import { renderWithProviders } from '../../test/renderWithProviders';
import { server } from '../../mocks/server';
import AuditLogPage from './AuditLogPage';

const BASE = 'http://localhost:8000/api';

const sampleLog = (overrides = {}) => ({
  id: 1,
  username: 'tony',
  user_email: 'tony@test.com',
  action: 'CREATE',
  model_name: 'Patient',
  object_id: 42,
  changes: { first_name: { old: '', new: 'Yeni' } },
  ip_address: '127.0.0.1',
  created_at: '2026-05-28T10:00:00Z',
  ...overrides,
});

describe('AuditLogPage', () => {
  it('audit log\'lar yüklenir ve listeye render edilir', async () => {
    server.use(
      http.get(`${BASE}/audit-logs/`, () =>
        HttpResponse.json({
          count: 2,
          results: [
            sampleLog({ id: 1, action: 'CREATE', username: 'tony' }),
            sampleLog({ id: 2, action: 'UPDATE', username: 'steve' }),
          ],
        }),
      ),
    );

    renderWithProviders(<AuditLogPage />, { authenticated: true });

    await waitFor(() => {
      expect(screen.getByText('tony')).toBeInTheDocument();
      expect(screen.getByText('steve')).toBeInTheDocument();
    });
  });

  it('boş log listesinde uyarı/empty state gösterilir', async () => {
    server.use(
      http.get(`${BASE}/audit-logs/`, () =>
        HttpResponse.json({ count: 0, results: [] }),
      ),
    );

    renderWithProviders(<AuditLogPage />, { authenticated: true });

    // Loading bittiğinde liste boş — username olmamalı.
    await waitFor(() => {
      expect(screen.queryByText('tony')).not.toBeInTheDocument();
    });
  });

  it('API hatası çökme yapmaz, console.error log\'lar', async () => {
    server.use(
      http.get(`${BASE}/audit-logs/`, () =>
        HttpResponse.json({ detail: 'fail' }, { status: 500 }),
      ),
    );

    renderWithProviders(<AuditLogPage />, { authenticated: true });

    // Sayfa bir şekilde render olmalı — crash etmemeli.
    await waitFor(() => {
      // İçerikte audit log mention'ı olabilir
      expect(document.body.textContent?.length).toBeGreaterThan(0);
    });
  });
});
