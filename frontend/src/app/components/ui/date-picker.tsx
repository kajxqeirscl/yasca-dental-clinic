import * as React from 'react';
import { format } from 'date-fns';
import { tr, enUS } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';
import i18n from '../../utils/i18n';
import { Calendar as CalendarIcon } from 'lucide-react';
import { cn } from './utils';
import { Button } from './button';
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
}

export function DatePicker({ date, onDateChange, className, minDate }: DatePickerProps) {
  const { i18n } = useTranslation();
  // Parse incoming date string into a Date object for the calendar
  const parsedDate = date ? new Date(date) : undefined;
  
  // Create a minDate object if provided
  const parsedMinDate = minDate ? new Date(minDate) : undefined;

  const handleSelect = (newDate: Date | undefined) => {
    if (newDate) {
      // Convert to local YYYY-MM-DD string to avoid timezone shifts
      const year = newDate.getFullYear();
      const month = String(newDate.getMonth() + 1).padStart(2, '0');
      const day = String(newDate.getDate()).padStart(2, '0');
      onDateChange(`${year}-${month}-${day}`);
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={'outline'}
          className={cn(
            'w-full justify-start text-left font-normal bg-white',
            !date && 'text-muted-foreground',
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? format(parsedDate!, i18n.language.startsWith('tr') ? 'dd.MM.yyyy' : 'MM/dd/yyyy', { locale: i18n.language.startsWith('tr') ? tr : enUS }) : <span>Tarih seçin</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={parsedDate}
          onSelect={handleSelect}
          initialFocus
          locale={i18n.language.startsWith('tr') ? tr : enUS}
          disabled={parsedMinDate ? (d) => d < parsedMinDate : undefined}
          captionLayout="dropdown-buttons"
          fromYear={1900}
          toYear={new Date().getFullYear() + 5}
        />
      </PopoverContent>
    </Popover>
  );
}
