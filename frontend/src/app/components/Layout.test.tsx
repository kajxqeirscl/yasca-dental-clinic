/**
 * Layout testleri — multi-tenant routing basePath desteği, admin-only menu,
 * logout, dil değiştirme, kullanıcı/klinik bilgisi.
 *
 * Recent commit 043c7f0 ile basePath prop'u eklendi; testler nav link'lerin
 * /app/{slug} prefix'i ile doğru oluştuğunu garanti altına alıyor.
 */
import { describe, it, expect, vi } from 'vitest';
import { http, HttpResponse } from 'msw';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../test/renderWithProviders';
import { server } from '../../mocks/server';
import Layout from './Layout';

const BASE = 'http://localhost:8000/api';

const baseProps = {
  userName: 'Test User',
  userRole: 'Hekim',
  onLogout: vi.fn(),
};

describe('Layout', () => {
  it('children render edilir', async () => {
    renderWithProviders(
      <Layout {...baseProps}>
        <div data-testid="content">Sayfa içeriği</div>
      </Layout>,
    );

    expect(await screen.findByTestId('content')).toBeInTheDocument();
  });

  it('kullanıcı adı ve rol header\'da gösterilir', async () => {
    renderWithProviders(
      <Layout {...baseProps}>
        <div />
      </Layout>,
    );

    expect(await screen.findByText('Test User')).toBeInTheDocument();
    expect(screen.getByText(/Hekim/)).toBeInTheDocument();
  });

  it('logout butonu onLogout callback\'ini tetikler', async () => {
    const logoutSpy = vi.fn();
    renderWithProviders(
      <Layout {...baseProps} onLogout={logoutSpy}>
        <div />
      </Layout>,
    );

    const logoutBtn = await screen.findByRole('button', { name: /Çıkış|Logout/i });
    await userEvent.click(logoutBtn);

    expect(logoutSpy).toHaveBeenCalledOnce();
  });

  it('nav link\'leri basePath="/app/ali" ile doğru prefix\'i alır', async () => {
    renderWithProviders(
      <Layout {...baseProps} basePath="/app/ali">
        <div />
      </Layout>,
    );

    // Hastalar link'i /app/ali/hastalar'a gitmeli
    await waitFor(() => {
      const patientLink = screen.getByRole('link', { name: /Hastalar|Patients/i });
      expect(patientLink).toHaveAttribute('href', '/app/ali/hastalar');
    });
  });

  it('basePath boşken nav link\'leri kök yoldan başlar', async () => {
    renderWithProviders(
      <Layout {...baseProps} basePath="">
        <div />
      </Layout>,
    );

    await waitFor(() => {
      const patientLink = screen.getByRole('link', { name: /Hastalar|Patients/i });
      expect(patientLink).toHaveAttribute('href', '/hastalar');
    });
  });

  it('admin değilse audit-log link\'i görünmez', async () => {
    renderWithProviders(
      <Layout {...baseProps} isAdmin={false}>
        <div />
      </Layout>,
    );

    await waitFor(() => {
      expect(
        screen.queryByRole('link', { name: /İşlem Geçmişi|Audit/i }),
      ).not.toBeInTheDocument();
    });
  });

  it('admin ise audit-log link\'i görünür', async () => {
    renderWithProviders(
      <Layout {...baseProps} isAdmin>
        <div />
      </Layout>,
    );

    await waitFor(() => {
      expect(
        screen.getByRole('link', { name: /İşlem Geçmişi|Audit/i }),
      ).toBeInTheDocument();
    });
  });

  it('clinic-info başarılı geldiğinde klinik adı header\'a yansır', async () => {
    server.use(
      http.get(`${BASE}/public/clinic-info/`, () =>
        HttpResponse.json({ clinic_name: 'Beta Klinik' }),
      ),
    );

    renderWithProviders(
      <Layout {...baseProps}>
        <div />
      </Layout>,
    );

    await waitFor(() => {
      expect(screen.getByText('Beta Klinik')).toBeInTheDocument();
    });
  });
});
