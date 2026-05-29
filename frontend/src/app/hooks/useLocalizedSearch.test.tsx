/**
 * useLocalizedSearch testleri.
 *
 * Türkçe karakterli arama (i/İ collation, ş, ğ) hatalarını yakalamak için
 * locale-aware toLocaleLowerCase davranışını doğrular.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';
import i18n from '../utils/i18n';
import { useLocalizedSearch } from './useLocalizedSearch';

const wrapper = ({ children }: { children: ReactNode }) => (
  <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
);

describe('useLocalizedSearch', () => {
  describe('Türkçe (tr) locale', () => {
    beforeEach(async () => {
      await i18n.changeLanguage('tr');
    });

    it('lang tr-TR olarak raporlanır', () => {
      const { result } = renderHook(() => useLocalizedSearch(), { wrapper });
      expect(result.current.lang).toBe('tr-TR');
    });

    it('Türkçe büyük İ küçük i\'ye dönüşür', () => {
      const { result } = renderHook(() => useLocalizedSearch(), { wrapper });
      expect(result.current.normalize('İSTANBUL')).toBe('istanbul');
    });

    it('match boş query için her zaman true döner', () => {
      const { result } = renderHook(() => useLocalizedSearch(), { wrapper });
      expect(result.current.match('Ali Yılmaz', '')).toBe(true);
    });

    it('Türkçe karakterli substring eşleşmesi', () => {
      const { result } = renderHook(() => useLocalizedSearch(), { wrapper });
      expect(result.current.match('Ahmet Şentürk', 'şentürk')).toBe(true);
      expect(result.current.match('Ahmet Şentürk', 'ŞENTÜRK')).toBe(true);
    });

    it('boş/null text güvenli şekilde işlenir', () => {
      const { result } = renderHook(() => useLocalizedSearch(), { wrapper });
      expect(result.current.normalize(null)).toBe('');
      expect(result.current.normalize(undefined)).toBe('');
      expect(result.current.match(null, 'ali')).toBe(false);
    });

    it('eşleşmeyen query false döner', () => {
      const { result } = renderHook(() => useLocalizedSearch(), { wrapper });
      expect(result.current.match('Ali Yılmaz', 'ahmet')).toBe(false);
    });
  });

  describe('İngilizce (en) locale', () => {
    beforeEach(async () => {
      await i18n.changeLanguage('en');
    });

    it('lang en-US olarak raporlanır', () => {
      const { result } = renderHook(() => useLocalizedSearch(), { wrapper });
      expect(result.current.lang).toBe('en-US');
    });
  });
});
