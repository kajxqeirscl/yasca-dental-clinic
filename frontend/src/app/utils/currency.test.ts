import { describe, it, expect } from 'vitest';
import {
  formatCurrency,
  getCurrencySymbol,
  CURRENCY_SYMBOLS,
  CURRENCY_LABELS,
  SUPPORTED_CURRENCIES,
} from './currency';

describe('currency utility', () => {
  it('correctly maps currency symbols', () => {
    expect(CURRENCY_SYMBOLS.TRY).toBe('₺');
    expect(CURRENCY_SYMBOLS.USD).toBe('$');
    expect(CURRENCY_SYMBOLS.EUR).toBe('€');
    expect(CURRENCY_SYMBOLS.GBP).toBe('£');
  });

  it('correctly maps currency labels', () => {
    expect(CURRENCY_LABELS.TRY).toBe('TRY (₺)');
    expect(CURRENCY_LABELS.USD).toBe('USD ($)');
    expect(CURRENCY_LABELS.EUR).toBe('EUR (€)');
    expect(CURRENCY_LABELS.GBP).toBe('GBP (£)');
  });

  it('returns currency symbol safely via getCurrencySymbol', () => {
    expect(getCurrencySymbol('TRY')).toBe('₺');
    expect(getCurrencySymbol('USD')).toBe('$');
    expect(getCurrencySymbol('EUR')).toBe('€');
    expect(getCurrencySymbol('GBP')).toBe('£');
    expect(getCurrencySymbol('CAD')).toBe('CAD');
    expect(getCurrencySymbol('')).toBe('₺');
  });

  it('formats TRY numbers correctly', () => {
    const formatted = formatCurrency(1500, 'TRY');
    expect(formatted).toContain('1.500,00');
    expect(formatted).toContain('₺');
  });

  it('formats USD numbers correctly', () => {
    const formatted = formatCurrency(250.5, 'USD');
    expect(formatted).toBe('$250.50');
  });

  it('formats EUR numbers correctly', () => {
    const formatted = formatCurrency(120.75, 'EUR');
    expect(formatted).toContain('120,75');
    expect(formatted).toContain('€');
  });

  it('formats GBP numbers correctly', () => {
    const formatted = formatCurrency(80.25, 'GBP');
    expect(formatted).toContain('80.25');
    expect(formatted).toContain('£');
  });

  it('handles null, undefined and invalid amounts gracefully', () => {
    expect(formatCurrency(null, 'TRY')).toContain('0,00');
    expect(formatCurrency(undefined, 'USD')).toBe('$0.00');
    expect(formatCurrency('abc', 'USD')).toBe('$0.00');
  });
});
