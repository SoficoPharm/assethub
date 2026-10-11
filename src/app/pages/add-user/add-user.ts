import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { UsersService } from '../../services/users.service';

@Component({
  selector: 'app-add-user',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './add-user.html',
  styleUrls: ['./add-user.scss']
})
export class AddUser implements OnInit {
  fullName = '';
  email = '';
  employeeId = '';
  department = '';
  jobTitle = '';
  userDomain = '';
  role = 'Viewer';
saving = false;
  imageFile: File | null = null;
  imagePreview = '';
  imageName = '';
  imageSize = '';

  departments: string[] = [];
  roles: string[] = [];

  showAddDepartment = false;
  showAddRole = false;

  loading = false;
  showToast = false;
  toastMessage = '';
  toastType: 'success' | 'error' = 'success';

  newDepartment = '';
  newRole = '';

  constructor(
    private readonly router: Router,
    private readonly usersService: UsersService,
    private readonly cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadOptions();
  }

  loadOptions(): void {
    this.departments = ['Engineering', 'Design', 'Finance', 'HR', 'Sales', 'Operations', 'Management'];
    this.roles = ['Admin', 'IT Support', 'Manager', 'Viewer'];
  }

saveUser(): void {
  if (!this.fullName.trim() || !this.email.trim() || !this.role.trim()) {
    this.showAppToast('Please enter full name, email, and system role.', 'error');
    return;
  }

  this.saving = true;

  this.usersService.createUser({
    fullName: this.fullName.trim(),
    email: this.email.trim(),
    employeeId: this.employeeId.trim(),
    department: this.department || '',
    jobTitle: this.jobTitle || '',
    role: this.role,
    userDomain: this.userDomain.trim(),
    images: this.imageFile ? 1 : 0,
    imageUrl: '',
    imageFile: this.imageFile
  }).subscribe({
    next: () => {
      setTimeout(() => {
        this.router.navigate(['/users']);
      }, 600); // يخلي loader يبان شوية
    },
    error: err => {
      console.error(err);
      this.saving = false;
      this.showAppToast('Failed to save user.', 'error');
    }
  });
}

  cancel(): void {
    this.router.navigate(['/users']);
  }

  backToList(): void {
    this.router.navigate(['/users']);
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
    this.imageName = '';
    this.imageSize = '';
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