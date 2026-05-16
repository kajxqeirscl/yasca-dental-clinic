import * as React from 'react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
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
          {date ? format(parsedDate!, 'dd.MM.yyyy', { locale: tr }) : <span>Tarih seçin</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={parsedDate}
          onSelect={handleSelect}
          initialFocus
          locale={tr}
          disabled={parsedMinDate ? (d) => d < parsedMinDate : undefined}
        />
      </PopoverContent>
    </Popover>
  );
}
