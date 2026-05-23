import React, { useState, useEffect, forwardRef } from 'react';
import 'react-phone-number-input/style.css';
import PhoneInputLib from 'react-phone-number-input';
import { fetchClinicSettings } from '../../services/api';

interface PhoneInputProps {
  value: string;
  onChange: (value: string | undefined) => void;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  id?: string;
}

const CustomInput = forwardRef<HTMLInputElement, any>((props, ref) => {
  return (
    <input
      {...props}
      ref={ref}
      className={`flex h-10 w-full rounded-md border border-gray-200 bg-transparent px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-400 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm ${props.className || ''}`}
    />
  );
});

CustomInput.displayName = 'CustomInput';

export function PhoneInput({ value, onChange, disabled, required, className, id }: PhoneInputProps) {
  const [defaultCountry, setDefaultCountry] = useState<any>('TR');

  useEffect(() => {
    fetchClinicSettings()
      .then((res) => {
        setDefaultCountry(res.default_country || 'TR');
      })
      .catch(() => {});
  }, []);

  return (
    <div className={`phone-input-wrapper ${className || ''}`}>
      <PhoneInputLib
        id={id}
        defaultCountry={defaultCountry}
        limitMaxLength={true}
        value={value || undefined}
        onChange={onChange}
        disabled={disabled}
        inputComponent={CustomInput}
        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
      />
    </div>
  );
}
