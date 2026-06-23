/**
 * LoginPage testleri — form render, başarılı/başarısız giriş, dil değiştirme.
 */
import { describe, it, expect, vi } from 'vitest';
import { http, HttpResponse } from 'msw';
import userEvent from '@testing-library/user-event';
import { screen, waitFor } from '@testing-library/react';
import { renderWithProviders } from '../../test/renderWithProviders';
import { server } from '../../mocks/server';
import LoginPage from './LoginPage';

const BASE = 'http://localhost:8000/api';

describe('LoginPage', () => {
  it('kullanıcı adı ve şifre alanlarını render eder', async () => {
    renderWithProviders(<LoginPage />);

    expect(await screen.findByLabelText(/Kullanıcı Adı|Username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Şifre|Password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Giriş|Sign in/i })).toBeInTheDocument();
  });

  it('başarılı giriş login() çağrısını tetikler', async () => {
    let tokenCalled = false;
    server.use(
      http.post(`${BASE}/auth/token/`, () => {
        tokenCalled = true;
        return HttpResponse.json({ access: 'a', refresh: 'r' });
      }),
    );

    renderWithProviders(<LoginPage />);

    await userEvent.type(await screen.findByLabelText(/Kullanıcı Adı|Username/i), 'admin');
    await userEvent.type(screen.getByLabelText(/Şifre|Password/i), 'parola');
    await userEvent.click(screen.getByRole('button', { name: /Giriş|Sign in/i }));

    await waitFor(() => expect(tokenCalled).toBe(true));
  });

  it('hatalı giriş bilgileri için lokalize hata mesajı gösterir', async () => {
    server.use(
      http.post(`${BASE}/auth/token/`, () =>
        HttpResponse.json(
          { detail: 'No active account found with the given credentials' },
          { status: 401 },
        ),
      ),
    );

    renderWithProviders(<LoginPage />);

    await userEvent.type(await screen.findByLabelText(/Kullanıcı Adı|Username/i), 'admin');
    await userEvent.type(screen.getByLabelText(/Şifre|Password/i), 'yanlis');
    await userEvent.click(screen.getByRole('button', { name: /Giriş|Sign in/i }));

    await waitFor(() => {
      expect(
        screen.getByText(/Giriş başarısız|Lütfen e-posta|invalid/i),
      ).toBeInTheDocument();
    });
  });

  it('clinic-info başarılı geldiğinde klinik adı render edilir', async () => {
    server.use(
      http.get(`${BASE}/public/clinic-info/`, () =>
        HttpResponse.json({ clinic_name: 'Yıldız Dental' }),
      ),
    );

    renderWithProviders(<LoginPage />);

    await waitFor(() => {
      expect(screen.getAllByText(/Yıldız Dental/).length).toBeGreaterThan(0);
    });
  });

  it('clinic-info başarısız olursa "Yaşca Dental" fallback gösterilir', async () => {
    server.use(
      http.get(`${BASE}/public/clinic-info/`, () =>
        HttpResponse.json({ detail: 'Not found' }, { status: 404 }),
      ),
    );

    renderWithProviders(<LoginPage />);

    await waitFor(() => {
      expect(screen.getAllByText(/Yaşca Dental/).length).toBeGreaterThan(0);
    });
  });

  it('Unutulan şifre butonu modal gösterir', async () => {
    renderWithProviders(<LoginPage />);

    const forgotBtn = await screen.findByRole('button', {
      name: /Unuttum|Forgot/i,
    });
    await userEvent.click(forgotBtn);

    // Modal should appear
    expect(await screen.findByText(/Şifre Sıfırlama|Reset/i)).toBeInTheDocument();
  });
});
