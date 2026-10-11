import { Component, inject } from '@angular/core';
import { NotificationService } from '../../core/notification.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  template: `
    @if (notifications.toast(); as toast) {
      <div class="app-toast" [class.error]="toast.type === 'error'" role="status">
        {{ toast.message }}
      </div>
    }
  `,
  styles: `
    .app-toast {
      position: fixed;
      right: 24px;
      top: 90px;
      z-index: 9999;
      background: #35b77c;
      color: #fff;
      padding: 13px 18px;
      border-radius: 10px;
      font-size: 14px;
      font-weight: 700;
      box-shadow: 0 10px 30px rgba(16, 24, 40, 0.18);
    }

    .app-toast.error {
      background: #dc2626;
    }
  `
})
export class Toast {
  protected readonly notifications = inject(NotificationService);
}
