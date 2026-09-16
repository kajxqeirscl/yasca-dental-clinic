import { describe, it, expect } from 'vitest';
import { formatCurrency, CURRENCY_SYMBOLS, CURRENCY_LABELS } from './currency';

describe('currency utility', () => {
  it('correctly maps currency symbols', () => {
    expect(CURRENCY_SYMBOLS.TRY).toBe('₺');
    expect(CURRENCY_SYMBOLS.USD).toBe('$');
  });

  it('correctly maps currency labels', () => {
    expect(CURRENCY_LABELS.TRY).toBe('TRY (₺)');
    expect(CURRENCY_LABELS.USD).toBe('USD ($)');
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

  it('handles null, undefined and invalid amounts gracefully', () => {
    expect(formatCurrency(null, 'TRY')).toContain('0,00');
    expect(formatCurrency(undefined, 'USD')).toBe('$0.00');
    expect(formatCurrency('abc', 'USD')).toBe('$0.00');
  });
});
