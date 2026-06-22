/**
 * Unit tests for the API service layer (api.ts).
 * MSW intercepts all fetch() calls — no real network activity.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '../../mocks/server';
import {
  login,
  fetchCurrentUser,
  fetchPatients,
  clearAuth,
  setTokens,
  setTenantSlug,
  getAccessToken,
  getRefreshToken,
} from './api';

const BASE = 'http://localhost:8000/api';

// MSW setup/teardown setupTests.ts içinde global olarak yapılıyor.

// ─── Auth helpers ─────────────────────────────────────────────────────────────

describe('clearAuth', () => {
  it('removes both tokens from localStorage', () => {
    setTokens('acc', 'ref');
    expect(getAccessToken()).toBe('acc');
    clearAuth();
    expect(getAccessToken()).toBeNull();
    expect(getRefreshToken()).toBeNull();
  });
});

// ─── login() ──────────────────────────────────────────────────────────────────

describe('login()', () => {
  it('stores tokens on success', async () => {
    await login('user', 'pass');
    expect(getAccessToken()).toBe('mock-access-token');
    expect(getRefreshToken()).toBe('mock-refresh-token');
  });

  it('throws with error message on 401', async () => {
    server.use(
      http.post(`${BASE}/auth/token/`, () =>
        HttpResponse.json({ detail: 'Giriş bilgileri hatalı.' }, { status: 401 })
      )
    );
    await expect(login('user', 'wrongpass')).rejects.toThrow('Giriş bilgileri hatalı.');
  });
});

// ─── fetchWithAuth (via fetchCurrentUser) ─────────────────────────────────────

describe('fetchWithAuth() Authorization header', () => {
  it('includes Bearer token in requests', async () => {
    setTokens('my-token', 'ref');
    let capturedAuth = '';
    server.use(
      http.get(`${BASE}/auth/me/`, ({ request }) => {
        capturedAuth = request.headers.get('Authorization') ?? '';
        return HttpResponse.json({ id: 1, username: 'u', role: 'doctor' });
      })
    );
    await fetchCurrentUser();
    expect(capturedAuth).toBe('Bearer my-token');
  });

  it('refreshes token on 401 and retries', async () => {
    setTokens('expired-token', 'valid-refresh');
    let callCount = 0;
    server.use(
      http.get(`${BASE}/auth/me/`, () => {
        callCount++;
        if (callCount === 1) {
          return HttpResponse.json({ detail: 'token invalid' }, { status: 401 });
        }
        return HttpResponse.json({ id: 1, username: 'u', role: 'doctor' });
      }),
      http.post(`${BASE}/auth/token/refresh/`, () =>
        HttpResponse.json({ access: 'refreshed-token', refresh: 'new-refresh' })
      )
    );
    const user = await fetchCurrentUser();
    expect(user.username).toBe('u');
    expect(getAccessToken()).toBe('refreshed-token');
  });

  it('dispatches auth-logout event when refresh also fails', async () => {
    setTokens('expired', 'bad-refresh');
    let logoutFired = false;
    window.addEventListener('auth-logout', () => { logoutFired = true; }, { once: true });

    server.use(
      http.get(`${BASE}/auth/me/`, () =>
        HttpResponse.json({ detail: 'unauthorized' }, { status: 401 })
      ),
      http.post(`${BASE}/auth/token/refresh/`, () =>
        HttpResponse.json({ detail: 'invalid refresh' }, { status: 401 })
      )
    );

    await expect(fetchCurrentUser()).rejects.toThrow();
    expect(logoutFired).toBe(true);
  });
});

// ─── fetchPatients() ──────────────────────────────────────────────────────────

describe('fetchPatients()', () => {
  beforeEach(() => setTokens('tok', 'ref'));

  it('extracts .results from a paginated DRF response', async () => {
    const patients = await fetchPatients();
    expect(Array.isArray(patients)).toBe(true);
    expect(patients[0].first_name).toBe('Ali');
  });

  it('works when response is a plain array (non-paginated)', async () => {
    server.use(
      http.get(`${BASE}/patients/`, () =>
        HttpResponse.json([{ id: 2, first_name: 'Fatma', last_name: 'Kaya', phone: '0555' }])
      )
    );
    const patients = await fetchPatients();
    expect(patients[0].first_name).toBe('Fatma');
  });

  it('passes search param in query string', async () => {
    let capturedUrl = '';
    server.use(
      http.get(`${BASE}/patients/`, ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.json({ results: [] });
      })
    );
    await fetchPatients('mehmet');
    expect(capturedUrl).toContain('search=mehmet');
  });
});

// ─── X-Tenant header ──────────────────────────────────────────────────────────

describe('X-Tenant header', () => {
  afterEach(() => setTenantSlug(''));

  it('setTenantSlug sonrası fetchCurrentUser X-Tenant header gönderir', async () => {
    setTenantSlug('ali');
    setTokens('tok', 'ref');
    let capturedHeader: string | null = null;
    server.use(
      http.get(`${BASE}/auth/me/`, ({ request }) => {
        capturedHeader = request.headers.get('X-Tenant');
        return HttpResponse.json({ id: 1, username: 'x', role: 'doctor' });
      })
    );

    await fetchCurrentUser();

    expect(capturedHeader).toBe('ali');
  });

  it('TENANT_SUBDOMAIN boşken X-Tenant header gönderilmez', async () => {
    setTenantSlug('');
    setTokens('tok', 'ref');
    let capturedHeader: string | null = null;
    server.use(
      http.get(`${BASE}/auth/me/`, ({ request }) => {
        capturedHeader = request.headers.get('X-Tenant');
        return HttpResponse.json({ id: 1, username: 'x', role: 'doctor' });
      })
    );

    await fetchCurrentUser();

    expect(capturedHeader).toBeNull();
  });

  it('login() çağrısında da X-Tenant header bulunur', async () => {
    setTenantSlug('beta');
    let capturedHeader: string | null = null;
    server.use(
      http.post(`${BASE}/auth/token/`, ({ request }) => {
        capturedHeader = request.headers.get('X-Tenant');
        return HttpResponse.json({ access: 'a', refresh: 'r' });
      })
    );

    await login('u', 'p');

    expect(capturedHeader).toBe('beta');
  });

  it('refresh token isteğinde X-Tenant taşınır', async () => {
    setTenantSlug('standard');
    setTokens('expired', 'good-refresh');
    let refreshHeader: string | null = null;

    server.use(
      http.get(`${BASE}/auth/me/`, () =>
        HttpResponse.json({ detail: 'unauth' }, { status: 401 })
      ),
      http.post(`${BASE}/auth/token/refresh/`, ({ request }) => {
        refreshHeader = request.headers.get('X-Tenant');
        return HttpResponse.json({ access: 'new', refresh: 'new-ref' });
      })
    );

    // fetchCurrentUser 401 alır → refresh tetiklenir → tekrar 401 → clearAuth
    await fetchCurrentUser().catch(() => {});

    expect(refreshHeader).toBe('standard');
  });
});

// ─── parseApiError ────────────────────────────────────────────────────────────

describe('parseApiError', () => {
  it('null/undefined için default mesaj döner', async () => {
    const { parseApiError } = await import('./api');
    expect(parseApiError(null)).toBe('Bir hata oluştu');
    expect(parseApiError(undefined, 'custom')).toBe('custom');
  });

  it('string error olduğu gibi döner', async () => {
    const { parseApiError } = await import('./api');
    expect(parseApiError('hata var')).toBe('hata var');
  });

  it('detail alanı varsa onu kullanır', async () => {
    const { parseApiError } = await import('./api');
    expect(parseApiError({ detail: 'Kimlik doğrulanmadı' })).toBe(
      'Kimlik doğrulanmadı',
    );
  });

  it('field-level array hatalarını birleştirir', async () => {
    const { parseApiError } = await import('./api');
    expect(
      parseApiError({
        first_name: ['Boş bırakılamaz.'],
        phone: ['Geçersiz format.'],
      }),
    ).toContain('Boş bırakılamaz.');
  });

  it('nested object hatalarını da çözer', async () => {
    const { parseApiError } = await import('./api');
    expect(
      parseApiError({
        anamnesis: { medical_history: ['Çok uzun.'] },
      }),
    ).toContain('Çok uzun.');
  });
});
