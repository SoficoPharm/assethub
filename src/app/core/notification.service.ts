import { Injectable, signal } from '@angular/core';

export interface Toast {
  message: string;
  type: 'success' | 'error';
}

/** One toast for the whole app plus a single place to turn API errors into text. */
@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly current = signal<Toast | null>(null);
  private timer: ReturnType<typeof setTimeout> | null = null;

  readonly toast = this.current.asReadonly();

  success(message: string): void {
    this.show({ message, type: 'success' });
  }

  error(message: string): void {
    this.show({ message, type: 'error' });
  }

  /** Shows the API error message, or `fallback` if the response has none. */
  apiError(err: unknown, fallback: string): void {
    this.error(this.getErrorMessage(err, fallback));
  }

  getErrorMessage(err: any, fallback: string): string {
    if (typeof err?.error === 'string' && err.error) return err.error;
    if (err?.error?.message) return err.error.message;

    if (err?.error?.errors) {
      const errors = err.error.errors;
      return Object.keys(errors)
        .map(key => errors[key].join(', '))
        .join(' | ');
    }

    if (err?.status === 403) return 'You do not have permission to do this.';
    if (err?.status === 0) return 'Cannot reach the server.';

    return fallback;
  }

  private show(toast: Toast): void {
    if (this.timer) clearTimeout(this.timer);

    this.current.set(toast);
    this.timer = setTimeout(() => this.current.set(null), 2500);
  }
}
