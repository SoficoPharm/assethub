import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Observable, finalize } from 'rxjs';
import { NotificationService } from '../../core/notification.service';
import { ALL_ROLES, Role, Roles } from '../../core/roles';
import { AuthService } from '../../services/auth.service';
import { SystemUser, SystemUsersService } from '../../services/system-users.service';

type FormMode = 'create' | 'edit' | 'reset';

const MIN_PASSWORD_LENGTH = 8;

@Component({
  selector: 'app-system-users',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './system-users.html',
  styleUrls: ['./system-users.scss']
})
export class SystemUsers implements OnInit {
  private readonly service = inject(SystemUsersService);
  private readonly notify = inject(NotificationService);
  private readonly auth = inject(AuthService);
  private readonly cdr = inject(ChangeDetectorRef);

  readonly roles = ALL_ROLES;

  users: SystemUser[] = [];
  isLoading = false;
  isSaving = false;
  busyId: number | null = null;

  mode: FormMode = 'create';
  selected: SystemUser | null = null;

  fullName = '';
  userName = '';
  email = '';
  department = '';
  role: Role = Roles.Viewer;
  password = '';
  confirmPassword = '';

  ngOnInit(): void {
    this.loadUsers();
  }

  get currentUserId(): number | undefined {
    return this.auth.currentUser()?.id;
  }

  isSelf(user: SystemUser): boolean {
    return user.id === this.currentUserId;
  }

  /** A SuperAdmin cannot remove their own SuperAdmin role. */
  get roleLocked(): boolean {
    return this.mode === 'edit' && !!this.selected && this.isSelf(this.selected) && this.selected.role === Roles.SuperAdmin;
  }

  get formTitle(): string {
    if (this.mode === 'edit') return 'Edit System User';
    if (this.mode === 'reset') return `Reset Password: ${this.selected?.userName}`;
    return 'Add System User';
  }

  loadUsers(): void {
    this.isLoading = true;

    this.service.getAll()
      .pipe(finalize(() => {
        this.isLoading = false;
        this.cdr.detectChanges();
      }))
      .subscribe({
        next: data => this.users = data ?? [],
        error: err => this.notify.apiError(err, 'Failed to load system users.')
      });
  }

  startEdit(user: SystemUser): void {
    if (this.isSaving) return;

    this.mode = 'edit';
    this.selected = user;
    this.fullName = user.fullName;
    this.userName = user.userName;
    this.email = user.email;
    this.department = user.department;
    this.role = user.role;
    this.password = '';
    this.confirmPassword = '';
  }

  startReset(user: SystemUser): void {
    if (this.isSaving) return;

    this.mode = 'reset';
    this.selected = user;
    this.password = '';
    this.confirmPassword = '';
  }

  resetForm(): void {
    this.mode = 'create';
    this.selected = null;
    this.fullName = '';
    this.userName = '';
    this.email = '';
    this.department = '';
    this.role = Roles.Viewer;
    this.password = '';
    this.confirmPassword = '';
  }

  submit(): void {
    if (this.isSaving) return;

    if (this.mode === 'reset') {
      this.submitReset();
      return;
    }

    if (!this.fullName.trim() || !this.userName.trim()) {
      this.notify.error('Please enter full name and user name.');
      return;
    }

    if (this.mode === 'create' && !this.validatePassword()) return;

    const profile = {
      fullName: this.fullName.trim(),
      userName: this.userName.trim(),
      email: this.email.trim(),
      department: this.department.trim(),
      role: this.role
    };

    const request$: Observable<unknown> = this.mode === 'edit' && this.selected
      ? this.service.update(this.selected.id, profile)
      : this.service.create({ ...profile, password: this.password });

    const successMessage = this.mode === 'edit' ? 'System user updated' : 'System user created';

    this.save(request$, successMessage, 'Failed to save system user.');
  }

  toggleActive(user: SystemUser): void {
    if (this.busyId !== null) return;

    const action = user.isActive ? 'Deactivate' : 'Activate';
    if (!confirm(`${action} ${user.userName}?`)) return;

    this.busyId = user.id;

    this.service.toggleActive(user.id)
      .pipe(finalize(() => {
        this.busyId = null;
        this.cdr.detectChanges();
      }))
      .subscribe({
        next: updated => {
          this.notify.success(`${updated.userName} ${updated.isActive ? 'activated' : 'deactivated'}`);
          this.loadUsers();
        },
        error: err => this.notify.apiError(err, `Failed to ${action.toLowerCase()} user.`)
      });
  }

  deleteUser(user: SystemUser): void {
    if (this.busyId !== null) return;
    if (!confirm(`Delete ${user.userName}? This cannot be undone.`)) return;

    this.busyId = user.id;

    this.service.delete(user.id)
      .pipe(finalize(() => {
        this.busyId = null;
        this.cdr.detectChanges();
      }))
      .subscribe({
        next: () => {
          this.notify.success(`${user.userName} deleted`);
          if (this.selected?.id === user.id) this.resetForm();
          this.loadUsers();
        },
        error: err => this.notify.apiError(err, 'Failed to delete user.')
      });
  }

  roleClass(role: string): string {
    return (role || '').toLowerCase();
  }

  private submitReset(): void {
    if (!this.selected || !this.validatePassword()) return;

    this.save(
      this.service.resetPassword(this.selected.id, this.password),
      `Password reset for ${this.selected.userName}`,
      'Failed to reset password.'
    );
  }

  private validatePassword(): boolean {
    if (this.password.length < MIN_PASSWORD_LENGTH) {
      this.notify.error(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
      return false;
    }

    if (this.password !== this.confirmPassword) {
      this.notify.error('Passwords do not match.');
      return false;
    }

    return true;
  }

  private save(request$: Observable<unknown>, successMessage: string, fallbackError: string): void {
    this.isSaving = true;

    request$
      .pipe(finalize(() => {
        this.isSaving = false;
        this.cdr.detectChanges();
      }))
      .subscribe({
        next: () => {
          this.notify.success(successMessage);
          this.resetForm();
          this.loadUsers();
        },
        error: err => this.notify.apiError(err, fallbackError)
      });
  }
}
