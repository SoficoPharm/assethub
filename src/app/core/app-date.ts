import { Pipe, PipeTransform } from '@angular/core';

/**
 * The API returns every timestamp as ISO 8601 UTC ("...Z"). All dates are shown in
 * Egypt local time regardless of the browser's own time zone. Intl handles Egypt's DST,
 * which Angular's DatePipe (fixed offsets only) cannot.
 */
export const APP_TIME_ZONE = 'Africa/Cairo';

export type AppDateFormat = 'date' | 'datetime';

const formatters: Record<AppDateFormat, Intl.DateTimeFormat> = {
  date: new Intl.DateTimeFormat('en-US', {
    timeZone: APP_TIME_ZONE,
    year: 'numeric',
    month: 'short',
    day: '2-digit'
  }),
  datetime: new Intl.DateTimeFormat('en-US', {
    timeZone: APP_TIME_ZONE,
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23'
  })
};

const yearFormatter = new Intl.DateTimeFormat('en-US', { timeZone: APP_TIME_ZONE, year: 'numeric' });

function toDate(value: string | Date | null | undefined): Date | null {
  if (!value) return null;

  const date = value instanceof Date ? value : new Date(value);
  return isNaN(date.getTime()) ? null : date;
}

/** "Oct 11, 2026" or "Oct 11, 2026, 15:49" in Egypt time; `fallback` for empty/invalid values. */
export function formatAppDate(
  value: string | Date | null | undefined,
  format: AppDateFormat = 'date',
  fallback = '—'
): string {
  const date = toDate(value);
  return date ? formatters[format].format(date) : fallback;
}

/** Calendar year of the instant in Egypt time. */
export function appYear(value: string | Date): number {
  const date = toDate(value) ?? new Date();
  return Number(yearFormatter.format(date));
}

@Pipe({ name: 'appDate', standalone: true })
export class AppDatePipe implements PipeTransform {
  transform(value: string | Date | null | undefined, format: AppDateFormat = 'date', fallback = '—'): string {
    return formatAppDate(value, format, fallback);
  }
}
