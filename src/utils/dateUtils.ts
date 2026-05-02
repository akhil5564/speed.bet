/**
 * Date utility functions for IST (Indian Standard Time - UTC+5:30)
 * These functions ensure dates are formatted correctly without timezone conversion issues
 */

/**
 * Format a date to YYYY-MM-DD string using local time (IST)
 * This avoids timezone issues where toISOString() converts to UTC
 */
export function formatDateIST(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Get current date in IST format (YYYY-MM-DD)
 */
export function getCurrentDateIST(): string {
  return formatDateIST(new Date());
}

/**
 * Parse a date string (YYYY-MM-DD) to Date object in local timezone
 */
export function parseDateIST(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}

/**
 * Get start of day in IST (00:00:00 local time)
 */
export function getStartOfDayIST(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Get end of day in IST (23:59:59.999 local time)
 */
export function getEndOfDayIST(date: Date): Date {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

