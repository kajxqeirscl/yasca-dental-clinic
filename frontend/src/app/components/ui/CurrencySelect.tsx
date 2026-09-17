import React from 'react';
import { SUPPORTED_CURRENCIES } from '../../utils/currency';

interface CurrencySelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  showAllOption?: boolean;
  allOptionLabel?: string;
  className?: string;
}

export const CurrencySelect: React.FC<CurrencySelectProps> = ({
  value,
  onChange,
  showAllOption = false,
  allOptionLabel = 'Tüm Para Birimleri',
  className = '',
  disabled = false,
  ...props
}) => {
  return (
    <select
      value={value}
      onChange={onChange}
      disabled={disabled}
      className={`h-10 px-3 border rounded-md bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium disabled:opacity-75 disabled:bg-gray-100 ${className}`}
      {...props}
    >
      {showAllOption && <option value="">{allOptionLabel}</option>}
      {SUPPORTED_CURRENCIES.map((c) => (
        <option key={c.code} value={c.code}>
          {c.symbol} {c.code}
        </option>
      ))}
    </select>
  );
};

export default CurrencySelect;