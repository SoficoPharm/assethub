import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { NotificationService } from '../../core/notification.service';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { finalize } from 'rxjs';
import { EmployeesService, emailFormatError } from '../../services/employees.service';
import { DepartmentsService } from '../../services/departments.service';

@Component({
  selector: 'app-edit-employee',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './edit-employee.html',
  styleUrls: ['./edit-employee.scss']
})
export class EditEmployee implements OnInit {
  private readonly notify = inject(NotificationService);
  readonly auth = inject(AuthService);
  private readonly departmentsService = inject(DepartmentsService);

  userId = 0;
  originalEmployeeId = '';

  fullName = '';
  email = '';
  emailError = '';
  employeeId = '';
  userDomain = '';
  department = '';
  jobTitle = '';

  imageFile: File | null = null;
  imagePreview = '';
  imageName = '';
  imageSize = '';
  imageUrl = '';

  departments: string[] = [];

  loading = false;
  saving = false;
  deleting = false;

  showAddDepartment = false;
  newDepartment = '';
  addingDepartment = false;

  constructor(
    private readonly router: Router,
    private readonly route: ActivatedRoute,
    private readonly employeesService: EmployeesService,
    private readonly cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.originalEmployeeId = this.route.snapshot.paramMap.get('employeeId') || '';

    if (!this.originalEmployeeId) {
      this.router.navigate(['/employees']);
      return;
    }

    this.loadUser();
    this.loadDepartments();
  }

  loadUser(): void {
    this.loading = true;

    this.employeesService.getEmployeeByEmployeeId(this.originalEmployeeId)
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
          this.imageUrl = user.imageUrl || '';
          this.imagePreview = user.imageUrl || '';

          this.ensureCurrentDepartmentInDropdown();
        },
        error: (err) => {
          console.error(err);
          this.notify.apiError(err, 'Failed to load employee.');
        }
      });
  }

  saveChanges(): void {
    if (!this.fullName.trim()) {
      this.notify.error('Please enter the full name.');
      return;
    }

    this.checkEmail();
    if (this.emailError) {
      this.notify.error(this.emailError);
      return;
    }

    this.saving = true;

    this.employeesService.updateEmployee(this.userId, {
      fullName: this.fullName.trim(),
      email: this.email.trim(),
      employeeId: this.employeeId.trim(),
      userDomain: this.userDomain.trim(),
      department: this.department || '',
      jobTitle: this.jobTitle || '',
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
          this.notify.success('Employee updated successfully');
          setTimeout(() => this.router.navigate(['/employees']), 600);
        },
        error: (err) => {
          console.error(err);
          this.notify.apiError(err, 'Failed to update employee.');
        }
      });
  }

  checkEmail(): void {
    this.emailError = emailFormatError(this.email);
  }

  deleteEmployee(): void {
    const confirmed = confirm(`Are you sure you want to delete ${this.fullName}?`);
    if (!confirmed) return;

    this.deleting = true;

    this.employeesService.deleteEmployee(this.userId)
      .pipe(finalize(() => {
        this.deleting = false;
        this.cdr.detectChanges();
      }))
      .subscribe({
        next: () => {
          this.notify.success('Employee deleted successfully');
          setTimeout(() => this.router.navigate(['/employees']), 600);
        },
        error: (err) => {
          console.error(err);
          this.notify.apiError(err, 'Failed to delete employee.');
        }
      });
  }

  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;

    if (!file) return;

    if (!file.type.startsWith('image/')) {
      this.notify.error('Please select a valid image file.');
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
    this.router.navigate(['/employees']);
  }

  backToList(): void {
    this.router.navigate(['/employees']);
  }

  toggleAddDepartment(): void {
    this.showAddDepartment = !this.showAddDepartment;
  }

  closeAllAddBoxes(): void {
    this.showAddDepartment = false;
  }

  /** Creates the department through the API so it appears on the Departments page too. */
  addDepartment(): void {
    const value = this.newDepartment.trim();
    if (!value || this.addingDepartment) return;

    this.addingDepartment = true;

    this.departmentsService.createDepartment({ departmentName: value, managerName: '', membersCount: 0 })
      .pipe(finalize(() => {
        this.addingDepartment = false;
        this.cdr.detectChanges();
      }))
      .subscribe({
        next: created => {
          this.departments = [...this.departments, created.departmentName].sort();
          this.department = created.departmentName;
          this.newDepartment = '';
          this.showAddDepartment = false;
          this.notify.success('Department added');
        },
        error: err => this.notify.apiError(err, 'Failed to add department.')
      });
  }

  loadDepartments(): void {
    this.departmentsService.getDepartments().subscribe({
      next: data => {
        this.departments = (data ?? []).map(d => d.departmentName);
        this.ensureCurrentDepartmentInDropdown();
        this.cdr.detectChanges();
      },
      error: err => this.notify.apiError(err, 'Failed to load departments.')
    });
  }

  /** Keeps a legacy department value selectable even if it is not in the Departments table. */
  ensureCurrentDepartmentInDropdown(): void {
    if (this.department && !this.departments.includes(this.department)) {
      this.departments = [...this.departments, this.department];
    }
  }

  private formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
}
