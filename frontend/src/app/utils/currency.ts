export type CurrencyCode = 'TRY' | 'USD';

export const CURRENCY_SYMBOLS: Record<CurrencyCode, string> = {
  TRY: '₺',
  USD: '$',
};

export const CURRENCY_LABELS: Record<CurrencyCode, string> = {
  TRY: 'TRY (₺)',
  USD: 'USD ($)',
};

export function formatCurrency(
  amount: number | string | null | undefined,
  currency: CurrencyCode | string = 'TRY'
): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : (amount ?? 0);
  const validNum = isNaN(num) ? 0 : num;
  const curr = (currency?.toUpperCase() === 'USD' ? 'USD' : 'TRY') as CurrencyCode;

  if (curr === 'USD') {
    return `$${validNum.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }

  return `${validNum.toLocaleString('tr-TR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} ₺`;
}
