/**
 * ErrorBoundary testleri.
 *
 * Yakın zamanda multi-tenant routing için refactor edildi: artık /app/{slug}
 * URL'lerinde "Ana Sayfa" butonu klinik dashboard'una döner, public siteye değil.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ErrorBoundary from './ErrorBoundary';

// console.error spy — React'in error boundary uyarısını gizler
beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

function ThrowOnRender({ message = 'kasıtlı patlatma' }: { message?: string }) {
  throw new Error(message);
}

describe('ErrorBoundary', () => {
  it('hata yokken children render edilir', () => {
    render(
      <ErrorBoundary>
        <div data-testid="ok">İçerik</div>
      </ErrorBoundary>,
    );

    expect(screen.getByTestId('ok')).toHaveTextContent('İçerik');
  });

  it('hata yakalandığında fallback UI görüntülenir', () => {
    render(
      <ErrorBoundary>
        <ThrowOnRender message="test hatası" />
      </ErrorBoundary>,
    );

    expect(screen.getByText('Bir Hata Oluştu')).toBeInTheDocument();
    expect(screen.getByText(/test hatası/)).toBeInTheDocument();
  });

  it('"Ana Sayfa" ve "Yeniden Dene" butonları render edilir', () => {
    render(
      <ErrorBoundary>
        <ThrowOnRender />
      </ErrorBoundary>,
    );

    expect(screen.getByRole('button', { name: /Ana Sayfa/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Yeniden Dene/ })).toBeInTheDocument();
  });

  it('Yeniden Dene butonu window.location.reload çağırır', async () => {
    const reloadSpy = vi.fn();
    Object.defineProperty(window, 'location', {
      configurable: true,
      writable: true,
      value: { ...window.location, reload: reloadSpy, href: '', pathname: '/dashboard' },
    });

    render(
      <ErrorBoundary>
        <ThrowOnRender />
      </ErrorBoundary>,
    );

    await userEvent.click(screen.getByRole('button', { name: /Yeniden Dene/ }));

    expect(reloadSpy).toHaveBeenCalledOnce();
  });

  it('klinik path\'inde Ana Sayfa /app/{slug}\'a yönlendirir', async () => {
    const original = window.location;
    Object.defineProperty(window, 'location', {
      configurable: true,
      writable: true,
      value: {
        ...original,
        pathname: '/app/ali/patients/15',
        href: '',
        reload: vi.fn(),
      },
    });

    render(
      <ErrorBoundary>
        <ThrowOnRender />
      </ErrorBoundary>,
    );

    await userEvent.click(screen.getByRole('button', { name: /Ana Sayfa/ }));

    expect(window.location.href).toBe('/app/ali');
  });

  it('public path\'inde Ana Sayfa "/"\'a yönlendirir', async () => {
    const original = window.location;
    Object.defineProperty(window, 'location', {
      configurable: true,
      writable: true,
      value: {
        ...original,
        pathname: '/register',
        href: '',
        reload: vi.fn(),
      },
    });

    render(
      <ErrorBoundary>
        <ThrowOnRender />
      </ErrorBoundary>,
    );

    await userEvent.click(screen.getByRole('button', { name: /Ana Sayfa/ }));

    expect(window.location.href).toBe('/');
  });
});
