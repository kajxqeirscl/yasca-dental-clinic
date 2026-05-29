/**
 * useClinicNavigate hook tests.
 *
 * Bu hook son commit'lerde (eeb1357) multi-tenant routing bug fix'i olarak
 * eklendi. Davranış:
 *   - TENANT_SUBDOMAIN = ""  →  navigate(path) ham çağrılır (lokal subdomain mode).
 *   - TENANT_SUBDOMAIN = "ali" + absolute "/dashboard"  →  navigate("/app/ali/dashboard").
 *   - Relative path her durumda olduğu gibi geçer.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ReactNode } from 'react';

const navigateMock = vi.fn();

// react-router-dom'un useNavigate'ini mock'la
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

// TENANT_SUBDOMAIN değerini test başına ayarlamak için api modülünü mock'la.
let mockTenantSubdomain = '';
vi.mock('../services/api', () => ({
  get TENANT_SUBDOMAIN() {
    return mockTenantSubdomain;
  },
}));

// Mock'lar tanımlandıktan sonra hook'u import et.
import { useClinicNavigate } from './useClinicNavigate';

const wrapper = ({ children }: { children: ReactNode }) => (
  <MemoryRouter>{children}</MemoryRouter>
);

beforeEach(() => {
  navigateMock.mockClear();
  mockTenantSubdomain = '';
});

describe('useClinicNavigate', () => {
  describe('lokal subdomain modu (TENANT_SUBDOMAIN boş)', () => {
    it('absolute path olduğu gibi navigate edilir', () => {
      mockTenantSubdomain = '';
      const { result } = renderHook(() => useClinicNavigate(), { wrapper });

      act(() => result.current('/dashboard'));

      expect(navigateMock).toHaveBeenCalledWith('/dashboard');
    });

    it('relative path olduğu gibi navigate edilir', () => {
      mockTenantSubdomain = '';
      const { result } = renderHook(() => useClinicNavigate(), { wrapper });

      act(() => result.current('patients'));

      expect(navigateMock).toHaveBeenCalledWith('patients');
    });
  });

  describe('canlı path modu (TENANT_SUBDOMAIN dolu)', () => {
    it('absolute path /app/{slug} prefix\'i ile navigate edilir', () => {
      mockTenantSubdomain = 'ali';
      const { result } = renderHook(() => useClinicNavigate(), { wrapper });

      act(() => result.current('/dashboard'));

      expect(navigateMock).toHaveBeenCalledWith('/app/ali/dashboard');
    });

    it('kök path "/" basePath\'e karşılık gelir', () => {
      mockTenantSubdomain = 'beta';
      const { result } = renderHook(() => useClinicNavigate(), { wrapper });

      act(() => result.current('/'));

      expect(navigateMock).toHaveBeenCalledWith('/app/beta/');
    });

    it('relative path tenant prefix EKLENMEDEN navigate edilir', () => {
      mockTenantSubdomain = 'ali';
      const { result } = renderHook(() => useClinicNavigate(), { wrapper });

      act(() => result.current('patients/1'));

      expect(navigateMock).toHaveBeenCalledWith('patients/1');
    });

    it('birden fazla nested path düzgün birleştirilir', () => {
      mockTenantSubdomain = 'standard';
      const { result } = renderHook(() => useClinicNavigate(), { wrapper });

      act(() => result.current('/patients/123/edit'));

      expect(navigateMock).toHaveBeenCalledWith('/app/standard/patients/123/edit');
    });
  });
});
