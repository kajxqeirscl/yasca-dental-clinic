/**
 * Formats a date string or Date object into DD.MM.YYYY format.
 * Ensures consistent date display across the entire application,
 * avoiding browser-specific locale inconsistencies.
 */
export function formatDateDDMMYYYY(dateInput: string | Date | undefined | null): string {
  if (!dateInput) return '-';
  
  try {
    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    
    // Check if the date is valid
    if (isNaN(date.getTime())) return '-';

    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();

    return `${day}.${month}.${year}`;
  } catch (err) {
    return '-';
  }
}
