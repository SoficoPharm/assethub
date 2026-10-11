import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { NotificationService } from '../../core/notification.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { EmployeesService } from '../../services/employees.service';
import { DepartmentsService } from '../../services/departments.service';

@Component({
  selector: 'app-add-employee',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './add-employee.html',
  styleUrls: ['./add-employee.scss']
})
export class AddEmployee implements OnInit {
  private readonly notify = inject(NotificationService);
  private readonly departmentsService = inject(DepartmentsService);

  fullName = '';
  email = '';
  employeeId = '';
  department = '';
  jobTitle = '';
  userDomain = '';

  imageFile: File | null = null;
  imagePreview = '';
  imageName = '';
  imageSize = '';

  departments: string[] = [];

  showAddDepartment = false;
  newDepartment = '';
  addingDepartment = false;

  saving = false;

  constructor(
    private readonly router: Router,
    private readonly employeesService: EmployeesService,
    private readonly cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadDepartments();
  }

  loadDepartments(): void {
    this.departmentsService.getDepartments().subscribe({
      next: data => {
        this.departments = (data ?? []).map(d => d.departmentName);
        this.cdr.detectChanges();
      },
      error: err => this.notify.apiError(err, 'Failed to load departments.')
    });
  }

  saveEmployee(): void {
    if (this.saving) return;

    if (!this.fullName.trim() || !this.email.trim()) {
      this.notify.error('Please enter full name and email.');
      return;
    }

    this.saving = true;

    this.employeesService.createEmployee({
      fullName: this.fullName.trim(),
      email: this.email.trim(),
      employeeId: this.employeeId.trim(),
      department: this.department || '',
      jobTitle: this.jobTitle || '',
      userDomain: this.userDomain.trim(),
      images: this.imageFile ? 1 : 0,
      imageUrl: '',
      imageFile: this.imageFile
    }).subscribe({
      next: () => {
        this.notify.success('Employee created successfully');
        this.router.navigate(['/employees']);
      },
      error: err => {
        console.error(err);
        this.saving = false;
        this.notify.apiError(err, 'Failed to save employee.');
        this.cdr.detectChanges();
      }
    });
  }

  cancel(): void {
    this.router.navigate(['/employees']);
  }

  backToList(): void {
    this.router.navigate(['/employees']);
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
    this.imageName = '';
    this.imageSize = '';
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

  private formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
}
