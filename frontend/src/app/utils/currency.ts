export interface CurrencyOption {
  code: string;
  symbol: string;
  label: string;
  locale: string;
}

export const SUPPORTED_CURRENCIES: CurrencyOption[] = [
  { code: 'TRY', symbol: '₺', label: 'TRY (₺)', locale: 'tr-TR' },
  { code: 'USD', symbol: '$', label: 'USD ($)', locale: 'en-US' },
  { code: 'EUR', symbol: '€', label: 'EUR (€)', locale: 'de-DE' },
  { code: 'GBP', symbol: '£', label: 'GBP (£)', locale: 'en-GB' },
];

export type CurrencyCode = 'TRY' | 'USD' | 'EUR' | 'GBP' | (string & {});

export const CURRENCY_SYMBOLS: Record<string, string> = {
  TRY: '₺',
  USD: '$',
  EUR: '€',
  GBP: '£',
};

export const CURRENCY_LABELS: Record<string, string> = {
  TRY: 'TRY (₺)',
  USD: 'USD ($)',
  EUR: 'EUR (€)',
  GBP: 'GBP (£)',
};

export function getCurrencySymbol(currency?: string): string {
  if (!currency) return '₺';
  const upper = currency.toUpperCase();
  return CURRENCY_SYMBOLS[upper] || upper;
}

export function formatCurrency(
  amount: number | string | null | undefined,
  currency: CurrencyCode | string = 'TRY'
): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : (amount ?? 0);
  const validNum = isNaN(num) ? 0 : num;
  const code = (currency || 'TRY').toUpperCase();

  const config = SUPPORTED_CURRENCIES.find((c) => c.code === code);

  // Specific custom formatters for consistent display
  if (code === 'TRY') {
    return `${validNum.toLocaleString('tr-TR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })} ₺`;
  }

  if (code === 'USD') {
    return `$${validNum.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }

  // Generic Intl formatter for EUR, GBP, or any ISO currency code
  try {
    const locale = config?.locale || (code === 'EUR' ? 'de-DE' : 'en-US');
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: code,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(validNum);
  } catch {
    // Graceful fallback for non-ISO or custom currency codes
    const symbol = getCurrencySymbol(code);
    return `${symbol} ${validNum.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }
}
