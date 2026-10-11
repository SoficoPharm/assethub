import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { NotificationService } from '../../core/notification.service';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';

import {
  ProfileDto,
  ProfileService
} from '../../services/profile.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  providers: [DatePipe],
  templateUrl: './profile.html',
  styleUrls: ['./profile.scss']
})
export class Profile implements OnInit {
  private readonly notify = inject(NotificationService);

  profile: ProfileDto | null = null;

  loading = false;
  errorMessage = '';

  currentPassword = '';
  newPassword = '';
  confirmPassword = '';
  changingPassword = false;

  constructor(
    private readonly profileService: ProfileService,
    private readonly datePipe: DatePipe,
    private readonly cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadProfile();
  }

  loadProfile(): void {

    this.loading = true;
    this.errorMessage = '';

    this.profileService.getMyProfile()
      .pipe(
        finalize(() => {
          this.loading = false;

          // ✅ solve double click issue
          this.cdr.detectChanges();
        })
      )
      .subscribe({

        next: (res) => {

          this.profile = res;

          // ✅ force UI refresh
          this.cdr.detectChanges();
        },

        error: (err) => {

          console.error('Profile error:', err);

          this.errorMessage =
            `Failed to load profile. Status: ${err.status || 'error'}`;

          this.cdr.detectChanges();
        }
      });
  }

  changePassword(): void {
    if (this.changingPassword) return;

    if (!this.currentPassword || !this.newPassword) {
      this.notify.error('Please enter your current and new password.');
      return;
    }

    if (this.newPassword.length < 8) {
      this.notify.error('New password must be at least 8 characters.');
      return;
    }

    if (this.newPassword !== this.confirmPassword) {
      this.notify.error('New passwords do not match.');
      return;
    }

    this.changingPassword = true;

    this.profileService.changePassword({
      currentPassword: this.currentPassword,
      newPassword: this.newPassword
    })
      .pipe(finalize(() => {
        this.changingPassword = false;
        this.cdr.detectChanges();
      }))
      .subscribe({
        next: () => {
          this.currentPassword = '';
          this.newPassword = '';
          this.confirmPassword = '';
          this.notify.success('Password changed successfully');
        },
        error: err => this.notify.apiError(err, 'Failed to change password.')
      });
  }

  get fullName(): string {
    return this.profile?.fullName || 'N/A';
  }

  get userName(): string {
    return this.profile?.userName || 'N/A';
  }

  get email(): string {
    return this.profile?.email || 'N/A';
  }

  get department(): string {
    return this.profile?.department || 'N/A';
  }

  get role(): string {
    return this.profile?.role || 'N/A';
  }

  get status(): string {
    return this.profile?.isActive ? 'Active' : 'Inactive';
  }

  get joinedDate(): string {

    return this.profile?.createdAt
      ? this.datePipe.transform(
          this.profile.createdAt,
          'MMM d, y'
        ) || 'N/A'
      : 'N/A';
  }

  get initials(): string {

    return this.fullName
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map(x => x[0].toUpperCase())
      .join('') || 'U';
  }
}