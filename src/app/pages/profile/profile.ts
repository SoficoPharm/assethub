import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
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

  profile: ProfileDto | null = null;

  loading = false;
  errorMessage = '';

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