/**
 * Unit tests for AuthContext — loading state, login, logout, token refresh.
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, act, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server } from '../../mocks/server';
import { AuthProvider, useAuth } from './AuthContext';
import { setTokens } from '../services/api';

const BASE = 'http://localhost:8000/api';

// MSW setup/teardown setupTests.ts içinde global olarak yapılıyor.

// Helper component to expose context values
function AuthConsumer() {
  const { user, isAuthenticated, isLoading } = useAuth();
  return (
    <div>
      <span data-testid="loading">{String(isLoading)}</span>
      <span data-testid="auth">{String(isAuthenticated)}</span>
      <span data-testid="role">{user?.role ?? 'none'}</span>
    </div>
  );
}

function renderWithAuth() {
  return render(
    <AuthProvider>
      <AuthConsumer />
    </AuthProvider>
  );
}

describe('AuthContext', () => {
  it('resolves loading state to false after mount', async () => {
    renderWithAuth();
    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('false'));
  });

  it('resolves to unauthenticated when no token exists', async () => {
    renderWithAuth();
    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('false'));
    expect(screen.getByTestId('auth').textContent).toBe('false');
    expect(screen.getByTestId('role').textContent).toBe('none');
  });

  it('resolves to authenticated when a valid token + /me succeed', async () => {
    setTokens('valid-token', 'valid-refresh');
    renderWithAuth();
    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('false'));
    expect(screen.getByTestId('auth').textContent).toBe('true');
    expect(screen.getByTestId('role').textContent).toBe('doctor');
  });

  it('clears user when /me returns an error', async () => {
    setTokens('bad-token', 'bad-refresh');
    server.use(
      http.get(`${BASE}/auth/me/`, () =>
        HttpResponse.json({ detail: 'unauthorized' }, { status: 401 })
      )
    );
    renderWithAuth();
    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('false'));
    expect(screen.getByTestId('auth').textContent).toBe('false');
  });

  it('sets user after login()', async () => {
    function LoginButton() {
      const { login, isAuthenticated } = useAuth();
      return (
        <>
          <button onClick={() => login('u', 'p')}>Login</button>
          <span data-testid="auth">{String(isAuthenticated)}</span>
        </>
      );
    }
    render(
      <AuthProvider>
        <LoginButton />
      </AuthProvider>
    );
    await waitFor(() => {}); // let initial loading settle
    await userEvent.click(screen.getByRole('button', { name: 'Login' }));
    await waitFor(() => expect(screen.getByTestId('auth').textContent).toBe('true'));
  });

  it('clears user after logout()', async () => {
    setTokens('valid-token', 'valid-refresh');
    function LogoutButton() {
      const { logout, isAuthenticated } = useAuth();
      return (
        <>
          <button onClick={logout}>Logout</button>
          <span data-testid="auth">{String(isAuthenticated)}</span>
        </>
      );
    }
    render(
      <AuthProvider>
        <LogoutButton />
      </AuthProvider>
    );
    await waitFor(() => expect(screen.getByTestId('auth').textContent).toBe('true'));
    await userEvent.click(screen.getByRole('button', { name: 'Logout' }));
    expect(screen.getByTestId('auth').textContent).toBe('false');
  });

  it('clears user when auth-logout window event fires', async () => {
    setTokens('valid-token', 'valid-refresh');
    renderWithAuth();
    await waitFor(() => expect(screen.getByTestId('auth').textContent).toBe('true'));
    act(() => { window.dispatchEvent(new Event('auth-logout')); });
    expect(screen.getByTestId('auth').textContent).toBe('false');
  });

  it('useAuth throws when used outside AuthProvider', () => {
    function BadConsumer() {
      useAuth();
      return null;
    }
    // Suppress React's error boundary console output
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<BadConsumer />)).toThrow('useAuth must be used within AuthProvider');
    spy.mockRestore();
  });
});
