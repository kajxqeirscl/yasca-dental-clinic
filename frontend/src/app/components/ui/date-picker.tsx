import * as React from 'react';
import { format, parse, isValid } from 'date-fns';
import { tr, enUS } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';
import { Calendar as CalendarIcon } from 'lucide-react';
import { cn } from './utils';
import { Button } from './button';
import { Input } from './input';
import { Calendar } from './calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from './popover';

interface DatePickerProps {
  date: string | undefined; // YYYY-MM-DD or ISO string
  onDateChange: (date: string) => void;
  className?: string;
  minDate?: string;
  maxDate?: string;
  required?: boolean;
}

export function DatePicker({ date, onDateChange, className, minDate, maxDate, required }: DatePickerProps) {
  const { i18n } = useTranslation();
  const isTr = i18n.language.startsWith('tr');
  const dateFormat = isTr ? 'dd.MM.yyyy' : 'MM/dd/yyyy';
  const locale = isTr ? tr : enUS;

  const [inputValue, setInputValue] = React.useState('');
  const [isOpen, setIsOpen] = React.useState(false);

  // Sync prop 'date' (YYYY-MM-DD) to 'inputValue' (dd.MM.yyyy or MM/dd/yyyy)
  React.useEffect(() => {
    if (date) {
      const parsed = new Date(date);
      if (isValid(parsed)) {
        setInputValue(format(parsed, dateFormat, { locale }));
      } else {
        setInputValue('');
      }
    } else {
      setInputValue('');
    }
  }, [date, dateFormat, locale]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputValue(val);
    
    // Attempt to parse the date from user input
    // parse requires the exact format length, so we ensure it's fully typed before sending to parent
    const parsed = parse(val, dateFormat, new Date(), { locale });
    if (isValid(parsed) && val.length === dateFormat.length) {
      const yyyy = parsed.getFullYear();
      const mm = String(parsed.getMonth() + 1).padStart(2, '0');
      const dd = String(parsed.getDate()).padStart(2, '0');
      onDateChange(`${yyyy}-${mm}-${dd}`);
    } else if (val === '') {
      onDateChange('');
    }
  };

  const handleBlur = () => {
    // If the input is not empty but doesn't form a valid exactly-matching date, clear it
    if (inputValue !== '') {
      const parsed = parse(inputValue, dateFormat, new Date(), { locale });
      if (!isValid(parsed) || inputValue.length !== dateFormat.length) {
        setInputValue('');
        onDateChange('');
      }
    }
  };

  const handleSelect = (newDate: Date | undefined) => {
    if (newDate) {
      const yyyy = newDate.getFullYear();
      const mm = String(newDate.getMonth() + 1).padStart(2, '0');
      const dd = String(newDate.getDate()).padStart(2, '0');
      onDateChange(`${yyyy}-${mm}-${dd}`);
      setIsOpen(false);
    } else {
      onDateChange('');
    }
  };

  const parsedDate = date ? new Date(date) : undefined;
  const parsedMin = minDate ? new Date(minDate) : undefined;
  const parsedMax = maxDate ? new Date(maxDate) : undefined;

  return (
    <div className={cn("relative w-full", className)}>
      <Input
        type="text"
        placeholder={isTr ? "GG.AA.YYYY" : "MM/DD/YYYY"}
        value={inputValue}
        onChange={handleInputChange}
        onBlur={handleBlur}
        required={required}
        className="pr-10 w-full"
      />
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            type="button"
            className="absolute right-0 top-0 h-10 w-10 text-gray-400 hover:text-gray-900"
          >
            <CalendarIcon className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="end">
          <Calendar
            mode="single"
            selected={parsedDate}
            onSelect={handleSelect}
            initialFocus
            locale={locale}
            disabled={(d) => {
              const current = new Date(d);
              current.setHours(0, 0, 0, 0);
              let disabled = false;
              if (parsedMin) {
                const min = new Date(parsedMin);
                min.setHours(0, 0, 0, 0);
                if (current < min) disabled = true;
              }
              if (parsedMax) {
                const max = new Date(parsedMax);
                max.setHours(0, 0, 0, 0);
                if (current > max) disabled = true;
              }
              return disabled;
            }}
            captionLayout="dropdown-buttons"
            fromYear={1900}
            toYear={new Date().getFullYear() + 5}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
