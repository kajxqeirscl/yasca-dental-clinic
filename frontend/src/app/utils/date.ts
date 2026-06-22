import i18n from './i18n';

export function formatDate(dateInput: string | Date | undefined | null): string {
  if (!dateInput) return '-';
  try {
    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    if (isNaN(date.getTime())) return '-';
    
    const lang = i18n.language || 'tr';
    if (lang.startsWith('tr')) {
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear();
      return `${day}.${month}.${year}`;
    }
    return new Intl.DateTimeFormat(i18n.language).format(date);
  } catch (err) {
    return '-';
  }
}

export function formatTimeStr(timeString: string | undefined | null): string {
  if (!timeString) return '-';
  const match = timeString.match(/^(\d{2}):(\d{2})/);
  if (!match) return timeString;
  const [_, hh, mm] = match;
  
  const lang = i18n.language || 'tr';
  if (lang.startsWith('tr')) {
    return `${hh}.${mm}`;
  }
  const date = new Date();
  date.setHours(parseInt(hh, 10), parseInt(mm, 10));
  return new Intl.DateTimeFormat(i18n.language, { hour: 'numeric', minute: '2-digit' }).format(date);
}

export function formatTimeFromHour(hour: number): string {
  const lang = i18n.language || 'tr';
  if (lang.startsWith('tr')) {
    return `${hour.toString().padStart(2, '0')}.00`;
  }
  const date = new Date();
  date.setHours(hour, 0);
  return new Intl.DateTimeFormat(i18n.language, { hour: 'numeric', minute: '2-digit' }).format(date);
}
