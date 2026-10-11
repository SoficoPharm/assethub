import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { finalize } from 'rxjs';
import { UsersService } from '../../services/users.service';

@Component({
  selector: 'app-edit-user',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './edit-user.html',
  styleUrls: ['./edit-user.scss']
})
export class EditUser implements OnInit {
  userId = 0;
  originalEmployeeId = '';

  fullName = '';
  email = '';
  employeeId = '';
  userDomain = '';
  department = '';
  jobTitle = '';
  role = 'Viewer';

  imageFile: File | null = null;
  imagePreview = '';
  imageName = '';
  imageSize = '';
  imageUrl = '';

  departments = ['Engineering', 'Design', 'Finance', 'HR', 'Sales', 'Operations', 'Management'];
  roles = ['Admin', 'IT Support', 'Manager', 'Viewer'];

  loading = false;
  saving = false;
  deleting = false;

  showAddDepartment = false;
  showAddRole = false;

  showToast = false;
  toastMessage = '';
  toastType: 'success' | 'error' = 'success';

  newDepartment = '';
  newRole = '';

  constructor(
    private readonly router: Router,
    private readonly route: ActivatedRoute,
    private readonly usersService: UsersService,
    private readonly cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.originalEmployeeId = this.route.snapshot.paramMap.get('id') || '';

    if (!this.originalEmployeeId) {
      this.router.navigate(['/users']);
      return;
    }

    this.loadUser();
  }

  loadUser(): void {
    this.loading = true;

    this.usersService.getUserByEmployeeId(this.originalEmployeeId)
      .pipe(finalize(() => {
        this.loading = false;
        this.cdr.detectChanges();
      }))
      .subscribe({
        next: (user) => {
          this.userId = user.id;
          this.fullName = user.name || '';
          this.email = user.email || '';
          this.employeeId = user.employeeId || '';
          this.userDomain = user.userDomain || '';
          this.department = user.department || '';
          this.jobTitle = user.jobTitle || user.title || '';
          this.role = user.role || 'Viewer';
          this.imageUrl = user.imageUrl || '';
          this.imagePreview = user.imageUrl || '';

          this.ensureCurrentValuesExistInDropdowns();
        },
        error: (err) => {
          console.error(err);
          this.showAppToast(this.getErrorMessage(err, 'Failed to load user.'), 'error');
        }
      });
  }

  saveChanges(): void {
    if (!this.fullName.trim() || !this.email.trim() || !this.role.trim()) {
      this.showAppToast('Please enter full name, email, and system role.', 'error');
      return;
    }

    this.saving = true;

    this.usersService.updateUser(this.userId, {
      fullName: this.fullName.trim(),
      email: this.email.trim(),
      employeeId: this.employeeId.trim(),
      userDomain: this.userDomain.trim(),
      department: this.department || '',
      jobTitle: this.jobTitle || '',
      role: this.role,
      images: this.imagePreview ? 1 : 0,
      imageUrl: this.imageFile ? '' : this.imageUrl,
      imageFile: this.imageFile
    })
      .pipe(finalize(() => {
        this.saving = false;
        this.cdr.detectChanges();
      }))
      .subscribe({
        next: () => {
          this.showAppToast('User updated successfully', 'success');
          setTimeout(() => this.router.navigate(['/users']), 600);
        },
        error: (err) => {
          console.error(err);
          this.showAppToast(this.getErrorMessage(err, 'Failed to update user.'), 'error');
        }
      });
  }

  deleteUser(): void {
    const confirmed = confirm(`Are you sure you want to delete ${this.fullName}?`);
    if (!confirmed) return;

    this.deleting = true;

    this.usersService.deleteUser(this.userId)
      .pipe(finalize(() => {
        this.deleting = false;
        this.cdr.detectChanges();
      }))
      .subscribe({
        next: () => {
          this.showAppToast('User deleted successfully', 'success');
          setTimeout(() => this.router.navigate(['/users']), 600);
        },
        error: (err) => {
          console.error(err);
          this.showAppToast(this.getErrorMessage(err, 'Failed to delete user.'), 'error');
        }
      });
  }

  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;

    if (!file) return;

    if (!file.type.startsWith('image/')) {
      this.showAppToast('Please select a valid image file.', 'error');
      input.value = '';
      return;
    }

    if (this.imagePreview?.startsWith('blob:')) {
      URL.revokeObjectURL(this.imagePreview);
    }

    this.imageFile = file;
    this.imagePreview = URL.createObjectURL(file);
    this.imageName = file.name;
    this.imageSize = this.formatFileSize(file.size);
    this.cdr.detectChanges();
  }

  removeImage(): void {
    if (this.imagePreview?.startsWith('blob:')) {
      URL.revokeObjectURL(this.imagePreview);
    }

    this.imageFile = null;
    this.imagePreview = '';
    this.imageUrl = '';
    this.imageName = '';
    this.imageSize = '';
    this.cdr.detectChanges();
  }

  cancel(): void {
    this.router.navigate(['/users']);
  }

  backToList(): void {
    this.router.navigate(['/users']);
  }

  toggleAddBox(type: 'department' | 'role'): void {
    this.showAddDepartment = false;
    this.showAddRole = false;

    if (type === 'department') this.showAddDepartment = true;
    if (type === 'role') this.showAddRole = true;
  }

  closeAllAddBoxes(): void {
    this.showAddDepartment = false;
    this.showAddRole = false;
  }

  addDepartment(): void {
    const value = this.newDepartment.trim();
    if (!value) return;

    if (!this.departments.includes(value)) {
      this.departments.push(value);
    }

    this.department = value;
    this.newDepartment = '';
    this.showAddDepartment = false;
    this.showAppToast('Department option added', 'success');
  }

  addRole(): void {
    const value = this.newRole.trim();
    if (!value) return;

    if (!this.roles.includes(value)) {
      this.roles.push(value);
    }

    this.role = value;
    this.newRole = '';
    this.showAddRole = false;
    this.showAppToast('Role option added', 'success');
  }

  ensureCurrentValuesExistInDropdowns(): void {
    if (this.department && !this.departments.includes(this.department)) {
      this.departments.push(this.department);
    }

    if (this.role && !this.roles.includes(this.role)) {
      this.roles.push(this.role);
    }
  }

  showAppToast(message: string, type: 'success' | 'error' = 'success'): void {
    this.toastMessage = message;
    this.toastType = type;
    this.showToast = true;

    setTimeout(() => {
      this.showToast = false;
      this.cdr.detectChanges();
    }, 2500);
  }

  private getErrorMessage(err: any, fallback: string): string {
    if (typeof err?.error === 'string') return err.error;
    if (err?.error?.message) return err.error.message;

    if (err?.error?.errors) {
      const errors = err.error.errors;
      return Object.keys(errors)
        .map(key => errors[key].join(', '))
        .join(' | ');
    }

    return fallback;
  }

  private formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
}